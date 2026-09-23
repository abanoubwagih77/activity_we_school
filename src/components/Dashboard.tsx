import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Play, Plus, Database, Users, History, Gamepad2, Settings,
  RotateCw, Box, UserCheck, CheckCircle, Zap, Link2, 
  Layers, Swords, Grid3X3, Copy, Trash2, ArrowLeft, Sparkles, BookOpen, CheckCircle2
} from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { ActivityType } from '../types';

export const Dashboard: React.FC<{ onOpenCreateModal: () => void }> = ({ onOpenCreateModal }) => {
  const { 
    activities, questions, classes, history, setView, 
    launchActivity, duplicateActivity, deleteActivity, authUser 
  } = useApp();

  const [deletingActId, setDeletingActId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const getTypeNameAr = (type: ActivityType) => {
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

  const activityTypeDetails: {
    type: ActivityType;
    nameAr: string;
    descriptionAr: string;
    icon: React.ReactNode;
    colorBg: string;
    badgeColor: string;
  }[] = [
    {
      type: 'spin_wheel',
      nameAr: 'عجلة الحظ الدوارة',
      descriptionAr: 'عجلة تدور باحترافية وتتوقف على أسئلة عشوائية لإثارة حماس وتفاعل الفصل',
      icon: <RotateCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      colorBg: 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
      badgeColor: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300',
    },
    {
      type: 'question_boxes',
      nameAr: 'صناديق الأسئلة المرقمة',
      descriptionAr: 'شبكة مربعات تفاعلية يختار منها الطالب رقمه المفضل ليظهر السؤال للجميع',
      icon: <Box className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      colorBg: 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
      badgeColor: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300',
    },
    {
      type: 'student_picker',
      nameAr: 'اختيار الطلاب العشوائي',
      descriptionAr: 'روليت عشوائي لاختيار الطالب المشارك بعدالة تامة دون حرج',
      icon: <UserCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      colorBg: 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      badgeColor: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300',
    },
    {
      type: 'true_false',
      nameAr: 'تحدي صح أو خطأ',
      descriptionAr: 'عرض سريع للمفاهيم البرمجية لاختبار الفهم النظري والمغالطات الشائعة',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      colorBg: 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300',
    },
    {
      type: 'speed_quiz',
      nameAr: 'مسابقة السرعة والتحدي',
      descriptionAr: 'أسئلة سريعة مع عداد تنازلي حماسي ومضاعفة النقاط للإجابات السريعة',
      icon: <Zap className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      colorBg: 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      badgeColor: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300',
    },
    {
      type: 'matching',
      nameAr: 'المطابقة والتوصيل',
      descriptionAr: 'توصيل المصطلحات بالتعاريف ومخرجات الأكواد على شاشة العرض التفاعلية',
      icon: <Link2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      colorBg: 'bg-cyan-50/70 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
      badgeColor: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300',
    },
    {
      type: 'memory_cards',
      nameAr: 'كروت الذاكرة التقنية',
      descriptionAr: 'كروت مقلوبة يتم فتحها للبحث عن أزواج المفاهيم والأكواد المتطابقة',
      icon: <Layers className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
      colorBg: 'bg-violet-50/70 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800',
      badgeColor: 'bg-violet-100 dark:bg-violet-900/60 text-violet-800 dark:text-violet-300',
    },
    {
      type: 'team_battle',
      nameAr: 'معركة الفرق البرمجية',
      descriptionAr: 'تقسيم طلاب الفصل إلى فرق مع لوحة تصدر لنقاط كل فريق ومنافسة مباشرة',
      icon: <Swords className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      colorBg: 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
      badgeColor: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300',
    },
    {
      type: 'jeopardy',
      nameAr: 'شبكة التحديات (Jeopardy)',
      descriptionAr: 'أعمدة تصنيفات برمجية بنقاط متدرجة (10، 20، 30، 40) يختار منها الطلاب',
      icon: <Grid3X3 className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      colorBg: 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
      badgeColor: 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300',
    },
  ];

  const handleDeleteActivity = (id: string) => {
    deleteActivity(id);
    setDeletingActId(null);
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
      {/* Teacher Welcome & Quick Hero Header */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-50/90 via-white to-slate-50 dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-[#5B2D82] dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>مساحة عمل خاصة: مادة {authUser?.subject || 'التخصص'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              أهلاً بك يا {authUser?.fullName || 'أستاذنا'} في منصة الأنشطة الصفية
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              هذه مساحة عملك المستقلة الخاصة بمادة <strong>{authUser?.subject}</strong>. يمكنك إضافة بنك أسئلتك وإعداد مسابقاتك وفصولك وعرضها مباشرة على شاشات العرض والبروجيكتور للطلاب!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onOpenCreateModal();
              }}
              className="px-5 py-3 rounded-2xl text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #5B2D82 0%, #461b68 100%)',
              }}
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء نشاط جديد</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setView('question_bank');
              }}
              className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Database className="w-4 h-4 text-[#5B2D82] dark:text-purple-400" />
              <span>بنك الأسئلة</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200/80 dark:border-slate-800">
          <div 
            onClick={() => {
              soundEngine.playClick();
              setView('question_bank');
            }}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
          >
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>الأسئلة بالبنك</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {questions.length}
            </div>
          </div>

          <div 
            onClick={() => {
              soundEngine.playClick();
              setView('activities');
            }}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
          >
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>الأنشطة الجاهزة</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {activities.length}
            </div>
          </div>

          <div 
            onClick={() => {
              soundEngine.playClick();
              setView('classes');
            }}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
          >
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>الفصول الدراسية</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {classes.length}
            </div>
          </div>

          <div 
            onClick={() => {
              soundEngine.playClick();
              setView('history');
            }}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
          >
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>الجلسات المكتملة</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {history.length}
            </div>
          </div>
        </div>
      </div>

      {banner && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{banner}</span>
        </div>
      )}

      {/* Available Activity Modes Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              أنماط الأنشطة التفاعلية المتوفرة (9 أنماط)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              اختر أي قالب لبدء نشاط صفي فوري متوافق مع شاشات البروجيكتور والسبورات الذكية
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setView('activities');
            }}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
          >
            <span>عرض كل الأنشطة</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activityTypeDetails.map((act) => (
            <div
              key={act.type}
              onClick={() => {
                soundEngine.playClick();
                onOpenCreateModal();
              }}
              className={`p-5 rounded-2xl border ${act.colorBg} hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                    {act.icon}
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${act.badgeColor}`}>
                    قالب تفاعلي
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {act.nameAr}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {act.descriptionAr}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                <span>إنشاء نشاط بهذا النمط</span>
                <Plus className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Your Configured Activities List */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              أنشطتي الصفية المحفوظة
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              الأنشطة التي قمت بإعدادها وتخصيص أسئلتها للعرض المباشر
            </p>
          </div>
          {activities.length > 0 && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onOpenCreateModal();
              }}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة نشاط جديد</span>
            </button>
          )}
        </div>

        {activities.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Gamepad2 className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                لا توجد أنشطة مجهزة بعد
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                لم تقم بإنشاء أي أنشطة صفية حتى الآن. أضف بعض الأسئلة أولاً في بنك الأسئلة، ثم أنشئ نشاطك الأول واختر قالبه المناسب للعرض أمام الطلاب!
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setView('question_bank');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
              >
                <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>الذهاب لبنك الأسئلة</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onOpenCreateModal();
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء أول نشاط الآن</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activities.map((act) => (
              <div
                key={act.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {getTypeNameAr(act.type)}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-bold">
                      {act.questionIds?.length || 0} أسئلة
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {act.title}
                  </h3>
                  {act.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {act.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(act.id)}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
                      title="نسخ النشاط"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {deletingActId === act.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-200 dark:border-rose-800">
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(act.id)}
                          className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                        >
                          تأكيد
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingActId(null)}
                          className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingActId(act.id)}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                        title="حذف النشاط"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      launchActivity(act);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>تشغيل في الفصل</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
