import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, doc, setDoc, getDoc, getDocs, collection, deleteDoc, getDocFromServer, deleteField
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  updatePassword as firebaseUpdatePassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  TeacherAccount, Question, ClassroomGroup, ActivityConfig, ActivitySessionResult, AppSettings 
} from '../types';

// 1. Initialize Primary Firebase App and Firestore Database
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

// 2. Initialize Secondary App for Admin User Creation (prevents logging out the active admin)
const secondaryApp = getApps().find(a => a.name === 'SecondaryAuth') 
  || initializeApp(firebaseConfig, 'SecondaryAuth');
const secondaryAuth = getAuth(secondaryApp);

// 3. Error Handling and Context Reporting
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('[Firestore Error]', JSON.stringify(errInfo));
  return errInfo;
}

// 4. Helper to map username or email to valid Firebase Auth email
export function formatAuthEmail(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  // Safe internal authentication domain for username-based accounts
  const sanitizedUser = trimmed.replace(/[^a-z0-9._-]/g, '_');
  return `${sanitizedUser}@we-platform.internal`;
}

// 5. Test Connection on boot
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    const testRef = doc(db, 'system', 'connection_check');
    await getDocFromServer(testRef).catch(() => null);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline');
    } else {
      console.warn('[Firebase] Connection check warning:', error);
    }
    return false;
  }
}

// ----------------------------------------------------
// Authentication Service Methods
// ----------------------------------------------------

export async function loginWithFirebaseAuth(usernameOrEmail: string, pass: string): Promise<{ success: boolean; user?: FirebaseUser; teacher?: TeacherAccount; error?: string }> {
  const cleanInput = usernameOrEmail.trim().toLowerCase();
  
  // 1. Try Firebase Auth sign-in first if available
  try {
    const email = formatAuthEmail(usernameOrEmail);
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    const code = error?.code || '';
    
    // If not found in Firebase Auth or provider disabled, check Firestore teachers directory
    try {
      const teachers = await fetchTeachersFromCloud();
      if (teachers && teachers.length > 0) {
        const matched = teachers.find(t => 
          t.username.toLowerCase() === cleanInput || 
          (t.email && t.email.toLowerCase() === cleanInput)
        );

        if (matched) {
          // Check password: match against stored password or default master admin
          const isMasterAdmin = (matched.id === 'teacher_master_default' || matched.username.toLowerCase() === 'admin' || matched.username.toLowerCase() === 'abanoub');
          const isPasswordValid = (matched.password && matched.password === pass) || (isMasterAdmin && (pass === 'Bebo@1234' || pass === matched.password));

          if (isPasswordValid) {
            // Attempt to register in Firebase Auth if provider is enabled
            try {
              const email = matched.email || formatAuthEmail(matched.username);
              const credential = await createUserWithEmailAndPassword(auth, email, pass);
              return { success: true, user: credential.user, teacher: matched };
            } catch {
              // Firebase Auth email provider not enabled or already exists; proceed with teacher record
              return { success: true, teacher: matched };
            }
          }
        }
      }
    } catch (dbErr) {
      console.warn('[Auth] Database fallback check failed:', dbErr);
    }

    let message = 'اسم المستخدم أو كلمة المرور غير صحيحة';
    if (code === 'auth/too-many-requests') {
      message = 'تم حظر المحاولات مؤقتًا لكثرة المحاولات الخاطئة، يرجى الانتظار قليلًا';
    } else if (code === 'auth/network-request-failed') {
      message = 'تعذر الاتصال بخدمة التحقق، يرجى التأكد من اتصال الإنترنت';
    }
    return { success: false, error: message };
  }
}

/**
 * Migration helper: If an existing user has a plain-text password from the legacy version,
 * register them securely into Firebase Auth on their first login, then sanitize the document.
 */
