// Global state management using Zustand
import { create } from 'zustand';
import {
  GameState, Character, StoryNode, Genre, DiceRoll, Choice, GameGoal, Goal,
  Ending, GAME_CONFIG, getGamePhase
} from '@/lib/types';
import { saveGame, getGameById, setCurrentGameId } from '@/lib/storage';
import { performDiceCheck, suggestDifficulty } from '@/lib/dice-engine';
import { gameLogger } from '@/lib/logger';

// Helper function to get selected model from localStorage
const getSelectedModel = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('ai-teller-model') || 'glm-4.6';
  }
  return 'glm-4.6';
};

interface GameStore {
  // State
  currentGame: GameState | null;
  isLoading: boolean;
  error: string | null;
  currentDiceRoll: DiceRoll | null;
  isRollingDice: boolean;
  lastAIResponse: any | null; // Store last AI response for debugging
  pendingNode: StoryNode | null; // 待显示的下一轮节点，用户点击"继续"后才更新

  // Actions
  startNewGame: (genre: Genre, character: Character) => Promise<void>;
  makeChoice: (choice: string | Choice) => Promise<void>;
  performDiceRoll: (choice: Choice) => DiceRoll;
  selectGoal: (goal: Goal) => Promise<void>;
  checkEnding: () => Promise<void>;
  generateEnding: () => Promise<void>;
  confirmContinue: () => Promise<void>; // 确认继续到下一轮
  loadGame: (gameId: string) => void;
  clearGame: () => void;
  setError: (error: string | null) => void;
  clearDiceRoll: () => void;

  // Debug Actions
  debugSetMaxRounds: (rounds: number) => void;
  debugSetCurrentRound: (round: number) => void;
  debugSetGoalProgress: (percentage: number) => void;
  debugMarkGoalCompleted: () => void;
  debugTriggerEnding: () => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  currentGame: null,
  isLoading: false,
  error: null,
  currentDiceRoll: null,
  isRollingDice: false,
  lastAIResponse: null,
  pendingNode: null,

