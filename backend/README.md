# Backend LJMDI - API REST

## 📋 Description

Backend API pour le système de gestion intégrale LJMDI développé avec Node.js, Express et MySQL.

## 🚀 Installation et Démarrage

### Prérequis

1. **Node.js** (version 14 ou supérieure)
2. **MySQL** (version 8.0 recommandée)
3. **npm** ou **yarn**

### Configuration

1. **Installer les dépendances :**
   ```bash
   npm install
   ```

2. **Configurer la base de données MySQL :**
   - Assurez-vous que MySQL est installé et en cours d'exécution
   - Créez une base de données (optionnel - le script la créera automatiquement)
   - Modifiez le fichier `.env` si nécessaire :
     ```env
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=votre_mot_de_passe
     DB_NAME=ljmdi_db
     ```

3. **Démarrer le serveur :**
   ```bash
   # Mode développement
   npm run dev
   
   # Mode production
   npm start
   ```

Le serveur démarrera automatiquement sur `http://localhost:5001` et créera les tables nécessaires.

## 📡 Endpoints API

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/auth/verify` - Vérification du token
- `POST /api/auth/logout` - Déconnexion

### Membres
- `GET /api/membres` - Lister tous les membres
- `GET /api/membres/:id` - Détails d'un membre
- `POST /api/membres` - Créer un membre
- `PUT /api/membres/:id` - Mettre à jour un membre
- `DELETE /api/membres/:id` - Supprimer un membre

### Activités
- `GET /api/activites` - Lister toutes les activités
- `GET /api/activites/:id` - Détails d'une activité
- `POST /api/activites` - Créer une activité
- `PUT /api/activites/:id` - Mettre à jour une activité
- `DELETE /api/activites/:id` - Supprimer une activité

### Contributions
- `GET /api/contributions` - Lister toutes les contributions
- `GET /api/contributions/:id` - Détails d'une contribution
- `GET /api/contributions/member/:memberId` - Contributions d'un membre
- `POST /api/contributions` - Créer une contribution
- `PUT /api/contributions/:id` - Mettre à jour une contribution
- `DELETE /api/contributions/:id` - Supprimer une contribution

### Cotisations
- `GET /api/cotisations` - Lister toutes les cotisations
- `GET /api/cotisations/:id` - Détails d'une cotisation
- `GET /api/cotisations/member/:memberId` - Cotisations d'un membre
- `POST /api/cotisations` - Créer une cotisation
- `PUT /api/cotisations/:id` - Mettre à jour une cotisation
- `DELETE /api/cotisations/:id` - Supprimer une cotisation

### Présences
- `GET /api/presences` - Lister toutes les présences
- `GET /api/presences/activity/:activityId` - Présences d'une activité
- `GET /api/presences/member/:memberId` - Présences d'un membre
- `POST /api/presences` - Enregistrer une présence
- `PUT /api/presences/:id` - Mettre à jour une présence
- `DELETE /api/presences/:id` - Supprimer une présence

### Documents
- `GET /api/documents` - Lister tous les documents
- `GET /api/documents/:id` - Détails d'un document
- `POST /api/documents` - Créer un document
- `PUT /api/documents/:id` - Mettre à jour un document
- `DELETE /api/documents/:id` - Supprimer un document

### Cas Sociaux
- `GET /api/cas-sociaux` - Lister tous les cas sociaux
- `GET /api/cas-sociaux/:id` - Détails d'un cas social
- `POST /api/cas-sociaux` - Créer un cas social
- `PUT /api/cas-sociaux/:id` - Mettre à jour un cas social
- `DELETE /api/cas-sociaux/:id` - Supprimer un cas social
- `POST /api/cas-sociaux/:id/assistances` - Ajouter une assistance

### Rapports
- `GET /api/rapports/membres` - Rapport des membres
- `GET /api/rapports/financier` - Rapport financier
- `GET /api/rapports/activites` - Rapport des activités
- `GET /api/rapports/cas-sociaux` - Rapport des cas sociaux

### Dashboard
- `GET /api/dashboard/stats` - Statistiques générales
- `GET /api/dashboard/recent-activities` - Activités récentes
- `GET /api/dashboard/stats-period` - Statistiques par période

## 🗄️ Structure de la Base de Données

Le backend crée automatiquement les tables suivantes :

- `comptes` - Comptes utilisateurs
- `membres` - Informations des membres
- `activites` - Activités et événements
- `presences` - Suivi des présences
- `contributions` - Contributions financières
- `cotisations` - Cotisations des membres
- `documents` - Gestion documentaire
- `cas_sociaux` - Cas sociaux
- `assistances` - Assistances accordées

## 🔐 Sécurité

- Utilisation de JWT pour l'authentification
- Hashage des mots de passe avec bcryptjs
- Protection contre les attaques CORS
- Rate limiting pour prévenir les abus
- Validation des entrées avec express-validator

## 🧪 Tests

```bash
npm test
```

## 📝 Variables d'Environnement

Copiez le fichier `.env` et adaptez-le à votre configuration :

```env
NODE_ENV=development
PORT=5001
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ljmdi_db

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

## 🚨 Dépannage

### Problèmes courants

1. **Connexion MySQL refusée**
   - Vérifiez que MySQL est en cours d'exécution
   - Vérifiez les identifiants dans le fichier `.env`
   - Assurez-vous que l'utilisateur a les droits nécessaires

2. **Base de données non trouvée**
   - Le backend crée automatiquement la base de données
   - Vérifiez que l'utilisateur MySQL a les droits de création

3. **Port déjà utilisé**
   - Changez le PORT dans le fichier `.env`
   - Ou arrêtez le processus utilisant le port 5001

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement LJMDI.
