@echo off
echo ====================================
echo   Démarrage du Système LJMDI
echo ====================================
echo.

echo [1/4] Vérification de Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js est installé

echo.
echo [2/4] Vérification de MySQL...
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  MySQL n'est pas trouvé dans le PATH.
    echo Veuillez vous assurer que MySQL est installé et accessible.
    echo Si MySQL est installé, appuyez sur une touche pour continuer...
    pause >nul
) else (
    echo ✅ MySQL est accessible
)

echo.
echo [3/4] Installation des dépendances backend...
cd backend
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
echo [4/4] Démarrage du serveur backend...
echo Le serveur va démarrer sur http://localhost:5001
echo Appuyez sur Ctrl+C pour arrêter le serveur
echo.
echo ====================================
echo.

npm start

pause
