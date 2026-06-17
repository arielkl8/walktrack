import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import History from './pages/History';
import RouteView from './pages/RouteView';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { loadProfile } from './utils/storage';

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center h-full" style={{ background: '#070B14' }}>
      <div className="text-5xl mb-4">🚶</div>
      <svg className="w-8 h-8 animate-spin" style={{ color: '#4F94FF' }} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );
}

export default function App() {
  const { user, signIn, signOut, error: authError, loading: authLoading, isLoading } = useAuth();
  const [page, setPage]                 = useState('home');
  const [profile, setProfile]           = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Load profile whenever user changes
  useEffect(() => {
    if (!user) { setProfile(null); return; }
    loadProfile(user.uid).then((p) => { if (p) setProfile(p); });
  }, [user]);

  const navigate = (pg, data = null) => {
    setPage(pg);
    if (data) setSelectedActivity(data);
  };

  const handleViewRoute = (activity) => {
    setSelectedActivity(activity);
    setPage('routeview');
  };

  // Loading state
  if (isLoading) return <Spinner />;

  // Not authenticated
  if (!user) {
    return (
      <div className="h-full relative overflow-hidden" dir="rtl">
        <Login onSignIn={signIn} loading={authLoading} error={authError} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" dir="rtl" style={{ background: '#070B14' }}>
      <main className="flex-1 overflow-hidden relative">
        {page === 'home' && (
          <Home profile={profile} userId={user.uid} onNavigate={navigate} />
        )}
        {page === 'history' && (
          <History userId={user.uid} onViewRoute={handleViewRoute} />
        )}
        {page === 'routeview' && (
          <RouteView activity={selectedActivity} onBack={() => setPage('history')} />
        )}
        {page === 'profile' && (
          <Profile
            profile={profile}
            userId={user.uid}
            onSaved={(p) => { setProfile(p); setPage('home'); }}
            onSignOut={signOut}
          />
        )}
      </main>

      {page !== 'routeview' && (
        <BottomNav page={page} onNavigate={navigate} />
      )}
    </div>
  );
}
