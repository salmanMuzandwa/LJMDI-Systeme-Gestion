const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/database-memory');
const router = express.Router();

// Middleware de validation des erreurs
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Route de connexion
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Recherche de l'utilisateur dans la table des comptes
    const users = await executeQuery(
      'SELECT c.*, m.nom, m.prenom FROM comptes c LEFT JOIN membres m ON c.id_compte = m.id_compte WHERE c.email = ? AND c.actif = TRUE',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.mot_de_passe);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    // Mise à jour de la dernière connexion
    await executeQuery(
      'UPDATE comptes SET derniere_connexion = CURRENT_TIMESTAMP WHERE id_compte = ?',
      [user.id_compte]
    );

    // Génération du token JWT
    const token = jwt.sign(
      { 
        id: user.id_compte, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Construction de l'objet utilisateur à retourner
    const userResponse = {
      id: user.id_compte,
      email: user.email,
      role: user.role,
      nom: user.nom || 'Utilisateur',
      prenom: user.prenom || ''
    };

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route de vérification du token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token non fourni' });
    }

    // Cas spécial : token de développement
    if (token === 'dev-token') {
      const devUser = {
        id: 1,
        email: 'admin@ljmdi.org',
        role: 'admin',
        nom: 'Admin',
        prenom: 'Développement'
      };
      
      return res.json({
        success: true,
        user: devUser
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupération des informations complètes de l'utilisateur
    const users = await executeQuery(
      'SELECT c.*, m.nom, m.prenom FROM comptes c LEFT JOIN membres m ON c.id_compte = m.id_compte WHERE c.id_compte = ? AND c.actif = TRUE',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    const user = users[0];
    const userResponse = {
      id: user.id_compte,
      email: user.email,
      role: user.role,
      nom: user.nom || 'Utilisateur',
      prenom: user.prenom || ''
    };

    res.json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(401).json({ success: false, message: 'Token invalide' });
  }
});

// Route d'inscription (création de compte)
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('nom').notEmpty().trim(),
  body('prenom').notEmpty().trim(),
  body('role').isIn(['admin', 'charge_de_discipline', 'membre'])
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password, nom, prenom, role, telephone, profession } = req.body;

    // Vérification si l'email existe déjà
    const existingUsers = await executeQuery(
      'SELECT id_compte FROM comptes WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
    }

    // Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création du compte
    const compteResult = await executeQuery(
      'INSERT INTO comptes (email, mot_de_passe, role) VALUES (?, ?, ?)',
      [email, hashedPassword, role]
    );

    const idCompte = compteResult.insertId;

    // Insertion dans la table membres
    await executeQuery(
      'INSERT INTO membres (nom, prenom, email, telephone, profession, date_adhesion, id_compte) VALUES (?, ?, ?, ?, ?, CURDATE(), ?)',
      [nom, prenom, email, telephone || null, profession || null, idCompte]
    );

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route de déconnexion (optionnelle - côté client)
router.post('/logout', (req, res) => {
  // Dans une implémentation plus avancée, on pourrait ajouter le token à une liste noire
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

module.exports = router;
