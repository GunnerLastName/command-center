@echo off
setlocal
cd /d "%~dp0"
title Command Center Launcher

rem If the server is already running, skip straight to opening the app.
netstat -ano | findstr /C:":3000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 goto open

rem Start the server minimized in its own window (leave it running).
start "Command Center Server" /min cmd /k "npm run dev"
echo Starting Command Center...

set tries=0
:wait
set /a tries+=1
if %tries% GTR 60 (
  echo Server did not start within 60 seconds. Check the minimized "Command Center Server" window.
  pause
  goto end
)
timeout /t 1 /nobreak >nul
netstat -ano | findstr /C:":3000 " | findstr "LISTENING" >nul 2>&1
if not %errorlevel%==0 goto wait

:open
rem Prefer a chromeless app window (feels like a real desktop app).
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000
  goto end
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000
  goto end
)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000
  goto end
)
rem Fallback: default browser.
start "" http://localhost:3000

:end
endlocal
