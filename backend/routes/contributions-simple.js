const express = require('express');
const { executeQuery } = require('../config/database-memory');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// GET - Récupérer toutes les contributions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const contributions = await executeQuery('SELECT * FROM contributions ORDER BY date_creation DESC');
    res.json(contributions);
  } catch (error) {
    console.error('Erreur lors de la récupération des contributions:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Récupérer une contribution par son ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const contributions = await executeQuery(
      'SELECT * FROM contributions WHERE id_contribution = ?',
      [id]
    );

    if (contributions.length === 0) {
      return res.status(404).json({ message: 'Contribution non trouvée' });
    }

    res.json(contributions[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de la contribution:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST - Créer une nouvelle contribution
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { id_membre, type_contribution, montant, devise, date_paiement, statut_paiement, description } = req.body;

    const result = await executeQuery(
      'INSERT INTO contributions (id_membre, type_contribution, montant, devise, date_paiement, statut_paiement, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_membre, type_contribution, montant, devise || 'USD', date_paiement, statut_paiement || 'En Attente', description || null]
    );

    // Récupérer la contribution créée
    const newContribution = await executeQuery(
      'SELECT * FROM contributions WHERE id_contribution = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Contribution créée avec succès',
      contribution: newContribution[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création de la contribution:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE - Supprimer une contribution
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la contribution existe
    const existingContributions = await executeQuery(
      'SELECT id_contribution FROM contributions WHERE id_contribution = ?',
      [id]
    );

    if (existingContributions.length === 0) {
      return res.status(404).json({ message: 'Contribution non trouvée' });
    }

    // Supprimer la contribution
    await executeQuery('DELETE FROM contributions WHERE id_contribution = ?', [id]);

    res.json({ message: 'Contribution supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la contribution:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT - Mettre à jour une contribution (montant + devise uniquement)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { montant, devise } = req.body;

    // Vérifier si la contribution existe
    const existing = await executeQuery(
      'SELECT * FROM contributions WHERE id_contribution = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Contribution non trouvée' });
    }

    // Mettre à jour le montant et la devise
    await executeQuery(
      'UPDATE contributions SET montant = ?, devise = ? WHERE id_contribution = ?',
      [montant, devise || existing[0].devise || 'USD', id]
    );

    const updated = await executeQuery(
      'SELECT * FROM contributions WHERE id_contribution = ?',
      [id]
    );

    res.json({
      message: 'Contribution mise à jour avec succès',
      contribution: updated[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la contribution:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
