import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors'; // Ejemplo de color

// 1. Crea la instancia del tema
const theme = createTheme({
  palette: {
    mode: 'light', // Puedes cambiar a 'dark' si prefieres
    primary: {
      main: '#556cd6', // Un color primario de ejemplo
    },
    secondary: {
      main: '#19857b', // Un color secundario de ejemplo
    },
    error: {
      main: red.A400,
    },
    // background: { // Puedes personalizar el fondo
    //   default: '#fff',
    // },
  },
  typography: {
    // Puedes definir fuentes personalizadas aquí si quieres
    // fontFamily: [
    //   '-apple-system',
    //   'BlinkMacSystemFont',
    //   // ...otras fuentes
    // ].join(','),
  },
  // Puedes añadir otros overrides y customizaciones aquí
  // components: { ... }
});

// 2. Exporta el tema como default <<<--- ¡ESTO ES LO IMPORTANTE!
export default theme;