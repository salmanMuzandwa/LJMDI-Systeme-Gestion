import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TextField,
} from '@mui/material';
import {
    Assessment as AssessmentIcon,
    Download as DownloadIcon,
    Email as EmailIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { fr } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Rapports() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rapportType, setRapportType] = useState('financier');
    const [periode, setPeriode] = useState('mois');
    const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0]);
    const [dateFin, setDateFin] = useState(new Date().toISOString().split('T')[0]);
    const [rapportData, setRapportData] = useState([]);
    const { hasPermission } = useAuth();

    const typesRapport = [
        { value: 'financier', label: 'Rapport Financier' },
        { value: 'membres', label: 'Rapport des Membres' },
        { value: 'activites', label: 'Rapport des Activités' },
        { value: 'presences', label: 'Rapport des Présences' },
        { value: 'global', label: 'Rapport Global' },
    ];

    const periodes = [
        { value: 'semaine', label: 'Cette Semaine' },
        { value: 'mois', label: 'Ce Mois' },
        { value: 'trimestre', label: 'Ce Trimestre' },
        { value: 'annee', label: 'Cette Année' },
        { value: 'personnalise', label: 'Période Personnalisée' },
    ];

    const generateRapport = async () => {
        setLoading(true);
        setError('');

        try {
            const params = {
                type: rapportType,
                periode: periode,
                dateDebut: dateDebut.toISOString().split('T')[0],
                dateFin: dateFin.toISOString().split('T')[0]
            };

            const response = await axios.get('/api/rapports/generate', { params });
            setRapportData(response.data);
        } catch (error) {
            setError('Erreur lors de la génération du rapport');
        } finally {
            setLoading(false);
        }
    };

    const exportRapport = async (format) => {
        try {
            const params = {
                type: rapportType,
                periode: periode,
                dateDebut: dateDebut.toISOString().split('T')[0],
                dateFin: dateFin.toISOString().split('T')[0],
                format: format
            };

            const response = await axios.get('/api/rapports/export', {
                params,
                responseType: 'blob'
            });

            // Créer un lien de téléchargement
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `rapport_${rapportType}_${new Date().toISOString().split('T')[0]}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            setError('Erreur lors de l\'export du rapport');
        }
    };

    const sendRapportEmail = async () => {
        try {
            await axios.post('/api/rapports/send-email', {
                type: rapportType,
                periode: periode,
                dateDebut: dateDebut.toISOString().split('T')[0],
                dateFin: dateFin.toISOString().split('T')[0]
            });
            alert('Rapport envoyé par email avec succès');
        } catch (error) {
            setError('Erreur lors de l\'envoi par email');
        }
    };

    useEffect(() => {
        if (hasPermission('rapports')) {
            generateRapport();
        }
    }, []);

    const renderFinancierRapport = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Évolution des Contributions
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={rapportData?.contributionsEvolution || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="periode" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="montant" stroke="#1976d2" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Répartition des Dépenses
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={rapportData?.depensesRepartition || []}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {(rapportData?.depensesRepartition || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Résumé Financier
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Période</TableCell>
                                        <TableCell>Contributions</TableCell>
                                        <TableCell>Dépenses</TableCell>
                                        <TableCell>Solde</TableCell>
                                        <TableCell>Membres Actifs</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rapportData?.resumeFinancier?.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{row.periode}</TableCell>
                                            <TableCell>{row.contributions} $</TableCell>
                                            <TableCell>{row.depenses} $</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={`${row.solde} $`}
                                                    color={row.solde >= 0 ? 'success' : 'error'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{row.membresActifs}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderMembresRapport = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Évolution des Adhésions
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={rapportData?.adhesionsEvolution || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="periode" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="nouveauxMembres" fill="#1976d2" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Répartition par Statut
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={rapportData?.statutsRepartition || []}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {(rapportData?.statutsRepartition || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderActivitesRapport = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Activités par Type
                        </Typography>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={rapportData?.activitesParType || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="type" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="nombre" fill="#1976d2" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderPresencesRapport = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Taux de Participation
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={rapportData?.tauxParticipation || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="activite" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="taux" fill="#1976d2" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Classement des Membres
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Membre</TableCell>
                                        <TableCell>Taux</TableCell>
                                        <TableCell>Présences</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(rapportData?.classementMembres || []).slice(0, 10).map((membre, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{membre.nom}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={`${membre.taux}%`}
                                                    color={membre.taux >= 80 ? 'success' : membre.taux >= 60 ? 'warning' : 'error'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{membre.presences}/{membre.total}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderRapportContent = () => {
        switch (rapportType) {
            case 'financier':
                return renderFinancierRapport();
            case 'membres':
                return renderMembresRapport();
            case 'activites':
                return renderActivitesRapport();
            case 'presences':
                return renderPresencesRapport();
            case 'global':
                return (
                    <Grid container spacing={3}>
                        {renderFinancierRapport()}
                        {renderMembresRapport()}
                        {renderActivitesRapport()}
                        {renderPresencesRapport()}
                    </Grid>
                );
            default:
                return <Typography>Aucun rapport sélectionné</Typography>;
        }
    };

    if (!hasPermission('rapports')) {
        return (
            <Alert severity="warning">
                Vous n'avez pas les permissions pour accéder aux rapports.
            </Alert>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Rapports et Statistiques
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Contrôles de génération */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                            <InputLabel>Type de Rapport</InputLabel>
                            <Select
                                value={rapportType}
                                onChange={(e) => setRapportType(e.target.value)}
                                label="Type de Rapport"
                            >
                                {typesRapport.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                            <InputLabel>Période</InputLabel>
                            <Select
                                value={periode}
                                onChange={(e) => setPeriode(e.target.value)}
                                label="Période"
                            >
                                {periodes.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    {periode === 'personnalise' && (
                        <>
                            <Grid item xs={12} sm={2}>
                                <TextField
                                    fullWidth
                                    label="Date Début"
                                    type="date"
                                    value={dateDebut}
                                    onChange={(e) => setDateDebut(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <TextField
                                    fullWidth
                                    label="Date Fin"
                                    type="date"
                                    value={dateFin}
                                    onChange={(e) => setDateFin(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </>
                    )}
                    <Grid item xs={12} sm={2}>
                        <Button
                            variant="contained"
                            onClick={generateRapport}
                            disabled={loading}
                            startIcon={<AssessmentIcon />}
                            fullWidth
                        >
                            {loading ? <CircularProgress size={20} /> : 'Générer'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Actions d'export */}
            {rapportData && (
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Actions
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item>
                            <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={() => exportRapport('pdf')}
                            >
                                Exporter PDF
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={() => exportRapport('excel')}
                            >
                                Exporter Excel
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                variant="outlined"
                                startIcon={<EmailIcon />}
                                onClick={sendRapportEmail}
                            >
                                Envoyer par Email
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* Contenu du rapport */}
            {rapportData && renderRapportContent()}
        </Box>
    );
}
