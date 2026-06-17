import { useState, useEffect, useCallback } from 'react';
import { loadActivities, deleteActivity } from '../utils/storage';

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
};

const fmtTime = (s) => {
  if (!s) return '00:00';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`
    : `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
};

export default function History({ onViewRoute, userId }) {
  const [activities, setActivities]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setActivities(await loadActivities(userId));
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const handleDelete = async (id) => {
    await deleteActivity(id, userId);
    setActivities((prev) => prev.filter((a) => a.id !== id));
    setConfirmDelete(null);
  };

  const totalKm  = activities.reduce((s, a) => s + (a.distanceMeters ?? 0) / 1000, 0);
  const totalCal = activities.reduce((s, a) => s + (a.caloriesBurned ?? 0), 0);

  return (
    <div className="flex flex-col h-full page-enter" style={{ background: '#070B14' }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h1 className="text-xl font-black text-text-1 mb-4">פעילויות</h1>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'פעילויות', value: activities.length, color: '#4F94FF' },
            { label: 'ק"מ',     value: totalKm.toFixed(1), color: '#00D084' },
            { label: 'קלוריות', value: totalCal,           color: '#FF9F43' },
          ].map(({ label, value, color }) => (
            <div key={label} className="dark-card rounded-2xl py-3 text-center">
              <p className="text-xl font-black" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-3">
        {loading && (
          <div className="flex justify-center pt-20">
            <svg className="w-8 h-8 animate-spin" style={{ color: '#4F94FF' }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        )}

        {!loading && activities.length === 0 && (
          <div className="text-center pt-24">
            <div className="text-5xl mb-4">🚶</div>
            <p className="text-text-2 text-base font-medium">עדיין אין פעילויות</p>
            <p className="text-text-3 text-sm mt-1">צא להליכה וחזור לכאן!</p>
          </div>
        )}

        {activities.map((a) => (
          <div key={a.id} className="dark-card rounded-2xl overflow-hidden">
            <button
              onClick={() => onViewRoute(a)}
              className="w-full text-right p-4 active:opacity-70 transition-opacity"
            >
              <div className="flex justify-between items-center mb-3">
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: 'rgba(79,148,255,0.12)', color: '#4F94FF' }}
                >
                  מסלול ↙
                </span>
                <span className="text-xs" style={{ color: '#475569' }}>{fmtDate(a.startTime)}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'ק"מ',   value: ((a.distanceMeters ?? 0) / 1000).toFixed(2), color: '#4F94FF' },
                  { label: 'זמן',   value: fmtTime(a.durationSeconds),                  color: '#F1F5F9' },
                  { label: 'קמ"ש', value: (a.avgSpeedKmh ?? 0).toFixed(1),              color: '#00D084' },
                  { label: 'קל',    value: a.caloriesBurned ?? 0,                        color: '#FF9F43' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <p className="text-sm font-black stat-value" style={{ color }}>{value}</p>
                    <p className="text-xs" style={{ color: '#475569' }}>{label}</p>
                  </div>
                ))}
              </div>
            </button>

            {/* Delete row */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {confirmDelete === a.id ? (
                <div className="flex">
                  <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 text-xs" style={{ color: '#475569' }}>ביטול</button>
                  <button onClick={() => handleDelete(a.id)} className="flex-1 py-3 text-xs font-bold" style={{ color: '#FF4757', borderRight: '1px solid rgba(255,255,255,0.05)' }}>מחק</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(a.id)} className="w-full py-2.5 text-xs" style={{ color: '#475569' }}>
                  מחק פעילות
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
