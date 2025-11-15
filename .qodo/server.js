// LJMDI\.qodo\server.js

// 1. Importation des dépendances
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');

// Clé secrète pour les jetons JWT (À CHANGER pour la production !)
const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_tres_sure';

// 2. Configuration de l'application Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// 3. Configuration de la Base de Données (SQLite)
const db = new sqlite3.Database('./ljmdi.db', (err) => {
    if (err) {
        console.error('Erreur lors de la connexion à SQLite:', err.message);
        process.exit(1); // Arrêter le serveur si la base de données n'est pas accessible
    }
    console.log('Connexion à SQLite réussie !');
});

// Fonction pour générer un member_id unique
const generateMemberId = () => {
    const prefix = 'LJMDI';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
};

// Création des tables si elles n'existent pas
db.serialize(() => {
    // Table users
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id TEXT UNIQUE NOT NULL,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'membre',
        telephone TEXT,
        profession TEXT,
        photo_url TEXT,
        date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Vérifier et ajouter les colonnes manquantes
    db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
            console.error('Erreur lors de la vérification des colonnes:', err);
            return;
        }
        
        const hasMemberIdColumn = columns.some(col => col.name === 'member_id');
        const hasPhotoUrlColumn = columns.some(col => col.name === 'photo_url');
        
        // Ajouter la colonne member_id si elle n'existe pas
        if (!hasMemberIdColumn) {
            db.run(`ALTER TABLE users ADD COLUMN member_id TEXT`, (err) => {
                if (err) {
                    console.error('Erreur lors de l\'ajout de la colonne member_id:', err);
                } else {
                    console.log('Colonne member_id ajoutée avec succès');
                    updateExistingMembers();
                }
            });
        } else {
            console.log('Colonne member_id existe déjà');
            updateExistingMembers();
        }
        
        // Ajouter la colonne photo_url si elle n'existe pas
        if (!hasPhotoUrlColumn) {
            db.run(`ALTER TABLE users ADD COLUMN photo_url TEXT`, (err) => {
                if (err) {
                    console.error('Erreur lors de l\'ajout de la colonne photo_url:', err);
                } else {
                    console.log('Colonne photo_url ajoutée avec succès');
                }
            });
        } else {
            console.log('Colonne photo_url existe déjà');
        }
    });

    // Fonction pour mettre à jour les membres existants
    function updateExistingMembers() {
        // Mettre à jour chaque enregistrement sans member_id avec un ID unique
        db.all(`SELECT id FROM users WHERE member_id IS NULL OR member_id = ''`, (err, rows) => {
            if (err) {
                console.error('Erreur lors de la recherche des membres sans member_id:', err);
                return;
            }
            
            if (rows.length > 0) {
                console.log(`Mise à jour de ${rows.length} membres avec des member_id uniques`);
                
                rows.forEach((row, index) => {
                    const memberId = generateMemberId();
                    db.run(`UPDATE users SET member_id = ? WHERE id = ?`, [memberId, row.id], (err) => {
                        if (err) {
                            console.error(`Erreur lors de la mise à jour du membre ${row.id}:`, err);
                        } else {
                            console.log(`Membre ${row.id} mis à jour avec ID: ${memberId}`);
                        }
                    });
                });
            } else {
                console.log('Tous les membres ont déjà un member_id');
            }
        });
    }

    // Table documents
    db.run(`CREATE TABLE IF NOT EXISTS documents (
        id_document INTEGER PRIMARY KEY AUTOINCREMENT,
        titre TEXT NOT NULL,
        type_document TEXT,
        description TEXT,
        date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
        auteur TEXT,
        fichier_url TEXT
    )`);

    // Table contributions
    db.run(`CREATE TABLE IF NOT EXISTS contributions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        membre_id INTEGER NOT NULL,
        type_contribution TEXT NOT NULL DEFAULT 'don',
        montant DECIMAL(10,2),
        description TEXT,
        date_contribution DATETIME DEFAULT CURRENT_TIMESTAMP,
        nature TEXT NOT NULL DEFAULT 'financiere',
        statut TEXT DEFAULT 'recu',
        reference TEXT,
        cree_par INTEGER,
        date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (membre_id) REFERENCES users(id),
        FOREIGN KEY (cree_par) REFERENCES users(id)
    )`);

    // Insérer un utilisateur admin par défaut si la table users est vide
    db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
        if (err) {
            console.error('Erreur lors de la vérification des utilisateurs:', err);
            return;
        }
        
        if (row.count === 0) {
            try {
                const hashedPassword = await argon2.hash('adminpassword');
                const adminMemberId = generateMemberId();
                db.run('INSERT INTO users (member_id, nom, prenom, email, password, role) VALUES (?, ?, ?, ?, ?, ?)', 
                    [adminMemberId, 'Muzandwa', 'Salman', 'admin@ljmdi.org', hashedPassword, 'admin'], 
                    (err) => {
                        if (err) {
                            console.error('Erreur lors de la création de l\'utilisateur admin:', err);
                        } else {
                            console.log(`Utilisateur admin créé avec succès (email: admin@ljmdi.org, mot de passe: adminpassword, ID: ${adminMemberId})`);
                        }
                    });
            } catch (error) {
                console.error('Erreur lors du hachage du mot de passe admin:', error);
            }
        }
    });

    // Insérer des documents de démonstration si la table documents est vide
    db.get('SELECT COUNT(*) as count FROM documents', (err, row) => {
        if (err) {
            console.error('Erreur lors de la vérification des documents:', err);
            return;
        }
        
        if (row.count === 0) {
            const demoDocuments = [
                ['Rapport Annuel 2025', 'Rapport', 'Bilan financier et activités de l\'année 2025', 'Muzandwa Salman'],
                ['Statuts de l\'ASBL', 'Document légal', 'Statuts officiels de la LJMDI', 'Présidence'],
                ['Plan d\'Action 2025', 'Planification', 'Objectifs et activités pour l\'année 2025', 'Secrétariat'],
                ['Rapport de Réunion', 'Compte-rendu', 'Réunion du conseil d\'administration - Mars 2025', 'Secrétariat']
            ];
            
            demoDocuments.forEach((doc, index) => {
                db.run('INSERT INTO documents (titre, type_document, description, auteur) VALUES (?, ?, ?, ?)', 
                    doc, (err) => {
                        if (err) {
                            console.error(`Erreur lors de l'insertion du document ${index + 1}:`, err);
                        } else {
                            console.log(`Document de démonstration "${doc[0]}" créé avec succès`);
                        }
                    });
            });
        }
    });

    // Insérer des membres de démonstration supplémentaires
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) {
            console.error('Erreur lors de la vérification des membres:', err);
            return;
        }
        
        if (row.count === 1) { // Seulement l'admin existe
            const demoMembers = [
                ['Kabeya', 'Jean-Pierre', 'kabeya.jean@ljmdi.org', 'membre', '0999888777', 'Enseignant'],
                ['Mukendi', 'Marie', 'mukendi.marie@ljmdi.org', 'membre', '0999777666', 'Infirmière'],
                ['Kasongo', 'Thomas', 'kasongo.thomas@ljmdi.org', 'tresorier', '0999666555', 'Comptable'],
                ['Lukoki', 'Aline', 'lukoki.aline@ljmdi.org', 'secretaire', '0999555444', 'Administratrice']
            ];
            
            const insertMember = async (member, index) => {
                try {
                    const hashedPassword = await argon2.hash('password123');
                    const memberId = generateMemberId();
                    db.run('INSERT INTO users (member_id, nom, prenom, email, role, telephone, profession, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
                        [memberId, ...member, hashedPassword], (err) => {
                            if (err) {
                                console.error(`Erreur lors de l'insertion du membre ${index + 1}:`, err);
                            } else {
                                console.log(`Membre de démonstration "${member[0]} ${member[1]}" créé avec succès (ID: ${memberId})`);
                                
                                // Une fois tous les membres créés, ajouter les données de démonstration
                                if (index === demoMembers.length - 1) {
                                    setTimeout(() => {
                                        addDemoData();
                                    }, 1000);
                                }
                            }
                        });
                } catch (error) {
                    console.error(`Erreur lors du hachage du mot de passe pour ${member[0]}:`, error);
                }
            };
            
            demoMembers.forEach(insertMember);
        } else {
            // Si les membres existent déjà, vérifier si les données de démonstration existent
            checkAndAddDemoData();
        }
    });

    // Fonction pour ajouter les données de démonstration
    function addDemoData() {
        // Ajouter des cotisations de démonstration
        const demoCotisations = [
            { membre_id: 2, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Novembre', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 3, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Novembre', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 4, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Novembre', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 5, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Novembre', annee_cotisation: 2025, statut: 'paye' },
            // Cotisations des mois précédents pour l'évolution
            { membre_id: 2, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Octobre', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 3, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Octobre', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 4, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Octobre', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 5, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Octobre', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 2, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Septembre', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 3, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Septembre', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 4, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Septembre', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 5, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Septembre', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 2, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Août', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 3, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Août', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 4, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Août', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 5, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Août', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 2, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Juillet', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 3, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Juillet', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 4, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Juillet', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 5, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Juillet', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 2, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Juin', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 3, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Juin', annee_cotisation: 2025, statut: 'paye' },
            { membre_id: 4, montant: 50, type_cotisation: 'mensuelle', mois_cotisation: 'Juin', annee_cotisation: 2025, statut: 'paye' },
        ];

        let cotisationsAdded = 0;
        for (const cotisation of demoCotisations) {
            db.run(`
                INSERT INTO cotisations (membre_id, montant, type_cotisation, date_paiement, mois_cotisation, annee_cotisation, statut, cree_par)
                VALUES (?, ?, ?, datetime('now'), ?, ?, ?, 1)
            `, [cotisation.membre_id, cotisation.montant, cotisation.type_cotisation, cotisation.mois_cotisation, cotisation.annee_cotisation, cotisation.statut], 
            function(err) {
                if (err) {
                    console.error(`Erreur lors de l'insertion de la cotisation ${cotisation.membre_id}:`, err);
                } else {
                    cotisationsAdded++;
                    if (cotisationsAdded === demoCotisations.length) {
                        console.log('Démonstration : Cotisations ajoutées avec succès !');
                        addDemoContributions();
                    }
                }
            });
        }

        // Ajouter des contributions de démonstration
        function addDemoContributions() {
            const demoContributions = [
                { membre_id: 2, type_contribution: 'don', montant: 100, nature: 'financiere', description: 'Don pour la mosquée', statut: 'recu' },
                { membre_id: 3, type_contribution: 'soutien', montant: 0, nature: 'service', description: 'Aide lors de l\'événement', statut: 'recu' },
                { membre_id: 4, type_contribution: 'benevolat', montant: 0, nature: 'competence', description: 'Formation pour les jeunes', statut: 'recu' },
                { membre_id: 5, type_contribution: 'campagne', montant: 150, nature: 'financiere', description: 'Campagne Ramadan', statut: 'recu' },
            ];

            let contributionsAdded = 0;
            for (const contribution of demoContributions) {
                db.run(`
                    INSERT INTO contributions (membre_id, type_contribution, montant, description, nature, statut, cree_par)
                    VALUES (?, ?, ?, ?, ?, ?, 1)
                `, [contribution.membre_id, contribution.type_contribution, contribution.montant, contribution.description, contribution.nature, contribution.statut], 
                function(err) {
                    if (err) {
                        console.error(`Erreur lors de l'insertion de la contribution ${contribution.membre_id}:`, err);
                    } else {
                        contributionsAdded++;
                        if (contributionsAdded === demoContributions.length) {
                            console.log('Démonstration : Contributions ajoutées avec succès !');
                        }
                    }
                });
            }
        }
    }

    // Vérifier si les données de démonstration existent déjà
    function checkAndAddDemoData() {
        db.get('SELECT COUNT(*) as count FROM cotisations', (err, row) => {
            if (err) {
                console.error('Erreur lors de la vérification des cotisations:', err);
                return;
            }
            
            if (row.count === 0) {
                addDemoData();
            } else {
                console.log('Les données de démonstration existent déjà');
            }
        });
    }
});

