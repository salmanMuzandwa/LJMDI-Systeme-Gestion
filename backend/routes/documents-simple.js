const express = require('express');
const { executeQuery } = require('../config/database-memory');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET - Récupérer tous les documents
router.get('/', authMiddleware, async (req, res) => {
    try {
        const documents = await executeQuery('SELECT * FROM documents ORDER BY date_creation DESC');
        res.json(documents);
    } catch (error) {
        console.error('Erreur lors de la récupération des documents:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// GET - Récupérer un document par son ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const documents = await executeQuery(
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
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { nom_fichier, type_document, chemin_fichier, taille_fichier, description } = req.body;

        const result = await executeQuery(
            'INSERT INTO documents (nom_fichier, type_document, chemin_fichier, taille_fichier, description) VALUES (?, ?, ?, ?, ?)',
            [nom_fichier, type_document, chemin_fichier, taille_fichier || null, description || null]
        );

        const newDocument = await executeQuery(
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
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { nom_fichier, type_document, chemin_fichier, taille_fichier, description } = req.body;

        const existing = await executeQuery(
            'SELECT id_document FROM documents WHERE id_document = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Document non trouvé' });
        }

        await executeQuery(
            'UPDATE documents SET nom_fichier = ?, type_document = ?, chemin_fichier = ?, taille_fichier = ?, description = ? WHERE id_document = ?',
            [nom_fichier, type_document, chemin_fichier, taille_fichier || null, description || null, id]
        );

        const updated = await executeQuery(
            'SELECT * FROM documents WHERE id_document = ?',
            [id]
        );

        res.json({
            message: 'Document mis à jour avec succès',
            document: updated[0]
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du document:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// DELETE - Supprimer un document
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await executeQuery(
            'SELECT id_document FROM documents WHERE id_document = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Document non trouvé' });
        }

        await executeQuery('DELETE FROM documents WHERE id_document = ?', [id]);

        res.json({ message: 'Document supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du document:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;
