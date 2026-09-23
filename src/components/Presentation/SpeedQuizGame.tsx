import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { soundEngine } from '../../utils/audio';
import { QuestionDisplay } from './QuestionDisplay';
import { Clock, ArrowRight, Zap, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SpeedQuizGameProps {
  questions: Question[];
  timerDurationSeconds?: number;
  onAwardPoints: (points: number, isCorrect: boolean) => void;
  onFinish: () => void;
}

export const SpeedQuizGame: React.FC<SpeedQuizGameProps> = ({
  questions,
  timerDurationSeconds = 15,
  onAwardPoints,
  onFinish,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);

  // Timer state
  const questionTimeLimit = questions[currentIndex]?.timeLimit || timerDurationSeconds || 15;
  const [timeLeft, setTimeLeft] = useState<number>(questionTimeLimit);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [isTimesUp, setIsTimesUp] = useState<boolean>(false);

  const currentQuestion = questions[currentIndex];

  // Reset timer on question change
  useEffect(() => {
    setTimeLeft(questionTimeLimit);
    setIsTimesUp(false);
    setIsTimerRunning(true);
    setSelectedAnswer(null);
    setIsRevealed(false);
  }, [currentIndex, questionTimeLimit]);

  // Countdown loop
  useEffect(() => {
    if (!isTimerRunning || isTimesUp || selectedAnswer !== null) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimesUp(true);
          setIsTimerRunning(false);
          soundEngine.playTimesUp();
          return 0;
        }
        if (prev <= 5) {
          soundEngine.playTick(850);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, isTimesUp, selectedAnswer]);

  const handleSelectAnswer = (option: string) => {
    if (!currentQuestion) return;
    setIsTimerRunning(false);
    setSelectedAnswer(option);

    const isCorrect = option === currentQuestion.correctAnswer;
    if (isCorrect) {
      soundEngine.playCorrect();
      // Time bonus: up to +5 extra bonus if answered with > 50% time left
      const timeBonus = timeLeft > questionTimeLimit / 2 ? 5 : 0;
      const streakBonus = streak >= 2 ? 5 : 0;
      onAwardPoints(currentQuestion.points + timeBonus + streakBonus, true);
      setStreak(prev => prev + 1);
    } else {
      soundEngine.playWrong();
      onAwardPoints(0, false);
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      soundEngine.playCardFlip();
    } else {
      onFinish();
    }
  };

  // Timer percentage for color styling
  const timerPercent = (timeLeft / questionTimeLimit) * 100;
  const isUrgent = timeLeft <= 5;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 p-4">
      {/* Speed Quiz Status Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 bg-slate-800/90 px-6 py-4 rounded-3xl border border-slate-700 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-slate-400">Speed Quiz</span>
            <div className="text-lg font-black text-white">
              Question {currentIndex + 1} of {questions.length}
            </div>
          </div>
        </div>

        {/* Big Projector Timer Display */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 transition-all ${
            isTimesUp
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
              : isUrgent
              ? 'bg-amber-950/80 border-amber-500 text-amber-300 scale-105 ring-2 ring-amber-500/50'
              : 'bg-slate-900 border-indigo-500/40 text-indigo-300'
          }`}>
            <Clock className={`w-6 h-6 ${isUrgent ? 'text-amber-400 animate-bounce' : ''}`} />
            <span className="font-mono text-2xl md:text-3xl font-black">
              {isTimesUp ? "TIME'S UP!" : `${timeLeft}s`}
            </span>
          </div>

          {streak >= 2 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 border border-orange-500/40 font-bold text-xs">
              <Zap className="w-4 h-4 fill-orange-400" />
              {streak}x Streak!
            </div>
          )}
        </div>

        {/* Action button */}
        <div>
          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full transition-all duration-300 ${
            isTimesUp ? 'bg-rose-500' : isUrgent ? 'bg-amber-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Time's Up Banner alert if expired */}
      {isTimesUp && selectedAnswer === null && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-500 text-rose-200 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
            <span className="font-bold text-base md:text-lg">
              Time is up! Students can still give their final oral answer, or teacher can reveal the solution.
            </span>
          </div>
          <button
            onClick={() => setIsRevealed(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
          >
            Reveal Solution
          </button>
        </motion.div>
      )}

      {/* Main Question Display */}
      {currentQuestion && (
        <QuestionDisplay
          question={currentQuestion}
          selectedAnswer={selectedAnswer}
          isAnswerRevealed={isRevealed}
          onSelectAnswer={handleSelectAnswer}
          showTimer={false}
        />
      )}
    </div>
  );
};
