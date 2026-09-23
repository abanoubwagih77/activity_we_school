import React, { useState } from 'react';
import { Question, QuestionType, Difficulty } from '../../types';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Download, ArrowRight } from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface CsvImportModalProps {
  onImport: (questions: Omit<Question, 'id' | 'createdAt'>[]) => void;
  onClose: () => void;
}

interface ParsedRowResult {
  valid: boolean;
  rowNumber: number;
  data?: Omit<Question, 'id' | 'createdAt'>;
  errors: string[];
}

const SAMPLE_CSV = `Text,Type,Options,CorrectAnswer,Category,Difficulty,Points,CodeSnippet,Explanation
"What is the output of len([1, 2, 3])?","mcq","1|2|3|4","3","Python","easy",10,"","Built-in len() counts elements."
"In Python, tuples are mutable.","true_false","True|False","False","Python","easy",10,"","Tuples are strictly immutable."
"The keyword to define a function in Python is ___.","complete","def","def","Python","easy",10,"","Use def keyword."
"What does console.log(1 + '2') print?","code_output","3|12|NaN|Error","12","JavaScript","easy",10,"console.log(1 + '2');","Number coerced to string."
"Which Big-O is fastest?","mcq","O(1)|O(n)|O(n^2)|O(log n)","O(1)","Algorithms","medium",15,"","Constant time executes in fixed steps."`;

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ onImport, onClose }) => {
  const [csvContent, setCsvContent] = useState<string>('');
  const [parsedResults, setParsedResults] = useState<ParsedRowResult[] | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur);
      } else {
        cur += c;
      }
    }
    result.push(cur);
    return result;
  };

  const handleValidate = () => {
    if (!csvContent.trim()) return;

    const lines = csvContent.trim().split('\n');
    if (lines.length <= 1) {
      alert('الملف فارغ أو يحتوي على رأس الجدول فقط.');
      return;
    }

    const results: ParsedRowResult[] = [];
    for (let i = 1; i < lines.length; i++) {
      const rawLine = lines[i].trim();
      if (!rawLine) continue;

      const cols = parseCSVLine(rawLine).map(c => c.trim().replace(/^"|"$/g, ''));
      const rowErrors: string[] = [];

      const text = cols[0] || '';
      const typeRaw = (cols[1] || 'mcq').toLowerCase() as QuestionType;
      const optionsRaw = cols[2] || '';
      const correctAnswer = cols[3] || '';
      const category = cols[4] || 'General';
      const difficultyRaw = (cols[5] || 'easy').toLowerCase() as Difficulty;
      const points = parseInt(cols[6], 10) || 10;
      const codeSnippet = cols[7] || '';
      const explanation = cols[8] || '';

      if (!text) {
        rowErrors.push('نص السؤال بالإنجليزية مفقود (Missing question text)');
      }

      let options = optionsRaw.split('|').map(o => o.trim()).filter(Boolean);
      if (typeRaw === 'true_false') {
        if (options.length === 0) {
          options = ['True', 'False'];
        }
      } else if (typeRaw === 'complete') {
        if (options.length === 0 && correctAnswer) {
          options = [correctAnswer];
        }
      } else if (typeRaw === 'matching') {
        // ok
      } else if (options.length < 2) {
        rowErrors.push('يحتاج السؤال إلى خيارين على الأقل مفصولة بعلامة |');
      }

      if (!correctAnswer) {
        rowErrors.push('الإجابة الصحيحة مفقودة (Missing correct answer)');
      }

      const isValid = rowErrors.length === 0;

      results.push({
        valid: isValid,
        rowNumber: i + 1,
        errors: rowErrors,
        data: isValid
          ? {
              text,
              type: typeRaw,
              options: options.length > 0 ? options : [correctAnswer],
              correctAnswer,
              category,
              difficulty: difficultyRaw,
              points,
              codeSnippet: codeSnippet || undefined,
              language: 'python',
              explanation: explanation || undefined,
              tags: [category.toLowerCase()],
              timeLimit: 30,
            }
          : undefined,
      });
    }

    setParsedResults(results);
    soundEngine.playClick();
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
      soundEngine.playClick();
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob(['\uFEFF' + SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'questions_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validQuestions = parsedResults?.filter(r => r.valid && r.data).map(r => r.data!) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto" dir="rtl">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transition-colors animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              استيراد أسئلة من ملف Excel / CSV
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              قم بسحب وإفلات ملف CSV يحتوي على الأسئلة بالإنجليزية أو الصق المحتوى مباشرة
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 overscroll-contain">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
            <div>
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">هل تحتاج إلى نموذج جاهز للبدء؟</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">حمل ملف قالب تجريبي بصيغة CSV لملء أسئلتك به</span>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>تحميل ملف النموذج (Template)</span>
            </button>
          </div>

          {/* Drag and drop box */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`p-6 border-2 border-dashed rounded-2xl text-center transition-all ${
              dragActive ? 'border-indigo-500 bg-indigo-50/60' : 'border-slate-200 hover:border-indigo-300 bg-slate-50/50'
            }`}
          >
            <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">اسحب وأفلت ملف CSV هنا، أو اضغط للاختيار من جهازك</p>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="mt-3 text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
            />
          </div>

          {/* Direct Paste textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">أو الصق محتوى CSV مباشرة هنا:</label>
              <button
                type="button"
                onClick={() => setCsvContent(SAMPLE_CSV)}
                className="text-xs text-indigo-600 hover:underline font-bold"
              >
                تعبئة بيانات تجريبية
              </button>
            </div>
            <textarea
              dir="ltr"
              rows={5}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder='Text,Type,Options,CorrectAnswer,Category,Difficulty,Points,CodeSnippet,Explanation&#10;"What is 2+2?","mcq","1|2|3|4","4","Math","easy",10,"","Basic arithmetic"'
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left"
            />
          </div>

          {/* Validation Button */}
          <div className="flex justify-end">
            <button
              onClick={handleValidate}
              disabled={!csvContent.trim()}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-all shadow"
            >
              فحص وتحليل البيانات قبل الاستيراد
            </button>
          </div>

          {/* Preview of validation */}
          {parsedResults && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-800">نتيجة الفحص:</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {validQuestions.length} سؤال صالح للاستيراد
                  </span>
                  {parsedResults.some(r => !r.valid) && (
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                      {parsedResults.filter(r => !r.valid).length} سطر به أخطاء
                    </span>
                  )}
                </div>

                {validQuestions.length > 0 && (
                  <button
                    onClick={() => onImport(validQuestions)}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
                  >
                    تأكيد استيراد {validQuestions.length} سؤال إلى البنك
                  </button>
                )}
              </div>

              {/* Table preview */}
              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-50 text-slate-600 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">السطر</th>
                      <th className="p-2.5">الحالة</th>
                      <th className="p-2.5">السؤال (English)</th>
                      <th className="p-2.5">النوع</th>
                      <th className="p-2.5">الإجابة الصحيحة</th>
                      <th className="p-2.5">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedResults.map((r, idx) => (
                      <tr key={idx} className={r.valid ? 'hover:bg-slate-50/60' : 'bg-rose-50/40'}>
                        <td className="p-2.5 font-mono text-slate-500">{r.rowNumber}</td>
                        <td className="p-2.5 font-bold">
                          {r.valid ? (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> صالح
                            </span>
                          ) : (
                            <span className="text-rose-600 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> خطأ
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-medium text-slate-900" dir="ltr">{r.data?.text || '—'}</td>
                        <td className="p-2.5 font-mono text-slate-600">{r.data?.type || '—'}</td>
                        <td className="p-2.5 font-mono text-emerald-700" dir="ltr">{r.data?.correctAnswer || '—'}</td>
                        <td className="p-2.5 text-rose-600 text-[11px]">{r.errors.join('، ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
