// Prompt templates for different story genres
import { Genre, Character, StoryNode, DiceRoll, GameGoal, GamePhase, GAME_CONFIG } from './types';
import { getOutcomeDescription } from './dice-engine';

// Base output format (simplified - no choiceType or resources)
export const OUTPUT_FORMAT = `
请严格按照以下JSON格式回复，不要添加任何其他文字：
{
  "content": "这里是${GAME_CONFIG.storyWordCount}字的剧情内容",
  "choices": [
    {
      "text": "选项1描述",
      "difficulty": 8
    },
    {
      "text": "选项2描述",
      "difficulty": 6
    },
    {
      "text": "选项3描述",
      "difficulty": 7
    }
  ]
}

【选项说明】：
- difficulty难度值：6（简单）、8（普通）、10（困难）、11-12（极难）
- 每个选项都需要骰子判定
- 提供3个不同的选项让玩家选择
`;

// 序章阶段输出格式（无骰子判定，纯叙事选择）
export const PROLOGUE_OUTPUT_FORMAT = `
请严格按照以下JSON格式回复，不要添加任何其他文字：
{
  "content": "这里是${GAME_CONFIG.storyWordCount}字的剧情内容",
  "choices": [
    {
      "text": "选项1描述"
    },
    {
      "text": "选项2描述"
    },
    {
      "text": "选项3描述"
    }
  ]
}

【序章阶段 - 重要说明】：
- 这是序章阶段（前3轮），选项**不需要骰子判定**
- **绝对不要在choices中包含difficulty字段**
- 选项应该是叙事性的探索和互动
- 为后续的目标选择铺垫
- JSON格式中每个choice对象只能有text字段，不能有difficulty字段
`;

// Output format with goal progress (for rounds after goal is selected)
export const OUTPUT_FORMAT_WITH_GOAL = `
请严格按照以下JSON格式回复，不要添加任何其他文字：
{
  "content": "这里是${GAME_CONFIG.storyWordCount}字的剧情内容",
  "choices": [
    {
      "text": "选项1描述",
      "difficulty": 8
    },
    {
      "text": "选项2描述",
      "difficulty": 6
    },
    {
      "text": "选项3描述",
      "difficulty": 7
    }
  ],
  "goalProgress": {
    "percentage": 30,
    "reason": "本次进度变化的原因说明"
  }
}

【选项说明】：
- difficulty难度值：6（简单）、8（普通）、10（困难）、11-12（极难）
- 越难的选项应该给予更多的进度奖励！

【进度规则 - 必须严格遵守】
根据玩家选择的难度和骰子结果计算进度变化：

成功时的进度增量（基于难度）：
- 简单(6): +5-10%
- 普通(8): +10-15%
- 困难(10): +15-25%
- 极难(11-12): +20-35%

骰子结果修正：
- 大成功: 上述增量×1.5
- 完美成功: 上述增量×1.2
- 普通成功: 正常增量
- 失败: 进度不变或-5%
- 大失败: 进度-10%

【重要】进度可以在任何轮次达到100%！一旦达到100%，目标即刻完成！
`;

export const GOAL_SELECTION_OUTPUT_FORMAT = `
【必须严格遵守】这是目标选择阶段！请严格按照以下JSON格式回复：

{
  "content": "这里是${GAME_CONFIG.storyWordCount}字的剧情内容，自然地总结前面的剧情，并引出玩家需要确定的目标方向",
  "choices": [],
  "goalOptions": [
    {
      "id": "goal-1",
      "description": "目标描述，如'揭露真相'、'拯救某人'、'建立势力'等",
      "type": "story"
    },
    {
      "id": "goal-2",
      "description": "第二个目标描述",
      "type": "story"
    }
  ]
}

【关键要求】：
1. choices必须为空数组 []（目标选择阶段不提供普通选项）
2. 必须提供goalOptions数组，包含2-3个目标选项
3. 每个目标应该是剧情性的，描述清晰明确
`;

