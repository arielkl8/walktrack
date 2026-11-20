import { useEffect, useRef } from 'react';
import { MapContainer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'maplibre-gl/dist/maplibre-gl.css';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import { setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

// MapLibre looks for its worker next to its own file, which bundling moves — point it there explicitly
setWorkerUrl(maplibreWorkerUrl);

const DEFAULT_CENTER = [31.7683, 35.2137];

// OpenFreeMap — free vector map, no API key and no usage limits.
// (Carto's dark tiles started requiring an API key and showed "API KEY REQUIRED" on every tile.)
// Vector tiles stay sharp at every zoom level, zooming in and out.
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark';

function VectorBaseMap() {
  const map = useMap();
  useEffect(() => {
    const layer = maplibreGL({
      style: MAP_STYLE,
      attributionControl: false,
      attribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    });
    map.attributionControl?.setPrefix(false);
    layer.addTo(map);
    return () => { map.removeLayer(layer); };
  }, [map]);
  return null;
}

// Leaflet caches its container size; tell it whenever the container resizes
// (bottom panel changes height, page hidden/shown, rotation) or the map renders misaligned.
function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

function MapController({ lat, lng, follow }) {
  const map = useMap();
  const first = useRef(true);

  useEffect(() => {
    if (lat == null || lng == null) return;
    if (first.current) {
      map.setView([lat, lng], 17);
      first.current = false;
    } else if (follow) {
      map.panTo([lat, lng], { animate: true, duration: 0.6 });
    }
  }, [lat, lng, follow, map]);

  return null;
}

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    try {
      map.fitBounds(
        [[bounds.sw.lat, bounds.sw.lng], [bounds.ne.lat, bounds.ne.lng]],
        { padding: [48, 48], maxZoom: 18 }
      );
    } catch (_) {}
  }, [bounds, map]);
  return null;
}

// Split the route into runs of measured vs. estimated points (gaps filled while the
// phone was asleep), so estimated parts can be drawn dashed.
function splitSegments(points) {
  const segs = [];
  let cur = null;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const est = !!p.estimated;
    if (!cur || cur.estimated !== est) {
      // share the boundary point so the line has no holes
      const prev = cur ? cur.positions[cur.positions.length - 1] : null;
      cur = { estimated: est, positions: prev ? [prev] : [] };
      segs.push(cur);
    }
    cur.positions.push([p.lat, p.lng]);
  }
  return segs.filter((s) => s.positions.length > 1);
}

const SOLID = { color: '#4F94FF', weight: 5, opacity: 0.9, lineJoin: 'round', lineCap: 'round' };
const DASHED = { color: '#4F94FF', weight: 4, opacity: 0.6, dashArray: '2 9', lineJoin: 'round', lineCap: 'round' };

export default function MapView({ gpsPoints = [], currentPosition = null, follow = false, liveTail = false, fitBounds = null, className = '' }) {
  const initialCenter = currentPosition
    ? [currentPosition.lat, currentPosition.lng]
    : gpsPoints.length
    ? [gpsPoints[gpsPoints.length - 1].lat, gpsPoints[gpsPoints.length - 1].lng]
    : DEFAULT_CENTER;

  const points = [...gpsPoints];
  // While tracking, connect the recorded route to the live position so the line follows you in real time
  if (liveTail && currentPosition && points.length) {
    points.push({ lat: currentPosition.lat, lng: currentPosition.lng });
  }
  const segments = splitSegments(points);

  return (
    // Leaflet misbehaves inside RTL documents — force LTR for the map only
    <div dir="ltr" className={`w-full relative ${className}`} style={{ minHeight: 200 }}>
      <MapContainer
        center={initialCenter}
        zoom={17}
        minZoom={3}
        maxZoom={20}
        zoomControl={false}
        attributionControl={true}
        style={{ position: 'absolute', inset: 0 }}
      >
        <VectorBaseMap />

        {segments.map((s, i) => (
          <Polyline
            key={`${i}-${s.estimated}`}
            positions={s.positions}
            pathOptions={s.estimated ? DASHED : SOLID}
            smoothFactor={0.5}
          />
        ))}

        {/* Start dot */}
        {points.length > 0 && (
          <CircleMarker
            center={[points[0].lat, points[0].lng]}
            radius={6}
            pathOptions={{ color: '#fff', fillColor: '#00D084', fillOpacity: 1, weight: 2 }}
          />
        )}

        {/* Current position */}
        {currentPosition && (
          <CircleMarker
            center={[currentPosition.lat, currentPosition.lng]}
            radius={10}
            pathOptions={{ color: '#fff', fillColor: '#4F94FF', fillOpacity: 1, weight: 3 }}
          />
        )}

        <AutoResize />
        <MapController
          lat={currentPosition?.lat}
          lng={currentPosition?.lng}
          follow={follow}
        />
        {fitBounds && <FitBounds bounds={fitBounds} />}
      </MapContainer>
    </div>
  );
}
