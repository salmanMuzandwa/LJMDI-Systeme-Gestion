const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ljmdi_db',
  charset: 'utf8mb4'
};

// Création d'une connexion simple
const createConnection = () => {
  return mysql.createConnection(dbConfig);
};

// Test de connexion
const testConnection = async () => {
  return new Promise((resolve, reject) => {
    const connection = createConnection();
    connection.connect((err) => {
      if (err) {
        console.error('❌ Erreur de connexion à la base de données:', err.message);
        reject(err);
      } else {
        console.log('✅ Connexion à la base de données MySQL établie');
        resolve();
      }
      connection.end();
    });
  });
};

// Exécuter une requête
const executeQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const connection = createConnection();
    connection.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
      connection.end();
    });
  });
};

// Initialisation de la base de données
const initDatabase = async () => {
  try {
    console.log('🔧 Initialisation de la base de données...');
    
    // Test de connexion simple
    await testConnection();
    
    // Création des tables de base
    await createTables();
    
    // Insertion des données de démonstration
    await insertDemoData();
    
    console.log('🎉 Base de données initialisée avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error.message);
    // Ne pas quitter le processus, continuer avec la base de données可能
  }
};

// Création des tables
const createTables = async () => {
  try {
    console.log('📋 Création des tables...');
    
    // Table des comptes
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS comptes (
        id_compte INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        mot_de_passe VARCHAR(255) NOT NULL,
        role ENUM('admin', 'charge_de_discipline', 'membre') NOT NULL DEFAULT 'membre',
        actif BOOLEAN DEFAULT TRUE,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Table des membres
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS membres (
        id_membre INT PRIMARY KEY AUTO_INCREMENT,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        telephone VARCHAR(20),
        date_adhesion DATE NOT NULL,
        statut ENUM('Actif', 'Inactif', 'Régulier') DEFAULT 'Actif',
        profession VARCHAR(100),
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Table des activités
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS activites (
        id_activite INT PRIMARY KEY AUTO_INCREMENT,
        titre VARCHAR(200) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        date_debut DATETIME NOT NULL,
        date_fin DATETIME NOT NULL,
        lieu VARCHAR(200),
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tables créées avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error.message);
  }
};

// Insertion des données de démonstration
const insertDemoData = async () => {
  try {
    console.log('🎯 Insertion des données de démonstration...');
    
    // Vérifier si des données existent
    const membres = await executeQuery('SELECT COUNT(*) as count FROM membres');
    if (membres[0].count > 0) {
      console.log('📝 Données de démonstration déjà présentes');
      return;
    }
    
    // Créer compte admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await executeQuery(
      'INSERT INTO comptes (email, mot_de_passe, role) VALUES (?, ?, ?)',
      ['admin@ljmdi.com', hashedPassword, 'admin']
    );
    
    // Créer membres de démonstration
    await executeQuery(`
      INSERT INTO membres (nom, prenom, email, telephone, date_adhesion, statut, profession) VALUES 
      ('Muzandwa', 'Salman', 'salman@ljmdi.com', '0812345678', '2024-01-15', 'Actif', 'Développeur'),
      ('Dupont', 'Jean', 'jean@ljmdi.com', '0823456789', '2024-02-20', 'Actif', 'Comptable'),
      ('Martin', 'Marie', 'marie@ljmdi.com', '0834567890', '2024-03-10', 'Régulier', 'Enseignante')
    `);
    
    // Créer activités de démonstration
    await executeQuery(`
      INSERT INTO activites (titre, type, description, date_debut, date_fin, lieu) VALUES 
      ('Réunion mensuelle', 'Réunion', 'Réunion ordinaire des membres', '2024-12-15 10:00:00', '2024-12-15 12:00:00', 'Siège social'),
      ('Atelier de formation', 'Formation', 'Formation sur la gestion', '2024-12-20 09:00:00', '2024-12-20 17:00:00', 'Centre de formation')
    `);
    
    console.log('✅ Données de démonstration insérées avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données:', error.message);
  }
};

module.exports = {
  executeQuery,
  initDatabase,
  testConnection
};
