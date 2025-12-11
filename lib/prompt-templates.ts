// Prompt templates for different story genres
import { Genre, Character, StoryNode, DiceRoll } from './types';
import { getOutcomeDescription } from './dice-engine';

export const OUTPUT_FORMAT = `
请严格按照以下JSON格式回复，不要添加任何其他文字：
{
  "content": "这里是200-300字的剧情内容",
  "choices": [
    "普通选项文本",
    {
      "text": "需要判定的选项文本",
      "requiresDiceRoll": true,
      "difficulty": 8,
      "relevantTraits": ["勇敢", "冷静"]
    },
    "另一个普通选项"
  ]
}

说明：
- choices可以是字符串数组（简单选项）或混合数组（包含需要判定的选项对象）
- 当选项涉及以下场景时，应标记requiresDiceRoll为true：
  * 战斗场景：攻击、防御、闪避、格挡
  * 社交场景：说服、威胁、欺骗、谈判
  * 技能场景：潜行、侦查、破解、追踪
  * 危险场景：跳跃、攀爬、逃跑、冒险行动
- difficulty难度值建议：6（简单）、8（普通）、10（困难）、11-12（极难）
- relevantTraits列出与此行动相关的角色特质，会提供判定加成
`;

interface GenrePrompt {
  system: string;
  opening: (character: Character) => string;
  continue: (character: Character, history: StoryNode[], userChoice: string) => string;
}

