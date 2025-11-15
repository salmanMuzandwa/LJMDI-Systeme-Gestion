const express = require('express');
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

// GET - Récupérer toutes les activités
router.get('/', async (req, res) => {
  try {
    const activites = await executeQuery(
      'SELECT * FROM activites ORDER BY date_creation DESC'
    );
    res.json(activites);
  } catch (error) {
    console.error('Erreur lors de la récupération des activités:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Récupérer une activité par son ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const activites = await executeQuery(
      'SELECT * FROM activites WHERE id_activite = ?',
      [id]
    );

    if (activites.length === 0) {
      return res.status(404).json({ message: 'Activité non trouvée' });
    }

    res.json(activites[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'activité:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST - Créer une nouvelle activité
router.post('/', [
  body('titre').notEmpty().trim(),
  body('type').isIn(['Réunion', 'Séminaire', 'Formation', 'Événement', 'Assemblée', 'Autre']),
  body('date_debut').isISO8601(),
  body('date_fin').isISO8601(),
  body('lieu').notEmpty().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { titre, type, description, date_debut, date_fin, lieu } = req.body;

    const result = await executeQuery(
      'INSERT INTO activites (titre, type, description, date_debut, date_fin, lieu) VALUES (?, ?, ?, ?, ?, ?)',
      [titre, type, description || null, date_debut, date_fin, lieu]
    );

    // Récupérer l'activité créée
    const newActivite = await executeQuery(
      'SELECT * FROM activites WHERE id_activite = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Activité créée avec succès',
      activite: newActivite[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'activité:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT - Mettre à jour une activité
router.put('/:id', [
  body('titre').notEmpty().trim(),
  body('type').isIn(['Réunion', 'Séminaire', 'Formation', 'Événement', 'Assemblée', 'Autre']),
  body('date_debut').isISO8601(),
  body('date_fin').isISO8601(),
  body('lieu').notEmpty().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, type, description, date_debut, date_fin, lieu } = req.body;

    // Vérifier si l'activité existe
    const existingActivites = await executeQuery(
      'SELECT id_activite FROM activites WHERE id_activite = ?',
      [id]
    );

    if (existingActivites.length === 0) {
      return res.status(404).json({ message: 'Activité non trouvée' });
    }

    // Mettre à jour l'activité
    await executeQuery(
      'UPDATE activites SET titre = ?, type = ?, description = ?, date_debut = ?, date_fin = ?, lieu = ? WHERE id_activite = ?',
      [titre, type, description || null, date_debut, date_fin, lieu, id]
    );

    // Récupérer l'activité mise à jour
    const updatedActivite = await executeQuery(
      'SELECT * FROM activites WHERE id_activite = ?',
      [id]
    );

    res.json({
      message: 'Activité mise à jour avec succès',
      activite: updatedActivite[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'activité:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE - Supprimer une activité
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'activité existe
    const existingActivites = await executeQuery(
      'SELECT id_activite FROM activites WHERE id_activite = ?',
      [id]
    );

    if (existingActivites.length === 0) {
      return res.status(404).json({ message: 'Activité non trouvée' });
    }

    // Supprimer l'activité
    await executeQuery('DELETE FROM activites WHERE id_activite = ?', [id]);

    res.json({ message: 'Activité supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'activité:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
