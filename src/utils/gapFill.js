import { haversine } from './haversine';

// Public OSRM server with a walking ("foot") profile, run by FOSSGIS on OpenStreetMap data. Free, no key.
const ROUTER = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';
const TIMEOUT_MS = 8000;
// A walking route much longer than the straight line probably went somewhere else; don't trust it
const MAX_DETOUR = 2.5;

// Build points between `from` and `to` (both excluded), with timestamps spread by distance.
function toPoints(coords, from, to) {
  const pts = coords.map(([lng, lat]) => ({ lat, lng }));
  let total = 0;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    total += haversine(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng);
    cum.push(total);
  }
  const span = to.timestamp - from.timestamp;
  return pts.map((p, i) => ({
    lat: p.lat,
    lng: p.lng,
    accuracy: null,
    altitude: null,
    timestamp: Math.round(from.timestamp + (total > 0 ? (cum[i] / total) * span : 0)),
    estimated: true,
  }))
    // drop endpoints that sit on top of the measured points
    .filter((p) => p.timestamp > from.timestamp && p.timestamp < to.timestamp);
}

// Estimate the path walked during a GPS gap (e.g. screen was off and the browser paused GPS).
// Returns points marked `estimated: true`. Falls back to a single dashed midpoint if routing fails.
export async function estimateGap(from, to) {
  const fallback = [{
    lat: (from.lat + to.lat) / 2,
    lng: (from.lng + to.lng) / 2,
    accuracy: null,
    altitude: null,
    timestamp: Math.round((from.timestamp + to.timestamp) / 2),
    estimated: true,
  }];

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const url = `${ROUTER}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return fallback;
    const data = await res.json();
    const route = data?.routes?.[0];
    const coords = route?.geometry?.coordinates;
    if (data.code !== 'Ok' || !coords?.length) return fallback;

    const straight = haversine(from.lat, from.lng, to.lat, to.lng);
    if (route.distance > Math.max(straight * MAX_DETOUR, straight + 150)) return fallback;

    const pts = toPoints(coords, from, to);
    return pts.length ? pts : fallback;
  } catch (_) {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
