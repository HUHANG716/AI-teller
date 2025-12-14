# 🔍 日志系统使用指南

## 概述

AI说书人使用 **Pino** 日志库提供完整的调试和监控能力。日志系统覆盖所有核心模块，帮助你快速定位问题和优化性能。

## 日志模块

### 🎲 骰子模块 (Dice Logger)
记录骰子判定的完整过程

**日志点：**
- 骰子投掷开始
- 骰子点数
- 特质加成计算
- 判定结果

**示例输出：**
```
🎲 [10:30:15] DEBUG: Starting dice check {
  characterTraits: ["勇敢", "智慧", "冷静"],
  relevantTraits: ["勇敢", "冲动"],
  difficulty: 9
}

🎲 [10:30:15] INFO: Dice rolled {
  dice1: 4,
  dice2: 5,
  total: 9
}

🎲 [10:30:15] DEBUG: Bonus calculated {
  bonus: 3,
  matchedTraits: ["勇敢"]
}

🎲 [10:30:15] INFO: Dice check complete {
  dice: "4 + 5",
  total: 9,
  bonus: 3,
  finalResult: 12,
  difficulty: 9,
  outcome: "critical-success"
}
```

### 🤖 AI模块 (AI Logger)
记录AI调用和性能

**日志点：**
- AI生成开始
- 选择的模型
- 请求参数
- 响应时间
- 内容长度
- 错误信息

**示例输出：**
```
🤖 [10:30:16] INFO: AI generation started {
  provider: "zhipu",
  genre: "wuxia",
  characterName: "李逍遥",
  historyLength: 3,
  isOpening: false,
  hasDiceRoll: true,
  diceOutcome: "critical-success"
}

🤖 [10:30:18] INFO: AI generation completed {
  duration: "2341ms"
}

🤖 [10:30:18] DEBUG: AI response parsed {
  contentLength: 287,
  choicesCount: 3
}
```

### 💾 存储模块 (Storage Logger)
记录数据持久化操作

**日志点：**
- 保存游戏
- 加载游戏
- 删除游戏
- 存储空间使用

**示例输出：**
```
💾 [10:30:18] DEBUG: Saving game {
  gameId: "game-1702345678",
  nodes: 5,
  characterName: "李逍遥"
}

💾 [10:30:18] INFO: Game saved {
  gameId: "game-1702345678",
  totalGames: 3,
  storageUsed: "12.45KB",
  isNew: false
}
```

### 🎮 游戏模块 (Game Logger)
记录游戏流程和状态变化

**日志点：**
- 开始新游戏
- 玩家选择
- 状态更新
- 游戏加载

**示例输出：**
```
🎮 [10:30:10] INFO: Starting new game {
  genre: "wuxia",
  characterName: "李逍遥",
  characterTags: ["勇敢", "智慧", "冷静"]
}

🎮 [10:30:15] INFO: Player making choice {
  choice: "硬接一招，以攻对攻",
  requiresDiceRoll: true,
  difficulty: 9,
  currentNode: 2
}

🎮 [10:30:18] INFO: Choice processed, new node added {
  gameId: "game-1702345678",
  newNodeIndex: 2,
  totalNodes: 3
}
```

### 🌐 API模块 (API Logger)
记录API请求和响应

**日志点：**
- 请求接收
- 参数验证
- 响应时间
- 错误处理

**示例输出：**
```
🌐 [10:30:16] INFO: API request received {
  endpoint: "/api/generate",
  genre: "wuxia",
  characterName: "李逍遥",
  historyLength: 2,
  isOpening: false,
  hasDiceRoll: true,
  diceOutcome: "critical-success"
}

🌐 [10:30:18] INFO: API request completed {
  duration: "2456ms",
  contentLength: 287,
  choicesCount: 3
}
```

## 日志级别

### Debug (最详细)
```typescript
diceLogger.debug({ data }, 'Debug message');
```
- 开发环境默认启用
- 显示所有内部细节
- 适合追踪问题

### Info (重要信息)
```typescript
aiLogger.info({ data }, 'Info message');
```
- 关键操作和结果
- 性能指标
- 用户行为

### Warn (警告)
```typescript
gameLogger.warn({ data }, 'Warning message');
```
- 潜在问题
- 异常情况
- 降级处理