// Données réelles - plus de mode mock

// --- Middleware de Vérification JWT ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Token manquant" }); // Non autorisé
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error("JWT Verification Error:", err);
            return res.status(403).json({ message: "Token invalide ou expiré" }); // Interdit
        }
        req.user = user;
        next();
    });
};


// 4. Définition des Routes API

// Route de base pour vérifier que l'API est vivante
app.get('/', (req, res) => {
    res.status(200).send('API LJMDI en cours d’exécution !');
});

// --- ROUTE 1 : LOGIN ---
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await new Promise((resolve, reject) => {
            db.get('SELECT id, nom, prenom, email, password, role FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        const user = result;

        if (!user) {
            return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
        }

        // Comparer le mot de passe haché
        const passwordMatch = await argon2.verify(user.password, password);

        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
        }

        // Générer le jeton JWT
        const userData = { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom };
        const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' });

        res.json({
            success: true,
            message: 'Connexion réussie',
            token: token,
            user: userData
        });

    } catch (error) {
        console.error('Erreur de connexion:', error.stack);
        res.status(500).json({ success: false, message: 'Erreur serveur lors de la connexion.' });
    }
});


// --- ROUTE 2 : DOCUMENTS (Protégée) ---
app.get('/api/documents', authenticateToken, async (req, res) => {
    try {
        const result = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM documents ORDER BY date_creation DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json(result);
    } catch (error) {
        console.error('Erreur lors de la récupération des documents:', error);
        res.status(500).json({ message: "Erreur lors du chargement des données de documents." });
    }
});


