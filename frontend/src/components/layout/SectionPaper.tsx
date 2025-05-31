
//frontend/src/components/layout/SectionPaper.tsx
import { styled } from '@mui/material/styles';
import Paper, { PaperProps } from '@mui/material/Paper';

// Define las constantes de estilo aquí o impórtalas si las pones en otro lugar
const BORDER_THICKNESS = '4px';
// const BORDER_RADIUS_VALUE = 12; // Podemos usar theme.shape.borderRadius

// Crea un componente Paper estilizado usando la API `styled` de MUI
const SectionPaper = styled(Paper)<PaperProps>(({ theme }) => ({
    // Aplica el redondeo definido en el tema global
    borderRadius: theme.shape.borderRadius,
    // Aplica el borde grueso con el color primario por defecto
    border: `${BORDER_THICKNESS} solid ${theme.palette.primary.main}`,
    // Aplica un padding interno por defecto para las secciones
    padding: theme.spacing(3), // Usa theme.spacing para consistencia (3 * 8px = 24px)
    // Mantenemos la elevación por defecto de Paper o la que se pase como prop
    // height: '100%' // Opcional: Descomenta si necesitas que todos ocupen altura completa (útil en Grid)
}));

export default SectionPaper;