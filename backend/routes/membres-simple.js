const express = require('express');
const { executeQuery } = require('../config/database-memory');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// GET - Récupérer tous les membres
router.get('/', authMiddleware, async (req, res) => {
  try {
    const membres = await executeQuery('SELECT * FROM membres ORDER BY date_creation DESC');
    res.json(membres);
  } catch (error) {
    console.error('Erreur lors de la récupération des membres:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Récupérer un membre par son ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const membres = await executeQuery(
      'SELECT * FROM membres WHERE id_membre = ?',
      [id]
    );

    if (membres.length === 0) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    res.json(membres[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du membre:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST - Créer un nouveau membre
router.post('/', async (req, res) => {
  try {
    const { nom, prenom, email, telephone, date_adhesion, statut, adresse, profession } = req.body;

    // Vérifier si l'email existe déjà
    const existingMembres = await executeQuery(
      'SELECT id_membre FROM membres WHERE email = ?',
      [email]
    );

    if (existingMembres.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const result = await executeQuery(
      'INSERT INTO membres (nom, prenom, email, telephone, date_adhesion, statut, adresse, profession) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nom, prenom, email, telephone || null, date_adhesion, statut, adresse || null, profession || null]
    );

    // Récupérer le membre créé
    const newMembre = await executeQuery(
      'SELECT * FROM membres WHERE id_membre = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Membre créé avec succès',
      membre: newMembre[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création du membre:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT - Mettre à jour un membre
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone, date_adhesion, statut, adresse, profession } = req.body;

    // Vérifier si le membre existe
    const existingMembres = await executeQuery(
      'SELECT id_membre FROM membres WHERE id_membre = ?',
      [id]
    );

    if (existingMembres.length === 0) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    // Mettre à jour le membre
    await executeQuery(
      'UPDATE membres SET nom = ?, prenom = ?, email = ?, telephone = ?, date_adhesion = ?, statut = ?, adresse = ?, profession = ? WHERE id_membre = ?',
      [nom, prenom, email, telephone || null, date_adhesion, statut, adresse || null, profession || null, id]
    );

    // Récupérer le membre mis à jour
    const updatedMembre = await executeQuery(
      'SELECT * FROM membres WHERE id_membre = ?',
      [id]
    );

    res.json({
      message: 'Membre mis à jour avec succès',
      membre: updatedMembre[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du membre:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE - Supprimer un membre
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le membre existe
    const existingMembres = await executeQuery(
      'SELECT id_membre FROM membres WHERE id_membre = ?',
      [id]
    );

    if (existingMembres.length === 0) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    // Supprimer le membre
    await executeQuery('DELETE FROM membres WHERE id_membre = ?', [id]);

    res.json({ message: 'Membre supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du membre:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
