import { Genre, Character, StoryNode, DiceRoll, GameGoal, GamePhase, DiceOutcome } from '@/lib/types';

// Provider type definitions
export type ProviderType = 'zhipu';

// Main function parameters - matches the original API
export interface GenerateStoryParams {
  genre: Genre;
  character: Character;
  history: StoryNode[];
  userInput: string;
  isOpening?: boolean;
  diceRoll?: DiceRoll;
  goal?: GameGoal;
  roundNumber?: number;
  maxRounds?: number;
  phase?: GamePhase;
  previousOutcome?: DiceOutcome | null;
  isGoalSelection?: boolean;
  isEnding?: boolean;
  selectedModel?: string; // Model selected from UI
}

// Response format expected by the game
export interface GenerateStoryResponse {
  content: string;
  choices: string[] | Array<{ text: string; difficulty?: number; isGoal?: boolean }>;
  goalOptions?: Array<{
    id: string;
    description: string;
    type: 'story';
  }>;
  goalProgress?: {
    percentage: number;
    reason?: string;
  };
  ending?: {
    type: 'success' | 'partial-success' | 'failure' | 'timeout';
    title: string;
    description: string;
    conditions: string[];
  };
}

// Internal generation request context
export interface GenerationContext {
  isOpening?: boolean;
  diceRoll?: DiceRoll;
  goal?: GameGoal;
  roundNumber?: number;
  maxRounds?: number;
  phase?: GamePhase;
  previousOutcome?: DiceOutcome | null;
  isGoalSelection?: boolean;
  isEnding?: boolean;
}

// Internal generation request
export interface GenerationRequest {
  genre: Genre;
  character: Character;
  history: StoryNode[];
  userInput: string;
  context: GenerationContext;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// Raw AI response format from different providers
export interface RawAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  output?: {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };
  result?: string; // Wenxin specific
  error?: any;
}

// Error class for provider errors
export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

// Export the main function type
export type GenerateStoryFunction = (params: GenerateStoryParams) => Promise<GenerateStoryResponse>;