export const ENDING_OUTPUT_FORMAT = `
请严格按照以下JSON格式回复，不要添加任何其他文字：
{
  "content": "这里是结局的完整描述（${GAME_CONFIG.endingWordCount}字）",
  "choices": [],
  "ending": {
    "type": "success",
    "title": "结局标题",
    "conditions": ["导致这个结局的条件描述"]
  }
}

【关键要求 - 必须严格遵守】
结局内容必须与目标进度完全匹配：

- 进度 < 30%: 彻底的失败结局
  * 主角的努力化为泡影，目标完全没有达成
  * 描写失败带来的负面后果和遗憾
  * 不能出现任何积极或成功的暗示

- 进度 30-69%: 失败但有收获
  * 目标未达成，但过程中有所成长
  * 重点描写未完成的遗憾和代价

- 进度 70-99%: 接近成功但功亏一篑
  * 差一点就成功了，有遗憾但也有成就

- 进度 100%: 圆满结局
  * 完全达成目标，正面积极的结局

【警告】如果进度低于70%，绝对不能写成目标达成或成功的内容！
`;

// Phase-specific prompt segments
function getPhasePrompt(phase: GamePhase, roundNumber: number, maxRounds: number): string {
  const remaining = maxRounds - roundNumber;
  const adventureRounds = maxRounds - GAME_CONFIG.goalSelectionRound; // 正式冒险的轮数

  switch (phase) {
    case 'opening':
      if (roundNumber === 1) {
        return `
【序章 · 第一章：开场】
- 这是故事的开场，建立世界观和初始场景
- 介绍主角所处的环境和初始状态
- 埋下一些伏笔，但不要急于推进主线
- **选项应该是叙事性的探索，不需要难度值（difficulty），不需要骰子判定**`;
      } else {
        return `
【序章 · 第二章：铺垫】
- 这是故事的铺垫阶段，展开背景设定
- 可以引入重要的配角或势力
- 制造一些悬念或冲突的苗头
- 为即将到来的目标选择做铺垫
- **选项应该是叙事性的探索，不需要难度值（difficulty），不需要骰子判定**`;
      }

    case 'goal-selection':
      return `
【序章 · 第三章：抉择】第${roundNumber}/${maxRounds}轮
- 这是目标选择轮，玩家将确定冒险目标
- 总结前两章的铺垫，自然引出目标方向
- **这一轮不提供普通选项，只提供目标选项（goalOptions）**`;

    case 'development':
      const currentAdventureRound = roundNumber - GAME_CONFIG.goalSelectionRound;
      return `
【正式冒险】第${currentAdventureRound}/${adventureRounds}轮，还剩${remaining}轮
- 围绕目标推进剧情
- 根据玩家行动和骰子结果更新目标进度
- 制造有意义的挑战和抉择`;

    case 'climax':
      const currentAdventureRoundClimax = roundNumber - GAME_CONFIG.goalSelectionRound;
      return `
【高潮阶段 - 重要】第${currentAdventureRoundClimax}/${adventureRounds}轮，还剩${remaining}轮结束！
要求：
1. 剧情必须开始收束，引向结局
2. 本轮选择将直接决定结局走向
3. 不要引入新角色或新支线
4. 选项应该是"最终抉择"类型，只提供2个关键选项
5. 目标进度必须有明确进展（+20%以上）
6. 剧情走向必须明确（成功方向/失败方向）`;

    case 'ending':
      return `
【结局阶段】
- 生成最终结局，总结整个故事`;

    default:
      return '';
  }
}

interface GenrePrompt {
  system: string;
  opening: (character: Character) => string;
  continue: (character: Character, history: StoryNode[], userChoice: string, roundNumber: number, maxRounds: number, phase: GamePhase, goal?: GameGoal) => string;
  goalSelection: (character: Character, history: StoryNode[], roundNumber: number, maxRounds: number) => string;
  ending: (character: Character, history: StoryNode[], goal?: GameGoal) => string;
}

