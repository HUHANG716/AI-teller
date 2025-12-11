'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { DiceRoll } from '@/lib/types';
import { getOutcomeDescription, getOutcomeEmoji } from '@/lib/dice-engine';

interface DiceRollerProps {
  diceRoll: DiceRoll | null;
  isRolling: boolean;
  onComplete?: () => void;
}

export default function DiceRoller({ diceRoll, isRolling, onComplete }: DiceRollerProps) {
  if (!isRolling && !diceRoll) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onComplete}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-2xl border-2 border-blue-500/50 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {isRolling ? (
            // Rolling animation
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                className="inline-block text-6xl mb-4"
              >
                🎲
              </motion.div>
              <p className="text-xl text-white font-medium">投掷骰子中...</p>
            </div>
          ) : diceRoll ? (
            // Result display
            <div className="space-y-6">
              {/* Title */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">骰子判定</h3>
                <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full" />
              </div>

              {/* Dice */}
              <div className="flex justify-center gap-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 bg-white rounded-xl shadow-lg flex items-center justify-center"
                >
                  <span className="text-4xl font-bold text-gray-800">{diceRoll.dice1}</span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 bg-white rounded-xl shadow-lg flex items-center justify-center"
                >
                  <span className="text-4xl font-bold text-gray-800">{diceRoll.dice2}</span>
                </motion.div>
              </div>

              {/* Calculation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-700/50 rounded-xl p-4 space-y-2"
              >
                <div className="flex justify-between text-gray-300">
                  <span>骰子总和:</span>
                  <span className="font-bold text-white">{diceRoll.total}</span>
                </div>
                
                {diceRoll.bonus > 0 && (
                  <>
                    <div className="flex justify-between text-blue-300">
                      <span>特质加成:</span>
                      <span className="font-bold">+{diceRoll.bonus}</span>
                    </div>
                    {diceRoll.matchedTraits.length > 0 && (
                      <div className="text-xs text-gray-400 text-right">
                        ({diceRoll.matchedTraits.join('、')})
                      </div>
                    )}
                  </>
                )}
                
                <div className="pt-2 border-t border-gray-600 flex justify-between text-lg">
                  <span className="text-gray-200">最终结果:</span>
                  <span className="font-bold text-yellow-400">{diceRoll.finalResult}</span>
                </div>
                
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>难度:</span>
                  <span>{diceRoll.difficulty}</span>
                </div>
              </motion.div>

              {/* Outcome */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className={`text-center p-6 rounded-xl border-2 ${
                  diceRoll.outcome === 'critical-success' || diceRoll.outcome === 'perfect'
                    ? 'bg-green-500/20 border-green-500'
                    : diceRoll.outcome === 'success'
                    ? 'bg-blue-500/20 border-blue-500'
                    : diceRoll.outcome === 'fail'
                    ? 'bg-orange-500/20 border-orange-500'
                    : 'bg-red-500/20 border-red-500'
                }`}
              >
                <div className="text-5xl mb-2">{getOutcomeEmoji(diceRoll.outcome)}</div>
                <div className="text-2xl font-bold text-white">
                  {getOutcomeDescription(diceRoll.outcome)}
                </div>
                {diceRoll.outcome === 'critical-success' && (
                  <div className="text-sm text-gray-300 mt-2">超出预期的完美表现！</div>
                )}
                {diceRoll.outcome === 'critical-fail' && (
                  <div className="text-sm text-gray-300 mt-2">事情变得更糟了...</div>
                )}
              </motion.div>

              {/* Continue button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={onComplete}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 
                         hover:from-blue-500 hover:to-purple-500 text-white font-medium 
                         rounded-xl transition-all"
              >
                继续故事 →
              </motion.button>
            </div>
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

