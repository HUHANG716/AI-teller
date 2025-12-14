# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Storyteller is a Next.js interactive fiction game that uses AI to dynamically generate branching narratives with TRPG-style dice mechanics. The game supports multiple genres (wuxia, urban-mystery, peaky-blinders) and features a goal/resource system that evolves over 15 rounds of gameplay.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint check
```

## Architecture

### Data Flow
1. **User creates character** (`/character`) with name, genre, and 3 trait tags
2. **Game starts** - API generates opening story via `/api/generate`
3. **Gameplay loop** (15 rounds max):
   - Rounds 1-2: Normal choices
   - Round 3: Goal selection + resource system initialization
   - Rounds 4-14: Story progression with goal tracking
   - Round 15 or goal completion: Ending generation

### State Management (Zustand)
- `store/game-store.ts`: Central game state with actions for `startNewGame`, `makeChoice`, `selectGoal`, `updateResources`, `generateEnding`
- State persisted to localStorage via `lib/storage.ts`

### AI Integration
- `lib/ai/`: AI service layer with Zhipu provider and mock fallback
- `lib/ai/index.ts`: Main orchestration with provider selection and fallback logic
- `lib/ai/providers.ts`: Zhipu API implementation and mock provider
- `lib/ai/config.ts`: Provider configuration and environment validation
- `lib/prompt-templates.ts`: Genre-specific prompts with structured JSON output format
- AI responses must follow strict JSON schema with `content`, `choices`, and optional fields (`goalOptions`, `resourceChanges`, `goalProgress`)

### Dice System
- `lib/dice-engine.ts`: 2D6 TRPG mechanics
- Character traits provide +2 to +4 bonus when relevant
- Outcomes: critical-fail, fail, success, perfect, critical-success
- Special rules: double 6 = critical success, double 1 = critical fail

### Key Types (`lib/types.ts`)
- `Genre`: 'wuxia' | 'urban-mystery' | 'peaky-blinders'
- `Choice`: Can be simple string or object with `requiresDiceRoll`, `difficulty`, `relevantTraits`, `isGoal`
- `GameState`: Contains `storyNodes[]`, `goal`, `resources[]`, `resourceDefinitions[]`, `ending`

## Environment Variables

```bash
AI_MODEL_PROVIDER=zhipu     # or mock (fallback when no API key)
ZHIPU_API_KEY=xxx           # Required for Zhipu AI
```

Without API keys, the system automatically falls back to mock responses from `mockGenerateStory()`. The mock provider provides full gameplay functionality with placeholder stories.

## Adding New Genres

1. Add type to `Genre` in `lib/types.ts`
2. Add prompt template in `GENRE_PROMPTS` object in `lib/prompt-templates.ts` (requires `system`, `opening`, `continue`, `goalSelection`, `ending` functions)
3. Add UI option in `components/character-form.tsx`

## Logging

Uses Pino logger (`lib/logger.ts`) with module-specific instances: `gameLogger`, `aiLogger`, `diceLogger`, `apiLogger`. Enable debug with `LOG_LEVEL=debug`.
