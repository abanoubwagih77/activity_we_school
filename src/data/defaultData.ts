import { Question, ClassroomGroup, ActivityConfig, AppSettings, MatchingPair } from '../types';

// Zero static data by default - user creates everything from scratch!
export const DEFAULT_QUESTIONS: Question[] = [];

export const DEFAULT_CLASSES: ClassroomGroup[] = [];

export const DEFAULT_ACTIVITIES: ActivityConfig[] = [];

export const DEFAULT_MATCHING_PAIRS: MatchingPair[] = [];

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  soundVolume: 0.7,
  theme: 'light', // Modern light theme as default
  defaultTimerSeconds: 30,
  defaultTimerDuration: 30,
  defaultPointsPerCorrect: 10,
  pointsAwardedPerCorrect: 10,
  pointsDeductedPerWrong: 0,
  animationsEnabled: true,
};
