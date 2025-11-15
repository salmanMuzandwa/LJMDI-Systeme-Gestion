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

// GET - Récupérer toutes les présences
router.get('/', async (req, res) => {
  try {
    const [presences] = await pool.execute(
      'SELECT p.*, m.nom, m.prenom, a.titre as activite_titre FROM presences p JOIN membres m ON p.id_membre = m.id_membre JOIN activites a ON p.id_activite = a.id_activite ORDER BY p.date_heure DESC'
    );

    res.json(presences);
  } catch (error) {
    console.error('Erreur lors de la récupération des présences:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Récupérer les présences d'une activité
router.get('/activity/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    const [presences] = await pool.execute(
      'SELECT p.*, m.nom, m.prenom FROM presences p JOIN membres m ON p.id_membre = m.id_membre WHERE p.id_activite = ? ORDER BY m.nom, m.prenom',
      [activityId]
    );

    res.json(presences);
  } catch (error) {
    console.error('Erreur lors de la récupération des présences de l\'activité:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Récupérer les présences d'un membre
router.get('/member/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const [presences] = await pool.execute(
      'SELECT p.*, a.titre as activite_titre FROM presences p JOIN activites a ON p.id_activite = a.id_activite WHERE p.id_membre = ? ORDER BY p.date_heure DESC',
      [memberId]
    );

    res.json(presences);
  } catch (error) {
    console.error('Erreur lors de la récupération des présences du membre:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST - Enregistrer une présence
router.post('/', [
  body('id_activite').isInt(),
  body('id_membre').isInt(),
  body('statut').isIn(['Présent', 'Absent', 'Retard']),
  body('date_heure').isISO8601()
], handleValidationErrors, async (req, res) => {
  try {
    const { id_activite, id_membre, statut, date_heure, remarques } = req.body;

    // Vérifier si l'activité existe
    const [activites] = await pool.execute(
      'SELECT id_activite FROM activites WHERE id_activite = ?',
      [id_activite]
    );

    if (activites.length === 0) {
      return res.status(404).json({ message: 'Activité non trouvée' });
    }

    // Vérifier si le membre existe
    const [membres] = await pool.execute(
      'SELECT id_membre FROM membres WHERE id_membre = ?',
      [id_membre]
    );

    if (membres.length === 0) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    // Vérifier si la présence existe déjà pour cette activité et ce membre
    const [existingPresences] = await pool.execute(
      'SELECT id_presence FROM presences WHERE id_activite = ? AND id_membre = ?',
      [id_activite, id_membre]
    );

    if (existingPresences.length > 0) {
      return res.status(400).json({ message: 'La présence pour ce membre et cette activité est déjà enregistrée' });
    }

    const [result] = await pool.execute(
      'INSERT INTO presences (id_activite, id_membre, statut, date_heure, remarques) VALUES (?, ?, ?, ?, ?)',
      [id_activite, id_membre, statut, date_heure, remarques || null]
    );

    // Récupérer la présence créée
    const [newPresence] = await pool.execute(
      'SELECT p.*, m.nom, m.prenom, a.titre as activite_titre FROM presences p JOIN membres m ON p.id_membre = m.id_membre JOIN activites a ON p.id_activite = a.id_activite WHERE p.id_presence = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Présence enregistrée avec succès',
      presence: newPresence[0]
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la présence:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT - Mettre à jour une présence
router.put('/:id', [
  body('statut').isIn(['Présent', 'Absent', 'Retard']),
  body('date_heure').isISO8601()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, date_heure, remarques } = req.body;

    // Vérifier si la présence existe
    const [existingPresences] = await pool.execute(
      'SELECT id_presence FROM presences WHERE id_presence = ?',
      [id]
    );

    if (existingPresences.length === 0) {
      return res.status(404).json({ message: 'Présence non trouvée' });
    }

    // Mettre à jour la présence
    await pool.execute(
      'UPDATE presences SET statut = ?, date_heure = ?, remarques = ? WHERE id_presence = ?',
      [statut, date_heure, remarques || null, id]
    );

    // Récupérer la présence mise à jour
    const [updatedPresence] = await pool.execute(
      'SELECT p.*, m.nom, m.prenom, a.titre as activite_titre FROM presences p JOIN membres m ON p.id_membre = m.id_membre JOIN activites a ON p.id_activite = a.id_activite WHERE p.id_presence = ?',
      [id]
    );

    res.json({
      message: 'Présence mise à jour avec succès',
      presence: updatedPresence[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la présence:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE - Supprimer une présence
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la présence existe
    const [existingPresences] = await pool.execute(
      'SELECT id_presence FROM presences WHERE id_presence = ?',
      [id]
    );

    if (existingPresences.length === 0) {
      return res.status(404).json({ message: 'Présence non trouvée' });
    }

    // Supprimer la présence
    await pool.execute('DELETE FROM presences WHERE id_presence = ?', [id]);

    res.json({ message: 'Présence supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la présence:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Statistiques des présences
router.get('/stats/overview', async (req, res) => {
  try {
    // Total des présences
    const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM presences');
    
    // Présents
    const [presentsResult] = await pool.execute(
      'SELECT COUNT(*) as presents FROM presences WHERE statut = "Présent"'
    );
    
    // Absents
    const [absentsResult] = await pool.execute(
      'SELECT COUNT(*) as absents FROM presences WHERE statut = "Absent"'
    );
    
    // En retard
    const [retardResult] = await pool.execute(
      'SELECT COUNT(*) as retard FROM presences WHERE statut = "Retard"'
    );

    // Taux de participation
    const tauxParticipation = totalResult[0].total > 0 
      ? ((presentsResult[0].presents / totalResult[0].total) * 100).toFixed(2)
      : 0;

    res.json({
      total: totalResult[0].total,
      presents: presentsResult[0].presents,
      absents: absentsResult[0].absents,
      retard: retardResult[0].retard,
      tauxParticipation: parseFloat(tauxParticipation)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
