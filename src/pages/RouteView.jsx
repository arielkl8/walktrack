import MapView from '../components/MapView';

const fmtTime = (s) => {
  if (!s) return '00:00';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}` : `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
};

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return iso; }
};

export default function RouteView({ activity, onBack }) {
  if (!activity) return <div className="flex items-center justify-center h-full" style={{ background: '#070B14', color: '#475569' }}>לא נבחרה פעילות</div>;

  const stats = [
    { label: 'מרחק',          value: `${((activity.distanceMeters ?? 0) / 1000).toFixed(2)}`, unit: 'ק"מ', color: '#4F94FF' },
    { label: 'זמן',           value: fmtTime(activity.durationSeconds),                        unit: '',    color: '#F1F5F9' },
    { label: 'מהירות ממוצעת', value: `${(activity.avgSpeedKmh ?? 0).toFixed(1)}`,              unit: 'קמ"ש', color: '#00D084' },
    { label: 'קלוריות',       value: `${activity.caloriesBurned ?? 0}`,                        unit: 'קל',  color: '#FF9F43' },
  ];

  return (
    <div className="flex flex-col h-full page-enter" style={{ background: '#070B14' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={onBack}
          className="btn-ghost w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        >
          <svg width="18" height="18" fill="none" stroke="#94A3B8" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <div>
          <h1 className="font-black text-text-1 text-base">מסלול הליכה</h1>
          <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{fmtDate(activity.startTime)}</p>
        </div>
      </div>

      {/* Map */}
      <MapView
        gpsPoints={activity.gpsPoints ?? []}
        currentPosition={null}
        follow={false}
        fitBounds={activity.mapBounds}
        className="flex-1"
      />

      {/* Stats */}
      <div
        className="px-4 py-4"
        style={{ background: 'rgba(7,11,20,0.97)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="grid grid-cols-4 gap-2">
          {stats.map(({ label, value, unit, color }) => (
            <div key={label} className="dark-card rounded-xl py-3 text-center">
              <p className="text-xs mb-1" style={{ color: '#475569' }}>{label}</p>
              <p className="text-base font-black stat-value" style={{ color }}>{value}</p>
              {unit && <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{unit}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
