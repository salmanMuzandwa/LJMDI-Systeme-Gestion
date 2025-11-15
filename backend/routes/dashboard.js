const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();

// GET - Statistiques générales du dashboard
router.get('/stats', async (req, res) => {
  try {
    // Nombre de membres actifs
    const [membresActifs] = await pool.execute(
      'SELECT COUNT(*) as count FROM membres WHERE statut = "Actif"'
    );

    // Total de la trésorerie (contributions + cotisations payées)
    const [tresorerieResult] = await pool.execute(`
      SELECT SUM(montant) as total FROM (
        SELECT montant FROM contributions WHERE statut_paiement = 'Payé'
        UNION ALL
        SELECT montant FROM cotisations WHERE statut_paiement = 'Payé'
      ) as paiements
    `);

    // Nombre d'activités ce mois-ci
    const [activitesMois] = await pool.execute(
      'SELECT COUNT(*) as count FROM activites WHERE MONTH(date_debut) = MONTH(CURRENT_DATE()) AND YEAR(date_debut) = YEAR(CURRENT_DATE())'
    );

    // Taux de participation général
    const [participationResult] = await pool.execute(`
      SELECT 
        COUNT(*) as total_presences,
        COUNT(CASE WHEN statut = 'Présent' THEN 1 END) as total_presents
      FROM presences
    `);

    const tauxParticipation = participationResult[0].total_presences > 0 
      ? Math.round((participationResult[0].total_presents / participationResult[0].total_presences) * 100)
      : 0;

    // Évolution des contributions (6 derniers mois)
    const [contributionsEvolution] = await pool.execute(`
      SELECT 
        MONTHNAME(date_paiement) as mois,
        SUM(montant) as montant
      FROM (
        SELECT date_paiement, montant FROM contributions WHERE statut_paiement = 'Payé'
        UNION ALL
        SELECT date_paiement, montant FROM cotisations WHERE statut_paiement = 'Payé'
      ) as paiements
      WHERE date_paiement >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
      GROUP BY MONTH(date_paiement), YEAR(date_paiement)
      ORDER BY YEAR(date_paiement), MONTH(date_paiement)
    `);

    // Alertes et rappels
    const alertes = [];

    // Cotisations en retard
    const [cotisationsRetard] = await pool.execute(
      'SELECT COUNT(*) as count FROM cotisations WHERE statut_paiement = "En Retard"'
    );
    if (cotisationsRetard[0].count > 0) {
      alertes.push({
        type: 'warning',
        message: `${cotisationsRetard[0].count} cotisation(s) en retard`,
        date: new Date().toLocaleDateString('fr-FR')
      });
    }

    // Cas sociaux ouverts
    const [casOuverts] = await pool.execute(
      'SELECT COUNT(*) as count FROM cas_sociaux WHERE statut = "Ouvert"'
    );
    if (casOuverts[0].count > 0) {
      alertes.push({
        type: 'info',
        message: `${casOuverts[0].count} cas social(aux) ouvert(s)`,
        date: new Date().toLocaleDateString('fr-FR')
      });
    }

    // Nouveaux membres ce mois-ci
    const [nouveauxMembres] = await pool.execute(
      'SELECT COUNT(*) as count FROM membres WHERE MONTH(date_adhesion) = MONTH(CURRENT_DATE()) AND YEAR(date_adhesion) = YEAR(CURRENT_DATE())'
    );

    // Activités à venir (30 prochains jours)
    const [activitesAvenir] = await pool.execute(
      'SELECT COUNT(*) as count FROM activites WHERE date_debut BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY)'
    );

    // Répartition des statuts de membres
    const [repartitionStatuts] = await pool.execute(`
      SELECT 
        statut,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM membres), 2) as percentage
      FROM membres
      GROUP BY statut
    `);

    // Activités récentes (dernières 5)
    const [activitesRecentes] = await pool.execute(`
      SELECT titre, type, date_debut FROM activites 
      ORDER BY date_debut DESC 
      LIMIT 5
    `);

    // Membres les plus actifs (top 5 par participation)
    const [membresActifs] = await pool.execute(`
      SELECT 
        m.nom, 
        m.prenom, 
        COUNT(p.id_presence) as nb_participations,
        COUNT(CASE WHEN p.statut = 'Présent' THEN 1 END) as nb_presences
      FROM membres m
      JOIN presences p ON m.id_membre = p.id_membre
      GROUP BY m.id_membre
      ORDER BY nb_presences DESC
      LIMIT 5
    `);

    const stats = {
      membresActifs: membresActifs[0].count,
      tresorerie: tresorerieResult[0].total || 0,
      activitesMois: activitesMois[0].count,
      tauxParticipation: tauxParticipation,
      contributionsEvolution: contributionsEvolution,
      alertes: alertes,
      nouveauxMembres: nouveauxMembres[0].count,
      activitesAvenir: activitesAvenir[0].count,
      repartitionStatuts: repartitionStatuts,
      activitesRecentes: activitesRecentes,
      membresActifsList: membresActifs
    };

    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques du dashboard:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Activités récentes pour le dashboard
router.get('/recent-activities', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const [activities] = await pool.execute(`
      SELECT 
        'activité' as type,
        titre as description,
        date_debut as date,
        type as sous_type
      FROM activites 
      ORDER BY date_creation DESC 
      LIMIT ?
      
      UNION ALL
      
      SELECT 
        'membre' as type,
        CONCAT(nom, ' ', prenom) as description,
        date_adhesion as date,
        statut as sous_type
      FROM membres 
      ORDER BY date_creation DESC 
      LIMIT ?
      
      UNION ALL
      
      SELECT 
        'contribution' as type,
        CONCAT('Contribution de ', m.nom, ' ', m.prenom) as description,
        co.date_paiement as date,
        co.type_contribution as sous_type
      FROM contributions co
      JOIN membres m ON co.id_membre = m.id_membre
      ORDER BY co.date_creation DESC 
      LIMIT ?
      
      ORDER BY date DESC
      LIMIT ?
    `, [limit, limit, limit, limit]);

    res.json(activities);
  } catch (error) {
    console.error('Erreur lors de la récupération des activités récentes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Statistiques détaillées par période
router.get('/stats-period', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFormat, groupBy;
    switch (period) {
      case 'week':
        dateFormat = '%Y-%u';
        groupBy = 'YEAR(date_paiement), WEEK(date_paiement)';
        break;
      case 'year':
        dateFormat = '%Y';
        groupBy = 'YEAR(date_paiement)';
        break;
      default: // month
        dateFormat = '%Y-%m';
        groupBy = 'YEAR(date_paiement), MONTH(date_paiement)';
    }

    const [contributions] = await pool.execute(`
      SELECT 
        DATE_FORMAT(date_paiement, ?) as periode,
        SUM(montant) as total,
        COUNT(*) as nombre
      FROM (
        SELECT date_paiement, montant FROM contributions WHERE statut_paiement = 'Payé'
        UNION ALL
        SELECT date_paiement, montant FROM cotisations WHERE statut_paiement = 'Payé'
      ) as paiements
      WHERE date_paiement >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR)
      GROUP BY ${groupBy}
      ORDER BY periode
    `, [dateFormat]);

    const [activites] = await pool.execute(`
      SELECT 
        DATE_FORMAT(date_debut, ?) as periode,
        COUNT(*) as nombre
      FROM activites
      WHERE date_debut >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR)
      GROUP BY ${groupBy}
      ORDER BY periode
    `, [dateFormat]);

    const [membres] = await pool.execute(`
      SELECT 
        DATE_FORMAT(date_adhesion, ?) as periode,
        COUNT(*) as nombre
      FROM membres
      WHERE date_adhesion >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR)
      GROUP BY ${groupBy}
      ORDER BY periode
    `, [dateFormat]);

    res.json({
      contributions,
      activites,
      membres,
      period
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques par période:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
