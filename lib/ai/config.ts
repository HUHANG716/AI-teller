import { z } from 'zod';
import type { ProviderType } from './types';
import { MODELS, type ModelInfo } from '@/lib/models';

// Environment variable schema
export const EnvConfigSchema = z.object({
  AI_MODEL_PROVIDER: z.enum(['zhipu']).optional(),
  AI_MODEL: z.string().optional(),
  ZHIPU_API_KEY: z.string().optional(),
});

// Provider configuration schema
export const ProviderConfigSchema = z.object({
  type: z.enum(['zhipu']),
  apiKey: z.string().optional(),
  secretKey: z.string().optional(),
  baseURL: z.string().url().optional(),
  timeout: z.number().min(1000).max(60000).default(30000),
  maxRetries: z.number().min(0).max(10).default(3),
});

// Model configuration schema
export const ModelConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  maxTokens: z.number().positive(),
  supportsStreaming: z.boolean().default(false),
  temperature: z.number().min(0).max(2).default(0.8),
});

// Export types
export type EnvConfig = z.infer<typeof EnvConfigSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
// Re-export ModelInfo from shared module
export type ModelConfig = ModelInfo;

// Get and validate environment configuration
export function getEnvConfig(): EnvConfig {
  const config = {
    AI_MODEL_PROVIDER: process.env.AI_MODEL_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    ZHIPU_API_KEY: process.env.ZHIPU_API_KEY,
  };

  return EnvConfigSchema.parse(config);
}

// Provider configurations
export const PROVIDER_CONFIGS = {
  zhipu: {
    type: 'zhipu' as const,
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    timeout: 30000,
    maxRetries: 3,
  },
};

// Model configurations - now imported from shared module
export const MODEL_CONFIGS = MODELS;

// Get provider configuration
export function getProviderConfig(type: ProviderType): ProviderConfig {
  const config = PROVIDER_CONFIGS[type];
  const envConfig = getEnvConfig();

  // Add API keys from environment
  switch (type) {
    case 'zhipu':
      return { ...config, apiKey: envConfig.ZHIPU_API_KEY };
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}

// Check if provider is configured
export function isProviderConfigured(type: ProviderType): boolean {
  const config = getProviderConfig(type);
  return !!config.apiKey;
}

// Get available providers
export function getAvailableProviders(): ProviderType[] {
  const envConfig = getEnvConfig();
  const providers: ProviderType[] = [];

  if (envConfig.ZHIPU_API_KEY) providers.push('zhipu');

  return providers;
}