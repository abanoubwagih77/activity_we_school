import React, { useState, useEffect, useRef } from 'react';
import { Question, Team } from '../../types';
import { soundEngine } from '../../utils/audio';
import { QuestionDisplay } from './QuestionDisplay';
import { RotateCw, ArrowRight, CheckCircle, RefreshCcw, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SpinWheelGameProps {
  questions: Question[];
  preventRepeats?: boolean;
  labelType?: 'number' | 'title' | 'question';
  onAwardPoints: (points: number, isCorrect: boolean) => void;
  teams?: Team[];
  selectedTeamId?: string;
  timerDuration?: number;
}

const WHEEL_COLORS = [
  '#4f46e5', '#06b6d4', '#10b981', '#f59e0b', 
  '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6',
  '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

export const SpinWheelGame: React.FC<SpinWheelGameProps> = ({
  questions,
  preventRepeats = true,
  labelType = 'question',
  onAwardPoints,
  timerDuration = 20,
}) => {
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spinVelocityRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  const availableQuestions = preventRepeats
    ? questions.filter(q => !usedQuestionIds.has(q.id))
    : questions;

  const activePool = availableQuestions.length > 0 ? availableQuestions : questions;

  // Draw wheel on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 15;
    const totalSlices = activePool.length;
    if (totalSlices === 0) return;

    const sliceAngle = (2 * Math.PI) / totalSlices;

    ctx.clearRect(0, 0, size, size);

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 6;
    ctx.stroke();

    activePool.forEach((q, i) => {
      const startAngle = rotationAngle + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Label text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Outfit, sans-serif';

      let text = `Q${i + 1}`;
      if (labelType === 'title') {
        text = q.category || `Q${i + 1}`;
      } else if (labelType === 'question') {
        text = q.text.length > 22 ? q.text.substring(0, 20) + '...' : q.text;
      }
      ctx.fillText(text, radius - 20, 5);
      ctx.restore();
    });

    // Center hub
    ctx.beginPath();
    ctx.arc(center, center, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }, [rotationAngle, activePool, labelType]);

  // Handle spin physics
  const spinWheel = () => {
    if (isSpinning || activePool.length === 0) return;
    setIsSpinning(true);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setIsRevealed(false);

    // Initial random speed (3 to 5 full rotations + random slice offset)
    const baseSpeed = 0.35 + Math.random() * 0.2;
    spinVelocityRef.current = baseSpeed;

    let lastTickAngle = rotationAngle;

    const animate = () => {
      setRotationAngle(prev => {
        const nextAngle = prev + spinVelocityRef.current;
        // Sound tick per spoke
        const sliceAngle = (2 * Math.PI) / activePool.length;
        if (Math.floor(nextAngle / sliceAngle) !== Math.floor(lastTickAngle / sliceAngle)) {
          soundEngine.playTick();
          lastTickAngle = nextAngle;
        }
        return nextAngle;
      });

      // Decelerate
      spinVelocityRef.current *= 0.985;

      if (spinVelocityRef.current > 0.002) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Stopped!
        setIsSpinning(false);
        soundEngine.playWheelStop();

        // Calculate selected slice at 3 o'clock (0 rad) or top (3*PI/2)
        // Canvas arrow is at the right edge (0 rad)
        setRotationAngle(finalAngle => {
          const sliceAngle = (2 * Math.PI) / activePool.length;
          const normalized = (2 * Math.PI - (finalAngle % (2 * Math.PI))) % (2 * Math.PI);
          const pickedIdx = Math.floor(normalized / sliceAngle) % activePool.length;
          const picked = activePool[pickedIdx];
          setCurrentQuestion(picked);
          return finalAngle;
        });
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  const handleSelectAnswer = (option: string) => {
    if (!currentQuestion) return;
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
  };

  const handleNextSpin = () => {
    if (currentQuestion && preventRepeats) {
      setUsedQuestionIds(prev => new Set([...prev, currentQuestion.id]));
    }
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setIsRevealed(false);
  };

  const handleResetWheel = () => {
    setUsedQuestionIds(new Set());
    setCurrentQuestion(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center p-4">
      {!currentQuestion ? (
        <div className="flex flex-col items-center text-center">
          {/* Top Status */}
          <div className="flex items-center gap-4 mb-4">
            <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-slate-800 border border-slate-700 text-slate-300">
              Remaining: {availableQuestions.length} / {questions.length} Questions
            </span>
            {usedQuestionIds.size > 0 && (
              <button
                onClick={handleResetWheel}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Reset Pool
              </button>
            )}
          </div>

          {/* Wheel Canvas with Pointer */}
          <div className="relative my-4 flex items-center justify-center">
            {/* Pointer arrow on the right pointing inwards */}
            <div className="absolute right-0 translate-x-2 z-20 w-0 h-0 border-t-[18px] border-t-transparent border-b-[18px] border-b-transparent border-r-[32px] border-r-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)] rotate-180" />

            <canvas
              ref={canvasRef}
              width={460}
              height={460}
              className="max-w-full drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
            />
          </div>

          {/* Spin Trigger Button */}
          <motion.button
            whileHover={!isSpinning ? { scale: 1.05 } : {}}
            whileTap={!isSpinning ? { scale: 0.95 } : {}}
            onClick={spinWheel}
            disabled={isSpinning || activePool.length === 0}
            className="mt-6 px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-2xl shadow-xl shadow-indigo-600/30 flex items-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCw className={`w-7 h-7 ${isSpinning ? 'animate-spin' : ''}`} />
            {isSpinning ? 'Spinning...' : 'SPIN THE WHEEL'}
          </motion.button>
        </div>
      ) : (
        /* Question Screen when wheel stops */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full flex flex-col items-center gap-6"
        >
          <div className="w-full flex items-center justify-between bg-slate-800/80 px-6 py-3 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-lg">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Question Landed!
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsRevealed(true)}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                Reveal Answer
              </button>
              <button
                onClick={handleNextSpin}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
              >
                Next Spin
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <QuestionDisplay
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            isAnswerRevealed={isRevealed}
            onSelectAnswer={handleSelectAnswer}
            timerDuration={timerDuration}
            onTimeUp={handleNextSpin}
          />
        </motion.div>
      )}
    </div>
  );
};
