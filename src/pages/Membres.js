// src/pages/Membres.js

import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, CircularProgress, Alert, Button, Box,
    Checkbox, Menu, MenuItem, ListItemIcon, ListItemText
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Print, PrintDisabled } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Members = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [printMenuAnchor, setPrintMenuAnchor] = useState(null);
    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMembers = async () => {
            setLoading(true);
            try {
                const response = await axios.get('http://localhost:5001/api/membres', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                // Tri alphabétique côté frontend pour garantir l'ordre
                const sortedMembers = (response.data || []).sort((a, b) => {
                    const nameA = `${a.nom} ${a.prenom}`.toLowerCase();
                    const nameB = `${b.nom} ${b.prenom}`.toLowerCase();
                    return nameA.localeCompare(nameB, 'fr');
                });
                setMembers(sortedMembers);
                setError(null);
            } catch (err) {
                console.error("Erreur de chargement des membres:", err);
                setError("Impossible de charger la liste des membres. Vérifiez la connexion API.");
                setMembers([]);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchMembers();
        }
    }, [token]);

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString('fr-FR');
    };

    const handleDelete = async (memberId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
            try {
                await axios.delete(`http://localhost:5001/api/membres/${memberId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                // Rafraîchir la liste des membres
                const response = await axios.get('http://localhost:5001/api/membres', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                // Maintenir le tri alphabétique
                const sortedMembers = (response.data || []).sort((a, b) => {
                    const nameA = `${a.nom} ${a.prenom}`.toLowerCase();
                    const nameB = `${b.nom} ${b.prenom}`.toLowerCase();
                    return nameA.localeCompare(nameB, 'fr');
                });
                setMembers(sortedMembers);
            } catch (err) {
                console.error("Erreur lors de la suppression:", err);
                setError("Erreur lors de la suppression du membre");
            }
        }
    };

    const handleSelectMember = (memberId) => {
        setSelectedMembers(prev => 
            prev.includes(memberId) 
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedMembers(members.map(member => member.id));
        } else {
            setSelectedMembers([]);
        }
    };

    const handlePrintMenuOpen = (event) => {
        setPrintMenuAnchor(event.currentTarget);
    };

    const handlePrintMenuClose = () => {
        setPrintMenuAnchor(null);
    };

    const printMembers = (membersToPrint) => {
        const printWindow = window.open('', '_blank');
        const currentDate = new Date().toLocaleDateString('fr-FR');
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Liste des Membres - LJMDI</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #19d279; text-align: center; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .date { text-align: right; margin-bottom: 20px; font-style: italic; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .member-id { font-family: monospace; font-size: 0.9em; color: #666; }
                    .total { margin-top: 20px; font-weight: bold; }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Liste des Membres - LJMDI</h1>
                    <p>Système de Gestion Intégrale</p>
                </div>
                <div class="date">Date d'impression: ${currentDate}</div>
                <table>
                    <thead>
                        <tr>
                            <th>N°</th>
                            <th>ID Membre</th>
                            <th>Nom & Prénom</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Profession</th>
                            <th>Rôle</th>
                            <th>Date d'Adhésion</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${membersToPrint.map((member, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td class="member-id">${member.member_id}</td>
                                <td>${member.nom} ${member.prenom}</td>
                                <td>${member.email}</td>
                                <td>${member.telephone || 'N/A'}</td>
                                <td>${member.profession || 'N/A'}</td>
                                <td>${member.role}</td>
                                <td>${formatDate(member.date_creation)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="total">
                    Total: ${membersToPrint.length} membre(s)
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    const handlePrintAll = () => {
        printMembers(members);
        handlePrintMenuClose();
    };

    const handlePrintSelected = () => {
        const selected = members.filter(member => selectedMembers.includes(member.id));
        if (selected.length === 0) {
            alert('Veuillez sélectionner au moins un membre à imprimer');
            return;
        }
        printMembers(selected);
        handlePrintMenuClose();
    };

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Gestion des Membres
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    sx={{ bgcolor: '#19d279', '&:hover': { bgcolor: '#12a85e' } }}
                    onClick={() => navigate('/membres/ajouter')}
                >
                    Ajouter un Membre
                </Button>
                
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<Print />}
                    onClick={handlePrintMenuOpen}
                    sx={{ bgcolor: '#2196F3', '&:hover': { bgcolor: '#1976D2' } }}
                >
                    Imprimer
                </Button>

                {selectedMembers.length > 0 && (
                    <Button
                        variant="outlined"
                        sx={{ borderColor: '#19d279', color: '#19d279' }}
                    >
                        {selectedMembers.length} membre(s) sélectionné(s)
                    </Button>
                )}
            </Box>

            <Menu
                anchorEl={printMenuAnchor}
                open={Boolean(printMenuAnchor)}
                onClose={handlePrintMenuClose}
            >
                <MenuItem onClick={handlePrintAll}>
                    <ListItemIcon>
                        <Print />
                    </ListItemIcon>
                    <ListItemText>
                        Imprimer toute la liste
                    </ListItemText>
                </MenuItem>
                <MenuItem onClick={handlePrintSelected}>
                    <ListItemIcon>
                        <PrintDisabled />
                    </ListItemIcon>
                    <ListItemText>
                        Imprimer la sélection ({selectedMembers.length})
                    </ListItemText>
                </MenuItem>
            </Menu>

            {loading && <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        indeterminate={selectedMembers.length > 0 && selectedMembers.length < members.length}
                                        checked={members.length > 0 && selectedMembers.length === members.length}
                                        onChange={handleSelectAll}
                                    />
                                </TableCell>
                                <TableCell>N°</TableCell>
                                <TableCell>ID Membre</TableCell>
                                <TableCell>Nom & Prénom (A-Z)</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Téléphone</TableCell>
                                <TableCell>Rôle</TableCell>
                                <TableCell>Date d'Adhésion</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {members.map((member, index) => (
                                <TableRow key={member.id} hover>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedMembers.includes(member.id)}
                                            onChange={() => handleSelectMember(member.id)}
                                        />
                                    </TableCell>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <Box sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666' }}>
                                            {member.member_id}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{member.nom} {member.prenom}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell>{member.telephone || 'N/A'}</TableCell>
                                    <TableCell>{member.role}</TableCell>
                                    <TableCell>{formatDate(member.date_creation)}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button 
                                                size="small" 
                                                startIcon={<Visibility />}
                                                onClick={() => navigate(`/membres/${member.id}`)}
                                            >
                                                Voir
                                            </Button>
                                            <Button 
                                                size="small" 
                                                startIcon={<Edit />}
                                                onClick={() => navigate(`/membres/${member.id}/modifier`)}
                                            >
                                                Modifier
                                            </Button>
                                            <Button 
                                                size="small" 
                                                color="error"
                                                startIcon={<Delete />}
                                                onClick={() => handleDelete(member.id)}
                                            >
                                                Supprimer
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {members.length === 0 && (
                        <Typography sx={{ p: 2, textAlign: 'center' }}>
                            Aucun membre trouvé.
                        </Typography>
                    )}
                </TableContainer>
            )}
        </Container>
    );
};

export default Members;

