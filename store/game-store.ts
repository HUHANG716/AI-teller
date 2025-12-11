// Global state management using Zustand
import { create } from 'zustand';
import { GameState, Character, StoryNode, Genre, DiceRoll, Choice, GameGoal, Goal, Resource, Ending, ResourceDefinition } from '@/lib/types';
import { saveGame, getGameById, setCurrentGameId } from '@/lib/storage';
import { performDiceCheck, suggestDifficulty, suggestRelevantTraits } from '@/lib/dice-engine';
import { gameLogger } from '@/lib/logger';

interface GameStore {
  // State
  currentGame: GameState | null;
  isLoading: boolean;
  error: string | null;
  currentDiceRoll: DiceRoll | null;
  isRollingDice: boolean;
  lastAIResponse: any | null; // Store last AI response for debugging

  // Actions
  startNewGame: (genre: Genre, character: Character) => Promise<void>;
  makeChoice: (choice: string | Choice) => Promise<void>;
  performDiceRoll: (choice: Choice) => DiceRoll;
  selectGoal: (goal: Goal) => Promise<void>;
  updateResources: (changes: Resource[]) => void;
  checkGoalProgress: () => void;
  checkEnding: () => Promise<void>;
  generateEnding: () => Promise<void>;
  loadGame: (gameId: string) => void;
  clearGame: () => void;
  setError: (error: string | null) => void;
  clearDiceRoll: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  currentGame: null,
  isLoading: false,
  error: null,
  currentDiceRoll: null,
  isRollingDice: false,
  lastAIResponse: null,

