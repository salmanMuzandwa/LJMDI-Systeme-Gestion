// src/contexts/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// *** Configuration des Permissions : Copiée de votre arborescence de code ***
// Cette structure définit ce que chaque RÔLE est autorisé à faire.
const rolePermissions = {
    'admin': ['charge_de_discipline', 'presences', 'activites', 'membres', 'profil', 'contributions'],
    'charge_de_discipline': ['presences', 'activites'],
    'membre': ['profil', 'contributions'],
    // Ajoutez d'autres rôles et leurs permissions si nécessaire
    'guest': [], // Utilisateur non connecté
};

// *** 1. Création du Contexte ***
const AuthContext = createContext({
    isAuthenticated: false,
    user: null,
    login: () => Promise.resolve(),
    logout: () => { },
    loading: true,
    hasPermission: () => false, // Définit la forme attendue avec hasPermission
});

// *** 2. Hook personnalisé pour un accès facile ***
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth doit être utilisé au sein d’un AuthProvider');
    }
    return context;
};

// *** 3. Le Provider qui gère la logique d'état et les fonctions ***
export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fonction de vérification des permissions (C'est la fonction manquante !)
    const hasPermission = (permissionsToCheck) => {
        // Si l'utilisateur n'est pas connecté, il n'a aucune permission
        if (!user) return false;

        // Récupérer le rôle de l'utilisateur (on suppose que le champ est 'role')
        const userRole = user.role || 'membre';

        // Obtenir la liste des permissions pour ce rôle
        const userPermissions = rolePermissions[userRole] || [];

        // Si l'utilisateur est un 'admin', il a toutes les permissions
        if (userRole === 'admin') {
            return true;
        }

        // Si la permission demandée est un tableau (plusieurs permissions à vérifier)
        if (Array.isArray(permissionsToCheck)) {
            // L'utilisateur doit avoir AU MOINS une des permissions
            return permissionsToCheck.some(permission => userPermissions.includes(permission));
        }

        // Vérifier si la permission unique est incluse
        return userPermissions.includes(permissionsToCheck);
    };


    // Simuler la vérification initiale de l'état d'auth
    useEffect(() => {
        // En conditions réelles, vérifier le token dans le localStorage ici
        setTimeout(() => {
            // Simulation de la fin du chargement initial
            setLoading(false);
        }, 300);
    }, []);

    // Fonction de connexion (modifiée pour inclure le RÔLE)
    const login = async (email, password) => {
        setLoading(true);
        try {
            // Simuler l'appel API de connexion (ici, vous appellerez votre API Docker)
            // L'API retournera un objet 'user' avec un 'role'
            await new Promise(resolve => setTimeout(resolve, 300));

            // *** IMPORTANT : Simulation d'un utilisateur ADMIN après connexion réussie ***
            const fakeAdminUser = {
                id: 1,
                name: 'Admin User',
                email: email, // Utilise l'email fourni
                role: 'admin' // CLÉ : Fournir un rôle pour le test de permissions
            };

            setIsAuthenticated(true);
            setUser(fakeAdminUser);
            return { success: true, user: fakeAdminUser };
        } catch (error) {
            console.error("Login failed:", error);
            return { success: false, error: 'Échec de la connexion simulée' };
        } finally {
            setLoading(false);
        }
    };

    // Fonction de déconnexion
    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
    };

    // *** 4. Objet de valeur du contexte (MAINTENANT AVEC hasPermission) ***
    const value = {
        isAuthenticated,
        user,
        loading,
        login,
        logout,
        hasPermission, // <-- Correction de l'erreur !
    };

    // On retourne le Provider qui fournit l'objet 'value' à ses enfants
    return (
        <AuthContext.Provider value={value}>
            {/* Afficher l'enfant uniquement après la vérification initiale */}
            {loading ? <div>Chargement de la session...</div> : children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default AuthContext;