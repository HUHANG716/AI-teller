'use client';

import { Ending } from '@/lib/types';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/game-store';

interface EndingDisplayProps {
  ending: Ending;
}

const endingTitles: Record<Ending['type'], string> = {
  'success': '完美结局',
  'partial-success': '良好结局',
  'failure': '失败结局',
  'timeout': '时间耗尽',
};

const endingColors: Record<Ending['type'], string> = {
  'success': 'from-green-600/50 to-emerald-600/50 border-green-500/50',
  'partial-success': 'from-yellow-600/50 to-orange-600/50 border-yellow-500/50',
  'failure': 'from-red-600/50 to-rose-600/50 border-red-500/50',
  'timeout': 'from-gray-600/50 to-slate-600/50 border-gray-500/50',
};

export default function EndingDisplay({ ending }: EndingDisplayProps) {
  const router = useRouter();
  const clearGame = useGameStore((state) => state.clearGame);

  const handleReturnHome = () => {
    clearGame();
    router.push('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-gradient-to-br ${endingColors[ending.type]} rounded-2xl p-6 border-2 mt-6`}
    >
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-white mb-1">
          {ending.title || endingTitles[ending.type]}
        </h2>
        <p className="text-white/70 text-sm">
          {endingTitles[ending.type]}
        </p>
      </div>

      {ending.conditions && ending.conditions.length > 0 && (
        <div className="bg-black/10 rounded-lg p-4 mb-4">
          <p className="text-white/70 text-sm mb-2">达成条件：</p>
          <ul className="list-disc list-inside text-white/80 text-sm space-y-1">
            {ending.conditions.map((condition, index) => (
              <li key={index}>{condition}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-center pt-4 border-t border-white/10">
        <p className="text-white/50 text-sm mb-4">
          感谢你的冒险！
        </p>
        <button
          onClick={handleReturnHome}
          className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-colors"
        >
          返回主页
        </button>
      </div>
    </motion.div>
  );
}
