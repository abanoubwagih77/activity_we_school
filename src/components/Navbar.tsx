import React, { useState } from 'react';
import { useApp, ViewMode } from '../context/AppContext';
import { 
  LayoutDashboard, Database, Gamepad2, 
  Users, History, Settings, Volume2, VolumeX, Sun, Moon, 
  Play, LogOut, UserCheck, ChevronDown, UserPlus, Check
} from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { WeLogo } from './common/WeLogo';

export const Navbar: React.FC = () => {
  const { 
    view, setView, settings, updateSettings, 
    activities, launchActivity, authUser, logout,
    teachers, switchTeacherAccount
  } = useApp();

  const [showTeacherMenu, setShowTeacherMenu] = useState(false);

  const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'activities', label: 'الأنشطة الصفية', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'question_bank', label: 'بنك الأسئلة', icon: <Database className="w-4 h-4" /> },
    { id: 'classes', label: 'الفصول والطلاب', icon: <Users className="w-4 h-4" /> },
    { id: 'history', label: 'سجل الأداء', icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: 'الإعدادات والمعلمين', icon: <Settings className="w-4 h-4" /> },
  ];

  const toggleSound = () => {
    const next = !settings.soundEnabled;
    updateSettings({ soundEnabled: next });
    soundEngine.enabled = next;
  };

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
  };

  const handleQuickLaunch = () => {
    if (activities.length > 0) {
      launchActivity(activities[0]);
    } else {
      setView('activities');
    }
  };

  const handleLogout = () => {
    soundEngine.playClick();
    setShowTeacherMenu(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md transition-colors duration-200" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Right side in RTL: WE Logo & Brand */}
        <button
          onClick={() => setView('dashboard')}
          className="flex items-center gap-2 cursor-pointer text-right group focus:outline-none"
          title="منصة وي للأنشطة الصفية"
        >
          <WeLogo size="md" showText={true} />
        </button>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          {navItems.map(item => {
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  soundEngine.playClick();
                  setView(item.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#5B2D82] text-white shadow-sm shadow-[#5B2D82]/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Left side in RTL: User, Theme, Sound, Launch, Logout */}
        <div className="flex items-center gap-2">
          {/* Quick Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
            title={settings.theme === 'dark' ? 'التحويل للوضع الفاتح' : 'التحويل للوضع الداكن'}
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Quick Audio Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
            title={settings.soundEnabled ? 'كتم المؤثرات الصوتية' : 'تشغيل المؤثرات الصوتية'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#5B2D82] dark:text-purple-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-rose-500" />
            )}
          </button>

          {/* Quick Launch CTA */}
          {activities.length > 0 && (
            <button
              onClick={handleQuickLaunch}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 cursor-pointer transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>عرض النشاط</span>
            </button>
          )}

          {/* Current Teacher & Quick Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTeacherMenu(!showTeacherMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100/80 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/60 cursor-pointer transition-all"
              title="بيانات المعلم الحالي وتبديل الحساب"
            >
              <div className="w-6 h-6 rounded-lg bg-[#5B2D82] text-white flex items-center justify-center font-bold text-xs shrink-0">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {authUser?.fullName || 'المعلم'}
                </div>
                <div className="text-[10px] font-semibold text-[#5B2D82] dark:text-purple-300">
                  {authUser?.subject ? `معلم ${authUser.subject}` : 'معلم'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showTeacherMenu && (
              <div 
                className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                dir="rtl"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <span className="text-[11px] font-bold text-slate-400 block">الحساب النشط حالياً:</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{authUser?.fullName}</p>
                    {authUser?.role === 'admin' && (
                      <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-[#5B2D82] dark:text-purple-300 font-bold px-1.5 py-0.5 rounded-md">
                        الأساسي
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#5B2D82] dark:text-purple-300 font-medium">مادة: {authUser?.subject || 'عام'}</p>
                </div>

                {/* Only Master Admin sees the list of teachers and can switch between them */}
                {authUser?.role === 'admin' && (
                  <div className="max-h-48 overflow-y-auto space-y-1 py-1">
                    <span className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      المعلمون المسجلون ({teachers.length})
                    </span>
                    {teachers.map(teacher => {
                      const isCurrent = authUser?.id === teacher.id;
                      return (
                        <button
                          key={teacher.id}
                          onClick={() => {
                            if (!isCurrent) {
                              switchTeacherAccount(teacher.id);
                            }
                            setShowTeacherMenu(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-right text-xs transition-colors cursor-pointer ${
                            isCurrent 
                              ? 'bg-purple-50 dark:bg-purple-950/50 text-[#5B2D82] dark:text-purple-300 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              isCurrent ? 'bg-[#5B2D82] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                              {teacher.fullName.slice(0, 1)}
                            </div>
                            <div className="truncate">
                              <span className="block truncate font-bold text-xs">{teacher.fullName}</span>
                              <span className="block text-[10px] text-slate-500 dark:text-slate-400">{teacher.subject}</span>
                            </div>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-[#5B2D82] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1 space-y-1">
                  {authUser?.role === 'admin' ? (
                    <button
                      onClick={() => {
                        setShowTeacherMenu(false);
                        setView('settings');
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 text-[#5B2D82]" />
                      <span>إضافة أو إدارة المعلمين</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowTeacherMenu(false);
                        setView('settings');
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-[#5B2D82]" />
                      <span>إعدادات الحساب وكلمة المرور</span>
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* High-Visibility Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-bold text-xs cursor-pointer transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav strip */}
      <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 flex items-center justify-around overflow-x-auto">
        {navItems.map(item => {
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                soundEngine.playClick();
                setView(item.id);
              }}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                isActive
                  ? 'text-[#5B2D82] dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.icon}
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="whitespace-nowrap">خروج</span>
        </button>
      </div>
    </header>
  );
};
