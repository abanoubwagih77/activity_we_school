import React, { useState } from 'react';
import { Question, QuestionType, Difficulty, MatchingPair } from '../../types';
import { 
  X, Plus, Trash2, CheckCircle2, 
  ListChecks, CheckSquare, Edit3, ArrowLeftRight
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';
import { useApp } from '../../context/AppContext';

interface QuestionFormModalProps {
  initialQuestion?: Question | null;
  onSave: (q: Omit<Question, 'id' | 'createdAt'> | Question) => void;
  onClose: () => void;
}

export const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  initialQuestion,
  onSave,
  onClose,
}) => {
  const { authUser } = useApp();
  // Normalize type (if it was code_output, treat as mcq)
  const initialType: QuestionType = (initialQuestion?.type === 'code_output' ? 'mcq' : initialQuestion?.type) || 'mcq';
  const [type, setType] = useState<QuestionType>(initialType);
  const [text, setText] = useState(initialQuestion?.text || '');
  
  // MCQ Options
  const [options, setOptions] = useState<string[]>(
    initialQuestion?.options && initialQuestion.options.length > 0
      ? initialQuestion.options
      : ['Option A', 'Option B', 'Option C', 'Option D']
  );
  
  // Correct answer
  const [correctAnswer, setCorrectAnswer] = useState(
    initialQuestion?.correctAnswer || (initialType === 'true_false' ? 'True' : 'Option A')
  );

  // Matching Pairs
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>(
    initialQuestion?.matchingPairs && initialQuestion.matchingPairs.length > 0
      ? initialQuestion.matchingPairs
      : [
          { id: '1', left: 'Term 1', right: 'Definition or match 1' },
          { id: '2', left: 'Term 2', right: 'Definition or match 2' },
          { id: '3', left: 'Term 3', right: 'Definition or match 3' },
        ]
  );

  // Complete / Blank Answer
  const [blankAnswer, setBlankAnswer] = useState(
    initialQuestion?.type === 'complete' ? initialQuestion.correctAnswer : ''
  );

  const [explanation, setExplanation] = useState(initialQuestion?.explanation || '');
  const [difficulty, setDifficulty] = useState<Difficulty>(initialQuestion?.difficulty || 'easy');
  const [category, setCategory] = useState(initialQuestion?.category || (authUser?.subject ? authUser.subject : 'عام'));
  const [points, setPoints] = useState<number>(initialQuestion?.points || 10);
  const [timeLimit, setTimeLimit] = useState<number>(initialQuestion?.timeLimit || 30);
  const [error, setError] = useState<string | null>(null);

  // Type change handler
  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    soundEngine.playClick();
    if (newType === 'true_false') {
      setOptions(['True', 'False']);
      setCorrectAnswer('True');
    } else if (newType === 'complete') {
      if (!text.includes('___')) {
        setText(prev => prev ? `${prev} ___` : 'The keyword to define a function in Python is ___.');
      }
      setCorrectAnswer(blankAnswer || 'def');
    } else if (newType === 'matching') {
      if (!text) {
        setText('Match the following concepts with their correct definitions:');
      }
      setCorrectAnswer('Matched');
    } else if (newType === 'mcq') {
      if (options.length < 2) {
        setOptions(['Option A', 'Option B', 'Option C', 'Option D']);
      }
      setCorrectAnswer(options[0] || 'Option A');
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    const oldVal = updated[idx];
    updated[idx] = val;
    setOptions(updated);
    if (correctAnswer === oldVal) {
      setCorrectAnswer(val);
    }
  };

  const handleAddOption = () => {
    if (options.length >= 6) return;
    const newOpt = `Option ${String.fromCharCode(65 + options.length)}`;
    setOptions([...options, newOpt]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return;
    const removed = options[idx];
    const updated = options.filter((_, i) => i !== idx);
    setOptions(updated);
    if (correctAnswer === removed) {
      setCorrectAnswer(updated[0]);
    }
  };

  // Matching pair helpers
  const handlePairChange = (idx: number, field: 'left' | 'right', val: string) => {
    const updated = [...matchingPairs];
    updated[idx] = { ...updated[idx], [field]: val };
    setMatchingPairs(updated);
  };

  const handleAddPair = () => {
    if (matchingPairs.length >= 6) return;
    setMatchingPairs([
      ...matchingPairs,
      { id: Date.now().toString(), left: '', right: '' },
    ]);
  };

  const handleRemovePair = (idx: number) => {
    if (matchingPairs.length <= 2) return;
    setMatchingPairs(matchingPairs.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('يرجى كتابة نص السؤال بالإنجليزية (Question statement is required).');
      soundEngine.playWrong();
      return;
    }

    let finalCorrectAnswer = correctAnswer;
    let finalOptions = options;

    if (type === 'complete') {
      if (!blankAnswer.trim()) {
        setError('يرجى كتابة الكلمة أو الإجابة النموذجية للفراغ (Blank answer is required).');
        soundEngine.playWrong();
        return;
      }
      finalCorrectAnswer = blankAnswer.trim();
      finalOptions = [finalCorrectAnswer];
    } else if (type === 'matching') {
      const emptyPairs = matchingPairs.some(p => !p.left.trim() || !p.right.trim());
      if (emptyPairs) {
        setError('يرجى ملء جميع أزواج التوصيل أو حذف الزوج الفارغ.');
        soundEngine.playWrong();
        return;
      }
      finalCorrectAnswer = 'Matched';
      finalOptions = matchingPairs.map(p => p.right);
    } else if (type === 'true_false') {
      finalOptions = ['True', 'False'];
      if (correctAnswer !== 'True' && correctAnswer !== 'False') {
        finalCorrectAnswer = 'True';
      }
    } else {
      if (!finalCorrectAnswer.trim()) {
        setError('يرجى اختيار أو تحديد الإجابة الصحيحة.');
        soundEngine.playWrong();
        return;
      }
    }

    const questionData: Omit<Question, 'id' | 'createdAt'> = {
      text: text.trim(),
      type,
      options: finalOptions.map(o => o.trim()),
      correctAnswer: finalCorrectAnswer.trim(),
      matchingPairs: type === 'matching' ? matchingPairs : undefined,
      explanation: explanation.trim() ? explanation.trim() : undefined,
      difficulty,
      category: category.trim() || 'عام',
      tags: [category.trim() || 'عام'],
      points: Number(points) || 10,
      timeLimit: Number(timeLimit) || 30,
    };

    if (initialQuestion) {
      onSave({
        ...questionData,
        id: initialQuestion.id,
        createdAt: initialQuestion.createdAt,
      });
    } else {
      onSave(questionData);
    }

    onClose();
  };

  const questionTypesList = [
    {
      id: 'mcq',
      titleAr: 'اختيار من متعدد (MCQ)',
      descAr: 'خيارات متعددة وتحديد إجابة واحدة صحيحة',
      icon: <ListChecks className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
    },
    {
      id: 'true_false',
      titleAr: 'صح أو خطأ (True / False)',
      descAr: 'عبارة تقبل الإجابة بالصواب أو الخطأ',
      icon: <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      id: 'complete',
      titleAr: 'إكمال الفراغ (Complete)',
      descAr: 'سؤال يحتوي على فراغ مع تحديد الإجابة المطلوبة',
      icon: <Edit3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    },
    {
      id: 'matching',
      titleAr: 'مطابقة وتوصيل (Matching)',
      descAr: 'قائمة مصطلحات وتوصيلها بالتعريف الصحيح',
      icon: <ArrowLeftRight className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-hidden" dir="rtl">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-800 dark:text-slate-100 transition-colors animate-in fade-in">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {initialQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد لبنك الأسئلة'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              قم باختيار نوع السؤال أولاً، ثم أدخل نص السؤال وخياراته وتفاصيله
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Full Modal Form - ONE smooth unified vertical scroll for the entire form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* 1. SELECT QUESTION TYPE */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                  <span>اختر نوع السؤال:</span>
                </span>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {questionTypesList.find(t => t.id === type)?.titleAr}
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {questionTypesList.map(t => {
                  const isSelected = type === t.id;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => handleTypeChange(t.id as QuestionType)}
                      className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900/60' : 'bg-slate-100 dark:bg-slate-700'}`}>
                        {t.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>
                          {t.titleAr}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                          {t.descAr}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. QUESTION STATEMENT */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <span>نص السؤال بالإنجليزية (Question Statement in English):</span>
                </label>
                {type === 'complete' && (
                  <button
                    type="button"
                    onClick={() => setText(prev => prev + ' ___ ')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold cursor-pointer"
                  >
                    + إدراج فراغ (___)
                  </button>
                )}
              </div>
              <textarea
                dir="ltr"
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  type === 'complete'
                    ? 'e.g. In Python, the ___ method is used to add an item to the end of a list.'
                    : type === 'true_false'
                    ? 'e.g. Python tuples are immutable and cannot be modified after creation.'
                    : type === 'matching'
                    ? 'e.g. Match the web technologies with their primary roles:'
                    : 'e.g. What is the time complexity of searching an element in a balanced binary search tree?'
                }
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 font-sans text-left leading-relaxed shadow-sm"
                required
              />
            </div>

            {/* 3. ANSWER OPTIONS & CORRECT ANSWER */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                  <span>
                    {type === 'mcq' && 'خيارات الإجابة وحدد الإجابة الصحيحة:'}
                    {type === 'true_false' && 'حدد الإجابة الصحيحة للعبارة:'}
                    {type === 'complete' && 'الإجابة النموذجية للفراغ:'}
                    {type === 'matching' && 'أزواج التوصيل والمطابقة بالإنجليزية:'}
                  </span>
                </label>

                {type === 'mcq' && options.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> إضافة خيار آخر
                  </button>
                )}

                {type === 'matching' && matchingPairs.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddPair}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> إضافة زوج جديد
                  </button>
                )}
              </div>

              {/* MCQ Options List */}
              {type === 'mcq' && (
                <div className="space-y-2.5">
                  {options.map((opt, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-2.5 p-2 rounded-2xl border transition-all ${
                        correctAnswer === opt 
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-700 ring-1 ring-indigo-400/40' 
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer p-1.5 shrink-0" title="اضغط لتحديد هذا الخيار كإجابة صحيحة">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={correctAnswer === opt}
                          onChange={() => setCorrectAnswer(opt)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono w-4 text-center">
                          {String.fromCharCode(65 + idx)}
                        </span>
                      </label>

                      <input
                        dir="ltr"
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className="flex-1 bg-transparent border-0 p-1.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none text-left font-sans"
                        required
                      />

                      {correctAnswer === opt && (
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> الإجابة الصحيحة
                        </span>
                      )}

                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                          title="حذف الخيار"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    اختر الزر الدائري بجوار الخيار المناسب لتحديده كإجابة صحيحة.
                  </p>
                </div>
              )}

              {/* True / False Selection */}
              {type === 'true_false' && (
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => setCorrectAnswer('True')}
                    className={`py-4 px-4 rounded-2xl font-bold text-sm border flex items-center justify-center gap-2.5 cursor-pointer transition-all ${
                      correctAnswer === 'True'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-500/30'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>✓ صح (True)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCorrectAnswer('False')}
                    className={`py-4 px-4 rounded-2xl font-bold text-sm border flex items-center justify-center gap-2.5 cursor-pointer transition-all ${
                      correctAnswer === 'False'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-600/25 ring-2 ring-rose-500/30'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    <X className="w-5 h-5" />
                    <span>✗ خطأ (False)</span>
                  </button>
                </div>
              )}

              {/* Complete / Fill in Blank */}
              {type === 'complete' && (
                <div className="space-y-2">
                  <input
                    dir="ltr"
                    type="text"
                    value={blankAnswer}
                    onChange={(e) => {
                      setBlankAnswer(e.target.value);
                      setCorrectAnswer(e.target.value);
                    }}
                    placeholder="e.g. append or def or SELECT"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-left shadow-sm"
                    required
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    أدخل الكلمة الإنجليزية المطلوبة في الفراغ بالضبط لتصحيح إجابة الطلاب.
                  </p>
                </div>
              )}

              {/* Matching Pairs */}
              {type === 'matching' && (
                <div className="space-y-3">
                  {matchingPairs.map((pair, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        dir="ltr"
                        type="text"
                        value={pair.left}
                        onChange={(e) => handlePairChange(idx, 'left', e.target.value)}
                        placeholder="المصطلح (e.g. HTML)"
                        className="w-full sm:flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left"
                        required
                      />
                      <span className="text-slate-400 dark:text-slate-500 font-bold px-1">↔</span>
                      <input
                        dir="ltr"
                        type="text"
                        value={pair.right}
                        onChange={(e) => handlePairChange(idx, 'right', e.target.value)}
                        placeholder="المطابقة / التعريف (e.g. Markup language)"
                        className="w-full sm:flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left"
                        required
                      />
                      {matchingPairs.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePair(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer self-end sm:self-center"
                          title="حذف هذا الزوج"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. METADATA: Category, Difficulty, Points, Time Limit */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">4</span>
                <span>المادة والتصنيف ومستوى الصعوبة والنقاط والمهلة:</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    المادة / التصنيف
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="مثال: حاسب آلي، بايثون، شبكات..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    مستوى الصعوبة
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="easy">سهل (Easy)</option>
                    <option value="medium">متوسط (Medium)</option>
                    <option value="hard">متقدم (Hard)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    النقاط المستحقة
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    step="5"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    المهلة بالثواني
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    step="5"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                    required
                  />
                </div>
              </div>

              {/* Explanation (Optional) */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  شرح الحل أو ملاحظة تعليمية تظهر للطلاب بعد الإجابة (اختياري):
                </label>
                <textarea
                  dir="ltr"
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="e.g. Lists in Python are mutable sequences, meaning elements can be added, updated, or removed in place."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left font-sans"
                />
              </div>
            </div>

          </div>

          {/* Action buttons (Fixed Footer at bottom of dialog) */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shrink-0 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold cursor-pointer transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
            >
              {initialQuestion ? 'تحديث وحفظ التعديلات' : 'حفظ السؤال في البنك'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
