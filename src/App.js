// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Membres from './pages/Membres';
import AjouterMembre from './pages/AjouterMembre'; // Nouvelle page
import VoirMembre from './pages/VoirMembre'; // Page de vue des détails
import ModifierMembre from './pages/ModifierMembre'; // Page de modification
import Cotisations from './pages/Cotisations'; // Page des cotisations
import VoirCotisation from './pages/VoirCotisation'; // Page de détail cotisation
import Contributions from './pages/Contributions'; // Page des contributions
import VoirContribution from './pages/VoirContribution'; // Page de détail contribution
import Presences from './pages/Presences';
import Activites from './pages/Activites';
import Documents from './pages/Documents';
import Rapports from './pages/Rapports';
import CasSociaux from './pages/CasSociaux';
import Profil from './pages/Profil';


function App() {
    return (
        <Router>
            <Routes>
                {/* Route de connexion - Non Protégée */}
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate replace to="/dashboard" />} />

                {/* Routes Protégées (Nécessite connexion) */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<Layout />}>
                        {/* Pages protégées avec permission */}
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/membres" element={<ProtectedRoute requiredPermission="membres"><Membres /></ProtectedRoute>} />
                        <Route path="/membres/ajouter" element={<ProtectedRoute requiredPermission="membres"><AjouterMembre /></ProtectedRoute>} />
                        <Route path="/membres/:id" element={<ProtectedRoute requiredPermission="membres"><VoirMembre /></ProtectedRoute>} />
                        <Route path="/membres/:id/modifier" element={<ProtectedRoute requiredPermission="membres"><ModifierMembre /></ProtectedRoute>} />
                        <Route path="/cotisations" element={<ProtectedRoute requiredPermission="cotisations"><Cotisations /></ProtectedRoute>} />
                        <Route path="/cotisations/:id" element={<ProtectedRoute requiredPermission="cotisations"><VoirCotisation /></ProtectedRoute>} />
                        <Route path="/contributions" element={<ProtectedRoute requiredPermission="contributions"><Contributions /></ProtectedRoute>} />
                        <Route path="/contributions/:id" element={<ProtectedRoute requiredPermission="contributions"><VoirContribution /></ProtectedRoute>} />
                        <Route path="/presences" element={<ProtectedRoute requiredPermission="presences"><Presences /></ProtectedRoute>} />
                        <Route path="/activites" element={<ProtectedRoute requiredPermission="activites"><Activites /></ProtectedRoute>} />
                        <Route path="/documents" element={<ProtectedRoute requiredPermission="documents"><Documents /></ProtectedRoute>} />
                        <Route path="/rapports" element={<ProtectedRoute requiredPermission="rapports"><Rapports /></ProtectedRoute>} />
                        <Route path="/cas-sociaux" element={<ProtectedRoute requiredPermission="cas_sociaux"><CasSociaux /></ProtectedRoute>} />
                        <Route path="/profil" element={<ProtectedRoute requiredPermission="profil"><Profil /></ProtectedRoute>} />
                    </Route>
                </Route>

                {/* Route 404/Catch-all */}
                <Route path="*" element={<Navigate replace to="/dashboard" />} />
            </Routes>
        </Router>
    );
}

export default App;

