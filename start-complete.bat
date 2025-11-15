@echo off
echo ====================================
echo   Démarrage Complet du Système LJMDI
echo   Backend + Frontend
echo ====================================
echo.

echo [1/6] Vérification de Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js est installé

echo.
echo [2/6] Vérification de MySQL...
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
echo [3/6] Installation des dépendances backend...
cd backend
if not exist node_modules (
    echo Installation des dépendances backend...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de l'installation des dépendances backend
        pause
        exit /b 1
    )
) else (
    echo ✅ Dépendances backend déjà installées
)

echo.
echo [4/6] Installation des dépendances frontend...
cd ..
if not exist node_modules (
    echo Installation des dépendances frontend...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de l'installation des dépendances frontend
        pause
        exit /b 1
    )
) else (
    echo ✅ Dépendances frontend déjà installées
)

echo.
echo [5/6] Démarrage du serveur backend...
echo Lancement du backend en arrière-plan...
cd backend
start "Backend LJMDI" cmd /k "npm start"
timeout /t 3 >nul

echo.
echo [6/6] Démarrage du frontend...
echo Lancement du frontend...
cd ..
echo.
echo ====================================
echo   🚀 Système LJMDI en cours de démarrage
echo ====================================
echo.
echo 📡 Backend API: http://localhost:5001
echo 🌐 Frontend App: http://localhost:3000
echo.
echo Identifiants de démonstration:
echo Email: admin@ljmdi.com
echo Mot de passe: admin123
echo.
echo Les deux fenêtres vont s'ouvrir automatiquement.
echo Appuyez sur Ctrl+C dans chaque fenêtre pour arrêter.
echo.
echo ====================================
echo.

npm start

pause
