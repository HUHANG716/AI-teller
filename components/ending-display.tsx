'use client';

import { Ending } from '@/lib/types';
import { motion } from 'framer-motion';

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
  'success': 'from-green-600 to-emerald-600',
  'partial-success': 'from-yellow-600 to-orange-600',
  'failure': 'from-red-600 to-rose-600',
  'timeout': 'from-gray-600 to-slate-600',
};

export default function EndingDisplay({ ending }: EndingDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className={`max-w-2xl w-full bg-gradient-to-br ${endingColors[ending.type]} rounded-2xl p-8 shadow-2xl border-2 border-white/20`}
      >
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-white mb-2">
            {ending.title || endingTitles[ending.type]}
          </h2>
          <p className="text-white/80 text-sm">
            {endingTitles[ending.type]}
          </p>
        </div>
        
        <div className="bg-white/10 rounded-xl p-6 mb-6 backdrop-blur-sm">
          <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
            {ending.description}
          </p>
        </div>

        {ending.conditions && ending.conditions.length > 0 && (
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <p className="text-white/70 text-sm mb-2">达成条件：</p>
            <ul className="list-disc list-inside text-white/80 text-sm space-y-1">
              {ending.conditions.map((condition, index) => (
                <li key={index}>{condition}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-center">
          <p className="text-white/60 text-sm">
            感谢你的冒险！
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
