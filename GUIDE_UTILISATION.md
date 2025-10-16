# Guide d'Utilisation - Système de Gestion LJMDI

## 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Installation et Configuration](#installation-et-configuration)
3. [Architecture de l'Application](#architecture-de-lapplication)
4. [Processus de Connexion](#processus-de-connexion)
5. [Navigation et Interface](#navigation-et-interface)
6. [Modules Fonctionnels](#modules-fonctionnels)
7. [Configuration Backend](#configuration-backend)
8. [Déploiement](#déploiement)
9. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

L'application LJMDI est un système de gestion intégrale développé en React pour la Ligue des Jeunes Musulmans pour le Développement Intégral. Elle permet de gérer les membres, les contributions financières, les activités, les présences et les cas sociaux.

### Technologies Utilisées
- **Frontend**: React 18, Material-UI, React Router
- **État Global**: Context API (AuthContext)
- **Requêtes**: Axios
- **Graphiques**: Recharts
- **Authentification**: JWT (JSON Web Tokens)

---

## 🛠️ Installation et Configuration

### Étape 1: Prérequis
```bash
# Vérifier les versions
node --version    # >= 16.0.0
npm --version     # >= 8.0.0
```

### Étape 2: Installation des Dépendances
```bash
# Cloner le projet (si nécessaire)
cd LJMDI

# Installer les dépendances
npm install

# Dépendances principales installées :
# - @mui/material (interface utilisateur)
# - @mui/x-date-pickers (sélecteurs de date)
# - react-router-dom (navigation)
# - recharts (graphiques)
# - axios (requêtes HTTP)
```

### Étape 3: Configuration des Variables d'Environnement
Créer un fichier `.env` à la racine :
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_DJANGO_URL=http://localhost:8000
REACT_APP_VERSION=1.0.0
```

### Étape 4: Lancement de l'Application
```bash
npm start
```
L'application sera accessible sur `http://localhost:3000`

---

## 🏗️ Architecture de l'Application

### Structure des Dossiers
```
src/
├── components/          # Composants réutilisables
│   ├── Layout.js       # Barre de navigation et structure
│   └── ProtectedRoute.js # Protection des routes
├── contexts/           # Contextes React
│   └── AuthContext.js  # Gestion de l'authentification
├── pages/              # Pages de l'application
│   ├── Login.js        # Page de connexion
│   ├── Dashboard.js    # Tableau de bord
│   ├── Membres.js      # Gestion des membres
│   ├── Contributions.js # Gestion financière
│   ├── Activites.js    # Gestion des activités
│   ├── Presences.js    # Suivi des présences
│   ├── Documents.js    # Gestion documentaire
│   ├── Rapports.js     # Génération de rapports
│   ├── CasSociaux.js   # Gestion des cas sociaux
│   └── Profil.js       # Profil utilisateur
├── App.js              # Composant principal
└── index.js            # Point d'entrée
```

### Flux de Données
```
User Interface → React Components → Context API → Axios → Backend API → Database
```

---

## 🔐 Processus de Connexion

### Étape 1: Page de Connexion
1. L'utilisateur accède à `/login`
2. Saisit ses identifiants (email/mot de passe)
3. Validation côté client
4. Envoi de la requête au backend

### Étape 2: Authentification
```javascript
// Dans AuthContext.js
const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', {
        email, password
    });
    
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    setUser(user);
    return { success: true };
};
```

### Étape 3: Vérification du Token
```javascript
// Vérification automatique au chargement
useEffect(() => {
    if (token) {
        verifyToken(); // Vérifie la validité du token
    }
}, [token]);
```

### Étape 4: Redirection
- Si authentifié : Redirection vers `/dashboard`
- Si non authentifié : Reste sur `/login`

---

## 🧭 Navigation et Interface

### Composant Layout
Le composant `Layout.js` gère :
- **Sidebar**: Navigation principale avec icônes
- **Header**: Barre supérieure avec profil utilisateur
- **Menu déroulant**: Accès au profil et déconnexion

### Protection des Routes
```javascript
// Dans ProtectedRoute.js
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) return <CircularProgress />;
    return isAuthenticated ? children : <Navigate to="/login" />;
};
```

### Contrôle d'Accès Basé sur les Rôles (RBAC)
```javascript
// Dans AuthContext.js
const hasPermission = (permission) => {
    const rolePermissions = {
        'Administrateur': ['all'],
        'Président': ['all'],
        'Secrétaire Général': ['membres', 'documents', 'activites'],
        'Trésorier': ['contributions', 'transactions'],
        'Chargé de Discipline': ['presences', 'activites'],
        'Membre': ['profil', 'contributions_own']
    };
    
    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes('all') || userPermissions.includes(permission);
};
```

---

## 📱 Modules Fonctionnels

### 1. Dashboard (Tableau de Bord)
**Fichier**: `Dashboard.js`

**Fonctionnalités**:
- Statistiques en temps réel (membres, trésorerie, activités)
- Graphiques d'évolution des contributions
- Répartition par statut des membres
- Alertes importantes
- Activités récentes

**Processus**:
1. Chargement des données via API `/api/dashboard/stats`
2. Affichage des cartes statistiques
3. Rendu des graphiques avec Recharts
4. Gestion des états de chargement et erreurs

### 2. Gestion des Membres
**Fichier**: `Membres.js`

**Fonctionnalités**:
- Liste des membres avec pagination
- Formulaire d'ajout/modification
- Gestion des statuts (Actif, Inactif, Régulier)
- Informations détaillées (contact, profession, adhésion)

**Processus**:
1. Récupération de la liste via `/api/membres`
2. Affichage dans un tableau Material-UI
3. Dialogue modal pour les formulaires
4. Validation côté client avant envoi

### 3. Gestion des Contributions
**Fichier**: `Contributions.js`

**Fonctionnalités**:
- Enregistrement des cotisations
- Types de cotisation (Hebdomadaire, Spéciale, Annuelle)
- Statuts de paiement (Payé, En Retard, En Attente)
- Historique des paiements

**Processus**:
1. Sélection du membre et du type de cotisation
2. Saisie du montant et de la date
3. Validation des données
4. Enregistrement via `/api/contributions`

### 4. Gestion des Activités
**Fichier**: `Activites.js`

**Fonctionnalités**:
- Planification d'événements
- Types d'activités (Réunion, Séminaire, Formation)
- Gestion des dates de début et fin
- Description et lieu

**Processus**:
1. Création d'une nouvelle activité
2. Définition des détails (titre, type, dates, lieu)
3. Sauvegarde via `/api/activites`
4. Affichage dans la liste des activités

### 5. Suivi des Présences
**Fichier**: `Presences.js`

**Fonctionnalités**:
- Enregistrement des présences/absences
- Association avec les activités
- Calcul des taux de participation
- Statistiques par membre

**Processus**:
1. Sélection de l'activité
2. Choix du membre et du statut (Présent/Absent/Retard)
3. Enregistrement via `/api/presences`
4. Mise à jour des statistiques

### 6. Gestion Documentaire
**Fichier**: `Documents.js`

**Fonctionnalités**:
- Upload et stockage de documents
- Classification par type (Rapport, PV, Règlement)
- Recherche et filtrage
- Téléchargement sécurisé

### 7. Rapports et Statistiques
**Fichier**: `Rapports.js`

**Fonctionnalités**:
- Génération de rapports financiers
- Statistiques des membres
- Rapports d'activités
- Export en PDF/Excel

**Types de rapports**:
- Financier (contributions, dépenses)
- Membres (statistiques, participation)
- Activités (présences, organisation)

### 8. Cas Sociaux
**Fichier**: `CasSociaux.js`

**Fonctionnalités**:
- Enregistrement des cas sociaux
- Suivi des assistances
- Historique des aides
- Montants et justificatifs

---

## ⚙️ Configuration Backend

### API Endpoints Requis

#### Authentification
```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/verify
```

#### Membres
```
GET    /api/membres
POST   /api/membres
PUT    /api/membres/:id
DELETE /api/membres/:id
```

#### Contributions
```
GET    /api/contributions
POST   /api/contributions
PUT    /api/contributions/:id
DELETE /api/contributions/:id
```

#### Activités
```
GET    /api/activites
POST   /api/activites
PUT    /api/activites/:id
DELETE /api/activites/:id
```

#### Présences
```
GET    /api/presences
POST   /api/presences
PUT    /api/presences/:id
```

#### Documents
```
GET    /api/documents
POST   /api/documents
DELETE /api/documents/:id
GET    /api/documents/:id/download
```

#### Rapports
```
GET    /api/rapports/financier
GET    /api/rapports/membres
GET    /api/rapports/activites
POST   /api/rapports/generate
```

#### Cas Sociaux
```
GET    /api/cas-sociaux
POST   /api/cas-sociaux
PUT    /api/cas-sociaux/:id
```

### Structure de Réponse API
```javascript
// Succès
{
    "success": true,
    "data": { /* données */ },
    "message": "Opération réussie"
}

// Erreur
{
    "success": false,
    "error": "Message d'erreur",
    "code": "ERROR_CODE"
}
```

---

## 🚀 Déploiement

### Développement
```bash
npm start
```

### Production
```bash
# Build de production
npm run build

# Serveur de production (avec serve)
npm install -g serve
serve -s build -l 3000
```

### Variables d'Environnement Production
```env
REACT_APP_API_URL=https://api.ljmdi.com
REACT_APP_DJANGO_URL=https://reports.ljmdi.com
NODE_ENV=production
```

---

## 🔧 Dépannage

### Problèmes Courants

#### 1. Erreur de CORS
```javascript
// Dans le backend, ajouter :
app.use(cors({
    origin: ['http://localhost:3000', 'https://ljmdi.com'],
    credentials: true
}));
```

#### 2. Token Expiré
```javascript
// Intercepteur Axios pour renouveler le token
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Rediriger vers login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
```

#### 3. Erreurs de Validation
```javascript
// Validation côté client
const validateForm = (data) => {
    const errors = {};
    
    if (!data.email) errors.email = 'Email requis';
    if (!data.password) errors.password = 'Mot de passe requis';
    
    return errors;
};
```

#### 4. Performance
```javascript
// Lazy loading des composants
const Membres = lazy(() => import('./pages/Membres'));
const Contributions = lazy(() => import('./pages/Contributions'));

// Utilisation avec Suspense
<Suspense fallback={<CircularProgress />}>
    <Membres />
</Suspense>
```

### Logs et Debug
```javascript
// Ajout de logs en développement
if (process.env.NODE_ENV === 'development') {
    console.log('API Response:', response.data);
}
```

---

## 📞 Support et Maintenance

### Monitoring
- Vérifier les logs de l'application
- Surveiller les performances
- Contrôler l'utilisation des ressources

### Sauvegarde
- Sauvegarde régulière de la base de données
- Versioning du code source
- Documentation des changements

### Mises à Jour
1. Tester en environnement de développement
2. Déployer en staging
3. Validation des fonctionnalités
4. Déploiement en production

---

## 📚 Ressources Additionnelles

### Documentation Technique
- [React Documentation](https://reactjs.org/docs)
- [Material-UI Documentation](https://mui.com)
- [React Router Documentation](https://reactrouter.com)

### Bonnes Pratiques
- Code propre et commenté
- Tests unitaires
- Gestion d'erreurs robuste
- Sécurité des données

---

**© 2024 LJMDI - Guide d'Utilisation du Système de Gestion**
