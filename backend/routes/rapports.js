const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();

// GET - Générer un rapport des membres
router.get('/membres', async (req, res) => {
  try {
    const [membres] = await pool.execute(`
      SELECT 
        m.*,
        c.email,
        c.role,
        COUNT(DISTINCT co.id_contribution) as nb_contributions,
        COALESCE(SUM(CASE WHEN co.statut_paiement = 'Payé' THEN co.montant ELSE 0 END), 0) as total_contributions,
        COUNT(DISTINCT ca.id_cotisation) as nb_cotisations,
        COALESCE(SUM(CASE WHEN ca.statut_paiement = 'Payé' THEN ca.montant ELSE 0 END), 0) as total_cotisations,
        COUNT(DISTINCT p.id_presence) as nb_presences,
        COUNT(DISTINCT CASE WHEN p.statut = 'Présent' THEN p.id_presence END) as nb_presences_present
      FROM membres m
      LEFT JOIN comptes c ON m.id_compte = c.id_compte
      LEFT JOIN contributions co ON m.id_membre = co.id_membre
      LEFT JOIN cotisations ca ON m.id_membre = ca.id_membre
      LEFT JOIN presences p ON m.id_membre = p.id_membre
      GROUP BY m.id_membre
      ORDER BY m.nom, m.prenom
    `);

    // Calculer les statistiques globales
    const stats = {
      totalMembres: membres.length,
      membresActifs: membres.filter(m => m.statut === 'Actif').length,
      totalContributions: membres.reduce((sum, m) => sum + parseFloat(m.total_contributions), 0),
      totalCotisations: membres.reduce((sum, m) => sum + parseFloat(m.total_cotisations), 0),
      moyenneParticipation: membres.length > 0 
        ? (membres.reduce((sum, m) => sum + parseInt(m.nb_presences), 0) / membres.length).toFixed(2)
        : 0
    };

    res.json({
      membres,
      stats,
      dateGeneration: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport des membres:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Générer un rapport financier
router.get('/financier', async (req, res) => {
  try {
    // Statistiques des contributions
    const [contribStats] = await pool.execute(`
      SELECT 
        type_contribution,
        COUNT(*) as nombre,
        SUM(montant) as total,
        AVG(montant) as moyenne
      FROM contributions 
      WHERE statut_paiement = 'Payé'
      GROUP BY type_contribution
    `);

    // Statistiques des cotisations
    const [cotisStats] = await pool.execute(`
      SELECT 
        type_cotisation,
        COUNT(*) as nombre,
        SUM(montant) as total,
        AVG(montant) as moyenne
      FROM cotisations 
      WHERE statut_paiement = 'Payé'
      GROUP BY type_cotisation
    `);

    // Évolution mensuelle des contributions
    const [evolutionContrib] = await pool.execute(`
      SELECT 
        MONTHNAME(date_paiement) as mois,
        YEAR(date_paiement) as annee,
        SUM(montant) as total_mensuel
      FROM contributions 
      WHERE statut_paiement = 'Payé' 
        AND date_paiement >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
      GROUP BY YEAR(date_paiement), MONTH(date_paiement)
      ORDER BY annee, MONTH(date_paiement)
    `);

    // Évolution mensuelle des cotisations
    const [evolutionCotis] = await pool.execute(`
      SELECT 
        MONTHNAME(date_paiement) as mois,
        YEAR(date_paiement) as annee,
        SUM(montant) as total_mensuel
      FROM cotisations 
      WHERE statut_paiement = 'Payé' 
        AND date_paiement >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
      GROUP BY YEAR(date_paiement), MONTH(date_paiement)
      ORDER BY annee, MONTH(date_paiement)
    `);

    // Top 10 des contributeurs
    const [topContributeurs] = await pool.execute(`
      SELECT 
        m.nom,
        m.prenom,
        COUNT(co.id_contribution) as nb_contributions,
        SUM(co.montant) as total_contributions
      FROM membres m
      JOIN contributions co ON m.id_membre = co.id_membre
      WHERE co.statut_paiement = 'Payé'
      GROUP BY m.id_membre
      ORDER BY total_contributions DESC
      LIMIT 10
    `);

    // Statistiques globales
    const [globalStats] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN statut_paiement = 'Payé' THEN montant ELSE 0 END) as total_perçu,
        SUM(CASE WHEN statut_paiement = 'En Retard' THEN montant ELSE 0 END) as total_retard,
        SUM(CASE WHEN statut_paiement = 'En Attente' THEN montant ELSE 0 END) as total_attente
      FROM (
        SELECT montant, statut_paiement FROM contributions
        UNION ALL
        SELECT montant, statut_paiement FROM cotisations
      ) as combined
    `);

    res.json({
      statistiques: {
        contributions: contribStats,
        cotisations: cotisStats,
        globales: globalStats[0]
      },
      evolution: {
        contributions: evolutionContrib,
        cotisations: evolutionCotis
      },
      topContributeurs,
      dateGeneration: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport financier:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Générer un rapport des activités
router.get('/activites', async (req, res) => {
  try {
    // Statistiques générales des activités
    const [activitesStats] = await pool.execute(`
      SELECT 
        type,
        COUNT(*) as nombre,
        COUNT(DISTINCT p.id_membre) as participants_uniques,
        AVG(DATEDIFF(date_fin, date_debut)) as duree_moyenne
      FROM activites a
      LEFT JOIN presences p ON a.id_activite = p.id_activite
      GROUP BY type
    `);

    // Liste des activités avec statistiques
    const [activitesDetail] = await pool.execute(`
      SELECT 
        a.*,
        COUNT(p.id_presence) as total_presences,
        COUNT(CASE WHEN p.statut = 'Présent' THEN 1 END) as nb_presents,
        COUNT(CASE WHEN p.statut = 'Absent' THEN 1 END) as nb_absents,
        COUNT(CASE WHEN p.statut = 'Retard' THEN 1 END) as nb_retards,
        ROUND(COUNT(CASE WHEN p.statut = 'Présent' THEN 1 END) * 100.0 / NULLIF(COUNT(p.id_presence), 0), 2) as taux_participation
      FROM activites a
      LEFT JOIN presences p ON a.id_activite = p.id_activite
      GROUP BY a.id_activite
      ORDER BY a.date_debut DESC
    `);

    // Évolution mensuelle du nombre d'activités
    const [evolutionMensuelle] = await pool.execute(`
      SELECT 
        MONTHNAME(date_debut) as mois,
        YEAR(date_debut) as annee,
        COUNT(*) as nb_activites
      FROM activites 
      WHERE date_debut >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
      GROUP BY YEAR(date_debut), MONTH(date_debut)
      ORDER BY annee, MONTH(date_deoi)
    `);

    res.json({
      statistiques: activitesStats,
      activites: activitesDetail,
      evolution: evolutionMensuelle,
      dateGeneration: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport des activités:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Générer un rapport des cas sociaux
router.get('/cas-sociaux', async (req, res) => {
  try {
    // Statistiques générales des cas sociaux
    const [casStats] = await pool.execute(`
      SELECT 
        type_cas,
        COUNT(*) as nombre,
        COUNT(CASE WHEN statut = 'Résolu' THEN 1 END) as nb_resolus,
        COUNT(CASE WHEN statut = 'En Cours' THEN 1 END) as nb_en_cours,
        COUNT(CASE WHEN statut = 'Ouvert' THEN 1 END) as nb_ouverts
      FROM cas_sociaux
      GROUP BY type_cas
    `);

    // Liste des cas avec assistances
    const [casDetail] = await pool.execute(`
      SELECT 
        cs.*,
        m.nom,
        m.prenom,
        COUNT(a.id_assistance) as nb_assistances,
        COALESCE(SUM(a.montant), 0) as total_assistances
      FROM cas_sociaux cs
      JOIN membres m ON cs.id_membre = m.id_membre
      LEFT JOIN assistances a ON cs.id_cas = a.id_cas
      GROUP BY cs.id_cas
      ORDER BY cs.date_creation DESC
    `);

    // Statistiques des assistances
    const [assistanceStats] = await pool.execute(`
      SELECT 
        type_assistance,
        COUNT(*) as nombre,
        SUM(montant) as total_montant,
        AVG(montant) as moyenne_montant,
        COUNT(CASE WHEN statut = 'Versée' THEN 1 END) as nb_versees
      FROM assistances
      GROUP BY type_assistance
    `);

    res.json({
      statistiques: {
        cas: casStats,
        assistances: assistanceStats
      },
      cas: casDetail,
      dateGeneration: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport des cas sociaux:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
