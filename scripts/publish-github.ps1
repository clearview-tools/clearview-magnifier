# ClearView Magnifier — 发布到 GitHub（需先执行 gh auth login）
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot ..

$repo = "clearview-magnifier"

Write-Host "检查 GitHub 登录状态..." -ForegroundColor Cyan
gh auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host "请先运行: gh auth login" -ForegroundColor Yellow
    exit 1
}

$owner = (gh api user --jq .login)
Write-Host "GitHub 用户: $owner" -ForegroundColor Green

# 若远程已存在则跳过创建
$remotes = git remote
if ($remotes -notcontains "origin") {
    Write-Host "创建仓库 $owner/$repo ..." -ForegroundColor Cyan
    gh repo create $repo --public --source=. --remote=origin --push --description "Chrome extension: screen magnifier with reading aids and translation"
} else {
    Write-Host "推送到 origin/main ..." -ForegroundColor Cyan
    git push -u origin main
}

Write-Host "启用 GitHub Pages (docs/) ..." -ForegroundColor Cyan
gh api -X POST "/repos/$owner/$repo/pages" -f "build_type=legacy" -f "source[branch]=main" -f "source[path]=/docs" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Pages 可能已开启，或在网页手动设置: Settings -> Pages -> main /docs" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "完成！" -ForegroundColor Green
Write-Host "仓库:     https://github.com/$owner/$repo"
Write-Host "Issues:   https://github.com/$owner/$repo/issues"
Write-Host "隐私政策: https://$owner.github.io/$repo/privacy.html"
Write-Host ""
Write-Host "若 GitHub 用户名不是 caixinyu，请修改 docs/privacy.html 中的 Issues 链接后重新 commit & push。"