// --- ROUTE 3 : MEMBRES (Protégée) ---
app.get('/api/members', authenticateToken, async (req, res) => {
    try {
        // Exclure le mot de passe pour la sécurité
        const result = await new Promise((resolve, reject) => {
            db.all('SELECT id, member_id, nom, prenom, email, date_creation, role, telephone, profession, photo_url FROM users ORDER BY nom ASC, prenom ASC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json(result);
    } catch (error) {
        console.error('Erreur lors de la récupération des membres:', error);
        res.status(500).json({ message: "Erreur lors du chargement des données des membres." });
    }
});

// --- ROUTE 3A : RECUPERER UN MEMBRE SPECIFIQUE (Protégée) ---
app.get('/api/members/:id', authenticateToken, async (req, res) => {
    try {
        const memberId = req.params.id;
        
        const member = await new Promise((resolve, reject) => {
            db.get('SELECT id, member_id, nom, prenom, email, date_creation, role, telephone, profession, photo_url FROM users WHERE id = ?', 
                [memberId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
        });
        
        if (!member) {
            return res.status(404).json({ message: "Membre non trouvé" });
        }
        
        res.json(member);
    } catch (error) {
        console.error('Erreur lors de la récupération du membre:', error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération du membre" });
    }
});

// --- ROUTE 3D : MODIFIER UN MEMBRE (Protégée) ---
app.put('/api/members/:id', authenticateToken, async (req, res) => {
    try {
        const memberId = req.params.id;
        const { nom, prenom, email, telephone, profession, role, photo_url } = req.body;
        
        // Validation des champs requis
        if (!nom || !prenom || !email) {
            return res.status(400).json({ message: "Les champs nom, prénom et email sont requis" });
        }
        
        // Vérifier si le membre existe
        const existingMember = await new Promise((resolve, reject) => {
            db.get('SELECT id, email FROM users WHERE id = ?', [memberId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!existingMember) {
            return res.status(404).json({ message: "Membre non trouvé" });
        }
        
        // Vérifier si l'email est utilisé par un autre membre
        if (email !== existingMember.email) {
            const emailExists = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, memberId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (emailExists) {
                return res.status(400).json({ message: "Cet email est déjà utilisé par un autre membre" });
            }
        }
        
        // Mettre à jour le membre
        await new Promise((resolve, reject) => {
            db.run('UPDATE users SET nom = ?, prenom = ?, email = ?, telephone = ?, profession = ?, role = ?, photo_url = ? WHERE id = ?', 
                [nom, prenom, email, telephone, profession, role || 'membre', photo_url, memberId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
        });
        
        // Récupérer le membre mis à jour
        const updatedMember = await new Promise((resolve, reject) => {
            db.get('SELECT id, member_id, nom, prenom, email, date_creation, role, telephone, profession, photo_url FROM users WHERE id = ?', 
                [memberId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
        });
        
        res.json({
            message: "Membre modifié avec succès",
            member: updatedMember
        });
        
    } catch (error) {
        console.error('Erreur lors de la modification du membre:', error);
        res.status(500).json({ message: "Erreur serveur lors de la modification du membre" });
    }
});

// --- ROUTE 3B : AJOUTER UN MEMBRE (Protégée) ---
app.post('/api/members', authenticateToken, async (req, res) => {
    try {
        const { nom, prenom, email, telephone, profession, role, password } = req.body;
        
        // Validation des champs requis
        if (!nom || !prenom || !email) {
            return res.status(400).json({ message: "Les champs nom, prénom et email sont requis" });
        }
        
        // Vérifier si l'email existe déjà
        const existingUser = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (existingUser) {
            return res.status(400).json({ message: "Cet email est déjà utilisé" });
        }
        
        // Générer un member_id unique
        const memberId = generateMemberId();
        
        // Hacher le mot de passe
        const hashedPassword = await argon2.hash(password || 'password123');
        
        // Insérer le nouveau membre
        const result = await new Promise((resolve, reject) => {
            db.run('INSERT INTO users (member_id, nom, prenom, email, telephone, profession, role, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
                [memberId, nom, prenom, email, telephone, profession, role || 'membre', hashedPassword], 
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                });
        });
        
        // Récupérer le membre créé (sans le mot de passe)
        const newMember = await new Promise((resolve, reject) => {
            db.get('SELECT id, member_id, nom, prenom, email, date_creation, role, telephone, profession FROM users WHERE id = ?', 
                [result.id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
        });
        
        res.status(201).json({
            message: "Membre ajouté avec succès",
            member: newMember
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'ajout du membre:', error);
        res.status(500).json({ message: "Erreur serveur lors de l'ajout du membre" });
    }
});

// --- ROUTE 3E : SUPPRIMER UN MEMBRE (Protégée) ---
app.delete('/api/members/:id', authenticateToken, async (req, res) => {
    try {
        const memberId = req.params.id;
        
        // Vérifier si le membre existe
        const existingMember = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE id = ?', [memberId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!existingMember) {
            return res.status(404).json({ message: "Membre non trouvé" });
        }
        
        // Supprimer le membre
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM users WHERE id = ?', [memberId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        res.json({ message: "Membre supprimé avec succès" });
        
    } catch (error) {
        console.error('Erreur lors de la suppression du membre:', error);
        res.status(500).json({ message: "Erreur serveur lors de la suppression du membre" });
    }
});

// --- ROUTE 4 : COTISATIONS (Protégée) ---
app.get('/api/cotisations', authenticateToken, async (req, res) => {
    try {
        const { annee, mois, membre_id, statut } = req.query;
        
        let query = `
            SELECT c.*, u.nom, u.prenom, u.email, u.member_id as membre_code,
                   uc.nom as cree_par_nom, uc.prenom as cree_par_prenom
            FROM cotisations c
            LEFT JOIN users u ON c.membre_id = u.id
            LEFT JOIN users uc ON c.cree_par = uc.id
            WHERE 1=1
        `;
        const params = [];
        
        if (annee) {
            query += ' AND c.annee_cotisation = ?';
            params.push(annee);
        }
        if (mois) {
            query += ' AND c.mois_cotisation = ?';
            params.push(mois);
        }
        if (membre_id) {
            query += ' AND c.membre_id = ?';
            params.push(membre_id);
        }
        if (statut) {
            query += ' AND c.statut = ?';
            params.push(statut);
        }
        
        query += ' ORDER BY c.date_paiement DESC';
        
        const result = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        res.json(result);
    } catch (error) {
        console.error('Erreur lors de la récupération des cotisations:', error);
        res.status(500).json({ message: "Erreur lors du chargement des cotisations." });
    }
});

// --- ROUTE 4A : AJOUTER UNE COTISATION (Protégée) ---
app.post('/api/cotisations', authenticateToken, async (req, res) => {
    try {
        const { 
            membre_id, 
            montant, 
            type_cotisation = 'mensuelle',
            date_paiement,
            mois_cotisation,
            annee_cotisation,
            methode_paiement,
            reference_paiement,
            statut = 'paye'
        } = req.body;
        
        // Validation des champs requis
        if (!membre_id || !montant) {
            return res.status(400).json({ message: "Le membre et le montant sont requis" });
        }
        
        // Vérifier si le membre existe
        const memberExists = await new Promise((resolve, reject) => {
            db.get('SELECT id, nom, prenom FROM users WHERE id = ?', [membre_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!memberExists) {
            return res.status(404).json({ message: "Membre non trouvé" });
        }
        
        // Vérifier si la cotisation existe déjà pour le même mois/année
        if (type_cotisation === 'mensuelle' && mois_cotisation && annee_cotisation) {
            const existingCotisation = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM cotisations WHERE membre_id = ? AND mois_cotisation = ? AND annee_cotisation = ? AND type_cotisation = ?', 
                    [membre_id, mois_cotisation, annee_cotisation, type_cotisation], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
            });
            
            if (existingCotisation) {
                return res.status(400).json({ message: "Une cotisation existe déjà pour ce mois et cette année" });
            }
        }
        
        // Récupérer l'ID de l'utilisateur connecté
        const userId = req.user.id;
        
        // Insérer la cotisation
        const result = await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO cotisations (
                    membre_id, montant, type_cotisation, date_paiement, 
                    mois_cotisation, annee_cotisation, methode_paiement, 
                    reference_paiement, statut, cree_par
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                membre_id, montant, type_cotisation, date_paiement || new Date().toISOString(),
                mois_cotisation, annee_cotisation, methode_paiement, 
                reference_paiement, statut, userId
            ], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
        
        // Récupérer la cotisation créée
        const newCotisation = await new Promise((resolve, reject) => {
            db.get(`
                SELECT c.*, u.nom, u.prenom, u.email, u.member_id as membre_code,
                       uc.nom as cree_par_nom, uc.prenom as cree_par_prenom
                FROM cotisations c
                LEFT JOIN users u ON c.membre_id = u.id
                LEFT JOIN users uc ON c.cree_par = uc.id
                WHERE c.id = ?
            `, [result.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        res.status(201).json({
            message: "Cotisation enregistrée avec succès",
            cotisation: newCotisation
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la cotisation:', error);
        res.status(500).json({ message: "Erreur serveur lors de l'ajout de la cotisation" });
    }
});

// --- ROUTE 4D : RECUPERER UNE COTISATION SPECIFIQUE (Protégée) ---
app.get('/api/cotisations/:id', authenticateToken, async (req, res) => {
    try {
        const cotisationId = req.params.id;
        
        const cotisation = await new Promise((resolve, reject) => {
            db.get(`
                SELECT c.*, u.nom, u.prenom, u.email, u.member_id as membre_code,
                       uc.nom as cree_par_nom, uc.prenom as cree_par_prenom
                FROM cotisations c
                LEFT JOIN users u ON c.membre_id = u.id
                LEFT JOIN users uc ON c.cree_par = uc.id
                WHERE c.id = ?
            `, [cotisationId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!cotisation) {
            return res.status(404).json({ message: "Cotisation non trouvée" });
        }
        
        res.json(cotisation);
    } catch (error) {
        console.error('Erreur lors de la récupération de la cotisation:', error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération de la cotisation" });
    }
});

// --- ROUTE 4B : STATISTIQUES DES COTISATIONS (Protégée) ---
app.get('/api/cotisations/stats', authenticateToken, async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        
        // Total des cotisations cette année
        const totalAnnee = await new Promise((resolve, reject) => {
            db.get('SELECT COALESCE(SUM(montant), 0) as total FROM cotisations WHERE annee_cotisation = ?', 
                [currentYear], (err, row) => {
                    if (err) reject(err);
                    else resolve(row.total);
                });
        });
        
        // Nombre de cotisations ce mois
        const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long' });
        const totalMois = await new Promise((resolve, reject) => {
            db.get('SELECT COALESCE(SUM(montant), 0) as total, COUNT(*) as count FROM cotisations WHERE mois_cotisation = ? AND annee_cotisation = ?', 
                [currentMonth, currentYear], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
        });
        
        // Membres en règle vs en retard
        const membresStatut = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    COUNT(CASE WHEN statut = 'paye' THEN 1 END) as payes,
                    COUNT(CASE WHEN statut = 'impaye' THEN 1 END) as impayes,
                    COUNT(*) as total
                FROM cotisations 
                WHERE mois_cotisation = ? AND annee_cotisation = ?
            `, [currentMonth, currentYear], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        // Dernières cotisations
        const dernieresCotisations = await new Promise((resolve, reject) => {
            db.all(`
                SELECT c.*, u.nom, u.prenom
                FROM cotisations c
                LEFT JOIN users u ON c.membre_id = u.id
                ORDER BY c.date_paiement DESC
                LIMIT 5
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        res.json({
            totalAnnee,
            totalMois: totalMois.total || 0,
            nombreMois: totalMois.count || 0,
            membresStatut,
            dernieresCotisations,
            moisActuel: currentMonth,
            anneeActuelle: currentYear
        });
        
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ message: "Erreur lors du chargement des statistiques" });
    }
});

// --- ROUTE 4C : SUPPRIMER UNE COTISATION (Protégée) ---
app.delete('/api/cotisations/:id', authenticateToken, async (req, res) => {
    try {
        const cotisationId = req.params.id;
        
        // Vérifier si la cotisation existe
        const existingCotisation = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM cotisations WHERE id = ?', [cotisationId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!existingCotisation) {
            return res.status(404).json({ message: "Cotisation non trouvée" });
        }
        
        // Supprimer la cotisation
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM cotisations WHERE id = ?', [cotisationId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        res.json({ message: "Cotisation supprimée avec succès" });
        
    } catch (error) {
        console.error('Erreur lors de la suppression de la cotisation:', error);
        res.status(500).json({ message: "Erreur serveur lors de la suppression de la cotisation" });
    }
});

// --- ROUTE 5 : CONTRIBUTIONS (Protégée) ---
app.get('/api/contributions', authenticateToken, async (req, res) => {
    try {
        const { annee, type_contribution, membre_id, statut } = req.query;
        
        let query = `
            SELECT c.*, u.nom, u.prenom, u.email, u.member_id as membre_code,
                   uc.nom as cree_par_nom, uc.prenom as cree_par_prenom
            FROM contributions c
            LEFT JOIN users u ON c.membre_id = u.id
            LEFT JOIN users uc ON c.cree_par = uc.id
            WHERE 1=1
        `;
        const params = [];
        
        if (annee) {
            query += ' AND strftime("%Y", c.date_contribution) = ?';
            params.push(annee);
        }
        if (type_contribution) {
            query += ' AND c.type_contribution = ?';
            params.push(type_contribution);
        }
        if (membre_id) {
            query += ' AND c.membre_id = ?';
            params.push(membre_id);
        }
        if (statut) {
            query += ' AND c.statut = ?';
            params.push(statut);
        }
        
        query += ' ORDER BY c.date_contribution DESC';
        
        const result = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        res.json(result);
    } catch (error) {
        console.error('Erreur lors de la récupération des contributions:', error);
        res.status(500).json({ message: "Erreur lors du chargement des contributions." });
    }
});

// --- ROUTE 5A : AJOUTER UNE CONTRIBUTION (Protégée) ---
app.post('/api/contributions', authenticateToken, async (req, res) => {
    try {
        const { 
            membre_id, 
            type_contribution = 'don',
            montant,
            description,
            date_contribution,
            nature = 'financiere',
            statut = 'recu',
            reference
        } = req.body;
        
        // Validation des champs requis
        if (!membre_id) {
            return res.status(400).json({ message: "Le membre est requis" });
        }
        
        // Validation pour les contributions financières
        if (nature === 'financiere' && !montant) {
            return res.status(400).json({ message: "Le montant est requis pour les contributions financières" });
        }
        
        // Vérifier si le membre existe
        const memberExists = await new Promise((resolve, reject) => {
            db.get('SELECT id, nom, prenom FROM users WHERE id = ?', [membre_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!memberExists) {
            return res.status(404).json({ message: "Membre non trouvé" });
        }
        
        // Récupérer l'ID de l'utilisateur connecté
        const userId = req.user.id;
        
        // Insérer la contribution
        const result = await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO contributions (
                    membre_id, type_contribution, montant, description, date_contribution, 
                    nature, statut, reference, cree_par
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                membre_id, type_contribution, montant, description, date_contribution || new Date().toISOString(),
                nature, statut, reference, userId
            ], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
        
        // Récupérer la contribution créée
        const newContribution = await new Promise((resolve, reject) => {
            db.get(`
                SELECT c.*, u.nom, u.prenom, u.email, u.member_id as membre_code,
                       uc.nom as cree_par_nom, uc.prenom as cree_par_prenom
                FROM contributions c
                LEFT JOIN users u ON c.membre_id = u.id
                LEFT JOIN users uc ON c.cree_par = uc.id
                WHERE c.id = ?
            `, [result.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        res.status(201).json({
            message: "Contribution enregistrée avec succès",
            contribution: newContribution
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la contribution:', error);
        res.status(500).json({ message: "Erreur serveur lors de l'ajout de la contribution" });
    }
});

// --- ROUTE 5D : RECUPERER UNE CONTRIBUTION SPECIFIQUE (Protégée) ---
app.get('/api/contributions/:id', authenticateToken, async (req, res) => {
    try {
        const contributionId = req.params.id;
        
        const contribution = await new Promise((resolve, reject) => {
            db.get(`
                SELECT c.*, u.nom, u.prenom, u.email, u.member_id as membre_code,
                       uc.nom as cree_par_nom, uc.prenom as cree_par_prenom
                FROM contributions c
                LEFT JOIN users u ON c.membre_id = u.id
                LEFT JOIN users uc ON c.cree_par = uc.id
                WHERE c.id = ?
            `, [contributionId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!contribution) {
            return res.status(404).json({ message: "Contribution non trouvée" });
        }
        
        res.json(contribution);
    } catch (error) {
        console.error('Erreur lors de la récupération de la contribution:', error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération de la contribution" });
    }
});

// --- ROUTE 5B : STATISTIQUES DES CONTRIBUTIONS (Protégée) ---
app.get('/api/contributions/stats', authenticateToken, async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        
        // Total des contributions financières cette année
        const totalAnnee = await new Promise((resolve, reject) => {
            db.get('SELECT COALESCE(SUM(montant), 0) as total FROM contributions WHERE nature = "financiere" AND strftime("%Y", date_contribution) = ?', 
                [currentYear], (err, row) => {
                    if (err) reject(err);
                    else resolve(row.total);
                });
        });
        
        // Nombre total de contributions
        const totalContributions = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM contributions WHERE strftime("%Y", date_contribution) = ?', 
                [currentYear], (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count);
                });
        });
        
        // Total des dons financiers
        const totalDons = await new Promise((resolve, reject) => {
            db.get('SELECT COALESCE(SUM(montant), 0) as total FROM contributions WHERE type_contribution = "don" AND nature = "financiere" AND strftime("%Y", date_contribution) = ?', 
                [currentYear], (err, row) => {
                    if (err) reject(err);
                    else resolve(row.total);
                });
        });
        
        // Total des contributions de bénévolat
        const totalBenevolat = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM contributions WHERE type_contribution = "benevolat" AND strftime("%Y", date_contribution) = ?', 
                [currentYear], (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count);
                });
        });
        
        res.json({
            totalAnnee,
            totalContributions,
            totalDons,
            totalBenevolat,
            anneeActuelle: currentYear
        });
        
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ message: "Erreur lors du chargement des statistiques" });
    }
});

// --- ROUTE 5C : SUPPRIMER UNE CONTRIBUTION (Protégée) ---
app.delete('/api/contributions/:id', authenticateToken, async (req, res) => {
    try {
        const contributionId = req.params.id;
        
        // Vérifier si la contribution existe
        const existingContribution = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM contributions WHERE id = ?', [contributionId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!existingContribution) {
            return res.status(404).json({ message: "Contribution non trouvée" });
        }
        
        // Supprimer la contribution
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM contributions WHERE id = ?', [contributionId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        res.json({ message: "Contribution supprimée avec succès" });
        
    } catch (error) {
        console.error('Erreur lors de la suppression de la contribution:', error);
        res.status(500).json({ message: "Erreur serveur lors de la suppression de la contribution" });
    }
});


// --- ROUTE 4 : DASHBOARD STATS (Protégée) ---
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long' });
        
        // Requêtes de comptage réelles
        const totalMembersResult = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        const totalDocumentsResult = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM documents', (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // Total trésorerie (cotisations + contributions financières cette année)
        const totalCotisationsResult = await new Promise((resolve, reject) => {
            db.get('SELECT COALESCE(SUM(montant), 0) as total FROM cotisations WHERE annee_cotisation = ? AND statut = "paye"', 
                [currentYear], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
        });

        const totalContributionsResult = await new Promise((resolve, reject) => {
            db.get('SELECT COALESCE(SUM(montant), 0) as total FROM contributions WHERE nature = "financiere" AND statut = "recu" AND strftime("%Y", date_contribution) = ?', 
                [currentYear], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
        });

        // Contributions du mois en cours
        const contributionsMoisResult = await new Promise((resolve, reject) => {
            db.get('SELECT COALESCE(SUM(montant), 0) as total FROM cotisations WHERE mois_cotisation = ? AND annee_cotisation = ? AND statut = "paye"', 
                [currentMonth, currentYear], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
        });

        // Évolution des contributions (6 derniers mois)
        const contributionsEvolution = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const mois = date.toLocaleDateString('fr-FR', { month: 'short' });
            const annee = date.getFullYear();
            
            const montantMois = await new Promise((resolve, reject) => {
                db.get('SELECT COALESCE(SUM(montant), 0) as total FROM cotisations WHERE strftime("%Y-%m", date_paiement) = ? AND statut = "paye"', 
                    [`${annee}-${String(date.getMonth() + 1).padStart(2, '0')}`], (err, row) => {
                        if (err) reject(err);
                        else resolve(row.total);
                    });
            });
            
            contributionsEvolution.push({ mois, montant: parseFloat(montantMois) });
        }

        // Répartition des statuts de cotisations
        const membresPayes = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(DISTINCT membre_id) as count FROM cotisations WHERE mois_cotisation = ? AND annee_cotisation = ? AND statut = "paye"', 
                [currentMonth, currentYear], (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count);
                });
        });

        const membresEnRetard = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(DISTINCT u.id) as count FROM users u LEFT JOIN cotisations c ON u.id = c.membre_id AND c.mois_cotisation = ? AND c.annee_cotisation = ? WHERE u.role = "membre" AND c.id IS NULL', 
                [currentMonth, currentYear], (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count);
                });
        });

        const totalMembres = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM users WHERE role = "membre"', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        // Calcul du taux de participation
        const tauxParticipation = totalMembres.count > 0 ? Math.round((membresPayes / totalMembres.count) * 100) : 0;

        // Alertes
        const alertes = [];
        if (membresEnRetard > 0) {
            alertes.push({ 
                message: `${membresEnRetard} cotisations en retard ce mois-ci`, 
                date: "Ce mois", 
                type: "Attention" 
            });
        }

        // Nouveaux membres (30 derniers jours)
        const nouveauxMembres = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM users WHERE date_creation >= date("now", "-30 days")', 
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count);
                });
        });

        const totalMembers = totalMembersResult.count;
        const totalDocuments = totalDocumentsResult.count;
        const tresorerie = parseFloat(totalCotisationsResult.total) + parseFloat(totalContributionsResult.total);
        const contributionsMois = parseFloat(contributionsMoisResult.total);

        const repartitionStatuts = [
            { name: 'Payé', value: membresPayes },
            { name: 'Retard', value: membresEnRetard },
            { name: 'Exempt', value: 0 }, // Pourrait être implémenté plus tard
        ];

        res.json({
            membresActifs: totalMembers,
            nouveauxMembres: nouveauxMembres,
            tresorerie: tresorerie,
            contributionsMois: contributionsMois,
            activitesMois: totalDocuments,
            activitesAvenir: 2, // Pourrait être implémenté plus tard
            tauxParticipation: tauxParticipation,
            contributionsEvolution: contributionsEvolution,
            repartitionStatuts: repartitionStatuts,
            alertes: alertes
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques du dashboard:', error);
        res.status(500).json({ message: "Erreur serveur lors du chargement des statistiques." });
    }
});


// --- ROUTE 5 : USER PROFILE (Protégée) ---
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const result = await new Promise((resolve, reject) => {
            db.get('SELECT id, nom, prenom, email, telephone, profession, role, date_creation FROM users WHERE id = ?', [req.user.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!result) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Ajouter des données supplémentaires pour le profil
        const profileData = {
            ...result,
            statut: 'Actif', // Statut par défaut
            adresse: '', // Champ vide pour l'instant
            date_adhesion: result.date_creation,
            derniere_connexion: new Date().toISOString()
        };

        res.json(profileData);
    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        res.status(500).json({ message: "Erreur lors du chargement du profil." });
    }
});

// --- ROUTE 6 : USER STATS (Protégée) ---
app.get('/api/user/stats', authenticateToken, async (req, res) => {
    try {
        // Statistiques fictives pour l'instant (peuvent être remplacées par des vraies requêtes)
        const stats = {
            totalContributions: 250,
            totalPresences: 12,
            tauxParticipation: 85,
            activitesParticipees: 8,
            activitesRecentess: [
                { titre: 'Réunion mensuelle', date: '2025-11-10', statut: 'Présent' },
                { titre: 'Atelier de formation', date: '2025-11-05', statut: 'Présent' },
                { titre: 'Assemblée générale', date: '2025-10-28', statut: 'Présent' }
            ]
        };

        res.json(stats);
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques utilisateur:', error);
        res.status(500).json({ message: "Erreur lors du chargement des statistiques." });
    }
});

// --- ROUTE 7 : UPDATE USER PROFILE (Protégée) ---
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const { nom, prenom, email, telephone, adresse, profession } = req.body;
        
        await new Promise((resolve, reject) => {
            db.run('UPDATE users SET nom = ?, prenom = ?, email = ?, telephone = ?, profession = ? WHERE id = ?', 
                [nom, prenom, email, telephone, profession, req.user.id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({ message: "Profil mis à jour avec succès" });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        res.status(500).json({ message: "Erreur lors de la mise à jour du profil." });
    }
});


// 5. Démarrage du Serveur
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Serveur API démarré sur le port ${PORT}`);
});

