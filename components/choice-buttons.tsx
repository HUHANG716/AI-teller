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

  // Helper to check if choice needs dice roll
  const needsDiceRoll = (choice: Choice | string): boolean => {
    return typeof choice !== 'string' && choice.requiresDiceRoll === true;
  };

  // Helper to get difficulty
  const getDifficulty = (choice: Choice | string): number | undefined => {
    return typeof choice !== 'string' ? choice.difficulty : undefined;
  };

  return (
    <div className="space-y-4">
      {choices.map((choice, index) => {
        const text = getChoiceText(choice);
        const requiresDice = needsDiceRoll(choice);
        const difficulty = getDifficulty(choice);

        return (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            onClick={() => onSelect(choice)}
            disabled={disabled}
            className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-300 
                     disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg 
                     ${requiresDice 
                       ? 'bg-gradient-to-r from-purple-900/90 to-blue-900/90 border-purple-500 hover:border-purple-400 hover:from-purple-800/90 hover:to-blue-800/90 hover:shadow-purple-500/30'
                       : 'bg-gradient-to-r from-gray-800/90 to-gray-700/90 border-gray-600 hover:border-blue-500 hover:from-blue-600/80 hover:to-purple-600/80 hover:shadow-blue-500/20'
                     }`}
          >
            <div className="flex items-center gap-4">
              <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center 
                             justify-center font-bold text-sm transition-colors
                             ${requiresDice 
                               ? 'bg-purple-700 group-hover:bg-purple-500' 
                               : 'bg-gray-700 group-hover:bg-blue-500'
                             }`}>
                {index + 1}
              </span>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {requiresDice && (
                    <span className="text-xl" title="需要骰子判定">🎲</span>
                  )}
                  <span className="text-gray-200 group-hover:text-white transition-colors flex-1">
                    {text}
                  </span>
                </div>
                
                {requiresDice && difficulty && (
                  <div className="mt-1 text-xs text-purple-300 flex items-center gap-2">
                    <span>难度: {difficulty}</span>
                    <span className="text-gray-500">|</span>
                    <span>
                      {difficulty <= 6 && '简单'}
                      {difficulty === 7 && '普通'}
                      {difficulty === 8 && '普通'}
                      {difficulty === 9 && '有挑战'}
                      {difficulty === 10 && '困难'}
                      {difficulty >= 11 && '极难'}
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

