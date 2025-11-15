# 1. Utiliser l'image de base de Node.js (version LTS recommandée)
FROM node:18

# 2. Créer le répertoire de travail dans le conteneur
WORKDIR /app

# 3. Copier les fichiers de définition des dépendances
COPY package*.json ./

# 4. Installer les dépendances
RUN npm install

# 5. Copier tout le code source de l'API dans le conteneur
COPY . .

# 6. Exposer le port par défaut de l'API (5000)
EXPOSE 5000

# 7. Commande de démarrage
CMD ["npm", "start"]