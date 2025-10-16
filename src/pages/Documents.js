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
    Link,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Download as DownloadIcon,
    Visibility as ViewIcon,
    Description as DescriptionIcon,
    PictureAsPdf as PdfIcon,
    Description as WordIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const typesDocument = [
    { value: 'Rapport', label: 'Rapport' },
    { value: 'PV', label: 'Procès-Verbal' },
    { value: 'Règlement', label: 'Règlement' },
    { value: 'Communication', label: 'Communication' },
    { value: 'Autre', label: 'Autre' },
];

export default function Documents() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState([]);
    const [formData, setFormData] = useState({
        titre: '',
        type_document: 'Rapport',
        fichier_url: '',
        description: ''
    });
    const { hasPermission, user } = useAuth();

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await axios.get('/api/documents');
            setDocuments(response.data);
        } catch (error) {
            setError('Erreur lors du chargement des documents');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (document = []) => {
        if (document) {
            setFormData(document);
            setSelectedDocument(document);
        } else {
            setFormData({
                titre: '',
                type_document: 'Rapport',
                fichier_url: '',
                description: ''
            });
            setSelectedDocument([]);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedDocument([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                ...formData,
                auteur_id: user.id_membre
            };

            if (selectedDocument) {
                await axios.put(`/api/documents/${selectedDocument.id_document}`, dataToSend);
            } else {
                await axios.post('/api/documents', dataToSend);
            }
            fetchDocuments();
            handleCloseDialog();
        } catch (error) {
            setError('Erreur lors de la sauvegarde');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
            try {
                await axios.delete(`/api/documents/${id}`);
                fetchDocuments();
            } catch (error) {
                setError('Erreur lors de la suppression');
            }
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Rapport': return 'primary';
            case 'PV': return 'secondary';
            case 'Règlement': return 'success';
            case 'Communication': return 'warning';
            default: return 'info';
        }
    };

    const getFileIcon = (url) => {
        if (!url) return <DescriptionIcon />;

        const extension = url.split('.').pop().toLowerCase();
        switch (extension) {
            case 'pdf': return <PdfIcon />;
            case 'doc':
            case 'docx': return <WordIcon />;
            default: return <DescriptionIcon />;
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Ici, vous devriez uploader le fichier vers votre serveur
            // Pour l'instant, on simule avec un URL local
            const fileUrl = URL.createObjectURL(file);
            setFormData({ ...formData, fichier_url: fileUrl });
        }
    };

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
                <Typography variant="h4">Gestion des Documents</Typography>
                {hasPermission('documents') && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Nouveau Document
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
                <Grid item xs={12} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                            {documents.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Documents
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="secondary.main">
                            {documents.filter(d => d.type_document === 'PV').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Procès-Verbaux
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main">
                            {documents.filter(d => d.type_document === 'Rapport').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Rapports
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="warning.main">
                            {documents.filter(d => d.type_document === 'Communication').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Communications
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Type</TableCell>
                                <TableCell>Titre</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Date Création</TableCell>
                                <TableCell>Auteur</TableCell>
                                <TableCell>Fichier</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {documents.map((document) => (
                                <TableRow key={document.id_document}>
                                    <TableCell>
                                        <Chip
                                            label={document.type_document}
                                            color={getTypeColor(document.type_document)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2">
                                            {document.titre}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {document.description ?
                                                (document.description.length > 50
                                                    ? `${document.description.substring(0, 50)}...`
                                                    : document.description)
                                                : 'Aucune description'
                                            }
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(document.date_creation).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {document.auteur?.nom} {document.auteur?.prenom}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {document.fichier_url ? (
                                            <Link
                                                href={document.fichier_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                sx={{ display: 'flex', alignItems: 'center' }}
                                            >
                                                {getFileIcon(document.fichier_url)}
                                                <Typography variant="body2" sx={{ ml: 1 }}>
                                                    Télécharger
                                                </Typography>
                                            </Link>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Aucun fichier
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {document.fichier_url && (
                                            <Tooltip title="Voir le document">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => window.open(document.fichier_url, '_blank')}
                                                >
                                                    <ViewIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {hasPermission('documents') && (
                                            <>
                                                <Tooltip title="Modifier">
                                                    <IconButton size="small" onClick={() => handleOpenDialog(document)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Supprimer">
                                                    <IconButton size="small" onClick={() => handleDelete(document.id_document)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Dialog pour ajouter/modifier un document */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedDocument ? 'Modifier le Document' : 'Nouveau Document'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Type de Document</InputLabel>
                                    <Select
                                        value={formData.type_document}
                                        onChange={(e) => setFormData({ ...formData, type_document: e.target.value })}
                                        label="Type de Document"
                                    >
                                        {typesDocument.map((option) => (
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
                                    label="Titre"
                                    name="titre"
                                    value={formData.titre}
                                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    name="description"
                                    multiline
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <input
                                    accept=".pdf,.doc,.docx,.txt"
                                    style={{ display: 'none' }}
                                    id="file-upload"
                                    type="file"
                                    onChange={handleFileUpload}
                                />
                                <label htmlFor="file-upload">
                                    <Button variant="outlined" component="span" startIcon={<DownloadIcon />}>
                                        Télécharger un fichier
                                    </Button>
                                </label>
                                {formData.fichier_url && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        Fichier sélectionné: {formData.fichier_url}
                                    </Typography>
                                )}
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Annuler</Button>
                        <Button type="submit" variant="contained">
                            {selectedDocument ? 'Modifier' : 'Ajouter'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
