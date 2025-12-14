# 🎲 AI说书人 - AI Storyteller

用AI为你生成永不重复的互动故事，随时随地开启冒险。

## ✨ 功能特点

- 🎭 **AI动态生成**: 基于智谱AI生成独特剧情
- ⚔️ **多种题材**: 武侠江湖、都市灵异、浴血黑帮等题材
- 🎮 **互动选择**: 3个预设选项 + 自定义输入
- 🎲 **骰子判定**: TRPG风格的2D6判定系统，特质提供加成
- 🔍 **调试日志**: 完整的Pino日志系统，覆盖所有模块
- 💾 **自动保存**: 进度实时保存到浏览器本地
- 📱 **响应式设计**: 支持手机、平板、电脑
- 🌙 **深色主题**: 护眼的深色界面

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置AI模型

配置你的API密钥：

```bash
# 智谱AI
ZHIPU_API_KEY=your_zhipu_api_key
AI_MODEL_PROVIDER=zhipu
```

**获取API密钥：**
- **智谱AI**: https://open.bigmodel.cn/
  - 注册后进入: https://bigmodel.cn/usercenter/proj-mgmt/apikeys
  - 单一API密钥支持所有GLM模型（GLM-4.6, GLM-4.5-x等）

**注意**: 如果没有配置API密钥，系统会使用模拟数据进行演示。

### 3. 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 开始游戏！

## 📁 项目结构

```
/app
  /page.tsx              # 首页 - 游戏列表
  /character/page.tsx    # 角色创建页
  /game/page.tsx         # 游戏主界面
  /history/page.tsx      # 历史记录页
  /api/generate/route.ts # AI生成API
/components
  /story-display.tsx     # 剧情展示（打字机效果）
  /choice-buttons.tsx    # 选项按钮
  /character-form.tsx    # 角色创建表单
  /custom-input.tsx      # 自定义输入
  /loading-overlay.tsx   # 加载遮罩
/lib
  /types.ts              # TypeScript类型定义
  /storage.ts            # localStorage封装
  /ai-service.ts         # AI服务层
  /prompt-templates.ts   # 剧情模板
/store
  /game-store.ts         # Zustand状态管理
```

## 🎮 使用指南

### 1. 创建角色
- 选择故事题材（武侠/都市灵异）
- 输入角色名字
- 选择3个特质标签

### 2. 开始冒险
- AI生成开场剧情
- 阅读故事内容（打字机效果）
- 从3个选项中选择，或输入自定义行动

### 3. 继续探索
- 每个选择都会影响后续剧情
- 进度自动保存到浏览器
- 随时查看历史记录

## 🛠️ 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: TailwindCSS
- **状态管理**: Zustand
- **动画**: Framer Motion
- **存储**: localStorage
- **AI模型**: 智谱AI (GLM-4.6, GLM-4.5-x)
- **日志**: Pino (高性能日志库)
- **骰子系统**: 2D6 TRPG判定

## 🚢 部署

### Vercel (推荐)

1. 将项目推送到GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量（API密钥）
4. 自动部署完成！

### 其他平台

```bash
npm run build
npm run start
```

## 📝 开发笔记

### 添加新题材

1. 在 `lib/types.ts` 添加新的 `Genre` 类型
2. 在 `lib/prompt-templates.ts` 添加对应的prompt模板
3. 在 `components/character-form.tsx` 添加UI选项


## ⚠️ 注意事项

- 数据存储在浏览器本地，清除浏览器数据会丢失进度
- AI生成需要5-10秒，已添加loading动画
- API调用可能产生费用，请关注用量
- 建议使用现代浏览器（Chrome/Safari/Edge）

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 License

MIT

## 🎉 致谢

- Next.js团队提供的优秀框架
- 智谱AI提供的AI能力
- 所有开源组件的作者

---

**开始你的AI冒险之旅吧！** 🚀

