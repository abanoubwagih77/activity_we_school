import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  Question, ClassroomGroup, Student, ActivityConfig, 
  ActivitySessionResult, AppSettings, AuthUser, TeacherCredentials, TeacherAccount 
} from '../types';
import { DEFAULT_QUESTIONS, DEFAULT_CLASSES, DEFAULT_ACTIVITIES, DEFAULT_SETTINGS } from '../data/defaultData';
import { soundEngine } from '../utils/audio';
import { 
  testFirebaseConnection,
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
} from '../services/firebase';

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
  addTeacherAccount: (data: { fullName: string; subject: string; username: string; password: string }) => { success: boolean; error?: string; teacher?: TeacherAccount };
  updateTeacherAccount: (id: string, data: Partial<TeacherAccount>) => { success: boolean; error?: string };
  deleteTeacherAccount: (id: string) => { success: boolean; error?: string };
  switchTeacherAccount: (teacherId: string) => boolean;
  loginWithCredentials: (username: string, password: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;

  teacherCredentials: TeacherCredentials;
  updateTeacherCredentials: (newCreds: { username: string; password?: string; fullName?: string; subject?: string }) => boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  questions: Question[];
  classes: ClassroomGroup[];
  activities: ActivityConfig[];
  history: ActivitySessionResult[];
  settings: AppSettings;
  activeActivity: ActivityConfig | null;

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
  AUTH: 'we_auth_active_v1',
  TEACHERS: 'we_teachers_list_v1',
  LEGACY_AUTH: 'classtech_auth_v2',
  LEGACY_CREDS: 'classtech_credentials_v2',
  LEGACY_QUESTIONS: 'classtech_questions_v2',
  LEGACY_CLASSES: 'classtech_classes_v2',
  LEGACY_ACTIVITIES: 'classtech_activities_v2',
  LEGACY_HISTORY: 'classtech_history_v2',
  LEGACY_SETTINGS: 'classtech_settings_v2',
};

const getTeacherDataKeys = (teacherId: string) => ({
  QUESTIONS: `we_teacher_${teacherId}_questions`,
  CLASSES: `we_teacher_${teacherId}_classes`,
  ACTIVITIES: `we_teacher_${teacherId}_activities`,
  HISTORY: `we_teacher_${teacherId}_history`,
  SETTINGS: `we_teacher_${teacherId}_settings`,
});

