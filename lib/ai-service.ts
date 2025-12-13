// AI service layer supporting multiple Chinese LLM providers
import { Genre, Character, StoryNode, GenerateStoryResponse, DiceRoll, GameGoal, GamePhase, DiceOutcome } from './types';
import { buildPrompt } from './prompt-templates';
import { aiLogger, logPerformance } from './logger';

type AIProvider = 'qwen' | 'zhipu' | 'wenxin' | 'openrouter';
type OpenRouterModel = 'deepseek-v3' | 'qwen-2.5-7b';

/**
 * Main function to generate story content using AI
 */
export async function generateStory(params: {
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
}): Promise<GenerateStoryResponse> {
  const startTime = Date.now();
  const provider = (process.env.AI_MODEL_PROVIDER || 'openrouter') as AIProvider;
  
  aiLogger.info({ 
    provider, 
    genre: params.genre,
    characterName: params.character.name,
    historyLength: params.history.length,
    isOpening: params.isOpening,
    hasDiceRoll: !!params.diceRoll,
    diceOutcome: params.diceRoll?.outcome
  }, 'AI generation started');
  
  try {
    let result: GenerateStoryResponse;
    
    switch (provider) {
      case 'openrouter':
        result = await callOpenRouterAPI(params as any);
        break;
      case 'qwen':
        result = await callQwenAPI(params as any);
        break;
      case 'zhipu':
        result = await callZhipuAPI(params as any);
        break;
      case 'wenxin':
        result = await callWenxinAPI(params as any);
        break;
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
    
    logPerformance(aiLogger, 'AI generation', startTime);
    aiLogger.debug({ 
      contentLength: result.content.length,
      choicesCount: Array.isArray(result.choices) ? result.choices.length : 0
    }, 'AI response parsed');
    
    return result;
  } catch (error) {
    aiLogger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      provider,
      duration: `${Date.now() - startTime}ms`
    }, 'AI generation failed');
    throw error;
  }
}

/**
 * Call OpenRouter API (支持 DeepSeek V3, Qwen 2.5 7B 等多个模型)
 */
async function callOpenRouterAPI(params: {
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
}): Promise<GenerateStoryResponse> {
  const startTime = Date.now();
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    aiLogger.error('OPENROUTER_API_KEY not configured');
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const { system, user } = buildPrompt(
    params.genre,
    params.character,
    params.history,
    params.userInput,
    params.isOpening,
    params.diceRoll,
    params.roundNumber,
    params.maxRounds,
    params.phase,
    params.goal,
    params.isGoalSelection,
    params.isEnding
  );
  
  aiLogger.info({
    genre: params.genre,
    characterName: params.character.name,
    isOpening: params.isOpening,
    hasDiceRoll: !!params.diceRoll,
    hasGoal: !!params.goal,
    goalDescription: params.goal?.goal?.description,
    roundNumber: params.roundNumber,
    isGoalSelection: params.isGoalSelection
  }, 'Starting OpenRouter API call');

  // 模型映射
  const modelMap: Record<OpenRouterModel, string> = {
    'deepseek-v3': 'deepseek/deepseek-chat',
    'qwen-2.5-7b': 'qwen/qwen-2.5-7b-instruct',
  };

  const selectedModel = (process.env.AI_MODEL || 'deepseek-v3') as OpenRouterModel;
  const modelId = modelMap[selectedModel] || modelMap['deepseek-v3'];

  try {
    aiLogger.debug({ 
      model: modelId, 
      systemPromptLength: system.length,
      userPromptLength: user.length,
      apiUrl: 'https://openrouter.ai/api/v1/chat/completions'
    }, 'Preparing OpenRouter API request');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'AI Storyteller',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
      // Add timeout and signal for better error handling
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    aiLogger.debug({ 
      status: response.status, 
      statusText: response.statusText 
    }, 'OpenRouter API response received');

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      aiLogger.error({ 
        status: response.status, 
        statusText: response.statusText,
        errorData,
        provider: 'openrouter'
      }, 'OpenRouter API returned error status');
      throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      aiLogger.error({ data }, 'No content in OpenRouter response');
      throw new Error('No content in OpenRouter response');
    }

    aiLogger.info({ 
      contentLength: content.length,
      model: modelId 
    }, 'OpenRouter API call successful');

    return parseAIResponse(content);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorDetails: any = {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : 'Unknown error',
      provider: 'openrouter',
      duration: `${duration}ms`
    };

    // Add more details for network errors
    if (error instanceof Error) {
      if ('cause' in error) {
        errorDetails.cause = error.cause;
      }
      if ('code' in error) {
        errorDetails.code = (error as any).code;
      }
    }

    aiLogger.error(errorDetails, 'OpenRouter API call failed');
    
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || error.message.includes('ECONNRESET')) {
        throw new Error('网络连接失败。可能原因：\n1. 网络连接不稳定\n2. 需要VPN/代理访问OpenRouter\n3. API密钥无效\n\n请检查网络设置或使用Mock模式测试');
      }
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        throw new Error('请求超时（30秒），OpenRouter响应时间过长，请稍后重试');
      }
    }
    
    throw error;
  }
}

