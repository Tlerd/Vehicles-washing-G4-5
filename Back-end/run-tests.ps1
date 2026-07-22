param(
    [string]$Tests,
    [switch]$Clean
)

$ErrorActionPreference = 'Stop'
$backendDirectory = $PSScriptRoot
$repositoryRoot = Split-Path -Parent $backendDirectory
$environmentFile = Join-Path $backendDirectory '.env'

if (Test-Path -LiteralPath $environmentFile) {
    foreach ($line in Get-Content -LiteralPath $environmentFile) {
        if ($line -match '^\s*([^#][^=]*)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($value) {
                [Environment]::SetEnvironmentVariable($name, $value, 'Process')
            }
        }
    }
}

if ([string]::IsNullOrWhiteSpace($env:DB_PASSWORD)) {
    throw 'DB_PASSWORD is required to run the SQL Server-backed backend tests.'
}

if ([string]::IsNullOrWhiteSpace($env:JWT_SECRET)) {
    $secretBytes = New-Object byte[] 64
    [Security.Cryptography.RandomNumberGenerator]::Fill($secretBytes)
    $env:JWT_SECRET = [Convert]::ToBase64String($secretBytes)
}

$mavenArguments = @('-f', (Join-Path $backendDirectory 'pom.xml'))
if ($Clean) {
    $mavenArguments += 'clean'
}
if (-not [string]::IsNullOrWhiteSpace($Tests)) {
    $mavenArguments += "-Dtest=$Tests"
}
$mavenArguments += 'test'

Push-Location $repositoryRoot
try {
    & mvn @mavenArguments
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
