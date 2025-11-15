// LJMDI\.qodo\seed.js

const { Pool } = require('pg');
const argon2 = require('argon2');

const pool = new Pool({
    user: 'user',
    host: 'ljmdi_db',
    database: 'ljmdi_db',
    password: 'password',
    port: 5432,
});

async function seedDatabase() {
    try {
        console.log('Démarrage du seeding de la base de données...');

        // 1. Définition du mot de passe de l'admin
        const adminPassword = 'adminpassword';
        const saltRounds = 10;

        // 2. Hachage du mot de passe
        const hashedPassword = await argon2.hash(adminPassword);

        // 3. Insertion de l'utilisateur admin
        const query = `
            INSERT INTO users (nom, prenom, email, password, role, telephone, profession)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (email) DO NOTHING;
        `;
        const values = [
            'Muzandwa',
            'Salman',
            'admin@ljmdi.org',
            hashedPassword,
            'admin',
            '000000000', // Exemple de numéro de téléphone
            'Développeur' // Exemple de profession
        ];

        await pool.query(query, values);
        console.log('Utilisateur admin inséré (Mot de passe: adminpassword).');

        // 4. Insertion d'un document de test (pour que la page Documents affiche quelque chose)
        const docQuery = `
            INSERT INTO documents (type, titre, description, auteur_id, fichier_path)
            VALUES ($1, $2, $3, (SELECT id FROM users WHERE email = 'admin@ljmdi.org'), $4)
            ON CONFLICT DO NOTHING;
        `;

        await pool.query(docQuery, [
            'Rapport',
            'Rapport Annuel 2025',
            'Bilan financier et activités de l\'année.',
            '/uploads/rapport_annuel_2025.pdf'
        ]);
        console.log('Document de test inséré.');

        console.log('Seeding terminé.');

    } catch (error) {
        console.error('Erreur lors du seeding:', error);
    } finally {
        pool.end();
    }
}

seedDatabase();

