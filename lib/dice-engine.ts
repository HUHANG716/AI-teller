// Dice rolling engine for TRPG-style gameplay
import { DiceRoll, DiceOutcome } from './types';
import { diceLogger } from './logger';

/**
 * Roll a single 6-sided die
 */
function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Roll 2D6 (two 6-sided dice)
 */
export function roll2D6(): { dice1: number; dice2: number; total: number } {
  const dice1 = rollD6();
  const dice2 = rollD6();
  const total = dice1 + dice2;

  diceLogger.info({ dice1, dice2, total }, 'Dice rolled');

  return {
    dice1,
    dice2,
    total,
  };
}

/**
 * Determine the outcome based on result vs difficulty
 *
 * Outcome levels:
 * - Critical Fail: Double 1, OR base roll 2-5 and failed, OR 6+ below difficulty
 * - Fail: Result is below difficulty
 * - Success: Result meets or exceeds difficulty
 * - Perfect: Result is 4-5 above difficulty
 * - Critical Success: Double 6, OR result is 6+ above difficulty
 */
export function getDiceOutcome(
  result: number,
  difficulty: number,
  dice1: number,
  dice2: number
): DiceOutcome {
  const difference = result - difficulty;

  // Special case: double 6 is always critical success
  if (dice1 === 6 && dice2 === 6) {
    return 'critical-success';
  }

  // Special case: double 1 is always critical fail
  if (dice1 === 1 && dice2 === 1) {
    return 'critical-fail';
  }

  // Base roll 2-5 is critical fail (before bonuses)
  if (dice1 + dice2 <= 5 && difference < 0) {
    return 'critical-fail';
  }

  // Determine by difference
  if (difference >= 6) {
    return 'critical-success';
  } else if (difference >= 4) {
    return 'perfect';
  } else if (difference >= 0) {
    return 'success';
  } else if (difference >= -5) {
    return 'fail';
  } else {
    return 'critical-fail';
  }
}

/**
 * Get Chinese description of the outcome
 */
export function getOutcomeDescription(outcome: DiceOutcome): string {
  const descriptions: Record<DiceOutcome, string> = {
    'critical-fail': '大失败',
    'fail': '失败',
    'success': '成功',
    'perfect': '完美成功',
    'critical-success': '大成功',
  };
  return descriptions[outcome];
}

/**
 * Get emoji for the outcome
 */
export function getOutcomeEmoji(outcome: DiceOutcome): string {
  const emojis: Record<DiceOutcome, string> = {
    'critical-fail': '💀',
    'fail': '❌',
    'success': '✓',
    'perfect': '⭐',
    'critical-success': '🌟',
  };
  return emojis[outcome];
}

/**
 * Check if outcome is a failure
 */
export function isFailureOutcome(outcome: DiceOutcome): boolean {
  return outcome === 'fail' || outcome === 'critical-fail';
}

/**
 * Perform a complete dice check
 */
export function performDiceCheck(difficulty: number = 8): DiceRoll {
  diceLogger.debug({ difficulty }, 'Starting dice check');

  // Roll the dice
  const { dice1, dice2, total } = roll2D6();

  // Determine outcome
  const outcome = getDiceOutcome(total, difficulty, dice1, dice2);

  diceLogger.info({
    dice: `${dice1} + ${dice2}`,
    total,
    difficulty,
    outcome,
  }, 'Dice check complete');

  return {
    dice1,
    dice2,
    total,
    difficulty,
    outcome,
  };
}

/**
 * Get suggested difficulty based on task description
 * This is a fallback for when AI doesn't provide difficulty
 */
export function suggestDifficulty(choiceText: string): number {
  const lowerText = choiceText.toLowerCase();

  // Easy tasks (difficulty 6)
  if (lowerText.includes('简单') || lowerText.includes('容易') || lowerText.includes('基础')) {
    return 6;
  }

  // Hard tasks (difficulty 10)
  if (lowerText.includes('困难') || lowerText.includes('危险') || lowerText.includes('极')) {
    return 10;
  }

  // Very hard tasks (difficulty 11)
  if (lowerText.includes('极难') || lowerText.includes('几乎不可能') || lowerText.includes('拼死')) {
    return 11;
  }

  // Default: normal difficulty (8)
  return 8;
}

/**
 * Detect if a choice text suggests it needs a dice roll
 * Keywords that indicate challenging actions
 */
export function shouldRequireDiceRoll(choiceText: string): boolean {
  const lowerText = choiceText.toLowerCase();

  const keywords = [
    // Combat
    '攻击', '防御', '闪避', '格挡', '反击', '突袭',
    // Social
    '说服', '威胁', '欺骗', '谈判', '诱惑', '恐吓',
    // Skills
    '潜行', '侦查', '破解', '偷窃', '追踪', '躲藏',
    // Athletic
    '跳跃', '攀爬', '逃跑', '追赶', '翻滚', '冲刺',
    // Danger indicators
    '冒险', '强行', '硬接', '硬闯', '拼死', '强行',
  ];

  return keywords.some(keyword => lowerText.includes(keyword));
}
