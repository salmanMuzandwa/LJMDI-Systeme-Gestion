const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const router = express.Router();

// Middleware de validation des erreurs
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET - Récupérer toutes les cotisations
router.get('/', async (req, res) => {
  try {
    const [cotisations] = await pool.execute(
      'SELECT co.*, m.nom, m.prenom FROM cotisations co JOIN membres m ON co.id_membre = m.id_membre ORDER BY co.date_creation DESC'
    );

    res.json(cotisations);
  } catch (error) {
    console.error('Erreur lors de la récupération des cotisations:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Récupérer une cotisation par son ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [cotisations] = await pool.execute(
      'SELECT co.*, m.nom, m.prenom FROM cotisations co JOIN membres m ON co.id_membre = m.id_membre WHERE co.id_cotisation = ?',
      [id]
    );

    if (cotisations.length === 0) {
      return res.status(404).json({ message: 'Cotisation non trouvée' });
    }

    res.json(cotisations[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de la cotisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Récupérer les cotisations d'un membre
router.get('/member/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const [cotisations] = await pool.execute(
      'SELECT * FROM cotisations WHERE id_membre = ? ORDER BY date_creation DESC',
      [memberId]
    );

    res.json(cotisations);
  } catch (error) {
    console.error('Erreur lors de la récupération des cotisations du membre:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST - Créer une nouvelle cotisation
router.post('/', [
  body('id_membre').isInt(),
  body('type_cotisation').isIn(['Hebdomadaire', 'Spéciale', 'Annuelle']),
  body('montant').isDecimal(),
  body('date_paiement').isISO8601(),
  body('statut_paiement').isIn(['Payé', 'En Retard', 'En Attente'])
], handleValidationErrors, async (req, res) => {
  try {
    const { id_membre, type_cotisation, montant, date_paiement, statut_paiement } = req.body;

    // Vérifier si le membre existe
    const [membres] = await pool.execute(
      'SELECT id_membre FROM membres WHERE id_membre = ?',
      [id_membre]
    );

    if (membres.length === 0) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    const [result] = await pool.execute(
      'INSERT INTO cotisations (id_membre, type_cotisation, montant, date_paiement, statut_paiement) VALUES (?, ?, ?, ?, ?)',
      [id_membre, type_cotisation, montant, date_paiement, statut_paiement]
    );

    // Récupérer la cotisation créée
    const [newCotisation] = await pool.execute(
      'SELECT co.*, m.nom, m.prenom FROM cotisations co JOIN membres m ON co.id_membre = m.id_membre WHERE co.id_cotisation = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Cotisation créée avec succès',
      cotisation: newCotisation[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création de la cotisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT - Mettre à jour une cotisation
router.put('/:id', [
  body('id_membre').isInt(),
  body('type_cotisation').isIn(['Hebdomadaire', 'Spéciale', 'Annuelle']),
  body('montant').isDecimal(),
  body('date_paiement').isISO8601(),
  body('statut_paiement').isIn(['Payé', 'En Retard', 'En Attente'])
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { id_membre, type_cotisation, montant, date_paiement, statut_paiement } = req.body;

    // Vérifier si la cotisation existe
    const [existingCotisations] = await pool.execute(
      'SELECT id_cotisation FROM cotisations WHERE id_cotisation = ?',
      [id]
    );

    if (existingCotisations.length === 0) {
      return res.status(404).json({ message: 'Cotisation non trouvée' });
    }

    // Vérifier si le membre existe
    const [membres] = await pool.execute(
      'SELECT id_membre FROM membres WHERE id_membre = ?',
      [id_membre]
    );

    if (membres.length === 0) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    // Mettre à jour la cotisation
    await pool.execute(
      'UPDATE cotisations SET id_membre = ?, type_cotisation = ?, montant = ?, date_paiement = ?, statut_paiement = ? WHERE id_cotisation = ?',
      [id_membre, type_cotisation, montant, date_paiement, statut_paiement, id]
    );

    // Récupérer la cotisation mise à jour
    const [updatedCotisation] = await pool.execute(
      'SELECT co.*, m.nom, m.prenom FROM cotisations co JOIN membres m ON co.id_membre = m.id_membre WHERE co.id_cotisation = ?',
      [id]
    );

    res.json({
      message: 'Cotisation mise à jour avec succès',
      cotisation: updatedCotisation[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la cotisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE - Supprimer une cotisation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la cotisation existe
    const [existingCotisations] = await pool.execute(
      'SELECT id_cotisation FROM cotisations WHERE id_cotisation = ?',
      [id]
    );

    if (existingCotisations.length === 0) {
      return res.status(404).json({ message: 'Cotisation non trouvée' });
    }

    // Supprimer la cotisation
    await pool.execute('DELETE FROM cotisations WHERE id_cotisation = ?', [id]);

    res.json({ message: 'Cotisation supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la cotisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
