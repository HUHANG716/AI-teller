import { z } from 'zod';

// ============ Basic Types ============
export const GenreSchema = z.enum(['wuxia', 'urban-mystery', 'peaky-blinders']);

export const GamePhaseSchema = z.enum(['opening', 'goal-selection', 'development', 'climax', 'ending']);

export const DiceOutcomeSchema = z.enum(['critical-fail', 'fail', 'success', 'perfect', 'critical-success']);

export const EndingTypeSchema = z.enum(['success', 'partial-success', 'failure', 'timeout']);

// ============ Character ============
export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Character name is required'),
  description: z.string(),
  createdAt: z.number()
});

// ============ Dice System ============
export const DiceRollSchema = z.object({
  dice1: z.number().min(1).max(6),
  dice2: z.number().min(1).max(6),
  total: z.number().min(2).max(12),
  difficulty: z.number().min(1).max(12),
  outcome: DiceOutcomeSchema
});

// ============ Choices & Goals ============
export const ChoiceSchema = z.object({
  text: z.string().min(1, 'Choice text is required'),
  difficulty: z.number().min(1).max(12).optional(),
  isGoal: z.boolean().optional()
});

export const GoalSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Goal description is required'),
  type: z.literal('story')
});

export const GameGoalSchema = z.object({
  goal: GoalSchema,
  selectedAt: z.number(),
  progress: z.object({
    percentage: z.number().min(0).max(100),
    reason: z.string().optional()
  }),
  completedAt: z.number().optional()
});

// ============ Story & Game State ============
export const StoryNodeSchema = z.object({
  id: z.string(),
  content: z.string().min(1, 'Story content is required'),
  choices: z.union([z.array(ChoiceSchema), z.array(z.string())]),
  userChoice: z.string().optional(),
  diceRoll: DiceRollSchema.optional(),
  timestamp: z.number(),
  goalOptions: z.array(GoalSchema).optional()
});

export const EndingSchema = z.object({
  type: EndingTypeSchema,
  title: z.string(),
  description: z.string(),
  conditions: z.array(z.string())
});

export const GameStateSchema = z.object({
  id: z.string(),
  genre: GenreSchema,
  character: CharacterSchema,
  storyNodes: z.array(StoryNodeSchema),
  currentNodeIndex: z.number().min(0),
  createdAt: z.number(),
  updatedAt: z.number(),
  goal: GameGoalSchema.optional(),
  ending: EndingSchema.optional(),
  maxRounds: z.number().min(1)
});

// ============ API Request/Response ============
export const GenerateStoryRequestSchema = z.object({
  genre: GenreSchema,
  character: CharacterSchema,
  history: z.array(StoryNodeSchema),
  userInput: z.string(),
  isOpening: z.boolean().optional(),
  diceRoll: DiceRollSchema.optional(),
  goal: GameGoalSchema.optional(),
  roundNumber: z.number().min(1).optional(),
  isGoalSelection: z.boolean().optional(),
  isEnding: z.boolean().optional(),
  model: z.enum(['glm-4', 'glm-4.6', 'glm-4.5-x', 'glm-4.5-x-thinking']).optional(),
  phase: GamePhaseSchema.optional(),
  maxRounds: z.number().min(1).optional()
}).refine(
  (data) => {
    // User input is required unless it's an opening or ending
    if (data.isOpening || data.isEnding) {
      return true; // userInput can be empty
    }
    return data.userInput.length > 0; // userInput must have content
  },
  {
    message: 'User input is required for gameplay choices',
    path: ['userInput']
  }
);

export const GenerateStoryResponseSchema = z.object({
  content: z.string().min(1, 'Story content is required'),
  choices: z.union([z.array(ChoiceSchema), z.array(z.string())]),
  goalOptions: z.array(GoalSchema).optional(),
  goalProgress: z.object({
    percentage: z.number().min(0).max(100),
    reason: z.string().optional()
  }).optional(),
  ending: EndingSchema.optional()
});

// ============ Character Form ============
export const CharacterFormDataSchema = z.object({
  name: z.string().min(1, 'Character name is required').max(50, 'Character name too long'),
  genre: GenreSchema
});

// ============ Error Response ============
export const ErrorResponseSchema = z.object({
  error: z.string()
});

// ============ Game Phase Config ============
export const GAME_CONFIG = {
  defaultMaxRounds: 6,      // 默认最大轮数
  openingRounds: 2,          // 开局轮数
  goalSelectionRound: 3,     // 目标选择轮
  climaxRoundsBeforeEnd: 2,  // 结局前多少轮进入高潮
  // 字数配置
  storyWordCount: '200-300',   // 普通剧情字数
  endingWordCount: '300-500',  // 结局字数
};

// ============ Type Inference ============
export type Genre = z.infer<typeof GenreSchema>;
export type GamePhase = z.infer<typeof GamePhaseSchema>;
export type DiceOutcome = z.infer<typeof DiceOutcomeSchema>;
export type EndingType = z.infer<typeof EndingTypeSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type DiceRoll = z.infer<typeof DiceRollSchema>;
export type Choice = z.infer<typeof ChoiceSchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type GameGoal = z.infer<typeof GameGoalSchema>;
export type StoryNode = z.infer<typeof StoryNodeSchema>;
export type Ending = z.infer<typeof EndingSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type GenerateStoryRequest = z.infer<typeof GenerateStoryRequestSchema>;
export type GenerateStoryResponse = z.infer<typeof GenerateStoryResponseSchema>;
export type CharacterFormData = z.infer<typeof CharacterFormDataSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ============ Game Phase Function ============
export function getGamePhase(roundNumber: number, maxRounds: number): GamePhase {
  const checks = {
    roundNumber,
    maxRounds,
    openingRounds: GAME_CONFIG.openingRounds,
    goalSelectionRound: GAME_CONFIG.goalSelectionRound,
    climaxRoundsBeforeEnd: GAME_CONFIG.climaxRoundsBeforeEnd,
    isOpening: roundNumber <= GAME_CONFIG.openingRounds,
    isGoalSelection: roundNumber === GAME_CONFIG.goalSelectionRound,
    isEnding: roundNumber >= maxRounds,
    isClimax: roundNumber >= maxRounds - GAME_CONFIG.climaxRoundsBeforeEnd + 1,
    climaxThreshold: maxRounds - GAME_CONFIG.climaxRoundsBeforeEnd + 1
  };

  console.log('🎭 [getGamePhase] 计算阶段:', checks);

  if (roundNumber <= GAME_CONFIG.openingRounds) {
    console.log('🎭 [getGamePhase] 返回: opening');
    return 'opening';
  }
  if (roundNumber === GAME_CONFIG.goalSelectionRound) {
    console.log('🎭 [getGamePhase] 返回: goal-selection');
    return 'goal-selection';
  }
  if (roundNumber >= maxRounds) {
    console.log('🎭 [getGamePhase] 返回: ending');
    return 'ending';
  }
  if (roundNumber >= maxRounds - GAME_CONFIG.climaxRoundsBeforeEnd + 1) {
    console.log('🎭 [getGamePhase] 返回: climax');
    return 'climax';
  }

  console.log('🎭 [getGamePhase] 返回: development');
  return 'development';
}