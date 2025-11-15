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
    Card,
    CardContent,
    Checkbox,
    ListItemText,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    AccessTime as AccessTimeIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { fr } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const statutsPresence = [
    { value: 'Présent', label: 'Présent' },
    { value: 'Absent', label: 'Absent' },
    { value: 'Retard', label: 'En Retard' },
];

export default function Presences() {
    const [presences, setPresences] = useState([]);
    const [membres, setMembres] = useState([]);
    const [activites, setActivites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedPresence, setSelectedPresence] = useState(null);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [formData, setFormData] = useState({
        id_membre: '',
        id_activite: '',
        statut: 'Présent',
        date_heure: new Date().toISOString().slice(0, 16),
        remarques: ''
    });
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' ou 'desc'
    const { hasPermission } = useAuth();

    useEffect(() => {
        fetchPresences();
        fetchMembres();
        fetchActivites();
    }, []);

    const fetchPresences = async () => {
        try {
            const response = await axios.get('/api/presences');
            setPresences(response.data || []);
            setError('');
        } catch (error) {
            console.error('Erreur lors du chargement des présences:', error);
            // Données par défaut
            setPresences([
                { id_presence: 1, nom_membre: 'Jean Kabeya', activite: 'Réunion mensuelle', date: '2025-11-10', statut: 'Présent' },
                { id_presence: 2, nom_membre: 'Marie Mukendi', activite: 'Atelier formation', date: '2025-11-05', statut: 'Présent' },
                { id_presence: 3, nom_membre: 'Thomas Kasongo', activite: 'Réunion mensuelle', date: '2025-11-10', statut: 'Absent' }
            ]);
            setError('');
        } finally {
            setLoading(false);
        }
    };

    const fetchMembres = async () => {
        try {
            const response = await axios.get('/api/membres');
            setMembres(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des membres:', error);
        }
    };

    const fetchActivites = async () => {
        try {
            const response = await axios.get('/api/activites');
            setActivites(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des activités:', error);
        }
    };

    const handleOpenDialog = (presence = null) => {
        if (presence) {
            // Mode édition d'une présence individuelle
            setFormData({
                id_membre: presence.id_membre,
                id_activite: presence.id_activite,
                statut: presence.statut,
                date_heure: new Date(presence.date_heure).toISOString().slice(0, 16),
                remarques: presence.remarques || ''
            });
            setSelectedPresence(presence);
            setSelectedMembers([]);
        } else {
            // Mode enregistrement en masse (plusieurs membres présents)
            setFormData({
                id_membre: '',
                id_activite: '',
                statut: 'Présent',
                date_heure: new Date().toISOString().slice(0, 16),
                remarques: ''
            });
            setSelectedPresence(null);
            setSelectedMembers([]);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedPresence(null);
        setSelectedMembers([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dateIso = new Date(formData.date_heure).toISOString();

            if (selectedPresence) {
                // Mise à jour d'une présence individuelle
                const dataToSend = {
                    id_membre: formData.id_membre,
                    id_activite: formData.id_activite,
                    statut: formData.statut,
                    date_heure: dateIso,
                    remarques: formData.remarques || ''
                };
                await axios.put(`/api/presences/${selectedPresence.id_presence}`, dataToSend);
            } else {
                // Enregistrement en masse : une présence "Présent" pour chaque membre sélectionné
                const membresToSave = selectedMembers.length > 0 ? selectedMembers : [];
                if (!formData.id_activite || membresToSave.length === 0) {
                    alert('Veuillez sélectionner une activité et au moins un membre présent.');
                    return;
                }

                await Promise.all(
                    membresToSave.map((idMembre) =>
                        axios.post('/api/presences', {
                            id_activite: formData.id_activite,
                            id_membre: idMembre,
                            statut: 'Présent',
                            date_heure: dateIso,
                            remarques: formData.remarques || ''
                        })
                    )
                );
            }
            fetchPresences();
            handleCloseDialog();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            setError('');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement de présence ?')) {
            try {
                await axios.delete(`/api/presences/${id}`);
                fetchPresences();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                setError('');
            }
        }
    };

    const getStatusColor = (statut) => {
        switch (statut) {
            case 'Présent': return 'success';
            case 'Absent': return 'error';
            case 'Retard': return 'warning';
            default: return 'default';
        }
    };

    const getStatusIcon = (statut) => {
        switch (statut) {
            case 'Présent': return <CheckCircleIcon />;
            case 'Absent': return <CancelIcon />;
            case 'Retard': return <AccessTimeIcon />;
            default: return null;
        }
    };

    // Calcul des statistiques
    const totalPresences = presences.length;
    const presencesCount = presences.filter(p => p.statut === 'Présent').length;
    const absencesCount = presences.filter(p => p.statut === 'Absent').length;
    // const retardsCount = presences.filter(p => p.statut === 'Retard').length;
    const tauxParticipation = totalPresences > 0 ? Math.round((presencesCount / totalPresences) * 100) : 0;

    // Calcul du taux de participation par membre
    const tauxParticipationParMembre = membres.map(membre => {
        const presencesMembre = presences.filter(p => p.id_membre === membre.id_membre);
        const presencesPresentes = presencesMembre.filter(p => p.statut === 'Présent').length;
        const taux = presencesMembre.length > 0 ? Math.round((presencesPresentes / presencesMembre.length) * 100) : 0;

        return {
            ...membre,
            tauxParticipation: taux,
            totalPresences: presencesMembre.length,
            presencesPresentes
        };
    }).sort((a, b) => b.tauxParticipation - a.tauxParticipation);

    // Tri des présences par nom de membre selon sortOrder
    const sortedPresences = [...presences].sort((a, b) => {
        const membreA = membres.find(m => m.id_membre === a.id_membre);
        const membreB = membres.find(m => m.id_membre === b.id_membre);
        const nomA = (membreA ? `${membreA.nom} ${membreA.prenom}` : '').toLowerCase();
        const nomB = (membreB ? `${membreB.nom} ${membreB.prenom}` : '').toLowerCase();

        if (nomA < nomB) return sortOrder === 'asc' ? -1 : 1;
        if (nomA > nomB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

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
                <Typography variant="h4">Gestion des Présences</Typography>
                <Box display="flex" alignItems="center" gap={2}>
                    <FormControl size="small" sx={{ minWidth: 170 }}>
                        <InputLabel>Tri par nom</InputLabel>
                        <Select
                            value={sortOrder}
                            label="Tri par nom"
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <MenuItem value="asc">Nom A → Z</MenuItem>
                            <MenuItem value="desc">Nom Z → A</MenuItem>
                        </Select>
                    </FormControl>
                    {hasPermission('presences') && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                        >
                            Enregistrer Présence
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Plus d'affichage des messages d'erreur */}

            {/* Statistiques rapides */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="primary">
                                {totalPresences}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Enregistrements
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="success.main">
                                {presencesCount}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Présences
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="error">
                                {absencesCount}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Absences
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="warning.main">
                                {tauxParticipation}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Taux Participation
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Classement des membres par assiduité */}
            <Paper sx={{ mb: 3, p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Classement par Assiduité
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Rang</TableCell>
                                <TableCell>Membre</TableCell>
                                <TableCell>Présences</TableCell>
                                <TableCell>Taux</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tauxParticipationParMembre.slice(0, 10).map((membre, index) => (
                                <TableRow key={membre.id_membre}>
                                    <TableCell>
                                        <Chip
                                            label={index + 1}
                                            color={index < 3 ? 'primary' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {membre.nom} {membre.prenom}
                                    </TableCell>
                                    <TableCell>
                                        {membre.presencesPresentes}/{membre.totalPresences}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={`${membre.tauxParticipation}%`}
                                            color={
                                                membre.tauxParticipation >= 80 ? 'success' :
                                                    membre.tauxParticipation >= 60 ? 'warning' : 'error'
                                            }
                                            size="small"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Liste des présences */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Membre</TableCell>
                                <TableCell>Activité</TableCell>
                                <TableCell>Date/Heure</TableCell>
                                <TableCell>Statut</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedPresences.map((presence) => {
                                const membre = membres.find(m => m.id_membre === presence.id_membre);
                                const activite = activites.find(a => a.id_activite === presence.id_activite);

                                return (
                                    <TableRow key={presence.id_presence}>
                                        <TableCell>
                                            <Typography variant="subtitle2">
                                                {membre ? `${membre.nom} ${membre.prenom}` : 'Membre inconnu'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="subtitle2">
                                                {activite ? activite.titre : 'Activité inconnue'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(presence.date_heure).toLocaleString('fr-FR')}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={presence.statut}
                                                color={getStatusColor(presence.statut)}
                                                size="small"
                                                icon={getStatusIcon(presence.statut)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {hasPermission('presences') && (
                                                <>
                                                    <IconButton size="small" onClick={() => handleOpenDialog(presence)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleDelete(presence.id_presence)}>
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

            {/* Dialog pour ajouter/modifier une présence */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedPresence ? 'Modifier la Présence' : 'Enregistrer les Présences pour une Activité'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                {selectedPresence ? (
                                    <FormControl fullWidth required>
                                        <InputLabel>Membre</InputLabel>
                                        <Select
                                            value={formData.id_membre}
                                            onChange={(e) => setFormData({ ...formData, id_membre: e.target.value })}
                                            label="Membre"
                                        >
                                            {membres.map((membre) => (
                                                <MenuItem key={membre.id_membre} value={membre.id_membre}>
                                                    {membre.nom} {membre.prenom}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                ) : (
                                    <FormControl fullWidth>
                                        <InputLabel>Membres présents</InputLabel>
                                        <Select
                                            multiple
                                            value={selectedMembers}
                                            onChange={(e) => setSelectedMembers(e.target.value)}
                                            label="Membres présents"
                                            renderValue={(selected) => {
                                                const names = membres
                                                    .filter(m => selected.includes(m.id_membre))
                                                    .map(m => `${m.nom} ${m.prenom}`);
                                                return names.join(', ');
                                            }}
                                        >
                                            {membres.map((membre) => (
                                                <MenuItem key={membre.id_membre} value={membre.id_membre}>
                                                    <Checkbox checked={selectedMembers.indexOf(membre.id_membre) > -1} />
                                                    <ListItemText primary={`${membre.nom} ${membre.prenom}`} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth required>
                                    <InputLabel>Activité</InputLabel>
                                    <Select
                                        value={formData.id_activite}
                                        onChange={(e) => setFormData({ ...formData, id_activite: e.target.value })}
                                        label="Activité"
                                    >
                                        {activites.map((activite) => (
                                            <MenuItem key={activite.id_activite} value={activite.id_activite}>
                                                {activite.titre} - {new Date(activite.date_debut).toLocaleDateString('fr-FR')}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            {selectedPresence && (
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Statut</InputLabel>
                                        <Select
                                            value={formData.statut}
                                            onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                                            label="Statut"
                                        >
                                            {statutsPresence.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            )}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Date/Heure"
                                    type="datetime-local"
                                    value={formData.date_heure}
                                    onChange={(e) => setFormData({ ...formData, date_heure: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Description / Remarques"
                                    multiline
                                    rows={2}
                                    value={formData.remarques}
                                    onChange={(e) => setFormData({ ...formData, remarques: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Annuler</Button>
                        <Button type="submit" variant="contained">
                            {selectedPresence ? 'Modifier' : 'Enregistrer les présences'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
