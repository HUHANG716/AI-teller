// API route for AI story generation
import { NextRequest, NextResponse } from 'next/server';
import { generateStory, mockGenerateStory, ZhipuModel } from '@/lib/ai-service';
import {
  GenerateStoryRequestSchema,
  GenerateStoryResponseSchema,
  ErrorResponseSchema,
  type GenerateStoryRequest,
  type GenerateStoryResponse
} from '@/lib/schemas';
import { apiLogger } from '@/lib/logger';
import { ZodError } from 'zod';
import type {
  Genre,
  Character,
  StoryNode,
  DiceRoll,
  GameGoal,
  GamePhase
} from '@/lib/types';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();

    // 🔍 Debug: 打印接收到的 model 参数
    console.log('🔍 [API] 收到的model参数:', body.model || '未指定');

    // Validate request body using Zod schema
    const validationResult = GenerateStoryRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('❌ API请求验证失败:', {
        errors: validationResult.error.issues,
        body: JSON.stringify(body, null, 2)
      });

      apiLogger.warn({
        validationErrors: validationResult.error.issues
      }, 'Invalid request: schema validation failed');

      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    const {
      genre,
      character,
      history,
      userInput,
      isOpening,
      diceRoll,
      goal,
      roundNumber,
      isGoalSelection,
      isEnding,
      model,
      phase
    } = validationResult.data;

    apiLogger.info({
      endpoint: '/api/generate',
      genre,
      characterName: character.name,
      historyLength: history.length,
      isOpening: !!isOpening,
      hasDiceRoll: !!diceRoll,
      diceOutcome: diceRoll?.outcome,
      model
    }, 'API request received');

  


    const result = await generateStory({
          genre,
          character,
          history,
          userInput,
          isOpening,
          diceRoll,
          goal,
          roundNumber,
          isGoalSelection,
          isEnding,
          model,
          phase
        });

    // Validate response using Zod schema
    const responseValidation = GenerateStoryResponseSchema.safeParse(result);

    if (!responseValidation.success) {
      console.error('❌ API响应验证失败:', {
        errors: responseValidation.error.issues
      });

      apiLogger.error({
        validationErrors: responseValidation.error.issues
      }, 'Response validation failed');

      return NextResponse.json(
        {
          error: 'Invalid response format from AI service',
          details: responseValidation.error.issues
        },
        { status: 500 }
      );
    }

    const validatedResult = responseValidation.data;
    const duration = Date.now() - startTime;

    // Log successful response details
    console.log('✅ API请求成功:', {
      duration: `${duration}ms`,
      contentLength: validatedResult.content?.length || 0,
      choicesCount: Array.isArray(validatedResult.choices) ? validatedResult.choices.length : 0,
      hasGoalOptions: !!validatedResult.goalOptions,
      goalOptionsCount: validatedResult.goalOptions?.length || 0,
      hasGoalProgress: !!validatedResult.goalProgress,
      hasEnding: !!validatedResult.ending
    });

    apiLogger.info({
      duration: `${duration}ms`,
      contentLength: validatedResult.content?.length || 0,
      choicesCount: Array.isArray(validatedResult.choices) ? validatedResult.choices.length : 0,
      hasGoalOptions: !!validatedResult.goalOptions,
      hasGoalProgress: !!validatedResult.goalProgress,
      hasEnding: !!validatedResult.ending
    }, 'API request completed');

    return NextResponse.json(validatedResult);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('❌ API生成失败:', {
      error: errorMessage,
      stack: errorStack,
      duration: `${duration}ms`
    });

    apiLogger.error({
      error: errorMessage,
      stack: errorStack,
      duration: `${duration}ms`
    }, 'API request failed');

    // Create error response using schema
    const errorResponse = ErrorResponseSchema.parse({
      error: `AI生成失败: ${errorMessage}`,
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined
    });

    return NextResponse.json(errorResponse, { status: 500 });
  }
}