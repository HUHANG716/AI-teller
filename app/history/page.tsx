'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/game-store';

export default function HistoryPage() {
  const router = useRouter();
  const currentGame = useGameStore(state => state.currentGame);

  if (!currentGame) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400 mb-8">没有找到游戏记录</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg 
                     transition-colors"
          >
            返回首页
          </button>
        </div>
      </main>
    );
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">故事回顾</h1>
            <p className="text-gray-400">
              {currentGame.character.name}的冒险历程
            </p>
          </div>
          <button
            onClick={() => router.push('/game')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg 
                     transition-colors"
          >
            ← 返回游戏
          </button>
        </div>

        {/* Character Info */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 
                   rounded-xl border border-blue-500/30"
        >
          <div className="flex items-center gap-4 mb-3">
            <h2 className="text-2xl font-bold text-white">{currentGame.character.name}</h2>
            <span className="px-3 py-1 bg-blue-500/30 text-blue-300 rounded-full text-sm">
              {currentGame.genre === 'wuxia' ? '武侠江湖' : 
               currentGame.genre === 'urban-mystery' ? '都市灵异' : 
               '浴血黑帮'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentGame.character.tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-white/10 text-gray-300 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Story Timeline */}
        <div className="space-y-8">
          {currentGame.storyNodes.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Timeline Line */}
              {index < currentGame.storyNodes.length - 1 && (
                <div className="absolute left-[19px] top-[60px] w-0.5 h-[calc(100%+2rem)] 
                             bg-gradient-to-b from-blue-500 to-purple-500" />
              )}

              <div className="flex gap-4">
                {/* Chapter Number */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br 
                             from-blue-600 to-purple-600 flex items-center justify-center 
                             font-bold text-white shadow-lg">
                  {index + 1}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {formatDate(node.timestamp)}
                    </span>
                    {index === currentGame.currentNodeIndex && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded 
                                   text-xs font-medium border border-green-500/30">
                        当前位置
                      </span>
                    )}
                  </div>

                  <div className="p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 
                               rounded-xl border border-gray-700 shadow-lg">
                    <p className="text-gray-200 leading-relaxed whitespace-pre-wrap mb-4">
                      {node.content}
                    </p>

                    {/* User's Choice */}
                    {node.userChoice && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-sm text-gray-400 mb-2">你的选择：</p>
                        <div className="px-4 py-3 bg-blue-500/10 rounded-lg border-l-4 
                                     border-blue-500">
                          <p className="text-blue-300">{node.userChoice}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-6 bg-gray-800/50 rounded-xl border border-gray-700"
        >
          <h3 className="text-lg font-bold text-white mb-4">冒险统计</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400">
                {currentGame.storyNodes.length}
              </div>
              <div className="text-sm text-gray-400">章节数</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">
                {currentGame.storyNodes.filter(n => n.userChoice).length}
              </div>
              <div className="text-sm text-gray-400">决策次数</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">
                {currentGame.character.tags.length}
              </div>
              <div className="text-sm text-gray-400">角色特质</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">
                {Math.floor(
                  (Date.now() - currentGame.createdAt) / 1000 / 60
                )}
              </div>
              <div className="text-sm text-gray-400">游玩分钟</div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

