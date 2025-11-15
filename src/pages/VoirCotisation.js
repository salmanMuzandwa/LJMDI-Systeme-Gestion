import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Box, CircularProgress, Alert, Button,
    Card, CardContent, Grid, Divider, Chip
} from '@mui/material';
import { ArrowBack, Edit, Delete, Print, Receipt } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const VoirCotisation = () => {
    const [cotisation, setCotisation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCotisation = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/cotisations/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setCotisation(response.data);
                setError(null);
            } catch (err) {
                console.error("Erreur lors du chargement de la cotisation:", err);
                setError("Impossible de charger les détails de la cotisation");
                setCotisation(null);
            } finally {
                setLoading(false);
            }
        };

        if (token && id) {
            fetchCotisation();
        }
    }, [token, id]);

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString('fr-FR');
    };

    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleString('fr-FR');
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

    const printRecu = () => {
        const printWindow = window.open('', '_blank');
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reçu de Cotisation - LJMDI</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .header { text-align: center; margin-bottom: 40px; }
                    .header h1 { color: #19d279; margin-bottom: 10px; }
                    .header p { color: #666; }
                    .recu-info { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                    .info-item { margin-bottom: 15px; }
                    .info-label { font-weight: bold; color: #333; margin-bottom: 5px; }
                    .info-value { color: #666; }
                    .footer { text-align: center; margin-top: 50px; color: #666; }
                    .statut { padding: 8px 16px; border-radius: 20px; text-align: center; font-weight: bold; }
                    .statut.paye { background: #d4edda; color: #155724; }
                    .statut.impaye { background: #f8d7da; color: #721c24; }
                    .statut.en_attente { background: #fff3cd; color: #856404; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Reçu de Cotisation</h1>
                    <p>Ligue des Jeunes Musulmans pour le Développement Intégral</p>
                </div>
                
                <div class="recu-info">
                    <div class="info-item">
                        <div class="info-label">Numéro de Reçu</div>
                        <div class="info-value">#${cotisation?.id || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Date d'émission</div>
                        <div class="info-value">${formatDate(new Date())}</div>
                    </div>
                </div>
                
                <div class="info-grid">
                    <div>
                        <h3>Informations du Membre</h3>
                        <div class="info-item">
                            <div class="info-label">Nom Complet</div>
                            <div class="info-value">${cotisation?.nom} ${cotisation?.prenom}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">ID Membre</div>
                            <div class="info-value">${cotisation?.membre_code}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Email</div>
                            <div class="info-value">${cotisation?.email}</div>
                        </div>
                    </div>
                    
                    <div>
                        <h3>Détails de la Cotisation</h3>
                        <div class="info-item">
                            <div class="info-label">Montant</div>
                            <div class="info-value" style="font-size: 24px; font-weight: bold; color: #19d279;">
                                ${cotisation?.montant} $
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Type de Cotisation</div>
                            <div class="info-value">${cotisation?.type_cotisation?.charAt(0).toUpperCase() + cotisation?.type_cotisation?.slice(1)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Période</div>
                            <div class="info-value">${cotisation?.mois_cotisation} ${cotisation?.annee_cotisation}</div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h3>Informations de Paiement</h3>
                    <div class="info-grid">
                        <div>
                            <div class="info-item">
                                <div class="info-label">Date de Paiement</div>
                                <div class="info-value">${formatDate(cotisation?.date_paiement)}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Méthode de Paiement</div>
                                <div class="info-value">${cotisation?.methode_paiement?.charAt(0).toUpperCase() + cotisation?.methode_paiement?.slice(1) || 'N/A'}</div>
                            </div>
                        </div>
                        <div>
                            <div class="info-item">
                                <div class="info-label">Référence</div>
                                <div class="info-value">${cotisation?.reference_paiement || 'N/A'}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Statut</div>
                                <div class="statut ${cotisation?.statut}">${getStatutLabel(cotisation?.statut)}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${cotisation?.cree_par_nom ? `
                <div style="margin-top: 30px;">
                    <h3>Enregistré par</h3>
                    <div class="info-item">
                        <div class="info-value">${cotisation.cree_par_nom} ${cotisation.cree_par_prenom}</div>
                    </div>
                </div>
                ` : ''}
                
                <div class="footer">
                    <p>Merci pour votre contribution au développement de notre communauté!</p>
                    <p>Ce reçu a été généré le ${formatDateTime(new Date())}</p>
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

    if (loading) {
        return (
            <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error || !cotisation) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error || "Cotisation non trouvée"}</Alert>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/cotisations')}
                    sx={{ mt: 2 }}
                >
                    Retour à la liste
                </Button>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/cotisations')}
                    sx={{ mr: 2 }}
                >
                    Retour
                </Button>
                <Typography variant="h4" component="h1">
                    Détails de la Cotisation
                </Typography>
            </Box>

            <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    {/* Informations principales */}
                    <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Receipt sx={{ mr: 1 }} />
                                    Informations de la Cotisation
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Numéro de Cotisation
                                    </Typography>
                                    <Typography variant="h5" sx={{ color: '#19d279', fontWeight: 'bold' }}>
                                        #{cotisation.id}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Montant
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: '#19d279', fontWeight: 'bold' }}>
                                        {cotisation.montant} $
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Type de Cotisation
                                    </Typography>
                                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                                        {cotisation.type_cotisation}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Période
                                    </Typography>
                                    <Typography variant="body1">
                                        {cotisation.mois_cotisation} {cotisation.annee_cotisation}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Statut
                                    </Typography>
                                    <Chip 
                                        label={getStatutLabel(cotisation.statut)}
                                        color={getStatutColor(cotisation.statut)}
                                        size="small"
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Informations du membre */}
                    <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Informations du Membre
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Nom Complet
                                    </Typography>
                                    <Typography variant="h6">
                                        {cotisation.nom} {cotisation.prenom}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        ID Membre
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontFamily: 'monospace', color: '#666' }}>
                                        {cotisation.membre_code}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Email
                                    </Typography>
                                    <Typography variant="body1">
                                        {cotisation.email}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Informations de paiement */}
                    <Grid item xs={12}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Informations de Paiement
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="body2" color="text.secondary">
                                            Date de Paiement
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatDate(cotisation.date_paiement)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="body2" color="text.secondary">
                                            Méthode de Paiement
                                        </Typography>
                                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                                            {cotisation.methode_paiement || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="body2" color="text.secondary">
                                            Référence de Paiement
                                        </Typography>
                                        <Typography variant="body1">
                                            {cotisation.reference_paiement || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="body2" color="text.secondary">
                                            Date d'Enregistrement
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatDateTime(cotisation.date_creation)}
                                        </Typography>
                                    </Grid>
                                    {cotisation.cree_par_nom && (
                                        <Grid item xs={12} md={4}>
                                            <Typography variant="body2" color="text.secondary">
                                                Enregistré par
                                            </Typography>
                                            <Typography variant="body1">
                                                {cotisation.cree_par_nom} {cotisation.cree_par_prenom}
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Actions */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/cotisations')}
                    >
                        Retour à la liste
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Print />}
                        onClick={printRecu}
                        color="primary"
                    >
                        Imprimer le Reçu
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default VoirCotisation;