/**
 * Call Alibaba Qwen (通义千问) API
 */
async function callQwenAPI(params: {
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
}): Promise<GenerateStoryResponse> {
  const apiKey = process.env.QWEN_API_KEY;

  if (!apiKey) {
    throw new Error('QWEN_API_KEY not configured');
  }

  const { system, user } = buildPrompt(
    params.genre,
    params.character,
    params.history,
    params.userInput,
    params.isOpening,
    params.diceRoll,
    params.roundNumber,
    params.maxRounds,
    params.phase,
    params.goal,
    params.isGoalSelection,
    params.isEnding
  );

  try {
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-max',
        input: {
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        },
        parameters: {
          result_format: 'message',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Qwen API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.output?.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in Qwen response');
    }

    return parseAIResponse(content);
  } catch (error) {
    console.error('Qwen API error:', error);
    throw error;
  }
}

/**
 * Call Zhipu AI (智谱GLM) API
 */
async function callZhipuAPI(params: {
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
}): Promise<GenerateStoryResponse> {
  const apiKey = process.env.ZHIPU_API_KEY;

  if (!apiKey) {
    throw new Error('ZHIPU_API_KEY not configured');
  }

  const { system, user } = buildPrompt(
    params.genre,
    params.character,
    params.history,
    params.userInput,
    params.isOpening,
    params.diceRoll,
    params.roundNumber,
    params.maxRounds,
    params.phase,
    params.goal,
    params.isGoalSelection,
    params.isEnding
  );

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Zhipu API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in Zhipu response');
    }

    return parseAIResponse(content);
  } catch (error) {
    console.error('Zhipu API error:', error);
    throw error;
  }
}

/**
 * Call Baidu Wenxin (文心一言) API
 */
