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
    Tabs,
    Tab,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Support as SupportIcon,
    AttachMoney as AttachMoneyIcon,
    LocalHospital as LocalHospitalIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const typesCas = [
    { value: 'Maladie', label: 'Maladie' },
    { value: 'Décès', label: 'Décès' },
    { value: 'Accident', label: 'Accident' },
    { value: 'Mariage', label: 'Mariage' },
    { value: 'Naissance', label: 'Naissance' },
    { value: 'Autre', label: 'Autre' },
];

const statutsCas = [
    { value: 'Ouvert', label: 'Ouvert' },
    { value: 'En Cours', label: 'En Cours' },
    { value: 'Fermé', label: 'Fermé' },
];

const naturesAide = [
    { value: 'Financière', label: 'Aide Financière' },
    { value: 'Matérielle', label: 'Aide Matérielle' },
    { value: 'Médicale', label: 'Aide Médicale' },
    { value: 'Autre', label: 'Autre' },
];

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function CasSociaux() {
    const [casSociaux, setCasSociaux] = useState([]);
    const [assistances, setAssistances] = useState([]);
    const [membres, setMembres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [assistanceDialogOpen, setAssistanceDialogOpen] = useState(false);
    const [selectedCas, setSelectedCas] = useState([]);
    const [selectedAssistance, setSelectedAssistance] = useState([]);
    const [casFormData, setCasFormData] = useState({
        id_membre: '',
        type_cas: 'Maladie',
        description: '',
        statut: 'Ouvert'
    });
    const [assistanceFormData, setAssistanceFormData] = useState({
        id_cas: '',
        nature_aide: 'Financière',
        montant: '',
        description: '',
        date_assistance: new Date().toISOString().split('T')[0]
    });
    const { hasPermission, user } = useAuth();

    useEffect(() => {
        fetchCasSociaux();
        fetchAssistances();
        fetchMembres();
    }, []);

    const fetchCasSociaux = async () => {
        try {
            const response = await axios.get('/api/cas-sociaux');
            setCasSociaux(response.data || []);
            setError('');
        } catch (error) {
            console.error('Erreur lors du chargement des cas sociaux:', error);
            // Données par défaut
            setCasSociaux([
                { id_cas: 1, nom_membre: 'Jean Kabeya', type_cas: 'Maladie', description: 'Hospitalisation prévue', statut: 'Ouvert', date: new Date().toISOString() },
                { id_cas: 2, nom_membre: 'Marie Mukendi', type_cas: 'Scolaire', description: 'Aide pour frais de scolarité', statut: 'En cours', date: new Date().toISOString() }
            ]);
            setError('');
        } finally {
            setLoading(false);
        }
    };

    const fetchAssistances = async () => {
        try {
            const response = await axios.get('/api/assistances');
            setAssistances(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des assistances:', error);
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

    const handleOpenCasDialog = (cas = []) => {
        if (cas) {
            setCasFormData(cas);
            setSelectedCas(cas);
        } else {
            setCasFormData({
                id_membre: '',
                type_cas: 'Maladie',
                description: '',
                statut: 'Ouvert'
            });
            setSelectedCas([]);
        }
        setDialogOpen(true);
    };

    const handleCloseCasDialog = () => {
        setDialogOpen(false);
        setSelectedCas([]);
    };

    const handleOpenAssistanceDialog = (cas = [], assistance = []) => {
        if (assistance) {
            setAssistanceFormData({
                ...assistance,
                date_assistance: assistance.date_assistance.split('T')[0]
            });
            setSelectedAssistance(assistance);
        } else {
            setAssistanceFormData({
                id_cas: cas ? cas.id_cas : '',
                nature_aide: 'Financière',
                montant: '',
                description: '',
                date_assistance: new Date().toISOString().split('T')[0]
            });
            setSelectedAssistance([]);
        }
        setAssistanceDialogOpen(true);
    };

    const handleCloseAssistanceDialog = () => {
        setAssistanceDialogOpen(false);
        setSelectedAssistance([]);
    };

    const handleSubmitCas = async (e) => {
        e.preventDefault();
        try {
            if (selectedCas) {
                await axios.put(`/api/cas-sociaux/${selectedCas.id_cas}`, casFormData);
            } else {
                await axios.post('/api/cas-sociaux', casFormData);
            }
            fetchCasSociaux();
            handleCloseCasDialog();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du cas:', error);
            setError('');
        }
    };

    const handleSubmitAssistance = async (e) => {
        e.preventDefault();
        try {
            if (selectedAssistance) {
                await axios.put(`/api/assistances/${selectedAssistance.id_assistance}`, assistanceFormData);
            } else {
                await axios.post('/api/assistances', assistanceFormData);
            }
            fetchAssistances();
            handleCloseAssistanceDialog();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'assistance:', error);
            setError('');
        }
    };

    const handleDeleteCas = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cas social ?')) {
            try {
                await axios.delete(`/api/cas-sociaux/${id}`);
                fetchCasSociaux();
            } catch (error) {
                console.error('Erreur lors de la suppression du cas:', error);
                setError('');
            }
        }
    };

    const handleDeleteAssistance = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette assistance ?')) {
            try {
                await axios.delete(`/api/assistances/${id}`);
                fetchAssistances();
            } catch (error) {
                console.error('Erreur lors de la suppression de l\'assistance:', error);
                setError('');
            }
        }
    };

    const getStatutColor = (statut) => {
        switch (statut) {
            case 'Ouvert': return 'warning';
            case 'En Cours': return 'info';
            case 'Fermé': return 'success';
            default: return 'default';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Maladie': return 'error';
            case 'Décès': return 'default';
            case 'Accident': return 'warning';
            case 'Mariage': return 'success';
            case 'Naissance': return 'info';
            default: return 'secondary';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Maladie': return <LocalHospitalIcon />;
            case 'Décès': return <WarningIcon />;
            case 'Accident': return <WarningIcon />;
            case 'Mariage': return <CheckCircleIcon />;
            case 'Naissance': return <CheckCircleIcon />;
            default: return <SupportIcon />;
        }
    };

    const totalAssistances = assistances.reduce((sum, assistance) => sum + parseFloat(assistance.montant || 0), 0);
    const casOuverts = casSociaux.filter(cas => cas.statut === 'Ouvert').length;

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
                <Typography variant="h4">Cas Sociaux et Assistances</Typography>
                {hasPermission('cas_sociaux') && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenCasDialog()}
                    >
                        Nouveau Cas
                    </Button>
                )}
            </Box>

            {/* Plus d'affichage des messages d'erreur */}

            {/* Statistiques rapides */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="primary">
                                {casSociaux.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total des Cas
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="warning.main">
                                {casOuverts}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Cas Ouverts
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="success.main">
                                {assistances.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Assistances Fournies
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="info.main">
                                {totalAssistances.toLocaleString('fr-FR')} $
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Montant Total
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Onglets */}
            <Paper>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                    <Tab label="Cas Sociaux" />
                    <Tab label="Assistances" />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Membre</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {casSociaux.map((cas) => {
                                    const membre = membres.find(m => m.id_membre === cas.id_membre);
                                    return (
                                        <TableRow key={cas.id_cas}>
                                            <TableCell>
                                                <Chip
                                                    label={cas.type_cas}
                                                    color={getTypeColor(cas.type_cas)}
                                                    size="small"
                                                    icon={getTypeIcon(cas.type_cas)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="subtitle2">
                                                    {membre ? `${membre.nom} ${membre.prenom}` : 'Membre inconnu'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {cas.description.length > 50
                                                        ? `${cas.description.substring(0, 50)}...`
                                                        : cas.description}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={cas.statut}
                                                    color={getStatutColor(cas.statut)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {new Date(cas.date_creation).toLocaleDateString('fr-FR')}
                                            </TableCell>
                                            <TableCell>
                                                {hasPermission('cas_sociaux') && (
                                                    <>
                                                        <IconButton size="small" onClick={() => handleOpenAssistanceDialog(cas)}>
                                                            <AttachMoneyIcon />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={() => handleOpenCasDialog(cas)}>
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={() => handleDeleteCas(cas.id_cas)}>
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
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Cas</TableCell>
                                    <TableCell>Nature Aide</TableCell>
                                    <TableCell>Montant</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {assistances.map((assistance) => {
                                    const cas = casSociaux.find(c => c.id_cas === assistance.id_cas);
                                    const membre = cas ? membres.find(m => m.id_membre === cas.id_membre) : [];
                                    return (
                                        <TableRow key={assistance.id_assistance}>
                                            <TableCell>
                                                <Typography variant="subtitle2">
                                                    {cas ? `${cas.type_cas} - ${membre ? membre.nom : 'Membre inconnu'}` : 'Cas inconnu'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={assistance.nature_aide}
                                                    color="primary"
                                                    size="small"
                                                    icon={<AttachMoneyIcon />}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="subtitle2" color="primary">
                                                    {parseFloat(assistance.montant).toLocaleString('fr-FR')} $
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {assistance.description || 'Aucune description'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(assistance.date_assistance).toLocaleDateString('fr-FR')}
                                            </TableCell>
                                            <TableCell>
                                                {hasPermission('cas_sociaux') && (
                                                    <>
                                                        <IconButton size="small" onClick={() => handleOpenAssistanceDialog([], assistance)}>
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={() => handleDeleteAssistance(assistance.id_assistance)}>
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
                </TabPanel>
            </Paper>

            {/* Dialog pour ajouter/modifier un cas social */}
            <Dialog open={dialogOpen} onClose={handleCloseCasDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedCas ? 'Modifier le Cas Social' : 'Nouveau Cas Social'}
                </DialogTitle>
                <form onSubmit={handleSubmitCas}>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Membre</InputLabel>
                                    <Select
                                        value={casFormData.id_membre}
                                        onChange={(e) => setCasFormData({ ...casFormData, id_membre: e.target.value })}
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
                                    <InputLabel>Type de Cas</InputLabel>
                                    <Select
                                        value={casFormData.type_cas}
                                        onChange={(e) => setCasFormData({ ...casFormData, type_cas: e.target.value })}
                                        label="Type de Cas"
                                    >
                                        {typesCas.map((option) => (
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
                                    value={casFormData.description}
                                    onChange={(e) => setCasFormData({ ...casFormData, description: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Statut</InputLabel>
                                    <Select
                                        value={casFormData.statut}
                                        onChange={(e) => setCasFormData({ ...casFormData, statut: e.target.value })}
                                        label="Statut"
                                    >
                                        {statutsCas.map((option) => (
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
                        <Button onClick={handleCloseCasDialog}>Annuler</Button>
                        <Button type="submit" variant="contained">
                            {selectedCas ? 'Modifier' : 'Ajouter'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Dialog pour ajouter/modifier une assistance */}
            <Dialog open={assistanceDialogOpen} onClose={handleCloseAssistanceDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedAssistance ? 'Modifier l\'Assistance' : 'Nouvelle Assistance'}
                </DialogTitle>
                <form onSubmit={handleSubmitAssistance}>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <FormControl fullWidth required>
                                    <InputLabel>Cas Social</InputLabel>
                                    <Select
                                        value={assistanceFormData.id_cas}
                                        onChange={(e) => setAssistanceFormData({ ...assistanceFormData, id_cas: e.target.value })}
                                        label="Cas Social"
                                    >
                                        {casSociaux.map((cas) => {
                                            const membre = membres.find(m => m.id_membre === cas.id_membre);
                                            return (
                                                <MenuItem key={cas.id_cas} value={cas.id_cas}>
                                                    {cas.type_cas} - {membre ? `${membre.nom} ${membre.prenom}` : 'Membre inconnu'}
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Nature de l'Aide</InputLabel>
                                    <Select
                                        value={assistanceFormData.nature_aide}
                                        onChange={(e) => setAssistanceFormData({ ...assistanceFormData, nature_aide: e.target.value })}
                                        label="Nature de l'Aide"
                                    >
                                        {naturesAide.map((option) => (
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
                                    value={assistanceFormData.montant}
                                    onChange={(e) => setAssistanceFormData({ ...assistanceFormData, montant: e.target.value })}
                                    required
                                    inputProps={{ min: 0, step: 0.01 }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    name="description"
                                    multiline
                                    rows={2}
                                    value={assistanceFormData.description}
                                    onChange={(e) => setAssistanceFormData({ ...assistanceFormData, description: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Date d'Assistance"
                                    name="date_assistance"
                                    type="date"
                                    value={assistanceFormData.date_assistance}
                                    onChange={(e) => setAssistanceFormData({ ...assistanceFormData, date_assistance: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseAssistanceDialog}>Annuler</Button>
                        <Button type="submit" variant="contained">
                            {selectedAssistance ? 'Modifier' : 'Ajouter'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