export const GENRE_PROMPTS: Record<Genre, GenrePrompt> = {
  wuxia: {
    system: `你是一位精通武侠小说的说书人，擅长创作跌宕起伏、充满江湖气息的故事。
你的风格融合了金庸、古龙的特点：既有波澜壮阔的江湖恩怨，也有细腻的人性刻画。
注意事项：
- 每次生成${GAME_CONFIG.storyWordCount}字的剧情
- 剧情要有画面感和沉浸感
- 保持武侠世界观的一致性`,

    opening: (character: Character) => `
角色信息：
- 姓名：${character.name}

【序章 · 第一章：开场】
请为这个角色创作一个武侠故事的精彩开场。
开场要包含：
1. 一个引人入胜的场景（江湖、山野、客栈等）
2. 一个即将发生的事件或冲突
3. 角色的初始处境
4. 埋下一些伏笔，但不要急于推进主线

然后提供3个探索性选择让玩家做出第一个决定。
**注意：这是序章阶段，选项不需要difficulty字段，不需要骰子判定！**

${PROLOGUE_OUTPUT_FORMAT}`,

    continue: (character: Character, history: StoryNode[], userChoice: string, roundNumber: number, maxRounds: number, phase: GamePhase, goal?: GameGoal) => {
      const recentHistory = history.slice(-3);
      const historyText = recentHistory
        .map((node, idx) => `【第${history.length - recentHistory.length + idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      let goalInfo = '';
      if (goal) {
        goalInfo = `

【当前目标】
目标：${goal.goal.description}
进度：${goal.progress.percentage}%`;
      }

      const phasePrompt = getPhasePrompt(phase, roundNumber, maxRounds);
      // 序章阶段（包括开场和目标选择）使用无骰子的格式，正式冒险阶段根据是否有目标选择格式
      const isPrologue = phase === 'opening' || phase === 'goal-selection';
      const outputFormat = isPrologue ? PROLOGUE_OUTPUT_FORMAT : (goal ? OUTPUT_FORMAT_WITH_GOAL : OUTPUT_FORMAT);

      console.log('🎮 [武侠] 格式选择:', {
        roundNumber,
        phase,
        isPrologue,
        hasGoal: !!goal,
        formatType: isPrologue ? 'PROLOGUE(无难度)' : (goal ? 'WITH_GOAL(有难度)' : 'NORMAL(有难度)')
      });

      return `
角色信息：
- 姓名：${character.name}
${phasePrompt}
之前的剧情：
${historyText}

玩家最新选择：${userChoice}${goalInfo}

请根据玩家的选择继续推进故事：
1. 承接上文，让剧情自然发展
2. 制造新的冲突或转折
3. 保持武侠世界的真实感${goal ? '\n4. 围绕当前目标推进剧情，更新目标进度' : ''}${isPrologue ? '\n\n**重要提醒：当前是序章阶段（前3轮），选项不需要difficulty字段，不需要骰子判定！**' : ''}

然后提供3个新的选择（高潮阶段只提供2个关键选择）。

${outputFormat}`;
    },

    goalSelection: (character: Character, history: StoryNode[], roundNumber: number, maxRounds: number) => {
      const recentHistory = history.slice(-2);
      const historyText = recentHistory
        .map((node, idx) => `【第${idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      return `
角色信息：
- 姓名：${character.name}

之前的剧情：
${historyText}

【重要】当前是第${roundNumber}/${maxRounds}轮，这是目标选择阶段！

要求：
1. content应该总结前面的剧情，自然地引出玩家需要确定的目标方向
2. choices必须为空数组 []
3. 必须提供2-3个目标选项（goalOptions）
4. 每个目标应该是剧情性的，如"揭露真相"、"拯救某人"、"建立势力"、"复仇"等

${GOAL_SELECTION_OUTPUT_FORMAT}`;
    },

    ending: (character: Character, history: StoryNode[], goal?: GameGoal) => {
      const fullHistory = history.slice(-5);
      const historyText = fullHistory
        .map((node, idx) => `【第${idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      let goalStatus = '';
      let progressWarning = '';
      if (goal) {
        const percentage = goal.progress.percentage;
        const isCompleted = goal.completedAt !== undefined;
        goalStatus = `
【目标状态 - 极其重要】
目标：${goal.goal.description}
当前进度：${percentage}%
状态：${isCompleted ? '已达成' : percentage >= 70 ? '部分达成' : '未达成'}`;

        if (percentage < 30) {
          progressWarning = `
【警告】进度只有${percentage}%，必须生成彻底的失败结局！
- 主角的目标完全没有达成
- 描写失败带来的负面后果
- 绝对不能暗示成功或目标达成`;
        } else if (percentage < 70) {
          progressWarning = `
【警告】进度只有${percentage}%，必须生成失败结局！
- 目标未能达成，但有所收获
- 重点描写遗憾和代价`;
        }
      }

      return `
角色信息：
- 姓名：${character.name}

完整剧情：
${historyText}${goalStatus}${progressWarning}

请根据以上信息生成结局：
1. 总结整个故事的走向
2. 反映玩家的选择和行动
3. 【最重要】结局内容必须与进度百分比一致！
4. 结局描述应该详细（${GAME_CONFIG.endingWordCount}字）

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
- 每次生成${GAME_CONFIG.storyWordCount}字的剧情
- 营造紧张悬疑的气氛`,

    opening: (character: Character) => `
角色信息：
- 姓名：${character.name}

【序章 · 第一章：开场】
请为这个角色创作一个都市灵异悬疑故事的开场。
开场要包含：
1. 一个现代都市场景（公寓、办公室、地铁站等）
2. 第一个不寻常的细节或事件
3. 营造悬疑氛围
4. 埋下一些伏笔，但保持神秘感

然后提供3个探索性选择。
**注意：这是序章阶段，选项不需要difficulty字段，不需要骰子判定！**

${PROLOGUE_OUTPUT_FORMAT}`,

    continue: (character: Character, history: StoryNode[], userChoice: string, roundNumber: number, maxRounds: number, phase: GamePhase, goal?: GameGoal) => {
      const recentHistory = history.slice(-3);
      const historyText = recentHistory
        .map((node, idx) => `【第${history.length - recentHistory.length + idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      let goalInfo = '';
      if (goal) {
        goalInfo = `

【当前目标】
目标：${goal.goal.description}
进度：${goal.progress.percentage}%`;
      }

      const phasePrompt = getPhasePrompt(phase, roundNumber, maxRounds);
      // 序章阶段（包括开场和目标选择）使用无骰子的格式，正式冒险阶段根据是否有目标选择格式
      const isPrologue = phase === "opening" || phase === 'goal-selection';
      const outputFormat = isPrologue ? PROLOGUE_OUTPUT_FORMAT : (goal ? OUTPUT_FORMAT_WITH_GOAL : OUTPUT_FORMAT);

      return `
角色信息：
- 姓名：${character.name}
${phasePrompt}
之前的剧情：
${historyText}

玩家最新选择：${userChoice}${goalInfo}

请根据玩家的选择继续推进故事：
1. 让剧情自然发展，但加深悬疑感
2. 可以揭示一些线索，但保留更多谜团
3. 营造紧张或不安的氛围${goal ? '\n4. 围绕当前目标推进剧情，更新目标进度' : ''}${isPrologue ? '\n\n**重要提醒：当前是序章阶段（前3轮），选项不需要difficulty字段，不需要骰子判定！**' : ''}

然后提供3个新的选择（高潮阶段只提供2个关键选择）。

${outputFormat}`;
    },

    goalSelection: (character: Character, history: StoryNode[], roundNumber: number, maxRounds: number) => {
      const recentHistory = history.slice(-2);
      const historyText = recentHistory
        .map((node, idx) => `【第${idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      return `
角色信息：
- 姓名：${character.name}

之前的剧情：
${historyText}

【重要】当前是第${roundNumber}/${maxRounds}轮，这是目标选择阶段！

要求：
1. content应该总结前面的剧情，引出目标方向
2. choices必须为空数组 []
3. 必须提供2-3个目标选项
4. 每个目标应该是剧情性的，如"揭露真相"、"找到失踪者"、"破解谜团"、"逃离困境"等

${GOAL_SELECTION_OUTPUT_FORMAT}`;
    },

    ending: (character: Character, history: StoryNode[], goal?: GameGoal) => {
      const fullHistory = history.slice(-5);
      const historyText = fullHistory
        .map((node, idx) => `【第${idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      let goalStatus = '';
      let progressWarning = '';
      if (goal) {
        const percentage = goal.progress.percentage;
        const isCompleted = goal.completedAt !== undefined;
        goalStatus = `
【目标状态 - 极其重要】
目标：${goal.goal.description}
当前进度：${percentage}%
状态：${isCompleted ? '已达成' : percentage >= 70 ? '部分达成' : '未达成'}`;

        if (percentage < 30) {
          progressWarning = `
【警告】进度只有${percentage}%，必须生成彻底的失败结局！
- 主角的目标完全没有达成
- 描写失败带来的负面后果
- 绝对不能暗示成功或目标达成`;
        } else if (percentage < 70) {
          progressWarning = `
【警告】进度只有${percentage}%，必须生成失败结局！
- 目标未能达成，但有所收获
- 重点描写遗憾和代价`;
        }
      }

      return `
角色信息：
- 姓名：${character.name}

完整剧情：
${historyText}${goalStatus}${progressWarning}

请根据以上信息生成结局（保持悬疑故事风格）。
【最重要】结局内容必须与进度百分比一致！

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
注意事项：
- 每次生成${GAME_CONFIG.storyWordCount}字的剧情
- 营造紧张的黑帮氛围和权力游戏
- 对话要简洁有力，充满张力`,

    opening: (character: Character) => `
角色信息：
- 姓名：${character.name}

【序章 · 第一章：开场】
请为这个角色创作一个浴血黑帮风格的开场故事。
背景设定：1920年代工业城市或民国上海滩
开场要包含：
1. 一个充满黑帮氛围的场景
2. 帮派势力介绍或权力冲突的开端
3. 角色的初始身份和处境
4. 埋下一些利益纠葛的伏笔

然后提供3个探索性选择。
**注意：这是序章阶段，选项不需要difficulty字段，不需要骰子判定！**

${PROLOGUE_OUTPUT_FORMAT}`,

    continue: (character: Character, history: StoryNode[], userChoice: string, roundNumber: number, maxRounds: number, phase: GamePhase, goal?: GameGoal) => {
      const recentHistory = history.slice(-3);
      const historyText = recentHistory
        .map((node, idx) => `【第${history.length - recentHistory.length + idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      let goalInfo = '';
      if (goal) {
        goalInfo = `

【当前目标】
目标：${goal.goal.description}
进度：${goal.progress.percentage}%`;
      }

      const phasePrompt = getPhasePrompt(phase, roundNumber, maxRounds);
      // 序章阶段（包括开场和目标选择）使用无骰子的格式，正式冒险阶段根据是否有目标选择格式
      const isPrologue = phase === 'opening' || phase === 'goal-selection';
      const outputFormat = isPrologue ? PROLOGUE_OUTPUT_FORMAT : (goal ? OUTPUT_FORMAT_WITH_GOAL : OUTPUT_FORMAT);

      return `
角色信息：
- 姓名：${character.name}
${phasePrompt}
之前的剧情：
${historyText}

玩家最新选择：${userChoice}${goalInfo}

请根据玩家的选择继续黑帮故事：
1. 展现权力斗争和利益纷争
2. 制造新的冲突或揭示背叛
3. 对话要犀利有力${goal ? '\n4. 围绕当前目标推进剧情，更新目标进度' : ''}${isPrologue ? '\n\n**重要提醒：当前是序章阶段（前3轮），选项不需要difficulty字段，不需要骰子判定！**' : ''}

然后提供3个新的选择（高潮阶段只提供2个关键选择）。

${outputFormat}`;
    },

    goalSelection: (character: Character, history: StoryNode[], roundNumber: number, maxRounds: number) => {
      const recentHistory = history.slice(-2);
      const historyText = recentHistory
        .map((node, idx) => `【第${idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      return `
角色信息：
- 姓名：${character.name}

之前的剧情：
${historyText}

【重要】当前是第${roundNumber}/${maxRounds}轮，这是目标选择阶段！

要求：
1. content应该总结前面的剧情，引出目标方向
2. choices必须为空数组 []
3. 必须提供2-3个目标选项
4. 每个目标应该是剧情性的，如"建立势力"、"复仇"、"掌控权力"、"保护家族"等

${GOAL_SELECTION_OUTPUT_FORMAT}`;
    },

    ending: (character: Character, history: StoryNode[], goal?: GameGoal) => {
      const fullHistory = history.slice(-5);
      const historyText = fullHistory
        .map((node, idx) => `【第${idx + 1}段】\n${node.content}\n玩家选择：${node.userChoice || '无'}`)
        .join('\n\n');

      let goalStatus = '';
      let progressWarning = '';
      if (goal) {
        const percentage = goal.progress.percentage;
        const isCompleted = goal.completedAt !== undefined;
        goalStatus = `
【目标状态 - 极其重要】
目标：${goal.goal.description}
当前进度：${percentage}%
状态：${isCompleted ? '已达成' : percentage >= 70 ? '部分达成' : '未达成'}`;

        if (percentage < 30) {
          progressWarning = `
【警告】进度只有${percentage}%，必须生成彻底的失败结局！
- 主角的目标完全没有达成
- 描写失败带来的负面后果
- 绝对不能暗示成功或目标达成`;
        } else if (percentage < 70) {
          progressWarning = `
【警告】进度只有${percentage}%，必须生成失败结局！
- 目标未能达成，但有所收获
- 重点描写遗憾和代价`;
        }
      }

      return `
角色信息：
- 姓名：${character.name}

完整剧情：
${historyText}${goalStatus}${progressWarning}

请根据以上信息生成结局（保持黑帮故事风格）。
【最重要】结局内容必须与进度百分比一致！

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
  maxRounds?: number,
  phase?: GamePhase,
  goal?: GameGoal,
  isGoalSelection?: boolean,
  isEnding?: boolean
): { system: string; user: string } {
  const genrePrompt = GENRE_PROMPTS[genre];
  const actualMaxRounds = maxRounds ?? GAME_CONFIG.defaultMaxRounds;
  const actualRound = roundNumber ?? history.length + 1;
  const actualPhase = phase;
if (!actualPhase) {
  throw new Error('phase is required');
}
  console.log('📝 [buildPrompt] 参数:', {
    genre,
    roundNumber: actualRound,
    phase: actualPhase,
    isOpening,
    isGoalSelection,
    isEnding,
    hasGoal: !!goal
  });

  let userPrompt: string;

  if (isEnding) {
    userPrompt = genrePrompt.ending(character, history, goal);
  } else if (isGoalSelection) {
    userPrompt = genrePrompt.goalSelection(character, history, actualRound, actualMaxRounds);
  } else if (isOpening) {
    userPrompt = genrePrompt.opening(character);
  } else {
    userPrompt = genrePrompt.continue(
      character, history, userInput, actualRound, actualMaxRounds, actualPhase,
      goal
    );
  }

  // If there was a dice roll, add the result to the prompt
  if (diceRoll && !isEnding) {
    const diceInfo = `

【骰子判定结果】
玩家进行了骰子判定：
- 投掷结果：${diceRoll.dice1} + ${diceRoll.dice2} = ${diceRoll.total}
- 难度：${diceRoll.difficulty}
- 判定结果：**${getOutcomeDescription(diceRoll.outcome)}**

请根据这个判定结果来描述后续剧情，判定结果必须对剧情产生显著影响：
${diceRoll.outcome === 'critical-success' ? '- 大成功！行动超出预期，带来额外奖励、发现、优势。' : ''}
${diceRoll.outcome === 'perfect' ? '- 完美成功！行动非常顺利，达成目标并有小惊喜。' : ''}
${diceRoll.outcome === 'success' ? '- 成功！基本达成目标，但可能有些波折。' : ''}
${diceRoll.outcome === 'fail' ? '- 失败！行动未能达成目标，面临小麻烦。' : ''}
${diceRoll.outcome === 'critical-fail' ? '- 大失败！不仅行动失败，还带来严重后果。' : ''}`;
    userPrompt += diceInfo;
  }

  return {
    system: genrePrompt.system,
    user: userPrompt,
  };
}
