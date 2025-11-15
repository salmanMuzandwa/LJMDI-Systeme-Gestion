const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./config/database-memory');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const activitesRoutes = require('./routes/activites-simple');
const membresRoutes = require('./routes/membres-simple');
const contributionsRoutes = require('./routes/contributions-simple');
const presencesRoutes = require('./routes/presences-simple');
const documentsRoutes = require('./routes/documents-simple');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/activites', activitesRoutes);
app.use('/api/membres', membresRoutes);
app.use('/api/contributions', contributionsRoutes);
app.use('/api/presences', presencesRoutes);
app.use('/api/documents', documentsRoutes);

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ message: 'API LJMDI fonctionne correctement!' });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Erreur serveur interne',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Démarrage du serveur
const startServer = async () => {
  try {
    // Initialisation de la base de données
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Serveur backend LJMDI démarré sur le port ${PORT}`);
      console.log(`📊 API disponible: http://localhost:${PORT}/api`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Base de données: MySQL`);
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
