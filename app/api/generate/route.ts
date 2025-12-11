// API route for AI story generation
import { NextRequest, NextResponse } from 'next/server';
import { generateStory, mockGenerateStory } from '@/lib/ai-service';
import { Genre, Character, StoryNode, DiceRoll } from '@/lib/types';
import { apiLogger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { genre, character, history, userInput, isOpening, diceRoll } = body as {
      genre: Genre;
      character: Character;
      history: StoryNode[];
      userInput: string;
      isOpening?: boolean;
      diceRoll?: DiceRoll;
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
      : await generateStory({ genre, character, history, userInput, isOpening, diceRoll });

    const duration = Date.now() - startTime;
    apiLogger.info({ 
      duration: `${duration}ms`,
      contentLength: result.content.length,
      choicesCount: Array.isArray(result.choices) ? result.choices.length : 0
    }, 'API request completed');

    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    apiLogger.error({ 
      error: errorMessage,
      duration: `${duration}ms`,
      stack: error instanceof Error ? error.stack : undefined
    }, 'API request failed');
    
    console.error('API error:', error);
    
    return NextResponse.json(
      { error: `AI生成失败: ${errorMessage}` },
      { status: 500 }
    );
  }
}

