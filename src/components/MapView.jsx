import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';

function MapController({ center, follow }) {
  const map = useMap();
  const first = useRef(true);

  useEffect(() => {
    if (!center) return;
    if (first.current) {
      map.setView(center, 17);
      first.current = false;
    } else if (follow) {
      map.panTo(center, { animate: true, duration: 0.6 });
    }
  }, [center, follow, map]);

  return null;
}

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    try {
      map.fitBounds(
        [[bounds.sw.lat, bounds.sw.lng], [bounds.ne.lat, bounds.ne.lng]],
        { padding: [48, 48] }
      );
    } catch (_) {}
  }, [bounds, map]);
  return null;
}

export default function MapView({ gpsPoints = [], currentPosition = null, follow = false, fitBounds = null, className = '' }) {
  const center = currentPosition
    ? [currentPosition.lat, currentPosition.lng]
    : gpsPoints.length
    ? [gpsPoints[gpsPoints.length - 1].lat, gpsPoints[gpsPoints.length - 1].lng]
    : [31.7683, 35.2137];

  const polyline = gpsPoints.map((p) => [p.lat, p.lng]);

  return (
    <div className={`w-full ${className}`} style={{ minHeight: 200 }}>
      <MapContainer
        center={center}
        zoom={17}
        zoomControl={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Dark map tiles — Carto Dark Matter (free, no API key) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {polyline.length > 1 && (
          <Polyline
            positions={polyline}
            color="#4F94FF"
            weight={4}
            opacity={0.9}
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

        <MapController
          center={currentPosition ? [currentPosition.lat, currentPosition.lng] : null}
          follow={follow}
        />
        {fitBounds && <FitBounds bounds={fitBounds} />}
      </MapContainer>
    </div>
  );
}
