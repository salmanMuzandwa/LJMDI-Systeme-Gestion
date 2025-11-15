// src/components/Layout.js

import React from 'react';
import { Outlet, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, Box, Divider, Button, Avatar, Alert
} from '@mui/material';
import { Dashboard as DashboardIcon, Group, People, Paid, Event, Description, Book, ExitToApp, Person, MenuBook } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

const menuItems = [
    { text: 'Tableau de Bord', icon: <DashboardIcon />, path: '/dashboard', permission: 'dashboard' },
    { text: 'Membres', icon: <Group />, path: '/membres', permission: 'membres' },
    { text: 'Contributions', icon: <Paid />, path: '/contributions', permission: 'contributions' },
    { text: 'Présences', icon: <People />, path: '/presences', permission: 'presences' },
    { text: 'Activités', icon: <Event />, path: '/activites', permission: 'activites' },
    { text: 'Documents', icon: <Description />, path: '/documents', permission: 'documents' },
    { text: 'Rapports', icon: <MenuBook />, path: '/rapports', permission: 'rapports' },
    { text: 'Cas Sociaux', icon: <Book />, path: '/cas-sociaux', permission: 'cas_sociaux' },
    { text: 'Mon Profil', icon: <Person />, path: '/profil', permission: 'profil' },
];

const Layout = () => {
    const { logout, user, hasPermission } = useAuth();
    const navigate = useNavigate();
    const isDevMode = (process.env.NODE_ENV === 'development') || (process.env.REACT_APP_FORCE_DEV_LOGIN === 'true');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Affiche uniquement les liens pour lesquels l'utilisateur a la permission
    const filteredMenuItems = menuItems.filter(item =>
        item.permission === 'dashboard' || hasPermission(item.permission)
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: `calc(100% - ${drawerWidth}px)`,
                    ml: `${drawerWidth}px`,
                    bgcolor: '#19d279'
                }}
            >
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        LJMDI - Système de Gestion
                    </Typography>
                    {user && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1" sx={{ mr: 2 }}>
                                {user.prenom} {user.nom} ({user.role})
                            </Typography>
                            <Avatar sx={{ bgcolor: 'white', color: '#19d279' }}>{user.prenom ? user.prenom[0] : 'U'}</Avatar>
                            <Button color="inherit" onClick={handleLogout} startIcon={<ExitToApp />} sx={{ ml: 2 }}>
                                Déconnexion
                            </Button>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>
            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: '#19d279',
                        color: 'white',
                    },
                }}
                variant="permanent"
                anchor="left"
            >
                <Toolbar />
                <Divider />
                <List>
                    {filteredMenuItems.map((item) => (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton component={RouterLink} to={item.path} className="sidebar-link">
                                <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>
            <Box
                component="main"
                sx={{ flexGrow: 1, bgcolor: '#f5f5f5', p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
            >
                <Toolbar />
                {isDevMode && (
                    <Box sx={{ mb: 2 }}>
                        <Alert severity="warning">Mode développement activé — connexion automatique (compte factice) active. Ne pas utiliser en production.</Alert>
                    </Box>
                )}
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;

