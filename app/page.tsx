'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GameState } from '@/lib/types';
import { getAllGames, deleteGame } from '@/lib/storage';
import { useGameStore } from '@/store/game-store';
import ZhipuModelSelector from '@/components/zhipu-model-selector';

export default function Home() {
  const router = useRouter();
  const loadGame = useGameStore(state => state.loadGame);
  const [savedGames, setSavedGames] = useState<GameState[]>([]);

  useEffect(() => {
    // Load saved games from localStorage
    setSavedGames(getAllGames());
  }, []);

  const handleNewGame = () => {
    router.push('/character');
  };

  const handleContinueGame = (gameId: string) => {
    loadGame(gameId);
    router.push('/game');
  };

  const handleDeleteGame = (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个存档吗？')) {
      deleteGame(gameId);
      setSavedGames(getAllGames());
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-clip-text
                       text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            AI Storyteller
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4">
            你的口袋故事生成器
          </p>
          <p className="text-gray-500">
            用AI为你生成永不重复的互动故事，每一次选择都会创造全新的冒险
          </p>
        </motion.div>

        {/* New Game Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <button
            onClick={handleNewGame}
            className="w-full py-6 bg-gradient-to-r from-blue-600 to-purple-600
                     hover:from-blue-500 hover:to-purple-500 text-white font-bold
                     text-xl rounded-2xl transition-all shadow-2xl hover:shadow-blue-500/50
                     transform hover:scale-[1.02]"
          >
            🎮 开始新的冒险
          </button>
        </motion.div>

        {/* Saved Games */}
        {savedGames.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6">继续你的故事</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  onClick={() => handleContinueGame(game.id)}
                  className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl
                           border-2 border-gray-700 hover:border-blue-500 cursor-pointer
                           transition-all hover:shadow-lg hover:shadow-blue-500/20 group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-400
                                   transition-colors">
                        {game.character.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {game.genre === 'wuxia' ? '🗡️ 武侠江湖' :
                         game.genre === 'urban-mystery' ? '🌃 都市灵异' :
                         '🎩 浴血黑帮'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteGame(game.id, e)}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                      title="删除存档"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>进度：第 {game.currentNodeIndex + 1} 章</p>
                    <p>更新：{formatDate(game.updatedAt)}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {game.storyNodes[game.currentNodeIndex]?.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Features Section */}
        {savedGames.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
          >
            <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">🎭</div>
              <h3 className="text-lg font-bold text-white mb-2">AI动态生成</h3>
              <p className="text-gray-400 text-sm">
                每次游玩都是独一无二的故事，永不重复
              </p>
            </div>

            <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">⚔️</div>
              <h3 className="text-lg font-bold text-white mb-2">多种题材</h3>
              <p className="text-gray-400 text-sm">
                武侠江湖、都市灵异，更多题材持续更新
              </p>
            </div>

            <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">💾</div>
              <h3 className="text-lg font-bold text-white mb-2">自动保存</h3>
              <p className="text-gray-400 text-sm">
                进度自动保存，随时随地继续你的冒险
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Zhipu Model Selector */}
      <ZhipuModelSelector />
    </main>
  );
}
