import React, { useState } from 'react';
import { Question, Team } from '../../types';
import { soundEngine } from '../../utils/audio';
import { QuestionDisplay } from './QuestionDisplay';
import { 
  Terminal, Rocket, Shield, Bot, Code, Cpu, 
  ArrowRight, ArrowLeft, Plus, Minus, Trophy, CheckCircle, Eye 
} from 'lucide-react';
import { motion } from 'motion/react';

interface TeamBattleGameProps {
  questions: Question[];
  teams: Team[];
  onUpdateTeamScore: (teamId: string, delta: number) => void;
  onSetTeamScore: (teamId: string, newScore: number) => void;
  onFinish: () => void;
  timerDuration?: number;
}

export const TeamBattleGame: React.FC<TeamBattleGameProps> = ({
  questions,
  teams,
  onUpdateTeamScore,
  onSetTeamScore,
  onFinish,
  timerDuration = 20,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [awardedTeamId, setAwardedTeamId] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];

  const renderIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'rocket': return <Rocket className={className} />;
      case 'shield': return <Shield className={className} />;
      case 'bot': return <Bot className={className} />;
      case 'code': return <Code className={className} />;
      case 'cpu': return <Cpu className={className} />;
      case 'terminal':
      default:
        return <Terminal className={className} />;
    }
  };

  const handleSelectAnswer = (option: string) => {
    if (!currentQuestion) return;
    setSelectedAnswer(option);
    const isCorrect = option !== '' && option !== '__TIME_UP__' && option === currentQuestion.correctAnswer;
    if (isCorrect) {
      soundEngine.playCorrect();
    } else {
      if (option !== '__TIME_UP__') {
        soundEngine.playWrong();
      }
    }
  };

  const handleAwardTeam = (teamId: string, points: number) => {
    onUpdateTeamScore(teamId, points);
    setAwardedTeamId(teamId);
    soundEngine.playCorrect();
  };

  const handleDeductTeam = (teamId: string, penalty = 5) => {
    onUpdateTeamScore(teamId, -penalty);
    soundEngine.playWrong();
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsRevealed(false);
      setAwardedTeamId(null);
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
      setAwardedTeamId(null);
      soundEngine.playClick();
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-6 p-4">
      {/* Live Team Scoreboard on Top */}
      <div className="w-full bg-slate-800/90 p-4 md:p-5 rounded-3xl border border-slate-700 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300">
              Live Team Battle Scoreboard
            </h3>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Question {currentIndex + 1} of {questions.length}
          </div>
        </div>

        {/* Teams Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {teams.map((team) => {
            const isAwarded = awardedTeamId === team.id;

            return (
              <motion.div
                key={team.id}
                animate={isAwarded ? { scale: [1, 1.05, 1], y: [-4, 0] } : {}}
                className={`p-3 rounded-2xl border-2 flex flex-col justify-between transition-all relative overflow-hidden ${
                  isAwarded
                    ? 'bg-amber-950/60 border-amber-400 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400'
                    : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {/* Team header banner */}
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="p-1 rounded-lg text-white shrink-0"
                      style={{ backgroundColor: team.color }}
                    >
                      {renderIcon(team.icon, 'w-3.5 h-3.5')}
                    </span>
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {team.name}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-2xl font-black font-mono my-1 text-center" style={{ color: team.color }}>
                  {team.score}
                </div>

                {/* Quick Points Allocation Buttons */}
                <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleAwardTeam(team.id, currentQuestion?.points || 10)}
                    className="flex-1 py-1 px-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-0.5 shadow-sm cursor-pointer"
                    title={`Award +${currentQuestion?.points || 10} points`}
                  >
                    <Plus className="w-3 h-3" />
                    +{currentQuestion?.points || 10}
                  </button>
                  <button
                    onClick={() => handleDeductTeam(team.id, 5)}
                    className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-rose-200 border border-slate-700 text-xs font-bold cursor-pointer"
                    title="Penalty -5 points"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Question Navigation Bar */}
      <div className="w-full flex items-center justify-between bg-slate-800/80 px-6 py-3 rounded-2xl border border-slate-700">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-sm font-bold text-slate-300">
          Clash Round #{currentIndex + 1}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRevealed(true)}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            Reveal Solution
          </button>
          <button
            onClick={handleNext}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
          >
            {currentIndex === questions.length - 1 ? 'Finish Battle' : 'Next Question'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Question Display */}
      {currentQuestion && (
        <QuestionDisplay
          question={currentQuestion}
          selectedAnswer={selectedAnswer}
          isAnswerRevealed={isRevealed}
          onSelectAnswer={handleSelectAnswer}
          timerDuration={timerDuration}
          onTimeUp={handleNext}
        />
      )}
    </div>
  );
};
