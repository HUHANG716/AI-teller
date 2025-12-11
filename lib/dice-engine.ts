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
 * Calculate trait bonus based on matched traits
 * Each matched trait provides +2 to +4 bonus (randomized for variety)
 */
export function calculateBonus(
  characterTraits: string[],
  relevantTraits: string[] = []
): { bonus: number; matchedTraits: string[] } {
  const matchedTraits: string[] = [];
  let bonus = 0;

  diceLogger.debug({ characterTraits, relevantTraits }, 'Calculating trait bonus');

  for (const trait of characterTraits) {
    if (relevantTraits.includes(trait)) {
      matchedTraits.push(trait);
      // Each trait gives +2 to +4 bonus
      bonus += 2 + Math.floor(Math.random() * 3);
    }
  }

  diceLogger.debug({ bonus, matchedTraits }, 'Bonus calculated');

  return { bonus, matchedTraits };
}

/**
 * Determine the outcome based on final result vs difficulty
 * 
 * Outcome levels:
 * - Critical Fail: Result is 2-5 OR 6+ below difficulty
 * - Fail: Result is below difficulty
 * - Success: Result meets or exceeds difficulty
 * - Perfect: Result is 4-5 above difficulty
 * - Critical Success: Result is 6+ above difficulty OR rolled double 6
 */
export function getDiceOutcome(
  finalResult: number,
  difficulty: number,
  dice1: number,
  dice2: number
): DiceOutcome {
  const difference = finalResult - difficulty;
  
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
 * Perform a complete dice check
 */
export function performDiceCheck(
  characterTraits: string[],
  relevantTraits: string[] = [],
  difficulty: number = 8
): DiceRoll {
  diceLogger.debug({ characterTraits, relevantTraits, difficulty }, 'Starting dice check');
  
  // Roll the dice
  const { dice1, dice2, total } = roll2D6();
  
  // Calculate bonus from traits
  const { bonus, matchedTraits } = calculateBonus(characterTraits, relevantTraits);
  
  // Calculate final result
  const finalResult = total + bonus;
  
  // Determine outcome
  const outcome = getDiceOutcome(finalResult, difficulty, dice1, dice2);
  
  diceLogger.info({
    dice: `${dice1} + ${dice2}`,
    total,
    bonus,
    finalResult,
    difficulty,
    outcome
  }, 'Dice check complete');
  
  return {
    dice1,
    dice2,
    total,
    bonus,
    finalResult,
    difficulty,
    outcome,
    matchedTraits,
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

/**
 * Suggest relevant traits for a choice
 */
export function suggestRelevantTraits(choiceText: string): string[] {
  const lowerText = choiceText.toLowerCase();
  const traits: string[] = [];
  
  // Combat-related
  if (lowerText.match(/攻击|战斗|硬接|反击/)) {
    traits.push('勇敢', '冲动');
  }
  if (lowerText.match(/防御|闪避|格挡/)) {
    traits.push('冷静', '谨慎');
  }
  
  // Social-related
  if (lowerText.match(/说服|谈判|展示/)) {
    traits.push('智慧', '魅力');
  }
  if (lowerText.match(/威胁|恐吓|强硬/)) {
    traits.push('勇敢', '狡猾');
  }
  if (lowerText.match(/欺骗|诱惑|隐瞒/)) {
    traits.push('狡猾', '魅力');
  }
  
  // Skills-related
  if (lowerText.match(/潜行|躲藏|偷窃/)) {
    traits.push('谨慎', '狡猾');
  }
  if (lowerText.match(/侦查|观察|追踪/)) {
    traits.push('智慧', '冷静');
  }
  
  // Athletic-related
  if (lowerText.match(/跳跃|攀爬|翻滚|冲刺/)) {
    traits.push('勇敢', '冲动');
  }
  if (lowerText.match(/逃跑|撤退/)) {
    traits.push('谨慎', '冷静');
  }
  
  return Array.from(new Set(traits)); // Remove duplicates
}