async function attemptLegacyMigration(usernameOrEmail: string, pass: string): Promise<{ success: boolean; user?: FirebaseUser }> {
  const cleanInput = usernameOrEmail.trim().toLowerCase();
  const teachers = await fetchTeachersFromCloud();
  if (!teachers || teachers.length === 0) return { success: false };

  const matched = teachers.find(t => 
    t.username.toLowerCase() === cleanInput || 
    (t.email && t.email.toLowerCase() === cleanInput)
  );

  if (matched && matched.password && matched.password === pass) {
    const email = matched.email || formatAuthEmail(matched.username);
    // Create in Firebase Auth
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    
    // Sanitize Firestore document to remove the plain text password
    try {
      const ref = doc(db, 'teachers', matched.id);
      await setDoc(ref, {
        id: matched.id,
        uid: credential.user.uid,
        username: matched.username,
        email: email,
        fullName: matched.fullName,
        subject: matched.subject,
        role: matched.role || 'teacher',
        createdAt: matched.createdAt,
        updatedAt: new Date().toISOString(),
        password: deleteField(), // Permanently remove password field
      }, { merge: true });
    } catch (e) {
      console.warn('[Migration] Sanitization warning:', e);
    }

    return { success: true, user: credential.user };
  }

  return { success: false };
}

export async function createFirebaseAuthTeacher(account: {
  username: string;
  fullName: string;
  subject: string;
  password: string;
  role?: 'admin' | 'teacher';
}): Promise<{ success: boolean; teacher?: TeacherAccount; error?: string }> {
  const email = formatAuthEmail(account.username);
  let newId = 'teacher_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  let userUid: string | undefined = undefined;

  try {
    // Use secondary Auth instance so admin stays logged in
    const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, account.password);
    userUid = userCred.user.uid;
    newId = userUid;
    await firebaseSignOut(secondaryAuth).catch(() => null);
  } catch (authErr: any) {
    console.warn('[Firebase Auth] Auth user creation warning, continuing with DB storage:', authErr?.code);
    if (authErr?.code === 'auth/email-already-in-use') {
      return { success: false, error: 'اسم المستخدم أو البريد مستخدم بالفعل من قبل معلم آخر' };
    }
  }

  const newTeacher: TeacherAccount = {
    id: newId,
    uid: userUid,
    username: account.username.trim(),
    email: email,
    password: account.password, // Stored for authentication when Firebase Auth provider is disabled
    fullName: account.fullName.trim(),
    subject: account.subject.trim(),
    role: account.role || 'teacher',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save profile to Firestore
  const syncResult = await syncTeacherToCloud(newTeacher);
  if (!syncResult.success) {
    return { success: false, error: syncResult.error || 'تعذر حفظ بيانات المعلم في السحابة' };
  }
  return { success: true, teacher: newTeacher };
}

export async function updateUserPasswordInAuth(newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!auth.currentUser) {
    return { success: false, error: 'لم يتم العثور على جلسة تسجيل دخول نشطة' };
  }
  try {
    await firebaseUpdatePassword(auth.currentUser, newPassword);
    return { success: true };
  } catch (error: any) {
    console.error('[Firebase] Failed to update password in Auth:', error);
    let message = 'تعذر تحديث كلمة المرور';
    if (error?.code === 'auth/requires-recent-login') {
      message = 'لأسباب أمنية، يرجى تسجيل الخروج والدخول مجددًا قبل تغيير كلمة المرور';
    } else if (error?.code === 'auth/weak-password') {
      message = 'كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام';
    }
    return { success: false, error: message };
  }
}

export async function requestPasswordResetEmail(emailOrUser: string): Promise<{ success: boolean; error?: string }> {
  try {
    const email = formatAuthEmail(emailOrUser);
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'تعذر إرسال بريد إعادة التعيين. تأكد من صحة البريد الإلكتروني.' };
  }
}

export async function logoutFirebaseAuth(): Promise<void> {
  await firebaseSignOut(auth).catch(() => null);
}

// ----------------------------------------------------
// Cloud Firestore Data Synchronization Methods
// ----------------------------------------------------

export async function syncTeacherToCloud(teacher: TeacherAccount): Promise<{ success: boolean; error?: string }> {
  try {
    const ref = doc(db, 'teachers', teacher.id);
    const dataToSave: any = {
      id: teacher.id,
      username: teacher.username,
      fullName: teacher.fullName,
      subject: teacher.subject,
      role: teacher.role || 'teacher',
      createdAt: teacher.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: Boolean(teacher.isDefault),
    };
    if (teacher.uid) dataToSave.uid = teacher.uid;
    if (teacher.email) dataToSave.email = teacher.email;
    // Persist password in Firestore document so login and credentials management remain functional across sessions
    if (teacher.password) {
      dataToSave.password = teacher.password;
    }

    await setDoc(ref, dataToSave, { merge: true });
    return { success: true };
  } catch (e: any) {
    console.error('[Firebase] Failed to sync teacher to cloud:', e);
    return { success: false, error: e?.message || 'فشل حفظ بيانات المعلم في السحابة' };
  }
}

