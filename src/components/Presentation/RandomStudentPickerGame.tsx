import React, { useState, useEffect, useRef } from 'react';
import { ClassroomGroup } from '../../types';
import { soundEngine } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Users, Shuffle, RotateCcw, UserX, Award, Sparkles, Check, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RandomStudentPickerGameProps {
  classes: ClassroomGroup[];
  defaultClassId?: string;
}

export const RandomStudentPickerGame: React.FC<RandomStudentPickerGameProps> = ({
  classes,
  defaultClassId,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    defaultClassId || (classes[0]?.id || '')
  );
  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];

  // Options
  const [pickCount, setPickCount] = useState<number>(1);
  const [allowRepeats, setAllowRepeats] = useState<boolean>(false);
  
  // State
  const [isPicking, setIsPicking] = useState<boolean>(false);
  const [displayedName, setDisplayedName] = useState<string>('Ready to Pick!');
  const [pickedWinners, setPickedWinners] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [excludedNames, setExcludedNames] = useState<Set<string>>(new Set());

  // Quick add manual student state
  const [manualInput, setManualInput] = useState('');

  const activeRoster = currentClass ? currentClass.students.map(s => s.name) : [];
  
  // Eligible students
  const eligibleStudents = activeRoster.filter(name => {
    if (excludedNames.has(name)) return false;
    if (!allowRepeats && history.includes(name)) return false;
    return true;
  });

  const animIntervalRef = useRef<number | null>(null);

  const startPicking = () => {
    if (isPicking || eligibleStudents.length === 0) return;

    setIsPicking(true);
    setPickedWinners([]);

    let duration = 2400; // ms
    let intervalTime = 60;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const randomIdx = Math.floor(Math.random() * eligibleStudents.length);
      const randomStudent = eligibleStudents[randomIdx];
      setDisplayedName(randomStudent);
      soundEngine.playTick(600 + Math.random() * 200);

      if (elapsed < duration) {
        // Slow down toward the end
        if (elapsed > duration * 0.7) {
          intervalTime += 15;
        }
        animIntervalRef.current = window.setTimeout(tick, intervalTime);
      } else {
        // Pick winner(s)
        finalizePick();
      }
    };

    tick();
  };

  const finalizePick = () => {
    setIsPicking(false);

    // Shuffle eligible students and take `pickCount`
    const shuffled = [...eligibleStudents].sort(() => 0.5 - Math.random());
    const winners = shuffled.slice(0, Math.min(pickCount, eligibleStudents.length));

    setPickedWinners(winners);
    setDisplayedName(winners.join(' & '));

    // Update history
    setHistory(prev => [...winners, ...prev]);

    // Audio & Confetti
    soundEngine.playVictory();
    try {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.55 },
      });
    } catch {}
  };

  const toggleExclude = (name: string) => {
    setExcludedNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    soundEngine.playClick();
  };

  const resetSession = () => {
    setHistory([]);
    setPickedWinners([]);
    setDisplayedName('Ready to Pick!');
    setExcludedNames(new Set());
    soundEngine.playClick();
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center p-4">
      {/* Configuration Header */}
      <div className="w-full bg-slate-800/80 p-5 rounded-3xl border border-slate-700 mb-8 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Class selector */}
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-indigo-400" />
            <div>
              <label className="text-xs uppercase font-bold text-slate-400 block">Select Classroom</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  resetSession();
                }}
                className="bg-slate-900 border border-slate-700 text-white font-bold rounded-xl px-4 py-2 mt-1 focus:outline-none focus:border-indigo-500"
              >
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.students.length} students)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Controls: Pick count & Repeat toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 font-semibold">Pick:</span>
              {[1, 2, 3, 4].map(num => (
                <button
                  key={num}
                  onClick={() => setPickCount(num)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    pickCount === num
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {num} {num === 1 ? 'Student' : 'Students'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setAllowRepeats(!allowRepeats)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                allowRepeats
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {allowRepeats ? 'Repeats: Allowed' : 'Repeats: Blocked (Fair)'}
            </button>

            <button
              onClick={resetSession}
              className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer"
              title="Reset history"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Showcase Stage for Projector */}
      <div className="w-full relative py-12 px-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-indigo-500/30 shadow-2xl flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Glow ambient circle */}
        <div className="absolute w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-semibold mb-6">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Eligible: {eligibleStudents.length} of {activeRoster.length} students
        </div>

        {/* Displayed Student Banner (Huge Projector Typography) */}
        <div className="min-h-[160px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={isPicking ? 'picking' : pickedWinners.join(',')}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="flex flex-col items-center"
            >
              {pickedWinners.length > 0 && !isPicking && (
                <div className="flex items-center gap-2 text-amber-400 text-lg font-bold uppercase tracking-widest mb-2">
                  <Award className="w-6 h-6" />
                  Selected Student{pickedWinners.length > 1 ? 's' : ''}!
                </div>
              )}

              <h1 className={`text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight ${
                isPicking
                  ? 'text-indigo-300 blur-[0.5px] scale-105'
                  : pickedWinners.length > 0
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400 drop-shadow-[0_4px_25px_rgba(245,158,11,0.3)]'
                  : 'text-slate-300'
              }`}>
                {displayedName}
              </h1>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pick Button */}
        <motion.button
          whileHover={!isPicking ? { scale: 1.05 } : {}}
          whileTap={!isPicking ? { scale: 0.95 } : {}}
          onClick={startPicking}
          disabled={isPicking || eligibleStudents.length === 0}
          className="mt-8 px-12 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-2xl shadow-xl shadow-indigo-600/30 flex items-center gap-3 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Shuffle className={`w-7 h-7 ${isPicking ? 'animate-spin' : ''}`} />
          {isPicking ? 'RANDOMLY SELECTING...' : 'PICK STUDENT'}
        </motion.button>
      </div>

      {/* Student Roster & Exclusions */}
      <div className="w-full mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Class Roster */}
        <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/80">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Class Roster ({activeRoster.length})</span>
            <span className="text-xs text-slate-400 font-normal">Click to toggle exclusion</span>
          </h4>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {activeRoster.map(name => {
              const isExcluded = excludedNames.has(name);
              const isAlreadyPicked = !allowRepeats && history.includes(name);

              return (
                <button
                  key={name}
                  onClick={() => toggleExclude(name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isExcluded
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-800/80 line-through opacity-60'
                      : isAlreadyPicked
                      ? 'bg-slate-800 text-slate-500 border border-slate-700'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                  }`}
                >
                  {name}
                  {isExcluded && <UserX className="w-3 h-3 text-rose-400" />}
                  {isAlreadyPicked && !isExcluded && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected History this session */}
        <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/80">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Selected This Session ({history.length})</span>
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                Clear History
              </button>
            )}
          </h4>
          {history.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No students picked yet in this session.</p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              {history.map((name, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1"
                >
                  <span className="text-indigo-400 text-[10px]">#{history.length - idx}</span>
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
