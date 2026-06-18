@echo off
setlocal
cd /d "%~dp0"
title Command Center Mobile Host

echo ============================================================
echo   Command Center - Mobile / Phone Access Mode
echo ============================================================
echo.
echo   This starts the server bound to ALL network interfaces,
echo   so your iPhone can connect over Wi-Fi or Tailscale.
echo.
echo   After the server starts, find your local IP below.
echo   On your iPhone (Safari): http://YOUR_IP:3000
echo   Then: Share ^> Add to Home Screen
echo.
echo ============================================================
echo.

rem Show local IP addresses so the user knows where to connect
echo Your network IP addresses:
ipconfig | findstr /i "IPv4"
echo.
echo (Use the IP under your Wi-Fi adapter on your iPhone)
echo (If using Tailscale, use your 100.x.x.x address instead)
echo.
echo ============================================================
echo Starting server... (press Ctrl+C to stop)
echo ============================================================
echo.

npm run dev:host

endlocal
