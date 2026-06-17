import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase/config';

export function useAuth() {
  const [user, setUser]       = useState(undefined); // undefined = loading
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return unsub;
  }, []);

  const signIn = async () => {
    if (!auth) return;
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError('התחברות נכשלה. נסה שוב.');
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (auth) await fbSignOut(auth);
    setUser(null);
  };

  return { user, signIn, signOut, error, loading, isLoading: user === undefined };
}
