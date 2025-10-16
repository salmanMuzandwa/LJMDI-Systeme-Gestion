// ljmdi-backend/seed.js

const { Client } = require('pg'); // Nécessite la librairie 'pg' (PostgreSQL)
const bcrypt = require('bcrypt'); // Nécessite la librairie 'bcrypt' pour hacher

async function seedDatabase() {
    const client = new Client({
        // Réutilise les informations de docker-compose.yml
        host: 'db', // L'hôte doit être le nom du service Docker
        port: 5432,
        user: 'user',
        password: 'password',
        database: 'ljmdi_db',
    });

    try {
        await client.connect();

        // --- 1. Définir l'utilisateur Administrateur ---
        const emailAdmin = 'admin@ljmdi.com';
        const passwordAdmin = 'password123'; // ⬅️ VOTRE MOT DE PASSE DE CONNEXION !
        const hashedPassword = await bcrypt.hash(passwordAdmin, 10);

        // --- 2. Requête d'insertion ---
        const insertQuery = `
            INSERT INTO users (email, password, role, nom, prenom, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (email) DO NOTHING;
        `;
        const values = [
            emailAdmin,
            hashedPassword,
            'Administrateur',
            'Admin',
            'Principal'
        ];

        const res = await client.query(insertQuery, values);

        if (res.rowCount > 0) {
            console.log(`✅ Utilisateur Admin (email: ${emailAdmin}, mdp: ${passwordAdmin}) créé avec succès !`);
        } else {
            console.log(`ℹ️ Utilisateur Admin (${emailAdmin}) déjà existant. Aucune insertion effectuée.`);
        }

    } catch (err) {
        console.error('❌ Erreur lors du seeding de la base de données :', err.message);
    } finally {
        await client.end();
    }
}

seedDatabase();

