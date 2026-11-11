@echo off
title Kaola Office
set CURRENT_DIR=%~dp0

:: Dam bao ngon ngu mac dinh la Tieng Viet (vi-VN)
reg query "HKCU\Software\ONLYOFFICE\DesktopEditors" /v "langid" >nul 2>&1
if %errorlevel% neq 0 (
    reg add "HKCU\Software\ONLYOFFICE\DesktopEditors" /v "langid" /t REG_SZ /d "vi-VN" /f >nul 2>&1
)

cd /d "%CURRENT_DIR%app"
start "" "KaolaOffice.exe" %*
