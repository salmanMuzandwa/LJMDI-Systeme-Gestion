const express = require('express');
const { executeQuery } = require('../config/database-memory');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// GET - Récupérer toutes les présences
router.get('/', authMiddleware, async (req, res) => {
    try {
        const presences = await executeQuery('SELECT * FROM presences ORDER BY date_heure DESC');
        res.json(presences);
    } catch (error) {
        console.error('Erreur lors de la récupération des présences:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// GET - Récupérer une présence par son ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const presences = await executeQuery(
            'SELECT * FROM presences WHERE id_presence = ?',
            [id]
        );

        if (presences.length === 0) {
            return res.status(404).json({ message: 'Présence non trouvée' });
        }

        res.json(presences[0]);
    } catch (error) {
        console.error("Erreur lors de la récupération de la présence:", error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// POST - Enregistrer une présence
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { id_activite, id_membre, statut, date_heure, remarques } = req.body;

        const result = await executeQuery(
            'INSERT INTO presences (id_activite, id_membre, statut, date_heure, remarques) VALUES (?, ?, ?, ?, ?)',
            [id_activite, id_membre, statut || 'Présent', date_heure, remarques || null]
        );

        const newPresence = await executeQuery(
            'SELECT * FROM presences WHERE id_presence = ?',
            [result[0].insertId || result.insertId]
        );

        res.status(201).json({
            message: 'Présence enregistrée avec succès',
            presence: newPresence[0]
        });
    } catch (error) {
        console.error("Erreur lors de l'enregistrement de la présence:", error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// PUT - Mettre à jour une présence
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { statut, date_heure, remarques } = req.body;

        const existing = await executeQuery(
            'SELECT id_presence FROM presences WHERE id_presence = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Présence non trouvée' });
        }

        await executeQuery(
            'UPDATE presences SET statut = ?, date_heure = ?, remarques = ? WHERE id_presence = ?',
            [statut, date_heure, remarques || null, id]
        );

        const updated = await executeQuery(
            'SELECT * FROM presences WHERE id_presence = ?',
            [id]
        );

        res.json({
            message: 'Présence mise à jour avec succès',
            presence: updated[0]
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la présence:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// DELETE - Supprimer une présence
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await executeQuery(
            'SELECT id_presence FROM presences WHERE id_presence = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Présence non trouvée' });
        }

        await executeQuery('DELETE FROM presences WHERE id_presence = ?', [id]);

        res.json({ message: 'Présence supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de la présence:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;
