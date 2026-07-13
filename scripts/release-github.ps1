# Pack and publish GitHub Release (requires gh auth login)
param(
    [string]$Notes = "",
    [switch]$Draft
)

$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot ".."
Set-Location $root

function Get-GhExe {
    $cmd = Get-Command gh -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $default = "${env:ProgramFiles}\GitHub CLI\gh.exe"
    if (Test-Path $default) { return $default }
    throw "gh not found. Install: winget install GitHub.cli"
}

& (Join-Path $PSScriptRoot "pack-extension.ps1")

$manifest = Get-Content "manifest.json" -Raw | ConvertFrom-Json
$version = $manifest.version
$tag = "v$version"
$zipName = "clearview-magnifier-v$version.zip"
$zipPath = Join-Path $root "dist\$zipName"

if (-not (Test-Path $zipPath)) {
    throw "ZIP not found: $zipPath"
}

$gh = Get-GhExe
& $gh auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[!] gh not logged in. Use web upload instead:" -ForegroundColor Yellow
    Write-Host "    ZIP: $zipPath"
    Write-Host "    URL: https://github.com/clearview-tools/clearview-magnifier/releases/new"
    Write-Host "    Tag: $tag"
    Write-Host ""
    Write-Host "    Or: gh auth login  (needs network to github.com)" -ForegroundColor Yellow
    exit 1
}

if (-not $Notes) {
    $nl = [Environment]::NewLine
    $Notes = "## ClearView Magnifier $tag${nl}${nl}- Download $zipName and load unpacked in chrome://extensions/${nl}- Free: magnifier and reading aids${nl}- Pro: activate License in extension popup"
}

$ghArgs = @(
    "release", "create", $tag,
    $zipPath,
    "--title", "ClearView Magnifier $tag",
    "--notes", $Notes
)
if ($Draft) {
    $ghArgs += "--draft"
}

& $gh @ghArgs

$releaseUrl = "https://github.com/clearview-tools/clearview-magnifier/releases/tag/$tag"
Write-Host ""
Write-Host "Release: $releaseUrl" -ForegroundColor Green
