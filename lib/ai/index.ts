import type { GenerateStoryParams, GenerateStoryResponse, ProviderType } from './types';
import { getEnvConfig } from './config';
import { callProvider, buildPrompt, isProviderAvailable } from './providers';
import { parseAIResponse, validateResponseForPhase } from './parser';
import { aiLogger } from '@/lib/logger';

// Main AI story generation function
export async function generateStory(params: GenerateStoryParams): Promise<GenerateStoryResponse> {
  const startTime = Date.now();
  let selectedProvider: ProviderType;
  let model: string | undefined;

  try {
    // Get environment configuration
    const envConfig = getEnvConfig();

    // Determine provider to use
    const selectedModel = params.selectedModel || envConfig.AI_MODEL;

    // Check user-specified provider first
    if (envConfig.AI_MODEL_PROVIDER && isProviderAvailable(envConfig.AI_MODEL_PROVIDER)) {
      selectedProvider = envConfig.AI_MODEL_PROVIDER;
    } else {
      // No fallback to mock - throw error instead
      throw new Error(
        envConfig.AI_MODEL_PROVIDER
          ? `AI provider '${envConfig.AI_MODEL_PROVIDER}' is not configured properly. Please check your API keys.`
          : 'No AI provider configured. Please set AI_MODEL_PROVIDER in your environment variables.'
      );
    }

    // Set model based on provider
    if (selectedProvider === 'zhipu' && selectedModel) {
      model = selectedModel;
    }

    aiLogger.info('Starting AI generation', {
      provider: selectedProvider,
      model,
      genre: params.genre,
      characterName: params.character.name,
      historyLength: params.history.length,
      isOpening: params.isOpening,
      isGoalSelection: params.isGoalSelection,
      isEnding: params.isEnding,
      roundNumber: params.roundNumber,
    });

    // Build prompt
    const prompt = buildPrompt(params.genre, params.character, params.history, params.userInput, {
      isOpening: params.isOpening,
      diceRoll: params.diceRoll,
      goal: params.goal,
      roundNumber: params.roundNumber,
      maxRounds: params.maxRounds,
      phase: params.phase,
      previousOutcome: params.previousOutcome,
      isGoalSelection: params.isGoalSelection,
      isEnding: params.isEnding,
    });

    // Log dice roll information
    if (params.diceRoll) {
      aiLogger.info('Dice roll info in prompt:', {
        dice1: params.diceRoll.dice1,
        dice2: params.diceRoll.dice2,
        total: params.diceRoll.total,
        difficulty: params.diceRoll.difficulty,
        outcome: params.diceRoll.outcome
      });
    }

    // Call provider
    const rawResponse = await callProvider(selectedProvider, prompt, model);

    // Log raw response content for debugging
    const rawContent = rawResponse.choices?.[0]?.message?.content || '';
    aiLogger.debug('🔍 Raw AI Response Before Parsing', {
      provider: selectedProvider,
      model,
      rawContent: rawContent,
      rawResponseStructure: Object.keys(rawResponse),
      responseId: rawResponse.id,
      usage: rawResponse.usage
    });

    // Parse response
    const parsedResponse = parseAIResponse(rawResponse);

    // Validate response for current phase
    const phase = params.isGoalSelection ? 'goal-selection' :
                   params.isEnding ? 'ending' :
                   params.isOpening ? 'opening' : 'development';

    if (!validateResponseForPhase(parsedResponse, phase)) {
      aiLogger.warn('Response validation failed for phase', { phase });
      throw new Error(`AI response validation failed for phase: ${phase}`);
    }

    // Log success
    const duration = Date.now() - startTime;
    aiLogger.info('Story generation completed', {
      provider: selectedProvider,
      model,
      duration: `${duration}ms`,
      contentLength: parsedResponse.content.length,
      choicesCount: Array.isArray(parsedResponse.choices) ? parsedResponse.choices.length : 0,
      hasGoalOptions: !!parsedResponse.goalOptions,
      hasEnding: !!parsedResponse.ending,
    });

    return parsedResponse;

  } catch (error) {
    // Log error
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    aiLogger.error('Story generation failed', {
      provider: selectedProvider,
      model,
      error: errorMessage,
      stack: errorStack,
      duration: `${duration}ms`,
    });

    // No mock fallback - rethrow the error
    throw error;
  }
}

// Export types and utilities
export * from './types';
export * from './config';
export { parseAIResponse, validateResponseForPhase } from './parser';
export { callProvider, buildPrompt, isProviderAvailable } from './providers';