#Requires -Version 7.0
[CmdletBinding()]
param(
    [string] $ProjectRoot = (Join-Path $PSScriptRoot '..\..')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-RepositoryChildPath {
    param(
        [Parameter(Mandatory)][string] $Root,
        [Parameter(Mandatory)][string] $RelativePath
    )

    if ([string]::IsNullOrWhiteSpace($RelativePath) -or
        [IO.Path]::IsPathRooted($RelativePath) -or
        $RelativePath.Contains(':') -or
        $RelativePath -match '(^|[\\/])\.\.?(?:[\\/]|$)') {
        throw "Unsafe repository-relative path: $RelativePath"
    }

    $RootFull = [IO.Path]::GetFullPath($Root).TrimEnd(
        [IO.Path]::DirectorySeparatorChar,
        [IO.Path]::AltDirectorySeparatorChar
    )
    $Candidate = [IO.Path]::GetFullPath(
        [IO.Path]::Combine($RootFull, $RelativePath)
    )
    $Prefix = $RootFull + [IO.Path]::DirectorySeparatorChar
    if (-not $Candidate.StartsWith($Prefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Path escapes repository root: $RelativePath"
    }

    return $Candidate
}

function Get-TreeRecords {
    param([Parameter(Mandatory)][string] $Root)

    if (-not (Test-Path -LiteralPath $Root -PathType Container)) {
        throw "Directory is missing: $Root"
    }

    $RootFull = [IO.Path]::GetFullPath($Root)
    $Records = foreach ($File in Get-ChildItem -LiteralPath $RootFull -Recurse -Force -File) {
        $Relative = [IO.Path]::GetRelativePath($RootFull, $File.FullName).Replace('\', '/')
        [pscustomobject]@{
            Path = $Relative
            Length = [long] $File.Length
            Sha256 = (Get-FileHash -LiteralPath $File.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        }
    }

    return @($Records | Sort-Object Path -CaseSensitive)
}

$Root = (Resolve-Path -LiteralPath $ProjectRoot).Path
$Before = (& git -C $Root status --porcelain=v1 --untracked-files=all) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'git status failed before verification.' }

$ManifestPath = Resolve-RepositoryChildPath -Root $Root -RelativePath 'ai/manifest.json'
$LedgerPath = Resolve-RepositoryChildPath -Root $Root -RelativePath 'ai/state/managed-files.json'
$Manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json -ErrorAction Stop
$Ledger = Get-Content -LiteralPath $LedgerPath -Raw | ConvertFrom-Json -ErrorAction Stop

if ($Manifest.schemaVersion -ne 1 -or $Ledger.schemaVersion -ne 1) {
    throw 'Unsupported harness schema version.'
}

$Protected = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($Path in $Manifest.protectedPaths) { [void] $Protected.Add($Path) }

foreach ($Entry in $Ledger.entries) {
    if ($Protected.Contains($Entry.destination)) {
        throw "Protected file is incorrectly managed: $($Entry.destination)"
    }

    $FullPath = Resolve-RepositoryChildPath -Root $Root -RelativePath $Entry.destination
    if (-not (Test-Path -LiteralPath $FullPath -PathType Leaf)) {
        throw "Managed file is missing: $($Entry.destination)"
    }

    $Hash = (Get-FileHash -LiteralPath $FullPath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($Hash -ne $Entry.sha256) {
        throw "Managed file hash mismatch: $($Entry.destination)"
    }
}

foreach ($Agent in $Manifest.agents) {
    foreach ($Output in $Agent.outputs) {
        $FullPath = Resolve-RepositoryChildPath -Root $Root -RelativePath $Output
        if (-not (Test-Path -LiteralPath $FullPath -PathType Leaf)) {
            throw "Agent output is missing: $Output"
        }
    }
}

foreach ($Agent in $Manifest.agents) {
    $AgentName = $Agent.id
    $SourcePath = Resolve-RepositoryChildPath -Root $Root -RelativePath $Agent.source
    if (-not (Test-Path -LiteralPath $SourcePath -PathType Leaf) -or
        [string]::IsNullOrWhiteSpace((Get-Content -LiteralPath $SourcePath -Raw))) {
        throw "Agent source is missing or empty: $($Agent.source)"
    }
    $TomlPath = Resolve-RepositoryChildPath -Root $Root -RelativePath ".codex/agents/$AgentName.toml"
    $Toml = Get-Content -LiteralPath $TomlPath -Raw
    foreach ($Field in @('name', 'description', 'developer_instructions')) {
        if ($Toml -notmatch "(?m)^$([regex]::Escape($Field))\s*=") {
            throw "Codex agent field is missing: $AgentName/$Field"
        }
    }
    $ExpectedTomlName = '(?m)^name\s*=\s*"' + [regex]::Escape($AgentName) + '"\s*$'
    if ($Toml -notmatch $ExpectedTomlName) {
        throw "Codex agent name does not match manifest ID: $AgentName"
    }

    $ClaudePath = Resolve-RepositoryChildPath -Root $Root -RelativePath ".claude/agents/$AgentName.md"
    $Claude = Get-Content -LiteralPath $ClaudePath -Raw
    if ($Claude -notmatch '(?s)^---\r?\n.+?\r?\n---\r?\n.+') {
        throw "Claude frontmatter/body is invalid: $AgentName"
    }
    $ExpectedClaudeName = '(?m)^name:\s*' + [regex]::Escape($AgentName) + '\s*$'
    if ($Claude -notmatch $ExpectedClaudeName) {
        throw "Claude agent name does not match manifest ID: $AgentName"
    }
}

foreach ($Skill in $Manifest.skills) {
    $VendorPath = Resolve-RepositoryChildPath -Root $Root -RelativePath $Skill.source
    $CodexPath = Resolve-RepositoryChildPath -Root $Root -RelativePath $Skill.codexOutput
    $Expected = Get-TreeRecords -Root $VendorPath | ConvertTo-Json -Depth 3 -Compress
    $Actual = Get-TreeRecords -Root $CodexPath | ConvertTo-Json -Depth 3 -Compress
    if ($Expected -ne $Actual) {
        throw "Skill parity failed: $($Skill.id)"
    }
}

$After = (& git -C $Root status --porcelain=v1 --untracked-files=all) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'git status failed after verification.' }
if ($Before -ne $After) { throw 'Verifier changed the working tree.' }

Write-Output 'STRUCTURAL: PASS'
Write-Output 'Runtime discovery, builds, tests, security review, and human approval remain separate.'