async function callWenxinAPI(params: {
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
}): Promise<GenerateStoryResponse> {
  const apiKey = process.env.WENXIN_API_KEY;
  const secretKey = process.env.WENXIN_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error('WENXIN_API_KEY or WENXIN_SECRET_KEY not configured');
  }

  // First, get access token
  const tokenResponse = await fetch(
    `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`,
    { method: 'POST' }
  );

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    throw new Error('Failed to get Wenxin access token');
  }

  const { system, user } = buildPrompt(
    params.genre,
    params.character,
    params.history,
    params.userInput,
    params.isOpening,
    params.diceRoll,
    params.roundNumber,
    params.maxRounds,
    params.phase,
    params.goal,
    params.isGoalSelection,
    params.isEnding
  );

  try {
    const response = await fetch(
      `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: `${system}\n\n${user}` },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Wenxin API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.result;
    
    if (!content) {
      throw new Error('No content in Wenxin response');
    }

    return parseAIResponse(content);
  } catch (error) {
    console.error('Wenxin API error:', error);
    throw error;
  }
}

/**
 * Parse AI response and extract story content and choices
 * Handles various response formats with fallback
 */
function parseAIResponse(content: string): GenerateStoryResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      const response: GenerateStoryResponse = {
        content: parsed.content || '',
        choices: parsed.choices || [],
      };
      
      // Add optional fields if present
      if (parsed.goalOptions) {
        response.goalOptions = parsed.goalOptions;
      }
      if (parsed.goalProgress) {
        response.goalProgress = parsed.goalProgress;
      }
      if (parsed.ending) {
        response.ending = parsed.ending;
      }
      
      // 第三轮目标选择时 choices 为空数组，但有 goalOptions
      // 结局时 choices 为空数组，但有 ending
      const hasValidChoices = Array.isArray(response.choices) && response.choices.length > 0;
      const hasGoalOptions = Array.isArray(response.goalOptions) && response.goalOptions.length > 0;
      const hasEnding = !!response.ending;

      if (response.content && (hasValidChoices || hasGoalOptions || hasEnding)) {
        return response;
      }
    }
    
    // Fallback: if AI didn't follow format, create a reasonable response
    console.warn('AI response not in expected format, using fallback parsing');
    
    // Try to split by common delimiters to find choices
    const lines = content.split('\n').filter(line => line.trim());
    const choices: string[] = [];
    let storyContent = '';
    
    for (const line of lines) {
      // Look for numbered choices like "1. ", "1) ", "选项1："
      if (/^[\d一二三][\.\)、:：]/.test(line.trim())) {
        const choice = line.replace(/^[\d一二三][\.\)、:：]\s*/, '').trim();
        if (choice && choices.length < 3) {
          choices.push(choice);
        }
      } else if (choices.length === 0 && line.length > 10) {
        // Before we find choices, accumulate story content
        storyContent += line + '\n';
      }
    }
    
    // If we didn't find 3 choices, provide defaults
    while (choices.length < 3) {
      choices.push(`选项 ${choices.length + 1}`);
    }
    
    return {
      content: storyContent.trim() || content.substring(0, 300),
      choices: choices.slice(0, 3),
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    
    // Ultimate fallback
    return {
      content: content.substring(0, 300),
      choices: ['继续探索', '谨慎观察', '另寻他路'],
    };
  }
}

/**
 * Mock AI response for development/testing
 */
export function mockGenerateStory(params: {
  genre: Genre;
  character: Character;
  history: StoryNode[];
  userInput: string;
  isOpening?: boolean;
  diceRoll?: DiceRoll;
}): Promise<GenerateStoryResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (params.isOpening) {
        const openings = {
          wuxia: `江南三月，春雨绵绵。${params.character.name}独自一人行走在青石板路上，身披蓑衣，手持一把油纸伞。前方不远处，一座古老的客栈矗立在烟雨朦胧中，木质招牌上写着"醉仙居"三个大字。忽然，一阵急促的马蹄声从身后传来，数名黑衣人策马狂奔而过，溅起一地泥水。${params.character.name}眉头一皱，感觉这些人来者不善。客栈二楼的窗户突然打开，一位白衣女子探出头来，焦急地四处张望。`,
          'urban-mystery': `深夜十一点，${params.character.name}加完班回到自己租住的老式公寓。走廊里的灯又坏了，只能借着手机的光亮摸索前进。当走到304号房门前时，${params.character.name}注意到邻居王大爷的门虚掩着，里面隐约传来电视的声音。这很不寻常——平时王大爷九点就睡觉了。${params.character.name}犹豫着是否该进去看看。就在这时，自己的房门后传来一声轻微的响动，像是有什么东西掉在地上...`,
          'peaky-blinders': `1925年，伯明翰。夜幕降临，工厂区的烟囱依然吐着黑烟。${params.character.name}推开"金狮酒馆"的木门，烟雾和威士忌的气味扑面而来。酒馆里的人们看到${params.character.name}进来，纷纷压低了声音。角落里，三个戴着平顶帽的男人正在低声交谈，他们是"剃刀帮"的成员。吧台后的老板冲${params.character.name}使了个眼色，示意楼上有人在等。${params.character.name}知道，今晚的会面将决定自己在这个城市的命运——是成为帮派的一员，还是成为街头的一具尸体。`
        };

        resolve({
          content: openings[params.genre] || openings.wuxia,
          choices: [
            '立即进入客栈避雨，暗中观察',
            '跟上黑衣人，一探究竟',
            '上前询问白衣女子发生了什么',
          ],
        });
      } else {
        resolve({
          content: `${params.character.name}做出了选择："${params.userInput}"。故事继续发展中...（这是模拟数据，实际使用时会调用AI生成真实剧情）。后续的剧情会根据你的选择展开，每个决定都会影响故事的走向。`,
          choices: [
            '选项A：继续前进',
            '选项B：停下观察',
            '选项C：寻求帮助',
          ],
        });
      }
    }, 1500); // Simulate API delay
  });
}

