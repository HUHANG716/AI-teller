// API route for AI story generation
import { NextRequest, NextResponse } from 'next/server';
import { generateStory } from '@/lib/ai';
import { Genre, Character, StoryNode, DiceRoll, GameGoal } from '@/lib/types';
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
      roundNumber,
      isGoalSelection,
      isEnding,
      selectedModel
    } = body as {
      genre: Genre;
      character: Character;
      history: StoryNode[];
      userInput: string;
      isOpening?: boolean;
      diceRoll?: DiceRoll;
      goal?: GameGoal;
      roundNumber?: number;
      isGoalSelection?: boolean;
      isEnding?: boolean;
      selectedModel?: string;  // Model selected from UI
    };

    // Log comprehensive request details
    apiLogger.info('📥 API Request Received', {
      endpoint: '/api/generate',
      requestParams: {
        genre,
        character: {
          name: character?.name,
        },
        gameState: {
          historyLength: history?.length || 0,
          currentRound: roundNumber,
          isOpening: !!isOpening,
          isGoalSelection: !!isGoalSelection,
          isEnding: !!isEnding,
          phase: isOpening ? 'opening' : isGoalSelection ? 'goal-selection' : isEnding ? 'ending' : 'development'
        },
        diceRoll: diceRoll ? {
          difficulty: diceRoll.difficulty,
          outcome: diceRoll.outcome
        } : null,
        goal: goal ? {
          progress: goal.progress?.percentage
        } : null,
        userInput: userInput ? {
          length: userInput.length,
          content: userInput.length > 100 ? userInput.substring(0, 100) + '...' : userInput
        } : null,
        selectedModel
      }
    });

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

    // Generate story - the new AI service automatically falls back to mock if no API keys are configured
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
      selectedModel  // Pass selected model to generateStory
    });

    const duration = Date.now() - startTime;

    // Log comprehensive response details
    const responseDetails = {
      duration: `${duration}ms`,
      response: {
        contentLength: result.content?.length || 0,
        contentPreview: result.content?.substring(0, 100) + (result.content?.length > 100 ? '...' : ''),
        choicesCount: Array.isArray(result.choices) ? result.choices.length : 0,
        choicesPreview: Array.isArray(result.choices) ? result.choices.slice(0, 2).map(c => typeof c === 'string' ? c.substring(0, 50) + '...' : c.text?.substring(0, 50) + '...') : [],
        goalOptions: result.goalOptions ? {
          count: result.goalOptions.length,
          descriptions: result.goalOptions.map(g => g.description.substring(0, 50) + '...')
        } : null,
        goalProgress: result.goalProgress ? {
          percentage: result.goalProgress.percentage,
          reason: result.goalProgress.reason
        } : null,
        ending: result.ending ? {
          type: result.ending.type,
          title: result.ending.title
        } : null
      }
    };

    console.log('✅ API请求成功:', responseDetails);

    apiLogger.info('📤 API Response Generated', responseDetails);

    return NextResponse.json(result);
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

    return NextResponse.json(
      { error: `AI生成失败: ${errorMessage}` },
      { status: 500 }
    );
  }
}
