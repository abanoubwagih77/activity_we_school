import React, { useState, useEffect } from 'react';
import { MatchingPair } from '../../types';
import { DEFAULT_MATCHING_PAIRS } from '../../data/defaultData';
import { soundEngine } from '../../utils/audio';
import { Link2, Check, RefreshCcw, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

interface MatchingGameProps {
  pairs?: MatchingPair[];
  onAwardPoints: (points: number, isCorrect: boolean) => void;
  onFinish?: () => void;
}

export const MatchingGame: React.FC<MatchingGameProps> = ({
  pairs = DEFAULT_MATCHING_PAIRS.slice(0, 6),
  onAwardPoints,
  onFinish,
}) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [mismatchError, setMismatchError] = useState<boolean>(false);

  // Shuffled arrays
  const [leftItems, setLeftItems] = useState<{ id: string; text: string }[]>([]);
  const [rightItems, setRightItems] = useState<{ id: string; text: string }[]>([]);

  useEffect(() => {
    resetGame();
  }, [pairs]);

  const resetGame = () => {
    const lefts = pairs.map(p => ({ id: p.id, text: p.left })).sort(() => 0.5 - Math.random());
    const rights = pairs.map(p => ({ id: p.id, text: p.right })).sort(() => 0.5 - Math.random());
    setLeftItems(lefts);
    setRightItems(rights);
    setMatchedIds(new Set());
    setSelectedLeft(null);
    setSelectedRight(null);
    setMismatchError(false);
  };

  const handleLeftClick = (id: string) => {
    if (matchedIds.has(id)) return;
    soundEngine.playClick();
    setSelectedLeft(id);
    setMismatchError(false);

    if (selectedRight) {
      checkMatch(id, selectedRight);
    }
  };

  const handleRightClick = (id: string) => {
    if (matchedIds.has(id)) return;
    soundEngine.playClick();
    setSelectedRight(id);
    setMismatchError(false);

    if (selectedLeft) {
      checkMatch(selectedLeft, id);
    }
  };

  const checkMatch = (leftId: string, rightId: string) => {
    if (leftId === rightId) {
      // Match found!
      soundEngine.playCorrect();
      onAwardPoints(15, true);
      const newMatched = new Set([...matchedIds, leftId]);
      setMatchedIds(newMatched);
      setSelectedLeft(null);
      setSelectedRight(null);

      // If all matched!
      if (newMatched.size === pairs.length) {
        soundEngine.playVictory();
        try {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        } catch {}
      }
    } else {
      // Mismatch
      soundEngine.playWrong();
      setMismatchError(true);
      setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
        setMismatchError(false);
      }, 900);
    }
  };

  const isAllComplete = matchedIds.size === pairs.length && pairs.length > 0;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-6 p-4">
      {/* Header instructions */}
      <div className="w-full flex items-center justify-between bg-slate-800/80 px-6 py-4 rounded-3xl border border-slate-700 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-extrabold text-white">Matching Game</h3>
            <p className="text-xs md:text-sm text-slate-400">
              Students orally connect the concept on the left with its definition on the right
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-sm font-bold text-indigo-300 font-mono">
            {matchedIds.size} / {pairs.length} Matched
          </span>
          <button
            onClick={resetGame}
            className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer"
            title="Reset Game"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Matching Columns Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Left Column (Terms / Concepts) */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider px-2">
            Concepts / Code
          </div>
          {leftItems.map((item) => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedLeft === item.id;

            return (
              <motion.button
                key={item.id}
                whileHover={!isMatched ? { scale: 1.015 } : {}}
                whileTap={!isMatched ? { scale: 0.985 } : {}}
                onClick={() => handleLeftClick(item.id)}
                disabled={isMatched}
                className={`min-h-[72px] p-4 md:p-5 rounded-2xl border-2 text-left font-bold text-base md:text-lg transition-all flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${
                  isMatched
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/10 opacity-80'
                    : isSelected
                    ? mismatchError
                      ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500'
                      : 'bg-indigo-950/90 border-indigo-500 text-indigo-100 ring-2 ring-indigo-400 shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-100'
                }`}
              >
                <span>{item.text}</span>
                {isMatched && <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
              </motion.button>
            );
          })}
        </div>

        {/* Right Column (Definitions / Outputs) */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-bold text-purple-300 uppercase tracking-wider px-2">
            Outputs / Definitions
          </div>
          {rightItems.map((item) => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedRight === item.id;

            return (
              <motion.button
                key={item.id}
                whileHover={!isMatched ? { scale: 1.015 } : {}}
                whileTap={!isMatched ? { scale: 0.985 } : {}}
                onClick={() => handleRightClick(item.id)}
                disabled={isMatched}
                className={`min-h-[72px] p-4 md:p-5 rounded-2xl border-2 text-left font-medium text-sm md:text-base transition-all flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${
                  isMatched
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/10 opacity-80'
                    : isSelected
                    ? mismatchError
                      ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500'
                      : 'bg-purple-950/90 border-purple-500 text-purple-100 ring-2 ring-purple-400 shadow-lg shadow-purple-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200'
                }`}
              >
                <span>{item.text}</span>
                {isMatched && <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Completion Banner */}
      {isAllComplete && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full p-6 rounded-3xl bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border-2 border-emerald-500 text-center flex flex-col items-center gap-3 shadow-2xl"
        >
          <Sparkles className="w-10 h-10 text-emerald-400 animate-spin" />
          <h3 className="text-2xl font-black text-white">
            All Concepts Perfectly Matched!
          </h3>
          <p className="text-emerald-200 text-sm">
            Great classroom discussion and conceptual mastery.
          </p>
          {onFinish && (
            <button
              onClick={onFinish}
              className="mt-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm cursor-pointer shadow-lg shadow-emerald-600/30"
            >
              Finish Round
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};
