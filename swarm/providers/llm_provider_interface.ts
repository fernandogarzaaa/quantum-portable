/**
 * 🧠 Quantum Engine - LLM Provider Interface
 * 
 * Unified interface for multi-LLM support:
 * - Cloud: OpenAI, Claude, Gemini, Grok, Codex
 * - Local: Ollama, LlamaCpp, Synthetic
 * - Decentralized: Akash, Render
 * 
 * Author: AppForge Swarm
 * License: MIT
 */

import { Readable } from 'stream';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ProviderType = 
  | 'openai' 
  | 'claude' 
  | 'gemini' 
  | 'grok' 
  | 'codex' 
  | 'ollama' 
  | 'llamacpp' 
  | 'synthetic'
  | 'akash'
  | 'render';

export type ModelSize = 'small' | 'medium' | 'large' | 'xl';

export interface LLMConfig {
  provider: ProviderType;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  contextWindow?: number;
  streaming?: boolean;
  timeout?: number;
  retries?: number;
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: ProviderType;
  latency: number;
  metadata?: Record<string, any>;
}

export interface StreamingChunk {
  content: string;
  done: boolean;
  metadata?: Record<string, any>;
}

export interface ProviderCapabilities {
  streaming: boolean;
  functionCalling: boolean;
  vision: boolean;
  jsonMode: boolean;
  systemPrompt: boolean;
  maxContextWindow: number;
  supportedModels: string[];
  pricing: {
    inputPer1M: number;
    outputPer1M: number;
  };
}

export interface ProviderHealth {
  provider: ProviderType;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  error?: string;
  lastChecked: Date;
}

// ============================================================================
// Abstract Base Provider
// ============================================================================

export abstract class BaseLLMProvider {
  protected config: LLMConfig;
  protected capabilities: ProviderCapabilities;

  constructor(config: LLMConfig) {
    this.config = config;
    this.capabilities = this.getCapabilities();
  }

  /**
   * Get provider capabilities
   */
  abstract getCapabilities(): ProviderCapabilities;

  /**
   * Initialize provider connection
   */
  abstract initialize(): Promise<void>;

  /**
   * Health check
   */
  abstract healthCheck(): Promise<ProviderHealth>;

  /**
   * Generate response (non-streaming)
   */
  abstract generate(prompt: string, options?: Partial<LLMConfig>): Promise<LLMResponse>;

  /**
   * Generate response (streaming)
   */
  abstract *generateStream(prompt: string, options?: Partial<LLMConfig>): Generator<StreamingChunk>;

  /**
   * Chat completion
   */
  abstract chat(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>, options?: Partial<LLMConfig>): Promise<LLMResponse>;

  /**
   * Chat completion (streaming)
   */
  abstract *chatStream(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>, options?: Partial<LLMConfig>): Generator<StreamingChunk>;

  /**
   * Function calling
   */
  abstract callFunction(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    functions: Array<{ name: string; description: string; parameters: any }>,
    options?: Partial<LLMConfig>
  ): Promise<{ response: LLMResponse; functionCall?: { name: string; arguments: any } }>;

  /**
   * Get provider type
   */
  getProviderType(): ProviderType {
    return this.config.provider;
  }

  /**
   * Get model name
   */
  getModelName(): string {
    return this.config.model;
  }

  /**
   * Check if streaming is supported
   */
  supportsStreaming(): boolean {
    return this.capabilities.streaming;
  }

  /**
   * Check if function calling is supported
   */
  supportsFunctionCalling(): boolean {
    return this.capabilities.functionCalling;
  }

  /**
   * Calculate cost for response
   */
  calculateCost(usage: { promptTokens: number; completionTokens: number }): number {
    const { pricing } = this.capabilities;
    return (usage.promptTokens * pricing.inputPer1M) / 1e6 + 
           (usage.completionTokens * pricing.outputPer1M) / 1e6;
  }

  /**
   * Dispose provider resources
   */
  abstract dispose(): void;
}

