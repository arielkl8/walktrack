import { useState, useRef, useCallback } from 'react';
import { haversine } from '../utils/haversine';

const MIN_ACCURACY = 20;
const MIN_MOVE = 5;

export function useGPS() {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [gpsPoints, setGpsPoints] = useState([]);
  const [error, setError] = useState(null);

  const watchIdRef = useRef(null);
  const lastPointRef = useRef(null);
  const collectingRef = useRef(false); // avoids stale-closure issues inside watchPosition callback

  const handlePosition = useCallback((position) => {
    const { latitude, longitude, accuracy, altitude } = position.coords;
    const pos = { lat: latitude, lng: longitude, accuracy, altitude, timestamp: position.timestamp };
    setCurrentPosition(pos);

    if (!collectingRef.current) return;
    if (accuracy > MIN_ACCURACY) return;

    if (lastPointRef.current) {
      const d = haversine(lastPointRef.current.lat, lastPointRef.current.lng, latitude, longitude);
      if (d < MIN_MOVE) return;
    }

    lastPointRef.current = pos;
    setGpsPoints((prev) => [...prev, pos]);
  }, []);

  const handleError = useCallback((err) => {
    setError(err.code === 1 ? 'נא לאשר גישה למיקום בהגדרות הדפדפן' : err.message);
  }, []);

  const startWatching = useCallback((collecting = false) => {
    setError(null);
    collectingRef.current = collecting;

    if (!navigator.geolocation) {
      setError('GPS אינו נתמך בדפדפן זה');
      return;
    }

    if (watchIdRef.current !== null) return; // already watching

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  }, [handlePosition, handleError]);

  const resumeCollecting = useCallback(() => {
    collectingRef.current = true;
    lastPointRef.current = null;
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
  }, []);

  // Lightweight map-center helper (no GPS watch needed)
  const getPosition = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCurrentPosition({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
          altitude: p.coords.altitude,
          timestamp: p.timestamp,
        });
      },
      handleError,
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, [handleError]);

  return {
    currentPosition,
    gpsPoints,
    error,
    startWatching,
    stopWatching,
    resumeCollecting,
    pauseCollecting,
    resetPoints,
    getPosition,
  };
}
