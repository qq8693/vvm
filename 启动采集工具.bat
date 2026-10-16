@echo off
chcp 65001 >nul
title Product Scraper
cd /d "%~dp0"

set "PY="

rem --- 1) WorkBuddy managed python (known good) ---
if exist "%USERPROFILE%\.workbuddy\binaries\python\versions\3.13.12\python.exe" set "PY=%USERPROFILE%\.workbuddy\binaries\python\versions\3.13.12\python.exe"

rem --- 2) system python ---
if not defined PY (
  where python.exe >nul 2>nul && set "PY=python.exe"
)
if not defined PY (
  where py.exe >nul 2>nul && set "PY=py.exe"
)

if not defined PY goto nopython

"%PY%" -c "import sys" >nul 2>nul
if errorlevel 1 goto nopython

echo Starting the scraper tool, please wait...
echo.
"%PY%" "%~dp0scrape_tool.py"

echo.
echo The tool has stopped.
pause
exit /b 0

:nopython
echo.
echo   [!] Python 3 was not found on this computer.
echo.
echo   Please install it from: https://www.python.org/downloads/
echo   During setup, tick "Add python.exe to PATH".
echo.
pause
exit /b 1
