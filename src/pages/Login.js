// src/pages/Login.js

import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, CircularProgress, Alert, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('admin@ljmdi.org');
    const [password, setPassword] = useState('adminpassword');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(email, password);

        if (result.success) {
            navigate('/dashboard', { replace: true });
        } else {
            setError(result.message || 'Échec de la connexion. Veuillez vérifier vos identifiants.');
        }
        setLoading(false);
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 4,
                    boxShadow: 3,
                    borderRadius: 2,
                    bgcolor: 'white'
                }}
            >
                <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                    Connexion LJMDI
                </Typography>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                    <strong>Identifiants Admin :</strong><br />
                    Email : admin@ljmdi.org<br />
                    Mot de passe : adminpassword
                </Alert>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Adresse Email"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Mot de passe"
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleTogglePasswordVisibility}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, bgcolor: '#19d279', '&:hover': { bgcolor: '#12a85e' } }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Se Connecter'}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default Login;

