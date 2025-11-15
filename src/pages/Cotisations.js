import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, CircularProgress, Alert, Button, Box,
    Card, CardContent, Grid, Chip, IconButton, Menu, MenuItem, FormControl,
    InputLabel, Select, TextField, Dialog, DialogTitle, DialogContent,
    DialogActions
} from '@mui/material';
import { Add, Delete, Visibility, Filter, Print, Download, Refresh } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Cotisations = () => {
    const [cotisations, setCotisations] = useState([]);
    const [members, setMembers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
    const [filters, setFilters] = useState({
        annee: new Date().getFullYear(),
        mois: '',
        membre_id: '',
        statut: ''
    });
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [formData, setFormData] = useState({
        membre_id: '',
        montant: '',
        type_cotisation: 'mensuelle',
        date_paiement: new Date().toISOString().split('T')[0],
        mois_cotisation: new Date().toLocaleDateString('fr-FR', { month: 'long' }),
        annee_cotisation: new Date().getFullYear(),
        methode_paiement: 'espèces',
        reference_paiement: '',
        statut: 'paye'
    });
    const [submitting, setSubmitting] = useState(false);
    const { token } = useAuth();
    const navigate = useNavigate();

    const mois = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const methodesPaiement = [
        'espèces', 'mobile money', 'virement bancaire', 'chèque', 'autre'
    ];

    const typesCotisation = [
        'mensuelle', 'trimestrielle', 'annuelle', 'exceptionnelle'
    ];

    useEffect(() => {
        fetchCotisations();
        fetchMembers();
        fetchStats();
    }, [filters]);

    const fetchCotisations = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });
            
            const response = await axios.get(`/api/cotisations?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setCotisations(response.data || []);
            setError(null);
        } catch (err) {
            console.error("Erreur de chargement des cotisations:", err);
            setError("Impossible de charger la liste des cotisations");
            setCotisations([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const response = await axios.get('/api/members', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setMembers(response.data || []);
        } catch (err) {
            console.error("Erreur de chargement des membres:", err);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/cotisations/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setStats(response.data);
        } catch (err) {
            console.error("Erreur de chargement des statistiques:", err);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAddCotisation = async () => {
        setSubmitting(true);
        try {
            const response = await axios.post('/api/cotisations', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            setCotisations(prev => [response.data.cotisation, ...prev]);
            setShowAddDialog(false);
            setFormData({
                membre_id: '',
                montant: '',
                type_cotisation: 'mensuelle',
                date_paiement: new Date().toISOString().split('T')[0],
                mois_cotisation: new Date().toLocaleDateString('fr-FR', { month: 'long' }),
                annee_cotisation: new Date().getFullYear(),
                methode_paiement: 'espèces',
                reference_paiement: '',
                statut: 'paye'
            });
            fetchStats();
        } catch (err) {
            console.error("Erreur lors de l'ajout de la cotisation:", err);
            setError(err.response?.data?.message || "Erreur lors de l'ajout de la cotisation");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (cotisationId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette cotisation ?')) {
            try {
                await axios.delete(`/api/cotisations/${cotisationId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setCotisations(prev => prev.filter(c => c.id !== cotisationId));
                fetchStats();
            } catch (err) {
                console.error("Erreur lors de la suppression:", err);
                setError("Erreur lors de la suppression de la cotisation");
            }
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString('fr-FR');
    };

    const getStatutColor = (statut) => {
        switch (statut) {
            case 'paye': return 'success';
            case 'impaye': return 'error';
            case 'en_attente': return 'warning';
            default: return 'default';
        }
    };

    const getStatutLabel = (statut) => {
        switch (statut) {
            case 'paye': return 'Payé';
            case 'impaye': return 'Impayé';
            case 'en_attente': return 'En attente';
            default: return statut;
        }
    };

    const printCotisations = () => {
        const printWindow = window.open('', '_blank');
        const currentDate = new Date().toLocaleDateString('fr-FR');
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Liste des Cotisations - LJMDI</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #19d279; text-align: center; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .date { text-align: right; margin-bottom: 20px; font-style: italic; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .total { margin-top: 20px; font-weight: bold; text-align: right; }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Liste des Cotisations - LJMDI</h1>
                    <p>Système de Gestion Intégrale</p>
                </div>
                <div class="date">Date d'impression: ${currentDate}</div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Membre</th>
                            <th>Montant</th>
                            <th>Type</th>
                            <th>Période</th>
                            <th>Méthode</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cotisations.map((cotisation) => `
                            <tr>
                                <td>${formatDate(cotisation.date_paiement)}</td>
                                <td>${cotisation.nom} ${cotisation.prenom}</td>
                                <td>${cotisation.montant} $</td>
                                <td>${cotisation.type_cotisation}</td>
                                <td>${cotisation.mois_cotisation} ${cotisation.annee_cotisation}</td>
                                <td>${cotisation.methode_paiement || 'N/A'}</td>
                                <td>${getStatutLabel(cotisation.statut)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="total">
                    Total: ${cotisations.reduce((sum, c) => sum + parseFloat(c.montant || 0), 0).toFixed(2)} $
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

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Gestion des Cotisations
            </Typography>

            {/* Statistiques */}
            {stats && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="primary">
                                    Total Année {stats.anneeActuelle}
                                </Typography>
                                <Typography variant="h4">
                                    {stats.totalAnnee} $
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="success">
                                    Total {stats.moisActuel}
                                </Typography>
                                <Typography variant="h4">
                                    {stats.totalMois} $
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {stats.nombreMois} cotisations
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="success.main">
                                    Membres en Règle
                                </Typography>
                                <Typography variant="h4">
                                    {stats.membresStatut?.payes || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="error.main">
                                    Membres en Retard
                                </Typography>
                                <Typography variant="h4">
                                    {stats.membresStatut?.impayes || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={() => setShowAddDialog(true)}
                    sx={{ bgcolor: '#19d279', '&:hover': { bgcolor: '#12a85e' } }}
                >
                    Ajouter une Cotisation
                </Button>
                
                <Button
                    variant="outlined"
                    startIcon={<Filter />}
                    onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                >
                    Filtrer
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={printCotisations}
                >
                    Imprimer
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={fetchCotisations}
                >
                    Actualiser
                </Button>
            </Box>

            {/* Menu des filtres */}
            <Menu
                anchorEl={filterMenuAnchor}
                open={Boolean(filterMenuAnchor)}
                onClose={() => setFilterMenuAnchor(null)}
            >
                <Box sx={{ p: 2, minWidth: 250 }}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Année</InputLabel>
                        <Select
                            value={filters.annee}
                            onChange={(e) => handleFilterChange('annee', e.target.value)}
                            label="Année"
                        >
                            {[2023, 2024, 2025, 2026].map(year => (
                                <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Mois</InputLabel>
                        <Select
                            value={filters.mois}
                            onChange={(e) => handleFilterChange('mois', e.target.value)}
                            label="Mois"
                        >
                            <MenuItem value="">Tous</MenuItem>
                            {mois.map(mois => (
                                <MenuItem key={mois} value={mois}>{mois}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Statut</InputLabel>
                        <Select
                            value={filters.statut}
                            onChange={(e) => handleFilterChange('statut', e.target.value)}
                            label="Statut"
                        >
                            <MenuItem value="">Tous</MenuItem>
                            <MenuItem value="paye">Payé</MenuItem>
                            <MenuItem value="impaye">Impayé</MenuItem>
                            <MenuItem value="en_attente">En attente</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Menu>

            {loading && <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                                <TableCell>Date</TableCell>
                                <TableCell>Membre</TableCell>
                                <TableCell>ID Membre</TableCell>
                                <TableCell>Montant</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Période</TableCell>
                                <TableCell>Méthode</TableCell>
                                <TableCell>Statut</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {cotisations.map((cotisation) => (
                                <TableRow key={cotisation.id} hover>
                                    <TableCell>{formatDate(cotisation.date_paiement)}</TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" fontWeight="bold">
                                                {cotisation.nom} {cotisation.prenom}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {cotisation.email}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                            {cotisation.membre_code}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold" color="primary">
                                            {cotisation.montant} $
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{cotisation.type_cotisation}</TableCell>
                                    <TableCell>
                                        {cotisation.mois_cotisation} {cotisation.annee_cotisation}
                                    </TableCell>
                                    <TableCell>{cotisation.methode_paiement || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={getStatutLabel(cotisation.statut)}
                                            color={getStatutColor(cotisation.statut)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <IconButton 
                                                size="small" 
                                                onClick={() => navigate(`/cotisations/${cotisation.id}`)}
                                            >
                                                <Visibility />
                                            </IconButton>
                                            <IconButton 
                                                size="small" 
                                                color="error"
                                                onClick={() => handleDelete(cotisation.id)}
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Dialog d'ajout de cotisation */}
            <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Ajouter une Cotisation</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Membre</InputLabel>
                                <Select
                                    value={formData.membre_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, membre_id: e.target.value }))}
                                    label="Membre"
                                >
                                    {members.map(member => (
                                        <MenuItem key={member.id} value={member.id}>
                                            {member.nom} {member.prenom} ({member.member_id})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Montant ($)"
                                type="number"
                                value={formData.montant}
                                onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
                                required
                                fullWidth
                                inputProps={{ step: "0.01", min: "0" }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Type de Cotisation</InputLabel>
                                <Select
                                    value={formData.type_cotisation}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type_cotisation: e.target.value }))}
                                    label="Type de Cotisation"
                                >
                                    {typesCotisation.map(type => (
                                        <MenuItem key={type} value={type}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Date de Paiement"
                                type="date"
                                value={formData.date_paiement}
                                onChange={(e) => setFormData(prev => ({ ...prev, date_paiement: e.target.value }))}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Mois</InputLabel>
                                <Select
                                    value={formData.mois_cotisation}
                                    onChange={(e) => setFormData(prev => ({ ...prev, mois_cotisation: e.target.value }))}
                                    label="Mois"
                                >
                                    {mois.map(mois => (
                                        <MenuItem key={mois} value={mois}>{mois}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Année"
                                type="number"
                                value={formData.annee_cotisation}
                                onChange={(e) => setFormData(prev => ({ ...prev, annee_cotisation: e.target.value }))}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Méthode de Paiement</InputLabel>
                                <Select
                                    value={formData.methode_paiement}
                                    onChange={(e) => setFormData(prev => ({ ...prev, methode_paiement: e.target.value }))}
                                    label="Méthode de Paiement"
                                >
                                    {methodesPaiement.map(methode => (
                                        <MenuItem key={methode} value={methode}>
                                            {methode.charAt(0).toUpperCase() + methode.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Référence de Paiement"
                                value={formData.reference_paiement}
                                onChange={(e) => setFormData(prev => ({ ...prev, reference_paiement: e.target.value }))}
                                fullWidth
                                helperText="Numéro de transaction, référence de virement, etc."
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAddDialog(false)}>Annuler</Button>
                    <Button 
                        onClick={handleAddCotisation}
                        variant="contained"
                        disabled={submitting || !formData.membre_id || !formData.montant}
                        sx={{ bgcolor: '#19d279', '&:hover': { bgcolor: '#12a85e' } }}
                    >
                        {submitting ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Cotisations;
