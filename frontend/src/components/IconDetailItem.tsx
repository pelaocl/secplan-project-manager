// ========================================================================
// INICIO: Contenido FINAL para frontend/src/components/IconDetailItem.tsx
// ========================================================================
import React from 'react';
import { Box, Stack, Typography, SvgIcon, Tooltip } from '@mui/material';

// Interface para las props del componente
interface IconDetailItemProps {
    icon: typeof SvgIcon; // Espera el componente del icono (ej. BusinessIcon)
    label: string;
    value: React.ReactNode | string | null | undefined; // Permite texto o componentes como valor
}

/**
 * Componente reutilizable para mostrar un detalle con un icono a la izquierda,
 * una etiqueta (caption) arriba y el valor (body2) abajo.
 * Utiliza Flexbox para la alineación interna.
 * Este componente NO define su propio tamaño en la grid; debe ser envuelto
 * en un <Grid item> con las props de tamaño (xs, sm, md) donde se utilice.
 */
const IconDetailItem: React.FC<IconDetailItemProps> = ({
    icon: Icon, // Renombra la prop para usarla como componente
    label,
    value,
}) => {
    return (
        // Contenedor Flexbox para alinear icono y bloque de texto
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Tooltip opcional para accesibilidad o si el icono no es obvio */}
            <Tooltip title={label} placement="top">
                {/* Icono con estilo y margen derecho */}
                <Icon sx={{
                    mr: 1.5, // Margen derecho para separar del texto
                    color: 'text.secondary', // Color grisáceo
                    fontSize: '1.6rem' // Tamaño del icono (ajustar si es necesario)
                }} />
            </Tooltip>
            {/* Contenedor para el bloque Label + Valor */}
            <Box>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block" // Ocupa su línea
                    sx={{ lineHeight: 1.1, mb: 0.1 }} // Ajusta interlineado y margen inferior
                >
                    {label}
                </Typography>
                <Typography
                    variant="body2" // Usar body2 para el valor, como en la referencia
                    component="div" // Permite que el valor sea otro componente si es necesario
                    sx={{ fontWeight: 500, lineHeight: 1.4, wordWrap: 'break-word' }} // Semibold, buen interlineado
                >
                    {/* Muestra 'No especificado' con estilo si el valor es null/undefined/vacío */}
                    {value != null && value !== '' ? value : (
                        <Typography
                            variant="body2" // Mismo variant
                            component="span"
                            sx={{ fontStyle: 'italic', color: 'text.secondary', fontWeight: 400 }} // Estilo para N/A
                        >
                            No especificado
                        </Typography>
                    )}
                </Typography>
            </Box>
        </Box>
    );
};

export default IconDetailItem;
// ========================================================================
// FIN: Contenido FINAL para frontend/src/components/IconDetailItem.tsx
// ========================================================================