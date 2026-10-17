@echo off
chcp 936 >nul 2>&1
setlocal
cd /d "%~dp0"

echo ============================================================
echo   一键上传到 GitHub
echo   仓库：https://github.com/qq8693/vvm
echo ============================================================
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo   !! 没有找到 git 命令，请先安装 Git for Windows 后再试。
  goto end
)

git add -A
if errorlevel 1 goto fail

echo [1/3] 已暂存改动，正在提交...
git commit -m "Update products"
if errorlevel 1 (
  echo.
  echo   没有新的改动需要提交，直接尝试推送...
)

echo.
echo [2/3] 正在推送到 GitHub...
git push origin main
if errorlevel 1 goto fail

echo.
echo [3/3] 完成！
echo.
echo   仓库地址：https://github.com/qq8693/vvm
echo   网站地址：https://qq8693.github.io/vvm/
echo   （网站生效一般要等 1-3 分钟）
echo.
goto end

:fail
echo.
echo   !! 出错了，请看上面的提示。
echo   常见原因：网络不通 / 还没登录 GitHub / 远程有新提交要先 pull。
echo.

:end
echo.
pause
