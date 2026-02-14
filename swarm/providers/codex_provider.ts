/**
 * 🧠 Quantum Engine - Codex Provider
 * 
 * OpenAI Codex API for code-specific tasks.
 * Optimized for code generation and understanding.
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
// Codex Provider
// ============================================================================

export class CodexProvider extends BaseLLMProvider {
  private apiVersion: string = '2024-05-01';

  constructor(config: LLMConfig) {
    super({
      provider: 'codex',
      model: config.model || 'codex-1',
      baseUrl: config.baseUrl || 'https://api.openai.com/v1',
      temperature: config.temperature ?? 0.0, // Code tasks need low temperature
      maxTokens: config.maxTokens ?? 4000,
      streaming: config.streaming ?? true,
      timeout: config.timeout ?? 90000, // Longer timeout for code
      ...config,
    });
  }

  /**
   * Get Codex-specific capabilities
   */
  getCapabilities(): ProviderCapabilities {
    return {
      streaming: true,
      functionCalling: false, // Codex focuses on code
      vision: false,
      jsonMode: true,
      systemPrompt: true,
      maxContextWindow: 128000,
      supportedModels: [
        'codex-1',
        'gpt-4-codex', // Legacy support
      ],
      pricing: {
        inputPer1M: 10, // Codex is expensive
        outputPer1M: 30,
      },
    };
  }

  /**
   * Initialize Codex connection
   */
  async initialize(): Promise<void> {
    try {
      console.log(`[CodexProvider] Initializing with model: ${this.config.model}`);
      
      if (!this.config.apiKey) {
        throw new Error('CODEX_API_KEY not configured');
      }

      await this.healthCheck();
      console.log('[CodexProvider] ✅ Codex provider ready');
    } catch (e: any) {
      console.warn(`[CodexProvider] ⚠️ ${e.message}`);
      throw e;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        return {
          provider: 'codex',
          status: 'healthy',
          latency: Date.now() - start,
          lastChecked: new Date(),
        };
      }

      return {
        provider: 'codex',
        status: 'degraded',
        latency: Date.now() - start,
        error: response.statusText,
        lastChecked: new Date(),
      };
    } catch (e: any) {
      return {
        provider: 'codex',
        status: 'down',
        latency: -1,
        error: e.message,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Generate code response
   */
  async generate(prompt: string, options?: Partial<LLMConfig>): Promise<LLMResponse> {
    const start = Date.now();
    
    const requestBody = {
      model: this.config.model,
      prompt,
      temperature: options?.temperature ?? this.config.temperature,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/engines/${this.config.model}/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'api-key': this.config.apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout || 90000),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const latency = Date.now() - start;
      const content = data.choices?.[0]?.text || '';

      return {
        content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || this.countTokens(prompt),
          completionTokens: data.usage?.completion_tokens || this.countTokens(content),
          totalTokens: data.usage?.total_tokens || 0,
        },
        model: this.config.model,
        provider: 'codex',
        latency,
      };
    } catch (e: any) {
      throw new Error(`[CodexProvider] Generate failed: ${e.message}`);
    }
  }

  /**
   * Generate code (streaming)
   */
  async *generateStream(prompt: string, options?: Partial<LLMConfig>): Generator<StreamingChunk> {
    const requestBody = {
      model: this.config.model,
      prompt,
      temperature: options?.temperature ?? this.config.temperature,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      stream: true,
    };

    const response = await fetch(`${this.config.baseUrl}/engines/${this.config.model}/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'api-key': this.config.apiKey,
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
            const content = data.choices?.[0]?.text || '';
            yield { content, done: data.choices?.[0]?.finish_reason ? true : false };
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  /**
   * Chat completion (Codex doesn't have chat, use generate)
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversation = messages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = systemMessage 
      ? `${systemMessage.content}\n\n${conversation}`
      : conversation;

    return this.generate(prompt, options);
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
   * Function calling (not supported)
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
    console.log('[CodexProvider] Disposed');
  }
}

// ============================================================================
// Export
// ============================================================================

export { CodexProvider };
