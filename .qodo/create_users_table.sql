-- LJMDI\.qodo\create_users_table.sql

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL, -- Taille pour le hachage argon2
    role VARCHAR(50) NOT NULL DEFAULT 'membre',
    telephone VARCHAR(20),
    profession VARCHAR(100),
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
