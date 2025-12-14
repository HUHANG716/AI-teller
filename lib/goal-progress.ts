import { Choice, DiceRoll } from './types';
import { gameLogger } from './logger';

/**
 * Progress calculation result
 */
export interface GoalProgress {
  percentage: number;
  reason?: string;
}

/**
 * Calculate progress based on choice difficulty and dice outcome
 *
 * @param choice - The choice made by player
 * @param diceRoll - Optional dice roll result
 * @param currentProgress - Current progress percentage (0-100)
 * @returns GoalProgress with new percentage and optional reason
 */
export function calculateGoalProgress(
  choice: Choice,
  diceRoll?: DiceRoll,
  currentProgress: number = 0
): GoalProgress {
  // Base progress ranges by difficulty
  const difficultySettings = {
    6: { min: 5, max: 10, name: '简单' },   // Simple
    8: { min: 10, max: 15, name: '普通' },  // Normal
    9: { min: 12, max: 20, name: '困难' },  // Hard
    10: { min: 15, max: 25, name: '困难' }, // Hard
    11: { min: 20, max: 30, name: '极难' }, // Very Hard
    12: { min: 25, max: 35, name: '极难' }, // Very Hard
  };

  const difficulty = choice.difficulty || 8;
  const settings = difficultySettings[difficulty] || difficultySettings[8];

  // Calculate base progress within range
  const baseProgress = settings.min + Math.random() * (settings.max - settings.min);

  // Apply dice outcome multipliers
  let multiplier = 1.0;
  let outcomeName = '';

  if (diceRoll) {
    switch (diceRoll.outcome) {
      case 'critical-success':
        multiplier = 1.5;
        outcomeName = '大成功';
        break;
      case 'perfect':
        multiplier = 1.2;
        outcomeName = '完美成功';
        break;
      case 'success':
        multiplier = 1.0;
        outcomeName = '成功';
        break;
      case 'fail':
        multiplier = 0.0;
        outcomeName = '失败';
        break;
      case 'critical-fail':
        multiplier = -0.1;
        outcomeName = '大失败';
        break;
      default:
        multiplier = 1.0;
        outcomeName = '';
    }
  } else {
    // No dice roll (prologue phase) - no progress
    multiplier = 0;
  }

  // Calculate progress change
  let progressChange = Math.round(baseProgress * multiplier);

  // Special case: critical fail subtracts 10%
  if (diceRoll?.outcome === 'critical-fail') {
    progressChange = -10;
  }

  // Calculate new progress
  const newProgress = Math.max(0, Math.min(100, currentProgress + Math.max(0, progressChange)));

  // Generate reason for progress change
  let reason = '';
  if (diceRoll) {
    if (progressChange > 0) {
      reason = `${outcomeName}！${settings.name}难度检定成功，进度 +${progressChange}%`;
      if (diceRoll.bonus > 0) {
        reason += ` (角色特质加成 +${diceRoll.bonus})`;
      }
    } else if (progressChange === 0) {
      reason = `${outcomeName}，${settings.name}难度检定失败，进度无变化`;
    } else {
      reason = `${outcomeName}！目标进度倒退 ${Math.abs(progressChange)}%`;
    }
  } else {
    reason = '序章阶段，暂无进度变化';
  }

  gameLogger.debug({
    difficulty,
    baseProgress: Math.round(baseProgress),
    multiplier,
    progressChange,
    currentProgress,
    newProgress,
    diceOutcome: diceRoll?.outcome,
  }, 'Goal progress calculated');

  return {
    percentage: newProgress,
    reason,
  };
}

/**
 * Validate that a progress value from AI is within acceptable bounds
 */
export function validateProgress(progress: any): progress is GoalProgress {
  return (
    progress &&
    typeof progress === 'object' &&
    typeof progress.percentage === 'number' &&
    progress.percentage >= 0 &&
    progress.percentage <= 100
  );
}

/**
 * Generate a fallback progress when AI doesn't provide one
 */
export function generateFallbackProgress(
  choice: Choice,
  diceRoll?: DiceRoll,
  currentProgress: number = 0
): GoalProgress {
  gameLogger.warn({
    choiceText: typeof choice === 'string' ? choice : choice.text,
    difficulty: choice.difficulty,
    diceOutcome: diceRoll?.outcome,
    currentProgress,
  }, 'Using fallback progress calculation');

  return calculateGoalProgress(choice, diceRoll, currentProgress);
}