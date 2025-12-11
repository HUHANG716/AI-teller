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

// Goal and Resource types
export type ResourceType = 'gold' | 'reputation' | 'influence' | 'item';

export interface Resource {
  type: ResourceType;
  amount?: number;  // For simple resources (gold, reputation, influence)
  name?: string;  // For items
  description?: string;  // For items
}

// Resource definition - defines what resources are available in this game
export interface ResourceDefinition {
  type: ResourceType;
  name: string;  // Display name (e.g., "金币", "声望", "影响力")
  icon?: string;  // Optional icon/emoji
  initialAmount?: number;  // Starting amount (for simple resources)
  description?: string;  // Description of what this resource represents
}

export interface Goal {
  id: string;
  description: string;
  type: 'story';  // Currently only story goals
  requirements?: {
    resources?: Resource[];
    items?: string[];
    conditions?: string[];
  };
}

export interface GameGoal {
  goal: Goal;
  selectedAt: number;  // Timestamp when goal was selected
  progress: {
    description: string;  // Current progress description
    percentage: number;  // 0-100
    completedConditions?: string[];  // List of completed condition IDs
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
  goal?: GameGoal;  // Current goal (selected in first 3 rounds)
  resources: Resource[];  // Current resources and items
  resourceDefinitions?: ResourceDefinition[];  // Available resource types for this game (defined in round 3)
  ending?: Ending;  // Ending if game has concluded
  maxRounds: number;  // Maximum number of rounds (default 15)
}

// API Request/Response types
export interface GenerateStoryRequest {
  genre: Genre;
  character: Character;
  history: StoryNode[];
  userInput: string; // Selected choice or custom input
  diceRoll?: DiceRoll; // Include dice roll result if there was one
  goal?: GameGoal; // Current goal
  resources?: Resource[]; // Current resources
  roundNumber?: number; // Current round number (0-indexed)
  isGoalSelection?: boolean; // Whether we're in goal selection phase (rounds 0-2)
  isEnding?: boolean; // Whether we're generating an ending
}

export interface GenerateStoryResponse {
  content: string;
  choices: Choice[] | string[]; // Can be structured or simple strings
  goalOptions?: Goal[]; // Goal options if in goal selection phase
  resourceDefinitions?: ResourceDefinition[]; // Resource definitions (for round 3)
  initialResources?: Resource[]; // Initial resources (for round 3)
  resourceChanges?: Resource[]; // Resource changes from this action
  goalProgress?: {
    description: string;
    percentage: number;
    completedConditions?: string[];
  }; // Goal progress update
  ending?: Ending; // Ending if generating ending
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

