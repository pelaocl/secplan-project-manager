import React from 'react';
import ReactDOM from 'react-dom/client'; // Correcta importación para React 18+
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import theme from './theme/theme'; // Asegúrate que theme.ts exista y exporte un tema
import './index.css'; // Asegúrate que index.css exista
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'react-quill-new/dist/quill.snow.css';

// Obtiene el elemento raíz (debe existir en index.html)
const rootElement = document.getElementById('root');

// Verifica que el elemento raíz exista antes de intentar renderizar
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline /> {/* Normaliza CSS y aplica fondo del tema */}
        <BrowserRouter> {/* Envolvemos App con el Router */}
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
  console.error("Error Fatal: El elemento con ID 'root' no fue encontrado en el DOM.");
}