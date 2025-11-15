// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './contexts/AuthContext';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
    palette: {
        primary: {
            main: '#19d279',
        },
        secondary: {
            main: '#007bff',
        },
    },
    typography: {
        fontFamily: 'Roboto, sans-serif',
    },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <App />
            </AuthProvider>
        </ThemeProvider>
    </React.StrictMode>
);

reportWebVitals();
