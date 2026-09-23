import React, { useState } from 'react';
import { Question } from '../../types';
import { soundEngine } from '../../utils/audio';
import { QuestionDisplay } from './QuestionDisplay';
import { ArrowRight, ArrowLeft, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface TrueFalseGameProps {
  questions: Question[];
  onAwardPoints: (points: number, isCorrect: boolean) => void;
  onFinish: () => void;
  timerDuration?: number;
}

export const TrueFalseGame: React.FC<TrueFalseGameProps> = ({
  questions,
  onAwardPoints,
  onFinish,
  timerDuration = 20,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  const currentQuestion = questions[currentIndex];

  const handleSelect = (option: string) => {
    if (!currentQuestion) return;
    setSelectedAnswer(option);
    const isCorrect = option !== '' && option !== '__TIME_UP__' && option.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
    if (isCorrect) {
      soundEngine.playCorrect();
      onAwardPoints(currentQuestion.points, true);
    } else {
      if (option !== '__TIME_UP__') {
        soundEngine.playWrong();
      }
      onAwardPoints(0, false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsRevealed(false);
      soundEngine.playCardFlip();
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setIsRevealed(false);
      soundEngine.playClick();
    }
  };

  if (!currentQuestion) {
    return (
      <div className="text-center p-8 text-slate-400">
        No True/False questions available in this activity.
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 p-4">
      {/* Top Progress bar & navigation */}
      <div className="w-full flex items-center justify-between bg-slate-800/80 px-6 py-3 rounded-2xl border border-slate-700">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-300">
            Statement {currentIndex + 1} of {questions.length}
          </span>
        </div>

        {/* Mini progress ticks */}
        <div className="hidden sm:flex items-center gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === currentIndex
                  ? 'w-8 bg-indigo-500'
                  : i < currentIndex
                  ? 'w-3 bg-emerald-500/80'
                  : 'w-3 bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRevealed(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold cursor-pointer"
          >
            Reveal
          </button>
          <button
            onClick={handleNext}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Question Display */}
      <QuestionDisplay
        question={currentQuestion}
        selectedAnswer={selectedAnswer}
        isAnswerRevealed={isRevealed}
        onSelectAnswer={handleSelect}
        timerDuration={timerDuration}
        onTimeUp={handleNext}
      />
    </div>
  );
};