export async function deleteTeacherFromCloud(teacherId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ref = doc(db, 'teachers', teacherId);
    await deleteDoc(ref);
    return { success: true };
  } catch (e: any) {
    handleFirestoreError(e, OperationType.DELETE, `teachers/${teacherId}`);
    return { success: false, error: e?.message || 'فشل حذف المعلم من السحابة' };
  }
}

export async function fetchTeachersFromCloud(): Promise<TeacherAccount[] | null> {
  try {
    const teachersCol = collection(db, 'teachers');
    const snapshot = await getDocs(teachersCol);
    if (!snapshot.empty) {
      const list: TeacherAccount[] = [];
      snapshot.forEach(d => {
        const data = d.data();
        list.push({
          id: d.id,
          username: data.username || '',
          fullName: data.fullName || '',
          subject: data.subject || '',
          role: data.role || 'teacher',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt,
          isDefault: data.isDefault || false,
          email: data.email,
          // Legacy password if present (for seamless one-time migration)
          password: data.password,
        });
      });
      return list;
    }
    return [];
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'teachers');
    return null; // Return null so callers distinguish between error vs empty list
  }
}

/**
 * Questions Bank (Isolated per Teacher)
 */
export async function syncQuestionsToCloud(
  teacherId: string, 
  questions: Question[], 
  options?: { allowEmpty?: boolean }
): Promise<{ success: boolean; error?: string }> {
  if (!teacherId) return { success: false, error: 'معرف المعلم غير محدد' };
  // Guard against accidental wipes: only allow saving empty array if explicitly allowed
  if (questions.length === 0 && !options?.allowEmpty) {
    console.warn('[Firebase] Refusing to overwrite cloud questions with unverified empty array');
    return { success: false, error: 'تم إلغاء الحفظ لمنع مسح الأسئلة بالخطأ' };
  }
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'questions');
    await setDoc(docRef, { 
      items: questions,
      updatedAt: new Date().toISOString() 
    });
    return { success: true };
  } catch (e: any) {
    handleFirestoreError(e, OperationType.WRITE, `teachers/${teacherId}/data/questions`);
    return { success: false, error: e?.message || 'فشل حفظ الأسئلة في السحابة' };
  }
}

export async function fetchQuestionsFromCloud(teacherId: string): Promise<{ data: Question[] | null; error?: string }> {
  if (!teacherId) return { data: null };
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'questions');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const d = snap.data();
      return { data: Array.isArray(d.items) ? (d.items as Question[]) : [] };
    }
    return { data: [] }; // Document does not exist yet for this teacher
  } catch (e: any) {
    handleFirestoreError(e, OperationType.GET, `teachers/${teacherId}/data/questions`);
    return { data: null, error: e?.message || 'تعذر جلب الأسئلة من السحابة' };
  }
}

/**
 * Classes & Students (Isolated per Teacher)
 */
export async function syncClassesToCloud(
  teacherId: string, 
  classes: ClassroomGroup[],
  options?: { allowEmpty?: boolean }
): Promise<{ success: boolean; error?: string }> {
  if (!teacherId) return { success: false, error: 'معرف المعلم غير محدد' };
  if (classes.length === 0 && !options?.allowEmpty) {
    console.warn('[Firebase] Refusing to overwrite cloud classes with unverified empty array');
    return { success: false, error: 'تم إلغاء الحفظ لمنع مسح الفصول بالخطأ' };
  }
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'classes');
    await setDoc(docRef, { 
      items: classes,
      updatedAt: new Date().toISOString() 
    });
    return { success: true };
  } catch (e: any) {
    handleFirestoreError(e, OperationType.WRITE, `teachers/${teacherId}/data/classes`);
    return { success: false, error: e?.message || 'فشل حفظ الفصول في السحابة' };
  }
}

