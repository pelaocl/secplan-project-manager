// ========================================================================
// INICIO: Contenido MODIFICADO para theme.ts (Añade Override para Paper)
// ========================================================================
import { createTheme, alpha } from '@mui/material/styles'; // Importa alpha si quieres usar colores con transparencia
import { red } from '@mui/material/colors';

// Define el radio de borde deseado (puedes ajustarlo)
const BORDER_RADIUS_VALUE = 12; // en píxeles
const BORDER_THICKNESS = '4px'; // Grosor del borde

// Crea la instancia del tema
const theme = createTheme({
    // --- Palette (igual que antes) ---
    palette: {
        mode: 'light',
        primary: {
            main: '#556cd6', // Azul institucional
        },
        secondary: {
            main: '#19857b',
        },
        error: {
            main: red.A400,
        },
    },
    // --- Shape (Define el redondeo base) ---
    shape: {
        borderRadius: BORDER_RADIUS_VALUE, // Usa el valor definido arriba
    },
    // --- Typography (igual que antes) ---
    typography: {
        // ... tus definiciones de tipografía ...
    },
    // --- NUEVO: Overrides Globales para Componentes ---
    components: {
        // Aplica estilos por defecto a TODOS los Paper
        MuiPaper: {
            styleOverrides: {
                // 'root' se refiere al elemento raíz del componente Paper
                root: ({ theme }) => ({ // Accede al tema para usar sus valores
                    borderRadius: theme.shape.borderRadius, // Usa el valor del tema
                    border: `${BORDER_THICKNESS} solid ${theme.palette.primary.main}`, // Borde azul por defecto
                    // Importante: Asegura que el padding interno NO se aplique globalmente aquí,
                    // ya que cada Paper podría necesitar un padding diferente.
                    // El padding se seguirá aplicando con 'sx' o clases donde sea necesario.
                    // Si quieres un padding por defecto MUY general, podrías añadirlo, pero con cuidado.
                    // padding: theme.spacing(2), // Ejemplo: CUIDADO con aplicar padding globalmente
                }),
                 // Podrías definir overrides para variantes específicas si es necesario
                 // elevated: { ... },
                 // outlined: { ... },
            }
        },
        // Puedes añadir overrides para otros componentes aquí (MuiButton, MuiTextField, etc.)
        // MuiButton: { ... },
    }
});

export default theme;
// ========================================================================
// FIN: Contenido MODIFICADO para theme.ts (Añade Override para Paper)
// ========================================================================