  // Start a new game
  startNewGame: async (genre: Genre, character: Character) => {
    gameLogger.info({ 
      genre, 
      characterName: character.name,
      characterTags: character.tags
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
        resources: [], // Initialize empty resources
        maxRounds: 15, // Default max rounds
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

    // Determine difficulty and relevant traits
    const difficulty = choice.difficulty || suggestDifficulty(choice.text);
    const relevantTraits = choice.relevantTraits || suggestRelevantTraits(choice.text);

    // Perform the dice check
    const diceRoll = performDiceCheck(
      currentGame.character.tags,
      relevantTraits,
      difficulty
    );

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
        description: '刚刚开始',
        percentage: 0,
        completedConditions: [],
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
          resources: updatedGame.resources,
          roundNumber: 4, // Now generating round 4
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate round 4 content');
      }

      const responseData = await response.json();
      set({ lastAIResponse: responseData });

      // 调试：检查第4轮 API 响应中的 goalProgress
      console.log('🔍 selectGoal 后第4轮 API 响应:', {
        hasGoalProgress: !!responseData.goalProgress,
        goalProgressValue: responseData.goalProgress,
        hasContent: !!responseData.content,
        choicesCount: responseData.choices?.length || 0
      });

      const { content, choices, resourceChanges, goalProgress } = responseData;

      // Handle resource changes
      if (resourceChanges && resourceChanges.length > 0) {
        get().updateResources(resourceChanges);
      }

      // Handle goal progress update
      if (goalProgress) {
        const updatedGoal: GameGoal = {
          ...gameGoal,
          progress: {
            ...gameGoal.progress,
            ...goalProgress,
          },
        };

        const updatedGameWithGoal: GameState = {
          ...updatedGame,
          goal: updatedGoal,
        };
        saveGame(updatedGameWithGoal);
        set({ currentGame: updatedGameWithGoal });
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

  // Update resources based on changes
  updateResources: (changes: Resource[]) => {
    const { currentGame } = get();
    if (!currentGame) {
      console.warn('⚠️ 尝试更新资源但游戏不存在');
      return;
    }

    if (!Array.isArray(changes)) {
      console.error('❌ 资源变化不是数组:', changes);
      return;
    }

    // If resource definitions exist, validate that changes only affect defined resource types
    if (currentGame.resourceDefinitions && currentGame.resourceDefinitions.length > 0) {
      const definedTypes = new Set(currentGame.resourceDefinitions.map(rd => rd.type));
      const invalidChanges = changes.filter(change => {
        if (change.type === 'item') {
          // Items are always allowed
          return false;
        }
        return !definedTypes.has(change.type);
      });
      
      if (invalidChanges.length > 0) {
        console.warn('⚠️ 资源变化包含未定义的资源类型，已过滤:', {
          invalidChanges,
          definedTypes: Array.from(definedTypes)
        });
        // Filter out invalid changes
        changes = changes.filter(change => {
          if (change.type === 'item') return true;
          return definedTypes.has(change.type);
        });
      }
    }

    const updatedResources = [...currentGame.resources];

    for (const change of changes) {
      if (change.type === 'item') {
        // Add item if not exists
        if (change.name && !updatedResources.find(r => r.type === 'item' && r.name === change.name)) {
          updatedResources.push({
            type: 'item',
            name: change.name,
            description: change.description,
          });
        }
      } else {
        // Update simple resource
        const existing = updatedResources.find(r => r.type === change.type);
        if (existing) {
          existing.amount = (existing.amount || 0) + (change.amount || 0);
          if (existing.amount <= 0) {
            const index = updatedResources.indexOf(existing);
            updatedResources.splice(index, 1);
          }
        } else if (change.amount && change.amount > 0) {
          updatedResources.push({
            type: change.type,
            amount: change.amount,
          });
        }
      }
    }

    const updatedGame: GameState = {
      ...currentGame,
      resources: updatedResources,
      updatedAt: Date.now(),
    };

    saveGame(updatedGame);
    set({ currentGame: updatedGame });
  },

  // Check and update goal progress
  checkGoalProgress: () => {
    const { currentGame } = get();
    if (!currentGame || !currentGame.goal) {
      return;
    }

    // Progress is updated by AI response, this is just a placeholder
    // Actual progress updates come from AI response
  },

  // Check if game should end (goal completed or max rounds reached)
  checkEnding: async () => {
    const { currentGame } = get();
    if (!currentGame || currentGame.ending) {
      return; // Already ended
    }

    const roundNumber = currentGame.currentNodeIndex;
    const shouldEnd = 
      (currentGame.goal && currentGame.goal.completedAt !== undefined) || // Goal completed
      (roundNumber >= currentGame.maxRounds - 1); // Max rounds reached

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
          resources: currentGame.resources,
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

    // Check if this choice requires a dice roll
    const requiresDiceRoll = typeof choice !== 'string' && choice.requiresDiceRoll;
    const choiceText = typeof choice === 'string' ? choice : choice.text;
    const isGoalChoice = typeof choice !== 'string' && choice.isGoal;
    // Convert 0-based currentNodeIndex to 1-based round number
    const currentRound = currentGame.currentNodeIndex + 1;
    // Goal selection phase is only in round 3 (when currentNodeIndex = 2, making choice in round 3)
    const isGoalSelectionPhase = currentRound === 3 && !currentGame.goal;
    
    gameLogger.info({ 
      choice: choiceText, 
      requiresDiceRoll,
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
          allGoalOptions: goalOptions.map(g => g.description)
        });
        
        get().selectGoal(selectedGoal);
        
        // Update current game state with selected goal
        const gameWithGoal = get().currentGame;
        if (gameWithGoal) {
          currentGame = gameWithGoal;
        }
      } else {
        console.warn('⚠️ 玩家选择了目标选项但未找到goalOptions，lastAIResponse:', lastAIResponse);
      }
    }
    
    let diceRoll: DiceRoll | undefined;

    // If dice roll required, perform it first
    if (requiresDiceRoll && typeof choice !== 'string') {
      diceRoll = get().performDiceRoll(choice);
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
      const isGoalSelection = nextRoundNumber === 3 && !currentGame.goal;
      
      console.log('🎯 目标选择判断:', {
        currentRound: currentRound,
        nextRound: nextRoundNumber,
        isGoalSelection,
        hasGoal: !!currentGame.goal,
        shouldShowGoalOptions: isGoalSelection,
        currentNodeIndex: currentGame.currentNodeIndex
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
          resources: currentGame.resources,
          roundNumber: nextRoundNumber,
          isGoalSelection,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate next story');
      }

      const responseData = await response.json();
      
      // Store raw response for debugging
      set({ lastAIResponse: responseData });
      
      const { content, choices, goalOptions, resourceDefinitions, initialResources, resourceChanges, goalProgress, ending } = responseData;

      // 调试：检查 AI 响应中的 goalProgress
      console.log('🔍 AI响应 goalProgress 检查:', {
        hasGoalProgress: !!goalProgress,
        goalProgressValue: goalProgress,
        hasGoal: !!currentGame.goal,
        roundNumber: nextRoundNumber
      });

      // Log response data for debugging
      console.log('📥 AI原始响应:', JSON.stringify(responseData, null, 2));
      gameLogger.debug({ 
        hasContent: !!content,
        choicesCount: Array.isArray(choices) ? choices.length : 0,
        hasGoalOptions: !!goalOptions,
        goalOptionsCount: goalOptions?.length || 0,
        hasResourceChanges: !!resourceChanges,
        resourceChangesCount: resourceChanges?.length || 0,
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
      }

      // Handle goal selection - ONLY in round 3
      // In round 3, AI should return goalOptions, and player will select one through choices
      // We don't auto-select here, we wait for player to make a choice marked with isGoal
      if (isGoalSelection && nextRoundNumber === 3) {
        console.log('🎯 第三轮目标选择阶段 - AI返回目标选项，等待玩家选择:', {
          isGoalSelection,
          roundNumber: nextRoundNumber,
          hasGoalOptions: !!goalOptions,
          goalOptionsCount: goalOptions?.length || 0,
          hasResourceDefinitions: !!resourceDefinitions,
          hasInitialResources: !!initialResources,
          goalOptions: goalOptions,
          resourceDefinitions: resourceDefinitions,
          initialResources: initialResources,
          choices: choices
        });
        
        if (goalOptions && goalOptions.length > 0) {
          gameLogger.info({ goalOptionsCount: goalOptions.length, goalOptions }, 'Goal options provided in round 3');
          
          // Store goalOptions temporarily - we'll use them when player makes a choice
          // The goalOptions are in the response, and we'll match them when player selects
          
          // Initialize resource system if provided
          if (resourceDefinitions && resourceDefinitions.length > 0) {
            console.log('🎮 第三轮：初始化资源系统', {
              resourceDefinitions,
              initialResources
            });
            
            // Update game with resource definitions and initial resources
            const updatedGameWithResources: GameState = {
              ...currentGame,
              resourceDefinitions: resourceDefinitions as ResourceDefinition[],
              resources: initialResources ? [...initialResources] : [],
              updatedAt: Date.now(),
            };
            
            saveGame(updatedGameWithResources);
            set({ currentGame: updatedGameWithResources });
            
            console.log('✅ 资源系统已初始化:', {
              resourceDefinitions: updatedGameWithResources.resourceDefinitions,
              initialResources: updatedGameWithResources.resources
            });
            
            gameLogger.info({ 
              resourceDefinitionsCount: resourceDefinitions.length,
              initialResourcesCount: initialResources?.length || 0
            }, 'Resource system initialized in round 3');
          } else {
            console.warn('⚠️ 第三轮但未收到resourceDefinitions');
          }
        } else {
          console.warn('⚠️ 第三轮目标选择阶段但未收到goalOptions:', {
            responseData,
            isGoalSelection,
            roundNumber: nextRoundNumber
          });
        }
      }
      

      // Handle resource changes
      if (resourceChanges && resourceChanges.length > 0) {
        console.log('💰 资源变化:', resourceChanges);
        gameLogger.info({ resourceChanges }, 'Resource changes detected');
        try {
          get().updateResources(resourceChanges);
        } catch (error) {
          console.error('❌ 更新资源时出错:', error);
          gameLogger.error({ error, resourceChanges }, 'Error updating resources');
        }
      }

      // Handle goal progress update
      if (goalProgress && currentGame.goal) {
        console.log('📊 目标进度更新:', goalProgress);
        gameLogger.info({ goalProgress }, 'Goal progress update');
        
        try {
          const updatedGoal: GameGoal = {
            ...currentGame.goal,
            progress: {
              ...currentGame.goal.progress,
              ...goalProgress,
            },
          };

          // Check if goal is completed (100% progress)
          if (goalProgress.percentage >= 100 && !updatedGoal.completedAt) {
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
          gameLogger.error({ error, goalProgress }, 'Error updating goal progress');
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

      // Update game state - 使用 get().currentGame 获取最新状态（包含已初始化的资源）
      const latestGame = get().currentGame || currentGame;
      const updatedGame: GameState = {
        ...latestGame,
        storyNodes: [...updatedNodes, newNode],
        currentNodeIndex: latestGame.currentNodeIndex + 1,
        updatedAt: Date.now(),
      };

      // Save to localStorage
      saveGame(updatedGame);
      
      gameLogger.info({ 
        gameId: updatedGame.id,
        newNodeIndex: updatedGame.currentNodeIndex,
        totalNodes: updatedGame.storyNodes.length,
        hasGoal: !!updatedGame.goal,
        goalProgress: updatedGame.goal?.progress.percentage
      }, 'Choice processed, new node added');
      
      set({ currentGame: updatedGame, isLoading: false, currentDiceRoll: null });

      // Check if game should end
      await get().checkEnding();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      console.error('❌ 做出选择时出错:', {
        error: errorMessage,
        stack: errorStack,
        choice: choiceText,
        roundNumber: currentGame.currentNodeIndex + 1,
        hasGoal: !!currentGame.goal,
        hasResources: (currentGame.resources || []).length > 0
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
}));

