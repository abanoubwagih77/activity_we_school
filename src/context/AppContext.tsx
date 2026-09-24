import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  Question, ClassroomGroup, Student, ActivityConfig, 
  ActivitySessionResult, AppSettings, AuthUser, TeacherCredentials, TeacherAccount 
} from '../types';
import { DEFAULT_SETTINGS } from '../data/defaultData';
import { soundEngine } from '../utils/audio';
import { 
  auth,
  testFirebaseConnection,
  testLiveCloudPing,
  syncTeacherToCloud,
  deleteTeacherFromCloud,
  fetchTeachersFromCloud,
  syncQuestionsToCloud,
  fetchQuestionsFromCloud,
  syncClassesToCloud,
  fetchClassesFromCloud,
  syncActivitiesToCloud,
  fetchActivitiesFromCloud,
  syncHistoryToCloud,
  fetchHistoryFromCloud,
  syncSettingsToCloud,
  fetchSettingsFromCloud,
  loginWithFirebaseAuth,
  createFirebaseAuthTeacher,
  updateUserPasswordInAuth,
  requestPasswordResetEmail,
  logoutFirebaseAuth
} from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export type ViewMode = 
  | 'dashboard'
  | 'question_bank'
  | 'activities'
  | 'classes'
  | 'history'
  | 'settings'
  | 'presentation';

