import React, { useState, useMemo } from 'react';
import { Question, Team } from '../../types';
import { soundEngine } from '../../utils/audio';
import { QuestionDisplay } from './QuestionDisplay';
import { ArrowLeft, Check, Trophy, Eye, Plus, Minus } from 'lucide-react';
import { motion } from 'motion/react';

interface JeopardyGameProps {
  questions: Question[];
  teams?: Team[];
  onAwardPoints: (points: number, isCorrect: boolean) => void;
  onUpdateTeamScore?: (teamId: string, delta: number) => void;
  timerDuration?: number;
}

interface JeopardyCell {
  category: string;
  points: number;
  question: Question;
  isUsed: boolean;
}

export const JeopardyGame: React.FC<JeopardyGameProps> = ({
  questions,
  teams,
  onAwardPoints,
  onUpdateTeamScore,
  timerDuration = 20,
}) => {
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [activePoints, setActivePoints] = useState<number>(100);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  // Group questions into 4 to 5 categories with progressive points (100, 200, 300, 400)
  const categoriesData = useMemo(() => {
    // Unique categories or fallback
    const catsMap: { [cat: string]: Question[] } = {};
    questions.forEach(q => {
      const cat = q.category || 'General';
      if (!catsMap[cat]) catsMap[cat] = [];
      catsMap[cat].push(q);
    });

    const categoryNames = Object.keys(catsMap).slice(0, 5);
    const POINT_STEPS = [100, 200, 300, 400];

    return categoryNames.map(catName => {
      const catQuestions = catsMap[catName];
      const cells: JeopardyCell[] = POINT_STEPS.map((pts, idx) => {
        const q = catQuestions[idx % catQuestions.length];
        return {
          category: catName,
          points: pts,
          question: q,
          isUsed: q ? usedQuestionIds.has(`${catName}-${pts}`) : false,
        };
      });
      return {
        name: catName,
        cells,
      };
    });
  }, [questions, usedQuestionIds]);

  const handleCellClick = (catName: string, points: number, q: Question) => {
    const key = `${catName}-${points}`;
    if (usedQuestionIds.has(key) || !q) return;

    soundEngine.playCardFlip();
    setActiveQuestion(q);
    setActivePoints(points);
    setSelectedAnswer(null);
    setIsRevealed(false);
  };

  const handleSelectAnswer = (option: string) => {
    if (!activeQuestion) return;
    setSelectedAnswer(option);
    const isCorrect = option !== '' && option !== '__TIME_UP__' && option === activeQuestion.correctAnswer;
    if (isCorrect) {
      soundEngine.playCorrect();
      onAwardPoints(activePoints, true);
    } else {
      if (option !== '__TIME_UP__') {
        soundEngine.playWrong();
      }
      onAwardPoints(0, false);
    }
  };

  const handleBackToBoard = () => {
    if (activeQuestion) {
      const key = `${activeQuestion.category || 'General'}-${activePoints}`;
      setUsedQuestionIds(prev => new Set([...prev, key]));
    }
    setActiveQuestion(null);
    setSelectedAnswer(null);
    setIsRevealed(false);
    soundEngine.playClick();
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-6 p-4">
      {!activeQuestion ? (
        <div className="w-full flex flex-col items-center">
          {/* Header & Teams Bar */}
          <div className="w-full bg-slate-800/80 p-5 rounded-3xl border border-slate-700 mb-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Jeopardy Tech Challenge</h2>
                <p className="text-sm text-slate-400">
                  Select a category and wager points for the classroom
                </p>
              </div>

              {/* Mini Team Scores if available */}
              {teams && teams.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {teams.map(t => (
                    <div
                      key={t.id}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center gap-2 text-xs"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="font-bold text-slate-200">{t.name}:</span>
                      <span className="font-mono font-black text-indigo-300">{t.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Jeopardy Matrix Board */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {categoriesData.map((cat, catIdx) => (
              <div key={catIdx} className="flex flex-col gap-3">
                {/* Category Header */}
                <div className="h-16 rounded-2xl bg-indigo-950/90 border-2 border-indigo-500/50 p-3 flex items-center justify-center text-center shadow-md">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-indigo-200 line-clamp-2">
                    {cat.name}
                  </span>
                </div>

                {/* Point Tiles */}
                {cat.cells.map((cell, rowIdx) => {
                  const key = `${cat.name}-${cell.points}`;
                  const isUsed = usedQuestionIds.has(key);

                  return (
                    <motion.button
                      key={rowIdx}
                      whileHover={!isUsed ? { scale: 1.04, y: -2 } : {}}
                      whileTap={!isUsed ? { scale: 0.96 } : {}}
                      onClick={() => handleCellClick(cat.name, cell.points, cell.question)}
                      disabled={isUsed || !cell.question}
                      className={`h-20 md:h-24 rounded-2xl border-2 font-black text-2xl md:text-3xl font-mono flex items-center justify-center transition-all duration-200 cursor-pointer disabled:cursor-default relative shadow-lg ${
                        isUsed
                          ? 'bg-slate-900/60 border-slate-800 text-slate-600 opacity-40'
                          : 'bg-gradient-to-b from-blue-900/80 to-indigo-950 border-blue-500/40 text-amber-400 hover:border-amber-400 hover:shadow-amber-500/10'
                      }`}
                    >
                      {isUsed ? (
                        <Check className="w-6 h-6 text-slate-600" />
                      ) : (
                        `$${cell.points}`
                      )}
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Active Question Display */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full flex flex-col items-center gap-6"
        >
          <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-slate-800/80 px-6 py-3 rounded-2xl border border-slate-700">
            <button
              onClick={handleBackToBoard}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-sm flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Jeopardy Board
            </button>

            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-indigo-300 uppercase">
                {activeQuestion.category}
              </span>
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono font-black text-base">
                ${activePoints}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRevealed(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
              >
                <Eye className="w-4 h-4" />
                Reveal Answer
              </button>
            </div>
          </div>

          <QuestionDisplay
            question={activeQuestion}
            selectedAnswer={selectedAnswer}
            isAnswerRevealed={isRevealed}
            onSelectAnswer={handleSelectAnswer}
            timerDuration={timerDuration}
            onTimeUp={handleBackToBoard}
          />
        </motion.div>
      )}
    </div>
  );
};
