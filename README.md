# Système de Gestion Intégrale LJMDI

Application web sécurisée, performante et évolutive pour la Ligue des Jeunes Musulmans pour le Développement Intégral (LJMDI), une ASBL basée à Goma, RDC.

## 🎯 Objectif

Cette application met en place un système de gestion numérique complet pour centraliser, automatiser et sécuriser toutes les informations de l'organisation. Elle remplace les processus manuels et offre une transparence accrue et un suivi rigoureux de la discipline.

## 🏗️ Architecture Technique

### Frontend
- **React 18** avec hooks et contextes
- **Material-UI (MUI)** pour l'interface utilisateur moderne et responsive
- **React Router** pour la navigation
- **Recharts** pour les graphiques et statistiques
- **Axios** pour les appels API

### Backend
- **Node.js/Express** pour l'API principale
- **Python/Django** microservice pour les rapports et statistiques
- **MySQL** base de données principale
- **JWT** pour l'authentification sécurisée

### Sécurité
- Chiffrement HTTPS/SSL
- Authentification JWT (JSON Web Tokens)
- Contrôle d'Accès Basé sur les Rôles (RBAC)

## 👥 Rôles Utilisateurs (RBAC)

| Rôle | Permissions |
|------|-------------|
| **Administrateur/Président** | Accès complet, supervision de tous les tableaux de bord et gestion des utilisateurs/rôles |
| **Secrétaire Général** | Gestion administrative (Membres, documents), coordination et suivi des activités |
| **Trésorier** | Gestion financière complète (contributions, transactions, bilans). Lecture seule sur la plupart des autres modules |
| **Chargé de Discipline** | Enregistrement Présences/Absences, accès aux taux de participation et aux alertes |
| **Membre** | Accès à son profil, à son historique de contributions, à l'agenda des activités et aux documents publics |

## 🗄️ Structure de la Base de Données

### Entités de Base
- **Membres** : Informations personnelles des membres
- **Comptes** : Authentification et rôles
- **Documents** : Gestion documentaire

### Gestion Financière
- **Contributions** : Cotisations des membres
- **Transactions** : Mouvements financiers

### Gestion Sociale et Disciplinaire
- **CasSociaux** : Suivi des cas sociaux
- **Assistances** : Aides apportées
- **Présences** : Suivi des présences aux activités
- **Activités** : Planification des événements

## 🚀 Installation et Démarrage

### Prérequis
- Node.js (v16 ou plus récent)
- npm ou yarn
- MySQL (v8.0 ou plus récent)

### Installation Frontend
```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm start
```

L'application sera accessible sur `http://localhost:3000`

### Variables d'environnement
Créer un fichier `.env` dans le répertoire racine :
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_DJANGO_URL=http://localhost:8000
```

## 📱 Fonctionnalités Principales

### 1. Tableau de Bord
- Statistiques en temps réel
- Graphiques d'évolution
- Alertes importantes
- Activités récentes

### 2. Gestion des Membres
- Inscription en ligne
- Fiche individuelle numérique
- Carte de membre numérique
- Suivi des statuts

### 3. Gestion Financière
- Enregistrement des contributions
- Notifications automatiques de retard
- Génération de bilans mensuels/annuels
- Transparence financière

### 4. Gestion des Activités
- Planification des événements
- Suivi des présences
- Calcul automatique des taux de participation
- Classement des membres par assiduité

### 5. Rapports et Statistiques
- Rapports financiers détaillés
- Statistiques des membres
- Rapports d'activités
- Export PDF/Excel
- Envoi par email

### 6. Cas Sociaux
- Suivi des cas sociaux
- Gestion des assistances
- Historique des aides

## 🔧 Configuration

### Backend API (Node.js/Express)
Le backend doit être configuré pour répondre aux endpoints suivants :
- `/api/auth/*` - Authentification
- `/api/membres/*` - Gestion des membres
- `/api/contributions/*` - Gestion financière
- `/api/activites/*` - Gestion des activités
- `/api/presences/*` - Suivi des présences
- `/api/documents/*` - Gestion documentaire
- `/api/rapports/*` - Génération de rapports
- `/api/cas-sociaux/*` - Gestion des cas sociaux

### Microservice Django
Pour les rapports complexes et l'automatisation :
- Génération de rapports PDF/Excel
- Calculs statistiques avancés
- Notifications automatiques
- Alertes financières et disciplinaires

## 📊 Optimisations et Performance

- **Tableaux de bord** : Affichage des statistiques en temps réel
- **Index BDD** : Optimisation des requêtes sur les clés étrangères
- **APIs RESTful** : Architecture évolutive pour faciliter l'ajout de modules
- **Responsive Design** : Interface adaptée aux mobiles et tablettes

## 🔐 Sécurité

- Authentification JWT avec expiration
- Chiffrement des mots de passe
- Validation des données côté client et serveur
- Contrôle d'accès basé sur les rôles
- Logs d'audit pour la traçabilité

## 📈 Évolutivité

L'architecture est conçue pour faciliter l'ajout futur de modules :
- Gestion des Projets Économiques
- Système de messagerie interne
- Module de formation
- Gestion des événements externes

## 🤝 Contribution

Pour contribuer au projet :
1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit vos changements (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📞 Support

Pour toute question ou support technique, contacter l'équipe de développement LJMDI.

## 📄 Licence

Ce projet est développé pour la LJMDI. Tous droits réservés.

---

© 2024 LJMDI - Ligue des Jeunes Musulmans pour le Développement Intégral
