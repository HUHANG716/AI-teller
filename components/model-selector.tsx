'use client';

import { useState, useEffect } from 'react';
import { getModelsForUI } from '@/lib/models';

export default function ModelSelector() {
  const [currentModel, setCurrentModel] = useState<string>('glm-4.6');
  const [isChanging, setIsChanging] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const MODELS = getModelsForUI();

  useEffect(() => {
    // 从 localStorage 读取模型偏好
    const saved = localStorage.getItem('ai-teller-model');
    if (saved) {
      setCurrentModel(saved);
    }

    // 从 localStorage 读取隐藏状态
    const hiddenState = localStorage.getItem('ai-teller-model-selector-hidden');
    if (hiddenState !== null) {
      setIsHidden(JSON.parse(hiddenState));
    }
  }, []);

  const handleModelChange = async (modelId: string) => {
    setIsChanging(true);

    // 保存到 localStorage
    localStorage.setItem('ai-teller-model', modelId);
    setCurrentModel(modelId);

    // 通知用户需要重新加载（因为环境变量在服务端）
    setTimeout(() => {
      setIsChanging(false);
      alert(`已切换到 ${MODELS.find(m => m.id === modelId)?.name}\n\n注意：新模型将在下次生成故事时生效。`);
    }, 500);
  };

  const toggleVisibility = () => {
    const newState = !isHidden;
    setIsHidden(newState);
    localStorage.setItem('ai-teller-model-selector-hidden', JSON.stringify(newState));
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
      {/* Model Selector Panel - Now slides up from bottom */}
      <div
        className={`bg-gray-800/95 backdrop-blur-sm rounded-t-xl border border-gray-700 border-b-0
                   shadow-2xl p-4 max-w-xs mb-0 transition-all duration-300 ease-out ${
                     isHidden
                       ? 'opacity-0 translate-y-full pointer-events-none'
                       : 'opacity-100 translate-y-0'
                   }`}
        style={{
          transformOrigin: 'bottom center',
          maxHeight: '60vh',
          overflowY: 'auto'
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-gray-400">AI 模型</span>
          <div className="flex-1 h-px bg-gray-700" />
          <button
            onClick={toggleVisibility}
            className="p-1 text-gray-500 hover:text-gray-300 transition-colors rounded hover:bg-gray-700/50"
            title="隐藏模型选择器"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 13l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-2">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => handleModelChange(model.id)}
              disabled={isChanging}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all text-sm ${
                currentModel === model.id
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
              } disabled:opacity-50`}
            >
              <div className="font-medium text-white mb-1">{model.name}</div>
              <div className="text-xs text-gray-400">{model.desc}</div>
            </button>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            由智谱AI提供支持
          </p>
        </div>
      </div>

      {/* Toggle Button - Now shows as a tab at the bottom */}
      <button
        onClick={toggleVisibility}
        className={`px-4 py-2 bg-gray-800/95 backdrop-blur-sm rounded-t-lg border border-gray-700
                   border-b-0 hover:border-gray-600 transition-all duration-300 shadow-lg
                   text-xs font-medium text-gray-400 hover:text-gray-300
                   ${isHidden ? 'translate-y-0' : '-translate-y-1'}`}
        title={isHidden ? "显示模型选择器" : "隐藏模型选择器"}
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${isHidden ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
          <span>{isHidden ? 'AI模型' : '收起'}</span>
        </div>
      </button>
    </div>
  );
}


