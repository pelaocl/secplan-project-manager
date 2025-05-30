import React from 'react';
import { Box, Stack, Typography, SvgIcon, Tooltip } from '@mui/material';

// Interface para las props del componente
interface IconDetailItemProps {
    icon: typeof SvgIcon; // Espera el componente del icono (ej. BusinessIcon)
    label: string;
    value: React.ReactNode | string | null | undefined; // Permite texto o componentes como valor
    valueComponent?: React.ReactNode;
    dense?: boolean;                  // Prop para un estilo más compacto
    sx?: object;                      // Prop para estilos personalizados
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
    valueComponent,
    dense,
    sx
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
                {/* --- LÓGICA DE RENDERIZADO CORREGIDA --- */}
                {valueComponent !== undefined ? ( // Si se proporciona valueComponent, úsalo
                    valueComponent
                ) : ( // Si no, usa la prop 'value' con el fallback
                    <Typography
                        variant={dense ? "body2" : "subtitle2"} // O el variant que prefieras
                        component="div"
                        sx={{ fontWeight: 500, lineHeight: 1.4, wordWrap: 'break-word' }}
                    >
                        {(value !== null && value !== undefined && value !== '') ? value : (
                            <Typography
                                variant={dense ? "body2" : "subtitle2"}
                                component="span"
                                sx={{ fontStyle: 'italic', color: 'text.secondary', fontWeight: 400 }}
                            >
                                No especificado
                            </Typography>
                        )}
                    </Typography>
                )}
                {/* --- FIN LÓGICA CORREGIDA --- */}
            </Box>
        </Box>
    );
};

export default IconDetailItem;