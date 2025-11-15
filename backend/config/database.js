const mysql = require('mysql2');
require('dotenv').config();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ljmdi_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

// Création du pool de connexions
const pool = mysql.createPool(dbConfig);

// Promisify pour pouvoir utiliser async/await
const poolPromise = pool.promise();

// Test de connexion
const testConnection = async () => {
  try {
    const connection = await poolPromise.getConnection();
    console.log('✅ Connexion à la base de données MySQL établie');
    connection.release();
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    process.exit(1);
  }
};

// Initialisation de la base de données
const initDatabase = async () => {
  try {
    // Création de la base de données si elle n'existe pas
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    await connection.promise().execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.end();
    
    console.log(`📊 Base de données '${dbConfig.database}' prête`);
    
    // Test de connexion à la base de données créée
    await testConnection();
    
    // Création des tables
    await createTables();
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error.message);
  }
};

// Création des tables
const createTables = async () => {
  try {
    const connection = await poolPromise.getConnection();
    
    // Table des comptes utilisateurs
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS comptes (
        id_compte INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        mot_de_passe VARCHAR(255) NOT NULL,
        role ENUM('admin', 'charge_de_discipline', 'membre') NOT NULL DEFAULT 'membre',
        actif BOOLEAN DEFAULT TRUE,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        derniere_connexion TIMESTAMP NULL
      )
    `);
    
    // Table des membres
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS membres (
        id_membre INT PRIMARY KEY AUTO_INCREMENT,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        telephone VARCHAR(20),
        date_adhesion DATE NOT NULL,
        statut ENUM('Actif', 'Inactif', 'Régulier') DEFAULT 'Actif',
        adresse TEXT,
        profession VARCHAR(100),
        id_compte INT,
        FOREIGN KEY (id_compte) REFERENCES comptes(id_compte),
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Table des activités
    await connection.execute(`
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
    
    // Table des présences
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS presences (
        id_presence INT PRIMARY KEY AUTO_INCREMENT,
        id_activite INT NOT NULL,
        id_membre INT NOT NULL,
        statut ENUM('Présent', 'Absent', 'Retard') NOT NULL,
        date_heure DATETIME NOT NULL,
        remarques TEXT,
        FOREIGN KEY (id_activite) REFERENCES activites(id_activite),
        FOREIGN KEY (id_membre) REFERENCES membres(id_membre)
      )
    `);
    
    // Table des cotisations
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cotisations (
        id_cotisation INT PRIMARY KEY AUTO_INCREMENT,
        id_membre INT NOT NULL,
        type_cotisation ENUM('Hebdomadaire', 'Spéciale', 'Annuelle') NOT NULL,
        montant DECIMAL(10,2) NOT NULL,
        date_paiement DATE NOT NULL,
        statut_paiement ENUM('Payé', 'En Retard', 'En Attente') DEFAULT 'En Attente',
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_membre) REFERENCES membres(id_membre)
      )
    `);
    
    // Table des contributions
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS contributions (
        id_contribution INT PRIMARY KEY AUTO_INCREMENT,
        id_membre INT NOT NULL,
        type_contribution ENUM('Hebdomadaire', 'Spéciale', 'Annuelle') NOT NULL,
        montant DECIMAL(10,2) NOT NULL,
        date_paiement DATE NOT NULL,
        statut_paiement ENUM('Payé', 'En Retard', 'En Attente') DEFAULT 'En Attente',
        description TEXT,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_membre) REFERENCES membres(id_membre)
      )
    `);
    
    // Table des documents
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id_document INT PRIMARY KEY AUTO_INCREMENT,
        nom_fichier VARCHAR(255) NOT NULL,
        type_document VARCHAR(50) NOT NULL,
        chemin_fichier VARCHAR(500) NOT NULL,
        taille_fichier INT,
        description TEXT,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Table des cas sociaux
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cas_sociaux (
        id_cas INT PRIMARY KEY AUTO_INCREMENT,
        id_membre INT NOT NULL,
        type_cas VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        statut ENUM('Ouvert', 'En Cours', 'Résolu', 'Fermé') DEFAULT 'Ouvert',
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_membre) REFERENCES membres(id_membre)
      )
    `);
    
    // Table des assistances
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS assistances (
        id_assistance INT PRIMARY KEY AUTO_INCREMENT,
        id_cas INT NOT NULL,
        montant DECIMAL(10,2) NOT NULL,
        type_assistance VARCHAR(50) NOT NULL,
        description TEXT,
        date_assistance DATE NOT NULL,
        statut ENUM('En Attente', 'Approuvée', 'Refusée', 'Versée') DEFAULT 'En Attente',
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_cas) REFERENCES cas_sociaux(id_cas)
      )
    `);
    
    // Création des index pour optimiser les performances
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_membres_email ON membres(email)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_cotisations_membre ON cotisations(id_membre)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_cotisations_date ON cotisations(date_paiement)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_contributions_membre ON contributions(id_membre)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_contributions_date ON contributions(date_paiement)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_presences_activite ON presences(id_activite)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_presences_membre ON presences(id_membre)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_cas_membre ON cas_sociaux(id_membre)');
    
    connection.release();
    console.log('📋 Tables créées avec succès');
    
    // Insertion des données de démonstration
    await insertDemoData();
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error.message);
  }
};

// Insertion des données de démonstration
const insertDemoData = async () => {
  try {
    const connection = await poolPromise.getConnection();
    
    // Vérifier si des données existent déjà
    const [membresCount] = await connection.execute('SELECT COUNT(*) as count FROM membres');
    if (membresCount[0].count > 0) {
      connection.release();
      console.log('📝 Données de démonstration déjà présentes');
      return;
    }
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Insertion du compte administrateur
    await connection.execute(`
      INSERT INTO comptes (email, mot_de_passe, role) VALUES (?, ?, ?)
    `, ['admin@ljmdi.com', hashedPassword, 'admin']);
    
    // Insertion de membres de démonstration
    await connection.execute(`
      INSERT INTO membres (nom, prenom, email, telephone, date_adhesion, statut, profession) VALUES 
      ('Muzandwa', 'Salman', 'salman@ljmdi.com', '0812345678', '2024-01-15', 'Actif', 'Développeur'),
      ('Dupont', 'Jean', 'jean@ljmdi.com', '0823456789', '2024-02-20', 'Actif', 'Comptable'),
      ('Martin', 'Marie', 'marie@ljmdi.com', '0834567890', '2024-03-10', 'Régulier', 'Enseignante'),
      ('Bernard', 'Pierre', 'pierre@ljmdi.com', '0845678901', '2024-04-05', 'Actif', 'Médecin'),
      ('Petit', 'Sophie', 'sophie@ljmdi.com', '0856789012', '2024-05-12', 'Inactif', 'Avocate')
    `);
    
    // Insertion d'activités de démonstration
    await connection.execute(`
      INSERT INTO activites (titre, type, description, date_debut, date_fin, lieu) VALUES 
      ('Réunion mensuelle', 'Réunion', 'Réunion ordinaire des membres', '2024-12-15 10:00:00', '2024-12-15 12:00:00', 'Siège social'),
      ('Atelier de formation', 'Formation', 'Formation sur la gestion d\'association', '2024-12-20 09:00:00', '2024-12-20 17:00:00', 'Centre de formation'),
      ('Assemblée générale', 'Assemblée', 'Assemblée générale annuelle', '2024-12-25 14:00:00', '2024-12-25 18:00:00', 'Salle des fêtes')
    `);
    
    // Insertion de cotisations de démonstration
    await connection.execute(`
      INSERT INTO cotisations (id_membre, type_cotisation, montant, date_paiement, statut_paiement) VALUES 
      (1, 'Hebdomadaire', 10.00, '2024-12-01', 'Payé'),
      (2, 'Hebdomadaire', 10.00, '2024-12-01', 'Payé'),
      (3, 'Annuelle', 100.00, '2024-01-15', 'Payé'),
      (4, 'Spéciale', 50.00, '2024-11-15', 'Payé')
    `);
    
    connection.release();
    console.log('🎯 Données de démonstration insérées avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données de démonstration:', error.message);
  }
};

module.exports = {
  pool: poolPromise,
  initDatabase,
  testConnection
};
