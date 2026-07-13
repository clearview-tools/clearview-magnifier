# Fail if forbidden test-license strings appear in release artifacts or core extension files
$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot ".."
Set-Location $root

$forbidden = @('CVPRO-DEV', 'DEV-0001-TEST')
$scanPaths = @(
  "background",
  "content",
  "popup",
  "docs\licenses.json",
  "docs\licenses.example.json"
)

$hits = @()
foreach ($rel in $scanPaths) {
  $path = Join-Path $root $rel
  if (-not (Test-Path $path)) { continue }
  if (Test-Path $path -PathType Leaf) {
    $files = @(Get-Item $path)
  } else {
    $files = Get-ChildItem -Path $path -Recurse -File
  }
  foreach ($file in $files) {
    $text = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $text) { continue }
    foreach ($pattern in $forbidden) {
      if ($text.Contains($pattern)) {
        $hits += "$($file.FullName) -> $pattern"
      }
    }
  }
}

if ($hits.Count -gt 0) {
  Write-Host "发现禁止的测试密钥相关内容:" -ForegroundColor Red
  $hits | ForEach-Object { Write-Host "  $_" }
  exit 1
}

Write-Host "OK: 扩展与 licenses 文件中无测试密钥" -ForegroundColor Green

$underscoreDirs = Get-ChildItem -Path $root -Directory -Force -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match '^_' }
if ($underscoreDirs) {
  Write-Host ""
  Write-Host "[!] 项目根目录存在以 _ 开头的文件夹，Chrome 无法从根目录加载扩展:" -ForegroundColor Yellow
  $underscoreDirs | ForEach-Object { Write-Host "    $($_.FullName)" }
  Write-Host "    请删除这些文件夹，或加载 dist\clearview-magnifier" -ForegroundColor Yellow
}
