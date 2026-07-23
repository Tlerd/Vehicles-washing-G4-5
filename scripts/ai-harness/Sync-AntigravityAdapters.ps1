[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$catalogRoot = Join-Path $repoRoot 'ai\catalog\agents'
$agentRoot = Join-Path $repoRoot '.agents\agents'
$canonicalRule = Join-Path $repoRoot '.claude\rules\project\source-priority.md'
$adapterRule = Join-Path $repoRoot '.agents\rules\project\source-priority.md'

if (-not (Test-Path -LiteralPath $catalogRoot -PathType Container)) {
    throw "Missing canonical agent catalog: $catalogRoot"
}

New-Item -ItemType Directory -Path $agentRoot -Force | Out-Null
New-Item -ItemType Directory -Path (Split-Path -Parent $adapterRule) -Force | Out-Null

$utf8NoBom = New-Object Text.UTF8Encoding($false)
$count = 0
foreach ($source in Get-ChildItem -LiteralPath $catalogRoot -File -Filter '*.md') {
    $name = [IO.Path]::GetFileNameWithoutExtension($source.Name)
    $targetDir = Join-Path $agentRoot $name
    $target = Join-Path $targetDir 'agent.md'
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    $frontmatter = "---`r`nname: $name`r`ndescription: Project role adapter for $name.`r`n---`r`n"
    [IO.File]::WriteAllText($target, $frontmatter + [IO.File]::ReadAllText($source.FullName), $utf8NoBom)
    $count++
}

Copy-Item -LiteralPath $canonicalRule -Destination $adapterRule -Force
Write-Output "Antigravity adapters synchronized: agents=$count, rules=1"