export const GENRE_PROMPTS: Record<Genre, GenrePrompt> = {
  wuxia: {
    system: `你是一位精通武侠小说的说书人，擅长创作跌宕起伏、充满江湖气息的故事。
你的风格融合了金庸、古龙的特点：既有波澜壮阔的江湖恩怨，也有细腻的人性刻画。
注意事项：
- 每次生成200-300字的剧情
- 剧情要有画面感和沉浸感
- 保持武侠世界观的一致性（门派、武功、江湖规矩）
- 根据角色特质影响剧情走向
- 提供3个有意义的选择，每个选择都会导向不同的故事分支
- 当选项涉及战斗（攻击、防御、闪避）、危险动作（跳跃、追逐）等风险场景时，应标记为需要骰子判定`,

    opening: (character: Character) => `
角色信息：
- 姓名：${character.name}
- 特质：${character.tags.join('、')}

请为这个角色创作一个武侠故事的精彩开场。
开场要包含：
1. 一个引人入胜的场景（江湖、山野、客栈等）
2. 一个即将发生的事件或冲突
3. 符合角色特质的初始境遇

然后提供3个选择让玩家做出第一个决定。

${OUTPUT_FORMAT}`,

    continue: (character: Character, history: StoryNode[], userChoice: string) => {
      const recentHistory = history.slice(-3); // Only use last 3 nodes to avoid token limit
      const historyText = recentHistory
        .map((node, idx) => `【第${idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      return `
角色信息：
- 姓名：${character.name}
- 特质：${character.tags.join('、')}

之前的剧情：
${historyText}

玩家最新选择：${userChoice}

请根据玩家的选择继续推进故事：
1. 承接上文，让剧情自然发展
2. 制造新的冲突或转折
3. 展现角色特质对剧情的影响
4. 保持武侠世界的真实感

然后提供3个新的选择。

${OUTPUT_FORMAT}`;
    },
  },

  'urban-mystery': {
    system: `你是一位擅长都市灵异悬疑故事的作家，风格类似东野圭吾和蔡骏。
你的故事特点：
- 现代都市背景，融入灵异或超自然元素
- 注重氛围营造和心理描写
- 剧情富有悬念和反转
- 恐怖但不血腥，更注重心理恐惧
注意事项：
- 每次生成200-300字的剧情
- 营造紧张悬疑的气氛
- 合理运用伏笔和暗示
- 根据角色特质影响剧情走向
- 提供3个选择，每个都可能有不同的风险
- 当选项涉及冒险探索、逃跑、对抗未知等高风险行动时，应标记为需要骰子判定`,

    opening: (character: Character) => `
角色信息：
- 姓名：${character.name}
- 特质：${character.tags.join('、')}

请为这个角色创作一个都市灵异悬疑故事的开场。
开场要包含：
1. 一个现代都市场景（公寓、办公室、地铁站等）
2. 第一个不寻常的细节或事件
3. 营造悬疑氛围

然后提供3个选择。

${OUTPUT_FORMAT}`,

    continue: (character: Character, history: StoryNode[], userChoice: string) => {
      const recentHistory = history.slice(-3);
      const historyText = recentHistory
        .map((node, idx) => `【第${idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      return `
角色信息：
- 姓名：${character.name}
- 特质：${character.tags.join('、')}

之前的剧情：
${historyText}

玩家最新选择：${userChoice}

请根据玩家的选择继续推进故事：
1. 让剧情自然发展，但加深悬疑感
2. 可以揭示一些线索，但保留更多谜团
3. 根据角色特质影响他们的遭遇
4. 营造紧张或不安的氛围

然后提供3个新的选择。

${OUTPUT_FORMAT}`;
    },
  },

  'peaky-blinders': {
    system: `你是一位精通黑帮题材的说书人，风格类似《浴血黑帮》(Peaky Blinders)。
你的故事特点：
- 1920年代英格兰工业城市背景（也可以是民国时期的上海滩）
- 黑帮家族、权力斗争、利益纷争
- 人物性格鲜明，对话犀利有力
- 暴力美学与绅士风度并存
- 充满背叛、忠诚、野心与复仇
注意事项：
- 每次生成200-300字的剧情
- 营造紧张的黑帮氛围和权力游戏
- 展现角色在道德灰色地带的挣扎
- 对话要简洁有力，充满张力
- 根据角色特质影响其在帮派中的地位和选择
- 提供3个选择，每个都关乎生死存亡或权力更迭
- 当选项涉及枪战、谈判对抗、威胁、暗杀等危险场景时，应标记为需要骰子判定`,

    opening: (character: Character) => `
角色信息：
- 姓名：${character.name}
- 特质：${character.tags.join('、')}

请为这个角色创作一个浴血黑帮风格的开场故事。
背景设定：1920年代工业城市或民国上海滩
开场要包含：
1. 一个充满黑帮氛围的场景（酒馆、赌场、码头、帮派据点等）
2. 帮派势力介绍或权力冲突的开端
3. 角色的初始身份和处境

然后提供3个选择，每个都关乎角色在黑道上的抉择。

${OUTPUT_FORMAT}`,

    continue: (character: Character, history: StoryNode[], userChoice: string) => {
      const recentHistory = history.slice(-3);
      const historyText = recentHistory
        .map((node, idx) => `【第${idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      return `
角色信息：
- 姓名：${character.name}
- 特质：${character.tags.join('、')}

之前的剧情：
${historyText}

玩家最新选择：${userChoice}

请根据玩家的选择继续推进黑帮故事：
1. 展现权力斗争和利益纷争
2. 制造新的冲突或揭示背叛
3. 根据角色特质影响其在帮派中的地位
4. 对话要犀利有力，充满黑帮味道
5. 可以有暴力场面，但要有格调

然后提供3个新的选择。

${OUTPUT_FORMAT}`;
    },
  },
};

/**
 * Build the complete prompt for AI generation
 */
export function buildPrompt(
  genre: Genre,
  character: Character,
  history: StoryNode[],
  userInput: string,
  isOpening: boolean = false,
  diceRoll?: DiceRoll
): { system: string; user: string } {
  const genrePrompt = GENRE_PROMPTS[genre];
  
  let userPrompt = isOpening
    ? genrePrompt.opening(character)
    : genrePrompt.continue(character, history, userInput);

  // If there was a dice roll, add the result to the prompt
  if (diceRoll) {
    const diceInfo = `

【骰子判定结果】
玩家进行了骰子判定：
- 投掷结果：${diceRoll.dice1} + ${diceRoll.dice2} = ${diceRoll.total}
- 特质加成：+${diceRoll.bonus}${diceRoll.matchedTraits.length > 0 ? ` (${diceRoll.matchedTraits.join('、')})` : ''}
- 最终结果：${diceRoll.finalResult} (难度${diceRoll.difficulty})
- 判定结果：**${getOutcomeDescription(diceRoll.outcome)}**

请根据这个判定结果来描述后续剧情：
${diceRoll.outcome === 'critical-success' ? '- 大成功！剧情应展现超出预期的完美表现，可能获得额外奖励或创造意外的好结果' : ''}
${diceRoll.outcome === 'perfect' ? '- 完美成功！行动非常顺利，达成目标并略有惊喜' : ''}
${diceRoll.outcome === 'success' ? '- 成功！行动达成了基本目标' : ''}
${diceRoll.outcome === 'fail' ? '- 失败！行动未能达成目标，但不至于造成严重后果' : ''}
${diceRoll.outcome === 'critical-fail' ? '- 大失败！不仅行动失败，还带来了额外的麻烦或危险' : ''}
`;
    userPrompt += diceInfo;
  }
  
  return {
    system: genrePrompt.system,
    user: userPrompt,
  };
}

