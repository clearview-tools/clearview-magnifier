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
# 直接压缩 stage 目录内的文件，避免解压后多一层文件夹导致 Chrome 找不到 manifest.json
Compress-Archive -Path (Join-Path $stageDir '*') -DestinationPath $zipPath -Force

$forbidden = @('CVPRO-DEV', 'DEV-0001-TEST', '测试密钥')
$zipEntries = (Get-Content $zipPath -Encoding Byte -ReadCount 0)
$zipText = [System.Text.Encoding]::UTF8.GetString($zipEntries)
foreach ($pattern in $forbidden) {
  if ($zipText -match [regex]::Escape($pattern)) {
    throw "打包失败：ZIP 中含禁止内容 ($pattern)"
  }
}

Write-Host "已打包: $zipPath" -ForegroundColor Green
Write-Host "版本:   v$version"
