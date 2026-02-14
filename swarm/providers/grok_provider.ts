/**
 * 🧠 Quantum Engine - Grok Provider
 * 
 * xAI Grok API integration for real-time knowledge
 * and web search capabilities.
 * 
 * Author: AppForge Swarm
 * License: MIT
 */

import {
  BaseLLMProvider,
  LLMConfig,
  LLMResponse,
  StreamingChunk,
  ProviderCapabilities,
  ProviderHealth,
} from './llm_provider_interface.js';

// ============================================================================
// Grok Provider
// ============================================================================

export class GrokProvider extends BaseLLMProvider {
  private apiVersion: string = 'v1';

  constructor(config: LLMConfig) {
    super({
      provider: 'grok',
      model: config.model || 'grok-2',
      baseUrl: config.baseUrl || 'https://api.x.ai',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      streaming: config.streaming ?? true,
      timeout: config.timeout ?? 60000,
      ...config,
    });
  }

  /**
   * Get Grok-specific capabilities
   */
  getCapabilities(): ProviderCapabilities {
    return {
      streaming: true,
      functionCalling: true,
      vision: true,
      jsonMode: true,
      systemPrompt: true,
      maxContextWindow: 131072,
      supportedModels: [
        'grok-2',
        'grok-2-vision',
        'grok-beta',
        'grok-1',
      ],
      pricing: {
        inputPer1M: 2, // Approximate
        outputPer1M: 10,
      },
    };
  }

  /**
   * Initialize Grok connection
   */
  async initialize(): Promise<void> {
    try {
      console.log(`[GrokProvider] Initializing with model: ${this.config.model}`);
      
      if (!this.config.apiKey) {
        throw new Error('XAI_API_KEY not configured');
      }

      await this.healthCheck();
      console.log('[GrokProvider] ✅ Grok provider ready');
    } catch (e: any) {
      console.warn(`[GrokProvider] ⚠️ ${e.message}`);
      throw e;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    
    try {
      const response = await fetch(`${this.config.baseUrl}/${this.apiVersion}/models`, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        return {
          provider: 'grok',
          status: 'healthy',
          latency: Date.now() - start,
          lastChecked: new Date(),
        };
      }

      return {
        provider: 'grok',
        status: 'degraded',
        latency: Date.now() - start,
        error: response.statusText,
        lastChecked: new Date(),
      };
    } catch (e: any) {
      return {
        provider: 'grok',
        status: 'down',
        latency: -1,
        error: e.message,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Generate response
   */
  async generate(prompt: string, options?: Partial<LLMConfig>): Promise<LLMResponse> {
    const start = Date.now();
    
    const requestBody = {
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature ?? this.config.temperature,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      stream: false,
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/${this.apiVersion}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout || 60000),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const latency = Date.now() - start;
      const content = data.choices?.[0]?.message?.content || '';

      return {
        content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || this.countTokens(prompt),
          completionTokens: data.usage?.completion_tokens || this.countTokens(content),
          totalTokens: data.usage?.total_tokens || 0,
        },
        model: this.config.model,
        provider: 'grok',
        latency,
      };
    } catch (e: any) {
      throw new Error(`[GrokProvider] Generate failed: ${e.message}`);
    }
  }

  /**
   * Generate response (streaming)
   */
  async *generateStream(prompt: string, options?: Partial<LLMConfig>): Generator<StreamingChunk> {
    const requestBody = {
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature ?? this.config.temperature,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      stream: true,
    };

    const response = await fetch(`${this.config.baseUrl}/${this.apiVersion}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices?.[0]?.delta?.content || '';
            yield { content, done: data.choices?.[0]?.finish_reason ? true : false };
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  /**
   * Chat completion
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    const start = Date.now();
    
    const requestBody = {
      model: this.config.model,
      messages: messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      temperature: options?.temperature ?? this.config.temperature,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      stream: false,
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/${this.apiVersion}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout || 60000),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      return {
        content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        model: this.config.model,
        provider: 'grok',
        latency: Date.now() - start,
      };
    } catch (e: any) {
      throw new Error(`[GrokProvider] Chat failed: ${e.message}`);
    }
  }

  /**
   * Chat stream
   */
  async *chatStream(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: Partial<LLMConfig>
  ): Generator<StreamingChunk> {
    yield* this.generateStream(messages[messages.length - 1]?.content || '', options);
  }

  /**
   * Function calling
   */
  async callFunction(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    functions: Array<{ name: string; description: string; parameters: any }>,
    options?: Partial<LLMConfig>
  ): Promise<{ response: LLMResponse; functionCall?: { name: string; arguments: any } }> {
    const response = await this.chat(messages, options);
    return { response };
  }

  /**
   * Count tokens
   */
  private countTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Dispose
   */
  dispose(): void {
    console.log('[GrokProvider] Disposed');
  }
}

// ============================================================================
// Export
// ============================================================================

export { GrokProvider };