  // Start a new game
  startNewGame: async (genre: Genre, character: Character) => {
    gameLogger.info({
      genre,
      characterName: character.name,
    }, 'Starting new game');

    set({ isLoading: true, error: null });

    try {
      // Call API to generate opening story
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre,
          character,
          history: [],
          userInput: '',
          isOpening: true,
          selectedModel: getSelectedModel(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate opening story');
      }

      const responseData = await response.json();

      // Store raw response for debugging
      set({ lastAIResponse: responseData });
      console.log('📥 开场AI原始响应:', JSON.stringify(responseData, null, 2));

      const { content, choices } = responseData;

      // Create the opening story node
      const openingNode: StoryNode = {
        id: `node-${Date.now()}`,
        content,
        choices,
        timestamp: Date.now(),
      };

      // Create new game state
      const newGame: GameState = {
        id: `game-${Date.now()}`,
        genre,
        character,
        storyNodes: [openingNode],
        currentNodeIndex: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        maxRounds: GAME_CONFIG.defaultMaxRounds, // Default max rounds (10)
      };

      // Save to localStorage and set as current
      saveGame(newGame);
      setCurrentGameId(newGame.id);

      gameLogger.info({
        gameId: newGame.id,
        openingLength: openingNode.content.length
      }, 'New game created');

      set({ currentGame: newGame, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error('❌ 开始新游戏时出错:', {
        error: errorMessage,
        stack: errorStack,
        genre,
        characterName: character.name
      });

      gameLogger.error({
        error: errorMessage,
        stack: errorStack,
        genre,
        characterName: character.name
      }, 'Failed to start game');

      set({ error: errorMessage, isLoading: false });
    }
  },

  // Perform dice roll for a choice
  performDiceRoll: (choice: Choice) => {
    const { currentGame } = get();

    if (!currentGame) {
      throw new Error('No active game');
    }

    // Show rolling state
    set({ isRollingDice: true });

    // Determine difficulty
    const difficulty = choice.difficulty || suggestDifficulty(choice.text);

    // Perform the dice check
    const diceRoll = performDiceCheck(difficulty);

    // Update state with result (after a delay to show animation)
    setTimeout(() => {
      set({ currentDiceRoll: diceRoll, isRollingDice: false });
    }, 1000);

    return diceRoll;
  },

  // Select a goal (called when player chooses a goal in round 3)
  selectGoal: async (goal: Goal) => {
    const { currentGame } = get();
    if (!currentGame) {
      console.error('❌ 尝试选择目标但游戏不存在');
      set({ error: 'No active game' });
      return;
    }

    if (!goal || !goal.id || !goal.description) {
      console.error('❌ 无效的目标对象:', goal);
      set({ error: 'Invalid goal' });
      return;
    }

    console.log('✅ 选择目标:', goal.description, goal);

    const gameGoal: GameGoal = {
      goal,
      selectedAt: Date.now(),
      progress: {
        percentage: 0,
      },
    };

    // Update current node with selected goal
    const updatedNodes = [...currentGame.storyNodes];
    if (updatedNodes[currentGame.currentNodeIndex]) {
      updatedNodes[currentGame.currentNodeIndex] = {
        ...updatedNodes[currentGame.currentNodeIndex],
        userChoice: `选择目标：${goal.description}`,
      };
    }

    const updatedGame: GameState = {
      ...currentGame,
      goal: gameGoal,
      storyNodes: updatedNodes,
      updatedAt: Date.now(),
    };

    saveGame(updatedGame);
    set({ currentGame: updatedGame, isLoading: true });

    gameLogger.info({
      goalId: goal.id,
      goalDescription: goal.description
    }, 'Goal selected');

    // After selecting goal, generate round 4 content
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: updatedGame.genre,
          character: updatedGame.character,
          history: updatedNodes,
          userInput: `选择目标：${goal.description}`,
          isOpening: false,
          goal: gameGoal,
          roundNumber: 4, // Now generating round 4
          selectedModel: getSelectedModel(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate round 4 content');
      }

      const responseData = await response.json();
      set({ lastAIResponse: responseData });

      const { content, choices, goalProgress } = responseData;

      // Handle goal progress update
      let finalGoal = gameGoal;
      if (goalProgress) {
        finalGoal = {
          ...gameGoal,
          progress: {
            ...gameGoal.progress,
            ...goalProgress,
          },
        };
      }

      // Create round 4 story node
      const round4Node: StoryNode = {
        id: `node-${Date.now()}`,
        content,
        choices,
        timestamp: Date.now(),
      };

      const finalGame: GameState = {
        ...updatedGame,
        goal: finalGoal,
        storyNodes: [...updatedNodes, round4Node],
        currentNodeIndex: updatedGame.currentNodeIndex + 1,
        updatedAt: Date.now(),
      };

      saveGame(finalGame);
      set({ currentGame: finalGame, isLoading: false });

      console.log('✅ 第4轮内容已生成');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ 生成第4轮内容时出错:', error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Check if game should end (goal completed or max rounds reached)
  checkEnding: async () => {
    const { currentGame } = get();
    if (!currentGame || currentGame.ending) {
      return; // Already ended
    }

    // Only check for goal completion - max rounds check is handled in makeChoice
    const shouldEnd = currentGame.goal && currentGame.goal.completedAt !== undefined;

    if (shouldEnd) {
      await get().generateEnding();
    }
  },

  // Generate ending
  generateEnding: async () => {
    const { currentGame } = get();
    if (!currentGame) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: currentGame.genre,
          character: currentGame.character,
          history: currentGame.storyNodes,
          userInput: '',
          isEnding: true,
          goal: currentGame.goal,
          selectedModel: getSelectedModel(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate ending');
      }

      const responseData = await response.json();

      // Store raw response for debugging
      set({ lastAIResponse: responseData });
      console.log('📥 结局AI原始响应:', JSON.stringify(responseData, null, 2));

      const { content, ending } = responseData;

      if (!ending) {
        throw new Error('No ending in response');
      }

      // Determine ending type based on goal completion
      let endingType: Ending['type'] = 'timeout';
      if (currentGame.goal) {
        if (currentGame.goal.completedAt !== undefined) {
          endingType = currentGame.goal.progress.percentage >= 100 ? 'success' : 'partial-success';
        } else {
          endingType = 'failure';
        }
      }

      const finalEnding: Ending = {
        ...ending,
        type: endingType,
      };

      const updatedGame: GameState = {
        ...currentGame,
        ending: finalEnding,
        updatedAt: Date.now(),
      };

      // Add ending as final story node
      const endingNode: StoryNode = {
        id: `ending-${Date.now()}`,
        content,
        choices: [],
        timestamp: Date.now(),
      };

      updatedGame.storyNodes.push(endingNode);
      updatedGame.currentNodeIndex = updatedGame.storyNodes.length - 1;

      saveGame(updatedGame);
      set({ currentGame: updatedGame, isLoading: false });

      gameLogger.info({
        endingType: finalEnding.type,
        goalCompleted: currentGame.goal?.completedAt !== undefined
      }, 'Ending generated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error('❌ 生成结局时出错:', {
        error: errorMessage,
        stack: errorStack,
        gameId: currentGame.id,
        roundNumber: currentGame.currentNodeIndex + 1,
        hasGoal: !!currentGame.goal,
        goalCompleted: currentGame.goal?.completedAt !== undefined
      });

      gameLogger.error({
        error: errorMessage,
        stack: errorStack,
        gameId: currentGame.id
      }, 'Error generating ending');

      set({ error: errorMessage, isLoading: false });
    }
  },

  // Make a choice and generate next story node
  makeChoice: async (choice: string | Choice) => {
    const { currentGame } = get();

    if (!currentGame) {
      set({ error: 'No active game' });
      return;
    }

    const choiceText = typeof choice === 'string' ? choice : choice.text;
    const isGoalChoice = typeof choice !== 'string' && choice.isGoal;
    // Convert 0-based currentNodeIndex to 1-based round number
    const currentRound = currentGame.currentNodeIndex + 1;
    // Goal selection phase is only in round 3 (when currentNodeIndex = 2, making choice in round 3)
    const isGoalSelectionPhase = currentRound === 3 && !currentGame.goal;

    gameLogger.info({
      choice: choiceText,
      isGoalChoice,
      isGoalSelectionPhase,
      roundNumber: currentRound,
      difficulty: typeof choice !== 'string' ? choice.difficulty : undefined,
      currentNode: currentRound
    }, 'Player making choice');

    // If in goal selection phase (round 3) and this is a goal choice, select the goal BEFORE generating next content
    if (isGoalSelectionPhase && isGoalChoice) {
      // Get goalOptions from the last AI response (from when round 3 content was generated)
      const { lastAIResponse } = get();
      const goalOptions = lastAIResponse?.goalOptions;

      if (goalOptions && goalOptions.length > 0) {
        // Match the choice with a goal
        const selectedGoal = goalOptions.find((g: Goal) => {
          const goalKeywords = g.description.substring(0, 20).toLowerCase();
          const choiceLower = choiceText.toLowerCase();
          return choiceLower.includes(goalKeywords) || goalKeywords.includes(choiceLower);
        }) || goalOptions[0];

        console.log('✅ 玩家在第三轮选择了目标:', {
          selectedGoal: selectedGoal.description,
          choiceText: choiceText,
          allGoalOptions: goalOptions.map((g: Goal) => g.description)
        });

        get().selectGoal(selectedGoal);
      } else {
        console.warn('⚠️ 玩家选择了目标选项但未找到goalOptions，lastAIResponse:', lastAIResponse);
      }
    }

    // 前三轮（序章阶段）不需要骰子判定，第4轮开始才需要
    let diceRoll: DiceRoll | undefined;
    const isProloguePhase = currentRound <= GAME_CONFIG.goalSelectionRound; // 第1-3轮是序章

    if (!isProloguePhase) {
      const choiceObj: Choice = typeof choice === 'string'
        ? { text: choice, difficulty: 8 }
        : choice;

      const difficulty = choiceObj.difficulty || suggestDifficulty(choiceObj.text);
      diceRoll = get().performDiceRoll({ ...choiceObj, difficulty });

      // Wait for dice animation to complete
      await new Promise(resolve => setTimeout(resolve, 2500));
    }

    set({ isLoading: true, error: null });

    try {
      // Update the current node with user's choice and dice roll
      const updatedNodes = [...currentGame.storyNodes];
      updatedNodes[currentGame.currentNodeIndex] = {
        ...updatedNodes[currentGame.currentNodeIndex],
        userChoice: choiceText,
        diceRoll,
      };

      // Goal selection should ONLY happen in round 3 (after making choice in round 2)
      // After making a choice, we're generating the next round
      // currentNodeIndex is 0-based, so next round = currentNodeIndex + 2 (1-based)
      const nextRoundNumber = currentGame.currentNodeIndex + 2;

      // Check if we should generate ending (next round exceeds max rounds)
      if (nextRoundNumber > currentGame.maxRounds) {
        console.log('🏁 达到最大轮数，生成结局', {
          nextRoundNumber,
          maxRounds: currentGame.maxRounds
        });

        // Save current choice to node first
        const updatedNodes = [...currentGame.storyNodes];
        updatedNodes[currentGame.currentNodeIndex] = {
          ...updatedNodes[currentGame.currentNodeIndex],
          userChoice: choiceText,
          diceRoll,
        };

        const updatedGame: GameState = {
          ...currentGame,
          storyNodes: updatedNodes,
          updatedAt: Date.now(),
        };
        saveGame(updatedGame);
        set({ currentGame: updatedGame });

        // Generate ending
        await get().generateEnding();
        return;
      }

      const isGoalSelection = nextRoundNumber === GAME_CONFIG.goalSelectionRound && !currentGame.goal;

      // Calculate game phase
      const phase = getGamePhase(nextRoundNumber, currentGame.maxRounds);

      console.log('🎯 目标选择判断:', {
        currentRound: currentRound,
        nextRound: nextRoundNumber,
        isGoalSelection,
        hasGoal: !!currentGame.goal,
        shouldShowGoalOptions: isGoalSelection,
        currentNodeIndex: currentGame.currentNodeIndex,
        phase
      });

      // Call API to generate next story segment
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: currentGame.genre,
          character: currentGame.character,
          history: updatedNodes,
          userInput: choiceText,
          diceRoll,
          isOpening: false,
          goal: currentGame.goal,
          roundNumber: nextRoundNumber,
          maxRounds: currentGame.maxRounds,
          phase,
          isGoalSelection,
          selectedModel: getSelectedModel(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate next story');
      }

      const responseData = await response.json();

      // Store raw response for debugging
      set({ lastAIResponse: responseData });

      const { content, choices, goalOptions, goalProgress, ending } = responseData;

      // Log response data for debugging
      console.log('📥 AI原始响应:', JSON.stringify(responseData, null, 2));
      gameLogger.debug({
        hasContent: !!content,
        choicesCount: Array.isArray(choices) ? choices.length : 0,
        hasGoalOptions: !!goalOptions,
        goalOptionsCount: goalOptions?.length || 0,
        hasGoalProgress: !!goalProgress,
        hasEnding: !!ending,
        fullResponse: responseData
      }, 'API response received');

      // Validate response
      if (!content) {
        console.error('❌ API响应错误: 缺少content字段', responseData);
        gameLogger.error({ responseData }, 'API response missing content');
        throw new Error('API响应格式错误: 缺少剧情内容');
      }

      // In round 3 goal selection, choices can be empty
      if (!isGoalSelection && (!choices || !Array.isArray(choices) || choices.length === 0)) {
        console.error('❌ API响应错误: 缺少choices或choices为空', responseData);
        gameLogger.error({ responseData }, 'API response missing or empty choices');
        throw new Error('API响应格式错误: 缺少选择项');
      }

      // For round 3 goal selection, ensure we have goalOptions
      if (isGoalSelection && nextRoundNumber === 3) {
        if (!goalOptions || !Array.isArray(goalOptions) || goalOptions.length === 0) {
          console.error('❌ 第三轮目标选择阶段: 缺少goalOptions', responseData);
          gameLogger.error({ responseData }, 'Round 3 goal selection missing goalOptions');
          throw new Error('第三轮必须提供目标选项');
        }

        console.log('🎯 第三轮目标选择阶段 - AI返回目标选项，等待玩家选择:', {
          goalOptionsCount: goalOptions?.length || 0,
          goalOptions: goalOptions,
        });
        gameLogger.info({ goalOptionsCount: goalOptions.length, goalOptions }, 'Goal options provided in round 3');
      }

      // Handle goal progress update
      if (currentGame.goal) {
        let finalProgress = goalProgress;

        // Validate AI-provided progress
        if (finalProgress) {
          // Import validation function
          const { validateProgress } = await import('../lib/goal-progress');
          if (!validateProgress(finalProgress)) {
            console.warn('⚠️ AI提供的进度数据无效，将使用备用计算');
            gameLogger.warn({
              invalidProgress: finalProgress,
              reason: 'Invalid progress format or out of bounds'
            }, 'Invalid progress from AI');
            finalProgress = null;
          }
        }

        // Fallback calculation if AI didn't provide valid progress
        if (!finalProgress && choiceObj && diceRoll) {
          const { calculateGoalProgress } = await import('../lib/goal-progress');
          finalProgress = calculateGoalProgress(choiceObj, diceRoll, currentGame.goal.progress.percentage);
          console.log('📊 使用备用进度计算:', finalProgress);
          gameLogger.info({
            calculatedProgress: finalProgress,
            choiceDifficulty: choiceObj.difficulty,
            diceOutcome: diceRoll.outcome,
            currentProgress: currentGame.goal.progress.percentage
          }, 'Using fallback progress calculation');
        }

        // Apply progress update
        if (finalProgress) {
          console.log('📊 目标进度更新:', finalProgress);
          gameLogger.info({ goalProgress: finalProgress }, 'Goal progress update');

          try {
            const updatedGoal: GameGoal = {
              ...currentGame.goal,
              progress: {
                ...currentGame.goal.progress,
                ...finalProgress,
              },
            };

            // Check if goal is completed (100% progress)
            if (finalProgress.percentage >= 100 && !updatedGoal.completedAt) {
              console.log('🎉 目标达成!', updatedGoal.goal.description);
              gameLogger.info({ goalId: updatedGoal.goal.id }, 'Goal completed');
              updatedGoal.completedAt = Date.now();
            }

            const updatedGameWithGoal: GameState = {
              ...currentGame,
              goal: updatedGoal,
            };
            saveGame(updatedGameWithGoal);
            set({ currentGame: updatedGameWithGoal });
          } catch (error) {
            console.error('❌ 更新目标进度时出错:', error);
            gameLogger.error({ error, goalProgress: finalProgress }, 'Error updating goal progress');
          }
        } else if (currentRound > GAME_CONFIG.goalSelectionRound) {
          console.warn('⚠️ 第4轮后应有进度更新，但未提供进度数据');
          gameLogger.warn({
            roundNumber: currentRound,
            hasGoal: !!currentGame.goal,
            hasChoice: !!choiceObj,
            hasDiceRoll: !!diceRoll
          }, 'Missing progress data after goal selection phase');
        }
      }

      // Create new story node
      const newNode: StoryNode = {
        id: `node-${Date.now()}`,
        content,
        choices: isGoalSelection && nextRoundNumber === 3 ? [] : choices, // Round 3 has no choices, only goal options
        timestamp: Date.now(),
        goalOptions: isGoalSelection && nextRoundNumber === 3 ? goalOptions : undefined, // Store goalOptions in round 3 node
      };

      // 不立即更新 currentNodeIndex，而是设置 pendingNode
      // 用户点击"继续"按钮后才会真正进入下一轮
      const latestGame = get().currentGame || currentGame;

      // 先保存当前节点的选择到 storyNodes（不改变 currentNodeIndex）
      const updatedGame: GameState = {
        ...latestGame,
        storyNodes: updatedNodes, // 只更新当前节点的 userChoice 和 diceRoll
        updatedAt: Date.now(),
      };

      // Save to localStorage
      saveGame(updatedGame);

      gameLogger.info({
        gameId: updatedGame.id,
        currentNodeIndex: updatedGame.currentNodeIndex,
        pendingNodeId: newNode.id,
        hasGoal: !!updatedGame.goal,
        goalProgress: updatedGame.goal?.progress.percentage
      }, 'Choice processed, pending node ready');

      // 根据是否有骰子来决定是否需要 pendingNode
      if (diceRoll) {
        // 有骰子：设置 pendingNode，等待用户点击"继续"
        // 注意：不清除 currentDiceRoll，让骰子结果继续显示，等 confirmContinue 时再清除
        set({ currentGame: updatedGame, isLoading: false, pendingNode: newNode });
        gameLogger.info('Using pendingNode for dice roll choice');
      } else {
        // 无骰子：直接进入下一轮，不需要 pendingNode
        const finalGame: GameState = {
          ...updatedGame,
          storyNodes: [...updatedGame.storyNodes, newNode],
          currentNodeIndex: updatedGame.currentNodeIndex + 1,
          updatedAt: Date.now(),
        };

        saveGame(finalGame);
        set({
          currentGame: finalGame,
          isLoading: false,
          pendingNode: undefined, // 确保清除任何pendingNode
          selectedChoice: null,
          isRollingDice: false
        });
        gameLogger.info('Direct advancement for non-dice choice');

        // 检查是否应该结束游戏
        await get().checkEnding();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error('❌ 做出选择时出错:', {
        error: errorMessage,
        stack: errorStack,
        choice: choiceText,
        roundNumber: currentGame.currentNodeIndex + 1,
        hasGoal: !!currentGame.goal,
      });

      gameLogger.error({
        error: errorMessage,
        stack: errorStack,
        choice: choiceText,
        roundNumber: currentGame.currentNodeIndex + 1
      }, 'Error making choice');

      set({ error: errorMessage, isLoading: false, currentDiceRoll: null });
    }
  },

  // Load an existing game
  loadGame: (gameId: string) => {
    gameLogger.info({ gameId }, 'Loading game');
    const game = getGameById(gameId);

    if (game) {
      setCurrentGameId(gameId);
      gameLogger.info({
        gameId,
        characterName: game.character.name,
        currentNode: game.currentNodeIndex + 1,
        totalNodes: game.storyNodes.length
      }, 'Game loaded');
      set({ currentGame: game, error: null });
    } else {
      gameLogger.warn({ gameId }, 'Game not found');
      set({ error: 'Game not found' });
    }
  },

  // Clear current game
  clearGame: () => {
    set({ currentGame: null, error: null, isLoading: false });
  },

  // Set error message
  setError: (error: string | null) => {
    set({ error });
  },

  // Clear dice roll
  clearDiceRoll: () => {
    set({ currentDiceRoll: null, isRollingDice: false });
  },

  // 确认继续到下一轮（用户点击"继续"按钮后调用）
  confirmContinue: async () => {
    const { currentGame, pendingNode } = get();

    if (!currentGame || !pendingNode) {
      console.warn('⚠️ confirmContinue: 没有 pendingNode 或 currentGame');
      return;
    }

    console.log('▶️ 用户点击继续，进入下一轮');

    // 将 pendingNode 添加到 storyNodes，更新 currentNodeIndex
    const updatedGame: GameState = {
      ...currentGame,
      storyNodes: [...currentGame.storyNodes, pendingNode],
      currentNodeIndex: currentGame.currentNodeIndex + 1,
      updatedAt: Date.now(),
    };

    // Save to localStorage
    saveGame(updatedGame);

    gameLogger.info({
      gameId: updatedGame.id,
      newNodeIndex: updatedGame.currentNodeIndex,
      totalNodes: updatedGame.storyNodes.length,
    }, 'User confirmed continue, moved to next round');

    set({ currentGame: updatedGame, pendingNode: null, currentDiceRoll: null });

    // 现在检查是否应该结束游戏
    await get().checkEnding();
  },

  // ============ Debug Actions ============

  // Set max rounds
  debugSetMaxRounds: (rounds: number) => {
    const { currentGame } = get();
    if (!currentGame) return;

    const updatedGame: GameState = {
      ...currentGame,
      maxRounds: Math.max(1, rounds),
      updatedAt: Date.now(),
    };
    saveGame(updatedGame);
    set({ currentGame: updatedGame });
    console.log('🔧 [Debug] 设置最大轮数:', rounds);
  },

  // Jump to specific round
  debugSetCurrentRound: (round: number) => {
    const { currentGame } = get();
    if (!currentGame) return;

    // round is 1-based, currentNodeIndex is 0-based
    const targetIndex = Math.max(0, Math.min(round - 1, currentGame.storyNodes.length - 1));

    const updatedGame: GameState = {
      ...currentGame,
      currentNodeIndex: targetIndex,
      updatedAt: Date.now(),
    };
    saveGame(updatedGame);
    set({ currentGame: updatedGame });
    console.log('🔧 [Debug] 跳转到轮数:', round, '(index:', targetIndex, ')');
  },

  // Set goal progress
  debugSetGoalProgress: (percentage: number) => {
    const { currentGame } = get();
    if (!currentGame || !currentGame.goal) {
      console.warn('🔧 [Debug] 无法设置目标进度: 没有活动游戏或目标');
      return;
    }

    const updatedGoal: GameGoal = {
      ...currentGame.goal,
      progress: {
        ...currentGame.goal.progress,
        percentage: Math.max(0, Math.min(100, percentage)),
      },
    };

    // Mark as completed if 100%
    if (percentage >= 100 && !updatedGoal.completedAt) {
      updatedGoal.completedAt = Date.now();
    }

    const updatedGame: GameState = {
      ...currentGame,
      goal: updatedGoal,
      updatedAt: Date.now(),
    };
    saveGame(updatedGame);
    set({ currentGame: updatedGame });
    console.log('🔧 [Debug] 设置目标进度:', percentage, '%');
  },

  // Mark goal as completed
  debugMarkGoalCompleted: () => {
    const { currentGame } = get();
    if (!currentGame || !currentGame.goal) {
      console.warn('🔧 [Debug] 无法标记目标完成: 没有活动游戏或目标');
      return;
    }

    const updatedGoal: GameGoal = {
      ...currentGame.goal,
      progress: {
        ...currentGame.goal.progress,
        percentage: 100,
        reason: '目标已完成',
      },
      completedAt: Date.now(),
    };

    const updatedGame: GameState = {
      ...currentGame,
      goal: updatedGoal,
      updatedAt: Date.now(),
    };
    saveGame(updatedGame);
    set({ currentGame: updatedGame });
    console.log('🔧 [Debug] 目标已标记为完成');
  },

  // Manually trigger ending
  debugTriggerEnding: async () => {
    const { currentGame } = get();
    if (!currentGame) {
      console.warn('🔧 [Debug] 无法触发结局: 没有活动游戏');
      return;
    }

    console.log('🔧 [Debug] 手动触发结局...');
    await get().generateEnding();
  },
}));
