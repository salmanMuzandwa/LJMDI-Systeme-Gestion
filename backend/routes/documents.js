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

// GET - Récupérer tous les documents
router.get('/', async (req, res) => {
  try {
    const [documents] = await pool.execute(
      'SELECT * FROM documents ORDER BY date_creation DESC'
    );

    res.json(documents);
  } catch (error) {
    console.error('Erreur lors de la récupération des documents:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Récupérer un document par son ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [documents] = await pool.execute(
      'SELECT * FROM documents WHERE id_document = ?',
      [id]
    );

    if (documents.length === 0) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    res.json(documents[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du document:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST - Créer un nouveau document
router.post('/', [
  body('nom_fichier').notEmpty().trim(),
  body('type_document').isIn(['Rapport', 'PV', 'Règlement', 'Communication', 'Autre']),
  body('chemin_fichier').notEmpty().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { nom_fichier, type_document, chemin_fichier, taille_fichier, description } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO documents (nom_fichier, type_document, chemin_fichier, taille_fichier, description) VALUES (?, ?, ?, ?, ?)',
      [nom_fichier, type_document, chemin_fichier, taille_fichier || null, description || null]
    );

    // Récupérer le document créé
    const [newDocument] = await pool.execute(
      'SELECT * FROM documents WHERE id_document = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Document créé avec succès',
      document: newDocument[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création du document:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT - Mettre à jour un document
router.put('/:id', [
  body('nom_fichier').notEmpty().trim(),
  body('type_document').isIn(['Rapport', 'PV', 'Règlement', 'Communication', 'Autre']),
  body('chemin_fichier').notEmpty().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_fichier, type_document, chemin_fichier, taille_fichier, description } = req.body;

    // Vérifier si le document existe
    const [existingDocuments] = await pool.execute(
      'SELECT id_document FROM documents WHERE id_document = ?',
      [id]
    );

    if (existingDocuments.length === 0) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    // Mettre à jour le document
    await pool.execute(
      'UPDATE documents SET nom_fichier = ?, type_document = ?, chemin_fichier = ?, taille_fichier = ?, description = ? WHERE id_document = ?',
      [nom_fichier, type_document, chemin_fichier, taille_fichier || null, description || null, id]
    );

    // Récupérer le document mis à jour
    const [updatedDocument] = await pool.execute(
      'SELECT * FROM documents WHERE id_document = ?',
      [id]
    );

    res.json({
      message: 'Document mis à jour avec succès',
      document: updatedDocument[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du document:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE - Supprimer un document
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le document existe
    const [existingDocuments] = await pool.execute(
      'SELECT id_document FROM documents WHERE id_document = ?',
      [id]
    );

    if (existingDocuments.length === 0) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    // Supprimer le document
    await pool.execute('DELETE FROM documents WHERE id_document = ?', [id]);

    res.json({ message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Statistiques des documents
router.get('/stats/overview', async (req, res) => {
  try {
    // Total des documents
    const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM documents');
    
    // Répartition par type
    const [typeStats] = await pool.execute(
      'SELECT type_document, COUNT(*) as count FROM documents GROUP BY type_document'
    );

    res.json({
      total: totalResult[0].total,
      byType: typeStats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