// ============================================================================
// Provider Factory
// ============================================================================

export interface ProviderFactory {
  create(config: LLMConfig): BaseLLMProvider;
  getType(): ProviderType;
  getSupportedModels(): string[];
}

// ============================================================================
// Usage Tracker
// ============================================================================

export interface TokenUsage {
  provider: ProviderType;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: Date;
}

export class UsageTracker {
  private static instance: UsageTracker;
  private usage: TokenUsage[] = [];

  private constructor() {}

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  record(usage: TokenUsage): void {
    this.usage.push(usage);
  }

  getTotalUsage(): {
    totalTokens: number;
    totalCost: number;
    byProvider: Record<ProviderType, { tokens: number; cost: number }>;
  } {
    const byProvider: Record<ProviderType, { tokens: number; cost: number }> = {} as any;
    let totalTokens = 0;
    let totalCost = 0;

    for (const u of this.usage) {
      totalTokens += u.totalTokens;
      totalCost += u.cost;
      if (!byProvider[u.provider]) {
        byProvider[u.provider] = { tokens: 0, cost: 0 };
      }
      byProvider[u.provider].tokens += u.totalTokens;
      byProvider[u.provider].cost += u.cost;
    }

    return { totalTokens, totalCost, byProvider };
  }

  clear(): void {
    this.usage = [];
  }
}

// ============================================================================
// Provider Selector (SLM + LLM Strategy)
// ============================================================================

export type TaskComplexity = 'low' | 'medium' | 'high';

export interface TaskRequirements {
  complexity: TaskComplexity;
  requiresVision: boolean;
  requiresFunctionCalling: boolean;
  maxLatency?: number;
  maxCost?: number;
  minContextWindow?: number;
}

export class SmartProviderSelector {
  private providers: Map<ProviderType, BaseLLMProvider> = new Map();
  private localThreshold: number = 100; // Cost threshold for local model

  /**
   * Register provider
   */
  register(provider: BaseLLMProvider): void {
    this.providers.set(provider.getProviderType(), provider);
  }

  /**
   * Select optimal provider based on task requirements
   */
  select(requirements: TaskRequirements): BaseLLMProvider {
    // Low complexity → Use local models (SLM strategy)
    if (requirements.complexity === 'low') {
      const localProviders = ['ollama', 'llamacpp', 'synthetic'];
      for (const type of localProviders) {
        const provider = this.providers.get(type as ProviderType);
        if (provider) {
          console.log(`[ProviderSelector] Using local model ${provider.getModelName()} for low-complexity task`);
          return provider;
        }
      }
    }

    // High complexity → Use best cloud model
    if (requirements.complexity === 'high') {
      const cloudProviders = ['claude', 'grok', 'gemini', 'openai'];
      for (const type of cloudProviders) {
        const provider = this.providers.get(type as ProviderType);
        if (provider) {
          console.log(`[ProviderSelector] Using cloud model ${provider.getModelName()} for high-complexity task`);
          return provider;
        }
      }
    }

    // Medium complexity → Check cost constraints
    if (requirements.maxCost !== undefined && requirements.maxCost < this.localThreshold) {
      const provider = this.providers.get('ollama');
      if (provider) return provider;
    }

    // Default to best available
    for (const [, provider] of this.providers) {
      if (provider.supportsFunctionCalling() === requirements.requiresFunctionCalling) {
        return provider;
      }
    }

    // Fallback to first available
    return this.providers.values().next().value;
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): BaseLLMProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Check provider health
   */
  async checkAllHealth(): Promise<ProviderHealth[]> {
    const results: ProviderHealth[] = [];
    for (const [, provider] of this.providers) {
      results.push(await provider.healthCheck());
    }
    return results;
  }
}

// ============================================================================
// Export
// ============================================================================

export {
  BaseLLMProvider,
  ProviderFactory,
  UsageTracker,
  SmartProviderSelector
};
