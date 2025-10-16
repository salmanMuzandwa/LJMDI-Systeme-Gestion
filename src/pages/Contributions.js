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
    Payment as PaymentIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { fr } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const typesCotisation = [
    { value: 'Hebdomadaire', label: 'Cotisation Hebdomadaire' },
    { value: 'Spéciale', label: 'Cotisation Spéciale' },
    { value: 'Annuelle', label: 'Cotisation Annuelle' },
];

const statutsPaiement = [
    { value: 'Payé', label: 'Payé' },
    { value: 'En Retard', label: 'En Retard' },
    { value: 'En Attente', label: 'En Attente' },
];

export default function Contributions() {
    const [contributions, setContributions] = useState([]);
    const [membres, setMembres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedContribution, setSelectedContribution] = useState([]);
    const [formData, setFormData] = useState({
        id_membre: '',
        type_cotisation: 'Hebdomadaire',
        montant: '',
        date_paiement: new Date(),
        statut_paiement: 'Payé'
    });
    const { hasPermission, user } = useAuth();

    useEffect(() => {
        fetchContributions();
        fetchMembres();
    }, []);

    const fetchContributions = async () => {
        try {
            const response = await axios.get('/api/contributions');
            setContributions(response.data);
        } catch (error) {
            setError('Erreur lors du chargement des contributions');
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

    const handleOpenDialog = (contribution = []) => {
        if (contribution) {
            setFormData({
                ...contribution,
                date_paiement: new Date(contribution.date_paiement)
            });
            setSelectedContribution(contribution);
        } else {
            setFormData({
                id_membre: '',
                type_cotisation: 'Hebdomadaire',
                montant: '',
                date_paiement: new Date(),
                statut_paiement: 'Payé'
            });
            setSelectedContribution([]);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedContribution([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                ...formData,
                date_paiement: formData.date_paiement.toISOString().split('T')[0]
            };

            if (selectedContribution) {
                await axios.put(`/api/contributions/${selectedContribution.id_contribution}`, dataToSend);
            } else {
                await axios.post('/api/contributions', dataToSend);
            }
            fetchContributions();
            handleCloseDialog();
        } catch (error) {
            setError('Erreur lors de la sauvegarde');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette contribution ?')) {
            try {
                await axios.delete(`/api/contributions/${id}`);
                fetchContributions();
            } catch (error) {
                setError('Erreur lors de la suppression');
            }
        }
    };

    const getStatusColor = (statut) => {
        switch (statut) {
            case 'Payé': return 'success';
            case 'En Retard': return 'error';
            case 'En Attente': return 'warning';
            default: return 'default';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Hebdomadaire': return 'primary';
            case 'Spéciale': return 'secondary';
            case 'Annuelle': return 'info';
            default: return 'default';
        }
    };

    const totalContributions = contributions.reduce((sum, contrib) => sum + parseFloat(contrib.montant || 0), 0);
    const contributionsRetard = contributions.filter(contrib => contrib.statut_paiement === 'En Retard').length;

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
                <Typography variant="h4">Gestion des Contributions</Typography>
                {hasPermission('contributions') && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Nouvelle Contribution
                    </Button>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Statistiques rapides */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                            {totalContributions.toLocaleString('fr-FR')} $
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total des Contributions
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="error">
                            {contributionsRetard}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Contributions en Retard
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main">
                            {contributions.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total des Enregistrements
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Membre</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Montant</TableCell>
                                <TableCell>Date Paiement</TableCell>
                                <TableCell>Statut</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {contributions.map((contribution) => {
                                const membre = membres.find(m => m.id_membre === contribution.id_membre);
                                return (
                                    <TableRow key={contribution.id_contribution}>
                                        <TableCell>
                                            <Typography variant="subtitle2">
                                                {membre ? `${membre.nom} ${membre.prenom}` : 'Membre inconnu'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={contribution.type_cotisation}
                                                color={getTypeColor(contribution.type_cotisation)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="subtitle2" color="primary">
                                                {parseFloat(contribution.montant).toLocaleString('fr-FR')} $
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(contribution.date_paiement).toLocaleDateString('fr-FR')}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={contribution.statut_paiement}
                                                color={getStatusColor(contribution.statut_paiement)}
                                                size="small"
                                                icon={contribution.statut_paiement === 'En Retard' ? <WarningIcon /> : <PaymentIcon />}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {hasPermission('contributions') && (
                                                <>
                                                    <IconButton size="small" onClick={() => handleOpenDialog(contribution)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleDelete(contribution.id_contribution)}>
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

            {/* Dialog pour ajouter/modifier une contribution */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedContribution ? 'Modifier la Contribution' : 'Nouvelle Contribution'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
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
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Type de Cotisation</InputLabel>
                                    <Select
                                        value={formData.type_cotisation}
                                        onChange={(e) => setFormData({ ...formData, type_cotisation: e.target.value })}
                                        label="Type de Cotisation"
                                    >
                                        {typesCotisation.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Montant"
                                    name="montant"
                                    type="number"
                                    value={formData.montant}
                                    onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                                    required
                                    inputProps={{ min: 0, step: 0.01 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Date de Paiement"
                                    type="date"
                                    value={formData.date_paiement}
                                    onChange={(e) => setFormData({ ...formData, date_paiement: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Statut</InputLabel>
                                    <Select
                                        value={formData.statut_paiement}
                                        onChange={(e) => setFormData({ ...formData, statut_paiement: e.target.value })}
                                        label="Statut"
                                    >
                                        {statutsPaiement.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Annuler</Button>
                        <Button type="submit" variant="contained">
                            {selectedContribution ? 'Modifier' : 'Ajouter'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
