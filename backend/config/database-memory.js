const bcrypt = require('bcryptjs');
require('dotenv').config();

// Base de données en mémoire pour le développement
let db = {
  comptes: [],
  membres: [],
  activites: [],
  presences: [],
  contributions: [],
  cotisations: [],
  documents: [],
  cas_sociaux: [],
  assistances: []
};

// Simuler l'auto-incrémentation
let counters = {
  comptes: 1,
  membres: 1,
  activites: 1,
  presences: 1,
  contributions: 1,
  cotisations: 1,
  documents: 1,
  cas_sociaux: 1,
  assistances: 1
};

// Exécuter une requête simulée
const executeQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`🔧 Requête SQL: ${sql}`);
      console.log(`📋 Paramètres:`, params);

      // Parser la requête SQL et retourner des données simulées
      let result = [];

      // SELECT * FROM contributions
      if (sql.includes('SELECT') && sql.includes('contributions') && !sql.includes('WHERE')) {
        result = db.contributions.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
      }

      // SELECT * FROM contributions WHERE id_contribution = ?
      else if (sql.includes('SELECT') && sql.includes('contributions') && sql.includes('id_contribution')) {
        const id = params[0];
        result = db.contributions.filter(c => c.id_contribution == id);
      }

      // INSERT INTO contributions
      else if (sql.includes('INSERT INTO contributions')) {
        const newContribution = {
          id_contribution: counters.contributions++,
          id_membre: params[0],
          type_contribution: params[1],
          montant: params[2],
          devise: params[3] || 'USD',
          date_paiement: params[4],
          statut_paiement: params[5],
          description: params[6],
          date_creation: new Date().toISOString()
        };
        db.contributions.push(newContribution);
        result = [{ insertId: newContribution.id_contribution }];
      }

      // UPDATE contributions
      else if (sql.includes('UPDATE contributions')) {
        const id = params[2];
        const index = db.contributions.findIndex(c => c.id_contribution == id);
        if (index !== -1) {
          db.contributions[index] = {
            ...db.contributions[index],
            montant: params[0],
            devise: params[1] || db.contributions[index].devise
          };
        }
        result = [{ affectedRows: 1 }];
      }

      // DELETE FROM contributions
      else if (sql.includes('DELETE FROM contributions')) {
        const id = params[0];
        const initialLength = db.contributions.length;
        db.contributions = db.contributions.filter(c => c.id_contribution != id);
        result = [{ affectedRows: initialLength - db.contributions.length }];
      }

      // SELECT * FROM presences
      else if (sql.includes('SELECT') && sql.includes('presences') && !sql.includes('WHERE')) {
        result = db.presences.sort((a, b) => new Date(b.date_heure) - new Date(a.date_heure));
      }

      // SELECT * FROM presences WHERE id_presence = ?
      else if (sql.includes('SELECT') && sql.includes('presences') && sql.includes('id_presence')) {
        const id = params[0];
        result = db.presences.filter(p => p.id_presence == id);
      }

      // INSERT INTO presences
      else if (sql.includes('INSERT INTO presences')) {
        const newPresence = {
          id_presence: counters.presences++,
          id_activite: params[0],
          id_membre: params[1],
          statut: params[2],
          date_heure: params[3],
          remarques: params[4] || null
        };
        db.presences.push(newPresence);
        result = [{ insertId: newPresence.id_presence }];
      }

      // UPDATE presences
      else if (sql.includes('UPDATE presences')) {
        const id = params[3];
        const index = db.presences.findIndex(p => p.id_presence == id);
        if (index !== -1) {
          db.presences[index] = {
            ...db.presences[index],
            statut: params[0],
            date_heure: params[1],
            remarques: params[2] || null
          };
        }
        result = [{ affectedRows: 1 }];
      }

      // DELETE FROM presences
      else if (sql.includes('DELETE FROM presences')) {
        const id = params[0];
        const initialLength = db.presences.length;
        db.presences = db.presences.filter(p => p.id_presence != id);
        result = [{ affectedRows: initialLength - db.presences.length }];
      }

      // SELECT * FROM documents
      else if (sql.includes('SELECT') && sql.includes('documents') && !sql.includes('WHERE')) {
        result = db.documents.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
      }

      // SELECT * FROM documents WHERE id_document = ?
      else if (sql.includes('SELECT') && sql.includes('documents') && sql.includes('id_document')) {
        const id = params[0];
        result = db.documents.filter(d => d.id_document == id);
      }

      // INSERT INTO documents
      else if (sql.includes('INSERT INTO documents')) {
        const newDocument = {
          id_document: counters.documents++,
          nom_fichier: params[0],
          type_document: params[1],
          chemin_fichier: params[2],
          taille_fichier: params[3] || null,
          description: params[4] || null,
          date_creation: new Date().toISOString()
        };
        db.documents.push(newDocument);
        result = [{ insertId: newDocument.id_document }];
      }

      // UPDATE documents
      else if (sql.includes('UPDATE documents')) {
        const id = params[5];
        const index = db.documents.findIndex(d => d.id_document == id);
        if (index !== -1) {
          db.documents[index] = {
            ...db.documents[index],
            nom_fichier: params[0],
            type_document: params[1],
            chemin_fichier: params[2],
            taille_fichier: params[3] || null,
            description: params[4] || null
          };
        }
        result = [{ affectedRows: 1 }];
      }

      // DELETE FROM documents
      else if (sql.includes('DELETE FROM documents')) {
        const id = params[0];
        const initialLength = db.documents.length;
        db.documents = db.documents.filter(d => d.id_document != id);
        result = [{ affectedRows: initialLength - db.documents.length }];
      }

      // SELECT * FROM membres
      if (sql.includes('SELECT') && sql.includes('membres') && !sql.includes('WHERE')) {
        result = db.membres.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
      }

      // SELECT * FROM membres WHERE id_membre = ?
      else if (sql.includes('SELECT') && sql.includes('membres') && sql.includes('id_membre')) {
        const id = params[0];
        result = db.membres.filter(m => m.id_membre == id);
      }

      // SELECT * FROM membres WHERE email = ?
      else if (sql.includes('SELECT') && sql.includes('membres') && sql.includes('email')) {
        const email = params[0];
        result = db.membres.filter(m => m.email === email);
      }

      // SELECT * FROM membres WHERE email = ? AND id_membre != ?
      else if (sql.includes('SELECT') && sql.includes('membres') && sql.includes('email') && sql.includes('id_membre !=')) {
        const email = params[0];
        const id = params[1];
        result = db.membres.filter(m => m.email === email && m.id_membre != id);
      }

      // INSERT INTO membres
      else if (sql.includes('INSERT INTO membres')) {
        const newMembre = {
          id_membre: counters.membres++,
          nom: params[0],
          prenom: params[1],
          email: params[2],
          telephone: params[3],
          date_adhesion: params[4],
          statut: params[5],
          adresse: params[6],
          profession: params[7],
          date_creation: new Date().toISOString()
        };
        db.membres.push(newMembre);
        result = [{ insertId: newMembre.id_membre }];
      }

      // UPDATE membres
      else if (sql.includes('UPDATE membres')) {
        const id = params[8];
        const index = db.membres.findIndex(m => m.id_membre == id);
        if (index !== -1) {
          db.membres[index] = {
            ...db.membres[index],
            nom: params[0],
            prenom: params[1],
            email: params[2],
            telephone: params[3],
            date_adhesion: params[4],
            statut: params[5],
            adresse: params[6],
            profession: params[7]
          };
        }
        result = [{ affectedRows: 1 }];
      }

      // DELETE FROM membres
      else if (sql.includes('DELETE FROM membres')) {
        const id = params[0];
        const initialLength = db.membres.length;
        db.membres = db.membres.filter(m => m.id_membre != id);
        result = [{ affectedRows: initialLength - db.membres.length }];
      }

      // SELECT * FROM activites
      if (sql.includes('SELECT') && sql.includes('activites')) {
        result = db.activites.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
      }

      // SELECT * FROM activites WHERE id_activite = ?
      else if (sql.includes('SELECT') && sql.includes('activites') && sql.includes('id_activite')) {
        const id = params[0];
        result = db.activites.filter(a => a.id_activite == id);
      }

      // INSERT INTO activites
      else if (sql.includes('INSERT INTO activites')) {
        const newActivite = {
          id_activite: counters.activites++,
          titre: params[0],
          type: params[1],
          description: params[2],
          date_debut: params[3],
          date_fin: params[4],
          lieu: params[5],
          date_creation: new Date().toISOString()
        };
        db.activites.push(newActivite);
        result = [{ insertId: newActivite.id_activite }];
      }

      // UPDATE activites
      else if (sql.includes('UPDATE activites')) {
        const id = params[6];
        const index = db.activites.findIndex(a => a.id_activite == id);
        if (index !== -1) {
          db.activites[index] = {
            ...db.activites[index],
            titre: params[0],
            type: params[1],
            description: params[2],
            date_debut: params[3],
            date_fin: params[4],
            lieu: params[5]
          };
        }
        result = [{ affectedRows: 1 }];
      }

      // DELETE FROM activites
      else if (sql.includes('DELETE FROM activites')) {
        const id = params[0];
        const initialLength = db.activites.length;
        db.activites = db.activites.filter(a => a.id_activite != id);
        result = [{ affectedRows: initialLength - db.activites.length }];
      }

      // SELECT comptes pour authentification
      else if (sql.includes('SELECT') && sql.includes('comptes') && sql.includes('email')) {
        const email = params[0];
        result = db.comptes.filter(c => c.email === email && c.actif);
        // Ajouter les infos des membres
        result = result.map(c => {
          const membre = db.membres.find(m => m.id_compte == c.id_compte);
          return { ...c, nom: membre?.nom, prenom: membre?.prenom };
        });
      }

      // SELECT comptes par ID
      else if (sql.includes('SELECT') && sql.includes('comptes') && sql.includes('id_compte')) {
        const id = params[0];
        result = db.comptes.filter(c => c.id_compte == id && c.actif);
        result = result.map(c => {
          const membre = db.membres.find(m => m.id_compte == c.id_compte);
          return { ...c, nom: membre?.nom, prenom: membre?.prenom };
        });
      }

      // INSERT INTO comptes
      else if (sql.includes('INSERT INTO comptes')) {
        const newCompte = {
          id_compte: counters.comptes++,
          email: params[0],
          mot_de_passe: params[1],
          role: params[2],
          actif: true,
          date_creation: new Date().toISOString()
        };
        db.comptes.push(newCompte);
        result = [{ insertId: newCompte.id_compte }];
      }

      // INSERT INTO membres
      else if (sql.includes('INSERT INTO membres')) {
        const newMembre = {
          id_membre: counters.membres++,
          nom: params[0],
          prenom: params[1],
          email: params[2],
          telephone: params[3],
          profession: params[4],
          date_adhesion: params[5],
          id_compte: params[6],
          statut: 'Actif',
          date_creation: new Date().toISOString()
        };
        db.membres.push(newMembre);
        result = [{ insertId: newMembre.id_membre }];
      }

      // COUNT queries
      else if (sql.includes('COUNT')) {
        if (sql.includes('membres')) {
          result = [{ count: db.membres.length }];
        } else if (sql.includes('activites')) {
          result = [{ count: db.activites.length }];
        }
      }

      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

