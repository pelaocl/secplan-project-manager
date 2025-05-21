// frontend/src/components/ProjectFormMap.tsx
import React, { useEffect, useRef, memo } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import L, { LatLngExpression, LeafletEventHandlerFn } from 'leaflet';
import 'leaflet-draw'; // Importa la funcionalidad de leaflet-draw
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { ProjectFormValues } from '../schemas/projectFormSchema';
import { GeoJSONPoint, GeoJSONPolygon } from '../types'; // Asegúrate que estas interfaces estén bien definidas en ../types

// FIX: Iconos por defecto de Leaflet para que funcionen con Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LeafletDrawControlProps {
  setValue: UseFormSetValue<ProjectFormValues>;
  initialPoint?: GeoJSONPoint | null;
  initialPolygon?: GeoJSONPolygon | null;
}

// Componente interno para manejar los controles de dibujo de Leaflet
const LeafletDrawControl: React.FC<LeafletDrawControlProps> = ({ setValue, initialPoint, initialPolygon }) => {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  // Usamos un ref para la instancia del control de dibujo para que persista entre renders
  const drawControlInstanceRef = useRef<L.Control.Draw | null>(null);

  // useEffect para añadir/eliminar el control de dibujo y sus listeners
  useEffect(() => {
    // Añadir el FeatureGroup al mapa si aún no está
    if (!map.hasLayer(drawnItemsRef.current)) {
      map.addLayer(drawnItemsRef.current);
    }

    // Crear y añadir el control de dibujo solo si no existe una instancia
    if (!drawControlInstanceRef.current) {
      drawControlInstanceRef.current = new L.Control.Draw({
        edit: {
          featureGroup: drawnItemsRef.current,
          remove: true, // Permitir borrar
        },
        draw: {
          polygon: {
            allowIntersection: false,
            shapeOptions: { color: '#2196f3' }, // Azul MUI
          },
          marker: {
            icon: new L.Icon.Default(), // Usa el icono corregido
          },
          polyline: false, // Deshabilitar si no se usa
          rectangle: false, // Deshabilitar si no se usa
          circle: false, // Deshabilitar si no se usa
          circlemarker: false, // Deshabilitar si no se usa
        },
      });
      map.addControl(drawControlInstanceRef.current);
    }

    // Definición de handlers
    const onDrawCreated: LeafletEventHandlerFn = (e) => {
      const event = e as L.DrawEvents.Created;
      const layer = event.layer;
      const feature = layer.toGeoJSON(); // Esto es un GeoJSON Feature
      // Extraemos la geometría; es importante castear correctamente o validar el tipo.
      const geometry = feature.geometry as GeoJSONPoint | GeoJSONPolygon;

      // Lógica para permitir solo un punto y un polígono
      drawnItemsRef.current.eachLayer(l => {
        // Asegurarse de que la capa existente tenga toGeoJSON y produzca una estructura esperada
        const existingLayerGeoJSON = (l as L.Layer & { toGeoJSON?: () => any })?.toGeoJSON?.();
        if (existingLayerGeoJSON && existingLayerGeoJSON.geometry && existingLayerGeoJSON.geometry.type === geometry.type) {
          drawnItemsRef.current.removeLayer(l); // Elimina capa existente del mismo tipo
        }
      });
      drawnItemsRef.current.addLayer(layer); // Añade la nueva capa

      if (geometry.type === 'Point') {
        setValue('location_point', geometry, { shouldValidate: true, shouldDirty: true });
      } else if (geometry.type === 'Polygon') {
        setValue('area_polygon', geometry, { shouldValidate: true, shouldDirty: true });
      }
    };

    const onDrawEdited: LeafletEventHandlerFn = (e) => {
      const event = e as L.DrawEvents.Edited;
      event.layers.eachLayer(layer => {
        const feature = (layer as L.Layer & { toGeoJSON: () => any }).toGeoJSON();
        const geometry = feature.geometry as GeoJSONPoint | GeoJSONPolygon;

        if (geometry.type === 'Point') {
          setValue('location_point', geometry, { shouldValidate: true, shouldDirty: true });
        } else if (geometry.type === 'Polygon') {
          setValue('area_polygon', geometry, { shouldValidate: true, shouldDirty: true });
        }
      });
    };

    const onDrawDeleted: LeafletEventHandlerFn = (e) => {
      const event = e as L.DrawEvents.Deleted;
      event.layers.eachLayer(layer => {
        const feature = (layer as L.Layer & { toGeoJSON: () => any }).toGeoJSON();
        const geometry = feature.geometry;

        if (geometry.type === 'Point') {
          setValue('location_point', null, { shouldValidate: true, shouldDirty: true });
        } else if (geometry.type === 'Polygon') {
          setValue('area_polygon', null, { shouldValidate: true, shouldDirty: true });
        }
      });
    };

    // Registrar eventos
    map.on(L.Draw.Event.CREATED, onDrawCreated);
    map.on(L.Draw.Event.EDITED, onDrawEdited);
    map.on(L.Draw.Event.DELETED, onDrawDeleted);

    // Función de limpieza
    return () => {
      map.off(L.Draw.Event.CREATED, onDrawCreated);
      map.off(L.Draw.Event.EDITED, onDrawEdited);
      map.off(L.Draw.Event.DELETED, onDrawDeleted);

      if (drawControlInstanceRef.current && map && typeof map.removeControl === 'function') {
        try {
          map.removeControl(drawControlInstanceRef.current);
        } catch (error) {
          console.warn("Error al intentar remover el control de dibujo del mapa:", error);
        }
        drawControlInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, setValue]); // `setValue` de RHF es generalmente estable, `map` también debería serlo.

  // useEffect separado para manejar la carga/actualización de geometrías iniciales
  useEffect(() => {
    if (!map || !drawnItemsRef.current) return;

    drawnItemsRef.current.clearLayers(); // Limpiar capas existentes antes de dibujar las nuevas/actualizadas
    let boundsChanged = false;

    // Al cargar geometrías iniciales, estas son Geometry objects.
    // L.geoJSON espera un Feature o FeatureCollection, así que las envolvemos.
    if (initialPoint && initialPoint.type === 'Point') {
      try {
        const featureCollection = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: initialPoint, properties: {} }] };
        const pointLayer = L.geoJSON(featureCollection as any, { // any para simplificar el casteo aquí
          pointToLayer: (_feature, latlng) => L.marker(latlng), // Asegura que se cree un marcador
        });
        pointLayer.eachLayer(layer => drawnItemsRef.current.addLayer(layer));
        boundsChanged = true;
      } catch (error) {
        console.error("Error cargando punto inicial en el mapa:", error, initialPoint);
      }
    }

    if (initialPolygon && initialPolygon.type === 'Polygon') {
      try {
        const featureCollection = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: initialPolygon, properties: {} }] };
        const polygonLayer = L.geoJSON(featureCollection as any);
        polygonLayer.eachLayer(layer => drawnItemsRef.current.addLayer(layer));
        boundsChanged = true;
      } catch (error) {
        console.error("Error cargando polígono inicial en el mapa:", error, initialPolygon);
      }
    }
    
    // Opcional: Centrar el mapa si se cargaron geometrías
    if (boundsChanged && drawnItemsRef.current.getLayers().length > 0) {
        try {
            const bounds = drawnItemsRef.current.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] }); // Ajusta el padding según necesites
            }
        } catch(e) {
            console.warn("No se pudo ajustar los bounds a las geometrías cargadas.", e)
        }
    }

  }, [map, initialPoint, initialPolygon]); // Depende de estas props para redibujar

  return null; // Este componente no renderiza DOM visible, solo interactúa con el mapa padre
};

interface ProjectFormMapProps {
  setValue: UseFormSetValue<ProjectFormValues>;
  watch: UseFormWatch<ProjectFormValues>;
}

const ProjectFormMap: React.FC<ProjectFormMapProps> = ({ setValue, watch }) => {
  const defaultCenter: LatLngExpression = [-36.82699, -73.04977]; // Centro de Concepción, Chile
  const defaultZoom = 13;

  // Observa los valores del formulario para pasarlos como iniciales al control de dibujo
  const watchedPoint = watch('location_point');
  const watchedPolygon = watch('area_polygon');

  return (
    <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: '450px', width: '100%', borderRadius: '4px' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FeatureGroup>
        {/* Pasamos los valores observados como initialPoint/initialPolygon */}
        <LeafletDrawControl 
            setValue={setValue} 
            initialPoint={watchedPoint} 
            initialPolygon={watchedPolygon} 
        />
      </FeatureGroup>
    </MapContainer>
  );
};

// Usar memo para optimizar si el componente ProjectFormMap se vuelve complejo
// o si sus props (setValue, watch) no cambian frecuentemente de identidad.
export default memo(ProjectFormMap);