@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto nonode
node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 24 ? 0 : 1)" >nul 2>nul
if errorlevel 1 goto nonode
if "%~1"=="--install-startup" (
  node scripts\startup-20261102.js
) else (
  node src\launch-20261102.js
)
if errorlevel 1 pause
exit /b
:nonode
echo Please install Node.js 24 or later from https://nodejs.org/en/download
echo Then run this launcher again. No npm install is needed.
pause
exit /b 1
