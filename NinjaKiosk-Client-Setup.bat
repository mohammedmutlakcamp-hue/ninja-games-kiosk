@echo off
title NinjaKiosk Client Setup
color 0A
setlocal enabledelayedexpansion
echo ============================================
echo   NinjaKiosk CLIENT Setup - Run as Admin
echo   Run this on gaming PCs (not the server)
echo ============================================
echo.

:: Check admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo [ERROR] This script must be run as Administrator!
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo [OK] Running as Administrator
echo.

:: ============================================
:: ASK FOR SERVER IP (or auto-detect)
:: ============================================
echo The kiosk will auto-detect the LAN server.
echo You can also specify the server IP manually.
echo.

set /p SERVER_IP="Server IP (leave blank for auto-detect): "

if "%SERVER_IP%"=="" (
    echo [OK] Will use auto-detect mode
    echo.
) else (
    echo [OK] Server IP: %SERVER_IP%
    echo.

    :: Save to LAN config
    set CONFIG_DIR=%APPDATA%\ninja-games-kiosk
    if not exist "!CONFIG_DIR!" mkdir "!CONFIG_DIR!"
    echo {"serverIp":"%SERVER_IP%"} > "!CONFIG_DIR!\lan-config.json"
    echo [OK] Saved server IP to config
    echo.

    :: Test connection
    echo Testing connection to %SERVER_IP%...
    ping -n 1 -w 2000 %SERVER_IP% >nul 2>&1
    if %errorLevel% equ 0 (
        echo [OK] Server %SERVER_IP% is reachable
    ) else (
        color 0E
        echo [WARN] Cannot reach %SERVER_IP% - check network
    )

    echo Testing port 3000...
    powershell -Command "try { $tcp = New-Object System.Net.Sockets.TcpClient; $tcp.Connect('%SERVER_IP%', 3000); $tcp.Close(); Write-Host '[OK] Port 3000 is OPEN' } catch { Write-Host '[WARN] Port 3000 closed or server not running yet' }" 2>nul
    echo.
)

:: ============================================
:: FIREWALL
:: ============================================
echo --- FIREWALL SETUP ---
echo.

netsh advfirewall firewall delete rule name="NinjaKiosk Client Out" >nul 2>&1
netsh advfirewall firewall add rule name="NinjaKiosk Client Out" dir=out action=allow protocol=TCP remoteport=3000 profile=any >nul 2>&1
echo [OK] Firewall: Outbound TCP 3000

netsh advfirewall firewall set rule group="Network Discovery" new enable=Yes >nul 2>&1
echo [OK] Network Discovery enabled
echo.

:: ============================================
:: WEBVIEW2 CHECK
:: ============================================
echo --- WEBVIEW2 CHECK ---
echo.

reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] WebView2 Runtime installed
) else (
    reg query "HKLM\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" >nul 2>&1
    if %errorLevel% equ 0 (
        echo [OK] WebView2 Runtime installed
    ) else (
        echo [WARN] WebView2 Runtime NOT found!
        echo        It will be installed automatically if Edge is present.
        echo        Otherwise download from: https://go.microsoft.com/fwlink/p/?LinkId=2124703
    )
)
echo.

:: ============================================
:: KILL OLD INSTANCES
:: ============================================
tasklist /FI "IMAGENAME eq NinjaKiosk.exe" 2>NUL | find /I "NinjaKiosk.exe" >NUL
if %errorLevel% equ 0 (
    echo Killing old NinjaKiosk...
    taskkill /F /IM NinjaKiosk.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
    echo [OK] Old instances killed
    echo.
)

:: ============================================
:: SUMMARY
:: ============================================
echo ============================================
echo   CLIENT SETUP COMPLETE!
echo ============================================
echo.
if "%SERVER_IP%"=="" (
    echo   Mode: AUTO-DETECT ^(scans LAN for server^)
) else (
    echo   Server: %SERVER_IP%:3000
)
echo.
echo   The kiosk will:
echo     1. Look for LAN server on port 3000
echo     2. If found, use LAN mode ^(fast, offline^)
echo     3. If not found, fallback to cloud mode
echo.
echo   Run NinjaKiosk.exe to start the kiosk.
echo.
echo ============================================
echo.

set /p LAUNCH="Launch NinjaKiosk now? (Y/N): "
if /i "%LAUNCH%"=="Y" (
    if exist "%~dp0NinjaKiosk.exe" (
        echo Starting NinjaKiosk...
        if not "%SERVER_IP%"=="" (
            start "" "%~dp0NinjaKiosk.exe" --server-ip=%SERVER_IP%
        ) else (
            start "" "%~dp0NinjaKiosk.exe"
        )
        echo [OK] Kiosk launched!
    ) else if exist "%USERPROFILE%\Desktop\NinjaKiosk.exe" (
        echo Starting NinjaKiosk from Desktop...
        start "" "%USERPROFILE%\Desktop\NinjaKiosk.exe"
        echo [OK] Kiosk launched!
    ) else (
        echo [ERROR] NinjaKiosk.exe not found!
    )
)
echo.
pause
