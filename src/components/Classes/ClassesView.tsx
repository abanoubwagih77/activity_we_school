import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ClassroomGroup, Student, ActivityConfig } from '../../types';
import { 
  Users, Plus, Trash2, Edit3, UserCheck, Play, 
  UserPlus, X, Check, FileText, Sparkles, CheckCircle2 
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';

export const ClassesView: React.FC = () => {
  const { classes, addClass, updateClass, deleteClass, launchActivity, activities, authUser } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState(authUser?.subject || 'مادة المعلم');
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  // Student entry states
  const [singleStudentName, setSingleStudentName] = useState('');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkNamesText, setBulkNamesText] = useState('');

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const created = addClass({
      name: newClassName.trim(),
      grade: 'المرحلة الدراسية',
      subject: newClassSubject.trim(),
      students: [],
    });

    setSelectedClassId(created.id);
    setNewClassName('');
    setIsAddClassModalOpen(false);
    soundEngine.playClick();
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleStudentName.trim() || !currentClass) return;

    const newStudent: Student = {
      id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: singleStudentName.trim(),
      points: 0,
      timesCalled: 0,
    };

    updateClass({
      ...currentClass,
      students: [...currentClass.students, newStudent],
    });

    setSingleStudentName('');
    soundEngine.playClick();
  };

  const handleBulkAddStudents = () => {
    if (!bulkNamesText.trim() || !currentClass) return;

    const names = bulkNamesText
      .split(/[\n,]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    const newStudents: Student[] = names.map((name, idx) => ({
      id: `s-${Date.now()}-${idx}`,
      name,
      points: 0,
      timesCalled: 0,
    }));

    updateClass({
      ...currentClass,
      students: [...currentClass.students, ...newStudents],
    });

    setBulkNamesText('');
    setIsBulkImportOpen(false);
    soundEngine.playCorrect();
  };

  const handleDeleteStudent = (studentId: string) => {
    if (!currentClass) return;
    updateClass({
      ...currentClass,
      students: currentClass.students.filter(s => s.id !== studentId),
    });
    soundEngine.playClick();
  };

  const handleDeleteClassConfirmed = (classId: string) => {
    deleteClass(classId);
    setDeletingClassId(null);
    soundEngine.playClick();
    setBanner('تم حذف الفصل بنجاح.');
    setTimeout(() => setBanner(null), 3500);
  };

  const handleLaunchPicker = () => {
    if (!currentClass) return;
    const pickerActivity: ActivityConfig = activities.find(a => a.type === 'student_picker') || {
      id: 'picker-adhoc',
      title: `روليت اختيار الطلاب - ${currentClass.name}`,
      type: 'student_picker' as const,
      classId: currentClass.id,
      scoreMode: 'class' as const,
      questionIds: [],
      createdAt: new Date().toISOString(),
    };
    soundEngine.playClick();
    launchActivity(pickerActivity);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            إدارة الفصول والطلاب
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            إضافة فصولك الدراسية وقوائم الطلاب للاختيار العشوائي والأنشطة الجماعية
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setIsAddClassModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة فصل جديد</span>
        </button>
      </div>

      {banner && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{banner}</span>
        </div>
      )}

      {classes.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">لا توجد فصول دراسية مسجلة</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
            أضف أول فصل لك (مثلاً: الصف الثاني الثانوي - برمجة وتكنولوجيا) لتتمكن من إضافة أسماء الطلاب واختيارهم عشوائياً في الأنشطة!
          </p>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setIsAddClassModalOpen(true);
            }}
            className="mt-6 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة أول فصل الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Class Sidebar Selector */}
          <div className="lg:col-span-1 space-y-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block px-1">
              قائمة الفصول ({classes.length})
            </span>
            <div className="space-y-2">
              {classes.map((c) => {
                const isSelected = (currentClass?.id === c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedClassId(c.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-600 shadow-sm ring-1 ring-indigo-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <h4 className={`text-sm font-bold ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>
                        {c.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {c.students?.length || 0} طالب • {c.subject || 'عام'}
                      </p>
                    </div>

                    {deletingClassId === c.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-200 dark:border-rose-800" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleDeleteClassConfirmed(c.id)}
                          className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                        >
                          تأكيد
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingClassId(null)}
                          className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingClassId(c.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="حذف الفصل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Class Details and Students */}
          {currentClass && (
            <div className="lg:col-span-3 space-y-6">
              {/* Class Header Banner */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
                <div>
                  <div className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-1">
                    {currentClass.subject || 'برمجة وتكنولوجيا'}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {currentClass.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    إجمالي الطلاب المسجلين: {currentClass.students?.length || 0} طالب
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setIsBulkImportOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>لصق قائمة أسماء جماعية</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLaunchPicker}
                    disabled={!currentClass.students || currentClass.students.length === 0}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>تشغيل روليت اختيار طالب</span>
                  </button>
                </div>
              </div>

              {/* Add Single Student Input Bar */}
              <form onSubmit={handleAddSingleStudent} className="flex gap-2">
                <input
                  type="text"
                  value={singleStudentName}
                  onChange={(e) => setSingleStudentName(e.target.value)}
                  placeholder="أدخل اسم طالب لإضافته إلى هذا الفصل (مثلاً: أحمد محمود أو John Smith)..."
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
                <button
                  type="submit"
                  disabled={!singleStudentName.trim()}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm cursor-pointer transition-all flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة طالب</span>
                </button>
              </form>

              {/* Students Grid */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    قائمة طلاب الفصل ({currentClass.students?.length || 0})
                  </span>
                </div>

                {!currentClass.students || currentClass.students.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                    لا يوجد طلاب مسجلون في هذا الفصل حتى الآن. أضف أسماء طلابك من الشريط بالأعلى!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {currentClass.students.map((stu, idx) => (
                      <div
                        key={stu.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 group hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {stu.name}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(stu.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                          title="حذف الطالب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Class Modal */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative text-slate-800 dark:text-slate-100 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">إضافة فصل دراسي جديد</h3>
              <button
                type="button"
                onClick={() => setIsAddClassModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم الفصل *</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="مثلاً: الصف العاشر - شعبة A"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">المادة / التخصص</label>
                <input
                  type="text"
                  value={newClassSubject}
                  onChange={(e) => setNewClassSubject(e.target.value)}
                  placeholder="مثلاً: بايثون، تصميم الويب، هياكل البيانات"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow cursor-pointer"
                >
                  إنشاء الفصل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative text-slate-800 dark:text-slate-100 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">لصق قائمة أسماء الطلاب</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">انسخ قائمة الأسماء من Excel أو Word والصقها هنا</p>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkImportOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                الأسماء (اسم كل طالب في سطر منفصل):
              </label>
              <textarea
                rows={7}
                value={bulkNamesText}
                onChange={(e) => setBulkNamesText(e.target.value)}
                placeholder="أحمد محمد&#10;سارة علي&#10;خالد حسن&#10;يوسف إبراهيم"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkImportOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleBulkAddStudents}
                  disabled={!bulkNamesText.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow cursor-pointer"
                >
                  إضافة الطلاب للفصل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
