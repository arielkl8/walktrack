import { useState, useEffect, useRef, useCallback } from 'react';
import { haversine, totalDistance } from '../utils/haversine';
import { calcCalories } from '../utils/calories';

export function useTracking(gpsPoints, profile) {
  const [state, setState] = useState('idle'); // idle | active | paused | summary
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [pausedMs, setPausedMs] = useState(0);
  const [pauseStart, setPauseStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const wakeLockRef = useRef(null);

  useEffect(() => {
    if (state !== 'active') return;
    const id = setInterval(() => {
      setElapsed(Date.now() - startTime - pausedMs);
    }, 1000);
    return () => clearInterval(id);
  }, [state, startTime, pausedMs]);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (_) {}
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  };

  const start = useCallback(() => {
    const now = Date.now();
    setStartTime(now);
    setEndTime(null);
    setPausedMs(0);
    setPauseStart(null);
    setElapsed(0);
    setState('active');
    requestWakeLock();
  }, []);

  const pause = useCallback(() => {
    setPauseStart(Date.now());
    setState('paused');
  }, []);

  const resume = useCallback((currentPauseStart) => {
    if (currentPauseStart) {
      setPausedMs((prev) => prev + (Date.now() - currentPauseStart));
      setPauseStart(null);
    }
    setState('active');
  }, []);

  const stop = useCallback((currentPauseStart) => {
    const now = Date.now();
    setEndTime(now);
    if (currentPauseStart) {
      setPausedMs((prev) => prev + (now - currentPauseStart));
      setPauseStart(null);
    }
    setState('summary');
    releaseWakeLock();
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setStartTime(null);
    setEndTime(null);
    setPausedMs(0);
    setPauseStart(null);
    setElapsed(0);
    releaseWakeLock();
  }, []);

  // derived metrics
  const durationSeconds = Math.floor(elapsed / 1000);
  const finalDurationSeconds =
    endTime && startTime
      ? Math.floor((endTime - startTime - pausedMs) / 1000)
      : durationSeconds;

  const distanceMeters = totalDistance(gpsPoints);
  const distanceKm = distanceMeters / 1000;

  const activeDuration = state === 'summary' ? finalDurationSeconds : durationSeconds;

  const avgSpeedKmh =
    activeDuration > 0 ? distanceKm / (activeDuration / 3600) : 0;

  // recent speed from last 2 GPS points
  let currentSpeedKmh = avgSpeedKmh;
  if (gpsPoints.length >= 2) {
    const a = gpsPoints[gpsPoints.length - 2];
    const b = gpsPoints[gpsPoints.length - 1];
    const dt = (b.timestamp - a.timestamp) / 1000 / 3600;
    if (dt > 0) {
      const d = haversine(a.lat, a.lng, b.lat, b.lng) / 1000;
      currentSpeedKmh = d / dt;
    }
  }

  const calories = calcCalories({
    distanceMeters,
    durationSeconds: activeDuration,
    weightKg: profile?.weightKg,
    gender: profile?.gender,
    avgSpeedKmh,
  });

  const buildActivityRecord = (finalPoints) => {
    const pts = finalPoints ?? gpsPoints;
    return {
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime ?? Date.now()).toISOString(),
      durationSeconds: finalDurationSeconds,
      distanceMeters: Math.round(distanceMeters),
      avgSpeedKmh: Math.round(avgSpeedKmh * 10) / 10,
      caloriesBurned: calories,
      gpsPoints: pts.map(({ lat, lng, accuracy, altitude, timestamp }) => ({
        lat,
        lng,
        accuracy,
        altitude: altitude ?? null,
        timestamp,
      })),
      mapBounds:
        pts.length
          ? {
              sw: {
                lat: Math.min(...pts.map((p) => p.lat)),
                lng: Math.min(...pts.map((p) => p.lng)),
              },
              ne: {
                lat: Math.max(...pts.map((p) => p.lat)),
                lng: Math.max(...pts.map((p) => p.lng)),
              },
            }
          : null,
    };
  };

  return {
    state,
    pauseStart,
    durationSeconds: activeDuration,
    distanceMeters,
    distanceKm,
    avgSpeedKmh,
    currentSpeedKmh,
    calories,
    start,
    pause,
    resume,
    stop,
    reset,
    buildActivityRecord,
  };
}
