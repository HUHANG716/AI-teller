// Unified model configuration for both frontend and backend

export interface ModelInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  maxTokens: number;
  supportsStreaming: boolean;
  temperature: number;
  provider: 'zhipu' | 'mock';
  // Additional metadata for future use
  contextWindow?: string; // e.g., "200K", "128K"
  capabilities?: string[]; // e.g., ['thinking', 'analysis']
}

export const MODELS: Record<string, ModelInfo> = {
  'glm-4.6': {
    id: 'glm-4.6',
    name: 'GLM-4.6',
    displayName: 'GLM-4.6',
    description: '智谱旗舰模型，200K上下文',
    maxTokens: 4000,
    supportsStreaming: false,
    temperature: 0.8,
    provider: 'zhipu',
    contextWindow: '200K',
  },
  'glm-4.5-x': {
    id: 'glm-4.5-x',
    name: 'GLM-4.5-x',
    displayName: 'GLM-4.5-x',
    description: '智谱增强版，128K上下文',
    maxTokens: 4000,
    supportsStreaming: false,
    temperature: 0.8,
    provider: 'zhipu',
    contextWindow: '128K',
    capabilities: ['thinking'],
  },
};

// Helper functions
export function getModel(id: string): ModelInfo | undefined {
  return MODELS[id];
}

export function getModelsByProvider(provider: 'zhipu' | 'mock'): ModelInfo[] {
  return Object.values(MODELS).filter(model => model.provider === provider);
}

export function getAllModels(): ModelInfo[] {
  return Object.values(MODELS);
}

export function getDefaultModel(): string {
  return 'glm-4.6';
}

export function getModelsForUI(): Array<{ id: string; name: string; desc: string }> {
  return Object.values(MODELS).map(model => ({
    id: model.id,
    name: model.displayName,
    desc: model.description,
  }));
}