import React, { useState } from 'react';
import {
    Container, Typography, Paper, Box, TextField, Button, 
    FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AjouterMembre = () => {
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        profession: '',
        role: 'membre',
        password: 'password123'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await axios.post('/api/members', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setSuccess('Membre ajouté avec succès!');
            setFormData({
                nom: '',
                prenom: '',
                email: '',
                telephone: '',
                profession: '',
                role: 'membre',
                password: 'password123'
            });

            setTimeout(() => {
                navigate('/membres');
            }, 2000);

        } catch (err) {
            console.error("Erreur lors de l'ajout du membre:", err);
            setError(err.response?.data?.message || "Erreur lors de l'ajout du membre");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/membres')}
                    sx={{ mr: 2 }}
                >
                    Retour
                </Button>
                <Typography variant="h4" component="h1">
                    Ajouter un Nouveau Membre
                </Typography>
            </Box>

            <Paper sx={{ p: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                        <TextField
                            label="Nom"
                            name="nom"
                            value={formData.nom}
                            onChange={handleChange}
                            required
                            fullWidth
                        />
                        <TextField
                            label="Prénom"
                            name="prenom"
                            value={formData.prenom}
                            onChange={handleChange}
                            required
                            fullWidth
                        />
                        <TextField
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            fullWidth
                        />
                        <TextField
                            label="Téléphone"
                            name="telephone"
                            value={formData.telephone}
                            onChange={handleChange}
                            fullWidth
                        />
                        <TextField
                            label="Profession"
                            name="profession"
                            value={formData.profession}
                            onChange={handleChange}
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>Rôle</InputLabel>
                            <Select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                label="Rôle"
                            >
                                <MenuItem value="membre">Membre</MenuItem>
                                <MenuItem value="tresorier">Trésorier</MenuItem>
                                <MenuItem value="secretaire">Secrétaire</MenuItem>
                                <MenuItem value="admin">Administrateur</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/membres')}
                            disabled={loading}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            sx={{ bgcolor: '#19d279', '&:hover': { bgcolor: '#12a85e' } }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Ajouter le Membre'}
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default AjouterMembre;
