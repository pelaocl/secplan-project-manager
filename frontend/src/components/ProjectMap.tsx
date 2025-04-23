import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet'; // Importa Leaflet directamente si necesitas L globalmente
import 'leaflet/dist/leaflet.css'; // ¡IMPORTANTE! Importa los estilos de Leaflet

// Corrige el problema del icono por defecto en React-Leaflet con Webpack/Vite
// delete (L.Icon.Default.prototype as any)._getIconUrl; // Opción 1 (a veces funciona)
// L.Icon.Default.mergeOptions({ // Opción 2 (más robusta)
//   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
// });
// Opción 3: Usar un icono personalizado o manejarlo con useEffect (ver docs de react-leaflet)
// Por ahora, puede que no veas el marcador por defecto correctamente.

// Coordenadas aproximadas de Concepción centro
const concepcionPosition: L.LatLngExpression = [-36.827, -73.050]; // Lat, Lng

// Props que podría recibir (por ahora ninguna)
interface ProjectMapProps {
  // lat?: number;
  // lng?: number;
  // geometry?: any; // GeoJSON
}

function ProjectMap({ /* props */ }: ProjectMapProps) {

  // Asegúrate de que el contenedor del mapa tenga una altura definida!
  return (
    <MapContainer
        center={concepcionPosition}
        zoom={14}
        scrollWheelZoom={false} // Deshabilita zoom con rueda por defecto
        style={{ height: '400px', width: '100%', marginTop: '16px' }} // Estilo directo o vía sx prop/CSS
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Aquí añadiríamos marcadores o polígonos basados en los datos del proyecto más adelante */}
       <Marker position={concepcionPosition}>
         <Popup>
           Centro de Concepción (Referencia). <br /> Aquí iría el marcador/área del proyecto.
         </Popup>
       </Marker>
    </MapContainer>
  );
}

export default ProjectMap;