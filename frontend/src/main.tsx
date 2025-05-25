// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import theme from './theme/theme';
import './index.css'; // Aquí tienes tus estilos globales y los de ProseMirror/Tiptap
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
// import 'react-quill-new/dist/quill.snow.css'; // <--- LÍNEA ELIMINADA/COMENTADA

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
});
// --- FIN: MANEJADOR GLOBAL DE RECHAZOS DE PROMESAS ---

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
  console.error("Error Fatal: El elemento con ID 'root' no fue encontrado en el DOM.");
}