export type QuestionType = 'mcq' | 'true_false' | 'complete' | 'matching' | 'code_output';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type ActivityType = 
  | 'spin_wheel'
  | 'question_boxes'
  | 'student_picker'
  | 'true_false'
  | 'speed_quiz'
  | 'matching'
  | 'memory_cards'
  | 'team_battle'
  | 'jeopardy';

export type BoxBehavior = 'disappear' | 'dimmed' | 'disabled';

export type ScoreMode = 'class' | 'team';

export interface MatchingPair {
  id: string;
  left: string; // e.g. term or code concept
  right: string; // e.g. definition, output, or matching concept
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: string[]; // For MCQ, Code Output
  correctAnswer: string; // The correct option text, "True"/"False", or completion text
  matchingPairs?: MatchingPair[]; // For matching questions
  codeSnippet?: string; // Optional code block
  language?: string; // python, javascript, cpp, java, sql, html, css
  imageUrl?: string; // Optional diagram, screenshot, flowchart
  explanation?: string; // Teaching note/explanation shown after answer
  difficulty: Difficulty;
  category: string; // Python, JavaScript, Web, Algorithms, Databases, General, etc.
  tags: string[];
  points: number; // default 10, 20, etc.
  timeLimit?: number; // specific seconds override
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  points?: number;
  timesCalled?: number;
}

export interface ClassroomGroup {
  id: string;
  name: string;
  grade?: string;
  subject?: string;
  description?: string;
  students: Student[];
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  color: string; // hex or tailwind class
  icon: string; // icon identifier: terminal, rocket, shield, bot, code, cpu
  score: number;
}

export interface ActivityConfig {
  id: string;
  title: string;
  description?: string;
  type: ActivityType;
  questionIds: string[];
  classId?: string; // Linked class roster if applicable
  
  // Scoring mode
  scoreMode: ScoreMode;
  teamCount?: number; // 2-6 teams
  teams?: Team[];

  // Timer configuration
  timerDuration?: number; // 0 = no timer, or 10, 15, 30, 60, custom
  
  // Specific activity settings
  boxBehavior?: BoxBehavior; // for question_boxes
  wheelLabelType?: 'number' | 'title' | 'question'; // for spin_wheel
  preventQuestionRepeats?: boolean;
  
  // Matching pairs (for matching & memory card activities)
  matchingPairs?: MatchingPair[];
  
  createdAt: string;
  updatedAt?: string;
}

export interface ActivitySessionResult {
  id: string;
  activityId: string;
  activityTitle: string;
  activityType: ActivityType;
  classId?: string;
  className?: string;
  scoreMode: ScoreMode;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number; // percentage
  totalPoints: number;
  teamScores?: { teamName: string; score: number; color: string }[];
  timestamp: string;
  completedAt?: string;
  durationSeconds: number;
}

export type SessionResult = ActivitySessionResult;

export interface AppSettings {
  soundEnabled: boolean;
  soundVolume: number; // 0.0 to 1.0
  theme: 'dark' | 'light';
  defaultTimerSeconds: number;
  defaultTimerDuration?: number;
  defaultPointsPerCorrect: number;
  pointsAwardedPerCorrect?: number;
  pointsDeductedPerWrong: number;
  animationsEnabled?: boolean;
}

export interface TeacherAccount {
  id: string;
  username: string;
  password: string;
  fullName: string;
  subject: string;
  role?: string;
  createdAt: string;
  isDefault?: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  subject: string;
  role: string;
  avatar?: string;
}

export interface TeacherCredentials {
  username: string;
  password: string;
  fullName: string;
  subject?: string;
}
