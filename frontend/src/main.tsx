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

// --- INICIO: MANEJADOR GLOBAL DE RECHAZOS DE PROMESAS ---
window.addEventListener('unhandledrejection', function(event) {
  console.error('-----------------------------------------');
  console.error('MANEJADOR GLOBAL: RECHAZO DE PROMESA NO CONTROLADO DETECTADO');
  console.error('Razón del Rechazo (event.reason):', event.reason);

  const reason = event.reason;
  if (reason instanceof Error) {
    console.error('Mensaje del Error Original:', reason.message);
    console.error('Stack del Error Original:', reason.stack);
  } else {
    try {
      console.error('Razón del Rechazo (stringificada):', JSON.stringify(reason, null, 2));
    } catch (e) {
      console.error('Razón del Rechazo (no se pudo stringificar, tipo):', typeof reason);
    }
  }
  console.error('-----------------------------------------');
  // event.preventDefault(); // Descomenta esto solo si quieres evitar que el error aparezca también en la consola como "Uncaught (in promise)"
});
// --- FIN: MANEJADOR GLOBAL DE RECHAZOS DE PROMESAS ---

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