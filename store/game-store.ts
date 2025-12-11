// Global state management using Zustand
import { create } from 'zustand';
import { GameState, Character, StoryNode, Genre, DiceRoll, Choice } from '@/lib/types';
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

  // Actions
  startNewGame: (genre: Genre, character: Character) => Promise<void>;
  makeChoice: (choice: string | Choice) => Promise<void>;
  performDiceRoll: (choice: Choice) => DiceRoll;
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

      const { content, choices } = await response.json();

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
      gameLogger.error({ error: errorMessage }, 'Failed to start game');
      set({ error: errorMessage, isLoading: false });
      console.error('Error starting new game:', error);
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
    
    gameLogger.info({ 
      choice: choiceText, 
      requiresDiceRoll,
      difficulty: typeof choice !== 'string' ? choice.difficulty : undefined,
      currentNode: currentGame.currentNodeIndex + 1
    }, 'Player making choice');
    
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
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate next story');
      }

      const { content, choices } = await response.json();

      // Create new story node
      const newNode: StoryNode = {
        id: `node-${Date.now()}`,
        content,
        choices,
        timestamp: Date.now(),
      };

      // Update game state
      const updatedGame: GameState = {
        ...currentGame,
        storyNodes: [...updatedNodes, newNode],
        currentNodeIndex: currentGame.currentNodeIndex + 1,
        updatedAt: Date.now(),
      };

      // Save to localStorage
      saveGame(updatedGame);
      
      gameLogger.info({ 
        gameId: updatedGame.id,
        newNodeIndex: updatedGame.currentNodeIndex,
        totalNodes: updatedGame.storyNodes.length
      }, 'Choice processed, new node added');
      
      set({ currentGame: updatedGame, isLoading: false, currentDiceRoll: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      gameLogger.error({ error: errorMessage }, 'Error making choice');
      set({ error: errorMessage, isLoading: false, currentDiceRoll: null });
      console.error('Error making choice:', error);
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

