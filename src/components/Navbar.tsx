import React, { useState, useEffect, useRef } from 'react';
import { useApp, ViewMode } from '../context/AppContext';
import { 
  LayoutDashboard, Database, Gamepad2, 
  Users, History, Settings, Volume2, VolumeX, Sun, Moon, 
  Play, LogOut, UserCheck, ChevronDown, UserPlus, Check,
  Menu, X, ChevronLeft
} from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { WeLogo } from './common/WeLogo';

export const Navbar: React.FC = () => {
  const { 
    view, setView, settings, updateSettings, 
    activities, launchActivity, authUser, logout,
    teachers, switchTeacherAccount,
    isCloudSaving, lastCloudSyncTime
  } = useApp();

  const [showTeacherMenu, setShowTeacherMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setShowTeacherMenu(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { id: ViewMode; label: string; fullLabel?: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'الرئيسية', fullLabel: 'الصفحة الرئيسية', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'activities', label: 'الأنشطة', fullLabel: 'الأنشطة والمسابقات الصفية', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'question_bank', label: 'بنك الأسئلة', fullLabel: 'بنك الأسئلة الشامل', icon: <Database className="w-4 h-4" /> },
    { id: 'classes', label: 'الفصول', fullLabel: 'الفصول والطلاب', icon: <Users className="w-4 h-4" /> },
    { id: 'history', label: 'السجل', fullLabel: 'سجل الأداء والتقارير', icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: 'الإعدادات', fullLabel: 'إعدادات المنصة والمعلمين', icon: <Settings className="w-4 h-4" /> },
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
    setIsMobileMenuOpen(false);
    logout();
  };

  const handleNavClick = (itemId: ViewMode) => {
    soundEngine.playClick();
    setView(itemId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header 
      ref={navRef}
      className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 shadow-xs backdrop-blur-md transition-colors duration-200" 
      dir="rtl"
    >
      {/* Main Top Bar: Perfectly centered 3-column layout */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Right Column (in RTL): WE Brand Logo */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2 cursor-pointer text-right group focus:outline-none shrink-0"
            title="منصة وي للأنشطة الصفية"
          >
            <WeLogo size="md" showText={true} />
          </button>
        </div>

        {/* Center Column: Navigation Links (Desktop only, 1280px+) - Shifted comfortably towards the right */}
        <div className="hidden xl:flex items-center justify-center shrink-0 ml-6 2xl:ml-10">
          <nav className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            {navItems.map(item => {
              const isActive = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#5B2D82] text-white shadow-xs font-bold'
                      : 'font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  {item.icon}
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Left Column (in RTL): User, Quick Actions & Mobile Toggle */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 cursor-pointer transition-all flex items-center justify-center shrink-0"
            title={settings.theme === 'dark' ? 'التحويل للوضع الفاتح' : 'التحويل للوضع الداكن'}
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Quick Audio Toggle - hidden on mobile to prevent crowding */}
          <button
            onClick={toggleSound}
            className="hidden md:flex w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 cursor-pointer transition-all items-center justify-center shrink-0"
            title={settings.soundEnabled ? 'كتم المؤثرات الصوتية' : 'تشغيل المؤثرات الصوتية'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#5B2D82] dark:text-purple-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-rose-500" />
            )}
          </button>

          {/* Current Teacher & Quick Switcher Dropdown */}
          <div className="relative shrink-0 flex items-center">
            <button
              onClick={() => setShowTeacherMenu(!showTeacherMenu)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 h-9 rounded-xl bg-purple-50 hover:bg-purple-100/80 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/60 cursor-pointer transition-all shrink-0"
              title="بيانات المعلم الحالي وتبديل الحساب"
            >
              <div className="w-6 h-6 rounded-lg bg-[#5B2D82] text-white flex items-center justify-center font-bold text-xs shrink-0 relative">
                <UserCheck className="w-3.5 h-3.5" />
                <span 
                  className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                    isCloudSaving ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'
                  }`} 
                  title={isCloudSaving ? 'جاري المزامنة مع السحابة...' : 'سحابة Google Firebase متصلة ومحدثة'}
                />
              </div>
              <div className="text-right hidden sm:block max-w-[85px] md:max-w-[120px] truncate">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {authUser?.fullName || 'المعلم'}
                </div>
                <div className="text-[10px] font-semibold text-[#5B2D82] dark:text-purple-300 truncate">
                  {authUser?.subject ? `معلم ${authUser.subject}` : 'معلم'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {showTeacherMenu && (
              <div 
                className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                dir="rtl"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <span className="text-[11px] font-bold text-slate-400 block">الحساب النشط حالياً:</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{authUser?.fullName}</p>
                    {authUser?.role === 'admin' && (
                      <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-[#5B2D82] dark:text-purple-300 font-bold px-1.5 py-0.5 rounded-md shrink-0">
                        الأساسي
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#5B2D82] dark:text-purple-300 font-medium truncate">مادة: {authUser?.subject || 'عام'}</p>
                </div>

                {/* Real-time Cloud Sync Live Pill */}
                <div className="mx-1 my-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isCloudSaving ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                    <span className="text-slate-700 dark:text-slate-200">
                      {isCloudSaving ? 'جاري الحفظ بالسحابة...' : 'سحابة Firebase متصلة'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {lastCloudSyncTime ? lastCloudSyncTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'نشط'}
                  </span>
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
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isCurrent ? 'bg-[#5B2D82] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                              {teacher.fullName.slice(0, 1)}
                            </div>
                            <div className="truncate">
                              <span className="block truncate font-bold text-xs">{teacher.fullName}</span>
                              <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">{teacher.subject}</span>
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

          {/* Logout Button: Visible on tablet/desktop, compact icon on md, labeled on xl */}
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-1.5 px-2.5 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-bold text-xs cursor-pointer transition-colors shrink-0"
            title="تسجيل الخروج"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="hidden xl:inline">خروج</span>
          </button>

          {/* Hamburger Toggle Button (3 bars / Menu icon) - shown on all screens below xl */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            className="xl:hidden w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all flex items-center justify-center shrink-0 focus:outline-none"
            aria-label={isMobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة الرئيسية'}
            title={isMobileMenuOpen ? 'إغلاق القائمة' : 'القائمة الرئيسية'}
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4 text-[#5B2D82] dark:text-purple-400" />
            ) : (
              <Menu className="w-4 h-4 text-slate-700 dark:text-slate-200" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Responsive Navigation Drawer (Vertical Stack - تحت بعض) */}
      {isMobileMenuOpen && (
        <div 
          className="xl:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-4rem)] overflow-y-auto"
          dir="rtl"
        >
          {/* Active Teacher Profile in Mobile Menu */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5B2D82] text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-[#5B2D82]/30 shrink-0">
                {authUser?.fullName ? authUser.fullName.slice(0, 1) : 'م'}
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {authUser?.fullName || 'المعلم'}
                </div>
                <div className="text-xs font-semibold text-[#5B2D82] dark:text-purple-300">
                  {authUser?.subject ? `معلم ${authUser.subject}` : 'معلم'}
                </div>
              </div>
            </div>
            {authUser?.role === 'admin' && (
              <span className="text-[11px] bg-purple-200/80 dark:bg-purple-900 text-[#5B2D82] dark:text-purple-200 font-bold px-2 py-0.5 rounded-lg shrink-0">
                المشرف الأساسي
              </span>
            )}
          </div>

          {/* Navigation Items Stacked Vertically (تحت بعض) */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 px-1 mb-1">
              أقسام المنصة
            </span>
            {navItems.map(item => {
              const isActive = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#5B2D82] text-white shadow-md shadow-[#5B2D82]/20'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-white dark:bg-slate-700 text-[#5B2D82] dark:text-purple-400 shadow-xs'
                    }`}>
                      {item.icon}
                    </div>
                    <span className="text-sm font-bold">{item.fullLabel || item.label}</span>
                  </div>
                  {isActive ? (
                    <span className="text-xs bg-white/25 text-white px-2.5 py-0.5 rounded-lg font-bold">نشط</span>
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile Quick Controls Bar */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                {settings.theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>الوضع الفاتح</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    <span>الوضع الداكن</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={toggleSound}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                {settings.soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-[#5B2D82] dark:text-purple-400" />
                    <span>الصوت مفعّل</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-500" />
                    <span>الصوت مكتوم</span>
                  </>
                )}
              </button>
            </div>

            {activities.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleQuickLaunch();
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>إطلاق النشاط المعروض</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-bold text-xs cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>تسجيل الخروج من المنصة</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

