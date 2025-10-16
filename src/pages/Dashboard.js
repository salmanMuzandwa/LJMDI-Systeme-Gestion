import React, { useState, useEffect } from 'react';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Chip,
    Avatar,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    People as PeopleIcon,
    AccountBalance as AccountBalanceIcon,
    Event as EventIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Dashboard() {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user, hasPermission } = useAuth();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await axios.get('/api/dashboard/stats');
            setStats(response.data);
        } catch (error) {
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    const StatCard = ({ title, value, icon, color, subtitle }) => (
        <Card className="dashboard-card">
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography color="textSecondary" gutterBottom variant="h6">
                            {title}
                        </Typography>
                        <Typography variant="h4" component="h2">
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography color="textSecondary" variant="body2">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );

    const recentActivities = [
        { id: 1, text: 'Nouveau membre: Jean Kabongo', time: 'Il y a 2 heures', type: 'success' },
        { id: 2, text: 'Contribution en retard: Marie Kabila', time: 'Il y a 4 heures', type: 'warning' },
        { id: 3, text: 'Réunion mensuelle programmée', time: 'Hier', type: 'info' },
        { id: 4, text: 'Rapport financier généré', time: 'Il y a 2 jours', type: 'success' },
    ];

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Tableau de Bord
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Bienvenue, {user?.nom} {user?.prenom} ({user?.role})
            </Typography>

            <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Statistiques principales */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Membres Actifs"
                        value={stats?.membresActifs || 0}
                        icon={<PeopleIcon />}
                        color="primary.main"
                        subtitle={`${stats?.nouveauxMembres || 0} nouveaux ce mois`}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Trésorerie"
                        value={`${stats?.tresorerie || 0} $`}
                        icon={<AccountBalanceIcon />}
                        color="success.main"
                        subtitle={`${stats?.contributionsMois || 0} $ ce mois`}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Activités"
                        value={stats?.activitesMois || 0}
                        icon={<EventIcon />}
                        color="info.main"
                        subtitle={`${stats?.activitesAvenir || 0} à venir`}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Taux Participation"
                        value={`${stats?.tauxParticipation || 0}%`}
                        icon={<CheckCircleIcon />}
                        color="warning.main"
                        subtitle="Moyenne mensuelle"
                    />
                </Grid>

                {/* Graphiques */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Évolution des Contributions
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={stats?.contributionsEvolution || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="mois" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="montant" stroke="#1976d2" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Répartition par Statut
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats?.repartitionStatuts || []}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {(stats?.repartitionStatuts || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Alertes */}
                {hasPermission('all') && (
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Alertes Importantes
                            </Typography>
                            <List>
                                {(stats?.alertes || []).map((alerte, index) => (
                                    <ListItem key={index}>
                                        <ListItemText
                                            primary={alerte.message}
                                            secondary={alerte.date}
                                        />
                                        <Chip
                                            label={alerte.type}
                                            size="small"
                                            color={alerte.type === 'Urgent' ? 'error' : 'warning'}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Grid>
                )}

                {/* Activités récentes */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Activités Récentes
                        </Typography>
                        <List>
                            {recentActivities.map((activity) => (
                                <ListItem key={activity.id}>
                                    <ListItemText
                                        primary={activity.text}
                                        secondary={activity.time}
                                    />
                                    <Chip
                                        label={activity.type}
                                        size="small"
                                        color={activity.type === 'success' ? 'success' : activity.type === 'warning' ? 'warning' : 'info'}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
