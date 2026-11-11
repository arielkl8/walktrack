import { useCallback, useEffect, useMemo } from 'react';
import MapView from '../components/MapView';
import { APP_VERSION } from '../version';
import { useGPS } from '../hooks/useGPS';
import { useTracking } from '../hooks/useTracking';
import { saveActivity } from '../utils/storage';

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function StatCard({ label, value, unit, color = '#F1F5F9', glow }) {
  return (
    <div className="flex flex-col items-center px-1">
      <span className="text-xs font-medium mb-1" style={{ color: '#475569' }}>{label}</span>
      <span
        className="text-2xl font-black stat-value leading-none"
        style={{ color, textShadow: glow ? `0 0 20px ${glow}` : undefined }}
      >
        {value}
      </span>
      {unit && <span className="text-xs mt-0.5" style={{ color: '#475569' }}>{unit}</span>}
    </div>
  );
}

export default function Home({ profile, userId, onNavigate }) {
  const gps      = useGPS();
  const tracking = useTracking(gps.gpsPoints, profile);
  const { state } = tracking;

  // Keep GPS warm while idle so the first tracked points are already accurate
  useEffect(() => { if (state === 'idle') gps.startWatching(false); }, [state]); // eslint-disable-line

  const handleStart = useCallback(() => {
    gps.startWatching(true);
    tracking.start();
  }, [gps, tracking]);

  const handlePause   = useCallback(() => { gps.pauseCollecting(); tracking.pause(); }, [gps, tracking]);
  const handleResume  = useCallback(() => { gps.resumeCollecting(); tracking.resume(tracking.pauseStart); }, [gps, tracking]);
  const handleStop    = useCallback(() => { gps.stopWatching(); tracking.stop(tracking.pauseStart); }, [gps, tracking]);

  const handleSave = useCallback(async () => {
    const record = tracking.buildActivityRecord(gps.gpsPoints);
    try { await saveActivity(record, userId); } catch (e) { console.error(e); }
    gps.resetPoints();
    tracking.reset();
  }, [tracking, gps, userId]);

  const handleDiscard = useCallback(() => { gps.resetPoints(); tracking.reset(); }, [gps, tracking]);

  const isActive  = state === 'active';
  const isPaused  = state === 'paused';
  const isSummary = state === 'summary';
  const isIdle    = state === 'idle';

  const summaryBounds = useMemo(() => {
    if (!isSummary || gps.gpsPoints.length < 2) return null;
    return {
      sw: { lat: Math.min(...gps.gpsPoints.map(p => p.lat)), lng: Math.min(...gps.gpsPoints.map(p => p.lng)) },
      ne: { lat: Math.max(...gps.gpsPoints.map(p => p.lat)), lng: Math.max(...gps.gpsPoints.map(p => p.lng)) },
    };
  }, [isSummary, gps.gpsPoints]);

  return (
    <div className="flex flex-col h-full relative" style={{ background: '#070B14' }}>
      {/* Version badge */}
      <span
        className="absolute top-3 left-3 z-[1000] px-2 py-0.5 rounded-md text-[10px] font-semibold pointer-events-none"
        style={{ background: 'rgba(7,11,20,0.7)', color: '#64748B', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {APP_VERSION}
      </span>

      {/* Map */}
      <MapView
        gpsPoints={gps.gpsPoints}
        currentPosition={gps.currentPosition}
        follow={isActive}
        liveTail={isActive}
        fitBounds={summaryBounds}
        className="flex-1"
      />

      {/* Bottom panel */}
      <div style={{ background: 'linear-gradient(180deg, rgba(7,11,20,0.95) 0%, #070B14 100%)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        {/* GPS error */}
        {gps.error && (
          <div className="mx-4 mt-3 px-4 py-2 rounded-xl text-sm text-center" style={{ background: 'rgba(255,71,87,0.12)', border: '1px solid rgba(255,71,87,0.25)', color: '#FF4757' }}>
            {gps.error}
          </div>
        )}

        {/* Profile warning */}
        {isIdle && !profile?.weightKg && (
          <button
            onClick={() => onNavigate('profile')}
            className="w-full px-4 py-2.5 text-sm text-center"
            style={{ color: '#4F94FF', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            הגדר פרופיל לחישוב קלוריות ←
          </button>
        )}

        {/* ── IDLE ── */}
        {isIdle && (
          <div className="px-5 pt-5 pb-6">
            <button
              onClick={handleStart}
              className="btn-start w-full rounded-2xl text-white font-black text-lg tracking-wide"
              style={{ minHeight: 60 }}
            >
              התחל הליכה
            </button>
          </div>
        )}

        {/* ── ACTIVE / PAUSED ── */}
        {(isActive || isPaused) && (
          <div className="px-4 pt-4 pb-5">
            {/* Tracking indicator */}
            <div className="flex items-center justify-center gap-2 mb-3">
              {isActive ? (
                <>
                  <span className="pulse-dot" />
                  <span className="text-xs font-semibold" style={{ color: '#00D084' }}>מודד...</span>
                </>
              ) : (
                <span className="text-xs font-semibold" style={{ color: '#FF9F43' }}>מושהה</span>
              )}
            </div>

            {/* Stats row */}
            <div
              className="grid grid-cols-4 gap-1 mb-4 rounded-2xl py-4 px-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <StatCard label="מרחק" value={tracking.distanceKm.toFixed(2)} unit='ק"מ' color="#4F94FF" glow="rgba(79,148,255,0.5)" />
              <StatCard label="זמן"   value={formatTime(tracking.durationSeconds)} color="#F1F5F9" />
              <StatCard label="מהירות" value={tracking.currentSpeedKmh.toFixed(1)} unit='קמ"ש' color="#00D084" glow="rgba(0,208,132,0.5)" />
              <StatCard label="קלוריות" value={tracking.calories} unit="קל" color="#FF9F43" glow="rgba(255,159,67,0.5)" />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              {isPaused ? (
                <button onClick={handleResume} className="btn-start flex-1 rounded-2xl text-white font-bold text-base" style={{ minHeight: 56 }}>
                  המשך
                </button>
              ) : (
                <button onClick={handlePause} className="btn-ghost rounded-2xl text-text-2 text-sm font-semibold px-5" style={{ minHeight: 56 }}>
                  השהה
                </button>
              )}
              <button onClick={handleStop} className="btn-stop flex-1 rounded-2xl text-white font-bold text-base" style={{ minHeight: 56 }}>
                עצור
              </button>
            </div>
          </div>
        )}

        {/* ── SUMMARY ── */}
        {isSummary && (
          <div className="px-4 pt-4 pb-5 page-enter">
            <h2 className="text-center font-black text-text-1 text-lg mb-4 tracking-wide">סיכום פעילות 🏁</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'מרחק',          value: `${tracking.distanceKm.toFixed(2)} ק"מ`,         color: '#4F94FF' },
                { label: 'זמן',           value: formatTime(tracking.durationSeconds),               color: '#F1F5F9' },
                { label: 'מהירות ממוצעת', value: `${tracking.avgSpeedKmh.toFixed(1)} קמ"ש`,       color: '#00D084' },
                { label: 'קלוריות',       value: `${tracking.calories} קל`,                        color: '#FF9F43' },
              ].map(({ label, value, color }) => (
                <div key={label} className="dark-card rounded-2xl p-4 text-center">
                  <p className="text-xs mb-1" style={{ color: '#475569' }}>{label}</p>
                  <p className="text-base font-black" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={handleDiscard} className="btn-ghost rounded-2xl text-text-2 text-sm font-semibold px-5" style={{ minHeight: 56 }}>
                בטל
              </button>
              <button onClick={handleSave} className="btn-primary flex-1 rounded-2xl text-white font-bold text-base" style={{ minHeight: 56 }}>
                שמור פעילות
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
