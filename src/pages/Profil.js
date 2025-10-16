import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Avatar,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Divider,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import {
    Edit as EditIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    Work as WorkIcon,
    CalendarToday as CalendarIcon,
    AccountBalance as AccountBalanceIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export default function Profil() {
    const [user, setUser] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        adresse: '',
        profession: ''
    });
    const [userStats, setUserStats] = useState([]);
    const { user: authUser, hasPermission } = useAuth();

    useEffect(() => {
        fetchUserData();
        fetchUserStats();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await axios.get('/api/user/profile');
            setUser(response.data);
            setFormData(response.data);
        } catch (error) {
            setError('Erreur lors du chargement du profil');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserStats = async () => {
        try {
            const response = await axios.get('/api/user/stats');
            setUserStats(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
        }
    };

    const handleOpenDialog = () => {
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setFormData(user);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put('/api/user/profile', formData);
            setUser(formData);
            setDialogOpen(false);
            setSuccess('Profil mis à jour avec succès');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError('Erreur lors de la mise à jour du profil');
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

    const getRoleColor = (role) => {
        switch (role) {
            case 'Administrateur': return 'error';
            case 'Président': return 'error';
            case 'Secrétaire Général': return 'primary';
            case 'Trésorier': return 'success';
            case 'Chargé de Discipline': return 'warning';
            case 'Membre': return 'default';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography>Chargement...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Mon Profil
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Informations personnelles */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Avatar
                                sx={{
                                    width: 120,
                                    height: 120,
                                    fontSize: 48,
                                    mx: 'auto',
                                    mb: 2,
                                    bgcolor: 'primary.main'
                                }}
                            >
                                {user?.nom?.charAt(0)}{user?.prenom?.charAt(0)}
                            </Avatar>

                            <Typography variant="h5" gutterBottom>
                                {user?.nom} {user?.prenom}
                            </Typography>

                            <Chip
                                label={user?.role}
                                color={getRoleColor(user?.role)}
                                sx={{ mb: 1 }}
                            />

                            <Chip
                                label={user?.statut}
                                color={getStatusColor(user?.statut)}
                                sx={{ ml: 1 }}
                            />

                            <Box sx={{ mt: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={handleOpenDialog}
                                >
                                    Modifier le Profil
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Détails du profil */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Informations Personnelles
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <EmailIcon sx={{ mr: 2, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Email
                                            </Typography>
                                            <Typography variant="body1">
                                                {user?.email}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <PhoneIcon sx={{ mr: 2, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Téléphone
                                            </Typography>
                                            <Typography variant="body1">
                                                {user?.telephone || 'Non renseigné'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <LocationIcon sx={{ mr: 2, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Adresse
                                            </Typography>
                                            <Typography variant="body1">
                                                {user?.adresse || 'Non renseignée'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <WorkIcon sx={{ mr: 2, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Profession
                                            </Typography>
                                            <Typography variant="body1">
                                                {user?.profession || 'Non renseignée'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <CalendarIcon sx={{ mr: 2, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Date d'Adhésion
                                            </Typography>
                                            <Typography variant="body1">
                                                {user?.date_adhesion ? new Date(user.date_adhesion).toLocaleDateString('fr-FR') : 'Non renseignée'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <CalendarIcon sx={{ mr: 2, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Dernière Connexion
                                            </Typography>
                                            <Typography variant="body1">
                                                {user?.derniere_connexion ? new Date(user.derniere_connexion).toLocaleString('fr-FR') : 'Jamais'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Statistiques personnelles */}
                {userStats && (
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Mes Statistiques
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box display="flex" alignItems="center">
                                            <AccountBalanceIcon sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
                                            <Box>
                                                <Typography variant="h6" color="primary">
                                                    {userStats.totalContributions || 0} $
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Total Contributions
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box display="flex" alignItems="center">
                                            <CheckCircleIcon sx={{ mr: 2, color: 'success.main', fontSize: 40 }} />
                                            <Box>
                                                <Typography variant="h6" color="success.main">
                                                    {userStats.totalPresences || 0}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Présences
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box display="flex" alignItems="center">
                                            <TrendingUpIcon sx={{ mr: 2, color: 'info.main', fontSize: 40 }} />
                                            <Box>
                                                <Typography variant="h6" color="info.main">
                                                    {userStats.tauxParticipation || 0}%
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Taux Participation
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box display="flex" alignItems="center">
                                            <CalendarIcon sx={{ mr: 2, color: 'warning.main', fontSize: 40 }} />
                                            <Box>
                                                <Typography variant="h6" color="warning.main">
                                                    {userStats.activitesParticipees || 0}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Activités Participées
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Activités récentes */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Activités Récentes
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <List>
                                {userStats?.activitesRecentess?.map((activite, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            <CheckCircleIcon color="success" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={activite.titre}
                                            secondary={`${activite.date} - ${activite.statut}`}
                                        />
                                    </ListItem>
                                ))}
                                {(!userStats?.activitesRecentess || userStats.activitesRecentess.length === 0) && (
                                    <ListItem>
                                        <ListItemText primary="Aucune activité récente" />
                                    </ListItem>
                                )}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Dialog pour modifier le profil */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>Modifier le Profil</DialogTitle>
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
                                />
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
                            Sauvegarder
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
