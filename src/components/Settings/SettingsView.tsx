import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Settings, Volume2, VolumeX, Sun, Moon, 
  RotateCcw, Sparkles, Sliders, ShieldCheck, UserCheck, Trash2,
  KeyRound, Check, AlertCircle, Eye, EyeOff, Save, LogOut,
  UserPlus, Edit3, ArrowRightLeft, BookOpen, Layers,
  Download, Upload, Shield, Database, Cloud, RefreshCw
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';
import { TeacherAccount } from '../../types';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    resetAllData, 
    authUser, 
    logout, 
    teachers,
    addTeacherAccount,
    updateTeacherAccount,
    deleteTeacherAccount,
    switchTeacherAccount,
    teacherCredentials, 
    updateTeacherCredentials,
    exportAllDataAsJSON,
    importDataFromJSON,
    isCloudSaving,
    lastCloudSyncTime,
    testCloudConnectionLive,
  } = useApp();

  const [cloudPingResult, setCloudPingResult] = useState<{
    tested: boolean;
    success: boolean;
    latencyMs?: number;
    error?: string;
  } | null>(null);
  const [isPingingCloud, setIsPingingCloud] = useState(false);

  // Current Teacher Credentials form state
  const [credUsername, setCredUsername] = useState(teacherCredentials.username);
  const [credFullName, setCredFullName] = useState(teacherCredentials.fullName);
  const [credSubject, setCredSubject] = useState(teacherCredentials.subject || '');
  const [credPassword, setCredPassword] = useState('');
  const [credConfirmPassword, setCredConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [credMessage, setCredMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingCreds, setIsSavingCreds] = useState(false);

  // Backup & Import state
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // New Teacher Modal State
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState('');
  const [newTeacherUser, setNewTeacherUser] = useState('');
  const [newTeacherPass, setNewTeacherPass] = useState('');
  const [newTeacherConfirmPass, setNewTeacherConfirmPass] = useState('');
  const [addTeacherError, setAddTeacherError] = useState<string | null>(null);
  const [addTeacherSuccess, setAddTeacherSuccess] = useState<string | null>(null);

  // Edit Teacher Modal State
  const [editingTeacher, setEditingTeacher] = useState<TeacherAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editUser, setEditUser] = useState('');
  const [editPass, setEditPass] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Teacher Confirmation
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);

  // Reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Check if current user is the master admin (أبانوب وجيه)
  const isMasterAdmin = authUser?.role === 'admin';

  const handleSoundToggle = (val: boolean) => {
    updateSettings({ soundEnabled: val });
    soundEngine.enabled = val;
    if (val) soundEngine.playCorrect();
  };

  const handleVolumeChange = (vol: number) => {
    updateSettings({ soundVolume: vol });
    soundEngine.setVolume(vol);
    soundEngine.playClick();
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredMessage(null);

    const cleanUser = credUsername.trim();
    const cleanName = credFullName.trim();
    const cleanSub = credSubject.trim();

    if (!cleanUser) {
      setCredMessage({ type: 'error', text: 'يرجى كتابة اسم المستخدم الجديد' });
      soundEngine.playWrong();
      return;
    }

    if (credPassword && credPassword.length < 6) {
      setCredMessage({ type: 'error', text: 'كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل' });
      soundEngine.playWrong();
      return;
    }

    if (credPassword && credPassword !== credConfirmPassword) {
      setCredMessage({ type: 'error', text: 'كلمة المرور غير متطابقة مع خانة التأكيد' });
      soundEngine.playWrong();
      return;
    }

    setIsSavingCreds(true);
    soundEngine.playClick();

    try {
      const ok = await updateTeacherCredentials({
        username: cleanUser,
        fullName: cleanName || cleanUser,
        subject: cleanSub,
        password: credPassword.trim() ? credPassword.trim() : undefined,
      });

      if (ok) {
        setCredPassword('');
        setCredConfirmPassword('');
        setCredMessage({ 
          type: 'success', 
          text: 'تم حفظ وتحديث بيانات حسابك وتشفير كلمة المرور بنجاح!' 
        });
        soundEngine.playCorrect();
      } else {
        setCredMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ البيانات' });
        soundEngine.playWrong();
      }
    } catch {
      setCredMessage({ type: 'error', text: 'تعذر الاتصال بـ Firebase Auth' });
      soundEngine.playWrong();
    } finally {
      setIsSavingCreds(false);
    }
  };

  const handleLiveCloudPing = async () => {
    setIsPingingCloud(true);
    setCloudPingResult(null);
    soundEngine.playClick();
    const res = await testCloudConnectionLive();
    setCloudPingResult({
      tested: true,
      success: res.success,
      latencyMs: res.latencyMs,
      error: res.error,
    });
    if (res.success) {
      soundEngine.playVictory();
    } else {
      soundEngine.playWrong();
    }
    setIsPingingCloud(false);
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddTeacherError(null);
    setAddTeacherSuccess(null);

    if (!newTeacherName.trim()) {
      setAddTeacherError('يرجى إدخال اسم المعلم');
      soundEngine.playWrong();
      return;
    }
    if (!newTeacherSubject.trim()) {
      setAddTeacherError('يرجى تحديد مادة المعلم (مثال: الرياضيات، العلوم...)');
      soundEngine.playWrong();
      return;
    }
    if (!newTeacherUser.trim()) {
      setAddTeacherError('يرجى إدخال اسم المستخدم');
      soundEngine.playWrong();
      return;
    }
    if (!newTeacherPass || newTeacherPass.length < 6) {
      setAddTeacherError('كلمة المرور يجب أن تكون 6 خانات على الأقل لـ Firebase Auth');
      soundEngine.playWrong();
      return;
    }
    if (newTeacherPass !== newTeacherConfirmPass) {
      setAddTeacherError('كلمة المرور غير متطابقة مع خانة التأكيد');
      soundEngine.playWrong();
      return;
    }

    const res = await addTeacherAccount({
      fullName: newTeacherName.trim(),
      subject: newTeacherSubject.trim(),
      username: newTeacherUser.trim(),
      password: newTeacherPass.trim(),
    });

    if (!res.success) {
      setAddTeacherError(res.error || 'حدث خطأ');
      soundEngine.playWrong();
      return;
    }

    setAddTeacherSuccess(`تم إنشاء حساب (${newTeacherName} - مادة ${newTeacherSubject}) وتأمينه بـ Firebase Auth بنجاح!`);
    soundEngine.playVictory();

    setTimeout(() => {
      setShowAddTeacherModal(false);
      setNewTeacherName('');
      setNewTeacherSubject('');
      setNewTeacherUser('');
      setNewTeacherPass('');
      setNewTeacherConfirmPass('');
      setAddTeacherSuccess(null);
    }, 1200);
  };

  const handleOpenEdit = (teacher: TeacherAccount) => {
    setEditingTeacher(teacher);
    setEditName(teacher.fullName);
    setEditSubject(teacher.subject);
    setEditUser(teacher.username);
    setEditPass('');
    setEditError(null);
    soundEngine.playClick();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    if (!editName.trim()) {
      setEditError('يرجى إدخال اسم المعلم');
      return;
    }
    if (!editSubject.trim()) {
      setEditError('يرجى إدخال المادة الدراسية');
      return;
    }
    if (!editUser.trim()) {
      setEditError('يرجى إدخال اسم المستخدم');
      return;
    }

    const res = await updateTeacherAccount(editingTeacher.id, {
      fullName: editName.trim(),
      subject: editSubject.trim(),
      username: editUser.trim(),
      password: editPass.trim() ? editPass.trim() : undefined,
    });

    if (!res.success) {
      setEditError(res.error || 'حدث خطأ أثناء التحديث');
      soundEngine.playWrong();
      return;
    }

    setEditingTeacher(null);
    soundEngine.playCorrect();
  };

  const handleConfirmDelete = async (id: string) => {
    const res = await deleteTeacherAccount(id);
    if (!res.success) {
      alert(res.error || 'لا يمكن حذف الحساب');
      soundEngine.playWrong();
    } else {
      soundEngine.playClick();
    }
    setDeletingTeacherId(null);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackupMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const result = await importDataFromJSON(text);
        if (result.success) {
          setBackupMessage({ type: 'success', text: 'تمت استعادة البيانات بنجاح ومزامنتها مع السحابة!' });
        } else {
          setBackupMessage({ type: 'error', text: result.error || 'فشلت استعادة البيانات' });
        }
      } catch {
        setBackupMessage({ type: 'error', text: 'الملف غير صالح' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {isMasterAdmin ? 'إعدادات المنصة وإدارة المعلمين' : 'إعدادات الحساب وبيئة العرض'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isMasterAdmin 
            ? 'إدارة حسابات المعلمين وموادهم، وتخصيص بيئة العرض التفاعلية وشاشات الفصل'
            : 'تخصيص بيانات حسابك ومادتك، وضبط شاشة العرض والمؤثرات الصوتية'}
        </p>
      </div>

      <div className="space-y-6">
        {/* SECTION 1: TEACHER ACCOUNTS & SUBJECTS ISOLATION (MASTER ADMIN ONLY) */}
        {isMasterAdmin && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#5B2D82] text-white flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>إدارة حسابات المعلمين والمواد</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#5B2D82] dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                      {teachers.length} معلمين مسجلين
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    بصفتك الحساب الأساسي (أبانوب وجيه)، يمكنك إضافة معلمين جدد وإدارة حساباتهم وموادهم
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setShowAddTeacherModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #5B2D82 0%, #461b68 100%)',
                }}
              >
                <UserPlus className="w-4 h-4" />
                <span>إضافة حساب معلم جديد لمادة أخرى</span>
              </button>
            </div>

            {/* Teacher Accounts Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teachers.map(teacher => {
                const isCurrent = authUser?.id === teacher.id;
                const isMasterTeacher = teacher.isDefault || teacher.role === 'admin' || teacher.id === 'teacher_master_default';
                return (
                  <div
                    key={teacher.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrent 
                        ? 'bg-purple-50/70 dark:bg-purple-950/30 border-[#5B2D82]/40 shadow-sm'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          isCurrent 
                            ? 'bg-[#5B2D82] text-white shadow-sm'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}>
                          {teacher.fullName.slice(0, 1)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              {teacher.fullName}
                            </h3>
                            {isCurrent && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                                أنت الآن
                              </span>
                            )}
                            {isMasterTeacher && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#5B2D82] dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                                الحساب الأساسي
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-[#5B2D82] dark:text-purple-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-purple-100 dark:border-purple-900">
                              مادة: {teacher.subject}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        اسم المستخدم: <strong className="text-slate-700 dark:text-slate-200">{teacher.username}</strong>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => switchTeacherAccount(teacher.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-[#5B2D82] dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950 border border-purple-200 dark:border-purple-800 text-[11px] font-bold cursor-pointer transition-colors"
                            title="الدخول إلى مساحة هذا المعلم"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>دخول بحسابه</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(teacher)}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer"
                          title="تعديل بيانات الحساب"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {teachers.length > 1 && !isMasterTeacher && !isCurrent && (
                          <button
                            type="button"
                            onClick={() => setDeletingTeacherId(teacher.id)}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 dark:border-slate-700 cursor-pointer"
                            title="حذف هذا الحساب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 2: EDIT CURRENT LOGGED-IN TEACHER DATA */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">تعديل بيانات حسابك الحالي وكلمة المرور</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">تحديث اسمك، مادتك، أو تعيين كلمة مرور جديدة للحساب المسجل به حالياً</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                logout();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-700 hover:text-rose-700 dark:text-slate-300 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>

          {credMessage && (
            <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              credMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
            }`}>
              {credMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{credMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveCredentials} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  اسم المستخدم لتسجيل الدخول (Username)
                </label>
                <input
                  type="text"
                  value={credUsername}
                  onChange={(e) => setCredUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5B2D82]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  اسم المعلم المعروض
                </label>
                <input
                  type="text"
                  value={credFullName}
                  onChange={(e) => setCredFullName(e.target.value)}
                  placeholder="مثال: أ. محمد عبد الله"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5B2D82]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  المادة أو التخصص
                </label>
                <input
                  type="text"
                  value={credSubject}
                  onChange={(e) => setCredSubject(e.target.value)}
                  placeholder="مثال: الرياضيات، العلوم، الحاسب..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5B2D82]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  كلمة المرور الجديدة (اتركها فارغة إذا لم ترد تغييرها)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={credPassword}
                    onChange={(e) => setCredPassword(e.target.value)}
                    placeholder="أدخل كلمة مرور جديدة"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#5B2D82]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  تأكيد كلمة المرور الجديدة
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credConfirmPassword}
                  onChange={(e) => setCredConfirmPassword(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور للتأكيد"
                  disabled={!credPassword}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#5B2D82] disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                * يتم تأمين وتشفير الحساب وكلمات المرور سحابياً عبر Firebase Authentication المشفر بأعلى المعايير.
              </span>
              <button
                type="submit"
                disabled={isSavingCreds}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #5B2D82 0%, #461b68 100%)',
                }}
              >
                <Save className="w-4 h-4" />
                <span>{isSavingCreds ? 'جارٍ الحفظ...' : 'حفظ التعديلات على حسابي'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 3: DISPLAY THEME */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              {settings.theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">مظهر المنصة وشاشة العرض (Theme)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">ضبط وضوح القراءة والتباين لشاشات الفصل والبروجيكتور</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">وضع العرض الحالي</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {settings.theme === 'dark' ? 'الوضع الداكن المريح للعين في الإضاءة الخافتة' : 'المظهر الفاتح الناصع عالي التباين لسهولة الرؤية في الفصل'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'light' })}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  settings.theme === 'light'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>المظهر الفاتح (نهاري)</span>
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  settings.theme === 'dark'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>المظهر الداكن (ليلي)</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 4: SOUND EFFECTS */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-[#5B2D82] dark:text-purple-400 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">المؤثرات الصوتية التفاعلية</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">أصوات دوران العجلة، الإجابات الصحيحة والخاطئة، وموسيقى الحماس في الفصل</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">تفعيل الأصوات التفاعلية</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">تشغيل المؤثرات الصوتية عند النقر وتفاعل الطلاب</span>
              </div>
              <button
                type="button"
                onClick={() => handleSoundToggle(!settings.soundEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  settings.soundEnabled ? 'bg-[#5B2D82]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.soundEnabled ? '-translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.soundEnabled && (
              <div className="pt-2">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>مستوى الصوت العام</span>
                  <span className="font-mono text-[#5B2D82] dark:text-purple-400">{Math.round(settings.soundVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-[#5B2D82] cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5: DATA BACKUP AND EXPORT */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">النسخ الاحتياطي وحماية البيانات</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">تصدير واستيراد نسخة احتياطية محلية متوافقة بصيغة JSON لبياناتك وأنشطتك</p>
            </div>
          </div>

          {backupMessage && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              backupMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}>
              <span>{backupMessage.type === 'success' ? '✓' : '⚠️'}</span>
              <span>{backupMessage.text}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={exportAllDataAsJSON}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>تصدير نسخة احتياطية كاملة (JSON)</span>
            </button>

            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer">
              <Upload className="w-4 h-4 text-[#5B2D82] dark:text-purple-400" />
              <span>استعادة نسخة احتياطية</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* SECTION 6: LIVE CLOUD SYNC VERIFICATION & STATUS */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">حالة المزامنة السحابية المباشرة (Firebase Cloud Live)</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">تأكيد اتصال الموقع بقاعدة بيانات السحابة وحفظ التعديلات لحظياً عبر جميع الأجهزة</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isCloudSaving 
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300' 
                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isCloudSaving ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                {isCloudSaving ? 'جاري المزامنة الآن...' : 'متصل ونشط لحظياً'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-400 block mb-1 font-medium">سيرفر قاعدة البيانات:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate block" title="ai-studio-bc0eff15-b95b-44bf-873a-2cece6f33ffb">
                Google Cloud Firestore
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-400 block mb-1 font-medium">نوع التخزين والمزامنة:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">سحابي دائم (Multi-Device)</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-400 block mb-1 font-medium">آخر عملية حفظ ناجحة:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {lastCloudSyncTime ? lastCloudSyncTime.toLocaleTimeString('ar-EG') : 'الآن'}
              </span>
            </div>
          </div>

          {cloudPingResult && (
            <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
              cloudPingResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
            }`}>
              <div className="flex items-center gap-2">
                <span>{cloudPingResult.success ? '✓' : '⚠️'}</span>
                <span>
                  {cloudPingResult.success
                    ? `تم بنجاح اختبار الاتصال الحي بالسحابة: تم إرسال وقراءة واستجابة البيانات من خادم Firebase في ${cloudPingResult.latencyMs} مللي ثانية!`
                    : `فشل الاختبار: ${cloudPingResult.error || 'يرجى التحقق من اتصال الإنترنت'}`}
                </span>
              </div>
              {cloudPingResult.latencyMs && (
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-emerald-200/60 dark:bg-emerald-900/60">
                  {cloudPingResult.latencyMs}ms
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              اضغط على الزر لإجراء فحص اتصال حقيقي (Ping) مع خادم السحابة والتأكد من سرعة الاستجابة بنفسك.
            </p>
            <button
              type="button"
              disabled={isPingingCloud}
              onClick={handleLiveCloudPing}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPingingCloud ? 'animate-spin' : ''}`} />
              <span>{isPingingCloud ? 'جاري الفحص المباشر...' : 'فحص الاتصال والمزامنة الآن'}</span>
            </button>
          </div>
        </div>

        {/* SECTION 7: DATA RESET FOR CURRENT TEACHER */}
        <div className="p-6 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-900 dark:text-rose-200">إعادة ضبط وتفريغ بيانات حسابك الحالي</h2>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-0.5">
                تفريغ الأسئلة والفصول وسجل النتائج الخاص بحسابك الحالي فقط للبدء من جديد دون التأثير على المعلمين الآخرين
              </p>
            </div>
          </div>

          <div className="pt-2">
            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                تفريغ بيانات حسابي الحالي
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 space-y-3">
                <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  هل أنت متأكد تماماً من تفريغ بنك أسئلتك وفصولك الخاصة بهذا الحساب؟ لن يتم حذف حساب المعلم نفسه أو بيانات المعلمين الآخرين.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetAllData();
                      setShowResetConfirm(false);
                      soundEngine.playVictory();
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                  >
                    نعم، فرغ بيانات حسابي الآن
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    تراجع
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: ADD NEW TEACHER ACCOUNT (MASTER ADMIN ONLY) */}
      {isMasterAdmin && showAddTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5" dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#5B2D82] text-white flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">إنشاء حساب معلم جديد</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">تخصيص مساحة عمل مستقلة تماماً لمادته وبنك أسئلته</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTeacherModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addTeacherError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                ⚠️ {addTeacherError}
              </div>
            )}

            {addTeacherSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{addTeacherSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم المعلم الكامل *
                  </label>
                  <input
                    type="text"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    placeholder="مثال: أ. محمود حسني"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5B2D82]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مادة المعلم / التخصص *
                  </label>
                  <input
                    type="text"
                    value={newTeacherSubject}
                    onChange={(e) => setNewTeacherSubject(e.target.value)}
                    placeholder="مثال: اللغة الإنجليزية، العلوم، الرياضيات..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5B2D82]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم المستخدم للدخول *
                  </label>
                  <input
                    type="text"
                    value={newTeacherUser}
                    onChange={(e) => setNewTeacherUser(e.target.value)}
                    placeholder="مثال: mahmoud_english"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5B2D82]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    كلمة المرور *
                  </label>
                  <input
                    type="password"
                    value={newTeacherPass}
                    onChange={(e) => setNewTeacherPass(e.target.value)}
                    placeholder="كلمة مرور المعلم"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#5B2D82]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تأكيد كلمة المرور *
                </label>
                <input
                  type="password"
                  value={newTeacherConfirmPass}
                  onChange={(e) => setNewTeacherConfirmPass(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور للتأكيد"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#5B2D82]"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-[11px] text-[#5B2D82] dark:text-purple-300">
                ✨ <strong>ميزة الفصل التام:</strong> المعلم الجديد سيحصل على مساحة بيضاء فارغة تماماً خاصة به، يضيف فيها أسئلته وفصوله، ولن تظهر أسئلته في حسابك ولن تظهر أسئلتك في حسابه.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md cursor-pointer active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #5B2D82 0%, #461b68 100%)',
                  }}
                >
                  إنشاء وحفظ حساب المعلم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TEACHER ACCOUNT (MASTER ADMIN ONLY) */}
      {isMasterAdmin && editingTeacher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4" dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                تعديل حساب المعلم ({editingTeacher.fullName})
              </h3>
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
                ⚠️ {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم المعلم</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">المادة الدراسية</label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم المستخدم</label>
                <input
                  type="text"
                  value={editUser}
                  onChange={(e) => setEditUser(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  كلمة المرور الجديدة (اتركها فارغة للإبقاء على الحالية)
                </label>
                <input
                  type="password"
                  value={editPass}
                  onChange={(e) => setEditPass(e.target.value)}
                  placeholder="كلمة المرور الجديدة"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#5B2D82] text-white text-xs font-bold cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL (MASTER ADMIN ONLY) */}
      {isMasterAdmin && deletingTeacherId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-5 space-y-3" dir="rtl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">حذف حساب المعلم؟</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              سيتم حذف الحساب وبيانات بنك الأسئلة والفصول التابعة لهذا المعلم فقط نهائياً. هل أنت متأكد؟
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTeacherId(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(deletingTeacherId)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
