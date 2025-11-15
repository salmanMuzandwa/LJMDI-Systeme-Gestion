@echo off
echo ====================================
echo   Diagnostic LJMDI
echo ====================================
echo.

echo [1/4] Verification de Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé
    pause
    exit /b 1
) else (
    echo ✅ Node.js est installé
)

echo.
echo [2/4] Verification des ports...
netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Port 3000 déjà utilisé
) else (
    echo ✅ Port 3000 libre
)

netstat -ano | findstr ":5001" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Port 5001 déjà utilisé
) else (
    echo ✅ Port 5001 libre
)

echo.
echo [3/4] Test de l'API backend...
cd backend
timeout /t 2 >nul
start /B cmd /c "npm start"
timeout /t 5 >nul
curl http://localhost:5001/api/test >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend API fonctionne
) else (
    echo ❌ Backend API ne répond pas
)

echo.
echo [4/4] Demarrage du frontend...
cd ..
start /B cmd /c "npm start"
timeout /t 10 >nul
curl http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend fonctionne
) else (
    echo ❌ Frontend ne répond pas
)

echo.
echo ====================================
echo   Diagnostic terminé
echo ====================================
echo.
echo URLs:
echo Backend: http://localhost:5001/api/test
echo Frontend: http://localhost:3000
echo.
pause
