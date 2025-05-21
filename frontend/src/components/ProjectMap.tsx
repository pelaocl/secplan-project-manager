// frontend/src/components/ProjectMap.tsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L, { LatLngExpression, GeoJSON as LeafletGeoJSON } from 'leaflet';
import { GeoJSONPoint, GeoJSONPolygon } from '../types'; // Asegúrate que estas estén definidas

// FIX: Iconos por defecto de Leaflet (si no lo tienes centralizado, mantenlo aquí)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ProjectMapProps {
  locationPoint?: GeoJSONPoint | null;
  areaPolygon?: GeoJSONPolygon | null;
  defaultCenter?: LatLngExpression;
  defaultZoom?: number;
  mapHeight?: string; // Para poder ajustar la altura si es necesario
}

// Componente auxiliar para centrar el mapa en las geometrías
const FitBoundsToFeatures: React.FC<{
  geoJsonLayer: LeafletGeoJSON | null;
  point?: GeoJSONPoint | null; // Para centrar si solo hay un punto y getBounds es problemático
}> = ({ geoJsonLayer, point }) => {
  const map = useMap();

  useEffect(() => {
    if (geoJsonLayer && geoJsonLayer.getLayers().length > 0) {
      const bounds = geoJsonLayer.getBounds();
      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30] }); // Ajusta el padding
      } else if (point) {
        // Fallback si solo hay un punto y getBounds no es suficiente
        map.setView([point.coordinates[1], point.coordinates[0]], 15); // lat, lng
      }
    }
  }, [map, geoJsonLayer, point]); // Re-ejecutar si cambian

  return null;
};

const ProjectMap: React.FC<ProjectMapProps> = ({
  locationPoint,
  areaPolygon,
  defaultCenter = [-36.82699, -73.04977], // Concepción, Chile
  defaultZoom = 12, // Un zoom un poco más alejado por defecto
  mapHeight = '100%', // Altura por defecto
}) => {
  const [geoJsonLayer, setGeoJsonLayer] = React.useState<LeafletGeoJSON | null>(null);
  const [key, setKey] = React.useState(Date.now()); // Para forzar re-render de GeoJSON si es necesario

  useEffect(() => {
    const features = [];
    if (locationPoint && locationPoint.type === 'Point') {
      features.push({ type: 'Feature', geometry: locationPoint, properties: { _id: 'locationPoint' } });
    }
    if (areaPolygon && areaPolygon.type === 'Polygon') {
      features.push({ type: 'Feature', geometry: areaPolygon, properties: { _id: 'areaPolygon' } });
    }

    if (features.length > 0) {
      const featureCollection = { type: 'FeatureCollection', features } as any;
      setGeoJsonLayer(L.geoJSON(featureCollection, {
        pointToLayer: (feature, latlng) => {
          // Puedes personalizar el marcador si quieres
          return L.marker(latlng);
        },
        style: (feature) => {
          // Estilo para los polígonos
          if (feature?.geometry.type === 'Polygon') {
            return { color: '#3388ff', weight: 2, opacity: 0.8, fillOpacity: 0.2 };
          }
          return {};
        },
      }));
      setKey(Date.now()); // Cambia la key para asegurar que GeoJSON re-renderice si data cambia
    } else {
      setGeoJsonLayer(null); // No hay geometrías para mostrar
    }
  }, [locationPoint, areaPolygon]);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: mapHeight, width: '100%' }}
      scrollWheelZoom={false} // Deshabilitar zoom con scroll para mapas embebidos es usualmente bueno
      dragging={!(L.Browser.mobile)} // Deshabilitar drag en mobile si se quiere evitar scroll accidental
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Usamos el componente GeoJSON de react-leaflet */}
      {geoJsonLayer && <GeoJSON key={key} data={geoJsonLayer.toGeoJSON() as any /* Type assertion */} />}
      
      {/* Componente para ajustar el zoom a las geometrías */}
      <FitBoundsToFeatures geoJsonLayer={geoJsonLayer} point={locationPoint} />
    </MapContainer>
  );
};

export default ProjectMap;