-- LJMDI\.qodo\create_documents_table.sql

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    auteur_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- ON DELETE SET NULL pour la robustesse
    fichier_path VARCHAR(255) UNIQUE,
    CONSTRAINT unique_document_title_type UNIQUE (titre, type)
);
