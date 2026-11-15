@echo off
setlocal
cd /d "%~dp0"
set "PRESENCE_NODE=node"
where node >nul 2>nul
if errorlevel 1 (
  set "PRESENCE_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
)
"%PRESENCE_NODE%" -e "process.exit(Number(process.versions.node.split('.')[0]) >= 24 ? 0 : 1)" >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 24 or later from https://nodejs.org/en/download
  echo Then run this launcher again. No npm install is needed.
  pause
  exit /b 1
)
if "%~1"=="--install-startup" (
  "%PRESENCE_NODE%" scripts\startup-20261102.js
) else (
  "%PRESENCE_NODE%" src\launch-20261102.js
)
if errorlevel 1 pause
