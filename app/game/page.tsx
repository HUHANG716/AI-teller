'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/game-store';
import StoryDisplay from '@/components/story-display';
import ChoiceButtons from '@/components/choice-buttons';
import CustomInput from '@/components/custom-input';
import LoadingOverlay from '@/components/loading-overlay';
import DiceRoller from '@/components/dice-roller';
import GoalDisplay from '@/components/goal-display';
import ResourceDisplay from '@/components/resource-display';
import EndingDisplay from '@/components/ending-display';
import GoalSelection from '@/components/goal-selection';
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
    clearDiceRoll,
    lastAIResponse,
    selectGoal
  } = useGameStore();
  const [showChoices, setShowChoices] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

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
  const roundNumber = currentGame.currentNodeIndex + 1;
  const maxRounds = currentGame.maxRounds || 15;
  const isGameEnded = !!currentGame.ending;
  // Check if we're in round 3 goal selection
  // Get goalOptions from currentNode or lastAIResponse
  const goalOptions = currentNode.goalOptions || lastAIResponse?.goalOptions;
  const isRound3GoalSelection = roundNumber === 3 && !currentGame.goal && goalOptions && goalOptions.length > 0;

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
              第 {roundNumber} / {maxRounds} 轮
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg 
                       transition-colors text-sm"
              title="查看AI原始响应"
            >
              🔍 调试
            </button>
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

        {/* Goal Display */}
        {!isGameEnded && (
          currentGame.goal ? (
            <GoalDisplay goal={currentGame.goal} />
          ) : (
            <div className="mb-6 p-4 bg-gradient-to-r from-yellow-900/50 to-orange-900/50 rounded-xl border border-yellow-500/30">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-200 mb-1">
                    选择你的目标
                  </h3>
                  <p className="text-yellow-300/80 text-sm">
                    在前三轮中，通过选择来确定你的冒险目标。目标将指引你的整个旅程。
                  </p>
                </div>
              </div>
            </div>
          )
        )}

        {/* Resource Display */}
        {!isGameEnded && (
          <ResourceDisplay 
            resources={currentGame.resources || []} 
            resourceDefinitions={currentGame.resourceDefinitions}
          />
        )}

        {/* Debug Panel */}
        {showDebug && lastAIResponse && (
          <div className="mb-6 p-4 bg-gray-900/90 border border-gray-600 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-200">🔍 AI原始响应</h3>
              <button
                onClick={() => setShowDebug(false)}
                className="text-gray-400 hover:text-gray-200 text-sm"
              >
                关闭
              </button>
            </div>
            <pre className="text-xs text-gray-300 overflow-auto max-h-96 bg-black/50 p-4 rounded border border-gray-700">
              {JSON.stringify(lastAIResponse, null, 2)}
            </pre>
            <div className="mt-3 text-sm text-gray-400">
              <p>目标选项数量: {lastAIResponse.goalOptions?.length || 0}</p>
              <p>资源变化数量: {lastAIResponse.resourceChanges?.length || 0}</p>
              <p>目标进度: {lastAIResponse.goalProgress ? `${lastAIResponse.goalProgress.percentage}%` : '无'}</p>
            </div>
          </div>
        )}

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

        {/* 显示上一轮的选择 */}
        {currentGame.currentNodeIndex > 0 && currentGame.storyNodes[currentGame.currentNodeIndex - 1]?.userChoice && (
          <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30">
            <span className="text-blue-300 text-sm">你的选择：</span>
            <span className="text-white ml-2">
              {currentGame.storyNodes[currentGame.currentNodeIndex - 1].userChoice}
            </span>
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

        {/* Goal Selection (Round 3) */}
        {isRound3GoalSelection && showChoices && !isLoading && !isGameEnded && goalOptions && (
          <GoalSelection
            goals={goalOptions}
            onSelect={async (goal) => {
              setShowChoices(false);
              await selectGoal(goal);
            }}
            disabled={isLoading}
          />
        )}

        {/* Regular Choices */}
        {!isRound3GoalSelection && showChoices && !isLoading && !isGameEnded && (
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

        {/* Game Ended Message */}
        {isGameEnded && (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">游戏已结束</p>
            <button
              onClick={() => {
                clearGame();
                router.push('/');
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              返回主页
            </button>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay show={isLoading} />

      {/* Dice Roller */}
      {!isGameEnded && (
        <DiceRoller
          diceRoll={currentDiceRoll}
          isRolling={isRollingDice}
          onComplete={handleDiceComplete}
        />
      )}

      {/* Ending Display */}
      {isGameEnded && currentGame.ending && (
        <EndingDisplay ending={currentGame.ending} />
      )}
    </main>
  );
}

