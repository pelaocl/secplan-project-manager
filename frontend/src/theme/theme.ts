// frontend/src/theme/theme.ts
import { createTheme, alpha } from '@mui/material/styles'; // Import alpha para transparencias
import { red } from '@mui/material/colors';

const BORDER_RADIUS_VALUE = 8;

// 1. Extender las interfaces de la paleta para incluir 'tertiary'
declare module '@mui/material/styles/createPalette' {
  interface Palette {
    tertiary: PaletteColor;
  }
  interface PaletteOptions {
    tertiary?: PaletteColorOptions;
  }
}

// 2. Opcional: Extender Button para que acepte 'tertiary' como color
declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    tertiary: true;
  }
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#556cd6', // Tu azul/índigo primario
    },
    secondary: {
      main: '#19857b', // Tu verde azulado secundario
    },
    // 3. NUEVO COLOR TERCIARIO (AMARILLO SUAVE)
    tertiary: {
      main: '#E6D9A0',         // Amarillo suave / Lino / Pergamino
      light: '#F0E8C0',       // Un tono más claro de #E6D9A0
      dark: '#D1C480',        // Un tono más oscuro de #E6D9A0
      contrastText: '#3A3A3A', // Texto gris oscuro para buen contraste con #E6D9A0
    },
    error: {
      main: red.A400,
    },
  },
  shape: {
    borderRadius: BORDER_RADIUS_VALUE,
  },
  
  breakpoints: {
    values: {
      xs: 450,
      sm: 600, // Valor personalizado
      md: 950, // Valor personalizado
      lg: 1300,
      xl: 1600,
    },
  },
  
  typography: {
    // ... tus configuraciones de tipografía ...
    // Ejemplo:
    // fontFamily: ['"Roboto"', '"Helvetica"', '"Arial"', 'sans-serif'].join(','),
    // h5: { fontWeight: 600 },
    // h6: { fontWeight: 500 },
  },
  components: {
    MuiButton: {
      variants: [
        {
          props: { color: 'tertiary', variant: 'contained' },
          style: ({ theme: t }) => ({
            color: t.palette.tertiary.contrastText,
            backgroundColor: t.palette.tertiary.main,
            '&:hover': {
              backgroundColor: t.palette.tertiary.dark,
            },
          }),
        },
        {
          props: { color: 'tertiary', variant: 'outlined' },
          style: ({ theme: t }) => ({
            color: t.palette.tertiary.dark, // Usar el tono oscuro para el texto para mejor visibilidad sobre fondo claro
            borderColor: alpha(t.palette.tertiary.dark, 0.5), // Borde con el tono oscuro, semi-transparente
            '&:hover': {
              borderColor: t.palette.tertiary.dark, // Borde sólido en hover
              backgroundColor: alpha(t.palette.tertiary.dark, t.palette.action.hoverOpacity), // Fondo sutil en hover
            },
          }),
        },
        {
          props: { color: 'tertiary', variant: 'text' },
          style: ({ theme: t }) => ({
            color: t.palette.tertiary.dark, // Usar el tono oscuro para el texto
            '&:hover': {
              backgroundColor: alpha(t.palette.tertiary.dark, t.palette.action.hoverOpacity),
            },
          }),
        },
      ],
    },
    // Puedes añadir otros overrides de componentes aquí si es necesario
  }
});

export default theme;