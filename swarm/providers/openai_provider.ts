/**
 * 🧠 Quantum Engine - OpenAI Provider
 * 
 * OpenAI GPT API integration for general-purpose
 * reasoning and generation tasks.
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
// OpenAI Provider
// ============================================================================

export class OpenAIProvider extends BaseLLMProvider {
  private apiVersion: string = '2024-12-01-preview';

  constructor(config: LLMConfig) {
    super({
      provider: 'openai',
      model: config.model || 'gpt-4o',
      baseUrl: config.baseUrl || 'https://api.openai.com/v1',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      streaming: config.streaming ?? true,
      timeout: config.timeout ?? 60000,
      retries: config.retries ?? 3,
      ...config,
    });
  }

  /**
   * Get OpenAI-specific capabilities
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
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
      ],
      pricing: {
        inputPer1M: 2.5, // GPT-4o pricing
        outputPer1M: 10,
      },
    };
  }

  /**
   * Get context window for model
   */
  private getContextWindow(model: string): number {
    const contextSizes: Record<string, number> = {
      'gpt-4o': 128000,
      'gpt-4o-mini': 128000,
      'gpt-4-turbo': 128000,
      'gpt-4': 8192,
      'gpt-3.5-turbo': 16385,
    };
    return contextSizes[model] || 128000;
  }

  /**
   * Initialize OpenAI connection
   */
  async initialize(): Promise<void> {
    try {
      console.log(`[OpenAIProvider] Initializing with model: ${this.config.model}`);
      
      if (!this.config.apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      await this.healthCheck();
      console.log('[OpenAIProvider] ✅ OpenAI provider ready');
    } catch (e: any) {
      console.warn(`[OpenAIProvider] ⚠️ ${e.message}`);
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
          provider: 'openai',
          status: 'healthy',
          latency: Date.now() - start,
          lastChecked: new Date(),
        };
      }

      return {
        provider: 'openai',
        status: 'degraded',
        latency: Date.now() - start,
        error: response.statusText,
        lastChecked: new Date(),
      };
    } catch (e: any) {
      return {
        provider: 'openai',
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
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'api-key': this.config.apiKey,
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
        provider: 'openai',
        latency,
      };
    } catch (e: any) {
      throw new Error(`[OpenAIProvider] Generate failed: ${e.message}`);
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

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
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
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'api-key': this.config.apiKey,
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
        provider: 'openai',
        latency: Date.now() - start,
      };
    } catch (e: any) {
      throw new Error(`[OpenAIProvider] Chat failed: ${e.message}`);
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
    const requestBody = {
      model: this.config.model,
      messages: messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      tools: functions.map(f => ({
        type: 'function',
        function: {
          name: f.name,
          description: f.description,
          parameters: f.parameters,
        },
      })),
      temperature: options?.temperature ?? this.config.temperature,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
    };

    const response = await this.chat(messages, options);
    
    // Check for tool calls in response
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
    console.log('[OpenAIProvider] Disposed');
  }
}

// ============================================================================
// Export
// ============================================================================

export { OpenAIProvider };
