import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore (using named database ID if specified in config)
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  isAnonymous: boolean;
  morningBriefingTime?: string;
  favoriteHypothesisIds?: string[];
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'process_done' | 'morning_briefing' | 'grant_alert' | 'system';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface StoredBriefing {
  id: string;
  userId: string;
  headline: string;
  summary: string;
  date: string;
  createdAt: string;
  topHypotheses?: any[];
  urgentGrants?: any[];
}

// User Profile sync
export async function syncUserProfile(user: User): Promise<UserProfile> {
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || (user.isAnonymous ? 'Guest Scholar' : user.email?.split('@')[0] || 'Researcher'),
    photoURL: user.photoURL,
    createdAt: new Date().toISOString(),
    isAnonymous: user.isAnonymous,
    morningBriefingTime: '08:00',
  };

  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      profile.createdAt = snap.data().createdAt || profile.createdAt;
      profile.morningBriefingTime = snap.data().morningBriefingTime || profile.morningBriefingTime;
    }
    await setDoc(userRef, profile, { merge: true });
  } catch (err) {
    console.warn("Could not sync user profile to Firestore (using local fallback):", err);
  }

  return profile;
}

// User Notifications helper
export async function createNotification(
  userId: string, 
  title: string, 
  message: string, 
  type: UserNotification['type'] = 'process_done', 
  link?: string
) {
  if (!userId || userId === 'guest_scholar_session' || !auth.currentUser) return;
  try {
    const colRef = collection(db, 'userNotifications');
    await addDoc(colRef, {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
      ...(link ? { link } : {})
    });
  } catch (err) {
    console.error("Error creating notification in Firestore:", err);
  }
}

// User Hypotheses storage
export async function saveUserHypothesisToDb(userId: string, hypothesis: any) {
  if (!userId || userId === 'guest_scholar_session' || !auth.currentUser) return;
  try {
    const docRef = doc(db, 'userHypotheses', hypothesis.id);
    await setDoc(docRef, {
      ...hypothesis,
      userId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("Error saving user hypothesis:", err);
  }
}

export async function deleteUserHypothesisFromDb(userId: string, hypothesisId: string) {
  if (!userId || userId === 'guest_scholar_session' || !auth.currentUser) return;
  try {
    const docRef = doc(db, 'userHypotheses', hypothesisId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error("Error deleting user hypothesis:", err);
  }
}

export async function toggleFavoriteHypothesisInDb(userId: string, hypothesisId: string, isFavorite: boolean) {
  if (!userId || userId === 'guest_scholar_session' || !auth.currentUser) return;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    let favs: string[] = snap.exists() && snap.data().favoriteHypothesisIds ? snap.data().favoriteHypothesisIds : [];
    if (isFavorite) {
      if (!favs.includes(hypothesisId)) favs.push(hypothesisId);
    } else {
      favs = favs.filter(id => id !== hypothesisId);
    }
    await setDoc(userRef, { favoriteHypothesisIds: favs }, { merge: true });
  } catch (err) {
    console.error("Error toggling favorite hypothesis:", err);
  }
}

// Morning Briefing storage
export async function saveUserBriefingToDb(userId: string, briefing: StoredBriefing) {
  if (!userId || userId === 'guest_scholar_session' || !auth.currentUser) return;
  try {
    const docRef = doc(db, 'userBriefings', briefing.id || `briefing_${Date.now()}`);
    await setDoc(docRef, {
      ...briefing,
      userId,
      createdAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("Error saving user briefing:", err);
  }
}

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  signOut, 
  onAuthStateChanged,
  updateProfile,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  doc,
  updateDoc
};
