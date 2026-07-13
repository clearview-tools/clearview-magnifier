# 打包 Chrome 扩展（仅运行所需文件，用于 GitHub Releases / 手动分发）
$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot ".."
Set-Location $root

$manifest = Get-Content "manifest.json" -Raw | ConvertFrom-Json
$version = $manifest.version
$outDir = Join-Path $root "dist"
$stageDir = Join-Path $outDir "clearview-magnifier"
$zipPath = Join-Path $outDir "clearview-magnifier-v$version.zip"

if (Test-Path $outDir) { Remove-Item $outDir -Recurse -Force }
New-Item -ItemType Directory -Path $stageDir -Force | Out-Null

$items = @("manifest.json", "background", "content", "popup", "icons")
foreach ($item in $items) {
    Copy-Item -Path (Join-Path $root $item) -Destination $stageDir -Recurse -Force
}

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path $stageDir -DestinationPath $zipPath -Force

Write-Host "已打包: $zipPath" -ForegroundColor Green
Write-Host "版本:   v$version"
