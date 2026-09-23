import React, { useState, useEffect } from 'react';
import { MatchingPair } from '../../types';
import { DEFAULT_MATCHING_PAIRS } from '../../data/defaultData';
import { soundEngine } from '../../utils/audio';
import { Sparkles, RefreshCcw, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

interface MemoryCardsGameProps {
  pairs?: MatchingPair[];
  onAwardPoints: (points: number, isCorrect: boolean) => void;
  onFinish?: () => void;
}

interface CardItem {
  uid: string; // unique card id in the deck
  pairId: string;
  text: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryCardsGame: React.FC<MemoryCardsGameProps> = ({
  pairs = DEFAULT_MATCHING_PAIRS.slice(0, 6),
  onAwardPoints,
  onFinish,
}) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [moves, setMoves] = useState<number>(0);

  useEffect(() => {
    resetGame();
  }, [pairs]);

  const resetGame = () => {
    const deck: CardItem[] = [];
    pairs.forEach((p, idx) => {
      deck.push({
        uid: `c-${p.id}-left`,
        pairId: p.id,
        text: p.left,
        isFlipped: false,
        isMatched: false,
      });
      deck.push({
        uid: `c-${p.id}-right`,
        pairId: p.id,
        text: p.right,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle deck
    const shuffled = deck.sort(() => 0.5 - Math.random());
    setCards(shuffled);
    setFlippedUids([]);
    setIsProcessing(false);
    setMoves(0);
  };

  const handleCardClick = (uid: string) => {
    if (isProcessing) return;

    const clickedCard = cards.find(c => c.uid === uid);
    if (!clickedCard || clickedCard.isMatched || clickedCard.isFlipped) return;

    soundEngine.playCardFlip();

    // Flip card
    const updatedCards = cards.map(c => c.uid === uid ? { ...c, isFlipped: true } : c);
    setCards(updatedCards);

    const newFlipped = [...flippedUids, uid];
    setFlippedUids(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsProcessing(true);

      const [firstUid, secondUid] = newFlipped;
      const card1 = updatedCards.find(c => c.uid === firstUid);
      const card2 = updatedCards.find(c => c.uid === secondUid);

      if (card1 && card2 && card1.pairId === card2.pairId) {
        // MATCH!
        setTimeout(() => {
          soundEngine.playCorrect();
          onAwardPoints(20, true);

          const matchedCards = updatedCards.map(c => 
            c.uid === firstUid || c.uid === secondUid
              ? { ...c, isMatched: true }
              : c
          );
          setCards(matchedCards);
          setFlippedUids([]);
          setIsProcessing(false);

          // Check if all matched
          const allDone = matchedCards.every(c => c.isMatched);
          if (allDone) {
            soundEngine.playVictory();
            try {
              confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
            } catch {}
          }
        }, 500);
      } else {
        // NO MATCH
        setTimeout(() => {
          soundEngine.playWrong();
          setCards(prev => prev.map(c => 
            c.uid === firstUid || c.uid === secondUid
              ? { ...c, isFlipped: false }
              : c
          ));
          setFlippedUids([]);
          setIsProcessing(false);
        }, 1200);
      }
    }
  };

  const matchedPairsCount = cards.filter(c => c.isMatched).length / 2;
  const isAllMatched = cards.length > 0 && cards.every(c => c.isMatched);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-6 p-4">
      {/* Game Header */}
      <div className="w-full flex items-center justify-between bg-slate-800/80 px-6 py-4 rounded-3xl border border-slate-700 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">Memory Cards Matrix</h3>
            <p className="text-xs text-slate-400">
              Flip pairs together based on class calls to discover matching technology concepts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-300">
            Moves: <strong className="text-indigo-400 font-mono text-base">{moves}</strong>
          </span>
          <span className="px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-sm font-bold text-emerald-300 font-mono">
            {matchedPairsCount} / {pairs.length} Pairs
          </span>
          <button
            onClick={resetGame}
            className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer"
            title="Reset Cards"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Matrix Grid (e.g. 3x4 or 4x3) */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          return (
            <motion.div
              key={card.uid}
              whileHover={!card.isMatched && !card.isFlipped && !isProcessing ? { scale: 1.03 } : {}}
              whileTap={!card.isMatched && !card.isFlipped && !isProcessing ? { scale: 0.97 } : {}}
              onClick={() => handleCardClick(card.uid)}
              className={`h-36 sm:h-40 rounded-2xl border-2 p-4 flex items-center justify-center text-center cursor-pointer select-none transition-all duration-300 shadow-lg relative overflow-hidden ${
                card.isMatched
                  ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-emerald-500/20'
                  : card.isFlipped
                  ? 'bg-indigo-950/90 border-indigo-500 text-white shadow-indigo-500/30'
                  : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-slate-500 text-slate-400'
              }`}
            >
              {card.isFlipped || card.isMatched ? (
                <motion.div
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  className="font-bold text-sm sm:text-base leading-snug"
                >
                  {card.text}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-1 opacity-70">
                  <span className="font-mono text-xs font-black uppercase text-indigo-400">CARD</span>
                  <span className="text-2xl font-black text-slate-500">#{idx + 1}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Finished Banner */}
      {isAllMatched && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full p-6 rounded-3xl bg-gradient-to-r from-purple-950/90 to-indigo-950/90 border-2 border-indigo-500 text-center flex flex-col items-center gap-3 shadow-2xl"
        >
          <Sparkles className="w-10 h-10 text-amber-400 animate-spin" />
          <h3 className="text-2xl font-black text-white">
            Memory Matrix Cleared in {moves} Moves!
          </h3>
          <p className="text-indigo-200 text-sm">
            Outstanding collective memory and recall by the class.
          </p>
          {onFinish && (
            <button
              onClick={onFinish}
              className="mt-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              Finish Activity
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};
