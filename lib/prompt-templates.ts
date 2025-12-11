// Prompt templates for different story genres
import { Genre, Character, StoryNode, DiceRoll, GameGoal, Resource } from './types';
import { getOutcomeDescription } from './dice-engine';

// Base output format without goal progress (for rounds before goal is selected)
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
  ],
  "resourceChanges": [{"type": "gold", "amount": 10}]
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
- resourceChanges（可选）：本次行动导致的资源变化，如获得金币、声望、道具等
`;

// Output format with goal progress (for rounds after goal is selected)
export const OUTPUT_FORMAT_WITH_GOAL = `
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
  ],
  "resourceChanges": [{"type": "gold", "amount": 10}],
  "goalProgress": {"description": "进度描述", "percentage": 30}
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
- resourceChanges（可选）：本次行动导致的资源变化，如获得金币、声望、道具等
- goalProgress（必须）：玩家已选择目标，必须更新目标进度描述和百分比（0-100），根据玩家的行动和选择来评估目标完成进度
`;

export const GOAL_SELECTION_OUTPUT_FORMAT = `
【必须严格遵守】请严格按照以下JSON格式回复，不要添加任何其他文字：

{
  "content": "这里是200-300字的剧情内容，自然地在剧情中呈现2-3个可能的目标方向",
  "choices": [
    {
      "text": "选择文本1（代表第一个目标方向）",
      "isGoal": true
    },
    {
      "text": "选择文本2（代表第二个目标方向）",
      "isGoal": true
    },
    {
      "text": "选择文本3（普通选择或第三个目标方向）",
      "isGoal": false
    }
  ],
  "goalOptions": [
    {
      "id": "goal-1",
      "description": "目标描述，如'揭露真相'、'拯救某人'、'建立势力'等",
      "type": "story",
      "requirements": {
        "resources": [{"type": "gold", "amount": 100}],
        "items": ["关键道具名称"],
        "conditions": ["需要完成的条件描述"]
      }
    },
    {
      "id": "goal-2",
      "description": "第二个目标描述",
      "type": "story",
      "requirements": {
        "resources": [],
        "items": [],
        "conditions": ["需要完成的条件描述"]
      }
    }
  ]
}

【关键要求】：
1. choices数组中必须至少有2个选择项标记 isGoal: true
2. goalOptions数组必须包含2-3个目标选项，每个目标必须有id、description、type和requirements
3. 目标描述应该是剧情性的（如"揭露真相"、"拯救某人"、"建立势力"、"复仇"、"寻找宝藏"等）
4. requirements可以包含resources（资源）、items（道具）、conditions（条件）
5. 如果某个选择不是目标选择，isGoal应该为false或省略
`;

export const ROUND_3_GOAL_SELECTION_OUTPUT_FORMAT = `
【必须严格遵守】这是第三轮，必须一次性确定目标和资源系统！请严格按照以下JSON格式回复：

{
  "content": "这里是200-300字的剧情内容，自然地总结前两轮的剧情，并引出玩家需要确定的目标方向。这段内容应该为玩家选择目标做铺垫。",
  "choices": [],
  "goalOptions": [
    {
      "id": "goal-1",
      "description": "目标描述，如'揭露真相'、'拯救某人'、'建立势力'等",
      "type": "story",
      "requirements": {
        "resources": [{"type": "gold", "amount": 100}],
        "items": ["关键道具名称"],
        "conditions": ["需要完成的条件描述"]
      }
    },
    {
      "id": "goal-2",
      "description": "第二个目标描述",
      "type": "story",
      "requirements": {
        "resources": [],
        "items": [],
        "conditions": ["需要完成的条件描述"]
      }
    }
  ],
  "resourceDefinitions": [
    {
      "type": "gold",
      "name": "金币",
      "icon": "💰",
      "initialAmount": 0,
      "description": "游戏中的通用货币"
    },
    {
      "type": "reputation",
      "name": "声望",
      "icon": "⭐",
      "initialAmount": 0,
      "description": "角色在江湖/社会中的声誉"
    }
  ],
  "initialResources": [
    {"type": "gold", "amount": 100},
    {"type": "reputation", "amount": 10}
  ]
}

【关键要求 - 第三轮特殊要求】：
1. 必须提供resourceDefinitions数组，定义本游戏中所有可用的资源类型（2-4个）
   - 资源类型可以是：gold（金币）、reputation（声望）、influence（影响力）
   - 每个资源定义必须包含：type、name（中文名称）、icon（可选emoji）、initialAmount（起始数量）、description（描述）
