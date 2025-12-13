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
import EndingDisplay from '@/components/ending-display';
import GoalSelection from '@/components/goal-selection';
import DebugPanel from '@/components/debug-panel';
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
    lastAIResponse,
    selectGoal,
    pendingNode,
    confirmContinue
  } = useGameStore();
  const [showChoices, setShowChoices] = useState(false);

  const handleStoryComplete = useCallback(() => {
    setShowChoices(true);
  }, []);

  // 当 currentNodeIndex 变化时，重置选项显示状态
  useEffect(() => {
    setShowChoices(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGame?.currentNodeIndex]);

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
  const maxRounds = currentGame.maxRounds || 10;
  const isGameEnded = !!currentGame.ending;
  // Check if we're in round 3 goal selection
  // Get goalOptions from currentNode or lastAIResponse
  const goalOptions = currentNode.goalOptions || lastAIResponse?.goalOptions;
  const isRound3GoalSelection = roundNumber === 3 && !currentGame.goal && goalOptions && goalOptions.length > 0;

  const handleChoice = async (choice: string | Choice) => {
    setShowChoices(false);
    await makeChoice(choice);
  };

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
              {isGameEnded
                ? '故事结局'
                : roundNumber <= 3
                  ? `序章 · 第${roundNumber}章`
                  : `第 ${roundNumber - 3} / ${maxRounds - 3} 轮`}
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

        {/* 显示当前轮的选择结果和"继续"按钮（当有 pendingNode 时） */}
        {pendingNode && !isLoading && (
          <div className="mb-6 space-y-4">
            {/* 当前轮的选择 */}
            {currentNode.userChoice && (
              <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
                <span className="text-blue-300 text-sm">你的选择：</span>
                <span className="text-white ml-2">{currentNode.userChoice}</span>
              </div>
            )}

            {/* 骰子结果 */}
            {currentNode.diceRoll && (
              <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎲</span>
                  <div>
                    <p className="text-purple-200">
                      掷骰结果：{currentNode.diceRoll.dice1} + {currentNode.diceRoll.dice2} = {currentNode.diceRoll.total}
                      {' '}(难度 {currentNode.diceRoll.difficulty})
                    </p>
                    <p className={`text-sm font-medium ${
                      currentNode.diceRoll.outcome === 'critical-success' ? 'text-yellow-400' :
                      currentNode.diceRoll.outcome === 'perfect' ? 'text-green-400' :
                      currentNode.diceRoll.outcome === 'success' ? 'text-green-300' :
                      currentNode.diceRoll.outcome === 'fail' ? 'text-red-300' :
                      'text-red-500'
                    }`}>
                      {currentNode.diceRoll.outcome === 'critical-success' ? '大成功！' :
                       currentNode.diceRoll.outcome === 'perfect' ? '完美成功！' :
                       currentNode.diceRoll.outcome === 'success' ? '成功' :
                       currentNode.diceRoll.outcome === 'fail' ? '失败' :
                       '大失败！'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 继续按钮 */}
            <button
              onClick={confirmContinue}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600
                       hover:from-blue-500 hover:to-purple-500
                       text-white font-medium text-lg rounded-xl
                       transition-all duration-200 shadow-lg hover:shadow-xl
                       flex items-center justify-center gap-2"
            >
              <span>继续冒险</span>
              <span className="text-xl">→</span>
            </button>
          </div>
        )}

        {/* 显示上一轮的选择（只在没有 pendingNode 时显示） */}
        {!pendingNode && currentGame.currentNodeIndex > 0 && currentGame.storyNodes[currentGame.currentNodeIndex - 1]?.userChoice && (
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

          {/* Ending Display - 融入故事流程 */}
          {isGameEnded && currentGame.ending && (
            <EndingDisplay ending={currentGame.ending} />
          )}
        </div>

        {/* Goal Selection (Round 3) */}
        {isRound3GoalSelection && showChoices && !isLoading && !isGameEnded && !pendingNode && goalOptions && (
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
        {!isRound3GoalSelection && showChoices && !isLoading && !isGameEnded && !pendingNode && (
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

      {/* Loading Overlay - 仅在 API 加载中显示 */}
      <LoadingOverlay show={isLoading} />

      {/* Dice Roller */}
      {!isGameEnded && (
        <DiceRoller
          diceRoll={currentDiceRoll}
          isRolling={isRollingDice}
          isLoading={isLoading}
          hasPendingNode={!!pendingNode}
          onComplete={confirmContinue}
        />
      )}

      {/* Debug Panel */}
      <DebugPanel />
    </main>
  );
}
