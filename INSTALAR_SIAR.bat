@echo off
cd /d "%~dp0"
if not exist config.json copy config.example.json config.json >nul
call npm.cmd ci
if errorlevel 1 goto error
call npm.cmd run db:init
if errorlevel 1 goto error
echo Instalacion terminada. Ejecuta INICIAR_SIAR.bat
pause
exit /b 0
:error
echo No se pudo instalar. Revisa Node.js, internet, MySQL de XAMPP y config.json.
pause
exit /b 1
