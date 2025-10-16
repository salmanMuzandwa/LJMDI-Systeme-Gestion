import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    Avatar,
    Tooltip,
    Alert,
    CircularProgress,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const statuts = [
    { value: 'Actif', label: 'Actif' },
    { value: 'Inactif', label: 'Inactif' },
    { value: 'Régulier', label: 'Régulier' },
];

export default function Membres() {
    const [membres, setMembres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedMembre, setSelectedMembre] = useState([]);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        date_adhesion: '',
        statut: 'Actif',
        adresse: '',
        profession: ''
    });
    const { hasPermission } = useAuth();

    useEffect(() => {
        fetchMembres();
    }, []);

    const fetchMembres = async () => {
        try {
            const response = await axios.get('/api/membres');
            setMembres(response.data);
        } catch (error) {
            setError('Erreur lors du chargement des membres');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (membre = []) => {
        if (membre) {
            setFormData(membre);
            setSelectedMembre(membre);
        } else {
            setFormData({
                nom: '',
                prenom: '',
                email: '',
                telephone: '',
                date_adhesion: new Date().toISOString().split('T')[0],
                statut: 'Actif',
                adresse: '',
                profession: ''
            });
            setSelectedMembre([]);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedMembre([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedMembre) {
                await axios.put(`/api/membres/${selectedMembre.id_membre}`, formData);
            } else {
                await axios.post('/api/membres', formData);
            }
            fetchMembres();
            handleCloseDialog();
        } catch (error) {
            setError('Erreur lors de la sauvegarde');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
            try {
                await axios.delete(`/api/membres/${id}`);
                fetchMembres();
            } catch (error) {
                setError('Erreur lors de la suppression');
            }
        }
    };

    const getStatusColor = (statut) => {
        switch (statut) {
            case 'Actif': return 'success';
            case 'Inactif': return 'error';
            case 'Régulier': return 'info';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Gestion des Membres</Typography>
                {hasPermission('membres') && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Nouveau Membre
                    </Button>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Photo</TableCell>
                                <TableCell>Nom</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Téléphone</TableCell>
                                <TableCell>Date Adhésion</TableCell>
                                <TableCell>Statut</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {membres.map((membre) => (
                                <TableRow key={membre.id_membre}>
                                    <TableCell>
                                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                                            {membre.nom?.charAt(0)}{membre.prenom?.charAt(0)}
                                        </Avatar>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2">
                                            {membre.nom} {membre.prenom}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {membre.profession}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center">
                                            <EmailIcon sx={{ mr: 1, fontSize: 16 }} />
                                            {membre.email}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center">
                                            <PhoneIcon sx={{ mr: 1, fontSize: 16 }} />
                                            {membre.telephone}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(membre.date_adhesion).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={membre.statut}
                                            color={getStatusColor(membre.statut)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="Voir détails">
                                            <IconButton size="small" onClick={() => handleOpenDialog(membre)}>
                                                <ViewIcon />
                                            </IconButton>
                                        </Tooltip>
                                        {hasPermission('membres') && (
                                            <>
                                                <Tooltip title="Modifier">
                                                    <IconButton size="small" onClick={() => handleOpenDialog(membre)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Supprimer">
                                                    <IconButton size="small" onClick={() => handleDelete(membre.id_membre)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Dialog pour ajouter/modifier un membre */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedMembre ? 'Modifier le Membre' : 'Nouveau Membre'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Nom"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Prénom"
                                    name="prenom"
                                    value={formData.prenom}
                                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Téléphone"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Date d'Adhésion"
                                    name="date_adhesion"
                                    type="date"
                                    value={formData.date_adhesion}
                                    onChange={(e) => setFormData({ ...formData, date_adhesion: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Statut"
                                    name="statut"
                                    value={formData.statut}
                                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                                    required
                                >
                                    {statuts.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Adresse"
                                    name="adresse"
                                    multiline
                                    rows={2}
                                    value={formData.adresse}
                                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Profession"
                                    name="profession"
                                    value={formData.profession}
                                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Annuler</Button>
                        <Button type="submit" variant="contained">
                            {selectedMembre ? 'Modifier' : 'Ajouter'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
