import { useState, useRef, useCallback, useEffect } from 'react';
import { haversine } from '../utils/haversine';

// Readings worse than this are ignored (phones typically report 5–30m outdoors)
const MAX_ACCURACY = 35;
// Minimum movement (after smoothing) before a new route point is recorded
const MIN_MOVE = 2;
// Anything faster than this between two readings is a GPS spike (≈43 km/h)
const MAX_SPEED = 12;
// After this many consecutive spike rejections, accept anyway (e.g. after losing signal)
const MAX_REJECTS = 3;
// Kalman process noise — expected movement in m/s for walking/running
const Q_METERS_PER_SEC = 3;

const WATCH_OPTIONS = { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 };

// Lightweight Kalman filter for lat/lng, using the reported accuracy as measurement noise.
// Smooths GPS jitter without cutting corners like a distance threshold does.
function createKalman() {
  let lat = null, lng = null, variance = -1, ts = 0;
  return {
    reset() { variance = -1; },
    process(newLat, newLng, accuracy, timestamp) {
      const acc = Math.max(accuracy, 1);
      if (variance < 0) {
        lat = newLat; lng = newLng; variance = acc * acc; ts = timestamp;
      } else {
        const dt = Math.max(timestamp - ts, 0) / 1000;
        if (dt > 0) {
          variance += dt * Q_METERS_PER_SEC * Q_METERS_PER_SEC;
          ts = timestamp;
        }
        const k = variance / (variance + acc * acc);
        lat += k * (newLat - lat);
        lng += k * (newLng - lng);
        variance = (1 - k) * variance;
      }
      return { lat, lng };
    },
  };
}

export function useGPS() {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [gpsPoints, setGpsPoints] = useState([]);
  const [error, setError] = useState(null);

  const watchIdRef = useRef(null);
  const lastPointRef = useRef(null);
  const rejectsRef = useRef(0);
  const kalmanRef = useRef(createKalman());
  const collectingRef = useRef(false); // avoids stale-closure issues inside watchPosition callback

  const handlePosition = useCallback((position) => {
    const { latitude, longitude, accuracy, altitude } = position.coords;
    const raw = { lat: latitude, lng: longitude, accuracy, altitude, timestamp: position.timestamp };
    setError(null);

    if (!collectingRef.current) {
      setCurrentPosition(raw);
      return;
    }
    if (accuracy > MAX_ACCURACY) {
      setCurrentPosition(raw);
      return;
    }

    const last = lastPointRef.current;
    if (last) {
      const d = haversine(last.lat, last.lng, latitude, longitude);
      const dt = (position.timestamp - last.timestamp) / 1000;
      if (dt > 0 && d / dt > MAX_SPEED && rejectsRef.current < MAX_REJECTS) {
        rejectsRef.current += 1;
        return;
      }
      if (rejectsRef.current >= MAX_REJECTS) kalmanRef.current.reset();
    }
    rejectsRef.current = 0;

    const smoothed = kalmanRef.current.process(latitude, longitude, accuracy, position.timestamp);
    const pos = { ...raw, lat: smoothed.lat, lng: smoothed.lng };
    setCurrentPosition(pos);

    if (last && haversine(last.lat, last.lng, pos.lat, pos.lng) < MIN_MOVE) return;

    lastPointRef.current = pos;
    setGpsPoints((prev) => [...prev, pos]);
  }, []);

  const handleError = useCallback((err) => {
    if (err.code === 1) setError('נא לאשר גישה למיקום בהגדרות הדפדפן');
    else if (err.code === 2) setError('מחפש אות GPS...');
    // code 3 (timeout) is transient — watchPosition keeps trying, so don't alarm the user
  }, []);

  const startWatching = useCallback((collecting = false) => {
    collectingRef.current = collecting;

    if (!navigator.geolocation) {
      setError('GPS אינו נתמך בדפדפן זה');
      return;
    }

    if (watchIdRef.current !== null) return; // already watching

    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, WATCH_OPTIONS);
  }, [handlePosition, handleError]);

  const resumeCollecting = useCallback(() => {
    collectingRef.current = true;
    // keep lastPointRef so the route continues from where it was paused,
    // but restart smoothing since the walker may have moved
    kalmanRef.current.reset();
    rejectsRef.current = 0;
  }, []);

  const pauseCollecting = useCallback(() => {
    collectingRef.current = false;
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    collectingRef.current = false;
  }, []);

  const resetPoints = useCallback(() => {
    setGpsPoints([]);
    lastPointRef.current = null;
    rejectsRef.current = 0;
    kalmanRef.current.reset();
  }, []);

  // Clear the watch if the component using this hook unmounts
  useEffect(() => stopWatching, [stopWatching]);

  return {
    currentPosition,
    gpsPoints,
    error,
    startWatching,
    stopWatching,
    resumeCollecting,
    pauseCollecting,
    resetPoints,
  };
}
