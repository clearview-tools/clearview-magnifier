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
