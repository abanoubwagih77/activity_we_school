import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../../types';
import { CheckCircle2, XCircle, Code2, Lightbulb, Clock, Pause, Play, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundEngine } from '../../utils/audio';

interface QuestionDisplayProps {
  question: Question;
  selectedAnswer: string | null;
  isAnswerRevealed: boolean;
  onSelectAnswer: (option: string) => void;
  disabled?: boolean;
  showTimer?: boolean;
  timerDuration?: number;
  onTimeUp?: () => void;
  autoHideOnTimeUp?: boolean;
  autoHideDelayMs?: number;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  selectedAnswer,
  isAnswerRevealed,
  onSelectAnswer,
  disabled = false,
  showTimer = true,
  timerDuration = 20,
  onTimeUp,
  autoHideOnTimeUp = true,
  autoHideDelayMs = 2000,
}) => {
  const [completeInput, setCompleteInput] = useState('');
  const totalSeconds = question.timeLimit || timerDuration || 20;

  // Timer states
  const [timeLeft, setTimeLeft] = useState<number>(totalSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isTimeExpired, setIsTimeExpired] = useState<boolean>(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAnswered = selectedAnswer !== null || isAnswerRevealed || isTimeExpired;
  const isCorrect = 
    Boolean(selectedAnswer) && 
    selectedAnswer !== '__TIME_UP__' && 
    selectedAnswer?.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase();

  // Reset timer on question change
  useEffect(() => {
    const duration = question.timeLimit || timerDuration || 20;
    setTimeLeft(duration);
    setIsPaused(false);
    setIsTimeExpired(false);
    setCompleteInput('');

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (autoHideTimeoutRef.current) clearTimeout(autoHideTimeoutRef.current);
  }, [question.id, question.timeLimit, timerDuration]);

  // Countdown timer loop
  useEffect(() => {
    if (!showTimer) return;
    if (isAnswered || isPaused || isTimeExpired) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsTimeExpired(true);
          soundEngine.playTimesUp();

          // Mark as wrong answer
          onSelectAnswer('__TIME_UP__');

          // Auto-hide and return after brief feedback delay
          if (onTimeUp && autoHideOnTimeUp) {
            autoHideTimeoutRef.current = setTimeout(() => {
              onTimeUp();
            }, autoHideDelayMs);
          }

          return 0;
        }

        // Auditory tension tick in final 5 seconds
        if (prev <= 6) {
          soundEngine.playTick(850);
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showTimer, isAnswered, isPaused, isTimeExpired, onSelectAnswer, onTimeUp, autoHideOnTimeUp, autoHideDelayMs]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (autoHideTimeoutRef.current) clearTimeout(autoHideTimeoutRef.current);
    };
  }, []);

  const handleManualDismiss = () => {
    if (autoHideTimeoutRef.current) clearTimeout(autoHideTimeoutRef.current);
    if (onTimeUp) onTimeUp();
  };

  const getOptionLetter = (index: number) => {
    return String.fromCharCode(65 + index); // A, B, C, D
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeInput.trim() || isAnswered) return;
    onSelectAnswer(completeInput.trim());
  };

  // Timer visual percentages & urgency
  const timerPercent = Math.max(0, Math.min(100, (timeLeft / totalSeconds) * 100));
  const isUrgent = timeLeft <= 5 && timeLeft > 0;
  const isWarning = timeLeft <= 10 && timeLeft > 5;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-5" dir="ltr">
      {/* Top Question Category & Points Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
            {question.category || 'General'}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            {question.type.replace('_', ' ')}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            question.difficulty === 'easy'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : question.difficulty === 'medium'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {question.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 text-sm font-bold font-mono">
          <span className="bg-white px-3.5 py-1 rounded-xl border border-slate-200 shadow-sm">
            +{question.points} Points
          </span>
        </div>
      </div>

      {/* QUESTION COUNTDOWN TIMER & PROGRESS BAR */}
      {showTimer && (
        <div 
          className={`w-full rounded-2xl p-4 border transition-all duration-300 shadow-sm ${
            isTimeExpired
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 ring-2 ring-rose-500/20'
              : isUrgent
              ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/30'
              : isWarning
              ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
          dir="rtl"
        >
          <div className="flex items-center justify-between gap-3 mb-2.5">
            {/* Clock icon & descriptive label */}
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl transition-all ${
                isTimeExpired
                  ? 'bg-rose-600 text-white shadow-md'
                  : isUrgent
                  ? 'bg-rose-500 text-white animate-bounce shadow-md'
                  : isWarning
                  ? 'bg-amber-500 text-white'
                  : 'bg-purple-100 text-[#5B2D82] dark:bg-purple-950 dark:text-purple-300'
              }`}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">
                  {isTimeExpired ? 'انتهت المهلة' : 'المهلة الزمنية للإجابة'}
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
                  {isTimeExpired 
                    ? 'انتهى الوقت المحدد للسؤال!' 
                    : isPaused 
                    ? 'العداد متوقف مؤقتاً' 
                    : isAnswered 
                    ? 'تم تسجيل الإجابة' 
                    : 'أجب قبل انتهاء الوقت!'}
                </span>
              </div>
            </div>

            {/* Digits & Pause/Play toggle */}
            <div className="flex items-center gap-2.5">
              {!isAnswered && !isTimeExpired && (
                <button
                  type="button"
                  onClick={() => setIsPaused(p => !p)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                  title={isPaused ? 'استئناف الوقت' : 'إيقاف مؤقت'}
                >
                  {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                </button>
              )}

              {/* Big Digital Countdown Badge */}
              <div 
                className={`px-4 py-1.5 rounded-xl font-mono font-black text-2xl md:text-3xl flex items-center gap-1.5 border-2 transition-all ${
                  isTimeExpired
                    ? 'bg-rose-600 text-white border-rose-700 shadow-lg animate-pulse'
                    : isUrgent
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-400 scale-105 shadow-md ring-2 ring-rose-500/40'
                    : isWarning
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-400'
                    : 'bg-purple-50 dark:bg-purple-950/60 text-[#5B2D82] dark:text-purple-300 border-purple-200 dark:border-purple-800'
                }`}
                dir="ltr"
              >
                <span>{timeLeft}</span>
                <span className="text-xs font-sans font-bold">s</span>
              </div>
            </div>
          </div>

          {/* Smooth Shrinking Progress Bar */}
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                isTimeExpired
                  ? 'bg-rose-600'
                  : isUrgent
                  ? 'bg-gradient-to-r from-rose-600 to-red-500 shadow-sm shadow-rose-500/50'
                  : isWarning
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : 'bg-gradient-to-r from-[#5B2D82] via-purple-600 to-indigo-600'
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>

          {/* Time Expired Notice & Instant Dismissal */}
          {isTimeExpired && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-rose-600 text-white rounded-xl flex items-center justify-between gap-3 shadow-md"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />
                <span className="font-extrabold text-xs sm:text-sm">
                  انتهى الوقت! تم احتساب السؤال كإجابة غير صحيحة.
                </span>
              </div>
              {onTimeUp && (
                <button
                  type="button"
                  onClick={handleManualDismiss}
                  className="px-3.5 py-1.5 rounded-lg bg-white text-rose-700 hover:bg-rose-50 text-xs font-black shrink-0 cursor-pointer shadow transition-all"
                >
                  إغلاق السؤال الآن
                </button>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Main Question Text - High Contrast for Projector */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-left">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 leading-snug tracking-tight">
          {question.text}
        </h2>

        {/* Optional Code Snippet Block */}
        {question.codeSnippet && (
          <div className="mt-5 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span className="font-bold uppercase text-indigo-300">{question.language || 'Code'}</span>
              </div>
              <span className="text-slate-500 font-medium">Classroom Code Viewer</span>
            </div>
            <pre className="p-5 text-base md:text-lg font-mono text-emerald-300 overflow-x-auto leading-relaxed">
              <code>{question.codeSnippet}</code>
            </pre>
          </div>
        )}

        {/* Optional Image */}
        {question.imageUrl && (
          <div className="mt-5 rounded-2xl overflow-hidden border border-slate-200 max-h-80 flex items-center justify-center bg-slate-50">
            <img
              src={question.imageUrl}
              alt="Question diagram"
              className="max-h-80 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>

      {/* QUESTION INTERACTION BASED ON TYPE */}
      {question.type === 'complete' ? (
        /* Fill in the blank format */
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <form onSubmit={handleCompleteSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={completeInput}
              onChange={(e) => setCompleteInput(e.target.value)}
              disabled={disabled || isAnswered}
              placeholder="Type student answer here..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-5 py-4 text-base sm:text-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={disabled || isAnswered || !completeInput.trim()}
              className="px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-base cursor-pointer shadow-md shadow-indigo-600/20"
            >
              Submit Answer
            </button>
            {!isAnswered && (
              <button
                type="button"
                onClick={() => onSelectAnswer(question.correctAnswer)}
                className="px-5 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer border border-slate-200"
              >
                Reveal Answer
              </button>
            )}
          </form>
        </div>
      ) : question.type === 'matching' && question.matchingPairs ? (
        /* Matching format view */
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">
            Match the following pairs:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.matchingPairs.map((pair, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <span className="font-bold text-slate-900 font-mono">{pair.left}</span>
                <span className="text-slate-400 font-bold">⇄</span>
                <span className="text-slate-700">{pair.right}</span>
              </div>
            ))}
          </div>
          {!isAnswered && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onSelectAnswer(question.correctAnswer)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow cursor-pointer"
              >
                Mark as Completed / Correct
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Standard Options Grid (MCQ, True/False, Code Output) */
        <div className={`grid gap-4 ${
          question.type === 'true_false' || (question.options && question.options.length <= 2)
            ? 'grid-cols-1 sm:grid-cols-2' 
            : 'grid-cols-1 sm:grid-cols-2'
        }`}>
          {question.options && question.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isThisCorrect = option.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
            
            let stateStyle = 'bg-white hover:bg-indigo-50/40 border-slate-200 text-slate-800 hover:border-indigo-400 shadow-sm hover:shadow';

            if (isAnswered) {
              if (isThisCorrect) {
                stateStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-md ring-2 ring-emerald-500/30 scale-[1.01]';
              } else if (isSelected && !isThisCorrect) {
                stateStyle = 'bg-rose-50 border-rose-400 text-rose-900 shadow-sm line-through opacity-85';
              } else {
                stateStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
              }
            }

            const letter = getOptionLetter(idx);

            return (
              <motion.button
                key={idx}
                whileHover={!disabled && !isAnswered ? { scale: 1.01 } : {}}
                whileTap={!disabled && !isAnswered ? { scale: 0.99 } : {}}
                onClick={() => !disabled && !isAnswered && onSelectAnswer(option)}
                disabled={disabled || isAnswered}
                className={`p-5 md:p-6 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-4 cursor-pointer disabled:cursor-default ${stateStyle}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-bold text-lg md:text-xl shrink-0 ${
                    isAnswered && isThisCorrect
                      ? 'bg-emerald-600 text-white shadow'
                      : isAnswered && isSelected && !isThisCorrect
                      ? 'bg-rose-600 text-white shadow'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {question.type === 'true_false' 
                      ? (option === 'True' ? 'T' : 'F') 
                      : letter}
                  </span>
                  <span className="text-base md:text-lg lg:text-xl font-bold leading-snug break-words">
                    {option}
                  </span>
                </div>

                {/* Status icon feedback */}
                <div className="shrink-0">
                  {isAnswered && isThisCorrect && (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-bounce" />
                  )}
                  {isAnswered && isSelected && !isThisCorrect && (
                    <XCircle className="w-8 h-8 text-rose-600" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Answer Feedback & Teaching Note / Explanation */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-6 rounded-3xl border shadow-sm ${
              isCorrect
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm shrink-0">
                {isCorrect ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                ) : (
                  <Lightbulb className="w-7 h-7 text-amber-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg md:text-xl font-black">
                    {isCorrect 
                      ? 'إجابة صحيحة وممتازة! 🎉' 
                      : selectedAnswer === '__TIME_UP__'
                      ? 'انتهى الوقت! الإجابة الصحيحة كانت:'
                      : 'الإجابة الصحيحة:'}
                  </h4>
                  <span className="font-mono px-3.5 py-1 rounded-xl bg-white text-emerald-700 border border-emerald-300 text-base font-black shadow-sm">
                    {question.correctAnswer}
                  </span>
                </div>
                {question.explanation && (
                  <div className="mt-3 text-base text-slate-700 leading-relaxed">
                    <strong className="text-slate-900 block mb-1">شرح تعليمي / توضيح:</strong>
                    {question.explanation}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
