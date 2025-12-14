// AI service layer using Zhipu AI (智谱GLM)
import { Genre, Character, StoryNode, GenerateStoryResponse, DiceRoll, GameGoal, GamePhase, DiceOutcome } from './types';
import { buildPrompt } from './prompt-templates';
import { aiLogger, logPerformance } from './logger';

// 支持的智谱AI模型
export type ZhipuModel = 'glm-4' | 'glm-4.6' | 'glm-4.5-x' | 'glm-4.5-x-thinking';

// 模型配置
export const ZHIPU_MODELS = {
  'glm-4': { name: 'GLM-4', desc: '标准模型，平衡性能与成本', modelId: 'glm-4', thinking: false },
  'glm-4.6': { name: 'GLM-4.6', desc: '增强版，更强的推理能力', modelId: 'glm-4.6', thinking: false },
  'glm-4.5-x': { name: 'GLM-4.5-X', desc: '快速响应，适合复杂剧情', modelId: 'glm-4.5-x', thinking: false },
  'glm-4.5-x-thinking': { name: 'GLM-4.5-X (Thinking)', desc: '深度思考模式，最强推理', modelId: 'glm-4.5-x', thinking: true },
} as const;

/**
 * 获取当前选择的模型（从localStorage或环境变量）
 */
export function getSelectedModel(): ZhipuModel {
  // 优先从localStorage读取（用户选择）
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ai-teller-zhipu-model');
    console.log('🔍 [getSelectedModel] localStorage值:', saved);
    if (saved && saved in ZHIPU_MODELS) {
      console.log('✅ [getSelectedModel] 使用localStorage模型:', saved);
      return saved as ZhipuModel;
    }
  }
  
  // 否则从环境变量读取
  const envModel = process.env.ZHIPU_MODEL as ZhipuModel;
  console.log('🔍 [getSelectedModel] 环境变量ZHIPU_MODEL:', envModel);
  if (envModel && envModel in ZHIPU_MODELS) {
    console.log('✅ [getSelectedModel] 使用环境变量模型:', envModel);
    return envModel;
  }
  
  // 默认使用 glm-4
  console.log('⚠️ [getSelectedModel] 使用默认模型: glm-4');
  return 'glm-4';  // 🔴 修复：这里应该返回默认值，而不是抛出错误！
}

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
  model?: ZhipuModel; // 允许从客户端传递模型选择
}): Promise<GenerateStoryResponse> {
  const startTime = Date.now();
  
  aiLogger.info({ 
    provider: 'zhipu',
    model: params.model,
    genre: params.genre,
    characterName: params.character.name,
    historyLength: params.history.length,
    isOpening: params.isOpening,
    hasDiceRoll: !!params.diceRoll,
    diceOutcome: params.diceRoll?.outcome
  }, 'AI generation started');
  
  try {
    const result = await callZhipuAPI(params);
    
    logPerformance(aiLogger, 'AI generation', startTime);
    aiLogger.debug({ 
      contentLength: result.content.length,
      choicesCount: Array.isArray(result.choices) ? result.choices.length : 0
    }, 'AI response parsed');
    
    return result;
  } catch (error) {
    aiLogger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      provider: 'zhipu',
      duration: `${Date.now() - startTime}ms`
    }, 'AI generation failed');
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
  model?: ZhipuModel;
}): Promise<GenerateStoryResponse> {
  const startTime = Date.now();
  const apiKey = process.env.ZHIPU_API_KEY;

  if (!apiKey) {
    aiLogger.error('ZHIPU_API_KEY not configured');
    throw new Error('ZHIPU_API_KEY 未配置，请在环境变量中设置');
  }

  // 获取选择的模型配置（优先使用传入的model参数）
  const selectedModel = params.model || getSelectedModel();
  console.log('🔍 [callZhipuAPI] 最终使用的模型:', selectedModel, '来源:', params.model ? '参数传递' : 'getSelectedModel()');
  
  const modelConfig = ZHIPU_MODELS[selectedModel];
  if (!modelConfig) {
    aiLogger.error({ selectedModel }, 'Invalid model selected');
    throw new Error(`无效的模型: ${selectedModel}，支持的模型: ${Object.keys(ZHIPU_MODELS).join(', ')}`);
  }
  
  const isThinkingMode = modelConfig.thinking;

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
    model: selectedModel,
    thinkingMode: isThinkingMode,
    isOpening: params.isOpening,
    hasDiceRoll: !!params.diceRoll,
    hasGoal: !!params.goal,
    goalDescription: params.goal?.goal?.description,
    roundNumber: params.roundNumber,
    isGoalSelection: params.isGoalSelection
  }, 'Starting Zhipu API call');

  try {
    aiLogger.debug({ 
      model: modelConfig.modelId,
      selectedOption: selectedModel,
      thinkingMode: isThinkingMode,
      systemPromptLength: system.length,
      userPromptLength: user.length,
      apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
    }, 'Preparing Zhipu API request');

    // 构建请求体
    const requestBody: any = {
      model: modelConfig.modelId,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],

        temperature: 1,
        max_tokens: 4000,  // 增加到2000，避免推理模式输出被截断
        thinking: {
          type: isThinkingMode ? "enabled" : "disabled"
        }
    };


    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(isThinkingMode ? 60000 : 30000), // thinking模式60秒超时
    });

    aiLogger.debug({ 
      status: response.status, 
      statusText: response.statusText 
    }, 'Zhipu API response received');

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      aiLogger.error({ 
        status: response.status, 
        statusText: response.statusText,
        errorData,
        provider: 'zhipu',
        model: selectedModel
      }, 'Zhipu API returned error status');
      throw new Error(`智谱 API 错误: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // 处理不同模式的响应
    let content: string = '';
    const message = data.choices?.[0]?.message;
    
    if (isThinkingMode && message?.tool_calls) {
      // Thinking模式（通过tools参数启用）
      const thinkResult = message.tool_calls?.[0]?.function?.arguments;
      content = message.content || thinkResult || '';
      console.log('✅ [Thinking Mode] 提取content，长度:', content.length);
    } else if (message?.reasoning_content) {
      // GLM-4.5-x 自动推理模式：内容在 reasoning_content 字段
      console.log('⚠️ [GLM-4.5-x] 检测到 reasoning_content，模型自动启用了推理模式');
      console.log('📝 [reasoning_content] 长度:', message.reasoning_content.length);
      
      // 优先使用 content，如果为空则使用 reasoning_content
      content = message.content || message.reasoning_content || '';
      
      if (!message.content && message.reasoning_content) {
        console.log('⚠️ content为空，使用 reasoning_content 作为内容');
        // reasoning_content 通常是推理过程，需要提取实际内容
        // 如果finish_reason是length，说明输出被截断了
        if (data.choices?.[0]?.finish_reason === 'length') {
          console.log('⚠️ finish_reason=length，输出被截断，需要增加max_tokens');
        }
      }
    } else {
      // 普通模式
      content = message?.content || '';
      console.log('✅ [Normal Mode] 提取content，长度:', content.length);
    }
    
    if (!content) {
      console.error('❌ [Zhipu] 所有字段都为空！');
      console.error('message.content:', message?.content);
      console.error('message.reasoning_content:', message?.reasoning_content);
      console.error('finish_reason:', data.choices?.[0]?.finish_reason);
      
      aiLogger.error({ 
        hasContent: !!message?.content,
        hasReasoningContent: !!message?.reasoning_content,
        finishReason: data.choices?.[0]?.finish_reason,
        message: message
      }, 'No content in Zhipu response');
      
      throw new Error('智谱 API 返回内容为空。可能原因：\n1. max_tokens太小导致输出被截断\n2. 模型启用了推理模式但没有输出最终内容');
    }
    
    console.log('✅ [Zhipu] 成功提取content，长度:', content.length);

    aiLogger.info({ 
      contentLength: content.length,
      model: modelConfig.modelId,
      selectedOption: selectedModel,
      thinkingMode: isThinkingMode
    }, 'Zhipu API call successful');

    return parseAIResponse(content);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorDetails: any = {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : 'Unknown error',
      provider: 'zhipu',
      model: modelConfig.modelId,
      selectedOption: selectedModel,
      thinkingMode: isThinkingMode,
      duration: `${duration}ms`
    };

    if (error instanceof Error) {
      if ('cause' in error) {
        errorDetails.cause = error.cause;
      }
      if ('code' in error) {
        errorDetails.code = (error as any).code;
      }
    }

    aiLogger.error(errorDetails, 'Zhipu API call failed');
    
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || error.message.includes('ECONNRESET')) {
        throw new Error('网络连接失败。可能原因：\n1. 网络连接不稳定\n2. API密钥无效\n\n请检查网络设置和API密钥配置');
      }
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        const timeoutMsg = isThinkingMode ? '60秒' : '30秒';
        throw new Error(`请求超时（${timeoutMsg}），智谱AI响应时间过长，请稍后重试`);
      }
    }
    
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