2. 必须提供initialResources数组，定义玩家的起始资源数量
   - 必须与resourceDefinitions中定义的资源类型对应
   - 每个资源必须包含type和amount
3. 之后的所有资源变化只能在这些已定义的资源类型内进行
4. goalOptions和choices的要求与之前相同
`;

export const ENDING_OUTPUT_FORMAT = `
请严格按照以下JSON格式回复，不要添加任何其他文字：
{
  "content": "这里是结局的完整描述（300-500字）",
  "ending": {
    "type": "success" | "partial-success" | "failure" | "timeout",
    "title": "结局标题",
    "description": "结局的详细描述",
    "conditions": ["导致这个结局的条件描述"]
  }
}

说明：
- 根据目标达成情况生成不同的结局：
  * success: 完全达成目标
  * partial-success: 部分达成目标
  * failure: 未能达成目标
  * timeout: 达到最大轮数但未达成目标
- 结局应该：
  * 总结整个故事的走向
  * 反映玩家的选择和行动
  * 给出一个令人满意的结尾
`;

interface GenrePrompt {
  system: string;
  opening: (character: Character) => string;
  continue: (character: Character, history: StoryNode[], userChoice: string, roundNumber: number, goal?: GameGoal, resources?: Resource[]) => string;
  goalSelection: (character: Character, history: StoryNode[], roundNumber: number) => string;
  ending: (character: Character, history: StoryNode[], goal?: GameGoal, resources?: Resource[]) => string;
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

    continue: (character: Character, history: StoryNode[], userChoice: string, roundNumber: number, goal?: GameGoal, resources?: Resource[]) => {
      const recentHistory = history.slice(-3); // Only use last 3 nodes to avoid token limit
      const historyText = recentHistory
        .map((node, idx) => `【第${idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      let goalInfo = '';
      if (goal) {
        const resourcesText = resources?.map(r => 
          r.type === 'item' ? `${r.name}` : `${r.type === 'gold' ? '金币' : r.type === 'reputation' ? '声望' : '影响力'}: ${r.amount || 0}`
        ).join('、') || '无';
        
        goalInfo = `

【当前目标】
目标：${goal.goal.description}
进度：${goal.progress.description} (${goal.progress.percentage}%)
当前资源：${resourcesText}

重要：剧情应该围绕这个目标推进，根据玩家的行动更新目标进度。在第10-14轮时，开始暗示目标达成情况。`;
      }

      let roundWarning = '';
      if (roundNumber >= 10 && roundNumber < 14) {
        roundWarning = `
注意：当前是第${roundNumber + 1}轮，距离最大轮数（15轮）还有${14 - roundNumber}轮。应该开始暗示目标达成情况，让玩家感受到时间的紧迫性。`;
      }

      // Use different output format based on whether goal exists
      const outputFormat = goal ? OUTPUT_FORMAT_WITH_GOAL : OUTPUT_FORMAT;

      return `
角色信息：
- 姓名：${character.name}
- 特质：${character.tags.join('、')}

之前的剧情：
${historyText}

玩家最新选择：${userChoice}${goalInfo}${roundWarning}

请根据玩家的选择继续推进故事：
1. 承接上文，让剧情自然发展
2. 制造新的冲突或转折
3. 展现角色特质对剧情的影响
4. 保持武侠世界的真实感${goal ? '\n5. 围绕当前目标推进剧情，根据行动更新目标进度' : ''}

然后提供3个新的选择。

${outputFormat}`;
    },
    goalSelection: (character: Character, history: StoryNode[], roundNumber: number) => {
      const recentHistory = history.slice(-2);
      const historyText = recentHistory
        .map((node, idx) => `【第${idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      const isRound3 = roundNumber === 3;
      const outputFormat = isRound3 ? ROUND_3_GOAL_SELECTION_OUTPUT_FORMAT : GOAL_SELECTION_OUTPUT_FORMAT;

      return `
角色信息：
- 姓名：${character.name}
- 特质：${character.tags.join('、')}

之前的剧情：
${historyText}

【重要】当前是第${roundNumber}轮${isRound3 ? '（第三轮）' : ''}，这是目标选择阶段！${isRound3 ? '这是唯一的目标选择轮次，必须同时确定资源系统！' : ''}

${isRound3 ? `
【第三轮特殊要求】：
1. content应该总结前两轮的剧情，自然地引出玩家需要确定的目标方向
2. choices必须为空数组 []（第三轮不提供选择项，只提供目标选项）
3. 必须提供goalOptions数组，包含2-3个目标选项
4. 每个目标应该是剧情性的，如"揭露真相"、"拯救某人"、"建立势力"、"复仇"、"寻找宝藏"等
5. 每个目标应该包含requirements，暗示需要达成的条件
6. 【必须】提供resourceDefinitions和initialResources，定义本游戏的所有资源类型和起始数量

注意：第三轮只用于让玩家选择目标，不提供新的剧情选择。玩家选择目标后，将直接进入第4轮继续游戏。
` : `
【关键要求】：
1. 在剧情内容中自然地呈现2-3个可能的目标方向
2. 在choices数组中，必须提供2-3个选择项，每个目标方向对应一个选择项
3. 每个代表目标的选择项必须标记 isGoal: true
4. 必须提供goalOptions数组，包含2-3个目标选项，与choices中的目标选择项一一对应
5. 每个目标应该是剧情性的，如"揭露真相"、"拯救某人"、"建立势力"、"复仇"、"寻找宝藏"等
6. 每个目标应该包含requirements，暗示需要达成的条件

注意：玩家将通过选择来确定他们的冒险目标。你必须严格按照格式返回。
`}

${outputFormat}`;
    },
    ending: (character: Character, history: StoryNode[], goal?: GameGoal, resources?: Resource[]) => {
      const fullHistory = history.slice(-5);
      const historyText = fullHistory
        .map((node, idx) => `【第${idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      let goalStatus = '';
      if (goal) {
        const isCompleted = goal.completedAt !== undefined;
        goalStatus = `
【目标状态】
目标：${goal.goal.description}
状态：${isCompleted ? '已达成' : goal.progress.percentage >= 70 ? '部分达成' : '未达成'}
进度：${goal.progress.description} (${goal.progress.percentage}%)`;
      }

      const resourcesText = resources?.map(r => 
        r.type === 'item' ? `${r.name}` : `${r.type === 'gold' ? '金币' : r.type === 'reputation' ? '声望' : '影响力'}: ${r.amount || 0}`
      ).join('、') || '无';

      return `
角色信息：
- 姓名：${character.name}
- 特质：${character.tags.join('、')}

完整剧情：
${historyText}${goalStatus}

当前资源：${resourcesText}

请根据以上信息生成一个令人满意的结局：
1. 总结整个故事的走向
2. 反映玩家的选择和行动
3. 根据目标达成情况（完全达成、部分达成、失败、超时）生成相应的结局
4. 结局应该与故事风格一致，给出一个令人满意的结尾
5. 结局描述应该详细（300-500字）

${ENDING_OUTPUT_FORMAT}`;
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

    continue: (character: Character, history: StoryNode[], userChoice: string, roundNumber: number, goal?: GameGoal, resources?: Resource[]) => {
      const recentHistory = history.slice(-3);
      const historyText = recentHistory
        .map((node, idx) => `【第${idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      let goalInfo = '';
      if (goal) {
        const resourcesText = resources?.map(r => 
          r.type === 'item' ? `${r.name}` : `${r.type === 'gold' ? '金币' : r.type === 'reputation' ? '声望' : '影响力'}: ${r.amount || 0}`
        ).join('、') || '无';
        
        goalInfo = `

【当前目标】
目标：${goal.goal.description}
进度：${goal.progress.description} (${goal.progress.percentage}%)
当前资源：${resourcesText}

重要：剧情应该围绕这个目标推进，根据玩家的行动更新目标进度。在第10-14轮时，开始暗示目标达成情况。`;
      }

      let roundWarning = '';
      if (roundNumber >= 10 && roundNumber < 14) {
        roundWarning = `
注意：当前是第${roundNumber + 1}轮，距离最大轮数（15轮）还有${14 - roundNumber}轮。应该开始暗示目标达成情况，让玩家感受到时间的紧迫性。`;
      }

      // Use different output format based on whether goal exists
      const outputFormat = goal ? OUTPUT_FORMAT_WITH_GOAL : OUTPUT_FORMAT;

      return `
角色信息：
- 姓名：${character.name}
- 特质：${character.tags.join('、')}

之前的剧情：
${historyText}

玩家最新选择：${userChoice}${goalInfo}${roundWarning}

请根据玩家的选择继续推进故事：
1. 让剧情自然发展，但加深悬疑感
2. 可以揭示一些线索，但保留更多谜团
3. 根据角色特质影响他们的遭遇
4. 营造紧张或不安的氛围${goal ? '\n5. 围绕当前目标推进剧情，根据行动更新目标进度' : ''}

然后提供3个新的选择。

${outputFormat}`;
    },
    goalSelection: (character: Character, history: StoryNode[], roundNumber: number) => {
      const recentHistory = history.slice(-2);
      const historyText = recentHistory
        .map((node, idx) => `【第${idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      const isRound3 = roundNumber === 3;
      const outputFormat = isRound3 ? ROUND_3_GOAL_SELECTION_OUTPUT_FORMAT : GOAL_SELECTION_OUTPUT_FORMAT;

      return `
角色信息：
- 姓名：${character.name}
- 特质：${character.tags.join('、')}

之前的剧情：
${historyText}

【重要】当前是第${roundNumber}轮${isRound3 ? '（第三轮）' : ''}，这是目标选择阶段！${isRound3 ? '这是唯一的目标选择轮次，必须同时确定资源系统！' : ''}

${isRound3 ? `
【第三轮特殊要求】：
1. content应该总结前两轮的剧情，自然地引出玩家需要确定的目标方向
2. choices必须为空数组 []（第三轮不提供选择项，只提供目标选项）
3. 必须提供goalOptions数组，包含2-3个目标选项
4. 每个目标应该是剧情性的，如"揭露真相"、"拯救某人"、"找到失踪者"、"破解谜团"、"逃离困境"等
5. 每个目标应该包含requirements，暗示需要达成的条件
6. 【必须】提供resourceDefinitions和initialResources，定义本游戏的所有资源类型和起始数量

注意：第三轮只用于让玩家选择目标，不提供新的剧情选择。玩家选择目标后，将直接进入第4轮继续游戏。
` : `
【关键要求】：
1. 在剧情内容中自然地呈现2-3个可能的目标方向
2. 在choices数组中，必须提供2-3个选择项，每个目标方向对应一个选择项
3. 每个代表目标的选择项必须标记 isGoal: true
4. 必须提供goalOptions数组，包含2-3个目标选项，与choices中的目标选择项一一对应
5. 每个目标应该是剧情性的，如"揭露真相"、"拯救某人"、"找到失踪者"、"破解谜团"、"逃离困境"等
6. 每个目标应该包含requirements，暗示需要达成的条件

注意：玩家将通过选择来确定他们的冒险目标。你必须严格按照格式返回。
`}

${outputFormat}`;
    },
    ending: (character: Character, history: StoryNode[], goal?: GameGoal, resources?: Resource[]) => {
      const fullHistory = history.slice(-5);
      const historyText = fullHistory
        .map((node, idx) => `【第${idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      let goalStatus = '';
      if (goal) {
        const isCompleted = goal.completedAt !== undefined;
        goalStatus = `
【目标状态】
目标：${goal.goal.description}
状态：${isCompleted ? '已达成' : goal.progress.percentage >= 70 ? '部分达成' : '未达成'}
进度：${goal.progress.description} (${goal.progress.percentage}%)`;
      }

      const resourcesText = resources?.map(r => 
        r.type === 'item' ? `${r.name}` : `${r.type === 'gold' ? '金币' : r.type === 'reputation' ? '声望' : '影响力'}: ${r.amount || 0}`
      ).join('、') || '无';

      return `
角色信息：
- 姓名：${character.name}
- 特质：${character.tags.join('、')}

完整剧情：
${historyText}${goalStatus}

当前资源：${resourcesText}

请根据以上信息生成一个令人满意的结局：
1. 总结整个故事的走向
2. 反映玩家的选择和行动
3. 根据目标达成情况（完全达成、部分达成、失败、超时）生成相应的结局
4. 结局应该与悬疑故事风格一致，给出一个令人满意的结尾
5. 结局描述应该详细（300-500字）

${ENDING_OUTPUT_FORMAT}`;
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

    continue: (character: Character, history: StoryNode[], userChoice: string, roundNumber: number, goal?: GameGoal, resources?: Resource[]) => {
      const recentHistory = history.slice(-3);
      const historyText = recentHistory
        .map((node, idx) => `【第${idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      let goalInfo = '';
      if (goal) {
        const resourcesText = resources?.map(r => 
          r.type === 'item' ? `${r.name}` : `${r.type === 'gold' ? '金币' : r.type === 'reputation' ? '声望' : '影响力'}: ${r.amount || 0}`
        ).join('、') || '无';
        
        goalInfo = `

【当前目标】
目标：${goal.goal.description}
进度：${goal.progress.description} (${goal.progress.percentage}%)
当前资源：${resourcesText}

重要：剧情应该围绕这个目标推进，根据玩家的行动更新目标进度。在第10-14轮时，开始暗示目标达成情况。`;
      }

      let roundWarning = '';
      if (roundNumber >= 10 && roundNumber < 14) {
        roundWarning = `
注意：当前是第${roundNumber + 1}轮，距离最大轮数（15轮）还有${14 - roundNumber}轮。应该开始暗示目标达成情况，让玩家感受到时间的紧迫性。`;
      }

      // Use different output format based on whether goal exists
      const outputFormat = goal ? OUTPUT_FORMAT_WITH_GOAL : OUTPUT_FORMAT;

      return `
角色信息：
- 姓名：${character.name}
- 特质：${character.tags.join('、')}

之前的剧情：
${historyText}

玩家最新选择：${userChoice}${goalInfo}${roundWarning}

请根据玩家的选择继续推进黑帮故事：
1. 展现权力斗争和利益纷争
2. 制造新的冲突或揭示背叛
3. 根据角色特质影响其在帮派中的地位
4. 对话要犀利有力，充满黑帮味道
5. 可以有暴力场面，但要有格调${goal ? '\n6. 围绕当前目标推进剧情，根据行动更新目标进度' : ''}

然后提供3个新的选择。

${outputFormat}`;
    },
    goalSelection: (character: Character, history: StoryNode[], roundNumber: number) => {
      const recentHistory = history.slice(-2);
      const historyText = recentHistory
        .map((node, idx) => `【第${idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      const isRound3 = roundNumber === 3;
      const outputFormat = isRound3 ? ROUND_3_GOAL_SELECTION_OUTPUT_FORMAT : GOAL_SELECTION_OUTPUT_FORMAT;

      return `
角色信息：
- 姓名：${character.name}
- 特质：${character.tags.join('、')}

之前的剧情：
${historyText}

【重要】当前是第${roundNumber}轮${isRound3 ? '（第三轮）' : ''}，这是目标选择阶段！${isRound3 ? '这是唯一的目标选择轮次，必须同时确定资源系统！' : ''}

${isRound3 ? `
【第三轮特殊要求】：
1. content应该总结前两轮的剧情，自然地引出玩家需要确定的目标方向
2. choices必须为空数组 []（第三轮不提供选择项，只提供目标选项）
3. 必须提供goalOptions数组，包含2-3个目标选项
4. 每个目标应该是剧情性的，如"建立势力"、"复仇"、"掌控权力"、"保护家族"、"扩张地盘"等
5. 每个目标应该包含requirements，暗示需要达成的条件
6. 【必须】提供resourceDefinitions和initialResources，定义本游戏的所有资源类型和起始数量

注意：第三轮只用于让玩家选择目标，不提供新的剧情选择。玩家选择目标后，将直接进入第4轮继续游戏。
` : `
【关键要求】：
1. 在剧情内容中自然地呈现2-3个可能的目标方向
2. 在choices数组中，必须提供2-3个选择项，每个目标方向对应一个选择项
3. 每个代表目标的选择项必须标记 isGoal: true
4. 必须提供goalOptions数组，包含2-3个目标选项，与choices中的目标选择项一一对应
5. 每个目标应该是剧情性的，如"建立势力"、"复仇"、"掌控权力"、"保护家族"、"扩张地盘"等
6. 每个目标应该包含requirements，暗示需要达成的条件

注意：玩家将通过选择来确定他们的冒险目标。你必须严格按照格式返回。
`}

${outputFormat}`;
    },
    ending: (character: Character, history: StoryNode[], goal?: GameGoal, resources?: Resource[]) => {
      const fullHistory = history.slice(-5);
      const historyText = fullHistory
        .map((node, idx) => `【第${idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      let goalStatus = '';
      if (goal) {
        const isCompleted = goal.completedAt !== undefined;
        goalStatus = `
【目标状态】
目标：${goal.goal.description}
状态：${isCompleted ? '已达成' : goal.progress.percentage >= 70 ? '部分达成' : '未达成'}
进度：${goal.progress.description} (${goal.progress.percentage}%)`;
      }

      const resourcesText = resources?.map(r => 
        r.type === 'item' ? `${r.name}` : `${r.type === 'gold' ? '金币' : r.type === 'reputation' ? '声望' : '影响力'}: ${r.amount || 0}`
      ).join('、') || '无';

      return `
角色信息：
- 姓名：${character.name}
- 特质：${character.tags.join('、')}

完整剧情：
${historyText}${goalStatus}

当前资源：${resourcesText}

请根据以上信息生成一个令人满意的结局：
1. 总结整个故事的走向
2. 反映玩家的选择和行动
3. 根据目标达成情况（完全达成、部分达成、失败、超时）生成相应的结局
4. 结局应该与黑帮故事风格一致，给出一个令人满意的结尾
5. 结局描述应该详细（300-500字）

${ENDING_OUTPUT_FORMAT}`;
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
  diceRoll?: DiceRoll,
  roundNumber?: number,
  goal?: GameGoal,
  resources?: Resource[],
  isGoalSelection?: boolean,
  isEnding?: boolean
): { system: string; user: string } {
  const genrePrompt = GENRE_PROMPTS[genre];
  
  let userPrompt: string;
  
  if (isEnding) {
    // Generate ending
    userPrompt = genrePrompt.ending(character, history, goal, resources);
  } else if (isGoalSelection && roundNumber !== undefined) {
    // Goal selection phase (rounds 1-3, roundNumber is 1-based here)
    // roundNumber passed here should be the next round number (1, 2, or 3)
    userPrompt = genrePrompt.goalSelection(character, history, roundNumber);
  } else if (isOpening) {
    // Opening story
    userPrompt = genrePrompt.opening(character);
  } else {
    // Continue story
    const currentRound = roundNumber ?? history.length;
    userPrompt = genrePrompt.continue(character, history, userInput, currentRound, goal, resources);
  }

  // If there was a dice roll, add the result to the prompt
  if (diceRoll && !isEnding) {
    const diceInfo = `

【骰子判定结果】
玩家进行了骰子判定：
- 投掷结果：${diceRoll.dice1} + ${diceRoll.dice2} = ${diceRoll.total}
- 特质加成：+${diceRoll.bonus}${diceRoll.matchedTraits.length > 0 ? ` (${diceRoll.matchedTraits.join('、')})` : ''}
- 最终结果：${diceRoll.finalResult} (难度${diceRoll.difficulty})
- 判定结果：**${getOutcomeDescription(diceRoll.outcome)}**

请根据这个判定结果来描述后续剧情，判定结果必须对剧情产生显著影响：
${diceRoll.outcome === 'critical-success' ? '- 大成功！行动超出预期，带来额外奖励、发现、优势。可能获得物品/信息、改变局势、解锁新选项、降低后续难度。剧情应展现角色的出色表现和意外收获。' : ''}
${diceRoll.outcome === 'perfect' ? '- 完美成功！行动非常顺利，达成目标并有小惊喜。成功达成目标，可能获得小奖励或优势。展现角色的能力和行动的顺利。' : ''}
${diceRoll.outcome === 'success' ? '- 成功！基本达成目标，但可能有些波折。达成目标，但可能付出一定代价或时间。展现行动的成功，但不过分夸张。' : ''}
${diceRoll.outcome === 'fail' ? '- 失败！行动未能达成目标，但不至于造成严重后果。目标未达成，可能需要其他方式，或面临小麻烦。展现行动的失败，但留有转机。' : ''}
${diceRoll.outcome === 'critical-fail' ? '- 大失败！不仅行动失败，还带来严重后果（受伤、暴露、失去机会、陷入困境）。强调失败的严重性和带来的困境。后续可能改变剧情走向，增加新的挑战。' : ''}

重要：根据判定结果调整后续选项的内容和难度。大成功可能解锁新的选项或降低后续难度，大失败可能增加新的挑战选项或提高后续难度。`;
    userPrompt += diceInfo;
  }
  
  return {
    system: genrePrompt.system,
    user: userPrompt,
  };
}

