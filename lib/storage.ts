// localStorage wrapper for persisting game state
import { GameState } from './types';
import { storageLogger } from './logger';

const STORAGE_KEY = 'ai-teller-games';
const CURRENT_GAME_KEY = 'ai-teller-current-game';

/**
 * Save or update a game in localStorage
 */
export function saveGame(game: GameState): void {
  if (typeof window === 'undefined') return;
  
  storageLogger.debug({ 
    gameId: game.id, 
    nodes: game.storyNodes.length,
    characterName: game.character.name
  }, 'Saving game');
  
  try {
    const games = getAllGames();
    const index = games.findIndex(g => g.id === game.id);
    
    if (index >= 0) {
      // Update existing game
      games[index] = { ...game, updatedAt: Date.now() };
    } else {
      // Add new game
      games.push(game);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    
    const storageUsed = JSON.stringify(games).length;
    storageLogger.info({ 
      gameId: game.id, 
      totalGames: games.length,
      storageUsed: `${(storageUsed / 1024).toFixed(2)}KB`,
      isNew: index < 0
    }, 'Game saved');
  } catch (error) {
    storageLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      gameId: game.id 
    }, 'Save failed');
    console.error('Failed to save game:', error);
  }
}

/**
 * Get all saved games
 */
export function getAllGames(): GameState[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      storageLogger.debug('No saved games found');
      return [];
    }
    
    const games = JSON.parse(data) as GameState[];
    storageLogger.debug({ totalGames: games.length }, 'Games loaded');
    
    // Sort by most recently updated
    return games.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    storageLogger.error({ 
      error: error instanceof Error ? error.message : String(error)
    }, 'Failed to load games');
    console.error('Failed to load games:', error);
    return [];
  }
}

/**
 * Get a specific game by ID
 */
export function getGameById(gameId: string): GameState | null {
  if (typeof window === 'undefined') return null;
  
  const games = getAllGames();
  return games.find(g => g.id === gameId) || null;
}

/**
 * Delete a game by ID
 */
export function deleteGame(gameId: string): void {
  if (typeof window === 'undefined') return;
  
  storageLogger.info({ gameId }, 'Deleting game');
  
  try {
    const games = getAllGames();
    const filtered = games.filter(g => g.id !== gameId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    // Clear current game if it's the one being deleted
    const currentGameId = getCurrentGameId();
    if (currentGameId === gameId) {
      clearCurrentGameId();
    }
    
    storageLogger.info({ gameId, remainingGames: filtered.length }, 'Game deleted');
  } catch (error) {
    storageLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      gameId
    }, 'Delete failed');
    console.error('Failed to delete game:', error);
  }
}

/**
 * Save the current active game ID
 */
export function setCurrentGameId(gameId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CURRENT_GAME_KEY, gameId);
  } catch (error) {
    console.error('Failed to set current game:', error);
  }
}

/**
 * Get the current active game ID
 */
export function getCurrentGameId(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(CURRENT_GAME_KEY);
  } catch (error) {
    console.error('Failed to get current game:', error);
    return null;
  }
}

/**
 * Clear the current game ID
 */
export function clearCurrentGameId(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(CURRENT_GAME_KEY);
  } catch (error) {
    console.error('Failed to clear current game:', error);
  }
}

/**
 * Clear all saved games (for testing/reset)
 */
export function clearAllGames(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_GAME_KEY);
  } catch (error) {
    console.error('Failed to clear all games:', error);
  }
}

