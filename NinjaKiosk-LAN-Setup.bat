@echo off
title NinjaKiosk LAN Server Setup
color 0A
setlocal enabledelayedexpansion
echo ============================================
echo   NinjaKiosk LAN SERVER Setup - Run as Admin
echo   Run this on the PC hosting the server
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
:: GET IP ADDRESS
:: ============================================
set "MY_IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        if "!MY_IP!"=="" set "MY_IP=%%b"
    )
)

echo --- YOUR IP ADDRESS ---
echo.
echo   SERVER IP: %MY_IP%
echo.

:: ============================================
:: FIREWALL RULES
:: ============================================
echo --- FIREWALL SETUP ---
echo.

:: Remove old rules
netsh advfirewall firewall delete rule name="NinjaKiosk LAN TCP 3000" >nul 2>&1
netsh advfirewall firewall delete rule name="NinjaKiosk LAN UDP 3000" >nul 2>&1
netsh advfirewall firewall delete rule name="NinjaKiosk LAN TCP 3000 Out" >nul 2>&1
netsh advfirewall firewall delete rule name="NinjaKiosk LAN Node.js" >nul 2>&1

:: Allow inbound TCP 3000
netsh advfirewall firewall add rule name="NinjaKiosk LAN TCP 3000" dir=in action=allow protocol=TCP localport=3000 profile=any
echo [OK] Firewall: Inbound TCP 3000

:: Allow outbound TCP 3000
netsh advfirewall firewall add rule name="NinjaKiosk LAN TCP 3000 Out" dir=out action=allow protocol=TCP localport=3000 profile=any >nul 2>&1
echo [OK] Firewall: Outbound TCP 3000

:: Allow node.exe
where node >nul 2>&1
if %errorLevel% equ 0 (
    for /f "delims=" %%i in ('where node') do (
        netsh advfirewall firewall add rule name="NinjaKiosk LAN Node.js" dir=in action=allow program="%%i" profile=any >nul 2>&1
        echo [OK] Firewall: node.exe ^(%%i^)
    )
)

:: Enable network discovery
netsh advfirewall firewall set rule group="Network Discovery" new enable=Yes >nul 2>&1
echo [OK] Network Discovery enabled
netsh advfirewall firewall set rule group="File and Printer Sharing" new enable=Yes >nul 2>&1
echo [OK] File and Printer Sharing enabled
echo.

:: ============================================
:: TEST SERVER
:: ============================================
echo --- TESTING ---
echo.

netstat -an | findstr ":3000.*LISTENING" >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Port 3000 is LISTENING - server running!
) else (
    color 0E
    echo [WARN] Port 3000 not listening yet
    echo        Run START-LAN-SERVER.bat to start the server
)

echo.
echo ============================================
echo   SERVER SETUP COMPLETE!
echo ============================================
echo.
echo   1. Run START-LAN-SERVER.bat to start the server
echo   2. On client PCs, run NinjaKiosk-Client-Setup.bat
echo   3. The kiosk will auto-detect this server at:
echo.
echo      http://%MY_IP%:3000/kiosk
echo.
echo   The kiosk auto-scans the LAN for the server.
echo   If auto-scan fails, clients can be configured with:
echo      NinjaKiosk.exe --server-ip=%MY_IP%
echo.
echo ============================================
pause
