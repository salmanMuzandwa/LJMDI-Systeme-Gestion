const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token non fourni' });
    }

    // Cas spécial : token de développement
    if (token === 'dev-token') {
      req.user = {
        id: 1,
        email: 'admin@ljmdi.org',
        role: 'admin'
      };
      return next();
    }

    // Vérification du token JWT normal
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
    
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide' });
  }
};

module.exports = authMiddleware;
