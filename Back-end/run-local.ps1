# Local dev runner: loads Back-end/.env, generates a JWT_SECRET on first run
# if missing, verifies DB_PASSWORD is present, then starts the backend.
# Usage: pwsh -File Back-end/run-local.ps1   (or run from inside Back-end/)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $root '.env'
$exampleFile = Join-Path $root '.env.example'

if (-not (Test-Path $envFile)) {
    Copy-Item $exampleFile $envFile
    Write-Host "Created Back-end/.env from .env.example — fill in DB_PASSWORD." -ForegroundColor Yellow
}

$lines = Get-Content $envFile
$values = @{}
foreach ($line in $lines) {
    if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
    $parts = $line -split '=', 2
    $values[$parts[0].Trim()] = $parts[1].Trim()
}

if ([string]::IsNullOrWhiteSpace($values['JWT_SECRET'])) {
    $bytes = New-Object byte[] 48
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    $secret = [Convert]::ToBase64String($bytes)
    $values['JWT_SECRET'] = $secret
    $newLines = $lines | ForEach-Object {
        if ($_ -match '^\s*JWT_SECRET\s*=') { "JWT_SECRET=$secret" } else { $_ }
    }
    Set-Content -Path $envFile -Value $newLines
    Write-Host "Generated a new JWT_SECRET and saved it to Back-end/.env." -ForegroundColor Green
}

if ([string]::IsNullOrWhiteSpace($values['DB_PASSWORD'])) {
    Write-Host "DB_PASSWORD is not set in Back-end/.env — edit the file and re-run." -ForegroundColor Red
    exit 1
}

foreach ($key in $values.Keys) {
    if (-not [string]::IsNullOrWhiteSpace($values[$key])) {
        [System.Environment]::SetEnvironmentVariable($key, $values[$key], 'Process')
    }
}

Push-Location $root
try {
    mvn spring-boot:run
} finally {
    Pop-Location
}