// Test de connexion
const testConnection = async () => {
  console.log('✅ Connexion à la base de données mémoire établie');
};

// Initialisation de la base de données
const initDatabase = async () => {
  try {
    console.log('🔧 Initialisation de la base de données mémoire...');

    await testConnection();
    await createTables();
    await insertDemoData();

    console.log('🎉 Base de données mémoire initialisée avec succès');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
  }
};

// Création des tables (simulation)
const createTables = async () => {
  console.log('📋 Création des tables en mémoire...');
  // Les tables sont déjà créées dans l'objet db
};

// Insertion des données de démonstration
const insertDemoData = async () => {
  try {
    console.log('🎯 Insertion des données de démonstration...');

    if (db.comptes.length > 0) {
      console.log('📝 Données de démonstration déjà présentes');
      return;
    }

    // Créer compte admin
    const hashedPassword = await bcrypt.hash('adminpassword', 10);
    const adminCompte = {
      id_compte: counters.comptes++,
      email: 'admin@ljmdi.org',
      mot_de_passe: hashedPassword,
      role: 'admin',
      actif: true,
      date_creation: new Date().toISOString()
    };
    db.comptes.push(adminCompte);

    // Créer membres de démonstration
    const membres = [
      {
        id_membre: counters.membres++,
        nom: 'Muzandwa',
        prenom: 'Salman',
        email: 'salman@ljmdi.com',
        telephone: '0812345678',
        date_adhesion: '2024-01-15',
        statut: 'Actif',
        profession: 'Développeur',
        id_compte: null,
        date_creation: new Date().toISOString()
      },
      {
        id_membre: counters.membres++,
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean@ljmdi.com',
        telephone: '0823456789',
        date_adhesion: '2024-02-20',
        statut: 'Actif',
        profession: 'Comptable',
        id_compte: null,
        date_creation: new Date().toISOString()
      },
      {
        id_membre: counters.membres++,
        nom: 'Martin',
        prenom: 'Marie',
        email: 'marie@ljmdi.com',
        telephone: '0834567890',
        date_adhesion: '2024-03-10',
        statut: 'Régulier',
        profession: 'Enseignante',
        id_compte: null,
        date_creation: new Date().toISOString()
      }
    ];
    db.membres.push(...membres);

    // Créer activités de démonstration
    const activites = [
      {
        id_activite: counters.activites++,
        titre: 'Réunion mensuelle',
        type: 'Réunion',
        description: 'Réunion ordinaire des membres',
        date_debut: '2024-12-15T10:00:00',
        date_fin: '2024-12-15T12:00:00',
        lieu: 'Siège social',
        date_creation: new Date().toISOString()
      },
      {
        id_activite: counters.activites++,
        titre: 'Atelier de formation',
        type: 'Formation',
        description: 'Formation sur la gestion d\'association',
        date_debut: '2024-12-20T09:00:00',
        date_fin: '2024-12-20T17:00:00',
        lieu: 'Centre de formation',
        date_creation: new Date().toISOString()
      },
      {
        id_activite: counters.activites++,
        titre: 'Assemblée générale',
        type: 'Assemblée',
        description: 'Assemblée générale annuelle',
        date_debut: '2024-12-25T14:00:00',
        date_fin: '2024-12-25T18:00:00',
        lieu: 'Salle des fêtes',
        date_creation: new Date().toISOString()
      }
    ];
    db.activites.push(...activites);

    // Créer contributions de démonstration
    const contributions = [
      {
        id_contribution: counters.contributions++,
        id_membre: 1,
        type_contribution: 'Hebdomadaire',
        montant: 10.00,
        devise: 'USD',
        date_paiement: '2024-12-01',
        statut_paiement: 'Payé',
        description: 'Contribution hebdomadaire de décembre',
        date_creation: new Date().toISOString()
      },
      {
        id_contribution: counters.contributions++,
        id_membre: 2,
        type_contribution: 'Spéciale',
        montant: 50.00,
        devise: 'USD',
        date_paiement: '2024-11-15',
        statut_paiement: 'Payé',
        description: 'Contribution spéciale pour événement',
        date_creation: new Date().toISOString()
      },
      {
        id_contribution: counters.contributions++,
        id_membre: 3,
        type_contribution: 'Annuelle',
        montant: 100.00,
        devise: 'USD',
        date_paiement: '2024-01-15',
        statut_paiement: 'Payé',
        description: 'Contribution annuelle 2024',
        date_creation: new Date().toISOString()
      }
    ];
    db.contributions.push(...contributions);

    // Créer présences de démonstration
    const presences = [
      {
        id_presence: counters.presences++,
        id_activite: 1,
        id_membre: 1,
        statut: 'Présent',
        date_heure: '2024-12-15T10:05:00',
        remarques: 'Arrivé à l\'heure'
      },
      {
        id_presence: counters.presences++,
        id_activite: 1,
        id_membre: 2,
        statut: 'Absent',
        date_heure: '2024-12-15T10:05:00',
        remarques: null
      },
      {
        id_presence: counters.presences++,
        id_activite: 2,
        id_membre: 3,
        statut: 'Présent',
        date_heure: '2024-12-20T09:10:00',
        remarques: 'Légèrement en retard'
      }
    ];
    db.presences.push(...presences);

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
