/**
 * 🧠 Quantum Engine - Provider Registry
 * 
 * Central registry for all LLM providers with automatic discovery,
 * environment-based configuration, and health monitoring.
 * 
 * Author: AppForge Swarm
 * License: MIT
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  BaseLLMProvider,
  LLMConfig,
  ProviderType,
  ProviderHealth,
  SmartProviderSelector,
  UsageTracker,
  TaskRequirements
} from './llm_provider_interface.js';

// Provider implementations
import { OpenAIProvider } from './openai_provider.js';
import { ClaudeProvider } from './claude_provider.js';
import { GeminiProvider } from './gemini_provider.js';
import { GrokProvider } from './grok_provider.js';
import { CodexProvider } from './codex_provider.js';
import { OllamaProvider } from './ollama_provider.js';
import { LlamaCppProvider } from './llamacpp_provider.js';
import { SyntheticProvider } from './synthetic_provider.js';

// ============================================================================
// Environment Configuration
// ============================================================================

interface EnvConfig {
  // OpenAI
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  
  // Anthropic Claude
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  
  // Google Gemini
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  
  // xAI Grok
  XAI_API_KEY?: string;
  XAI_MODEL?: string;
  
  // OpenAI Codex
  CODEX_API_KEY?: string;
  CODEX_MODEL?: string;
  
  // Local Models
  OLLAMA_HOST?: string;
  OLLAMA_MODEL?: string;
  LLAMACPP_HOST?: string;
  LLAMACPP_MODEL?: string;
  
  // Provider Preferences
  PRIMARY_PROVIDER?: ProviderType;
  FALLBACK_PROVIDER?: ProviderType;
  LOCAL_MODEL_THRESHOLD?: string;
}

// ============================================================================
// Provider Registry
// ============================================================================

export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers: Map<ProviderType, BaseLLMProvider> = new Map();
  private selector: SmartProviderSelector;
  private usageTracker: UsageTracker;
  private initialized: boolean = false;
  private envConfig: EnvConfig;

  private constructor() {
    this.selector = new SmartProviderSelector();
    this.usageTracker = UsageTracker.getInstance();
    this.envConfig = this.loadEnvConfig();
  }

  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  /**
   * Load environment configuration
   */
  private loadEnvConfig(): EnvConfig {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // Try multiple env file locations
    const envPaths = [
      path.resolve(__dirname, '../../../.env.local'),
      path.resolve(__dirname, '../../../.env'),
      path.resolve(__dirname, '../../../.env.production'),
    ];

    for (const envPath of envPaths) {
      try {
        const result = dotenv.config({ path: envPath });
        if (!result.error) {
          console.log(`[ProviderRegistry] Loaded env from: ${envPath}`);
          break;
        }
      } catch {
        // Continue to next path
      }
    }

    return {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o',
      
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
      ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
      
      XAI_API_KEY: process.env.XAI_API_KEY,
      XAI_MODEL: process.env.XAI_MODEL || 'grok-2',
      
      CODEX_API_KEY: process.env.CODEX_API_KEY,
      CODEX_MODEL: process.env.CODEX_MODEL || 'codex-1',
      
      OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://localhost:11434',
      OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3.2',
      
      LLAMACPP_HOST: process.env.LLAMACPP_HOST || 'http://localhost:8080',
      LLAMACPP_MODEL: process.env.LLAMACPP_MODEL || 'llama-2-7b',
      
      PRIMARY_PROVIDER: (process.env.PRIMARY_PROVIDER as ProviderType) || 'openai',
      FALLBACK_PROVIDER: (process.env.FALLBACK_PROVIDER as ProviderType) || 'ollama',
      LOCAL_MODEL_THRESHOLD: process.env.LOCAL_MODEL_THRESHOLD || '100',
    };
  }

  /**
   * Initialize all available providers
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('[ProviderRegistry] Already initialized');
      return;
    }

    console.log('[ProviderRegistry] Initializing providers...');
    
    // Initialize OpenAI
    if (this.envConfig.OPENAI_API_KEY) {
      try {
        const openai = new OpenAIProvider({
          provider: 'openai',
          model: this.envConfig.OPENAI_MODEL!,
          apiKey: this.envConfig.OPENAI_API_KEY,
        });
        await openai.initialize();
        this.register(openai);
        console.log('[ProviderRegistry] ✅ OpenAI registered');
      } catch (e: any) {
        console.warn(`[ProviderRegistry] OpenAI initialization failed: ${e.message}`);
      }
    }

    // Initialize Claude
    if (this.envConfig.ANTHROPIC_API_KEY) {
      try {
        const claude = new ClaudeProvider({
          provider: 'claude',
          model: this.envConfig.ANTHROPIC_MODEL!,
          apiKey: this.envConfig.ANTHROPIC_API_KEY,
        });
        await claude.initialize();
        this.register(claude);
        console.log('[ProviderRegistry] ✅ Claude registered');
      } catch (e: any) {
        console.warn(`[ProviderRegistry] Claude initialization failed: ${e.message}`);
      }
    }

    // Initialize Gemini
    if (this.envConfig.GEMINI_API_KEY) {
      try {
        const gemini = new GeminiProvider({
          provider: 'gemini',
          model: this.envConfig.GEMINI_MODEL!,
          apiKey: this.envConfig.GEMINI_API_KEY,
        });
        await gemini.initialize();
        this.register(gemini);
        console.log('[ProviderRegistry] ✅ Gemini registered');
      } catch (e: any) {
        console.warn(`[ProviderRegistry] Gemini initialization failed: ${e.message}`);
      }
    }

    // Initialize Grok
    if (this.envConfig.XAI_API_KEY) {
      try {
        const grok = new GrokProvider({
          provider: 'grok',
          model: this.envConfig.XAI_MODEL!,
          apiKey: this.envConfig.XAI_API_KEY,
        });
        await grok.initialize();
        this.register(grok);
        console.log('[ProviderRegistry] ✅ Grok registered');
      } catch (e: any) {
        console.warn(`[ProviderRegistry] Grok initialization failed: ${e.message}`);
      }
    }

    // Initialize Codex
    if (this.envConfig.CODEX_API_KEY) {
      try {
        const codex = new CodexProvider({
          provider: 'codex',
          model: this.envConfig.CODEX_MODEL!,
          apiKey: this.envConfig.CODEX_API_KEY,
        });
        await codex.initialize();
        this.register(codex);
        console.log('[ProviderRegistry] ✅ Codex registered');
      } catch (e: any) {
        console.warn(`[ProviderRegistry] Codex initialization failed: ${e.message}`);
      }
    }

    // Initialize Ollama (always available locally)
    try {
      const ollama = new OllamaProvider({
        provider: 'ollama',
        model: this.envConfig.OLLAMA_MODEL!,
        baseUrl: this.envConfig.OLLAMA_HOST,
      });
      await ollama.initialize();
      this.register(ollama);
      console.log('[ProviderRegistry] ✅ Ollama registered');
    } catch (e: any) {
      console.warn(`[ProviderRegistry] Ollama initialization failed: ${e.message}`);
      // Add synthetic provider as fallback
      const synthetic = new SyntheticProvider({
        provider: 'synthetic',
        model: 'synthetic-local-v1',
      });
      this.register(synthetic);
      console.log('[ProviderRegistry] ✅ Synthetic provider registered as Ollama fallback');
    }

    // Initialize LlamaCpp
    try {
      const llamacpp = new LlamaCppProvider({
        provider: 'llamacpp',
        model: this.envConfig.LLAMACPP_MODEL!,
        baseUrl: this.envConfig.LLAMACPP_HOST,
      });
      await llamacpp.initialize();
      this.register(llamacpp);
      console.log('[ProviderRegistry] ✅ LlamaCpp registered');
    } catch (e: any) {
      console.warn(`[ProviderRegistry] LlamaCpp initialization failed: ${e.message}`);
    }

    this.initialized = true;
    console.log(`[ProviderRegistry] ✅ Initialization complete. ${this.providers.size} providers available.`);
  }

  /**
   * Register a provider
   */
  register(provider: BaseLLMProvider): void {
    this.providers.set(provider.getProviderType(), provider);
    this.selector.register(provider);
    console.log(`[ProviderRegistry] Registered provider: ${provider.getProviderType()}`);
  }

  /**
   * Get provider by type
   */
  getProvider(type: ProviderType): BaseLLMProvider | undefined {
    return this.providers.get(type);
  }

  /**
   * Get primary provider
   */
  getPrimaryProvider(): BaseLLMProvider | undefined {
    return this.getProvider(this.envConfig.PRIMARY_PROVIDER);
  }

  /**
   * Get fallback provider
   */
  getFallbackProvider(): BaseLLMProvider | undefined {
    return this.getProvider(this.envConfig.FALLBACK_PROVIDER);
  }

  /**
   * Get best provider for task
   */
  getBestProvider(requirements: TaskRequirements): BaseLLMProvider {
    return this.selector.select(requirements);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): BaseLLMProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Check health of all providers
   */
  async checkHealth(): Promise<Map<ProviderType, ProviderHealth>> {
    const results = new Map<ProviderType, ProviderHealth>();
    
    for (const [type, provider] of this.providers) {
      try {
        const health = await provider.healthCheck();
        results.set(type, health);
      } catch (e: any) {
        results.set(type, {
          provider: type,
          status: 'down',
          latency: -1,
          error: e.message,
          lastChecked: new Date(),
        });
      }
    }
    
    return results;
  }

  /**
   * Generate response using best available provider
   */
  async generate(
    prompt: string, 
    requirements?: Partial<TaskRequirements>,
    options?: Partial<LLMConfig>
  ): Promise<ReturnType<BaseLLMProvider['generate']>> {
    const taskReq: TaskRequirements = {
      complexity: requirements?.complexity || 'medium',
      requiresVision: requirements?.requiresVision || false,
      requiresFunctionCalling: requirements?.requiresFunctionCalling || false,
      maxLatency: requirements?.maxLatency,
      maxCost: requirements?.maxCost,
      minContextWindow: requirements?.minContextWindow,
    };

    const provider = this.getBestProvider(taskReq);
    
    if (!provider) {
      throw new Error('[ProviderRegistry] No providers available');
    }

    const startTime = Date.now();
    const response = await provider.generate(prompt, options);
    response.latency = Date.now() - startTime;

    // Track usage
    this.usageTracker.record({
      provider: provider.getProviderType(),
      model: provider.getModelName(),
      promptTokens: response.usage.promptTokens,
      completionTokens: response.usage.completionTokens,
      totalTokens: response.usage.totalTokens,
      cost: provider.calculateCost(response.usage),
      timestamp: new Date(),
    });

    return response;
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): ReturnType<UsageTracker['getTotalUsage']> {
    return this.usageTracker.getTotalUsage();
  }

  /**
   * Clear usage data
   */
  clearUsage(): void {
    this.usageTracker.clear();
  }

  /**
   * Check if provider is available
   */
  isAvailable(type: ProviderType): boolean {
    return this.providers.has(type);
  }

  /**
   * Get provider count
   */
  getProviderCount(): number {
    return this.providers.size;
  }

  /**
   * Dispose all providers
   */
  dispose(): void {
    for (const [, provider] of this.providers) {
      provider.dispose();
    }
    this.providers.clear();
    this.initialized = false;
    console.log('[ProviderRegistry] All providers disposed');
  }
}

// ============================================================================
// Singleton Accessor
// ============================================================================

export function getProviderRegistry(): ProviderRegistry {
  return ProviderRegistry.getInstance();
}

// Initialize on import
ProviderRegistry.getInstance();
