'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/game-store';
import StoryDisplay from '@/components/story-display';
import ChoiceButtons from '@/components/choice-buttons';
import CustomInput from '@/components/custom-input';
import LoadingOverlay from '@/components/loading-overlay';
import DiceRoller from '@/components/dice-roller';
import { Choice } from '@/lib/types';

export default function GamePage() {
  const router = useRouter();
  const { 
    currentGame, 
    isLoading, 
    error, 
    makeChoice, 
    clearGame,
    currentDiceRoll,
    isRollingDice,
    clearDiceRoll
  } = useGameStore();
  const [showChoices, setShowChoices] = useState(false);

  useEffect(() => {
    // If no game is loaded, redirect to home
    if (!currentGame && !isLoading) {
      router.push('/');
    }
  }, [currentGame, isLoading, router]);

  if (!currentGame) {
    return null; // Will redirect
  }

  const currentNode = currentGame.storyNodes[currentGame.currentNodeIndex];

  const handleChoice = async (choice: string | Choice) => {
    setShowChoices(false);
    await makeChoice(choice);
  };

  const handleDiceComplete = useCallback(() => {
    clearDiceRoll();
  }, [clearDiceRoll]);

  const handleStoryComplete = useCallback(() => {
    setShowChoices(true);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {currentGame.character.name}的冒险
            </h1>
            <p className="text-gray-400">
              {currentGame.genre === 'wuxia' ? '🗡️ 武侠江湖' : 
               currentGame.genre === 'urban-mystery' ? '🌃 都市灵异' : 
               '🎩 浴血黑帮'} · 
              第 {currentGame.currentNodeIndex + 1} 章
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/history')}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg 
                       transition-colors text-sm"
            >
              📜 历史
            </button>
            <button
              onClick={() => {
                if (confirm('确定要退出当前游戏吗？进度已自动保存。')) {
                  clearGame();
                  router.push('/');
                }
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg 
                       transition-colors text-sm"
            >
              🏠 主页
            </button>
          </div>
        </div>

        {/* Character Info */}
        <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-gray-400">特质：</span>
            {currentGame.character.tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm 
                         border border-blue-500/30"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
            <p className="font-medium">⚠️ {error}</p>
            <button
              onClick={() => useGameStore.getState().setError(null)}
              className="mt-2 text-sm underline hover:no-underline"
            >
              关闭
            </button>
          </div>
        )}

        {/* Story Content */}
        <div className="mb-8">
          <StoryDisplay 
            key={currentNode.id}
            content={currentNode.content} 
            onComplete={handleStoryComplete}
          />
        </div>

        {/* Choices */}
        {showChoices && !isLoading && (
          <div className="space-y-4">
            <h2 className="text-xl font-medium text-gray-300 mb-4">你会如何选择？</h2>
            
            <ChoiceButtons
              choices={currentNode.choices}
              onSelect={handleChoice}
              disabled={isLoading}
            />

            <CustomInput
              onSubmit={handleChoice}
              disabled={isLoading}
            />
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay show={isLoading} />

      {/* Dice Roller */}
      <DiceRoller
        diceRoll={currentDiceRoll}
        isRolling={isRollingDice}
        onComplete={handleDiceComplete}
      />
    </main>
  );
}

