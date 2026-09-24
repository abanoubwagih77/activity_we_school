import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, LogIn, KeyRound, Check, ArrowRight } from 'lucide-react';
import { soundEngine } from '../../utils/audio';
import { AuthUser } from '../../types';
import { WeLogo } from '../common/WeLogo';
import { useApp } from '../../context/AppContext';

interface LoginViewProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const { loginWithCredentials, requestPasswordReset } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const enteredUser = username.trim();
    const enteredPass = password.trim();

    if (!enteredUser) {
      setError('يرجى إدخال اسم المستخدم أو البريد الإلكتروني');
      soundEngine.playWrong();
      return;
    }

    if (!enteredPass) {
      setError('يرجى إدخال كلمة المرور');
      soundEngine.playWrong();
      return;
    }

    setIsLoading(true);
    soundEngine.playClick();

    try {
      const result = await loginWithCredentials(enteredUser, enteredPass);
      if (result.success && result.user) {
        soundEngine.playCorrect();
        onLogin(result.user);
      } else {
        setError(result.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
        soundEngine.playWrong();
      }
    } catch {
      setError('حدث خطأ أثناء محاولة تسجيل الدخول، يرجى المحاولة مجدداً');
      soundEngine.playWrong();
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus(null);
    if (!forgotInput.trim()) {
      setForgotStatus({ type: 'error', message: 'يرجى إدخال اسم المستخدم أو البريد المسجل' });
      return;
    }

    setIsResetting(true);
    soundEngine.playClick();

    const res = await requestPasswordReset(forgotInput.trim());
    setIsResetting(false);

    if (res.success) {
      setForgotStatus({
        type: 'success',
        message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد المرتبط بالحساب بنجاح.'
      });
      soundEngine.playCorrect();
    } else {
      setForgotStatus({
        type: 'error',
        message: res.error || 'تعذر إرسال رابط إعادة التعيين، يرجى مراجعة المسؤول.'
      });
      soundEngine.playWrong();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-purple-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-200" dir="rtl">
      {/* Brand Header */}
      <div className="text-center mb-6 max-w-md flex flex-col items-center">
        <div className="mb-3 transform hover:scale-105 transition-transform">
          <WeLogo size="xl" showText={true} />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
          بوابة المعلم للأنشطة الصفية التفاعلية
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
          سجل دخولك إلى مساحة عمل مادتك لبدء المسابقات والأنشطة الصفية
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <LogIn className="w-5 h-5 text-[#5B2D82] dark:text-purple-400" />
              <span>تسجيل الدخول</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              أدخل بيانات الحساب الخاص بمادتك الدراسية
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              اسم المستخدم أو البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم أو البريد"
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B2D82] focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
                required
                autoComplete="username"
              />
              <div className="absolute right-3.5 top-3.5 text-slate-400">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                كلمة المرور
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotInput(username);
                  setForgotStatus(null);
                  setShowForgotModal(true);
                }}
                className="text-[11px] text-[#5B2D82] dark:text-purple-400 hover:underline cursor-pointer font-semibold"
              >
                نسيت كلمة المرور؟
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B2D82] focus:bg-white dark:focus:bg-slate-800 transition-all font-medium font-mono"
                required
                autoComplete="current-password"
              />
              <div className="absolute right-3.5 top-3.5 text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 mt-2"
            style={{
              background: 'linear-gradient(135deg, #5B2D82 0%, #461b68 100%)',
            }}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>دخول إلى حساب المعلم</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-400">
            يتم إدارة وإنشاء حسابات المعلمين بواسطة الحساب الأساسي للمنصة (أبانوب وجيه)
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-5 space-y-4" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#5B2D82] dark:text-purple-400" />
                <span>إعادة تعيين كلمة المرور</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {forgotStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  forgotStatus.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {forgotStatus.message}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المستخدم أو البريد المسجل
                </label>
                <input
                  type="text"
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  placeholder="أدخل اسم المستخدم أو البريد"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#5B2D82]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-2 rounded-xl bg-[#5B2D82] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isResetting ? 'جارٍ الإرسال...' : 'إرسال رابط التعيين'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
