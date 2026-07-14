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

& (Join-Path $PSScriptRoot "verify-no-test-key.ps1")
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
    $Notes = @"
## ClearView Magnifier $tag

---

### 中文

**安装**
1. 下载 **``$zipName``**（不要下载 Source code）
2. 解压后选中**直接包含 ``manifest.json`` 的文件夹**
3. 打开 ``chrome://extensions/`` → 开启**开发者模式** → **加载已解压的扩展程序**
4. 在任意 ``https://`` 网页按 **F5** 刷新，**Alt + 右键** 启动放大镜

**免费版 vs Pro**
- 免费版：放大镜、阅读线、十字准星、反色、颜色拾取、链接预览
- Pro：实时翻译、优先 API、每日 500 次额度、设置 Chrome 云同步

购买 Pro：[爱发电 · clearview-magnifier](https://afdian.com/a/clearview-magnifier)  
问题反馈：[GitHub Issues](https://github.com/clearview-tools/clearview-magnifier/issues)

---

### English

**Install**
1. Download **``$zipName``** (not "Source code")
2. Select the folder that **directly contains ``manifest.json``** after unzip
3. Open ``chrome://extensions/`` → enable **Developer mode** → **Load unpacked**
4. On any ``https://`` page, press **F5**, then **Alt + Right-click** to start the magnifier

**Free vs Pro**
- Free: magnifier, reading line, crosshair, invert/contrast, color picker, link preview
- Pro: live translation, priority APIs, 500 translations/day, Chrome settings sync

Buy Pro: [Afdian · clearview-magnifier](https://afdian.com/a/clearview-magnifier)  
Feedback: [GitHub Issues](https://github.com/clearview-tools/clearview-magnifier/issues)
"@
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