const DEFAULT_MASTER_TEACHER: TeacherAccount = {
  id: 'teacher_master_default',
  username: 'abanoub',
  password: '123',
  fullName: 'أبانوب وجيه',
  subject: 'حاسب آلي وبرمجة',
  role: 'admin',
  createdAt: new Date().toISOString(),
  isDefault: true,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [activeActivity, setActiveActivity] = useState<ActivityConfig | null>(null);

  // 1. Teachers Directory State
  const [teachers, setTeachers] = useState<TeacherAccount[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TEACHERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize: The master account is always role: 'admin', all other created teachers are role: 'teacher'
          return parsed.map((t: TeacherAccount, index: number) => {
            const isMaster = t.isDefault || t.id === 'teacher_master_default' || index === 0;
            return {
              ...t,
              fullName: isMaster && (t.fullName === 'الأستاذ المسؤول' || !t.fullName) ? 'أبانوب وجيه' : t.fullName,
              role: isMaster ? ('admin' as const) : ('teacher' as const),
              isDefault: isMaster ? true : false,
            };
          });
        }
      }
    } catch (e) {
      console.error('Failed reading teachers from localStorage', e);
    }

    // Check if legacy credentials exist to preserve existing user credentials
    let initialMaster = { ...DEFAULT_MASTER_TEACHER };
    try {
      const legacyCreds = localStorage.getItem(STORAGE_KEYS.LEGACY_CREDS);
      if (legacyCreds) {
        const parsedCreds = JSON.parse(legacyCreds);
        if (parsedCreds.username) initialMaster.username = parsedCreds.username;
        if (parsedCreds.password) initialMaster.password = parsedCreds.password;
        if (parsedCreds.fullName && parsedCreds.fullName !== 'الأستاذ المسؤول') {
          initialMaster.fullName = parsedCreds.fullName;
        } else {
          initialMaster.fullName = 'أبانوب وجيه';
        }
        if (parsedCreds.subject) initialMaster.subject = parsedCreds.subject;
      }
    } catch {
      // ignore
    }

    initialMaster.role = 'admin';
    initialMaster.isDefault = true;

    const defaultList = [initialMaster];
    try {
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(defaultList));
    } catch {
      // ignore
    }
    return defaultList;
  });

  // Keep teachers saved to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
    } catch (e) {
      console.error(e);
    }
  }, [teachers]);

  // 1. Initial Cloud Boot & Teachers Synchronization
  useEffect(() => {
    testFirebaseConnection();

    // Fetch teachers directory from cloud
    fetchTeachersFromCloud().then(cloudTeachers => {
      if (cloudTeachers && cloudTeachers.length > 0) {
        setTeachers(prev => {
          const map = new Map<string, TeacherAccount>();
          cloudTeachers.forEach(t => map.set(t.id, t));
          // Retain any newly created locally that haven't synced
          prev.forEach(t => {
            if (!map.has(t.id)) map.set(t.id, t);
          });
          const merged = Array.from(map.values()).map((t, idx) => {
            const isMaster = t.isDefault || t.id === 'teacher_master_default' || t.fullName === 'أبانوب وجيه' || idx === 0;
            return {
              ...t,
              fullName: isMaster && (t.fullName === 'الأستاذ المسؤول' || !t.fullName) ? 'أبانوب وجيه' : t.fullName,
              role: isMaster ? ('admin' as const) : ('teacher' as const),
              isDefault: isMaster,
            };
          });
          return merged;
        });
      } else {
        // First boot or empty cloud: Seed cloud with initial master teacher
        teachers.forEach(t => {
          syncTeacherToCloud(t);
        });
      }
    });
  }, []);

  // 2. Active Logged-in Teacher Auth State
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (savedAuth) {
        return JSON.parse(savedAuth);
      }
      // Check legacy auth
      const legacy = localStorage.getItem(STORAGE_KEYS.LEGACY_AUTH);
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        return {
          id: 'teacher_master_default',
          username: parsedLegacy.username || 'admin',
          fullName: parsedLegacy.fullName || 'الأستاذ المسؤول',
          subject: 'حاسب آلي وتكنولوجيا',
          role: parsedLegacy.role || 'admin',
        };
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Current active teacher account
  const activeTeacher: TeacherAccount | null = React.useMemo(() => {
    if (!authUser) return null;
    return teachers.find(t => t.id === authUser.id || t.username.toLowerCase() === authUser.username.toLowerCase()) || null;
  }, [authUser, teachers]);

  // Keep authUser synchronized with activeTeacher role and name
  useEffect(() => {
    if (activeTeacher && authUser) {
      const shouldSync = authUser.role !== activeTeacher.role || 
                         authUser.fullName !== activeTeacher.fullName || 
                         authUser.subject !== activeTeacher.subject ||
                         authUser.id !== activeTeacher.id;
      if (shouldSync) {
        const synced: AuthUser = {
          id: activeTeacher.id,
          username: activeTeacher.username,
          fullName: activeTeacher.fullName,
          subject: activeTeacher.subject,
          role: activeTeacher.role || 'teacher',
        };
        setAuthUser(synced);
        try {
          localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(synced));
        } catch {
          // ignore
        }
      }
    }
  }, [activeTeacher, authUser]);

  const activeTeacherId = activeTeacher?.id || 'teacher_master_default';
  const prevTeacherIdRef = useRef<string>(activeTeacherId);

  // Helper to load dataset for a specific teacher ID
  const loadTeacherQuestions = (tId: string): Question[] => {
    try {
      const keys = getTeacherDataKeys(tId);
      const stored = localStorage.getItem(keys.QUESTIONS);
      if (stored) return JSON.parse(stored);

      // If master teacher and no specific store yet, check legacy questions
      if (tId === 'teacher_master_default') {
        const legacy = localStorage.getItem(STORAGE_KEYS.LEGACY_QUESTIONS);
        if (legacy) return JSON.parse(legacy);
      }
    } catch {
      // ignore
    }
    return [];
  };

  const loadTeacherClasses = (tId: string): ClassroomGroup[] => {
    try {
      const keys = getTeacherDataKeys(tId);
      const stored = localStorage.getItem(keys.CLASSES);
      if (stored) return JSON.parse(stored);

      if (tId === 'teacher_master_default') {
        const legacy = localStorage.getItem(STORAGE_KEYS.LEGACY_CLASSES);
        if (legacy) return JSON.parse(legacy);
      }
    } catch {
      // ignore
    }
    return [];
  };

  const loadTeacherActivities = (tId: string): ActivityConfig[] => {
    try {
      const keys = getTeacherDataKeys(tId);
      const stored = localStorage.getItem(keys.ACTIVITIES);
      if (stored) return JSON.parse(stored);

      if (tId === 'teacher_master_default') {
        const legacy = localStorage.getItem(STORAGE_KEYS.LEGACY_ACTIVITIES);
        if (legacy) return JSON.parse(legacy);
      }
    } catch {
      // ignore
    }
    return [];
  };

  const loadTeacherHistory = (tId: string): ActivitySessionResult[] => {
    try {
      const keys = getTeacherDataKeys(tId);
      const stored = localStorage.getItem(keys.HISTORY);
      if (stored) return JSON.parse(stored);

      if (tId === 'teacher_master_default') {
        const legacy = localStorage.getItem(STORAGE_KEYS.LEGACY_HISTORY);
        if (legacy) return JSON.parse(legacy);
      }
    } catch {
      // ignore
    }
    return [];
  };

  const loadTeacherSettings = (tId: string): AppSettings => {
    try {
      const keys = getTeacherDataKeys(tId);
      const stored = localStorage.getItem(keys.SETTINGS);
      if (stored) return JSON.parse(stored);

      const legacy = localStorage.getItem(STORAGE_KEYS.LEGACY_SETTINGS);
      if (legacy) return JSON.parse(legacy);
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  };

  // 3. Isolated State per Teacher
  const [questions, setQuestions] = useState<Question[]>(() => loadTeacherQuestions(activeTeacherId));
  const [classes, setClasses] = useState<ClassroomGroup[]>(() => loadTeacherClasses(activeTeacherId));
  const [activities, setActivities] = useState<ActivityConfig[]>(() => loadTeacherActivities(activeTeacherId));
  const [history, setHistory] = useState<ActivitySessionResult[]>(() => loadTeacherHistory(activeTeacherId));
  const [settings, setSettings] = useState<AppSettings>(() => loadTeacherSettings(activeTeacherId));

  // Whenever the active teacher changes, swap to their isolated dataset!
  useEffect(() => {
    if (prevTeacherIdRef.current !== activeTeacherId) {
      // Load the new teacher's dataset from local storage immediately
      setQuestions(loadTeacherQuestions(activeTeacherId));
      setClasses(loadTeacherClasses(activeTeacherId));
      setActivities(loadTeacherActivities(activeTeacherId));
      setHistory(loadTeacherHistory(activeTeacherId));
      setSettings(loadTeacherSettings(activeTeacherId));
      prevTeacherIdRef.current = activeTeacherId;
    }
  }, [activeTeacherId]);

  // Fetch active teacher's isolated datasets from Cloud in background
  useEffect(() => {
    if (!activeTeacherId) return;
    let isCancelled = false;

    // Fetch questions from Cloud
    fetchQuestionsFromCloud(activeTeacherId).then(cloudQuestions => {
      if (isCancelled) return;
      if (cloudQuestions && cloudQuestions.length > 0) {
        setQuestions(cloudQuestions);
      } else if (questions.length > 0) {
        syncQuestionsToCloud(activeTeacherId, questions);
      }
    });

    // Fetch classes from Cloud
    fetchClassesFromCloud(activeTeacherId).then(cloudClasses => {
      if (isCancelled) return;
      if (cloudClasses && cloudClasses.length > 0) {
        setClasses(cloudClasses);
      } else if (classes.length > 0) {
        syncClassesToCloud(activeTeacherId, classes);
      }
    });

    // Fetch activities from Cloud
    fetchActivitiesFromCloud(activeTeacherId).then(cloudActivities => {
      if (isCancelled) return;
      if (cloudActivities && cloudActivities.length > 0) {
        setActivities(cloudActivities);
      } else if (activities.length > 0) {
        syncActivitiesToCloud(activeTeacherId, activities);
      }
    });

    // Fetch history from Cloud
    fetchHistoryFromCloud(activeTeacherId).then(cloudHistory => {
      if (isCancelled) return;
      if (cloudHistory && cloudHistory.length > 0) {
        setHistory(cloudHistory);
      } else if (history.length > 0) {
        syncHistoryToCloud(activeTeacherId, history);
      }
    });

    // Fetch settings from Cloud
    fetchSettingsFromCloud(activeTeacherId).then(cloudSettings => {
      if (isCancelled) return;
      if (cloudSettings) {
        setSettings(cloudSettings);
      } else {
        syncSettingsToCloud(activeTeacherId, settings);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [activeTeacherId]);

  // Persist datasets to current teacher's storage key and Cloud
  useEffect(() => {
    if (!activeTeacherId) return;
    try {
      const keys = getTeacherDataKeys(activeTeacherId);
      localStorage.setItem(keys.QUESTIONS, JSON.stringify(questions));
      syncQuestionsToCloud(activeTeacherId, questions);
    } catch (e) {
      console.error(e);
    }
  }, [questions, activeTeacherId]);

  useEffect(() => {
    if (!activeTeacherId) return;
    try {
      const keys = getTeacherDataKeys(activeTeacherId);
      localStorage.setItem(keys.CLASSES, JSON.stringify(classes));
      syncClassesToCloud(activeTeacherId, classes);
    } catch (e) {
      console.error(e);
    }
  }, [classes, activeTeacherId]);

  useEffect(() => {
    if (!activeTeacherId) return;
    try {
      const keys = getTeacherDataKeys(activeTeacherId);
      localStorage.setItem(keys.ACTIVITIES, JSON.stringify(activities));
      syncActivitiesToCloud(activeTeacherId, activities);
    } catch (e) {
      console.error(e);
    }
  }, [activities, activeTeacherId]);

  useEffect(() => {
    if (!activeTeacherId) return;
    try {
      const keys = getTeacherDataKeys(activeTeacherId);
      localStorage.setItem(keys.HISTORY, JSON.stringify(history));
      syncHistoryToCloud(activeTeacherId, history);
    } catch (e) {
      console.error(e);
    }
  }, [history, activeTeacherId]);

  useEffect(() => {
    if (!activeTeacherId) return;
    try {
      const keys = getTeacherDataKeys(activeTeacherId);
      localStorage.setItem(keys.SETTINGS, JSON.stringify(settings));
      syncSettingsToCloud(activeTeacherId, settings);
    } catch (e) {
      console.error(e);
    }
  }, [settings, activeTeacherId]);

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

  const logout = () => {
    setAuthUser(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      localStorage.removeItem(STORAGE_KEYS.LEGACY_AUTH);
    } catch (e) {
      console.error(e);
    }
  };

  const loginWithCredentials = async (username: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    let foundTeacher = teachers.find(
      t => t.username.trim().toLowerCase() === cleanUser && t.password === cleanPass
    );

    // If not found in local memory, check live Cloud Database
    if (!foundTeacher) {
      try {
        const cloudTeachers = await fetchTeachersFromCloud();
        if (cloudTeachers) {
          const match = cloudTeachers.find(
            t => t.username.trim().toLowerCase() === cleanUser && t.password === cleanPass
          );
          if (match) {
            foundTeacher = match;
            setTeachers(prev => {
              const map = new Map<string, TeacherAccount>();
              [...prev, match].forEach(t => map.set(t.id, t));
              return Array.from(map.values());
            });
          }
        }
      } catch {
        // ignore
      }
    }

    if (!foundTeacher) {
      return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }

    const authData: AuthUser = {
      id: foundTeacher.id,
      username: foundTeacher.username,
      fullName: foundTeacher.fullName,
      subject: foundTeacher.subject,
      role: foundTeacher.role || 'teacher',
    };

    login(authData);
    return { success: true, user: authData };
  };

  // Teacher Accounts Management
  const addTeacherAccount = (data: { fullName: string; subject: string; username: string; password: string }) => {
    // Only the master admin (أبانوب وجيه) is allowed to add teachers
    if (authUser?.role !== 'admin') {
      return { 
        success: false, 
        error: 'صلاحية إضافة معلمين جدد مقتصرة فقط على الحساب الأساسي للمنصة (أبانوب وجيه).' 
      };
    }

    const cleanUser = data.username.trim().toLowerCase();
    const cleanPass = data.password.trim();
    const cleanName = data.fullName.trim();
    const cleanSub = data.subject.trim();

    if (!cleanName) return { success: false, error: 'يرجى إدخال اسم المعلم' };
    if (!cleanSub) return { success: false, error: 'يرجى إدخال اسم المادة الدراسية للمعلم' };
    if (!cleanUser) return { success: false, error: 'يرجى إدخال اسم المستخدم' };
    if (!cleanPass || cleanPass.length < 3) return { success: false, error: 'كلمة المرور يجب أن تكون 3 خانات على الأقل' };

    // Check duplicate username
    const exists = teachers.some(t => t.username.trim().toLowerCase() === cleanUser);
    if (exists) {
      return { success: false, error: 'اسم المستخدم هذا مستخدم بالفعل لمعلم آخر، يرجى اختيار اسم مستخدم مختلف' };
    }

    const newTeacher: TeacherAccount = {
      id: `teacher_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: data.username.trim(),
      password: cleanPass,
      fullName: cleanName,
      subject: cleanSub,
      role: 'teacher',
      createdAt: new Date().toISOString(),
      isDefault: false,
    };

    // Initialize fresh empty storage for the new teacher
    try {
      const keys = getTeacherDataKeys(newTeacher.id);
      localStorage.setItem(keys.QUESTIONS, JSON.stringify([]));
      localStorage.setItem(keys.CLASSES, JSON.stringify([]));
      localStorage.setItem(keys.ACTIVITIES, JSON.stringify([]));
      localStorage.setItem(keys.HISTORY, JSON.stringify([]));
      localStorage.setItem(keys.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    } catch (e) {
      console.error(e);
    }

    setTeachers(prev => [...prev, newTeacher]);
    syncTeacherToCloud(newTeacher);
    soundEngine.playVictory();
    return { success: true, teacher: newTeacher };
  };

  const updateTeacherAccount = (id: string, data: Partial<TeacherAccount>) => {
    // Only master admin can edit other teachers. A regular teacher can only update their own account info.
    if (authUser?.role !== 'admin' && authUser?.id !== id) {
      return { 
        success: false, 
        error: 'غير مصرح بتعديل حسابات المعلمين الآخرين.' 
      };
    }

    const target = teachers.find(t => t.id === id);
    if (!target) return { success: false, error: 'المعلم غير موجود' };

    if (data.username) {
      const cleanUser = data.username.trim().toLowerCase();
      const conflict = teachers.some(t => t.id !== id && t.username.trim().toLowerCase() === cleanUser);
      if (conflict) {
        return { success: false, error: 'اسم المستخدم مأخوذ بالفعل لمعلم آخر' };
      }
    }

    // Regular teacher cannot change their own role to admin
    const safeData = { ...data };
    if (authUser?.role !== 'admin') {
      delete safeData.role;
    }

    const updatedTeacher: TeacherAccount = {
      ...target,
      ...safeData,
      username: safeData.username ? safeData.username.trim() : target.username,
      fullName: safeData.fullName ? safeData.fullName.trim() : target.fullName,
      subject: safeData.subject ? safeData.subject.trim() : target.subject,
      password: safeData.password ? safeData.password.trim() : target.password,
    };

    setTeachers(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        return updatedTeacher;
      })
    );

    // Save to Cloud immediately
    syncTeacherToCloud(updatedTeacher);

    // If currently logged in as this teacher, update authUser as well
    if (authUser && authUser.id === id) {
      const updatedAuth: AuthUser = {
        ...authUser,
        username: safeData.username?.trim() || authUser.username,
        fullName: safeData.fullName?.trim() || authUser.fullName,
        subject: safeData.subject?.trim() || authUser.subject,
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

  const deleteTeacherAccount = (id: string) => {
    // Only master admin can delete accounts
    if (authUser?.role !== 'admin') {
      return { 
        success: false, 
        error: 'صلاحية حذف المعلمين مقتصرة فقط على الحساب الأساسي (أبانوب وجيه).' 
      };
    }

    const target = teachers.find(t => t.id === id);
    if (target?.isDefault || target?.role === 'admin' || id === 'teacher_master_default') {
      return { 
        success: false, 
        error: 'لا يمكن حذف الحساب الأساسي للمنصة (أبانوب وجيه).' 
      };
    }

    if (teachers.length <= 1) {
      return { success: false, error: 'لا يمكن حذف الحساب، يجب أن يبقى معلم واحد على الأقل في النظام' };
    }

    // Delete teacher's isolated storage
    try {
      const keys = getTeacherDataKeys(id);
      localStorage.removeItem(keys.QUESTIONS);
      localStorage.removeItem(keys.CLASSES);
      localStorage.removeItem(keys.ACTIVITIES);
      localStorage.removeItem(keys.HISTORY);
      localStorage.removeItem(keys.SETTINGS);
    } catch {
      // ignore
    }

    // Delete from Cloud
    deleteTeacherFromCloud(id);

    setTeachers(prev => prev.filter(t => t.id !== id));

    // If deleted current active teacher, log out or switch to remaining teacher
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

  // Backwards compatibility for single teacher credentials
  const teacherCredentials: TeacherCredentials = {
    username: activeTeacher?.username || 'admin',
    password: activeTeacher?.password || 'admin123',
    fullName: activeTeacher?.fullName || 'الأستاذ المسؤول',
    subject: activeTeacher?.subject || 'حاسب آلي وتكنولوجيا',
  };

  const updateTeacherCredentials = (newCreds: { username: string; password?: string; fullName?: string; subject?: string }) => {
    if (!activeTeacher) return false;
    const res = updateTeacherAccount(activeTeacher.id, {
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

  // Questions CRUD (Stored in active teacher's isolated state)
  const addQuestion = (q: Omit<Question, 'id' | 'createdAt'>) => {
    const newQuestion: Question = {
      ...q,
      id: 'q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };
    setQuestions(prev => [newQuestion, ...prev]);
    soundEngine.playCorrect();
  };

  const updateQuestion = (q: Question) => {
    setQuestions(prev => prev.map(item => (item.id === q.id ? q : item)));
    soundEngine.playClick();
  };

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(item => item.id !== id));
    setActivities(prev =>
      prev.map(act => ({
        ...act,
        questionIds: act.questionIds.filter(qid => qid !== id),
      }))
    );
    soundEngine.playClick();
  };

  const importQuestions = (newQuestions: Omit<Question, 'id' | 'createdAt'>[]) => {
    const timestamp = new Date().toISOString();
    const formatted: Question[] = newQuestions.map((q, idx) => ({
      ...q,
      id: `q-imp-${Date.now()}-${idx}`,
      createdAt: timestamp,
    }));
    setQuestions(prev => [...formatted, ...prev]);
    soundEngine.playVictory();
    return formatted.length;
  };

  // Classes CRUD (Stored in active teacher's isolated state)
  const addClass = (input: string | Partial<ClassroomGroup>, description?: string) => {
    let newClass: ClassroomGroup;
    if (typeof input === 'string') {
      newClass = {
        id: 'cls-' + Date.now(),
        name: input,
        description,
        students: [],
        createdAt: new Date().toISOString(),
      };
    } else {
      newClass = {
        id: 'cls-' + Date.now(),
        name: input.name || 'فصل دراسي جديد',
        grade: input.grade,
        subject: input.subject || activeTeacher?.subject,
        description: input.description,
        students: input.students || [],
        createdAt: new Date().toISOString(),
      };
    }
    setClasses(prev => [newClass, ...prev]);
    soundEngine.playClick();
    return newClass;
  };

  const updateClass = (cls: ClassroomGroup) => {
    setClasses(prev => prev.map(c => (c.id === cls.id ? cls : c)));
    soundEngine.playClick();
  };

  const deleteClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    setActivities(prev =>
      prev.map(act => (act.classId === id ? { ...act, classId: undefined } : act))
    );
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
    setClasses(prev =>
      prev.map(c => {
        if (c.id !== classId) return c;
        return {
          ...c,
          students: [...c.students, newStudent],
        };
      })
    );
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

    setClasses(prev =>
      prev.map(c => {
        if (c.id !== classId) return c;
        return {
          ...c,
          students: [...c.students, ...newStudents],
        };
      })
    );
    soundEngine.playCorrect();
  };

  const removeStudentFromClass = (classId: string, studentId: string) => {
    setClasses(prev =>
      prev.map(c => {
        if (c.id !== classId) return c;
        return {
          ...c,
          students: c.students.filter(s => s.id !== studentId),
        };
      })
    );
    soundEngine.playClick();
  };

  // Activities CRUD (Stored in active teacher's isolated state)
  const addActivity = (act: Omit<ActivityConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newActivity: ActivityConfig = {
      ...act,
      id: 'act-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActivities(prev => [newActivity, ...prev]);
    soundEngine.playVictory();
    return newActivity;
  };

  const updateActivity = (act: ActivityConfig) => {
    setActivities(prev =>
      prev.map(item =>
        item.id === act.id ? { ...act, updatedAt: new Date().toISOString() } : item
      )
    );
    soundEngine.playClick();
  };

  const deleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
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
    setActivities(prev => [duplicated, ...prev]);
    soundEngine.playClick();
  };

  // History (Stored in active teacher's isolated state)
  const addSessionResult = (result: Omit<ActivitySessionResult, 'id' | 'timestamp'>) => {
    const newResult: ActivitySessionResult = {
      ...result,
      id: 'res-' + Date.now(),
      timestamp: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    setHistory(prev => [newResult, ...prev]);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
    soundEngine.playClick();
  };

  const clearHistory = () => {
    setHistory([]);
    soundEngine.playClick();
  };

  // Settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetAllToDefaults = () => {
    setQuestions([]);
    setClasses([]);
    setActivities([]);
    setHistory([]);
    setSettings(DEFAULT_SETTINGS);
    soundEngine.playClick();
  };

  return (
    <AppContext.Provider
      value={{
        view,
        setView,
        authUser,
        activeTeacher,
        teachers,
        addTeacherAccount,
        updateTeacherAccount,
        deleteTeacherAccount,
        switchTeacherAccount,
        loginWithCredentials,
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
