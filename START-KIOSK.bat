@echo off
title NinjaKiosk Launcher
color 0A

echo ============================================
echo   NinjaKiosk Launcher
echo ============================================
echo.

:: Kill any old instances
taskkill /F /IM NinjaKiosk.exe >nul 2>&1
timeout /t 1 /nobreak >nul

:: Find the kiosk exe
set "KIOSK_EXE="
if exist "%~dp0NinjaKiosk.exe" set "KIOSK_EXE=%~dp0NinjaKiosk.exe"
if "%KIOSK_EXE%"=="" if exist "%USERPROFILE%\Desktop\NinjaKiosk.exe" set "KIOSK_EXE=%USERPROFILE%\Desktop\NinjaKiosk.exe"
if "%KIOSK_EXE%"=="" if exist "%ProgramFiles%\NinjaKiosk\NinjaKiosk.exe" set "KIOSK_EXE=%ProgramFiles%\NinjaKiosk\NinjaKiosk.exe"

if "%KIOSK_EXE%"=="" (
    color 0C
    echo [ERROR] NinjaKiosk.exe not found!
    echo         Check Desktop, Program Files, or current folder.
    pause
    exit /b 1
)

:: Unblock the exe
powershell -Command "Unblock-File -Path '%KIOSK_EXE%'" 2>nul
echo [OK] Using: %KIOSK_EXE%
echo.

:: Check for LAN config
set "LAN_CONFIG=%APPDATA%\ninja-games-kiosk\lan-config.json"
if exist "%LAN_CONFIG%" (
    echo [OK] LAN config found - will try LAN server first
) else (
    echo [OK] No LAN config - will auto-detect or use cloud
)
echo.

echo Launching NinjaKiosk...
start "" "%KIOSK_EXE%"

timeout /t 3 /nobreak >nul

:: Check if it started
tasklist /FI "IMAGENAME eq NinjaKiosk.exe" 2>NUL | find /I "NinjaKiosk.exe" >NUL
if %errorLevel% equ 0 (
    echo [OK] NinjaKiosk is running!
) else (
    color 0C
    echo [FAILED] NinjaKiosk did not start!
    echo.
    echo Fixes:
    echo   1. Right-click exe ^> Properties ^> Unblock ^> OK
    echo   2. Add to antivirus exclusions
    echo   3. Run as administrator
    echo.
    echo Running directly for error info...
    "%KIOSK_EXE%"
)
echo.
pause
