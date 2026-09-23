import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Question, QuestionType, Difficulty } from '../../types';
import { 
  Plus, Upload, Download, Search, Filter, Trash2, 
  Edit3, Code2, Check, Image as ImageIcon, HelpCircle, 
  ListChecks, CheckSquare, ArrowLeftRight, Terminal, Sparkles, CheckCircle2
} from 'lucide-react';
import { QuestionFormModal } from './QuestionFormModal';
import { CsvImportModal } from './CsvImportModal';
import { soundEngine } from '../../utils/audio';

export const QuestionBankView: React.FC = () => {
  const { questions, addQuestion, updateQuestion, deleteQuestion, importQuestions, authUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Modals & Feedback
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => { if (q.category) set.add(q.category); });
    return Array.from(set);
  }, [questions]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = q.text.toLowerCase().includes(query);
        const matchesCategory = q.category?.toLowerCase().includes(query);
        const matchesTags = q.tags?.some(t => t.toLowerCase().includes(query));
        const matchesCode = q.codeSnippet?.toLowerCase().includes(query);
        if (!matchesText && !matchesCategory && !matchesTags && !matchesCode) {
          return false;
        }
      }

      if (selectedCategory !== 'all' && q.category !== selectedCategory) {
        return false;
      }

      if (selectedType !== 'all' && q.type !== selectedType) {
        return false;
      }

      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) {
        return false;
      }

      return true;
    });
  }, [questions, searchQuery, selectedCategory, selectedType, selectedDifficulty]);

  const handleExportCsv = () => {
    const headers = ['Text', 'Type', 'Options', 'CorrectAnswer', 'Category', 'Difficulty', 'Points', 'CodeSnippet', 'Explanation'];
    const rows = questions.map(q => [
      `"${q.text.replace(/"/g, '""')}"`,
      `"${q.type}"`,
      `"${(q.options || []).join('|').replace(/"/g, '""')}"`,
      `"${q.correctAnswer.replace(/"/g, '""')}"`,
      `"${(q.category || '').replace(/"/g, '""')}"`,
      `"${q.difficulty}"`,
      q.points,
      `"${(q.codeSnippet || '').replace(/"/g, '""')}"`,
      `"${(q.explanation || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'classtech_questions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    soundEngine.playClick();
  };

  const getTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'mcq': return 'اختيار من متعدد (MCQ)';
      case 'true_false': return 'صح أو خطأ (T/F)';
      case 'complete': return 'أكمل الفراغ (Complete)';
      case 'matching': return 'مطابقة وتوصيل (Match)';
      case 'code_output': return 'توقع ناتج الكود (Code)';
      default: return type;
    }
  };

  const getTypeBadgeClass = (type: QuestionType) => {
    switch (type) {
      case 'mcq': return 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'true_false': return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'complete': return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'matching': return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'code_output': return 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getDifficultyLabel = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 'سهل';
      case 'medium': return 'متوسط';
      case 'hard': return 'متقدم';
    }
  };

  const confirmDelete = (id: string) => {
    deleteQuestion(id);
    setDeletingId(null);
    soundEngine.playClick();
    setFeedbackBanner('تم حذف السؤال بنجاح.');
    setTimeout(() => setFeedbackBanner(null), 3500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Header with Title & Action CTAs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-[#5B2D82] dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
              مادة: {authUser?.subject || 'عام'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              حساب الأستاذ {authUser?.fullName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            بنك أسئلة {authUser?.subject ? `مادة ${authUser.subject}` : 'المنصة'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            إدارة وتصنيف الأسئلة الخاصة بمادتك للأنشطة والمسابقات الصفية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setIsImportOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all"
          >
            <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>استيراد ملف Excel / CSV</span>
          </button>
          {questions.length > 0 && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all"
            >
              <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>تصدير CSV</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setEditingQuestion(null);
              setIsFormOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة سؤال جديد</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالنص، الكود، التصنيف..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">جميع التصنيفات ({categories.length})</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Question Type Filter (Covers all 5 types!) */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">جميع أنواع الأسئلة</option>
            <option value="mcq">اختيار من متعدد (MCQ)</option>
            <option value="true_false">صح أو خطأ (True / False)</option>
            <option value="complete">إكمال الفراغ (Complete)</option>
            <option value="matching">مطابقة وتوصيل (Matching)</option>
            <option value="code_output">توقع ناتج كود (Code Output)</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">جميع المستويات</option>
            <option value="easy">سهل (Easy)</option>
            <option value="medium">متوسط (Medium)</option>
            <option value="hard">متقدم (Hard)</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>يتم عرض {filteredQuestions.length} من إجمالي {questions.length} سؤال</span>
          {(searchQuery || selectedCategory !== 'all' || selectedType !== 'all' || selectedDifficulty !== 'all') && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedType('all');
                setSelectedDifficulty('all');
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Questions Cards List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          /* Empty state when user hasn't added questions yet */
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Code2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">بنك الأسئلة فارغ حالياً</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
              لم تتم إضافة أي أسئلة بعد. يمكنك الآن إضافة أسئلتك البرمجية والتقنية باللغة الإنجليزية، أو استيرادها دفعة واحدة من ملف Excel.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setEditingQuestion(null);
                  setIsFormOpen(true);
                }}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول سؤال لك الآن</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setIsImportOpen(true);
                }}
                className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition-all flex items-center gap-2"
              >
                <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>استيراد ملف Excel جاهز</span>
              </button>
            </div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <Filter className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">لا توجد أسئلة تطابق شروط البحث أو التصفية</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">جرّب تغيير كلمات البحث أو إعادة تعيين الفلاتر</p>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all flex flex-col md:flex-row items-start justify-between gap-6"
            >
              <div className="flex-1 space-y-3 min-w-0 w-full">
                {/* Badges strip */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${getTypeBadgeClass(q.type)}`}>
                    {getTypeLabel(q.type)}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-sans">
                    {q.category}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    q.difficulty === 'easy'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                      : q.difficulty === 'medium'
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                  }`}>
                    {getDifficultyLabel(q.difficulty)}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mr-auto font-bold">
                    {q.points} نقطة • {q.timeLimit || 30} ثانية
                  </span>
                </div>

                {/* Question Text in English */}
                <div dir="ltr" className="text-left">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {q.text}
                  </h3>
                </div>

                {/* Code Snippet if present */}
                {q.codeSnippet && (
                  <div dir="ltr" className="text-left p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner">
                    <pre>{q.codeSnippet}</pre>
                  </div>
                )}

                {/* Answers / Options / Pairs Display */}
                {q.type === 'complete' ? (
                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-amber-900 dark:text-amber-300 block">الإجابة النموذجية للفراغ:</span>
                    <span dir="ltr" className="inline-block font-mono font-bold text-amber-800 dark:text-amber-200 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-amber-200 dark:border-amber-700">
                      {q.correctAnswer}
                    </span>
                  </div>
                ) : q.type === 'matching' && q.matchingPairs ? (
                  <div className="space-y-1.5 p-3 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/60 rounded-xl text-xs">
                    <span className="font-bold text-purple-900 dark:text-purple-300 block mb-1">أزواج المطابقة والتوصيل:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" dir="ltr">
                      {q.matchingPairs.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-purple-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                          <span className="font-bold text-purple-700 dark:text-purple-400">{p.left}</span>
                          <span className="text-slate-400">→</span>
                          <span className="text-slate-600 dark:text-slate-300">{p.right}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5" dir="ltr">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options?.map((opt, idx) => {
                        const isCorrect = opt === q.correctAnswer;
                        return (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-left ${
                              isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-300/40'
                                : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="truncate">{opt}</span>
                            {isCorrect && (
                              <span className="shrink-0 text-emerald-700 dark:text-emerald-400 flex items-center gap-1 text-[11px] font-bold font-sans ml-2" dir="rtl">
                                <Check className="w-3.5 h-3.5" /> صحيح
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Explanation if present */}
                {q.explanation && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700" dir="ltr">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Explanation: </span>
                    <span>{q.explanation}</span>
                  </div>
                )}
              </div>

              {/* Actions Button Column */}
              <div className="flex md:flex-col items-center gap-2 shrink-0 self-end md:self-start">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setEditingQuestion(q);
                    setIsFormOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </button>

                {deletingId === q.id ? (
                  <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/50 p-1 rounded-xl border border-rose-200 dark:border-rose-800">
                    <button
                      type="button"
                      onClick={() => confirmDelete(q.id)}
                      className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                    >
                      تأكيد
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(null)}
                      className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeletingId(q.id)}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {isFormOpen && (
        <QuestionFormModal
          initialQuestion={editingQuestion}
          onSave={(q) => {
            if (editingQuestion) {
              updateQuestion(q as Question);
              setFeedbackBanner('تم تحديث بيانات السؤال بنجاح.');
            } else {
              addQuestion(q as any);
              setFeedbackBanner('تمت إضافة السؤال الجديد إلى البنك بنجاح!');
            }
            setTimeout(() => setFeedbackBanner(null), 3500);
          }}
          onClose={() => {
            setIsFormOpen(false);
            setEditingQuestion(null);
          }}
        />
      )}

      {isImportOpen && (
        <CsvImportModal
          onImport={(imported) => {
            const count = importQuestions(imported);
            setIsImportOpen(false);
            setFeedbackBanner(`تم استيراد ${count} سؤال بنجاح إلى بنك الأسئلة!`);
            setTimeout(() => setFeedbackBanner(null), 3500);
            soundEngine.playCorrect();
          }}
          onClose={() => setIsImportOpen(false)}
        />
      )}
    </div>
  );
};
