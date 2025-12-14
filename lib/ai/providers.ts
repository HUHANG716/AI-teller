import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import type { ProviderType, RawAIResponse } from './types';
import { getProviderConfig } from './config';
import { getModel, getDefaultModel } from '@/lib/models';
import { GENRE_PROMPTS, OUTPUT_FORMAT, PROLOGUE_OUTPUT_FORMAT, GOAL_SELECTION_OUTPUT_FORMAT, ENDING_OUTPUT_FORMAT } from '@/lib/prompt-templates';
import { aiLogger } from '@/lib/logger';
import { Genre, Character, StoryNode, DiceRoll, GameGoal, GamePhase, DiceOutcome, GAME_CONFIG } from '@/lib/types';
import { getOutcomeDescription } from '@/lib/dice-engine';

// Create axios instance with retry configuration
function createAxiosInstance(providerType: ProviderType): AxiosInstance {
  const config = getProviderConfig(providerType);
  const instance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Configure retry
  axiosRetry(instance, {
    retries: config.maxRetries,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      // Retry on network errors or 5xx status codes
      return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        (error.response?.status ?? 0) >= 500;
    },
    onRetry: (retryCount, error) => {
      aiLogger.warn(`Retrying request (attempt ${retryCount})`, {
        provider: providerType,
        error: error.message,
      });
    },
  });

  return instance;
}


// Zhipu provider
export async function callZhipu(prompt: string, model?: string): Promise<RawAIResponse> {
  const instance = createAxiosInstance('zhipu');
  const config = getProviderConfig('zhipu');

  if (!config.apiKey) {
    throw new Error('Zhipu API key not configured');
  }

  const selectedModel = model || getDefaultModel();
  const modelConfig = getModel(selectedModel);

  if (!modelConfig) {
    throw new Error(`Unknown model: ${selectedModel}`);
  }

  const requestBody: any = {
    model: selectedModel,
    messages: [{ role: 'user', content: prompt }],
    temperature: modelConfig.temperature,
    max_tokens: modelConfig.maxTokens,
  };

  // Add thinking parameter for GLM-4.5-x
  if (modelConfig.capabilities?.includes('thinking')) {
    requestBody.thinking = {
      type: "disabled"
    };
  }

  // Log detailed request parameters
  aiLogger.info('🚀 Sending AI Request', {
    provider: 'zhipu',
    model: selectedModel,
    endpoint: '/chat/completions',
    requestBody: {
      model: requestBody.model,
      messages: {
        count: requestBody.messages.length,
        roles: requestBody.messages.map((m: any) => m.role),
        contentLength: requestBody.messages.map((m: any) => `${m.role}: ${m.content.length} chars`)
      },
      temperature: requestBody.temperature,
      max_tokens: requestBody.max_tokens,
      thinking: requestBody.thinking
    },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ***REDACTED***'
    }
  });

  const response = await instance.post('/chat/completions', requestBody, {
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
    },
  });

  // Log the complete raw response for debugging
  const rawContent = response.data.choices?.[0]?.message?.content || '';

  aiLogger.info('✅ Zhipu Response Received', {
    provider: 'zhipu',
    model: response.data.model,
    usage: response.data.usage,
    responseDetails: {
      requestId: response.data.id,
      created: response.data.created,
      object: response.data.object,
      choicesCount: response.data.choices?.length || 0,
      contentLength: rawContent.length,
      contentPreview: rawContent.substring(0, 100) + (rawContent.length > 100 ? '...' : ''),
      finishReason: response.data.choices?.[0]?.finish_reason
    },
    // Log complete raw response when debug level is enabled
    rawResponse: process.env.LOG_LEVEL === 'debug' ? {
      fullContent: rawContent,
      fullResponse: response.data
    } : undefined
  });

  // Always log raw content at debug level
  aiLogger.debug('📄 Raw AI Response Content', {
    provider: 'zhipu',
    model: response.data.model,
    rawContent: rawContent,
    responseMetadata: {
      id: response.data.id,
      usage: response.data.usage,
      finishReason: response.data.choices?.[0]?.finish_reason
    }
  });

  return response.data;
}





// Provider function mapping
export const PROVIDER_FUNCTIONS = {
  zhipu: callZhipu,
};

// Build prompt for generation
export function buildPrompt(
  genre: Genre,
  character: Character,
  history: StoryNode[],
  userInput: string,
  context: {
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
): string {
  const genrePrompt = GENRE_PROMPTS[genre];

  // Handle opening generation
  if (context.isOpening && history.length === 0) {
    return genrePrompt.opening(character);
  }

  // Handle goal selection
  if (context.isGoalSelection) {
    return genrePrompt.goalSelection(
      character,
      history,
      context.roundNumber || 1,
      context.maxRounds || 15
    );
  }

  // Handle ending
  if (context.isEnding) {
    return genrePrompt.ending(character, history, context.goal);
  }

  // Handle continuation - 需要处理骰子信息
  const basePrompt = genrePrompt.continue(
    character,
    history,
    userInput,
    context.roundNumber || 1,
    context.maxRounds || 15,
    context.phase || 'opening',
    context.goal
  );

  // 如果有骰子结果，添加骰子信息到prompt中
  if (context.diceRoll) {
    const diceInfo = `

【骰子判定结果】
玩家进行了骰子判定：
- 投掷结果：${context.diceRoll.dice1} + ${context.diceRoll.dice2} = ${context.diceRoll.total}
- 难度：${context.diceRoll.difficulty}
- 判定结果：**${getOutcomeDescription(context.diceRoll.outcome)}**

请根据这个判定结果来描述后续剧情，判定结果必须对剧情产生显著影响：
${context.diceRoll.outcome === 'critical-success' ? '- 大成功！行动超出预期，带来额外奖励、发现、优势。' : ''}
${context.diceRoll.outcome === 'perfect' ? '- 完美成功！行动非常顺利，达成目标并有小惊喜。' : ''}
${context.diceRoll.outcome === 'success' ? '- 成功！基本达成目标，但可能有些波折。' : ''}
${context.diceRoll.outcome === 'fail' ? '- 失败！行动未能达成目标，面临小麻烦。' : ''}
${context.diceRoll.outcome === 'critical-fail' ? '- 大失败！不仅行动失败，还带来严重后果。' : ''}`;

    return basePrompt + diceInfo;
  }

  return basePrompt;
}

// Call selected provider
export async function callProvider(
  providerType: ProviderType,
  prompt: string,
  model?: string
): Promise<RawAIResponse> {
  const providerFunction = PROVIDER_FUNCTIONS[providerType];

  if (!providerFunction) {
    throw new Error(`Unknown provider: ${providerType}`);
  }

  aiLogger.info('🎯 Calling AI Provider', {
    provider: providerType,
    model,
    promptLength: prompt.length,
    promptPreview: prompt.length > 200 ? prompt.substring(0, 200) + '...' : prompt,
    timestamp: new Date().toISOString()
  });

  try {
    return await providerFunction(prompt, model);
  } catch (error) {
    aiLogger.error('Provider error', {
      provider: providerType,
      error: error instanceof Error ? error.message : String(error),
      promptLength: prompt.length,
      model,
    });
    throw error;
  }
}

// Check if provider is available
export function isProviderAvailable(providerType: ProviderType): boolean {
  const config = getProviderConfig(providerType);
  return !!config.apiKey;
}