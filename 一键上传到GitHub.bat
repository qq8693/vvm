@echo off
chcp 936 >nul 2>&1
setlocal
cd /d "%~dp0"

echo ============================================================
echo   一键上传到 GitHub
echo   仓库：https://github.com/qq8693/vvm
echo ============================================================
echo.

rem ---------- 找 git：先查 PATH，找不到就用已知安装位置 ----------
set "GIT=git"
where git >nul 2>&1
if not errorlevel 1 goto havegit

set "GIT="
if exist "%ProgramFiles%\WorkBuddy\resources\vendor\PortableGit\cmd\git.exe" set "GIT=%ProgramFiles%\WorkBuddy\resources\vendor\PortableGit\cmd\git.exe"
if not defined GIT if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" set "GIT=%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
if not defined GIT if exist "%ProgramFiles%\Git\cmd\git.exe" set "GIT=%ProgramFiles%\Git\cmd\git.exe"
if not defined GIT goto nogit

for %%i in ("%GIT%") do set "GITDIR=%%~dpi"
set "PATH=%GITDIR%%PATH%"
echo   提示：PATH 里没有 git，已改用 %GIT%
echo.

:havegit

"%GIT%" add -A
if errorlevel 1 goto fail

echo [1/3] 已暂存改动，正在提交...
"%GIT%" commit -m "Update products"
if errorlevel 1 (
  echo.
  echo   没有新的改动需要提交，直接尝试推送...
)

echo.
echo [2/3] 正在推送到 GitHub...
set "TRY=0"

:push
set /a TRY+=1
"%GIT%" push origin main
if not errorlevel 1 goto pushed
if %TRY% geq 3 goto fail
echo.
echo   推送失败（第 %TRY% 次），5 秒后自动重试...
ping -n 6 127.0.0.1 >nul
goto push

:pushed
echo.
echo [3/3] 完成！
echo.
echo   仓库地址：https://github.com/qq8693/vvm
echo   网站地址：https://qq8693.github.io/vvm/
echo   （网站生效一般要等 1-3 分钟）
echo.
goto end

:nogit
echo.
echo   !! 这台电脑上没有找到 git。
echo   请先安装 Git for Windows：https://git-scm.com/download/win
echo   安装时保持默认选项（会写入 PATH），装完重新双击本脚本即可。
echo.
goto end

:fail
echo.
echo   !! 出错了，请看上面的提示。
echo   常见原因：
echo     - 网络不通或代理不稳（直接再双击运行一次通常就好了）
echo     - 还没登录 GitHub
echo     - 远程有新提交，需要先执行 git pull
echo.

:end
echo.
pause
