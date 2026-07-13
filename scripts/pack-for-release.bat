@echo off
chcp 65001 >nul
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\pack-extension.ps1"
echo.
echo === 网页发布 Release（无需 gh 登录）===
for /f "delims=" %%v in ('powershell -NoProfile -Command "(Get-Content manifest.json -Raw | ConvertFrom-Json).version"') do set VER=%%v
echo.
echo 1. 打开: https://github.com/clearview-tools/clearview-magnifier/releases/new
echo 2. Choose a tag: 新建 v%VER%
echo 3. 上传文件: dist\clearview-magnifier-v%VER%.zip
echo 4. Title: ClearView Magnifier v%VER%
echo 5. 点 Publish release
echo.
pause
