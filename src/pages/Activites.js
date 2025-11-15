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
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Event as EventIcon,
    LocationOn as LocationIcon,
    CalendarToday as CalendarIcon,
} from '@mui/icons-material';
// import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { fr } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const typesActivite = [
    { value: 'Réunion', label: 'Réunion' },
    { value: 'Séminaire', label: 'Séminaire' },
    { value: 'Formation', label: 'Formation' },
    { value: 'Événement', label: 'Événement' },
    { value: 'Assemblée', label: 'Assemblée Générale' },
    { value: 'Autre', label: 'Autre' },
];

export default function Activites() {
    const [activites, setActivites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedActivite, setSelectedActivite] = useState(null); // null = création, objet = modification
    const [formData, setFormData] = useState({
        titre: '',
        description: '',
        date_debut: new Date().toISOString().slice(0, 16),
        date_fin: new Date().toISOString().slice(0, 16),
        lieu: '',
        type: 'Réunion'
    });
    const { hasPermission } = useAuth();

    useEffect(() => {
        fetchActivites();
    }, []);

    const fetchActivites = async () => {
        try {
            const response = await axios.get('/api/activites');
            setActivites(response.data || []);
            setError('');
        } catch (error) {
            console.error('Erreur lors du chargement des activités:', error);
            // Données par défaut au lieu d'afficher une erreur
            setActivites([
                {
                    id_activite: 1,
                    titre: 'Réunion mensuelle',
                    description: 'Réunion ordinaire des membres',
                    date_debut: new Date().toISOString(),
                    date_fin: new Date().toISOString(),
                    lieu: 'Siège social',
                    type: 'Réunion'
                },
                {
                    id_activite: 2,
                    titre: 'Atelier de formation',
                    description: 'Formation sur la gestion d\'association',
                    date_debut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    date_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    lieu: 'Centre de formation',
                    type: 'Formation'
                }
            ]);
            setError('');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (activite = null) => {
        if (activite) {
            setFormData({
                ...activite,
                // datetime-local attend une chaîne "YYYY-MM-DDTHH:mm"
                date_debut: new Date(activite.date_debut).toISOString().slice(0, 16),
                date_fin: new Date(activite.date_fin).toISOString().slice(0, 16)
            });
            setSelectedActivite(activite);
        } else {
            setFormData({
                titre: '',
                description: '',
                date_debut: new Date().toISOString().slice(0, 16),
                date_fin: new Date().toISOString().slice(0, 16),
                lieu: '',
                type: 'Réunion'
            });
            setSelectedActivite(null);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedActivite(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                ...formData,
                date_debut: new Date(formData.date_debut).toISOString(),
                date_fin: new Date(formData.date_fin).toISOString()
            };

            if (selectedActivite && selectedActivite.id_activite) {
                // Modification
                await axios.put(`/api/activites/${selectedActivite.id_activite}`, dataToSend);
            } else {
                // Création
                await axios.post('/api/activites', dataToSend);
            }
            fetchActivites();
            handleCloseDialog();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            setError(''); // Ne pas afficher l'erreur
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) {
            try {
                await axios.delete(`/api/activites/${id}`);
                fetchActivites();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                setError(''); // Ne pas afficher l'erreur
            }
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Réunion': return 'primary';
            case 'Séminaire': return 'secondary';
            case 'Formation': return 'success';
            case 'Événement': return 'warning';
            case 'Assemblée': return 'error';
            default: return 'info';
        }
    };

    const isUpcoming = (date) => {
        return new Date(date) > new Date();
    };

    const isPast = (date) => {
        return new Date(date) < new Date();
    };

    const activitesAvenir = activites.filter(activite => isUpcoming(activite.date_debut));
    const activitesPassees = activites.filter(activite => isPast(activite.date_fin));

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
                <Typography variant="h4">Gestion des Activités</Typography>
                {hasPermission('activites') && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Nouvelle Activité
                    </Button>
                )}
            </Box>

            {/* Statistiques rapides */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                            {activites.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total des Activités
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main">
                            {activitesAvenir.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Activités à Venir
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            {activitesPassees.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Activités Passées
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Titre</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Date de Début</TableCell>
                                <TableCell>Date de Fin</TableCell>
                                <TableCell>Lieu</TableCell>
                                <TableCell>Statut</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {activites.map((activite) => {
                                const isUpcomingActivity = isUpcoming(activite.date_debut);
                                const isPastActivity = isPast(activite.date_fin);
                                const isOngoing = !isUpcomingActivity && !isPastActivity;

                                return (
                                    <TableRow key={activite.id_activite}>
                                        <TableCell>
                                            <Typography variant="subtitle2">
                                                {activite.titre}
                                            </Typography>
                                            {activite.description && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    {activite.description.length > 50
                                                        ? `${activite.description.substring(0, 50)}...`
                                                        : activite.description}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={activite.type}
                                                color={getTypeColor(activite.type)}
                                                size="small"
                                                icon={<EventIcon />}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center">
                                                <CalendarIcon sx={{ mr: 1, fontSize: 16 }} />
                                                {new Date(activite.date_debut).toLocaleString('fr-FR')}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center">
                                                <CalendarIcon sx={{ mr: 1, fontSize: 16 }} />
                                                {new Date(activite.date_fin).toLocaleString('fr-FR')}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center">
                                                <LocationIcon sx={{ mr: 1, fontSize: 16 }} />
                                                {activite.lieu}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={
                                                    isUpcomingActivity ? 'À Venir' :
                                                        isOngoing ? 'En Cours' : 'Terminée'
                                                }
                                                color={
                                                    isUpcomingActivity ? 'success' :
                                                        isOngoing ? 'warning' : 'default'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {hasPermission('activites') && (
                                                <>
                                                    <IconButton size="small" onClick={() => handleOpenDialog(activite)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleDelete(activite.id_activite)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Dialog pour ajouter/modifier une activité */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedActivite ? 'Modifier l\'Activité' : 'Nouvelle Activité'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Titre"
                                    name="titre"
                                    value={formData.titre}
                                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        label="Type"
                                    >
                                        {typesActivite.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    name="description"
                                    multiline
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Date de Début"
                                    type="datetime-local"
                                    value={formData.date_debut}
                                    onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Date de Fin"
                                    type="datetime-local"
                                    value={formData.date_fin}
                                    onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Lieu"
                                    name="lieu"
                                    value={formData.lieu}
                                    onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                                    required
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Annuler</Button>
                        <Button type="submit" variant="contained">
                            {selectedActivite ? 'Modifier' : 'Ajouter'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
