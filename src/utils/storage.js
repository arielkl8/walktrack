import {
  doc, getDoc, setDoc,
  collection, addDoc, getDocs, deleteDoc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';

// ── helpers ───────────────────────────────────────────────────────────────────

const profileKey  = (uid) => `wt_${uid}_profile`;
const activitiesKey = (uid) => `wt_${uid}_activities`;

const lsGet  = (key)        => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
const lsSet  = (key, val)   => localStorage.setItem(key, JSON.stringify(val));

// ── Profile ───────────────────────────────────────────────────────────────────

export async function saveProfile(profile, userId) {
  const uid = userId ?? 'local';
  const data = { ...profile, updatedAt: new Date().toISOString() };
  lsSet(profileKey(uid), data);

  if (isFirebaseConfigured && db && userId) {
    await setDoc(doc(db, 'users', userId), {
      ...profile,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
}

export async function loadProfile(userId) {
  const uid = userId ?? 'local';

  if (isFirebaseConfigured && db && userId) {
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        const data = snap.data();
        lsSet(profileKey(uid), data);
        return data;
      }
    } catch (e) {
      console.warn('Firestore profile load failed, using localStorage');
    }
  }
  return lsGet(profileKey(uid));
}

// ── Activities ────────────────────────────────────────────────────────────────

export async function saveActivity(activity, userId) {
  const uid = userId ?? 'local';

  if (isFirebaseConfigured && db && userId) {
    const ref = collection(db, 'users', userId, 'activities');
    const docRef = await addDoc(ref, {
      ...activity,
      startTime: new Date(activity.startTime),
      endTime:   new Date(activity.endTime),
    });
    return docRef.id;
  }

  const list = lsGet(activitiesKey(uid)) ?? [];
  const id = `local_${Date.now()}`;
  list.unshift({ ...activity, id });
  lsSet(activitiesKey(uid), list);
  return id;
}

export async function loadActivities(userId) {
  const uid = userId ?? 'local';

  if (isFirebaseConfigured && db && userId) {
    try {
      const q = query(
        collection(db, 'users', userId, 'activities'),
        orderBy('startTime', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          startTime: data.startTime?.toDate?.()?.toISOString?.() ?? data.startTime,
          endTime:   data.endTime?.toDate?.()?.toISOString?.()   ?? data.endTime,
        };
      });
    } catch (e) {
      console.warn('Firestore activities load failed');
    }
  }
  return lsGet(activitiesKey(uid)) ?? [];
}

export async function deleteActivity(id, userId) {
  const uid = userId ?? 'local';

  if (isFirebaseConfigured && db && userId) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'activities', id));
      return;
    } catch (e) {
      console.warn('Firestore delete failed');
    }
  }
  const list = lsGet(activitiesKey(uid)) ?? [];
  lsSet(activitiesKey(uid), list.filter((a) => a.id !== id));
}
