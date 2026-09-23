import React, { useState } from 'react';
import { Question } from '../../types';
import { CheckCircle2, XCircle, Code2, Image as ImageIcon, Lightbulb, HelpCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuestionDisplayProps {
  question: Question;
  selectedAnswer: string | null;
  isAnswerRevealed: boolean;
  onSelectAnswer: (option: string) => void;
  disabled?: boolean;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  selectedAnswer,
  isAnswerRevealed,
  onSelectAnswer,
  disabled = false,
}) => {
  const [completeInput, setCompleteInput] = useState('');
  const isAnswered = selectedAnswer !== null || isAnswerRevealed;
  const isCorrect = selectedAnswer?.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase();

  const getOptionLetter = (index: number) => {
    return String.fromCharCode(65 + index); // A, B, C, D
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeInput.trim() || isAnswered) return;
    onSelectAnswer(completeInput.trim());
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6" dir="ltr">
      {/* Question Header & Category Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
            {question.category || 'Computer Science'}
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
                    {isCorrect ? 'Awesome! Correct Answer!' : 'Correct Answer:'}
                  </h4>
                  <span className="font-mono px-3.5 py-1 rounded-xl bg-white text-emerald-700 border border-emerald-300 text-base font-black shadow-sm">
                    {question.correctAnswer}
                  </span>
                </div>
                {question.explanation && (
                  <div className="mt-3 text-base text-slate-700 leading-relaxed">
                    <strong className="text-slate-900 block mb-1">Teaching Explanation:</strong>
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
