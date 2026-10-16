@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo   一键上传到 GitHub
echo   仓库：https://github.com/qq8693/vvm
echo ============================================================
echo.

git add -A
if errorlevel 1 goto fail

echo [1/3] 已暂存改动，正在提交...
git commit -m "更新商品 %date% %time:~0,8%"
if errorlevel 1 (
  echo.
  echo   没有新的改动需要提交（或者提交被跳过），继续尝试推送...
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
echo   （网站地址首次部署后可能要等 1-3 分钟才生效）
echo.
goto end

:fail
echo.
echo   !! 出错了，请看上面的提示。
echo   常见原因：网络不通 / 没登录 GitHub / 有冲突需要先 pull。
echo.

:end
pause
