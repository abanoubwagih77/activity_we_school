import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SessionResult, ActivityType } from '../../types';
import { 
  History, Trophy, Calendar, Clock, CheckCircle2, 
  XCircle, Trash2, ArrowUpRight, BarChart3, Users, X, AlertTriangle 
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';

export const HistoryView: React.FC = () => {
  const { history, clearHistory, classes } = useApp();
  const [selectedSession, setSelectedSession] = useState<SessionResult | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [banner, setBanner] = useState<string | null>(null);

  const getTypeNameAr = (type: string) => {
    switch (type) {
      case 'spin_wheel': return 'عجلة الحظ الدوارة';
      case 'question_boxes': return 'صناديق الأسئلة';
      case 'student_picker': return 'اختيار الطلاب';
      case 'true_false': return 'صح أو خطأ';
      case 'speed_quiz': return 'مسابقة السرعة';
      case 'matching': return 'المطابقة والتوصيل';
      case 'memory_cards': return 'كروت الذاكرة';
      case 'team_battle': return 'معركة الفرق';
      case 'jeopardy': return 'شبكة التحديات';
      default: return type;
    }
  };

  const filteredHistory = history.filter(item => {
    if (selectedClassFilter !== 'all' && item.classId !== selectedClassFilter) {
      return false;
    }
    return true;
  });

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handleClear = () => {
    clearHistory();
    setConfirmClear(false);
    soundEngine.playClick();
    setBanner('تم مسح جميع سجلات النتائج.');
    setTimeout(() => setBanner(null), 3500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            سجل نتائج الأنشطة الصفية
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            مراجعة أداء الطلاب في الجلسات السابقة ونسب الإجابات الصحيحة ونتائج معارك الفرق
          </p>
        </div>

        {history.length > 0 && (
          <div>
            {confirmClear ? (
              <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/60 p-1.5 rounded-xl border border-rose-200 dark:border-rose-800">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">مسح الكل؟</span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-all"
                >
                  تأكيد المسح
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition-all"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح السجلات</span>
              </button>
            )}
          </div>
        )}
      </div>

      {banner && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{banner}</span>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">تصفية حسب الفصل:</span>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">جميع الفصول</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {filteredHistory.length} جلسة مسجلة
        </span>
      </div>

      {/* History Cards / Table */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 shadow-sm transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">لا توجد جلسات مسجلة حتى الآن</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
            عندما تقوم بتشغيل أي نشاط صفي وإنهائه أمام الطلاب على البروجيكتور، سيتم حفظ تقرير الأداء والدرجات تلقائياً هنا!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((session) => (
            <div
              key={session.id}
              onClick={() => {
                soundEngine.playClick();
                setSelectedSession(session);
              }}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {getTypeNameAr(session.activityType)}
                  </span>
                  {session.className && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      فصل: {session.className}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                    {formatDate(session.timestamp)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {session.activityTitle}
                </h3>
              </div>

              {/* Metrics Pills */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">الدقة</span>
                  <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 font-mono">
                    {session.accuracy || 0}%
                  </span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-center">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">صحيح</span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    {session.correctAnswers}
                  </span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-center">
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 block">خطأ</span>
                  <span className="text-xs font-black text-rose-700 dark:text-rose-400 font-mono">
                    {session.wrongAnswers}
                  </span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center">
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block">مجموع النقاط</span>
                  <span className="text-xs font-black text-indigo-800 dark:text-indigo-300 font-mono">
                    {session.totalPoints}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative text-slate-800 dark:text-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedSession.activityTitle}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(selectedSession.timestamp)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedSession(null);
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Team battle breakdown if available */}
            {selectedSession.teamScores && selectedSession.teamScores.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">نتائج فرق المنافسة:</span>
                <div className="space-y-1.5">
                  {selectedSession.teamScores.map((t, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.teamName}</span>
                      <span className="text-sm font-black text-indigo-700 dark:text-indigo-400 font-mono">{t.score} نقطة</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedSession(null);
                }}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
