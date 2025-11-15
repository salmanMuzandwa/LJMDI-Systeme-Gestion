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

// GET - Récupérer toutes les contributions
router.get('/', async (req, res) => {
  try {
    const [contributions] = await pool.execute(
      'SELECT co.*, m.nom, m.prenom FROM contributions co JOIN membres m ON co.id_membre = m.id_membre ORDER BY co.date_creation DESC'
    );

    res.json(contributions);
  } catch (error) {
    console.error('Erreur lors de la récupération des contributions:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Récupérer une contribution par son ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [contributions] = await pool.execute(
      'SELECT co.*, m.nom, m.prenom FROM contributions co JOIN membres m ON co.id_membre = m.id_membre WHERE co.id_contribution = ?',
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

// GET - Récupérer les contributions d'un membre
router.get('/member/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const [contributions] = await pool.execute(
      'SELECT * FROM contributions WHERE id_membre = ? ORDER BY date_creation DESC',
      [memberId]
    );

    res.json(contributions);
  } catch (error) {
    console.error('Erreur lors de la récupération des contributions du membre:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST - Créer une nouvelle contribution
router.post('/', [
  body('id_membre').isInt(),
  body('type_contribution').isIn(['Hebdomadaire', 'Spéciale', 'Annuelle']),
  body('montant').isDecimal(),
  body('date_paiement').isISO8601(),
  body('statut_paiement').isIn(['Payé', 'En Retard', 'En Attente'])
], handleValidationErrors, async (req, res) => {
  try {
    const { id_membre, type_contribution, montant, date_paiement, statut_paiement, description } = req.body;

    // Vérifier si le membre existe
    const [membres] = await pool.execute(
      'SELECT id_membre FROM membres WHERE id_membre = ?',
      [id_membre]
    );

    if (membres.length === 0) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    const [result] = await pool.execute(
      'INSERT INTO contributions (id_membre, type_contribution, montant, date_paiement, statut_paiement, description) VALUES (?, ?, ?, ?, ?, ?)',
      [id_membre, type_contribution, montant, date_paiement, statut_paiement, description || null]
    );

    // Récupérer la contribution créée
    const [newContribution] = await pool.execute(
      'SELECT co.*, m.nom, m.prenom FROM contributions co JOIN membres m ON co.id_membre = m.id_membre WHERE co.id_contribution = ?',
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

// PUT - Mettre à jour une contribution
router.put('/:id', [
  body('id_membre').isInt(),
  body('type_contribution').isIn(['Hebdomadaire', 'Spéciale', 'Annuelle']),
  body('montant').isDecimal(),
  body('date_paiement').isISO8601(),
  body('statut_paiement').isIn(['Payé', 'En Retard', 'En Attente'])
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { id_membre, type_contribution, montant, date_paiement, statut_paiement, description } = req.body;

    // Vérifier si la contribution existe
    const [existingContributions] = await pool.execute(
      'SELECT id_contribution FROM contributions WHERE id_contribution = ?',
      [id]
    );

    if (existingContributions.length === 0) {
      return res.status(404).json({ message: 'Contribution non trouvée' });
    }

    // Vérifier si le membre existe
    const [membres] = await pool.execute(
      'SELECT id_membre FROM membres WHERE id_membre = ?',
      [id_membre]
    );

    if (membres.length === 0) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    // Mettre à jour la contribution
    await pool.execute(
      'UPDATE contributions SET id_membre = ?, type_contribution = ?, montant = ?, date_paiement = ?, statut_paiement = ?, description = ? WHERE id_contribution = ?',
      [id_membre, type_contribution, montant, date_paiement, statut_paiement, description || null, id]
    );

    // Récupérer la contribution mise à jour
    const [updatedContribution] = await pool.execute(
      'SELECT co.*, m.nom, m.prenom FROM contributions co JOIN membres m ON co.id_membre = m.id_membre WHERE co.id_contribution = ?',
      [id]
    );

    res.json({
      message: 'Contribution mise à jour avec succès',
      contribution: updatedContribution[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la contribution:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE - Supprimer une contribution
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la contribution existe
    const [existingContributions] = await pool.execute(
      'SELECT id_contribution FROM contributions WHERE id_contribution = ?',
      [id]
    );

    if (existingContributions.length === 0) {
      return res.status(404).json({ message: 'Contribution non trouvée' });
    }

    // Supprimer la contribution
    await pool.execute('DELETE FROM contributions WHERE id_contribution = ?', [id]);

    res.json({ message: 'Contribution supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la contribution:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Statistiques des contributions
router.get('/stats/overview', async (req, res) => {
  try {
    // Total des contributions
    const [totalResult] = await pool.execute('SELECT COUNT(*) as total, SUM(montant) as totalMontant FROM contributions WHERE statut_paiement = "Payé"');
    
    // Contributions du mois
    const [moisResult] = await pool.execute(
      'SELECT COUNT(*) as totalMois, SUM(montant) as montantMois FROM contributions WHERE MONTH(date_paiement) = MONTH(CURRENT_DATE()) AND YEAR(date_paiement) = YEAR(CURRENT_DATE()) AND statut_paiement = "Payé"'
    );
    
    // Contributions en retard
    const [retardResult] = await pool.execute(
      'SELECT COUNT(*) as retard FROM contributions WHERE statut_paiement = "En Retard"'
    );

    // Évolution mensuelle (6 derniers mois)
    const [evolutionResult] = await pool.execute(`
      SELECT 
        MONTHNAME(date_paiement) as mois,
        SUM(montant) as montant
      FROM contributions 
      WHERE statut_paiement = "Payé" 
        AND date_paiement >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
      GROUP BY MONTH(date_paiement), YEAR(date_paiement)
      ORDER BY YEAR(date_paiement), MONTH(date_paiement)
    `);

    res.json({
      total: totalResult[0].total || 0,
      totalMontant: totalResult[0].totalMontant || 0,
      totalMois: moisResult[0].totalMois || 0,
      montantMois: moisResult[0].montantMois || 0,
      retard: retardResult[0].retard || 0,
      evolution: evolutionResult
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
