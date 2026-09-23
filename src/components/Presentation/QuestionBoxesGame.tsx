import React, { useState } from 'react';
import { Question, BoxBehavior } from '../../types';
import { soundEngine } from '../../utils/audio';
import { QuestionDisplay } from './QuestionDisplay';
import { ArrowLeft, Check, Eye, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuestionBoxesGameProps {
  questions: Question[];
  boxBehavior?: BoxBehavior;
  onAwardPoints: (points: number, isCorrect: boolean) => void;
  timerDuration?: number;
}

export const QuestionBoxesGame: React.FC<QuestionBoxesGameProps> = ({
  questions,
  boxBehavior = 'dimmed',
  onAwardPoints,
  timerDuration = 20,
}) => {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
  const [usedBoxIndices, setUsedBoxIndices] = useState<Set<number>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [behavior, setBehavior] = useState<BoxBehavior>(boxBehavior);

  const currentQuestion = activeQuestionIndex !== null ? questions[activeQuestionIndex] : null;

  const handleBoxClick = (index: number) => {
    if (usedBoxIndices.has(index) && behavior === 'disabled') return;
    soundEngine.playCardFlip();
    setActiveQuestionIndex(index);
    setSelectedAnswer(null);
    setIsRevealed(false);
  };

  const handleSelectAnswer = (option: string) => {
    if (!currentQuestion || activeQuestionIndex === null) return;
    setSelectedAnswer(option);
    const isCorrect = option !== '' && option !== '__TIME_UP__' && option === currentQuestion.correctAnswer;
    if (isCorrect) {
      soundEngine.playCorrect();
      onAwardPoints(currentQuestion.points, true);
    } else {
      if (option !== '__TIME_UP__') {
        soundEngine.playWrong();
      }
      onAwardPoints(0, false);
    }
    setUsedBoxIndices(prev => new Set([...prev, activeQuestionIndex]));
  };

  const handleBackToGrid = () => {
    if (activeQuestionIndex !== null) {
      setUsedBoxIndices(prev => new Set([...prev, activeQuestionIndex]));
    }
    setActiveQuestionIndex(null);
    setSelectedAnswer(null);
    setIsRevealed(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center p-4">
      {!currentQuestion ? (
        <div className="w-full flex flex-col items-center">
          {/* Header & Settings */}
          <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
            <div>
              <h3 className="text-xl font-extrabold text-white">Choose a Question Box</h3>
              <p className="text-sm text-slate-400">Ask the classroom to call out a number to unlock a coding question</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Box Behavior:</span>
              <select
                value={behavior}
                onChange={(e) => setBehavior(e.target.value as BoxBehavior)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="dimmed">Mark as Used (Dimmed)</option>
                <option value="disappear">Disappear after use</option>
                <option value="disabled">Disable after use</option>
              </select>
            </div>
          </div>

          {/* Boxes Grid */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {questions.map((q, idx) => {
              const isUsed = usedBoxIndices.has(idx);

              if (isUsed && behavior === 'disappear') {
                return (
                  <div
                    key={idx}
                    className="h-32 md:h-40 rounded-2xl border-2 border-dashed border-slate-800/60 flex items-center justify-center text-slate-700 font-mono"
                  >
                    Opened #{idx + 1}
                  </div>
                );
              }

              let boxStyle = 'bg-gradient-to-br from-indigo-900/60 to-slate-800/90 border-indigo-500/40 text-white hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/20';

              if (isUsed) {
                if (behavior === 'dimmed') {
                  boxStyle = 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60';
                } else if (behavior === 'disabled') {
                  boxStyle = 'bg-slate-900/90 border-slate-800 text-slate-600 cursor-not-allowed opacity-50';
                }
              }

              return (
                <motion.button
                  key={idx}
                  whileHover={!(isUsed && behavior === 'disabled') ? { scale: 1.04, y: -4 } : {}}
                  whileTap={!(isUsed && behavior === 'disabled') ? { scale: 0.96 } : {}}
                  onClick={() => handleBoxClick(idx)}
                  disabled={isUsed && behavior === 'disabled'}
                  className={`relative h-32 md:h-40 rounded-2xl border-2 p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-lg overflow-hidden group ${boxStyle}`}
                >
                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/10 rounded-bl-full pointer-events-none" />

                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
                      BOX
                    </span>
                    {isUsed && (
                      <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="text-3xl md:text-5xl font-black text-center text-white tracking-tight group-hover:text-indigo-200">
                    {idx + 1}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{q.category}</span>
                    <span className="font-mono text-indigo-300 font-semibold">{q.points} pts</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Active Question Display */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full flex flex-col items-center gap-6"
        >
          <div className="w-full flex items-center justify-between bg-slate-800/80 px-6 py-3 rounded-2xl border border-slate-700">
            <button
              onClick={handleBackToGrid}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-sm flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Boxes
            </button>
            <div className="text-white font-extrabold text-lg">
              Box #{activeQuestionIndex! + 1}
            </div>
            <button
              onClick={() => setIsRevealed(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <Eye className="w-4 h-4" />
              Reveal Answer
            </button>
          </div>

          <QuestionDisplay
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            isAnswerRevealed={isRevealed}
            onSelectAnswer={handleSelectAnswer}
            timerDuration={timerDuration}
            onTimeUp={handleBackToGrid}
          />
        </motion.div>
      )}
    </div>
  );
};
