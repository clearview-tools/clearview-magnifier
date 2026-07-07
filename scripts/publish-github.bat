@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo === ClearView Magnifier 发布到 GitHub ===
echo.

if not exist .git (
  git init
  git branch -M main
)

git add .gitignore README.md manifest.json background content popup icons docs
git status

echo.
echo 若文件无误，请执行：
echo   git commit -m "Initial release: ClearView Magnifier v1.0.4"
echo.
echo 然后在 GitHub 新建仓库 clearview-magnifier（不要勾选 README），再执行：
echo   git remote add origin https://github.com/你的用户名/clearview-magnifier.git
echo   git push -u origin main
echo.
echo 推送后开启 GitHub Pages：
echo   Settings - Pages - Source: main 分支 /docs 文件夹
echo.
echo 隐私政策 URL：
echo   https://你的用户名.github.io/clearview-magnifier/privacy.html
echo   Issues: https://github.com/你的用户名/clearview-magnifier/issues
pause
