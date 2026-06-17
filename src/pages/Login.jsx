export default function Login({ onSignIn, loading, error }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-grad-app px-6 page-enter">

      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-primary opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-40 h-40 rounded-full bg-accent opacity-10 blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="relative mb-8 text-center">
        <div className="text-7xl mb-4 drop-shadow-lg">🚶</div>
        <h1 className="text-4xl font-black text-text-1 tracking-tight">
          Walk<span className="text-primary">Track</span>
        </h1>
        <p className="text-text-2 mt-2 text-base">עקוב אחר ההליכות שלך</p>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {['📍 GPS מדויק', '🔥 קלוריות', '🗺️ מפה חיה', '📊 היסטוריה'].map((f) => (
          <span
            key={f}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-text-2 dark-card"
          >
            {f}
          </span>
        ))}
      </div>

      {/* Sign-in */}
      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={onSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white rounded-2xl py-4 font-semibold text-gray-800 text-base shadow-card active:scale-95 transition-transform"
          style={{ minHeight: 56 }}
        >
          {loading ? (
            <svg className="w-5 h-5 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <GoogleIcon />
          )}
          {loading ? 'מתחבר...' : 'כניסה עם Google'}
        </button>

        {error && (
          <p className="text-center text-danger text-sm animate-fade-up">{error}</p>
        )}

        <p className="text-center text-text-3 text-xs leading-relaxed">
          ההיסטוריה והפרופיל שלך נשמרים בנפרד לכל משתמש
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.4 30.3 0 24 0 14.7 0 6.7 5.5 2.7 13.5l7.8 6C12.4 13.4 17.8 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
      <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 019.5 24c0-1.6.3-3.1.8-4.6l-7.8-6A23.9 23.9 0 000 24c0 3.9.9 7.5 2.5 10.8l8-6.2z"/>
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.2 1.5-5 2.3-8.4 2.3-6.2 0-11.5-4.2-13.4-9.8l-8 6.2C6.7 42.5 14.7 48 24 48z"/>
    </svg>
  );
}
