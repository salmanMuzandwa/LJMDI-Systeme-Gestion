@echo off
echo ====================================
echo   Démarrage Frontend LJMDI
echo ====================================
echo.

echo [1/2] Vérification de Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js est installé

echo.
echo [2/2] Installation des dépendances frontend...
if not exist node_modules (
    echo Installation des dépendances...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de l'installation des dépendances
        pause
        exit /b 1
    )
) else (
    echo ✅ Dépendances déjà installées
)

echo.
echo Démarrage de l'application frontend...
echo L'application va démarrer sur http://localhost:3000
echo Appuyez sur Ctrl+C pour arrêter l'application
echo.
echo ====================================
echo.

npm start

pause
