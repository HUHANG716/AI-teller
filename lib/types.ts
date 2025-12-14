// Core type definitions for the AI Storyteller app
// Most types are now inferred from Zod schemas in lib/schemas.ts

// Re-export types from Zod schemas for backward compatibility
export type {
  Genre,
  GamePhase,
  DiceOutcome,
  EndingType,
  Character,
  DiceRoll,
  Choice,
  Goal,
  GameGoal,
  StoryNode,
  Ending,
  GameState,
  GenerateStoryRequest,
  GenerateStoryResponse,
  CharacterFormData,
  ErrorResponse
} from './schemas';

// Re-export values from schemas
export { GAME_CONFIG, getGamePhase } from './schemas';

// Export type aliases for backward compatibility
export type { ZhipuModel } from '@/lib/ai-service';