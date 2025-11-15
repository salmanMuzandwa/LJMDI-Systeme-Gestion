import React, { useState } from 'react';
import {
    Box, Avatar, Button, Typography, CircularProgress, IconButton
} from '@mui/material';
import { PhotoCamera, Edit } from '@mui/icons-material';

const PhotoUpload = ({ currentPhoto, onPhotoChange, size = 120, editable = true }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentPhoto || null);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Vérifier le type de fichier
            if (!file.type.startsWith('image/')) {
                alert('Veuillez sélectionner une image valide (JPG, PNG, etc.)');
                return;
            }

            // Vérifier la taille (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('L\'image ne doit pas dépasser 5MB');
                return;
            }

            setUploading(true);
            
            // Créer un aperçu
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target.result;
                setPreview(imageUrl);
                onPhotoChange(imageUrl);
                setUploading(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box sx={{ position: 'relative' }}>
                <Avatar
                    src={preview}
                    sx={{
                        width: size,
                        height: size,
                        bgcolor: '#19d279',
                        fontSize: size / 3,
                        fontWeight: 'bold'
                    }}
                >
                    {!preview && '?'}
                </Avatar>
                
                {editable && (
                    <IconButton
                        component="label"
                        sx={{
                            position: 'absolute',
                            bottom: -8,
                            right: -8,
                            bgcolor: 'white',
                            border: '2px solid #19d279',
                            '&:hover': { bgcolor: '#f5f5f5' }
                        }}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <CircularProgress size={20} />
                        ) : (
                            <Edit sx={{ fontSize: 16, color: '#19d279' }} />
                        )}
                        <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                    </IconButton>
                )}
            </Box>
            
            {editable && (
                <Button
                    component="label"
                    variant="outlined"
                    size="small"
                    startIcon={<PhotoCamera />}
                    disabled={uploading}
                    sx={{ fontSize: '0.8rem' }}
                >
                    Changer la photo
                    <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                </Button>
            )}
        </Box>
    );
};

export default PhotoUpload;
