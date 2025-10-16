// server.js (Version Corrigée)

// 1. Importation des dépendances
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

// 2. Configuration de l'application Express et des middlewares
const app = express();
app.use(cors());
app.use(bodyParser.json());

// 3. Configuration de la Base de Données (PostgreSQL)
const pool = new Pool({
    user: 'user',
    host: 'ljmdi_db',
    database: 'ljmdi_db',
    password: 'password',
    port: 5432,
});

// Test de connexion à la base de données au démarrage
pool.connect((err, client, release) => {
    if (err) {
        console.error('Erreur lors de la connexion à PostgreSQL:', err.stack);
        process.exit(1);
    }
    console.log('Connexion à PostgreSQL réussie !');
    release();
});


// 4. Définition des Routes API

// --- Route de base (Test de santé)
app.get('/', (req, res) => {
    res.status(200).send('API LJMDI en cours d’exécution !');
});


// --- ROUTE CORRIGÉE : API pour la page Documents ---
app.get('/api/documents', async (req, res) => {
    try {
        // La table documents doit exister à ce stade.
        const result = await pool.query('SELECT * FROM documents');
        res.json(result.rows);

    } catch (error) {
        console.error('Erreur lors de la récupération des documents:', error);
        // Si cette erreur s'affiche, c'est probablement un problème de DB ou de SQL.
        res.status(500).json({ message: "Erreur lors du chargement des données de documents." });
    }
});


// --- Route pour les Statistiques Avancées du Tableau de Bord ---
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        // 1. Membres
        const totalMembersResult = await pool.query('SELECT COUNT(*) FROM users');
        const totalMembers = parseInt(totalMembersResult.rows[0].count, 10);

        // 2. Documents
        const documentsCountResult = await pool.query('SELECT COUNT(*) FROM documents');
        const totalDocuments = parseInt(documentsCountResult.rows[0].count, 10);

        // --- Données du Dashboard (avec les valeurs réelles) ---
        const tresorerie = 1500;
        const contributionsMois = 250;
        const contributionsEvolution = [
            { mois: 'Jan', montant: 400 },
            { mois: 'Fév', montant: 300 },
            // ... autres mois ...
        ];

        res.json({
            membresActifs: totalMembers,
            nouveauxMembres: 3,
            tresorerie: tresorerie,
            contributionsMois: contributionsMois,
            activitesMois: totalDocuments,
            activitesAvenir: 2,
            tauxParticipation: 85,
            contributionsEvolution: contributionsEvolution,
            repartitionStatuts: [{ name: 'Payé', value: 70 }, { name: 'Retard', value: 15 }],
            alertes: [{ message: "3 contributions en retard", date: "2 jours", type: "Urgent" }]
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques du dashboard:', error);
        res.status(500).json({ message: "Erreur serveur lors du chargement des statistiques." });
    }
});


// 5. Démarrage du Serveur
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Serveur API démarré sur le port ${PORT}`);
});