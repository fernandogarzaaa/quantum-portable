/**
 * 🧠 Quantum Engine - Claude Provider
 * 
 * Anthropic Claude API integration for complex reasoning,
 * code generation, and extended context tasks.
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
// Claude Provider
// ============================================================================

export class ClaudeProvider extends BaseLLMProvider {
  private apiVersion: string = '2023-06-01';

  constructor(config: LLMConfig) {
    super({
      provider: 'claude',
      model: config.model || 'claude-sonnet-4-20250514',
      baseUrl: config.baseUrl || 'https://api.anthropic.com',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      streaming: config.streaming ?? true,
      timeout: config.timeout ?? 60000,
      retries: config.retries ?? 3,
      ...config,
    });
  }

  /**
   * Get Claude-specific capabilities
   */
  getCapabilities(): ProviderCapabilities {
    return {
      streaming: true,
      functionCalling: true,
      vision: true,
      jsonMode: true,
      systemPrompt: true,
      maxContextWindow: this.getContextWindow(this.config.model),
      supportedModels: [
        'claude-sonnet-4-20250514',
        'claude-opus-4-20250514',
        'claude-haiku-3-20250514',
        'claude-3-5-sonnet-20241022',
        'claude-3-opus-20240229',
        'claude-3-haiku-20240307',
      ],
      pricing: {
        inputPer1M: 3, // Claude 4 pricing (approximate)
        outputPer1M: 15,
      },
    };
  }

  /**
   * Get context window for model
   */
  private getContextWindow(model: string): number {
    const contextSizes: Record<string, number> = {
      'claude-sonnet-4-20250514': 200000,
      'claude-opus-4-20250514': 200000,
      'claude-haiku-3-20250514': 200000,
      'claude-3-5-sonnet-20241022': 200000,
      'claude-3-opus-20240229': 200000,
      'claude-3-haiku-20240307': 200000,
    };
    return contextSizes[model] || 100000;
  }

  /**
   * Initialize Claude connection
   */
  async initialize(): Promise<void> {
    try {
      console.log(`[ClaudeProvider] Initializing with model: ${this.config.model}`);
      
      // Validate API key
      if (!this.config.apiKey) {
        throw new Error('ANTHROPIC_API_KEY not configured');
      }

      // Quick health check
      await this.healthCheck();
      
      console.log('[ClaudeProvider] ✅ Claude provider ready');
    } catch (e: any) {
      console.warn(`[ClaudeProvider] ⚠️ ${e.message}`);
      throw e;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
        method: 'GET',
        headers: {
          'x-api-key': this.config.apiKey!,
          'anthropic-version': this.apiVersion,
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok || response.status === 401) {
        return {
          provider: 'claude',
          status: 'healthy',
          latency: Date.now() - start,
          lastChecked: new Date(),
        };
      }

      return {
        provider: 'claude',
        status: 'degraded',
        latency: Date.now() - start,
        error: response.statusText,
        lastChecked: new Date(),
      };
    } catch (e: any) {
      return {
        provider: 'claude',
        status: 'down',
        latency: -1,
        error: e.message,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Generate response (non-streaming)
   */
  async generate(prompt: string, options?: Partial<LLMConfig>): Promise<LLMResponse> {
    const start = Date.now();
    
    const requestBody = {
      model: this.config.model,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      temperature: options?.temperature ?? this.config.temperature,
      prompt,
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/v1/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey!,
          'anthropic-version': this.apiVersion,
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

      return {
        content: data.completion,
        usage: {
          promptTokens: data.prompt_tokens || this.countTokens(prompt),
          completionTokens: data.completion_tokens || this.countTokens(data.completion),
          totalTokens: (data.prompt_tokens || 0) + (data.completion_tokens || 0),
        },
        model: this.config.model,
        provider: 'claude',
        latency,
      };
    } catch (e: any) {
      throw new Error(`[ClaudeProvider] Generate failed: ${e.message}`);
    }
  }

  /**
   * Generate response (streaming)
   */
  async *generateStream(prompt: string, options?: Partial<LLMConfig>): Generator<StreamingChunk> {
    const requestBody = {
      model: this.config.model,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      temperature: options?.temperature ?? this.config.temperature,
      prompt,
      stream: true,
    };

    const response = await fetch(`${this.config.baseUrl}/v1/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey!,
        'anthropic-version': this.apiVersion,
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
            yield {
              content: data.completion || '',
              done: data.stop || false,
            };
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  /**
   * Chat completion (Claude Messages API)
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    const start = Date.now();
    
    // Convert messages to Claude format
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    const requestBody: any = {
      model: this.config.model,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      temperature: options?.temperature ?? this.config.temperature,
      messages: conversationMessages,
    };

    if (systemMessage) {
      requestBody.system = systemMessage.content;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey!,
          'anthropic-version': this.apiVersion,
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

      return {
        content: data.content[0]?.text || '',
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
        model: this.config.model,
        provider: 'claude',
        latency,
      };
    } catch (e: any) {
      throw new Error(`[ClaudeProvider] Chat failed: ${e.message}`);
    }
  }

  /**
   * Chat completion (streaming)
   */
  async *chatStream(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: Partial<LLMConfig>
  ): Generator<StreamingChunk> {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    const requestBody: any = {
      model: this.config.model,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      temperature: options?.temperature ?? this.config.temperature,
      messages: conversationMessages,
      stream: true,
    };

    if (systemMessage) {
      requestBody.system = systemMessage.content;
    }

    const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey!,
        'anthropic-version': this.apiVersion,
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
            const content = data.content?.[0]?.delta?.text || '';
            yield {
              content,
              done: data.stop_sequence ? true : false,
            };
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  /**
   * Function calling (Claude Tools)
   */
  async callFunction(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    functions: Array<{ name: string; description: string; parameters: any }>,
    options?: Partial<LLMConfig>
  ): Promise<{ response: LLMResponse; functionCall?: { name: string; arguments: any } }> {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const requestBody: any = {
      model: this.config.model,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      temperature: options?.temperature ?? this.config.temperature,
      messages: conversationMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      tools: functions.map(f => ({
        name: f.name,
        description: f.description,
        input_schema: f.parameters,
      })),
    };

    if (systemMessage) {
      requestBody.system = systemMessage.content;
    }

    const response = await this.chat(messages, options);
    
    // Claude handles tool calls in the response
    return { response };
  }

  /**
   * Count tokens (rough approximation)
   */
  private countTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Dispose
   */
  dispose(): void {
    console.log('[ClaudeProvider] Disposed');
  }
}

// ============================================================================
// Export
// ============================================================================

export { ClaudeProvider };
