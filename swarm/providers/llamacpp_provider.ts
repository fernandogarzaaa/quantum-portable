/**
 * 🧠 Quantum Engine - LlamaCpp Provider
 * 
 * Local inference via Llama.cpp HTTP server.
 * High-performance local model execution.
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
// LlamaCpp Provider
// ============================================================================

export class LlamaCppProvider extends BaseLLMProvider {
  private baseUrl: string;

  constructor(config: LLMConfig) {
    super({
      provider: 'llamacpp',
      model: config.model || 'llama-2-7b',
      baseUrl: config.baseUrl || 'http://localhost:8080',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2048,
      streaming: config.streaming ?? true,
      timeout: config.timeout ?? 180000, // Longer timeout for local inference
      ...config,
    });
    
    this.baseUrl = this.config.baseUrl!;
  }

  /**
   * Get LlamaCpp-specific capabilities
   */
  getCapabilities(): ProviderCapabilities {
    return {
      streaming: true,
      functionCalling: false,
      vision: false,
      jsonMode: true,
      systemPrompt: true,
      maxContextWindow: 8192,
      supportedModels: [
        'llama-2-7b',
        'llama-2-13b',
        'llama-2-70b',
        'llama-3-8b',
        'llama-3-70b',
        'mistral-7b',
        'codellama-7b',
        'qwen-7b',
      ],
      pricing: {
        inputPer1M: 0, // Local = free
        outputPer1M: 0,
      },
    };
  }

  /**
   * Initialize LlamaCpp connection
   */
  async initialize(): Promise<void> {
    try {
      console.log(`[LlamaCppProvider] Connecting to ${this.baseUrl}...`);
      
      // Check if server is running
      const response = await fetch(`${this.baseUrl}/models`);
      if (!response.ok) {
        throw new Error(`LlamaCpp server not responding: ${response.statusText}`);
      }
      
      console.log('[LlamaCppProvider] ✅ LlamaCpp server connected');
      console.log(`[LlamaCppProvider] Model: ${this.config.model}`);
    } catch (e: any) {
      console.warn(`[LlamaCppProvider] ⚠️ ${e.message}`);
      console.warn('[LlamaCppProvider] Start server: ./main --server --host 0.0.0.0 --port 8080');
      throw e;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        return {
          provider: 'llamacpp',
          status: 'healthy',
          latency: Date.now() - start,
          lastChecked: new Date(),
        };
      }

      return {
        provider: 'llamacpp',
        status: 'degraded',
        latency: Date.now() - start,
        error: response.statusText,
        lastChecked: new Date(),
      };
    } catch (e: any) {
      return {
        provider: 'llamacpp',
        status: 'down',
        latency: -1,
        error: e.message,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Generate response (OpenAI-compatible API)
   */
  async generate(prompt: string, options?: Partial<LLMConfig>): Promise<LLMResponse> {
    const start = Date.now();
    
    const requestBody = {
      model: this.config.model,
      prompt,
      temperature: options?.temperature ?? this.config.temperature,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      stream: false,
    };

    try {
      const response = await fetch(`${this.baseUrl}/completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout || 180000),
      });

      if (!response.ok) {
        throw new Error(`LlamaCpp API error: ${response.statusText}`);
      }

      const data = await response.json();
      const latency = Date.now() - start;

      return {
        content: data.content || '',
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        model: this.config.model,
        provider: 'llamacpp',
        latency,
      };
    } catch (e: any) {
      throw new Error(`[LlamaCppProvider] Generate failed: ${e.message}`);
    }
  }

  /**
   * Generate response (streaming)
   */
  async *generateStream(prompt: string, options?: Partial<LLMConfig>): Generator<StreamingChunk> {
    const requestBody = {
      model: this.config.model,
      prompt,
      temperature: options?.temperature ?? this.config.temperature,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      stream: true,
    };

    const response = await fetch(`${this.baseUrl}/completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      try {
        const data = JSON.parse(chunk);
        yield {
          content: data.content || '',
          done: data.stop || false,
        };
      } catch {
        // Skip invalid JSON
      }
    }
  }

  /**
   * Chat completion (OpenAI-compatible API)
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    // Llama.cpp server has OpenAI-compatible endpoint
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
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout || 180000),
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
        provider: 'llamacpp',
        latency: 0,
      };
    } catch (e: any) {
      // Fallback to basic completion
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      return this.generate(prompt, options);
    }
  }

  /**
   * Chat stream
   */
  async *chatStream(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: Partial<LLMConfig>
  ): Generator<StreamingChunk> {
    const requestBody = {
      model: this.config.model,
      messages: messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      temperature: options?.temperature ?? this.config.temperature,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      stream: true,
    };

    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    } catch (e: any) {
      // Fallback to basic stream
      yield* this.generateStream(messages[messages.length - 1]?.content || '', options);
    }
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
   * Dispose
   */
  dispose(): void {
    console.log('[LlamaCppProvider] Disposed');
  }
}

// ============================================================================
// Export
// ============================================================================

export { LlamaCppProvider };
