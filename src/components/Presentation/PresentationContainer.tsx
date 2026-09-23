import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { soundEngine } from '../../utils/audio';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Minimize, 
  X, Eye, Plus, Minus, Trophy, Sparkles, Clock, AlertTriangle 
} from 'lucide-react';
import { SpinWheelGame } from './SpinWheelGame';
import { QuestionBoxesGame } from './QuestionBoxesGame';
import { RandomStudentPickerGame } from './RandomStudentPickerGame';
import { TrueFalseGame } from './TrueFalseGame';
import { SpeedQuizGame } from './SpeedQuizGame';
import { MatchingGame } from './MatchingGame';
import { MemoryCardsGame } from './MemoryCardsGame';
import { TeamBattleGame } from './TeamBattleGame';
import { JeopardyGame } from './JeopardyGame';
import { SessionSummaryModal } from './SessionSummaryModal';

export const PresentationContainer: React.FC = () => {
  const { activeActivity, exitActivity, questions, classes, addSessionResult, settings, updateSettings } = useApp();

  if (!activeActivity) {
    return null;
  }

  // Session stats
  const [totalScore, setTotalScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [sessionStartTime] = useState<number>(Date.now());
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  const getTypeNameAr = (type: string) => {
    switch (type) {
      case 'spin_wheel': return 'عجلة الحظ الدوارة';
      case 'question_boxes': return 'صناديق الأسئلة';
      case 'student_picker': return 'اختيار الطلاب';
      case 'true_false': return 'صح أو خطأ';
      case 'speed_quiz': return 'مسابقة السرعة';
      case 'matching': return 'المطابقة والتوصيل';
      case 'memory_cards': return 'كروت الذاكرة';
      case 'team_battle': return 'معركة الفرق';
      case 'jeopardy': return 'شبكة التحديات';
      default: return type;
    }
  };

  // Teams state initialized from activity or defaults
  const [teams, setTeams] = useState(
    activeActivity.teams && activeActivity.teams.length > 0
      ? activeActivity.teams
      : [
          { id: 't1', name: 'الفريق الأزرق', color: '#3b82f6', icon: 'terminal', score: 0 },
          { id: 't2', name: 'الفريق الأخضر', color: '#10b981', icon: 'cpu', score: 0 },
        ]
  );

  // Filter questions that belong to this activity (or fallback to all)
  const activityQuestions = activeActivity.questionIds.length > 0
    ? questions.filter(q => activeActivity.questionIds.includes(q.id))
    : questions;

  // Sound toggle
  const toggleSound = () => {
    const next = !settings.soundEnabled;
    updateSettings({ soundEnabled: next });
    soundEngine.enabled = next;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Handle awarding points from games
  const handleAwardPoints = (points: number, isCorrect: boolean) => {
    setQuestionsAnswered(prev => prev + 1);
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setTotalScore(prev => prev + points);
    } else {
      setWrongCount(prev => prev + 1);
      if (settings.pointsDeductedPerWrong > 0) {
        setTotalScore(prev => Math.max(0, prev - settings.pointsDeductedPerWrong));
      }
    }
  };

  // Update team score
  const handleUpdateTeamScore = (teamId: string, delta: number) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, score: Math.max(0, t.score + delta) } : t));
    if (delta > 0) {
      setTotalScore(prev => prev + delta);
      setCorrectCount(prev => prev + 1);
      setQuestionsAnswered(prev => prev + 1);
    } else {
      setWrongCount(prev => prev + 1);
    }
  };

  const handleSetTeamScore = (teamId: string, newScore: number) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, score: Math.max(0, newScore) } : t));
  };

  const handleFinishActivity = () => {
    const duration = Math.round((Date.now() - sessionStartTime) / 1000);
    const totalQ = questionsAnswered > 0 ? questionsAnswered : activityQuestions.length;
    const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;

    // Log to history
    addSessionResult({
      activityId: activeActivity.id,
      activityTitle: activeActivity.title,
      activityType: activeActivity.type,
      classId: activeActivity.classId,
      className: classes.find(c => c.id === activeActivity.classId)?.name,
      scoreMode: activeActivity.scoreMode,
      totalQuestions: totalQ,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      accuracy,
      totalPoints: totalScore,
      teamScores: activeActivity.scoreMode === 'team' ? teams.map(t => ({ teamName: t.name, score: t.score, color: t.color })) : undefined,
      durationSeconds: duration,
    });

    setShowSummary(true);
  };

  const handlePlayAgain = () => {
    setTotalScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setQuestionsAnswered(0);
    setShowSummary(false);
    setTeams(prev => prev.map(t => ({ ...t, score: 0 })));
  };

  return (
    <div className="fixed inset-0 z-40 bg-gradient-to-b from-slate-100 via-slate-50 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 text-slate-800 dark:text-slate-200 flex flex-col justify-between overflow-y-auto selection:bg-indigo-500 selection:text-white" dir="rtl">
      
      {/* Top Classroom Bar - Clear & high contrast for projector */}
      <header className="w-full bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm shrink-0 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <h1 className="text-base sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
              {activeActivity.title}
            </h1>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold">
            {getTypeNameAr(activeActivity.type)}
          </span>
        </div>

        {/* Live Score Display */}
        <div className="flex items-center gap-3">
          {activeActivity.scoreMode === 'class' ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 shadow-sm">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">نقاط الفصل:</span>
              <span className="font-mono text-lg font-black text-indigo-700 dark:text-indigo-400">{totalScore}</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              {teams.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="font-bold text-slate-800 dark:text-slate-200">{t.name}:</span>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">{t.score}</span>
                </div>
              ))}
            </div>
          )}

          {/* Controls: Sound & Fullscreen & Finish & Exit */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleSound}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
              title={settings.soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-rose-600" />}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
              title="ملء الشاشة للعرض على البروجيكتور"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                handleFinishActivity();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer transition-all active:scale-95"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>إنهاء وعرض النتائج</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShowExitConfirm(true);
              }}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
              title="خروج"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Presentation Stage */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex items-center justify-center p-4 md:p-8">
        {activeActivity.type === 'spin_wheel' && (
          <SpinWheelGame
            questions={activityQuestions}
            preventRepeats={activeActivity.preventQuestionRepeats}
            labelType={activeActivity.wheelLabelType}
            onAwardPoints={handleAwardPoints}
            timerDuration={activeActivity.timerDuration || settings?.defaultTimerSeconds || 20}
          />
        )}

        {activeActivity.type === 'question_boxes' && (
          <QuestionBoxesGame
            questions={activityQuestions}
            boxBehavior={activeActivity.boxBehavior}
            onAwardPoints={handleAwardPoints}
            timerDuration={activeActivity.timerDuration || settings?.defaultTimerSeconds || 20}
          />
        )}

        {activeActivity.type === 'student_picker' && (
          <RandomStudentPickerGame
            classes={classes}
            defaultClassId={activeActivity.classId}
          />
        )}

        {activeActivity.type === 'true_false' && (
          <TrueFalseGame
            questions={activityQuestions}
            onAwardPoints={handleAwardPoints}
            onFinish={handleFinishActivity}
            timerDuration={activeActivity.timerDuration || settings?.defaultTimerSeconds || 20}
          />
        )}

        {activeActivity.type === 'speed_quiz' && (
          <SpeedQuizGame
            questions={activityQuestions}
            timerDurationSeconds={activeActivity.timerDuration || settings?.defaultTimerSeconds || 15}
            onAwardPoints={handleAwardPoints}
            onFinish={handleFinishActivity}
          />
        )}

        {activeActivity.type === 'matching' && (
          <MatchingGame
            pairs={activeActivity.matchingPairs}
            onAwardPoints={handleAwardPoints}
            onFinish={handleFinishActivity}
          />
        )}

        {activeActivity.type === 'memory_cards' && (
          <MemoryCardsGame
            pairs={activeActivity.matchingPairs}
            onAwardPoints={handleAwardPoints}
            onFinish={handleFinishActivity}
          />
        )}

        {activeActivity.type === 'team_battle' && (
          <TeamBattleGame
            questions={activityQuestions}
            teams={teams}
            onUpdateTeamScore={handleUpdateTeamScore}
            onSetTeamScore={handleSetTeamScore}
            onFinish={handleFinishActivity}
            timerDuration={activeActivity.timerDuration || settings?.defaultTimerSeconds || 20}
          />
        )}

        {activeActivity.type === 'jeopardy' && (
          <JeopardyGame
            questions={activityQuestions}
            teams={activeActivity.scoreMode === 'team' ? teams : undefined}
            onAwardPoints={handleAwardPoints}
            onUpdateTeamScore={handleUpdateTeamScore}
            timerDuration={activeActivity.timerDuration || settings?.defaultTimerSeconds || 20}
          />
        )}
      </main>

      {/* Teacher Remote Bottom Bar */}
      <footer className="w-full bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm shrink-0 transition-colors">
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
          <span className="font-bold text-slate-800 dark:text-slate-200">شريط المعلم السريع:</span>
          <span>إجابات صحيحة: <strong className="text-emerald-700 dark:text-emerald-400 font-mono">{correctCount}</strong></span>
          <span>•</span>
          <span>إجابات خاطئة: <strong className="text-rose-600 dark:text-rose-400 font-mono">{wrongCount}</strong></span>
        </div>

        {/* Quick Manual Score Override */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">تعديل سريع لنقاط الفصل:</span>
          <button
            type="button"
            onClick={() => {
              setTotalScore(prev => prev + 10);
              soundEngine.playCorrect();
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
          >
            <Plus className="w-3 h-3" /> +10
          </button>
          <button
            type="button"
            onClick={() => {
              setTotalScore(prev => Math.max(0, prev - 5));
              soundEngine.playWrong();
            }}
            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
          >
            <Minus className="w-3 h-3" /> -5
          </button>
        </div>
      </footer>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in" dir="rtl">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                هل تريد إنهاء العرض والعودة؟
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                سيتم إيقاف النشاط الصفي الحالي والرجوع للوحة التحكم.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  exitActivity();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer transition-all"
              >
                نعم، إنهاء النشاط
              </button>
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition-all"
              >
                متابعة العرض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Dialog when finished */}
      {showSummary && (
        <SessionSummaryModal
          activityTitle={activeActivity.title}
          totalQuestions={questionsAnswered > 0 ? questionsAnswered : activityQuestions.length}
          correctAnswers={correctCount}
          wrongAnswers={wrongCount}
          totalPoints={totalScore}
          teams={activeActivity.scoreMode === 'team' ? teams : undefined}
          durationSeconds={Math.round((Date.now() - sessionStartTime) / 1000)}
          onPlayAgain={handlePlayAgain}
          onExit={exitActivity}
        />
      )}
    </div>
  );
};
