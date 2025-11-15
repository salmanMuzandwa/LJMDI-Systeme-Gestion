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

// GET - Récupérer tous les cas sociaux
router.get('/', async (req, res) => {
  try {
    const [casSociaux] = await pool.execute(
      'SELECT cs.*, m.nom, m.prenom FROM cas_sociaux cs JOIN membres m ON cs.id_membre = m.id_membre ORDER BY cs.date_creation DESC'
    );

    res.json(casSociaux);
  } catch (error) {
    console.error('Erreur lors de la récupération des cas sociaux:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Récupérer un cas social par son ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [casSociaux] = await pool.execute(
      'SELECT cs.*, m.nom, m.prenom FROM cas_sociaux cs JOIN membres m ON cs.id_membre = m.id_membre WHERE cs.id_cas = ?',
      [id]
    );

    if (casSociaux.length === 0) {
      return res.status(404).json({ message: 'Cas social non trouvé' });
    }

    // Récupérer les assistances associées
    const [assistances] = await pool.execute(
      'SELECT * FROM assistances WHERE id_cas = ? ORDER BY date_assistance DESC',
      [id]
    );

    res.json({
      cas: casSociaux[0],
      assistances: assistances
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du cas social:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Récupérer les cas sociaux d'un membre
router.get('/member/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const [casSociaux] = await pool.execute(
      'SELECT * FROM cas_sociaux WHERE id_membre = ? ORDER BY date_creation DESC',
      [memberId]
    );

    res.json(casSociaux);
  } catch (error) {
    console.error('Erreur lors de la récupération des cas sociaux du membre:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST - Créer un nouveau cas social
router.post('/', [
  body('id_membre').isInt(),
  body('type_cas').isIn(['Maladie', 'Décès', 'Accident', 'Mariage', 'Naissance', 'Autre']),
  body('description').notEmpty().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { id_membre, type_cas, description, statut } = req.body;

    // Vérifier si le membre existe
    const [membres] = await pool.execute(
      'SELECT id_membre FROM membres WHERE id_membre = ?',
      [id_membre]
    );

    if (membres.length === 0) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    const [result] = await pool.execute(
      'INSERT INTO cas_sociaux (id_membre, type_cas, description, statut) VALUES (?, ?, ?, ?)',
      [id_membre, type_cas, description, statut || 'Ouvert']
    );

    // Récupérer le cas social créé
    const [newCas] = await pool.execute(
      'SELECT cs.*, m.nom, m.prenom FROM cas_sociaux cs JOIN membres m ON cs.id_membre = m.id_membre WHERE cs.id_cas = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Cas social créé avec succès',
      cas: newCas[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création du cas social:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT - Mettre à jour un cas social
router.put('/:id', [
  body('type_cas').isIn(['Maladie', 'Décès', 'Accident', 'Mariage', 'Naissance', 'Autre']),
  body('description').notEmpty().trim(),
  body('statut').isIn(['Ouvert', 'En Cours', 'Résolu', 'Fermé'])
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { id_membre, type_cas, description, statut } = req.body;

    // Vérifier si le cas social existe
    const [existingCas] = await pool.execute(
      'SELECT id_cas FROM cas_sociaux WHERE id_cas = ?',
      [id]
    );

    if (existingCas.length === 0) {
      return res.status(404).json({ message: 'Cas social non trouvé' });
    }

    // Vérifier si le membre existe
    const [membres] = await pool.execute(
      'SELECT id_membre FROM membres WHERE id_membre = ?',
      [id_membre]
    );

    if (membres.length === 0) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    // Mettre à jour le cas social
    await pool.execute(
      'UPDATE cas_sociaux SET id_membre = ?, type_cas = ?, description = ?, statut = ? WHERE id_cas = ?',
      [id_membre, type_cas, description, statut, id]
    );

    // Récupérer le cas social mis à jour
    const [updatedCas] = await pool.execute(
      'SELECT cs.*, m.nom, m.prenom FROM cas_sociaux cs JOIN membres m ON cs.id_membre = m.id_membre WHERE cs.id_cas = ?',
      [id]
    );

    res.json({
      message: 'Cas social mis à jour avec succès',
      cas: updatedCas[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du cas social:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE - Supprimer un cas social
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le cas social existe
    const [existingCas] = await pool.execute(
      'SELECT id_cas FROM cas_sociaux WHERE id_cas = ?',
      [id]
    );

    if (existingCas.length === 0) {
      return res.status(404).json({ message: 'Cas social non trouvé' });
    }

    // Supprimer les assistances associées d'abord
    await pool.execute('DELETE FROM assistances WHERE id_cas = ?', [id]);

    // Supprimer le cas social
    await pool.execute('DELETE FROM cas_sociaux WHERE id_cas = ?', [id]);

    res.json({ message: 'Cas social supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du cas social:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST - Ajouter une assistance à un cas social
router.post('/:id/assistances', [
  body('montant').isDecimal(),
  body('type_assistance').isIn(['Financière', 'Matérielle', 'Médicale', 'Autre']),
  body('date_assistance').isISO8601(),
  body('statut').isIn(['En Attente', 'Approuvée', 'Refusée', 'Versée'])
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { montant, type_assistance, description, date_assistance, statut } = req.body;

    // Vérifier si le cas social existe
    const [existingCas] = await pool.execute(
      'SELECT id_cas FROM cas_sociaux WHERE id_cas = ?',
      [id]
    );

    if (existingCas.length === 0) {
      return res.status(404).json({ message: 'Cas social non trouvé' });
    }

    const [result] = await pool.execute(
      'INSERT INTO assistances (id_cas, montant, type_assistance, description, date_assistance, statut) VALUES (?, ?, ?, ?, ?, ?)',
      [id, montant, type_assistance, description || null, date_assistance, statut || 'En Attente']
    );

    // Récupérer l'assistance créée
    const [newAssistance] = await pool.execute(
      'SELECT * FROM assistances WHERE id_assistance = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Assistance ajoutée avec succès',
      assistance: newAssistance[0]
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'assistance:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
