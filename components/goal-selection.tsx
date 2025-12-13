'use client';

import { Goal } from '@/lib/types';
import { motion } from 'framer-motion';

interface GoalSelectionProps {
  goals: Goal[];
  onSelect: (goal: Goal) => void;
  disabled?: boolean;
}

export default function GoalSelection({ goals, onSelect, disabled }: GoalSelectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        🎯 选择你的冒险目标
      </h2>
      <p className="text-gray-400 text-center mb-8">
        这是决定你冒险方向的关键时刻。选择一个目标，它将指引你接下来的旅程。
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal, index) => (
          <motion.button
            key={goal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => !disabled && onSelect(goal)}
            disabled={disabled}
            className="p-6 bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl
                     border-2 border-purple-500/30 hover:border-purple-500/60
                     transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed
                     hover:scale-105 active:scale-95"
          >
            <h3 className="text-xl font-semibold text-purple-200">
              {goal.description}
            </h3>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
