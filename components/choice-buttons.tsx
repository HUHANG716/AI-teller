'use client';

import { motion } from 'framer-motion';
import { Choice } from '@/lib/types';

interface ChoiceButtonsProps {
  choices: Choice[] | string[];
  onSelect: (choice: string | Choice) => void;
  disabled?: boolean;
}

export default function ChoiceButtons({ choices, onSelect, disabled }: ChoiceButtonsProps) {
  // Helper to get choice text
  const getChoiceText = (choice: Choice | string): string => {
    return typeof choice === 'string' ? choice : choice.text;
  };

  // Helper to get difficulty
  const getDifficulty = (choice: Choice | string): number | undefined => {
    return typeof choice !== 'string' ? choice.difficulty : undefined;
  };

  // Helper to get difficulty label
  const getDifficultyLabel = (difficulty: number): string => {
    if (difficulty <= 6) return '简单';
    if (difficulty <= 8) return '普通';
    if (difficulty <= 9) return '有挑战';
    if (difficulty === 10) return '困难';
    return '极难';
  };

  return (
    <div className="space-y-4">
      {choices.map((choice, index) => {
        const text = getChoiceText(choice);
        const difficulty = getDifficulty(choice);

        return (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            onClick={() => onSelect(choice)}
            disabled={disabled}
            className="w-full text-left p-5 rounded-xl border-2 transition-all duration-300
                     disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg
                     bg-gradient-to-r from-purple-900/90 to-blue-900/90 border-purple-500
                     hover:border-purple-400 hover:from-purple-800/90 hover:to-blue-800/90
                     hover:shadow-purple-500/30"
          >
            <div className="flex items-center gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center
                             justify-center font-bold text-sm transition-colors
                             bg-purple-700 group-hover:bg-purple-500">
                {index + 1}
              </span>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl" title="需要骰子判定">🎲</span>
                  <span className="text-gray-200 group-hover:text-white transition-colors flex-1">
                    {text}
                  </span>
                </div>

                {difficulty && (
                  <div className="mt-2 flex flex-wrap gap-2 items-center">
                    <span className="px-2 py-1 rounded text-xs bg-purple-600/40 text-purple-200">
                      难度 {difficulty} ({getDifficultyLabel(difficulty)})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
