import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ActivityConfig, ActivityType } from '../../types';
import { 
  Play, Plus, Copy, Trash2, Edit3, Search, 
  RotateCw, Box, UserCheck, CheckCircle, Zap, 
  Link2, Layers, Swords, Grid3X3, Gamepad2, CheckCircle2 
} from 'lucide-react';
import { ActivityBuilderModal } from './ActivityBuilderModal';
import { soundEngine } from '../../utils/audio';

export const ActivitiesListView: React.FC = () => {
  const { activities, classes, questions, launchActivity, duplicateActivity, deleteActivity } = useApp();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityConfig | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const getTypeLabelAr = (type: ActivityType) => {
    switch (type) {
      case 'spin_wheel': return 'عجلة الحظ الدوارة';
      case 'question_boxes': return 'صناديق الأسئلة';
      case 'student_picker': return 'اختيار الطلاب';
      case 'true_false': return 'صح أو خطأ';
      case 'speed_quiz': return 'مسابقة السرعة';
      case 'matching': return 'المطابقة والتوصيل';
      case 'memory_cards': return 'كروت الذاكرة';
      case 'team_battle': return 'معركة الفرق';
      case 'jeopardy': return 'شبكة جيبوردي';
    }
  };

  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case 'spin_wheel': return <RotateCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'question_boxes': return <Box className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'student_picker': return <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'true_false': return <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'speed_quiz': return <Zap className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'matching': return <Link2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'memory_cards': return <Layers className="w-4 h-4 text-violet-600 dark:text-violet-400" />;
      case 'team_battle': return <Swords className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'jeopardy': return <Grid3X3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
    }
  };

  const filteredActivities = activities.filter(act => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!act.title.toLowerCase().includes(q) && !act.description?.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (typeFilter !== 'all' && act.type !== typeFilter) {
      return false;
    }
    return true;
  });

  const handleDelete = (id: string) => {
    deleteActivity(id);
    setDeletingId(null);
    soundEngine.playClick();
    setBanner('تم حذف النشاط بنجاح.');
    setTimeout(() => setBanner(null), 3500);
  };

  const handleDuplicate = (id: string) => {
    duplicateActivity(id);
    soundEngine.playClick();
    setBanner('تم تكرار النشاط بنجاح.');
    setTimeout(() => setBanner(null), 3500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            الأنشطة الصفية التفاعلية
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            إعداد وتخصيص وإطلاق المسابقات والألعاب التعليمية على شاشة العرض
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setEditingActivity(null);
            setIsBuilderOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء نشاط جديد</span>
        </button>
      </div>

      {banner && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{banner}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في عنوان أو وصف النشاط..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">جميع قوالب الأنشطة</option>
            <option value="spin_wheel">عجلة الحظ الدوارة</option>
            <option value="question_boxes">صناديق الأسئلة</option>
            <option value="student_picker">اختيار الطلاب</option>
            <option value="true_false">تحدي صح أو خطأ</option>
            <option value="speed_quiz">مسابقة السرعة</option>
            <option value="matching">المطابقة والتوصيل</option>
            <option value="memory_cards">كروت الذاكرة</option>
            <option value="team_battle">معركة الفرق</option>
            <option value="jeopardy">شبكة جيبوردي</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          يتم عرض {filteredActivities.length} من أصل {activities.length} نشاط
        </div>
      </div>

      {/* Activities Grid */}
      {activities.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">لا توجد أنشطة مجهزة بعد</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
            أنشئ أول نشاط صفي تفاعلي لك وحدد الأسئلة والقالب المفضل لعرضه على البروجيكتور أمام طلابك!
          </p>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setEditingActivity(null);
              setIsBuilderOpen(true);
            }}
            className="mt-6 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء أول نشاط صفي الآن</span>
          </button>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">لا توجد أنشطة تطابق بحثك</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredActivities.map((act) => {
            const classObj = classes.find(c => c.id === act.classId);
            return (
              <div
                key={act.id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {getTypeIcon(act.type)}
                      <span>{getTypeLabelAr(act.type)}</span>
                    </span>

                    <div className="flex items-center gap-1 text-slate-400">
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setEditingActivity(act);
                          setIsBuilderOpen(true);
                        }}
                        className="p-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="تعديل النشاط"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(act.id)}
                        className="p-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="نسخ النشاط"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {deletingId === act.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-200 dark:border-rose-800">
                          <button
                            type="button"
                            onClick={() => handleDelete(act.id)}
                            className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                          >
                            تأكيد
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingId(act.id)}
                          className="p-1.5 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="حذف النشاط"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {act.title}
                    </h3>
                    {act.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {act.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {act.questionIds?.length || 0} أسئلة
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {act.scoreMode === 'team' ? 'منافسة فرق' : 'نقاط فردية للفصل'}
                    </span>
                    {classObj && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        فصل: {classObj.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                    المهلة: {act.timerDuration ? `${act.timerDuration} ث` : 'غير محدد'}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      launchActivity(act);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>تشغيل العرض</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Builder Modal */}
      {isBuilderOpen && (
        <ActivityBuilderModal
          initialActivity={editingActivity}
          onClose={() => {
            setIsBuilderOpen(false);
            setEditingActivity(null);
          }}
        />
      )}
    </div>
  );
};
