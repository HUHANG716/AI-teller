// API route for AI story generation
import { NextRequest, NextResponse } from 'next/server';
import { generateStory, mockGenerateStory } from '@/lib/ai-service';
import { Genre, Character, StoryNode, DiceRoll, GameGoal, Resource } from '@/lib/types';
import { apiLogger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { 
      genre, 
      character, 
      history, 
      userInput, 
      isOpening, 
      diceRoll,
      goal,
      resources,
      roundNumber,
      isGoalSelection,
      isEnding
    } = body as {
      genre: Genre;
      character: Character;
      history: StoryNode[];
      userInput: string;
      isOpening?: boolean;
      diceRoll?: DiceRoll;
      goal?: GameGoal;
      resources?: Resource[];
      roundNumber?: number;
      isGoalSelection?: boolean;
      isEnding?: boolean;
    };

    apiLogger.info({ 
      endpoint: '/api/generate',
      genre,
      characterName: character?.name,
      historyLength: history?.length || 0,
      isOpening: !!isOpening,
      hasDiceRoll: !!diceRoll,
      diceOutcome: diceRoll?.outcome
    }, 'API request received');

    // Validate required fields
    if (!genre || !character) {
      console.error('❌ API请求验证失败: 缺少必需字段', {
        hasGenre: !!genre,
        hasCharacter: !!character,
        body: JSON.stringify(body, null, 2)
      });
      apiLogger.warn({ genre, hasCharacter: !!character }, 'Invalid request: missing fields');
      return NextResponse.json(
        { error: 'Missing required fields: genre and character' },
        { status: 400 }
      );
    }

    // Use mock for development if no API key is configured
    const useMock = !process.env.OPENROUTER_API_KEY &&
                     !process.env.QWEN_API_KEY && 
                     !process.env.ZHIPU_API_KEY && 
                     !process.env.WENXIN_API_KEY;

    if (useMock) {
      apiLogger.debug('Using mock AI response (no API key configured)');
    }

    const result = useMock
      ? await mockGenerateStory({ genre, character, history, userInput, isOpening, diceRoll })
      : await generateStory({ 
          genre, 
          character, 
          history, 
          userInput, 
          isOpening, 
          diceRoll,
          goal,
          resources,
          roundNumber,
          isGoalSelection,
          isEnding
        });

    const duration = Date.now() - startTime;
    
    // Log successful response details
    console.log('✅ API请求成功:', {
      duration: `${duration}ms`,
      contentLength: result.content?.length || 0,
      choicesCount: Array.isArray(result.choices) ? result.choices.length : 0,
      hasGoalOptions: !!result.goalOptions,
      goalOptionsCount: result.goalOptions?.length || 0,
      hasResourceChanges: !!result.resourceChanges,
      resourceChangesCount: result.resourceChanges?.length || 0,
      hasGoalProgress: !!result.goalProgress,
      hasEnding: !!result.ending
    });
    
    apiLogger.info({ 
      duration: `${duration}ms`,
      contentLength: result.content?.length || 0,
      choicesCount: Array.isArray(result.choices) ? result.choices.length : 0,
      hasGoalOptions: !!result.goalOptions,
      hasResourceChanges: !!result.resourceChanges,
      hasGoalProgress: !!result.goalProgress,
      hasEnding: !!result.ending
    }, 'API request completed');

    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('❌ API生成失败:', {
      error: errorMessage,
      stack: errorStack,
      duration: `${duration}ms`,
      genre: body.genre,
      characterName: body.character?.name,
      isOpening: body.isOpening,
      isGoalSelection: body.isGoalSelection,
      isEnding: body.isEnding,
      roundNumber: body.roundNumber
    });
    
    apiLogger.error({ 
      error: errorMessage,
      stack: errorStack,
      duration: `${duration}ms`,
      genre: body.genre,
      characterName: body.character?.name
    }, 'API request failed');
    
    return NextResponse.json(
      { error: `AI生成失败: ${errorMessage}` },
      { status: 500 }
    );
  }
}

