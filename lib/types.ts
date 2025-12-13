// Core type definitions for the AI Storyteller app

export type Genre = 'wuxia' | 'urban-mystery' | 'peaky-blinders';

// ============ Game Configuration ============
export const GAME_CONFIG = {
  defaultMaxRounds: 6,      // 默认最大轮数
  openingRounds: 2,          // 开局轮数
  goalSelectionRound: 3,     // 目标选择轮
  climaxRoundsBeforeEnd: 2,  // 结局前多少轮进入高潮
  // 字数配置
  storyWordCount: '200-300',   // 普通剧情字数
  endingWordCount: '300-500',  // 结局字数
};

// ============ Game Phase ============
export type GamePhase = 'opening' | 'goal-selection' | 'development' | 'climax' | 'ending';

export function getGamePhase(roundNumber: number, maxRounds: number): GamePhase {
  if (roundNumber <= GAME_CONFIG.openingRounds) return 'opening';
  if (roundNumber === GAME_CONFIG.goalSelectionRound) return 'goal-selection';
  if (roundNumber >= maxRounds) return 'ending';
  if (roundNumber >= maxRounds - GAME_CONFIG.climaxRoundsBeforeEnd + 1) return 'climax';
  return 'development';
}

// ============ Character ============
export interface Character {
  id: string;
  name: string;
  description: string; // AI-generated character description
  createdAt: number;
}

// Dice roll types
export type DiceOutcome = 'critical-fail' | 'fail' | 'success' | 'perfect' | 'critical-success';

export interface DiceRoll {
  dice1: number;  // First dice (1-6)
  dice2: number;  // Second dice (1-6)
  total: number;  // Sum of both dice
  difficulty: number;  // Target number
  outcome: DiceOutcome;
}

export interface Choice {
  text: string;
  difficulty?: number;  // Dice roll difficulty (6=easy, 8=normal, 10=hard, 11-12=very hard)
  isGoal?: boolean;  // Whether this choice represents a goal selection
}

export interface StoryNode {
  id: string;
  content: string; // The story text (200-300 words)
  choices: Choice[] | string[]; // Can be structured or simple strings (for backward compatibility)
  userChoice?: string; // What the user selected (choice text or custom input)
  diceRoll?: DiceRoll; // Dice roll result if this choice required one
  timestamp: number;
  goalOptions?: Goal[]; // Goal options if this is round 3 goal selection node
}

// Goal types
export interface Goal {
  id: string;
  description: string;
  type: 'story';  // Currently only story goals
}

export interface GameGoal {
  goal: Goal;
  selectedAt: number;  // Timestamp when goal was selected
  progress: {
    percentage: number;   // 0-100
    reason?: string;      // Reason for progress change
  };
  completedAt?: number;  // Timestamp when goal was completed
}

export type EndingType = 'success' | 'partial-success' | 'failure' | 'timeout';

export interface Ending {
  type: EndingType;
  title: string;
  description: string;
  conditions: string[];  // Conditions that led to this ending
}

export interface GameState {
  id: string;
  genre: Genre;
  character: Character;
  storyNodes: StoryNode[]; // History of the story progression
  currentNodeIndex: number; // Which node we're currently at
  createdAt: number;
  updatedAt: number;
  goal?: GameGoal;  // Current goal (selected in round 3)
  ending?: Ending;  // Ending if game has concluded
  maxRounds: number;  // Maximum number of rounds (default 10)
}

// API Request/Response types
export interface GenerateStoryRequest {
  genre: Genre;
  character: Character;
  history: StoryNode[];
  userInput: string; // Selected choice or custom input
  diceRoll?: DiceRoll; // Include dice roll result if there was one
  goal?: GameGoal; // Current goal
  roundNumber?: number; // Current round number (1-indexed)
  phase?: GamePhase; // Current game phase
  previousOutcome?: DiceOutcome | null; // Previous dice outcome (for failure penalty)
  isGoalSelection?: boolean; // Whether we're in goal selection phase
  isEnding?: boolean; // Whether we're generating an ending
}

export interface GenerateStoryResponse {
  content: string;
  choices: Choice[] | string[]; // Can be structured or simple strings
  goalOptions?: Goal[]; // Goal options if in goal selection phase
  goalProgress?: {
    percentage: number;
    reason?: string;  // Reason for progress change
  }; // Goal progress update
  ending?: Ending; // Ending if generating ending
}

// Character creation form types
export interface CharacterFormData {
  name: string;
  genre: Genre;
}
