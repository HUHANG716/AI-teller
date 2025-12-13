'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Genre } from '@/lib/types';
import { useGameStore } from '@/store/game-store';

const GENRES = [
  { id: 'wuxia' as Genre, name: '武侠江湖', desc: '刀光剑影，快意恩仇' },
  { id: 'urban-mystery' as Genre, name: '都市灵异', desc: '现代背景，悬疑惊悚' },
  { id: 'peaky-blinders' as Genre, name: '浴血黑帮', desc: '1920年代，权谋与血性' },
];

export default function CharacterForm() {
  const router = useRouter();
  const startNewGame = useGameStore(state => state.startNewGame);
  const isLoading = useGameStore(state => state.isLoading);

  const [selectedGenre, setSelectedGenre] = useState<Genre>('wuxia');
  const [characterName, setCharacterName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!characterName.trim()) {
      setError('请输入角色名字');
      return;
    }

    // Create character object
    const genreDesc = {
      wuxia: '江湖侠士',
      'urban-mystery': '都市人物',
      'peaky-blinders': '黑帮成员'
    };

    const character = {
      id: `char-${Date.now()}`,
      name: characterName.trim(),
      description: `一位神秘的${genreDesc[selectedGenre]}`,
      createdAt: Date.now(),
    };

    // Start new game
    try {
      await startNewGame(selectedGenre, character);
      // Navigate to game page
      router.push('/game');
    } catch (err) {
      setError('创建角色失败，请重试');
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
      {/* Genre Selection */}
      <div className="space-y-3">
        <label className="block text-lg font-medium text-gray-200">
          选择故事题材
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GENRES.map((genre) => (
            <button
              key={genre.id}
              type="button"
              onClick={() => setSelectedGenre(genre.id)}
              className={`p-6 rounded-xl border-2 transition-all ${
                selectedGenre === genre.id
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="text-xl font-bold mb-2">{genre.name}</div>
              <div className="text-sm text-gray-400">{genre.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Character Name */}
      <div className="space-y-3">
        <label htmlFor="name" className="block text-lg font-medium text-gray-200">
          角色名字
        </label>
        <input
          id="name"
          type="text"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
          placeholder="请输入你的角色名字"
          maxLength={20}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg
                   text-white placeholder-gray-500 focus:outline-none focus:border-blue-500
                   transition-colors"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600
                 text-white font-bold text-lg rounded-xl hover:from-blue-500
                 hover:to-purple-500 transition-all disabled:opacity-50
                 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
      >
        {isLoading ? '正在创建冒险...' : '开始冒险 →'}
      </button>
    </form>
  );
}
