// Core type definitions for the AI Storyteller app

export type Genre = 'wuxia' | 'urban-mystery' | 'peaky-blinders';

export interface Character {
  id: string;
  name: string;
  tags: string[]; // Max 3 tags like "勇敢", "智慧", "魅力"
  description: string; // AI-generated character description
  createdAt: number;
}

// Dice roll types
export type DiceOutcome = 'critical-fail' | 'fail' | 'success' | 'perfect' | 'critical-success';

export interface DiceRoll {
  dice1: number;  // First dice (1-6)
  dice2: number;  // Second dice (1-6)
  total: number;  // Sum of both dice
  bonus: number;  // Trait bonus
  finalResult: number;  // total + bonus
  difficulty: number;  // Target number
  outcome: DiceOutcome;
  matchedTraits: string[];  // Traits that provided bonus
}

export interface Choice {
  text: string;
  requiresDiceRoll?: boolean;
  difficulty?: number;
  relevantTraits?: string[];  // Traits that can provide bonus
}

export interface StoryNode {
  id: string;
  content: string; // The story text (200-300 words)
  choices: Choice[] | string[]; // Can be structured or simple strings (for backward compatibility)
  userChoice?: string; // What the user selected (choice text or custom input)
  diceRoll?: DiceRoll; // Dice roll result if this choice required one
  timestamp: number;
}

export interface GameState {
  id: string;
  genre: Genre;
  character: Character;
  storyNodes: StoryNode[]; // History of the story progression
  currentNodeIndex: number; // Which node we're currently at
  createdAt: number;
  updatedAt: number;
}

// API Request/Response types
export interface GenerateStoryRequest {
  genre: Genre;
  character: Character;
  history: StoryNode[];
  userInput: string; // Selected choice or custom input
  diceRoll?: DiceRoll; // Include dice roll result if there was one
}

export interface GenerateStoryResponse {
  content: string;
  choices: Choice[] | string[]; // Can be structured or simple strings
}

// Character creation form types
export interface CharacterFormData {
  name: string;
  genre: Genre;
  tags: string[];
}

// Available character tags
export const CHARACTER_TAGS = [
  '勇敢',
  '智慧',
  '魅力',
  '冷静',
  '幽默',
  '谨慎',
  '冲动',
  '善良',
  '狡猾',
  '正直',
] as const;

export type CharacterTag = typeof CHARACTER_TAGS[number];

