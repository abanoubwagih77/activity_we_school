import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, CheckCircle, XCircle, RotateCcw, Home, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { Team } from '../../types';
import { soundEngine } from '../../utils/audio';

interface SessionSummaryModalProps {
  activityTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalPoints: number;
  teams?: Team[];
  durationSeconds: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  activityTitle,
  totalQuestions,
  correctAnswers,
  wrongAnswers,
  totalPoints,
  teams,
  durationSeconds,
  onPlayAgain,
  onExit,
}) => {
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  useEffect(() => {
    soundEngine.playVictory();
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {}
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins} د ${rem} ث`;
  };

  const sortedTeams = teams ? [...teams].sort((a, b) => b.score - a.score) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" dir="rtl">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="inline-flex p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 mb-3 shadow-sm">
            <Trophy className="w-12 h-12 animate-bounce" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            أحسنتم! اكتمل النشاط الصفي بنجاح
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            {activityTitle}
          </p>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block">إجمالي النقاط</span>
              <p className="text-2xl sm:text-3xl font-black text-indigo-700 mt-1 font-mono">
                {totalPoints}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-bold text-emerald-700 block">نسبة الدقة</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1 font-mono">
                {accuracy}%
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block">صحيح / خطأ</span>
              <div className="flex items-center justify-center gap-2 mt-1 text-base font-bold font-mono">
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> {correctAnswers}
                </span>
                <span className="text-slate-300">/</span>
                <span className="text-rose-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> {wrongAnswers}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block">مدة الجلسة</span>
              <p className="text-base sm:text-lg font-black text-slate-800 mt-2 font-mono flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{formatTime(durationSeconds)}</span>
              </p>
            </div>
          </div>

          {/* Team Leaderboard if Teams */}
          {sortedTeams.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-right space-y-2">
              <h4 className="text-xs font-bold text-indigo-900 mb-2">ترتيب وتتويج الفرق الفائزة:</h4>
              <div className="space-y-1.5">
                {sortedTeams.map((team, idx) => (
                  <div
                    key={team.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border ${
                      idx === 0
                        ? 'bg-amber-100/60 border-amber-300 shadow-sm'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs w-6 text-center font-mono">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </span>
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                      <span className="text-xs font-bold text-slate-900">{team.name}</span>
                    </div>
                    <span className="text-xs font-black text-indigo-700 font-mono">
                      {team.score} نقطة
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onPlayAgain}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة النشاط مجدداً</span>
            </button>
            <button
              onClick={onExit}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Home className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
