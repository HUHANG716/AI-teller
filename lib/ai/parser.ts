import { z } from 'zod';
import type { GenerateStoryResponse, RawAIResponse } from './types';
import { aiLogger } from '@/lib/logger';

// Choice schema - can be simple string or object
const SimpleChoiceSchema = z.string();
const ComplexChoiceSchema = z.object({
  text: z.string(),
  difficulty: z.number().optional(),
  isGoal: z.boolean().optional(),
});

// Response schema for AI generation
const AIResponseSchema = z.object({
  content: z.string(),
  choices: z.array(z.union([SimpleChoiceSchema, ComplexChoiceSchema])),
  goalOptions: z.array(z.object({
    id: z.string(),
    description: z.string(),
    type: z.literal('story'),
  })).optional(),
  goalProgress: z.object({
    percentage: z.number().min(0).max(100),
    reason: z.string().optional(),
  }).optional(),
  ending: z.object({
    type: z.enum(['success', 'partial-success', 'failure', 'timeout']),
    title: z.string(),
    description: z.string(),
    conditions: z.array(z.string()),
  }).optional(),
});

// Extract content from different provider response formats
function extractContent(response: RawAIResponse): string {
  // Try different response formats
  if (response.choices?.[0]?.message?.content) {
    return response.choices[0].message.content;
  }

  if (response.output?.choices?.[0]?.message?.content) {
    return response.output.choices[0].message.content;
  }

  if (response.result) {
    return response.result;
  }

  throw new Error('No content found in AI response');
}

// Clean and extract JSON from text
function extractJSON(text: string): string {
  // Remove markdown code blocks if present
  text = text.replace(/```json\s*[\r\n]*/g, '').replace(/```\s*$/g, '');

  // Try to find JSON object boundaries
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');

  if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
    throw new Error('No valid JSON found in response');
  }

  return text.substring(jsonStart, jsonEnd + 1);
}

// Parse AI response with fallback options
export function parseAIResponse(response: RawAIResponse): GenerateStoryResponse {
  try {
    const rawContent = extractContent(response);

    // Try to extract and parse JSON
    const jsonStr = extractJSON(rawContent);
    const parsed = JSON.parse(jsonStr);

    // Validate with Zod schema
    const validated = AIResponseSchema.parse(parsed);

    aiLogger.info('Successfully parsed AI response', {
      contentLength: validated.content.length,
      choicesCount: Array.isArray(validated.choices) ? validated.choices.length : 0,
      hasGoalOptions: !!validated.goalOptions,
      hasGoalProgress: !!validated.goalProgress,
      hasEnding: !!validated.ending,
    });

    // Ensure choices are either all strings or all objects
    const hasObjectChoices = validated.choices.some(choice => typeof choice === 'object');
    const normalizedChoices = hasObjectChoices
      ? validated.choices.map(choice => typeof choice === 'string' ? { text: choice } : choice)
      : validated.choices.map(choice => typeof choice === 'object' ? choice.text || String(choice) : choice);

    return {
      ...validated,
      choices: normalizedChoices,
    };

  } catch (error) {
    aiLogger.warn('Failed to parse structured AI response, using fallback', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Fallback: try to extract content without structured format
    try {
      const rawContent = extractContent(response);

      // Split content into lines and create simple choices
      const lines = rawContent.split('\n').filter(line => line.trim());
      const choices = [
        '继续探索',
        '仔细观察',
        '另辟蹊径',
      ];

      // Try to extract choices from the content
      const choiceLines = lines.filter(line =>
        line.match(/^(\d+\.|选择|选项|Choice)/i)
      );

      if (choiceLines.length >= 2) {
        const extractedChoices = choiceLines.map(line =>
          line.replace(/^(\d+\.|选择|选项|Choice[:：]\s*)/i, '').trim()
        ).slice(0, 3);

        choices.splice(0, choices.length, ...extractedChoices);
      }

      return {
        content: lines.slice(0, 10).join('\n'), // First 10 lines as content
        choices: choices.slice(0, 3) as string[], // Explicitly type as string array
      };

    } catch (fallbackError) {
      aiLogger.error('Fallback parsing failed', {
        error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
      });

      // Last resort: return minimal valid response
      return {
        content: '故事生成出现问题，请重新尝试。',
        choices: ['重新开始', '寻求帮助', '稍后再试'],
      };
    }
  }
}

// Validate response format for specific phases
export function validateResponseForPhase(
  response: GenerateStoryResponse,
  phase: 'opening' | 'goal-selection' | 'development' | 'ending'
): boolean {
  switch (phase) {
    case 'opening':
      // Opening should have simple choices without difficulty
      return response.choices.every(choice =>
        typeof choice === 'string' || !choice.difficulty
      );

    case 'goal-selection':
      // Goal selection should have goal options
      return !!response.goalOptions && response.goalOptions.length > 0;

    case 'development':
      // Development should have choices - they can be strings or objects with difficulty
      // Allow both formats to be more forgiving with AI responses
      return response.choices.length > 0;

    case 'ending':
      // Ending should have ending information
      return !!response.ending;

    default:
      return true;
  }
}

// Extract story content from response (removing JSON)
export function extractStoryContent(response: RawAIResponse): string {
  try {
    const rawContent = extractContent(response);

    // Remove JSON and return narrative part
    const jsonStart = rawContent.indexOf('{');
    if (jsonStart > 0) {
      // Return content before JSON
      return rawContent.substring(0, jsonStart).trim();
    }

    // Try to remove markdown formatting
    return rawContent
      .replace(/```json[\s\S]*?```/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .trim();

  } catch (error) {
    aiLogger.warn('Failed to extract story content', { error });
    return '故事内容提取失败，请重试。';
  }
}