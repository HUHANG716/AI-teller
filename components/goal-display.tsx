'use client';

import { GameGoal } from '@/lib/types';

interface GoalDisplayProps {
  goal: GameGoal;
}

export default function GoalDisplay({ goal }: GoalDisplayProps) {
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl border border-purple-500/30">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-purple-200 flex items-center gap-2">
          <span>🎯</span>
          当前目标
        </h3>
        <span className="text-sm text-purple-300">
          {goal.progress.percentage}%
        </span>
      </div>
      <p className="text-purple-100 mb-3">{goal.goal.description}</p>
      <div className="w-full bg-gray-800 rounded-full h-2.5 mb-2">
        <div
          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(goal.progress.percentage, 100)}%` }}
        />
      </div>
      <p className="text-sm text-purple-300">{goal.progress.description}</p>
    </div>
  );
}