export async function fetchClassesFromCloud(teacherId: string): Promise<{ data: ClassroomGroup[] | null; error?: string }> {
  if (!teacherId) return { data: null };
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'classes');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const d = snap.data();
      return { data: Array.isArray(d.items) ? (d.items as ClassroomGroup[]) : [] };
    }
    return { data: [] };
  } catch (e: any) {
    handleFirestoreError(e, OperationType.GET, `teachers/${teacherId}/data/classes`);
    return { data: null, error: e?.message || 'تعذر جلب الفصول من السحابة' };
  }
}

/**
 * Activities (Isolated per Teacher)
 */
export async function syncActivitiesToCloud(
  teacherId: string, 
  activities: ActivityConfig[],
  options?: { allowEmpty?: boolean }
): Promise<{ success: boolean; error?: string }> {
  if (!teacherId) return { success: false, error: 'معرف المعلم غير محدد' };
  if (activities.length === 0 && !options?.allowEmpty) {
    console.warn('[Firebase] Refusing to overwrite cloud activities with unverified empty array');
    return { success: false, error: 'تم إلغاء الحفظ لمنع مسح الأنشطة بالخطأ' };
  }
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'activities');
    await setDoc(docRef, { 
      items: activities,
      updatedAt: new Date().toISOString() 
    });
    return { success: true };
  } catch (e: any) {
    handleFirestoreError(e, OperationType.WRITE, `teachers/${teacherId}/data/activities`);
    return { success: false, error: e?.message || 'فشل حفظ الأنشطة في السحابة' };
  }
}

export async function fetchActivitiesFromCloud(teacherId: string): Promise<{ data: ActivityConfig[] | null; error?: string }> {
  if (!teacherId) return { data: null };
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'activities');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const d = snap.data();
      return { data: Array.isArray(d.items) ? (d.items as ActivityConfig[]) : [] };
    }
    return { data: [] };
  } catch (e: any) {
    handleFirestoreError(e, OperationType.GET, `teachers/${teacherId}/data/activities`);
    return { data: null, error: e?.message || 'تعذر جلب الأنشطة من السحابة' };
  }
}

/**
 * History (Isolated per Teacher)
 */
export async function syncHistoryToCloud(teacherId: string, history: ActivitySessionResult[]): Promise<{ success: boolean; error?: string }> {
  if (!teacherId) return { success: false, error: 'معرف المعلم غير محدد' };
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'history');
    await setDoc(docRef, { 
      items: history,
      updatedAt: new Date().toISOString() 
    });
    return { success: true };
  } catch (e: any) {
    handleFirestoreError(e, OperationType.WRITE, `teachers/${teacherId}/data/history`);
    return { success: false, error: e?.message || 'فشل حفظ السجل في السحابة' };
  }
}

export async function fetchHistoryFromCloud(teacherId: string): Promise<{ data: ActivitySessionResult[] | null; error?: string }> {
  if (!teacherId) return { data: null };
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'history');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const d = snap.data();
      return { data: Array.isArray(d.items) ? (d.items as ActivitySessionResult[]) : [] };
    }
    return { data: [] };
  } catch (e: any) {
    handleFirestoreError(e, OperationType.GET, `teachers/${teacherId}/data/history`);
    return { data: null, error: e?.message || 'تعذر جلب السجل من السحابة' };
  }
}

/**
 * App Settings (Isolated per Teacher)
 */
export async function syncSettingsToCloud(teacherId: string, settings: AppSettings): Promise<{ success: boolean; error?: string }> {
  if (!teacherId) return { success: false, error: 'معرف المعلم غير محدد' };
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'settings');
    await setDoc(docRef, { 
      ...settings,
      updatedAt: new Date().toISOString() 
    });
    return { success: true };
  } catch (e: any) {
    handleFirestoreError(e, OperationType.WRITE, `teachers/${teacherId}/data/settings`);
    return { success: false, error: e?.message || 'فشل حفظ الإعدادات في السحابة' };
  }
}

export async function fetchSettingsFromCloud(teacherId: string): Promise<{ data: AppSettings | null; error?: string }> {
  if (!teacherId) return { data: null };
  try {
    const docRef = doc(db, 'teachers', teacherId, 'data', 'settings');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { data: snap.data() as AppSettings };
    }
    return { data: null };
  } catch (e: any) {
    handleFirestoreError(e, OperationType.GET, `teachers/${teacherId}/data/settings`);
    return { data: null, error: e?.message || 'تعذر جلب الإعدادات من السحابة' };
  }
}
