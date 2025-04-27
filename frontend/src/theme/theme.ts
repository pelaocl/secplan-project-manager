// ========================================================================
// INICIO: Contenido theme.ts (SIN Override para Paper)
// ========================================================================
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

const BORDER_RADIUS_VALUE = 12;
// const BORDER_THICKNESS = '4px'; // Ya no lo necesitamos aquí por ahora

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#556cd6' },
        secondary: { main: '#19857b' },
        error: { main: red.A400 },
    },
    shape: {
        borderRadius: BORDER_RADIUS_VALUE,
    },
    typography: {
        // ...
    },
    // --- SIN SECCIÓN components O VACÍA ---
    // components: {
    //     // MuiPaper: { ... } // <-- ELIMINADO O COMENTADO
    // }
});

export default theme;
// ========================================================================
// FIN: Contenido theme.ts (SIN Override para Paper)
// ========================================================================