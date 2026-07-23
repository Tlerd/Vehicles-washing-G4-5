[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$catalogRoot = Join-Path $repoRoot 'ai\catalog\agents'
$agentRoot = Join-Path $repoRoot '.agents\agents'
$canonicalRule = Join-Path $repoRoot '.claude\rules\project\source-priority.md'
$adapterRule = Join-Path $repoRoot '.agents\rules\project\source-priority.md'
$manifestPath = Join-Path $repoRoot 'ai\manifest.json'

function Get-Hash([string] $Path) {
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
}

function Get-AgentBody([string] $Path) {
    $content = [IO.File]::ReadAllText($Path)
    $match = [regex]::Match($content, '(?s)^---\r?\n.*?\r?\n---\r?\n(.*)$')
    if (-not $match.Success) {
        throw "Missing Antigravity YAML frontmatter: $Path"
    }
    return $match.Groups[1].Value
}

if (-not (Test-Path -LiteralPath $catalogRoot -PathType Container)) {
    throw "Missing canonical agent catalog: $catalogRoot"
}
if (-not (Test-Path -LiteralPath $agentRoot -PathType Container)) {
    throw "Missing Antigravity agent adapter directory: $agentRoot"
}
if (-not (Test-Path -LiteralPath $canonicalRule -PathType Leaf)) {
    throw "Missing canonical project rule: $canonicalRule"
}
if (-not (Test-Path -LiteralPath $adapterRule -PathType Leaf)) {
    throw "Missing Antigravity project rule adapter: $adapterRule"
}
if (Test-Path -LiteralPath (Join-Path $repoRoot '.agent')) {
    throw 'Legacy .agent directory exists; use .agents instead.'
}

$missing = [System.Collections.Generic.List[string]]::new()
$drifted = [System.Collections.Generic.List[string]]::new()
$catalogFiles = @(Get-ChildItem -LiteralPath $catalogRoot -File -Filter '*.md')

foreach ($source in $catalogFiles) {
    $name = [IO.Path]::GetFileNameWithoutExtension($source.Name)
    $adapter = Join-Path (Join-Path $agentRoot $name) 'agent.md'
    if (-not (Test-Path -LiteralPath $adapter -PathType Leaf)) {
        $missing.Add($adapter)
        continue
    }
    $sourceBody = ([IO.File]::ReadAllText($source.FullName) -replace "`r`n", "`n")
    $adapterBody = (Get-AgentBody $adapter -replace "`r`n", "`n")
    if ($sourceBody -ne $adapterBody) {
        $drifted.Add($adapter)
    }
}

if ((Get-Hash $canonicalRule) -ne (Get-Hash $adapterRule)) {
    $drifted.Add($adapterRule)
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$manifestSkillOutputs = @($manifest.skills | ForEach-Object { $_.codexOutput })
foreach ($relativePath in $manifestSkillOutputs) {
    $skillPath = Join-Path $repoRoot $relativePath
    if (-not (Test-Path -LiteralPath (Join-Path $skillPath 'SKILL.md') -PathType Leaf)) {
        $missing.Add((Join-Path $skillPath 'SKILL.md'))
    }
}

if ($missing.Count -gt 0 -or $drifted.Count -gt 0) {
    if ($missing.Count -gt 0) {
        Write-Error ('Missing adapters or outputs:`n' + ($missing -join "`n"))
    }
    if ($drifted.Count -gt 0) {
        Write-Error ('Drifted adapters:`n' + ($drifted -join "`n"))
    }
    exit 1
}

$skillCount = @(Get-ChildItem -LiteralPath (Join-Path $repoRoot '.agents\skills') -Directory | Where-Object {
    Test-Path -LiteralPath (Join-Path $_.FullName 'SKILL.md')
}).Count

Write-Output "Antigravity sync OK: catalog_agents=$($catalogFiles.Count), agent_adapters=$($catalogFiles.Count), manifest_skill_outputs=$($manifestSkillOutputs.Count), workspace_skills=$skillCount"
