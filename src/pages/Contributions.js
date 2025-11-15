import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, CircularProgress, Alert, Button, Box,
    Card, CardContent, Grid, Chip, IconButton, Menu, MenuItem, FormControl,
    InputLabel, Select, TextField, Dialog, DialogTitle, DialogContent,
    DialogActions, Avatar
} from '@mui/material';
import { Add, Delete, Visibility, FilterList, Print, Download, Refresh, VolunteerActivism, Handshake, CardGiftcard, Campaign, Edit } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Contributions = () => {
    const [contributions, setContributions] = useState([]);
    const [members, setMembers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
    const [filters, setFilters] = useState({
        annee: new Date().getFullYear(),
        type_contribution: '',
        membre_id: '',
        statut: ''
    });
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [formData, setFormData] = useState({
        donateur_type: 'membre',
        membre_id: '',
        donateur_nom: '',
        donateur_prenom: '',
        donateur_email: '',
        donateur_telephone: '',
        type_contribution: 'don',
        montant: '',
        devise: 'USD',
        description: '',
        date_contribution: new Date().toISOString().split('T')[0],
        nature: 'financiere',
        statut: 'recu',
        reference: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const { token } = useAuth();
    const navigate = useNavigate();

    const typesContribution = [
        { value: 'mensuelle', label: 'Mensuelle', icon: <CardGiftcard />, color: '#ff6b6b' },
        { value: 'hebdomadaire', label: 'Hebdomadaire', icon: <VolunteerActivism />, color: '#45b7d1' },
        { value: 'annuelle', label: 'Annuelle', icon: <Handshake />, color: '#4ecdc4' },
        { value: 'speciale', label: 'Spéciale', icon: <Campaign />, color: '#f9ca24' }
    ];

    const natures = [
        { value: 'financiere', label: 'Financière' },
        { value: 'materielle', label: 'Matérielle' },
        { value: 'service', label: 'Service' },
        { value: 'competence', label: 'Compétence' }
    ];

    useEffect(() => {
        fetchContributions();
        fetchMembers();
        fetchStats();
    }, [filters]);

    const fetchContributions = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const response = await axios.get(`http://localhost:5001/api/contributions?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setContributions(response.data || []);
            setError(null);
        } catch (err) {
            console.error("Erreur de chargement des contributions:", err);
            setError("Impossible de charger la liste des contributions");
            setContributions([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/membres', {
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
            const response = await axios.get('/api/contributions/stats', {
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

    const handleAddContribution = async () => {
        setSubmitting(true);
        try {
            let membreId = formData.membre_id;

            if (formData.donateur_type === 'externe') {
                const membreResponse = await axios.post('/api/membres', {
                    nom: formData.donateur_nom,
                    prenom: formData.donateur_prenom,
                    email: formData.donateur_email || undefined,
                    telephone: formData.donateur_telephone || undefined,
                    date_adhesion: new Date().toISOString().split('T')[0],
                    statut: 'Actif',
                    adresse: '',
                    profession: 'Donateur externe'
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                membreId = membreResponse.data?.membre?.id_membre || membreResponse.data?.id_membre;
            }

            const response = await axios.post('/api/contributions', {
                id_membre: membreId,
                type_contribution: formData.type_contribution,
                montant: formData.montant,
                devise: formData.nature === 'financiere' ? formData.devise : null,
                date_paiement: formData.date_contribution,
                statut_paiement: formData.statut,
                description: formData.description
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const newContribution = response.data?.contribution || response.data;
            if (newContribution) {
                // Annoter la contribution avec la devise choisie côté frontend
                newContribution.devise = formData.devise;
                setContributions(prev => [newContribution, ...prev.filter(Boolean)]);
            }
            setShowAddDialog(false);
            resetForm();
            fetchStats();
        } catch (err) {
            console.error("Erreur lors de l'ajout de la contribution:", err);
            setError(err.response?.data?.message || "Erreur lors de l'ajout de la contribution");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            donateur_type: 'membre',
            membre_id: '',
            donateur_nom: '',
            donateur_prenom: '',
            donateur_email: '',
            donateur_telephone: '',
            type_contribution: 'don',
            montant: '',
            devise: 'USD',
            description: '',
            date_contribution: new Date().toISOString().split('T')[0],
            nature: 'financiere',
            statut: 'recu',
            reference: ''
        });
    };

    const handleDelete = async (contributionId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette contribution ?')) {
            try {
                await axios.delete(`/api/contributions/${contributionId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setContributions(prev => prev.filter(c => (c.id_contribution || c.id) !== contributionId));
                fetchStats();
            } catch (err) {
                console.error("Erreur lors de la suppression:", err);
                setError("Erreur lors de la suppression de la contribution");
            }
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString('fr-FR');
    };

    const getStatutColor = (statut) => {
        switch (statut) {
            case 'recu': return 'success';
            case 'en_attente': return 'warning';
            case 'annule': return 'error';
            default: return 'default';
        }
    };

    const getStatutLabel = (statut) => {
        switch (statut) {
            case 'recu': return 'Reçu';
            case 'en_attente': return 'En attente';
            case 'annule': return 'Annulé';
            default: return statut;
        }
    };

    const normalizeType = (type) => {
        if (!type) return '';
        return type
            .toString()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .toLowerCase();
    };

    const getTypeInfo = (type) => {
        const normalized = normalizeType(type);
        const typeInfo = typesContribution.find(t => t.value === normalized);
        return typeInfo || { label: type || 'Inconnu', icon: <CardGiftcard />, color: '#666' };
    };

    const applyFilters = (list) => {
        return list
            .filter(Boolean)
            .filter((c) => {
                // Filtre par année
                if (filters.annee) {
                    const rawDate = c.date_contribution || c.date_paiement || c.date_creation;
                    if (rawDate) {
                        const year = new Date(rawDate).getFullYear();
                        if (year !== Number(filters.annee)) return false;
                    }
                }

                // Filtre par type de contribution (mensuelle, hebdomadaire, annuelle, spéciale)
                if (filters.type_contribution) {
                    const contributionType = normalizeType(c.type_contribution);
                    if (contributionType !== normalizeType(filters.type_contribution)) return false;
                }

                // Filtre par statut
                if (filters.statut) {
                    const statut = (c.statut || c.statut_paiement || '').toString().toLowerCase();
                    if (statut !== filters.statut.toLowerCase()) return false;
                }

                return true;
            });
    };

    const filteredContributions = applyFilters(contributions);

    const getDeviseLabel = (devise) => {
        if (!devise) return '';
        if (devise === 'CDF') return 'FC';
        return '$';
    };

    const getNatureLabel = (nature) => {
        const natureInfo = natures.find(n => n.value === nature);
        return natureInfo ? natureInfo.label : nature;
    };

    const printContributions = () => {
        const printWindow = window.open('', '_blank');
        const currentDate = new Date().toLocaleDateString('fr-FR');

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Liste des Contributions - LJMDI</title>
                <style>
                    @page {
                        size: A6;
                        margin: 10mm;
                    }
                    body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
                    h1 { color: #19d279; text-align: center; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .date { text-align: right; margin-bottom: 20px; font-style: italic; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .total { margin-top: 10px; font-weight: bold; text-align: right; font-size: 11px; }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Liste des Contributions - LJMDI</h1>
                    <p>Système de Gestion Intégrale</p>
                </div>
                <div class="date">Date d'impression: ${currentDate}</div>
                <table>
                    <thead>
                        <tr>
                            <th>N°</th>
                            <th>Date</th>
                            <th>Membre</th>
                            <th>Type</th>
                            <th>Nature</th>
                            <th>Montant</th>
                            <th>Description</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredContributions.map((contribution) => `
                            <tr>
                                <td>${contribution.id_contribution || contribution.id || ''}</td>
                                <td>${formatDate(contribution.date_contribution)}</td>
                                <td>${contribution.nom} ${contribution.prenom}</td>
                                <td>${getTypeInfo(contribution.type_contribution).label}</td>
                                <td>${getNatureLabel(contribution.nature)}</td>
                                <td>${contribution.montant || 'N/A'} ${contribution.nature === 'financiere' ? getDeviseLabel(contribution.devise) : ''}</td>
                                <td>${contribution.description || 'N/A'}</td>
                                <td>${getStatutLabel(contribution.statut)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="total">
                    Total Financier: ${contributions
                .filter(c => c.nature === 'financiere')
                .reduce((sum, c) => sum + parseFloat(c.montant || 0), 0)
                .toFixed(2)} $
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
                Gestion des Contributions
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
                                    Total Contributions
                                </Typography>
                                <Typography variant="h4">
                                    {stats.totalContributions}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="info.main">
                                    Dons Financiers
                                </Typography>
                                <Typography variant="h4">
                                    {stats.totalDons} $
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="warning.main">
                                    Bénévolat
                                </Typography>
                                <Typography variant="h4">
                                    {stats.totalBenevolat}
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
                    Ajouter une Contribution
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                >
                    Filtrer
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={printContributions}
                >
                    Imprimer
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={fetchContributions}
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
                        <InputLabel>Type de Contribution</InputLabel>
                        <Select
                            value={filters.type_contribution}
                            onChange={(e) => handleFilterChange('type_contribution', e.target.value)}
                            label="Type de Contribution"
                        >
                            <MenuItem value="">Tous</MenuItem>
                            {typesContribution.map(type => (
                                <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                </MenuItem>
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
                            <MenuItem value="recu">Reçu</MenuItem>
                            <MenuItem value="en_attente">En attente</MenuItem>
                            <MenuItem value="annule">Annulé</MenuItem>
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
                                <TableCell>Type</TableCell>
                                <TableCell>Nature</TableCell>
                                <TableCell>Montant/Valeur</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredContributions.map((contribution) => {
                                const typeInfo = getTypeInfo(contribution.type_contribution);
                                const rowId = contribution.id_contribution || contribution.id;
                                return (
                                    <TableRow key={rowId} hover>
                                        <TableCell>{formatDate(contribution.date_contribution)}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ width: 32, height: 32, bgcolor: typeInfo.color }}>
                                                    {typeInfo.icon}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {contribution.nom} {contribution.prenom}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {contribution.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {typeInfo.icon}
                                                <Typography variant="body2">
                                                    {typeInfo.label}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{getNatureLabel(contribution.nature)}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold" color="primary">
                                                {contribution.montant || 'N/A'}
                                                {contribution.nature === 'financiere' && contribution.montant ? ` ${getDeviseLabel(contribution.devise)}` : ''}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {contribution.description || 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => navigate(`/contributions/${rowId}`)}
                                                >
                                                    <Edit />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/contributions/${rowId}`)}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDelete(rowId)}
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Dialog d'ajout de contribution */}
            <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Ajouter une Contribution</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Type de donateur</InputLabel>
                                <Select
                                    value={formData.donateur_type}
                                    label="Type de donateur"
                                    onChange={(e) => setFormData(prev => ({ ...prev, donateur_type: e.target.value, membre_id: '' }))}
                                >
                                    <MenuItem value="membre">Membre de l'association</MenuItem>
                                    <MenuItem value="externe">Donateur externe</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            {formData.donateur_type === 'membre' ? (
                                <FormControl fullWidth required>
                                    <InputLabel>Membre</InputLabel>
                                    <Select
                                        value={formData.membre_id}
                                        onChange={(e) => setFormData(prev => ({ ...prev, membre_id: e.target.value }))}
                                        label="Membre"
                                    >
                                        {members.map(member => (
                                            <MenuItem key={member.id_membre} value={member.id_membre}>
                                                {member.nom} {member.prenom} (#{member.id_membre})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            ) : (
                                <TextField
                                    label="Nom du donateur"
                                    value={formData.donateur_nom}
                                    onChange={(e) => setFormData(prev => ({ ...prev, donateur_nom: e.target.value }))}
                                    required
                                    fullWidth
                                />
                            )}
                        </Grid>
                        <Grid item xs={12} md={6}>
                            {formData.donateur_type === 'membre' ? (
                                <TextField
                                    label="Prénom du donateur"
                                    value={formData.donateur_prenom}
                                    onChange={(e) => setFormData(prev => ({ ...prev, donateur_prenom: e.target.value }))}
                                    fullWidth
                                />
                            ) : (
                                <TextField
                                    label="Prénom du donateur"
                                    value={formData.donateur_prenom}
                                    onChange={(e) => setFormData(prev => ({ ...prev, donateur_prenom: e.target.value }))}
                                    fullWidth
                                />
                            )}
                        </Grid>
                        {formData.donateur_type === 'externe' && (
                            <>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Email du donateur (optionnel)"
                                        type="email"
                                        value={formData.donateur_email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, donateur_email: e.target.value }))}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Téléphone du donateur (optionnel)"
                                        value={formData.donateur_telephone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, donateur_telephone: e.target.value }))}
                                        fullWidth
                                    />
                                </Grid>
                            </>
                        )}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Type de Contribution</InputLabel>
                                <Select
                                    value={formData.type_contribution}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type_contribution: e.target.value }))}
                                    label="Type de Contribution"
                                >
                                    {typesContribution.map(type => (
                                        <MenuItem key={type.value} value={type.value}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {type.icon}
                                                {type.label}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Nature</InputLabel>
                                <Select
                                    value={formData.nature}
                                    onChange={(e) => setFormData(prev => ({ ...prev, nature: e.target.value }))}
                                    label="Nature"
                                >
                                    {natures.map(nature => (
                                        <MenuItem key={nature.value} value={nature.value}>
                                            {nature.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label={formData.nature === 'financiere' ? `Montant (${formData.devise === 'CDF' ? 'FC' : '$'})` : 'Valeur/Description'}
                                type={formData.nature === 'financiere' ? 'number' : 'text'}
                                value={formData.montant}
                                onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
                                required={formData.nature === 'financiere'}
                                fullWidth
                                helperText={formData.nature === 'financiere' ? 'Entrez le montant dans la devise choisie' : 'Décrivez la valeur matérielle ou le service'}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth disabled={formData.nature !== 'financiere'}>
                                <InputLabel>Devise</InputLabel>
                                <Select
                                    value={formData.devise}
                                    onChange={(e) => setFormData(prev => ({ ...prev, devise: e.target.value }))}
                                    label="Devise"
                                >
                                    <MenuItem value="USD">Dollar américain ($)</MenuItem>
                                    <MenuItem value="CDF">Franc congolais (FC)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Description"
                                multiline
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                fullWidth
                                helperText="Décrivez en détail la contribution (objet du don, type de service, etc.)"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Date de Contribution"
                                type="date"
                                value={formData.date_contribution}
                                onChange={(e) => setFormData(prev => ({ ...prev, date_contribution: e.target.value }))}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Statut</InputLabel>
                                <Select
                                    value={formData.statut}
                                    onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value }))}
                                    label="Statut"
                                >
                                    <MenuItem value="recu">Reçu</MenuItem>
                                    <MenuItem value="en_attente">En attente</MenuItem>
                                    <MenuItem value="annule">Annulé</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Référence"
                                value={formData.reference}
                                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                                fullWidth
                                helperText="Numéro de reçu, référence de transaction, etc."
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAddDialog(false)}>Annuler</Button>
                    <Button
                        onClick={handleAddContribution}
                        variant="contained"
                        disabled={
                            submitting ||
                            (formData.donateur_type === 'membre' && !formData.membre_id) ||
                            (formData.donateur_type === 'externe' && !formData.donateur_nom) ||
                            (formData.nature === 'financiere' && !formData.montant)
                        }
                        sx={{ bgcolor: '#19d279', '&:hover': { bgcolor: '#12a85e' } }}
                    >
                        {submitting ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Contributions;

