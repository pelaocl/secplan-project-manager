import React, { useState, KeyboardEvent } from 'react';
import { Box, TextField, Button, Chip, Stack, Typography, FormHelperText, FormControl } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { z } from 'zod';

interface UrlChipInputProps {
  label: string;
  value: string[]; // El array de URLs del formulario (de react-hook-form)
  onChange: (urls: string[]) => void; // La función para actualizar el formulario
  error?: boolean;
  helperText?: string;
}

// Un schema simple para validar una URL individual antes de añadirla
const urlSchema = z.string().url("URL no válida.");

const UrlChipInput: React.FC<UrlChipInputProps> = ({ label, value = [], onChange, error, helperText }) => {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const handleAddUrl = () => {
    const validation = urlSchema.safeParse(inputValue);
    if (!validation.success) {
      setInputError("Por favor, introduce una URL válida (ej. https://...).");
      return;
    }
    
    if (inputValue && !value.includes(inputValue)) {
      onChange([...value, inputValue]);
      setInputValue('');
      setInputError(null);
    }
  };

  const handleDeleteUrl = (urlToDelete: string) => {
    onChange(value.filter(url => url !== urlToDelete));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Previene que el formulario se envíe
      handleAddUrl();
    }
  };

  return (
    <FormControl fullWidth error={error || !!inputError}>
      <Typography variant="subtitle1" sx={{ mb: 1, color: error ? 'error.main' : 'text.secondary' }}>
        {label}
      </Typography>
      <Box display="flex" gap={1}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pega una URL y presiona Enter o 'Añadir'"
          error={!!inputError}
          helperText={inputError}
        />
        <Button
          variant="outlined"
          onClick={handleAddUrl}
          startIcon={<AddCircleOutlineIcon />}
        >
          Añadir
        </Button>
      </Box>

      {/* Muestra un helper text general si hay un error del formulario principal */}
      {helperText && <FormHelperText>{helperText}</FormHelperText>}

      {/* Contenedor para los chips */}
      <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mt: value.length > 0 ? 1.5 : 0 }}>
        {value.map((url, index) => (
          <Chip
            key={index}
            label={url}
            onDelete={() => handleDeleteUrl(url)}
            size="small"
            title={url} // Muestra la URL completa en el hover
            sx={{ maxWidth: '100%' }}
          />
        ))}
      </Stack>
    </FormControl>
  );
};

export default UrlChipInput;
