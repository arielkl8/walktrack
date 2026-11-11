import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';

const DEFAULT_CENTER = [31.7683, 35.2137];

// Leaflet caches its container size; tell it whenever the container resizes
// (bottom panel changes height, page hidden/shown, rotation) or tiles render misaligned/grey.
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

export default function MapView({ gpsPoints = [], currentPosition = null, follow = false, liveTail = false, fitBounds = null, className = '' }) {
  const initialCenter = currentPosition
    ? [currentPosition.lat, currentPosition.lng]
    : gpsPoints.length
    ? [gpsPoints[gpsPoints.length - 1].lat, gpsPoints[gpsPoints.length - 1].lng]
    : DEFAULT_CENTER;

  const polyline = gpsPoints.map((p) => [p.lat, p.lng]);
  // While tracking, connect the recorded route to the live position so the line follows you in real time
  if (liveTail && currentPosition && polyline.length) {
    polyline.push([currentPosition.lat, currentPosition.lng]);
  }

  return (
    // Leaflet misbehaves inside RTL documents — force LTR for the map only
    <div dir="ltr" className={`w-full relative ${className}`} style={{ minHeight: 200 }}>
      <MapContainer
        center={initialCenter}
        zoom={17}
        zoomControl={false}
        attributionControl={false}
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* Dark map tiles — Carto Dark Matter (free, no API key) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
          maxNativeZoom={19}
        />

        {polyline.length > 1 && (
          <Polyline
            positions={polyline}
            pathOptions={{ color: '#4F94FF', weight: 5, opacity: 0.9, lineJoin: 'round', lineCap: 'round' }}
            smoothFactor={0.5}
          />
        )}

        {/* Start dot */}
        {polyline.length > 0 && (
          <CircleMarker
            center={polyline[0]}
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
