param(
    [Parameter(Mandatory = $true)]
    [string]$Migration,
    [string[]]$Databases = @('autowash_pro', 'autowash_pro_test')
)

$ErrorActionPreference = 'Stop'
$backendDirectory = $PSScriptRoot
$environmentFile = Join-Path $backendDirectory '.env'
$migrationPath = if ([IO.Path]::IsPathRooted($Migration)) {
    $Migration
} else {
    Join-Path $backendDirectory $Migration
}

if (-not (Test-Path -LiteralPath $migrationPath)) {
    throw "Migration file not found: $migrationPath"
}

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
    throw 'DB_PASSWORD is required to run SQL Server migrations.'
}

$databaseUser = if ([string]::IsNullOrWhiteSpace($env:DB_USERNAME)) { 'sa' } else { $env:DB_USERNAME }
$databaseServer = if ([string]::IsNullOrWhiteSpace($env:DB_SERVER)) { 'localhost,1433' } else { $env:DB_SERVER }
$env:SQLCMDPASSWORD = $env:DB_PASSWORD

foreach ($database in $Databases) {
    if ($database -notmatch '^[A-Za-z0-9_]+$') {
        throw "Unsafe database name: $database"
    }
    & sqlcmd -S $databaseServer -U $databaseUser -d $database -b -i $migrationPath
    if ($LASTEXITCODE -ne 0) {
        throw "Migration failed for database: $database"
    }
    Write-Output "Migration completed for $database."
}
