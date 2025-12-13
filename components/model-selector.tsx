'use client';

import { useState, useEffect } from 'react';

const MODELS = [
  { id: 'deepseek-v3', name: 'DeepSeek V3', desc: '强大的推理能力，适合复杂剧情' },
  { id: 'qwen-2.5-7b', name: 'Qwen 2.5 7B', desc: '快速响应，中文优化' },
];

export default function ModelSelector() {
  const [currentModel, setCurrentModel] = useState<string>('deepseek-v3');
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    // 从 localStorage 读取模型偏好
    const saved = localStorage.getItem('ai-teller-model');
    if (saved) {
      setCurrentModel(saved);
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

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-700 
                    shadow-2xl p-4 max-w-xs">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-gray-400">AI 模型</span>
          <div className="flex-1 h-px bg-gray-700" />
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
            由 OpenRouter 提供支持
          </p>
        </div>
      </div>
    </div>
  );
}


