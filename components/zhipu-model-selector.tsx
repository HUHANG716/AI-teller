'use client';

import { useState, useEffect } from 'react';
import { ZhipuModel, ZHIPU_MODELS } from '@/lib/ai-service';

export default function ZhipuModelSelector() {
  const [currentModel, setCurrentModel] = useState<ZhipuModel>('glm-4');
  const [isChanging, setIsChanging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 从 localStorage 读取模型偏好
    const saved = localStorage.getItem('ai-teller-zhipu-model');
    if (saved && saved in ZHIPU_MODELS) {
      setCurrentModel(saved as ZhipuModel);
    }
  }, []);

  const handleModelChange = async (modelId: ZhipuModel) => {
    setIsChanging(true);
    
    // 保存到 localStorage
    localStorage.setItem('ai-teller-zhipu-model', modelId);
    setCurrentModel(modelId);
    
    // 通知用户
    setTimeout(() => {
      setIsChanging(false);
      setIsOpen(false);
    }, 300);
  };

  const currentModelInfo = ZHIPU_MODELS[currentModel];

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* 浮动按钮 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 
                   hover:to-purple-500 text-white px-4 py-3 rounded-xl shadow-2xl 
                   transition-all transform hover:scale-105 flex items-center gap-2"
        >
          <span className="text-lg">🤖</span>
          <div className="text-left">
            <div className="text-xs opacity-80">AI 模型</div>
            <div className="text-sm font-medium">{currentModelInfo.name}</div>
          </div>
        </button>
      )}

      {/* 展开的面板 */}
      {isOpen && (
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-700 
                      shadow-2xl p-4 max-w-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span className="text-sm font-medium text-gray-400">智谱 AI 模型</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            {(Object.keys(ZHIPU_MODELS) as ZhipuModel[]).map((modelId) => {
              const model = ZHIPU_MODELS[modelId];
              const isSelected = currentModel === modelId;
              const isThinking = model.thinking;
              
              return (
                <button
                  key={modelId}
                  onClick={() => handleModelChange(modelId)}
                  disabled={isChanging}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all text-sm ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-white">{model.name}</div>
                    {isThinking && (
                      <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded">
                        🧠 思考模式
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{model.desc}</div>
                  {isThinking && (
                    <div className="text-xs text-purple-400 mt-1">
                      ⚡ 响应时间较长，推理能力更强
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              💡 模型切换即时生效，下次生成时使用
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

