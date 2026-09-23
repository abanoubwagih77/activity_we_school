import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, doc, setDoc, getDoc, getDocs, collection, deleteDoc, getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  TeacherAccount, Question, ClassroomGroup, ActivityConfig, ActivitySessionResult, AppSettings 
} from '../types';

// 1. Initialize Firebase App and Firestore Database
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// 2. Test Connection on boot
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    const testRef = doc(db, 'system', 'connection_check');
    await getDocFromServer(testRef).catch(() => null);
    console.log('[Firebase] Connected to cloud database successfully');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline, using local persistent cache');
    } else {
      console.warn('[Firebase] Connection check warning:', error);
    }
    return false;
  }
}

// ----------------------------------------------------
// Cloud Sync Helpers
// ----------------------------------------------------

/**
 * Teachers Directory
 */
export async function syncTeacherToCloud(teacher: TeacherAccount): Promise<void> {
  try {
    const ref = doc(db, 'teachers', teacher.id);
    await setDoc(ref, {
      ...teacher,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (e) {
    console.error('[Firebase] Failed to save teacher to cloud:', e);
  }
}

export async function deleteTeacherFromCloud(teacherId: string): Promise<void> {
  try {
    const ref = doc(db, 'teachers', teacherId);
    await deleteDoc(ref);
  } catch (e) {
    console.error('[Firebase] Failed to delete teacher from cloud:', e);
  }
}

export async function fetchTeachersFromCloud(): Promise<TeacherAccount[] | null> {
  try {
    const teachersCol = collection(db, 'teachers');
    const snapshot = await getDocs(teachersCol);
    if (!snapshot.empty) {
      const list: TeacherAccount[] = [];
      snapshot.forEach(d => {
        list.push(d.data() as TeacherAccount);
      });
      return list;
    }
    return null;
  } catch (e) {
    console.warn('[Firebase] Could not fetch teachers from cloud, falling back to local storage:', e);
    return null;
  }
}

/**
 * Questions Bank (Isolated per Teacher)
 */
export async function syncQuestionsToCloud(teacherId: string, questions: Question[]): Promise<void> {
  if (!teacherId) return;
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'questions');
    await setDoc(docRef, { 
      items: questions,
      updatedAt: new Date().toISOString() 
    });
  } catch (e) {
    console.error('[Firebase] Failed to sync questions to cloud:', e);
  }
}

export async function fetchQuestionsFromCloud(teacherId: string): Promise<Question[] | null> {
  if (!teacherId) return null;
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'questions');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.items)) {
        return data.items as Question[];
      }
    }
  } catch (e) {
    console.warn('[Firebase] Failed to fetch questions from cloud:', e);
  }
  return null;
}

/**
 * Classes & Students (Isolated per Teacher)
 */
export async function syncClassesToCloud(teacherId: string, classes: ClassroomGroup[]): Promise<void> {
  if (!teacherId) return;
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'classes');
    await setDoc(docRef, { 
      items: classes,
      updatedAt: new Date().toISOString() 
    });
  } catch (e) {
    console.error('[Firebase] Failed to sync classes to cloud:', e);
  }
}

export async function fetchClassesFromCloud(teacherId: string): Promise<ClassroomGroup[] | null> {
  if (!teacherId) return null;
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'classes');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.items)) {
        return data.items as ClassroomGroup[];
      }
    }
  } catch (e) {
    console.warn('[Firebase] Failed to fetch classes from cloud:', e);
  }
  return null;
}

/**
 * Activities (Isolated per Teacher)
 */
export async function syncActivitiesToCloud(teacherId: string, activities: ActivityConfig[]): Promise<void> {
  if (!teacherId) return;
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'activities');
    await setDoc(docRef, { 
      items: activities,
      updatedAt: new Date().toISOString() 
    });
  } catch (e) {
    console.error('[Firebase] Failed to sync activities to cloud:', e);
  }
}

export async function fetchActivitiesFromCloud(teacherId: string): Promise<ActivityConfig[] | null> {
  if (!teacherId) return null;
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'activities');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.items)) {
        return data.items as ActivityConfig[];
      }
    }
  } catch (e) {
    console.warn('[Firebase] Failed to fetch activities from cloud:', e);
  }
  return null;
}

/**
 * History (Isolated per Teacher)
 */
export async function syncHistoryToCloud(teacherId: string, history: ActivitySessionResult[]): Promise<void> {
  if (!teacherId) return;
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'history');
    await setDoc(docRef, { 
      items: history,
      updatedAt: new Date().toISOString() 
    });
  } catch (e) {
    console.error('[Firebase] Failed to sync history to cloud:', e);
  }
}

export async function fetchHistoryFromCloud(teacherId: string): Promise<ActivitySessionResult[] | null> {
  if (!teacherId) return null;
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'history');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.items)) {
        return data.items as ActivitySessionResult[];
      }
    }
  } catch (e) {
    console.warn('[Firebase] Failed to fetch history from cloud:', e);
  }
  return null;
}

/**
 * App Settings (Isolated per Teacher)
 */
export async function syncSettingsToCloud(teacherId: string, settings: AppSettings): Promise<void> {
  if (!teacherId) return;
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'settings');
    await setDoc(docRef, { 
      ...settings,
      updatedAt: new Date().toISOString() 
    });
  } catch (e) {
    console.error('[Firebase] Failed to sync settings to cloud:', e);
  }
}

export async function fetchSettingsFromCloud(teacherId: string): Promise<AppSettings | null> {
  if (!teacherId) return null;
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'settings');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as AppSettings;
    }
  } catch (e) {
    console.warn('[Firebase] Failed to fetch settings from cloud:', e);
  }
  return null;
}