### Error (错误)
```typescript
storageLogger.error({ error }, 'Error message');
```
- 操作失败
- 异常堆栈
- 错误恢复

## 浏览器控制台查看

开发环境中，日志会自动显示在浏览器控制台：

```
ℹ️ AI generation started { provider: 'openrouter', genre: 'wuxia', ... }
ℹ️ Dice rolled { dice1: 4, dice2: 5, total: 9 }
ℹ️ Game saved { gameId: 'game-xxx', totalGames: 3, ... }
```

**特性：**
- 🎨 彩色emoji图标区分模块
- ⏱️ 时间戳
- 📊 结构化数据自动展开
- 🔍 可点击展开详情

## 服务器端日志

在终端中运行 `npm run dev` 时，会看到格式化的日志：

```
[10:30:15] INFO (🎲 Dice): Dice rolled
    dice1: 4
    dice2: 5
    total: 9
    
[10:30:16] INFO (🤖 AI): AI generation started
    provider: "zhipu"
    genre: "wuxia"
    hasDiceRoll: true
```

## 实用技巧

### 1. 追踪完整流程

观察一个完整的游戏回合：

```
1. 🎮 Player making choice → 玩家操作
2. 🎲 Dice check → 骰子判定（如果需要）
3. 🌐 API request → API调用
4. 🤖 AI generation → AI生成
5. 💾 Game saved → 保存状态
```

### 2. 性能优化

找出慢的操作：

```javascript
// 查看所有duration字段
// 比较AI不同模型的响应时间
// 监控存储操作的性能
```

### 3. 问题定位

当遇到bug时：

1. **查看Error日志** - 找到错误消息和堆栈
2. **回溯操作** - 查看导致错误的步骤
3. **检查数据** - 确认参数和状态是否正确

### 4. 用户行为分析

了解玩家如何游玩：

- 最常选择的难度
- 骰子判定成功率
- AI响应时间
- 游戏时长

## 生产环境

在生产环境 (`NODE_ENV=production`)：

- 日志级别自动切换到 **info**
- 输出JSON格式（便于日志收集系统）
- 移除敏感信息（API密钥已自动过滤）
- Debug日志不会输出

## 自定义日志

如果需要在其他文件中添加日志：

```typescript
import { gameLogger } from '@/lib/logger';

// 基础日志
gameLogger.info('Simple message');

// 带数据的日志
gameLogger.info({ userId: 123, action: 'login' }, 'User logged in');

// 性能追踪
const startTime = Date.now();
// ... 操作
const duration = Date.now() - startTime;
gameLogger.info({ duration: `${duration}ms` }, 'Operation completed');
```

## 调试场景示例

### 场景1: 骰子判定不符合预期

**问题**: 玩家投掷骰子，但加成计算有误

**调试步骤:**
1. 查找 🎲 日志
2. 检查 `characterTraits` 和 `relevantTraits`
3. 确认 `matchedTraits` 是否正确
4. 验证 `bonus` 计算

### 场景2: AI生成速度慢

**问题**: 生成故事需要很长时间

**调试步骤:**
1. 查找 🤖 日志的 `AI generation started`
2. 查看 `duration` 字段
3. 检查网络连接是否稳定
4. 检查 `historyLength` 是否过长

### 场景3: 存储空间不足

**问题**: localStorage快满了

**调试步骤:**
1. 查找 💾 日志的 `storageUsed` 字段
2. 统计 `totalGames` 数量
3. 分析每个游戏的 `nodes` 数量
4. 决定是否需要清理旧存档

## 最佳实践

1. **日志要有意义** - 提供足够的上下文
2. **使用正确的级别** - Debug用于开发，Info用于监控
3. **避免敏感信息** - 不要记录密码、完整API密钥
4. **结构化数据** - 使用对象而不是字符串拼接
5. **性能考虑** - Debug日志在生产环境自动禁用

## 故障排除

### 没看到日志？

1. 检查浏览器控制台是否过滤了某些级别
2. 确认 `NODE_ENV` 设置
3. 清空控制台后重试

### 日志太多？

临时调整级别（浏览器控制台）：

```javascript
// 仅显示错误
logger.level = 'error';

// 恢复
logger.level = 'debug';
```

---

**现在你拥有完整的可观测性！** 🎉

使用这个日志系统，你可以清楚地看到AI说书人的每个操作细节，快速定位问题，优化性能，并更好地理解用户行为。