interface AppContextType {
  view: ViewMode;
  setView: (view: ViewMode) => void;
  authUser: AuthUser | null;
  activeTeacher: TeacherAccount | null;
  teachers: TeacherAccount[];
  isCloudLoading: boolean;
  isCloudSaving: boolean;
  lastCloudSyncTime: Date | null;
  testCloudConnectionLive: () => Promise<{ success: boolean; latencyMs: number; error?: string }>;
  cloudSyncError: string | null;
  addTeacherAccount: (data: { fullName: string; subject: string; username: string; password: string }) => Promise<{ success: boolean; error?: string; teacher?: TeacherAccount }>;
  updateTeacherAccount: (id: string, data: Partial<TeacherAccount>) => Promise<{ success: boolean; error?: string }>;
  deleteTeacherAccount: (id: string) => Promise<{ success: boolean; error?: string }>;
  switchTeacherAccount: (teacherId: string) => boolean;
  loginWithCredentials: (username: string, password: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  requestPasswordReset: (usernameOrEmail: string) => Promise<{ success: boolean; error?: string }>;

  teacherCredentials: TeacherCredentials;
  updateTeacherCredentials: (newCreds: { username: string; password?: string; fullName?: string; subject?: string }) => Promise<boolean>;
  login: (user: AuthUser) => void;
  logout: () => void;
  questions: Question[];
  classes: ClassroomGroup[];
  activities: ActivityConfig[];
  history: ActivitySessionResult[];
  settings: AppSettings;
  activeActivity: ActivityConfig | null;

  // Backup & Recovery
  exportAllDataAsJSON: () => void;
  importDataFromJSON: (jsonStr: string) => Promise<{ success: boolean; error?: string }>;

  // Navigation & Launch
  launchActivity: (activity: ActivityConfig) => void;
  exitActivity: () => void;

  // Questions CRUD
  addQuestion: (q: Omit<Question, 'id' | 'createdAt'>) => void;
  updateQuestion: (q: Question) => void;
  deleteQuestion: (id: string) => void;
  importQuestions: (newQuestions: Omit<Question, 'id' | 'createdAt'>[]) => number;

  // Classes CRUD
  addClass: (input: string | Partial<ClassroomGroup>, description?: string) => ClassroomGroup;
  updateClass: (cls: ClassroomGroup) => void;
  deleteClass: (id: string) => void;
  addStudentToClass: (classId: string, studentName: string) => void;
  bulkAddStudents: (classId: string, studentNames: string[]) => void;
  removeStudentFromClass: (classId: string, studentId: string) => void;

  // Activities CRUD
  addActivity: (act: Omit<ActivityConfig, 'id' | 'createdAt' | 'updatedAt'>) => ActivityConfig;
  updateActivity: (act: ActivityConfig) => void;
  deleteActivity: (id: string) => void;
  duplicateActivity: (id: string) => void;

  // History
  addSessionResult: (result: Omit<ActivitySessionResult, 'id' | 'timestamp'>) => void;
  deleteHistoryItem: (id: string) => void;
  clearHistory: () => void;

  // Settings
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetAllToDefaults: () => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  AUTH: 'we_auth_active_v2',
  TEACHERS: 'we_teachers_list_v2',
};

const getTeacherDataKeys = (teacherId: string) => ({
  QUESTIONS: `we_cache_${teacherId}_questions`,
  CLASSES: `we_cache_${teacherId}_classes`,
  ACTIVITIES: `we_cache_${teacherId}_activities`,
  HISTORY: `we_cache_${teacherId}_history`,
  SETTINGS: `we_cache_${teacherId}_settings`,
});

// Non-sensitive structure without any hardcoded passwords
const DEFAULT_MASTER_TEACHER: TeacherAccount = {
  id: 'teacher_master_default',
  username: 'admin',
  fullName: 'Eng. Abanoub Wagih',
  subject: 'IT',
  role: 'admin',
  createdAt: new Date().toISOString(),
  isDefault: true,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [activeActivity, setActiveActivity] = useState<ActivityConfig | null>(null);

  // Loading and Network state
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [isCloudSaving, setIsCloudSaving] = useState(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<Date | null>(new Date());
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);
  const loadedTeacherIdRef = useRef<string | null>(null);

  const executeCloudSync = async (syncPromise: Promise<{ success: boolean; error?: string }>, errorLabel: string) => {
    setIsCloudSaving(true);
    try {
      const res = await syncPromise;
      if (!res.success) {
        setCloudSyncError(`${errorLabel}: ${res.error || 'فشل الاتصال'}`);
      } else {
        setLastCloudSyncTime(new Date());
        setCloudSyncError(null);
      }
      return res;
    } catch (e: any) {
      setCloudSyncError(`${errorLabel}: ${e?.message || 'تعذر الوصول إلى السحابة'}`);
      return { success: false, error: e?.message };
    } finally {
      setIsCloudSaving(false);
    }
  };

  const testCloudConnectionLive = async () => {
    setIsCloudSaving(true);
    try {
      const res = await testLiveCloudPing();
      if (res.success) {
        setLastCloudSyncTime(new Date());
        setCloudSyncError(null);
      } else {
        setCloudSyncError(`فشل الاتصال المباشر بالسحابة: ${res.error || ''}`);
      }
      return res;
    } finally {
      setIsCloudSaving(false);
    }
  };

  // 1. Teachers Directory State
  const [teachers, setTeachers] = useState<TeacherAccount[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TEACHERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t: TeacherAccount, index: number) => {
            const isMaster = t.isDefault || t.id === 'teacher_master_default' || index === 0;
            return {
              ...t,
              fullName: t.fullName || (isMaster ? 'Eng. Abanoub Wagih' : 'المعلم'),
              role: isMaster ? ('admin' as const) : (t.role || 'teacher'),
              isDefault: isMaster ? true : false,
            };
          });
        }
      }
    } catch (e) {
      console.error('Failed reading teachers from localStorage', e);
    }
    return [DEFAULT_MASTER_TEACHER];
  });

  // Keep safe teachers list in localStorage (strictly strip any passwords)
  useEffect(() => {
    try {
      const sanitized = teachers.map(({ password, ...t }) => t);
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(sanitized));
    } catch (e) {
      console.error(e);
    }
  }, [teachers]);

  // 2. Active Logged-in Teacher Auth State
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (savedAuth) {
        return JSON.parse(savedAuth);
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Initial cloud boot & teachers fetch
  useEffect(() => {
    testFirebaseConnection();

    fetchTeachersFromCloud().then(cloudTeachers => {
      if (cloudTeachers && cloudTeachers.length > 0) {
        setTeachers(cloudTeachers);
        // Synchronize authUser with fresh cloud profile if logged in
        setAuthUser(curr => {
          if (!curr) return null;
          const fresh = cloudTeachers.find(t => 
            t.id === curr.id || 
            (t.uid && curr.uid && t.uid === curr.uid) ||
            t.username.toLowerCase() === curr.username.toLowerCase()
          );
          if (fresh) {
            const updated: AuthUser = {
              ...curr,
              fullName: fresh.fullName || curr.fullName,
              subject: fresh.subject || curr.subject,
              username: fresh.username || curr.username,
              role: fresh.role || curr.role,
            };
            try {
              localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(updated));
            } catch (e) {
              console.error(e);
            }
            return updated;
          }
          return curr;
        });
      }
    });

    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Synchronize with teacher profile
        const cloudTeachers = await fetchTeachersFromCloud();
        let matched = cloudTeachers?.find(t => 
          t.uid === firebaseUser.uid || 
          t.id === firebaseUser.uid || 
          (t.email && t.email.toLowerCase() === firebaseUser.email?.toLowerCase())
        );

        const isMasterAdminEmail = firebaseUser.email === 'abanoub.iskander77@gmail.com';

        if (matched) {
          const userAuth: AuthUser = {
            id: matched.id,
            uid: firebaseUser.uid,
            email: firebaseUser.email || undefined,
            username: matched.username,
            fullName: matched.fullName,
            subject: matched.subject,
            role: isMasterAdminEmail ? 'admin' : (matched.role || 'teacher'),
          };
          setAuthUser(userAuth);
          try {
            localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(userAuth));
          } catch {
            // ignore
          }
        } else if (firebaseUser.email) {
          // Profile not yet in teachers list, construct one
          const fallbackUser: AuthUser = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.email.split('@')[0],
            fullName: isMasterAdminEmail ? 'Eng. Abanoub Wagih' : (firebaseUser.displayName || firebaseUser.email.split('@')[0]),
            subject: 'IT',
            role: isMasterAdminEmail ? 'admin' : 'teacher',
          };
          setAuthUser(fallbackUser);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Active Teacher Profile
  const activeTeacher: TeacherAccount | null = React.useMemo(() => {
    if (!authUser) return null;
    return teachers.find(t => 
      t.id === authUser.id || 
      (t.uid && t.uid === authUser.uid) ||
      t.username.toLowerCase() === authUser.username.toLowerCase()
    ) || null;
  }, [authUser, teachers]);

  const activeTeacherId = activeTeacher?.id || authUser?.id || null;

  // 3. Isolated Datasets for Active Teacher
  const [questions, setQuestions] = useState<Question[]>([]);
  const [classes, setClasses] = useState<ClassroomGroup[]>([]);
  const [activities, setActivities] = useState<ActivityConfig[]>([]);
  const [history, setHistory] = useState<ActivitySessionResult[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Cloud Load: ONLY load from Firestore when a teacher is actively logged in
  useEffect(() => {
    if (!authUser || !activeTeacherId) {
      setQuestions([]);
      setClasses([]);
      setActivities([]);
      setHistory([]);
      setSettings(DEFAULT_SETTINGS);
      loadedTeacherIdRef.current = null;
      return;
    }
    let isCancelled = false;
    setIsCloudLoading(true);
    setCloudSyncError(null);
    loadedTeacherIdRef.current = null;

    Promise.all([
      fetchQuestionsFromCloud(activeTeacherId),
      fetchClassesFromCloud(activeTeacherId),
      fetchActivitiesFromCloud(activeTeacherId),
      fetchHistoryFromCloud(activeTeacherId),
      fetchSettingsFromCloud(activeTeacherId),
    ]).then(([qRes, cRes, aRes, hRes, sRes]) => {
      if (isCancelled) return;

      if (qRes.error || cRes.error || aRes.error) {
        setCloudSyncError('تعذر الاتصال بالسحابة لجلب بعض البيانات، يرجى التحقق من اتصال الإنترنت.');
      } else {
        setCloudSyncError(null);
      }

      if (qRes.data !== null) {
        setQuestions(qRes.data);
      }
      if (cRes.data !== null) {
        setClasses(cRes.data);
      }
      if (aRes.data !== null) {
        setActivities(aRes.data);
      }
      if (hRes.data !== null) {
        setHistory(hRes.data);
      }
      if (sRes.data !== null) {
        setSettings(sRes.data);
      }

      loadedTeacherIdRef.current = activeTeacherId;
      setIsCloudLoading(false);
    }).catch(err => {
      if (isCancelled) return;
      console.error('[Cloud Load Error]', err);
      setCloudSyncError('حدث خطأ أثناء تحميل البيانات من الخادم السحابي.');
      setIsCloudLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [authUser, activeTeacherId]);

  // Sync settings with audio and document theme
  useEffect(() => {
    soundEngine.enabled = settings.soundEnabled;
    soundEngine.volume = settings.soundVolume;

    const root = document.documentElement;
    const body = document.body;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      if (body) {
        body.classList.add('dark');
        body.style.backgroundColor = '#0b1120';
        body.style.color = '#f8fafc';
      }
    } else {
      root.classList.remove('dark');
      root.removeAttribute('data-theme');
      if (body) {
        body.classList.remove('dark');
        body.style.backgroundColor = '#f8fafc';
        body.style.color = '#0f172a';
      }
    }
  }, [settings.theme, settings.soundEnabled, settings.soundVolume]);

  // Auth Functions
  const login = (user: AuthUser) => {
    setAuthUser(user);
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const logout = async () => {
    await logoutFirebaseAuth();
    setAuthUser(null);
    loadedTeacherIdRef.current = null;
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    } catch (e) {
      console.error(e);
    }
  };

  const loginWithCredentials = async (username: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
    const authResult = await loginWithFirebaseAuth(username, password);
    if (!authResult.success) {
      return { success: false, error: authResult.error || 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }

    const firebaseUser = authResult.user;
    const cloudTeachers = await fetchTeachersFromCloud();
    if (cloudTeachers && cloudTeachers.length > 0) {
      setTeachers(cloudTeachers);
    }

    const matched = cloudTeachers?.find(t => 
      (firebaseUser && t.uid === firebaseUser.uid) ||
      t.username.trim().toLowerCase() === username.trim().toLowerCase() ||
      (t.email && firebaseUser?.email && t.email.toLowerCase() === firebaseUser.email.toLowerCase())
    );

    const isMasterAdmin = matched?.role === 'admin' || matched?.id === 'teacher_master_default' || username.trim().toLowerCase() === 'admin';
    const authData: AuthUser = {
      id: matched?.id || firebaseUser?.uid || 'teacher_master_default',
      uid: firebaseUser?.uid,
      email: firebaseUser?.email || undefined,
      username: matched?.username || username.trim(),
      fullName: matched?.fullName || (isMasterAdmin ? 'Eng. Abanoub Wagih' : 'المعلم'),
      subject: matched?.subject || (isMasterAdmin ? 'IT' : 'عام'),
      role: isMasterAdmin ? 'admin' : (matched?.role || 'teacher'),
    };

    login(authData);
    return { success: true, user: authData };
  };

  const requestPasswordReset = async (usernameOrEmail: string): Promise<{ success: boolean; error?: string }> => {
    return await requestPasswordResetEmail(usernameOrEmail);
  };

  // Teacher Accounts Management
  const addTeacherAccount = async (data: { fullName: string; subject: string; username: string; password: string }) => {
    if (authUser?.role !== 'admin') {
      return { 
        success: false, 
        error: 'صلاحية إضافة معلمين جدد مقتصرة فقط على الحساب الإداري.' 
      };
    }

    const cleanUser = data.username.trim().toLowerCase();
    const cleanPass = data.password.trim();
    const cleanName = data.fullName.trim();
    const cleanSub = data.subject.trim();

    if (!cleanName) return { success: false, error: 'يرجى إدخال اسم المعلم' };
    if (!cleanSub) return { success: false, error: 'يرجى إدخال اسم المادة الدراسية للمعلم' };
    if (!cleanUser) return { success: false, error: 'يرجى إدخال اسم المستخدم' };
    if (!cleanPass || cleanPass.length < 6) {
      return { success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل' };
    }

    const exists = teachers.some(t => t.username.trim().toLowerCase() === cleanUser);
    if (exists) {
      return { success: false, error: 'اسم المستخدم هذا مستخدم بالفعل لمعلم آخر' };
    }

    const res = await createFirebaseAuthTeacher({
      username: cleanUser,
      fullName: cleanName,
      subject: cleanSub,
      password: cleanPass,
      role: 'teacher',
    });

    if (res.success && res.teacher) {
      setTeachers(prev => {
        const next = [...prev.filter(t => t.id !== res.teacher!.id), res.teacher!];
        try {
          const sanitized = next.map(({ password, ...t }) => t);
          localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(sanitized));
        } catch (e) {
          console.error(e);
        }
        return next;
      });
      soundEngine.playVictory();
      return { success: true, teacher: res.teacher };
    } else {
      return { success: false, error: res.error || 'تعذر إنشاء حساب المعلم في السحابة' };
    }
  };

  const updateTeacherAccount = async (id: string, data: Partial<TeacherAccount>) => {
    if (authUser?.role !== 'admin' && authUser?.id !== id) {
      return { 
        success: false, 
        error: 'غير مصرح بتعديل حسابات المعلمين الآخرين.' 
      };
    }

    const target = teachers.find(t => t.id === id);
    if (!target) return { success: false, error: 'المعلم غير موجود' };

    // Prevent privilege escalation: Regular teachers cannot grant admin role
    const safeData = { ...data };
    if (authUser?.role !== 'admin') {
      delete safeData.role;
    }

    // Attempt Firebase Auth password update if an active auth session exists
    if (safeData.password && authUser?.id === id && auth.currentUser) {
      await updateUserPasswordInAuth(safeData.password).catch(() => null);
    }

    const updatedTeacher: TeacherAccount = {
      ...target,
      ...safeData,
      username: safeData.username ? safeData.username.trim() : target.username,
      fullName: safeData.fullName ? safeData.fullName.trim() : target.fullName,
      subject: safeData.subject ? safeData.subject.trim() : target.subject,
      password: safeData.password ? safeData.password.trim() : target.password,
      updatedAt: new Date().toISOString(),
    };

    setTeachers(prev => prev.map(t => (t.id === id ? updatedTeacher : t)));
    const syncRes = await syncTeacherToCloud(updatedTeacher);
    if (!syncRes.success) {
      setCloudSyncError('فشل حفظ بيانات المعلم في السحابة: ' + (syncRes.error || ''));
      return { success: false, error: syncRes.error || 'فشل حفظ بيانات المعلم في السحابة' };
    }

    if (authUser && (authUser.id === id || authUser.username.toLowerCase() === target.username.toLowerCase())) {
      const updatedAuth: AuthUser = {
        ...authUser,
        username: updatedTeacher.username,
        fullName: updatedTeacher.fullName,
        subject: updatedTeacher.subject,
        role: updatedTeacher.role || authUser.role,
      };
      setAuthUser(updatedAuth);
      try {
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(updatedAuth));
      } catch (e) {
        console.error(e);
      }
    }

    soundEngine.playCorrect();
    return { success: true };
  };

  const deleteTeacherAccount = async (id: string) => {
    if (authUser?.role !== 'admin') {
      return { 
        success: false, 
        error: 'صلاحية حذف المعلمين مقتصرة فقط على الحساب الإداري.' 
      };
    }

    const target = teachers.find(t => t.id === id);
    if (target?.isDefault || target?.role === 'admin' || id === 'teacher_master_default') {
      return { 
        success: false, 
        error: 'لا يمكن حذف الحساب الأساسي للمنصة.' 
      };
    }

    if (teachers.length <= 1) {
      return { success: false, error: 'لا يمكن حذف الحساب، يجب أن يبقى معلم واحد على الأقل في النظام' };
    }

    await deleteTeacherFromCloud(id);
    setTeachers(prev => prev.filter(t => t.id !== id));

    if (authUser?.id === id) {
      const remaining = teachers.filter(t => t.id !== id);
      if (remaining.length > 0) {
        const next = remaining[0];
        login({
          id: next.id,
          username: next.username,
          fullName: next.fullName,
          subject: next.subject,
          role: next.role || 'teacher',
        });
      } else {
        logout();
      }
    }

    soundEngine.playClick();
    return { success: true };
  };

  const switchTeacherAccount = (teacherId: string) => {
    const target = teachers.find(t => t.id === teacherId);
    if (!target) return false;

    login({
      id: target.id,
      username: target.username,
      fullName: target.fullName,
      subject: target.subject,
      role: target.role || 'teacher',
    });
    soundEngine.playCorrect();
    return true;
  };

  const teacherCredentials: TeacherCredentials = {
    username: activeTeacher?.username || authUser?.username || 'admin',
    fullName: activeTeacher?.fullName || authUser?.fullName || 'Eng. Abanoub Wagih',
    subject: activeTeacher?.subject || authUser?.subject || 'IT',
  };

  const updateTeacherCredentials = async (newCreds: { username: string; password?: string; fullName?: string; subject?: string }) => {
    const targetId = activeTeacher?.id || authUser?.id || 'teacher_master_default';
    const res = await updateTeacherAccount(targetId, {
      username: newCreds.username,
      password: newCreds.password,
      fullName: newCreds.fullName,
      subject: newCreds.subject,
    });
    return res.success;
  };

  // Presentation & Launch
  const launchActivity = (activity: ActivityConfig) => {
    setActiveActivity(activity);
    soundEngine.playVictory();
  };

  const exitActivity = () => {
    setActiveActivity(null);
    soundEngine.playClick();
  };

  // Safe CRUD Mutations with Instant Firestore Sync
  const addQuestion = (q: Omit<Question, 'id' | 'createdAt'>) => {
    const newQuestion: Question = {
      ...q,
      id: 'q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };
    const updated = [newQuestion, ...questions];
    setQuestions(updated);
    if (activeTeacherId) {
      executeCloudSync(syncQuestionsToCloud(activeTeacherId, updated), 'فشل مزامنة إضافة السؤال في السحابة');
    }
    soundEngine.playCorrect();
  };

  const updateQuestion = (q: Question) => {
    const updated = questions.map(item => (item.id === q.id ? q : item));
    setQuestions(updated);
    if (activeTeacherId) {
      executeCloudSync(syncQuestionsToCloud(activeTeacherId, updated), 'فشل مزامنة تعديل السؤال في السحابة');
    }
    soundEngine.playClick();
  };

  const deleteQuestion = (id: string) => {
    const updated = questions.filter(item => item.id !== id);
    setQuestions(updated);
    if (activeTeacherId) {
      executeCloudSync(syncQuestionsToCloud(activeTeacherId, updated), 'فشل مزامنة حذف السؤال في السحابة');
    }
    setActivities(prev => {
      const updatedActs = prev.map(act => ({
        ...act,
        questionIds: act.questionIds.filter(qid => qid !== id),
      }));
      if (activeTeacherId) {
        executeCloudSync(syncActivitiesToCloud(activeTeacherId, updatedActs), 'فشل مزامنة تحديث الأنشطة في السحابة');
      }
      return updatedActs;
    });
    soundEngine.playClick();
  };

  const importQuestions = (newQuestions: Omit<Question, 'id' | 'createdAt'>[]) => {
    const timestamp = new Date().toISOString();
    const formatted: Question[] = newQuestions.map((q, idx) => ({
      ...q,
      id: `q-imp-${Date.now()}-${idx}`,
      createdAt: timestamp,
    }));
    const updated = [...formatted, ...questions];
    setQuestions(updated);
    if (activeTeacherId) {
      executeCloudSync(syncQuestionsToCloud(activeTeacherId, updated), 'فشل مزامنة استيراد الأسئلة في السحابة');
    }
    soundEngine.playVictory();
    return formatted.length;
  };

  // Classes CRUD
  const addClass = (input: string | Partial<ClassroomGroup>, description?: string) => {
    let newClass: ClassroomGroup;
    if (typeof input === 'string') {
      newClass = {
        id: 'cls-' + Date.now(),
        name: input.trim(),
        students: [],
        createdAt: new Date().toISOString(),
      };
      if (description?.trim()) {
        newClass.description = description.trim();
      }
    } else {
      newClass = {
        id: 'cls-' + Date.now(),
        name: (input.name || 'فصل دراسي جديد').trim(),
        students: input.students || [],
        createdAt: new Date().toISOString(),
      };
      if (input.grade?.trim()) newClass.grade = input.grade.trim();
      if (input.subject?.trim() || activeTeacher?.subject) {
        newClass.subject = (input.subject || activeTeacher?.subject || '').trim();
      }
      if (input.description?.trim()) newClass.description = input.description.trim();
    }
    const updated = [newClass, ...classes];
    setClasses(updated);
    if (activeTeacherId) {
      executeCloudSync(syncClassesToCloud(activeTeacherId, updated), 'فشل مزامنة إضافة الفصل في السحابة');
    }
    soundEngine.playClick();
    return newClass;
  };

  const updateClass = (cls: ClassroomGroup) => {
    const updated = classes.map(c => (c.id === cls.id ? cls : c));
    setClasses(updated);
    if (activeTeacherId) {
      executeCloudSync(syncClassesToCloud(activeTeacherId, updated), 'فشل مزامنة تعديل الفصل في السحابة');
    }
    soundEngine.playClick();
  };

  const deleteClass = (id: string) => {
    const updated = classes.filter(c => c.id !== id);
    setClasses(updated);
    if (activeTeacherId) {
      executeCloudSync(syncClassesToCloud(activeTeacherId, updated), 'فشل مزامنة حذف الفصل في السحابة');
    }
    setActivities(prev => {
      const updatedActs = prev.map(act => {
        if (act.classId === id) {
          const { classId, ...rest } = act;
          return rest;
        }
        return act;
      });
      if (activeTeacherId) {
        executeCloudSync(syncActivitiesToCloud(activeTeacherId, updatedActs), 'فشل مزامنة تحديث الأنشطة في السحابة');
      }
      return updatedActs;
    });
    soundEngine.playClick();
  };

  const addStudentToClass = (classId: string, studentName: string) => {
    if (!studentName.trim()) return;
    const newStudent: Student = {
      id: 'stu-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      name: studentName.trim(),
      points: 0,
      timesCalled: 0,
    };
    const updated = classes.map(c => {
      if (c.id !== classId) return c;
      return {
        ...c,
        students: [...c.students, newStudent],
      };
    });
    setClasses(updated);
    if (activeTeacherId) {
      executeCloudSync(syncClassesToCloud(activeTeacherId, updated), 'فشل مزامنة إضافة الطالب في السحابة');
    }
    soundEngine.playClick();
  };

  const bulkAddStudents = (classId: string, studentNames: string[]) => {
    const validNames = studentNames.map(n => n.trim()).filter(Boolean);
    if (validNames.length === 0) return;

    const newStudents: Student[] = validNames.map((name, idx) => ({
      id: `stu-${Date.now()}-${idx}`,
      name,
      points: 0,
      timesCalled: 0,
    }));

    const updated = classes.map(c => {
      if (c.id !== classId) return c;
      return {
        ...c,
        students: [...c.students, ...newStudents],
      };
    });
    setClasses(updated);
    if (activeTeacherId) {
      executeCloudSync(syncClassesToCloud(activeTeacherId, updated), 'فشل مزامنة إضافة الطلاب في السحابة');
    }
    soundEngine.playCorrect();
  };

  const removeStudentFromClass = (classId: string, studentId: string) => {
    const updated = classes.map(c => {
      if (c.id !== classId) return c;
      return {
        ...c,
        students: c.students.filter(s => s.id !== studentId),
      };
    });
    setClasses(updated);
    if (activeTeacherId) {
      executeCloudSync(syncClassesToCloud(activeTeacherId, updated), 'فشل مزامنة حذف الطالب في السحابة');
    }
    soundEngine.playClick();
  };

  // Activities CRUD
  const addActivity = (act: Omit<ActivityConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newActivity: ActivityConfig = {
      ...act,
      id: 'act-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newActivity, ...activities];
    setActivities(updated);
    if (activeTeacherId) {
      executeCloudSync(syncActivitiesToCloud(activeTeacherId, updated), 'فشل مزامنة إضافة النشاط في السحابة');
    }
    soundEngine.playVictory();
    return newActivity;
  };

  const updateActivity = (act: ActivityConfig) => {
    const updated = activities.map(item =>
      item.id === act.id ? { ...act, updatedAt: new Date().toISOString() } : item
    );
    setActivities(updated);
    if (activeTeacherId) {
      executeCloudSync(syncActivitiesToCloud(activeTeacherId, updated), 'فشل مزامنة تعديل النشاط في السحابة');
    }
    soundEngine.playClick();
  };

  const deleteActivity = (id: string) => {
    const updated = activities.filter(a => a.id !== id);
    setActivities(updated);
    if (activeTeacherId) {
      executeCloudSync(syncActivitiesToCloud(activeTeacherId, updated), 'فشل مزامنة حذف النشاط في السحابة');
    }
    soundEngine.playClick();
  };

  const duplicateActivity = (id: string) => {
    const target = activities.find(a => a.id === id);
    if (!target) return;
    const duplicated: ActivityConfig = {
      ...target,
      id: 'act-' + Date.now(),
      title: `${target.title} (نسخة)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...activities];
    setActivities(updated);
    if (activeTeacherId) {
      executeCloudSync(syncActivitiesToCloud(activeTeacherId, updated), 'فشل مزامنة تكرار النشاط في السحابة');
    }
    soundEngine.playClick();
  };

  // History CRUD
  const addSessionResult = (result: Omit<ActivitySessionResult, 'id' | 'timestamp'>) => {
    const newResult: ActivitySessionResult = {
      ...result,
      id: 'res-' + Date.now(),
      timestamp: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    const updated = [newResult, ...history];
    setHistory(updated);
    if (activeTeacherId) {
      executeCloudSync(syncHistoryToCloud(activeTeacherId, updated), 'فشل مزامنة السجل في السحابة');
    }
  };

  const deleteHistoryItem = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    if (activeTeacherId) {
      executeCloudSync(syncHistoryToCloud(activeTeacherId, updated), 'فشل مزامنة حذف السجل في السحابة');
    }
    soundEngine.playClick();
  };

  const clearHistory = () => {
    setHistory([]);
    if (activeTeacherId) {
      executeCloudSync(syncHistoryToCloud(activeTeacherId, []), 'فشل مزامنة مسح السجل في السحابة');
    }
    soundEngine.playClick();
  };

  // Settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (activeTeacherId) {
      executeCloudSync(syncSettingsToCloud(activeTeacherId, updated), 'فشل مزامنة الإعدادات في السحابة');
    }
  };

  const resetAllToDefaults = () => {
    if (!activeTeacherId) return;
    setQuestions([]);
    setClasses([]);
    setActivities([]);
    setHistory([]);
    setSettings(DEFAULT_SETTINGS);
    executeCloudSync(syncQuestionsToCloud(activeTeacherId, []), 'فشل تصفير الأسئلة في السحابة');
    executeCloudSync(syncClassesToCloud(activeTeacherId, []), 'فشل تصفير الفصول في السحابة');
    executeCloudSync(syncActivitiesToCloud(activeTeacherId, []), 'فشل تصفير الأنشطة في السحابة');
    executeCloudSync(syncHistoryToCloud(activeTeacherId, []), 'فشل تصفير السجل في السحابة');
    executeCloudSync(syncSettingsToCloud(activeTeacherId, DEFAULT_SETTINGS), 'فشل استعادة الإعدادات في السحابة');
    soundEngine.playClick();
  };

  // Backup & Recovery Handlers
  const exportAllDataAsJSON = () => {
    if (!activeTeacher) return;
    const backupPayload = {
      app: 'WE Interactive Platform',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      teacher: {
        id: activeTeacher.id,
        username: activeTeacher.username,
        fullName: activeTeacher.fullName,
        subject: activeTeacher.subject,
        role: activeTeacher.role,
      },
      questions,
      classes,
      activities,
      history,
      settings,
    };

    const dataBlob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `we_backup_${activeTeacher.username}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    soundEngine.playVictory();
  };

  const importDataFromJSON = async (jsonStr: string): Promise<{ success: boolean; error?: string }> => {
    if (!activeTeacherId) return { success: false, error: 'لم يتم تسجيل الدخول' };
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'الملف غير صالح أو تالف' };
      }

      if (Array.isArray(parsed.questions)) {
        setQuestions(parsed.questions);
        await syncQuestionsToCloud(activeTeacherId, parsed.questions, { allowEmpty: true });
      }
      if (Array.isArray(parsed.classes)) {
        setClasses(parsed.classes);
        await syncClassesToCloud(activeTeacherId, parsed.classes, { allowEmpty: true });
      }
      if (Array.isArray(parsed.activities)) {
        setActivities(parsed.activities);
        await syncActivitiesToCloud(activeTeacherId, parsed.activities, { allowEmpty: true });
      }
      if (Array.isArray(parsed.history)) {
        setHistory(parsed.history);
        await syncHistoryToCloud(activeTeacherId, parsed.history);
      }
      if (parsed.settings && typeof parsed.settings === 'object') {
        const newSettings = { ...DEFAULT_SETTINGS, ...parsed.settings };
        setSettings(newSettings);
        await syncSettingsToCloud(activeTeacherId, newSettings);
      }

      soundEngine.playCorrect();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: 'تعذر معالجة ملف النسخ الاحتياطي: ' + (e?.message || '') };
    }
  };

  return (
    <AppContext.Provider
      value={{
        view,
        setView,
        authUser,
        activeTeacher,
        teachers,
        isCloudLoading,
        isCloudSaving,
        lastCloudSyncTime,
        testCloudConnectionLive,
        cloudSyncError,
        addTeacherAccount,
        updateTeacherAccount,
        deleteTeacherAccount,
        switchTeacherAccount,
        loginWithCredentials,
        requestPasswordReset,
        teacherCredentials,
        updateTeacherCredentials,
        login,
        logout,
        questions,
        classes,
        activities,
        history,
        settings,
        activeActivity,
        launchActivity,
        exitActivity,
        exportAllDataAsJSON,
        importDataFromJSON,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        importQuestions,
        addClass,
        updateClass,
        deleteClass,
        addStudentToClass,
        bulkAddStudents,
        removeStudentFromClass,
        addActivity,
        updateActivity,
        deleteActivity,
        duplicateActivity,
        addSessionResult,
        deleteHistoryItem,
        clearHistory,
        updateSettings,
        resetAllToDefaults,
        resetAllData: resetAllToDefaults,
      }}
    >
      {/* Cloud Sync Warning Banner if offline or error */}
      {cloudSyncError && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <span>⚠️</span>
          <span>{cloudSyncError}</span>
          <button 
            type="button" 
            onClick={() => setCloudSyncError(null)} 
            className="ml-2 hover:opacity-75"
          >
            ✕
          </button>
        </div>
      )}
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
