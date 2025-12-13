'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game-store';

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'rounds' | 'goal' | 'state' | 'actions'>('rounds');
  const [newMaxRounds, setNewMaxRounds] = useState('15');
  const [jumpToRound, setJumpToRound] = useState('1');
  const [goalProgress, setGoalProgress] = useState('0');

  const {
    currentGame,
    lastAIResponse,
    isLoading,
    debugSetMaxRounds,
    debugSetCurrentRound,
    debugSetGoalProgress,
    debugMarkGoalCompleted,
    debugTriggerEnding,
    clearGame,
  } = useGameStore();

  if (!currentGame) return null;

  const roundNumber = currentGame.currentNodeIndex + 1;
  const maxRounds = currentGame.maxRounds || 15;

  const tabs = [
    { id: 'rounds' as const, label: '轮数', icon: '🔄' },
    { id: 'goal' as const, label: '目标', icon: '🎯' },
    { id: 'state' as const, label: '状态', icon: '📊' },
    { id: 'actions' as const, label: '操作', icon: '⚡' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -top-10 left-4 px-4 py-2 bg-purple-600 hover:bg-purple-700
                   text-white rounded-t-lg text-sm font-medium transition-colors
                   flex items-center gap-2 shadow-lg"
      >
        <span>🔧</span>
        <span>调试面板</span>
        <span className="text-xs opacity-75">{isOpen ? '▼' : '▲'}</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="bg-gray-900 border-t border-purple-500/50 shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1
                  ${activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 max-h-64 overflow-auto">
            {/* 轮数控制 */}
            {activeTab === 'rounds' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">当前轮数:</span>
                  <span className="text-white font-bold">{roundNumber} / {maxRounds}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-gray-400 text-sm">最大轮数:</label>
                    <input
                      type="number"
                      value={newMaxRounds}
                      onChange={(e) => setNewMaxRounds(e.target.value)}
                      className="w-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                      min="1"
                      max="50"
                    />
                    <button
                      onClick={() => debugSetMaxRounds(parseInt(newMaxRounds) || 15)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                    >
                      设置
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-gray-400 text-sm">跳转到轮:</label>
                    <input
                      type="number"
                      value={jumpToRound}
                      onChange={(e) => setJumpToRound(e.target.value)}
                      className="w-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                      min="1"
                      max={currentGame.storyNodes.length}
                    />
                    <button
                      onClick={() => debugSetCurrentRound(parseInt(jumpToRound) || 1)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                    >
                      跳转
                    </button>
                  </div>
                  <span className="text-gray-500 text-xs">(最多跳转到已生成的轮数: {currentGame.storyNodes.length})</span>
                </div>
              </div>
            )}

            {/* 目标管理 */}
            {activeTab === 'goal' && (
              <div className="space-y-4">
                {currentGame.goal ? (
                  <>
                    <div className="text-sm">
                      <span className="text-gray-400">当前目标:</span>
                      <span className="text-white ml-2">{currentGame.goal.goal.description}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-400">进度:</span>
                      <span className="text-white ml-2">{currentGame.goal.progress.percentage}%</span>
                      {currentGame.goal.progress.reason && (
                        <span className="text-gray-500 ml-2">({currentGame.goal.progress.reason})</span>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-400">状态:</span>
                      <span className={`ml-2 ${currentGame.goal.completedAt ? 'text-green-400' : 'text-yellow-400'}`}>
                        {currentGame.goal.completedAt ? '已完成' : '进行中'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 pt-2 border-t border-gray-700">
                      <div className="flex items-center gap-2">
                        <label className="text-gray-400 text-sm">设置进度:</label>
                        <input
                          type="number"
                          value={goalProgress}
                          onChange={(e) => setGoalProgress(e.target.value)}
                          className="w-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          min="0"
                          max="100"
                        />
                        <span className="text-gray-500 text-sm">%</span>
                        <button
                          onClick={() => debugSetGoalProgress(parseInt(goalProgress) || 0)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                        >
                          设置
                        </button>
                      </div>
                      <button
                        onClick={debugMarkGoalCompleted}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        标记完成
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 text-sm">尚未选择目标（第3轮后选择）</div>
                )}
              </div>
            )}

            {/* 状态查看 */}
            {activeTab === 'state' && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <h4 className="text-gray-400 text-sm mb-2">游戏状态</h4>
                    <pre className="text-xs text-gray-300 bg-black/50 p-2 rounded max-h-40 overflow-auto">
                      {JSON.stringify({
                        id: currentGame.id,
                        genre: currentGame.genre,
                        currentNodeIndex: currentGame.currentNodeIndex,
                        roundNumber,
                        maxRounds: currentGame.maxRounds,
                        hasGoal: !!currentGame.goal,
                        goalProgress: currentGame.goal?.progress.percentage,
                        storyNodesCount: currentGame.storyNodes.length,
                        hasEnding: !!currentGame.ending,
                      }, null, 2)}
                    </pre>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-gray-400 text-sm mb-2">最后 AI 响应</h4>
                    <pre className="text-xs text-gray-300 bg-black/50 p-2 rounded max-h-40 overflow-auto">
                      {lastAIResponse ? JSON.stringify({
                        hasContent: !!lastAIResponse.content,
                        choicesCount: lastAIResponse.choices?.length || 0,
                        hasGoalOptions: !!lastAIResponse.goalOptions,
                        goalOptionsCount: lastAIResponse.goalOptions?.length || 0,
                        hasGoalProgress: !!lastAIResponse.goalProgress,
                        goalProgressValue: lastAIResponse.goalProgress,
                      }, null, 2) : 'null'}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="text-gray-400 text-sm mb-2">当前节点</h4>
                  <pre className="text-xs text-gray-300 bg-black/50 p-2 rounded max-h-32 overflow-auto">
                    {JSON.stringify({
                      id: currentGame.storyNodes[currentGame.currentNodeIndex]?.id,
                      contentLength: currentGame.storyNodes[currentGame.currentNodeIndex]?.content?.length,
                      choicesCount: currentGame.storyNodes[currentGame.currentNodeIndex]?.choices?.length,
                      hasGoalOptions: !!currentGame.storyNodes[currentGame.currentNodeIndex]?.goalOptions,
                      userChoice: currentGame.storyNodes[currentGame.currentNodeIndex]?.userChoice,
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* 快捷操作 */}
            {activeTab === 'actions' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={debugTriggerEnding}
                    disabled={isLoading}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50
                             text-white rounded text-sm font-medium"
                  >
                    🏁 触发结局
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('确定要重置当前游戏吗？这将清除所有进度！')) {
                        clearGame();
                      }
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium"
                  >
                    🗑️ 重置游戏
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('确定要清除所有本地存储数据吗？')) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded text-sm font-medium"
                  >
                    💣 清除所有数据
                  </button>
                </div>

                <div className="pt-2 border-t border-gray-700">
                  <button
                    onClick={() => {
                      console.log('📊 当前游戏状态:', currentGame);
                      console.log('📥 最后 AI 响应:', lastAIResponse);
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                  >
                    📋 输出到控制台
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
