// ========================================================================
// INICIO: Contenido CORREGIDO para frontend/src/components/ProjectMap.tsx
// ========================================================================
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Arreglo para icono por defecto (mantener o ajustar si es necesario)
// delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


const concepcionPosition: L.LatLngExpression = [-36.827, -73.050];

interface ProjectMapProps {
    // Props futuras: center, zoom, markerPosition, polygonData, etc.
}

function ProjectMap({ /* props */ }: ProjectMapProps) {
    return (
        <MapContainer
            center={concepcionPosition}
            zoom={14}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }} // <-- CORRECCIÓN: Usa 100% height
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Marcador estático de ejemplo */}
            <Marker position={concepcionPosition}>
                <Popup>Ubicación (Referencia)</Popup>
            </Marker>
             {/* TODO: Añadir lógica para mostrar marcador/polígono del proyecto */}
        </MapContainer>
    );
}

export default ProjectMap;
// ========================================================================
// FIN: Contenido CORREGIDO para frontend/src/components/ProjectMap.tsx
// ========================================================================