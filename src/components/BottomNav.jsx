export default function BottomNav({ page, onNavigate }) {
  const tabs = [
    { id: 'home',    label: 'בית',       Icon: HomeIcon },
    { id: 'history', label: 'היסטוריה',  Icon: HistoryIcon },
    { id: 'profile', label: 'פרופיל',    Icon: ProfileIcon },
  ];

  return (
    <nav
      className="flex-shrink-0 flex"
      style={{
        background: 'linear-gradient(180deg, #0A0E1A 0%, #0D1421 100%)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {tabs.map(({ id, label, Icon }) => {
        const active = page === id;
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="flex-1 flex flex-col items-center py-3 gap-1 transition-all duration-200 active:scale-95"
          >
            <Icon active={active} />
            <span
              className="text-xs font-medium transition-colors duration-200"
              style={{ color: active ? '#4F94FF' : '#475569' }}
            >
              {label}
            </span>
            {active && (
              <span
                className="absolute bottom-1 w-1 h-1 rounded-full"
                style={{ background: '#4F94FF', boxShadow: '0 0 6px #4F94FF' }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function HomeIcon({ active }) {
  const c = active ? '#4F94FF' : '#475569';
  return (
    <svg width="22" height="22" fill="none" stroke={c} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function HistoryIcon({ active }) {
  const c = active ? '#4F94FF' : '#475569';
  return (
    <svg width="22" height="22" fill="none" stroke={c} strokeWidth="1.8" viewBox="0 0 24 24">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

function ProfileIcon({ active }) {
  const c = active ? '#4F94FF' : '#475569';
  return (
    <svg width="22" height="22" fill="none" stroke={c} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
