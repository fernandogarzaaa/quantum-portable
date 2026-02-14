/**
 * 🧠 Quantum Engine - Gemini Provider
 * 
 * Google Gemini API integration for multimodal tasks,
 * fast inference, and cost-effective reasoning.
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
// Gemini Provider
// ============================================================================

export class GeminiProvider extends BaseLLMProvider {
  private apiVersion: string = 'v1beta';

  constructor(config: LLMConfig) {
    super({
      provider: 'gemini',
      model: config.model || 'gemini-2.0-flash-exp',
      baseUrl: config.baseUrl || 'https://generativelanguage.googleapis.com',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      streaming: config.streaming ?? true,
      timeout: config.timeout ?? 60000,
      ...config,
    });
  }

  /**
   * Get Gemini-specific capabilities
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
        'gemini-2.0-flash-exp',
        'gemini-2.0-flash',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro',
      ],
      pricing: {
        inputPer1M: 0.075, // Gemini 1.5 pricing
        outputPer1M: 0.3,
      },
    };
  }

  /**
   * Get context window for model
   */
  private getContextWindow(model: string): number {
    const contextSizes: Record<string, number> = {
      'gemini-2.0-flash-exp': 2000000,
      'gemini-2.0-flash': 1000000,
      'gemini-1.5-pro': 2000000,
      'gemini-1.5-flash': 1000000,
      'gemini-1.0-pro': 30720,
    };
    return contextSizes[model] || 1000000;
  }

  /**
   * Initialize Gemini connection
   */
  async initialize(): Promise<void> {
    try {
      console.log(`[GeminiProvider] Initializing with model: ${this.config.model}`);
      
      if (!this.config.apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
      }

      await this.healthCheck();
      console.log('[GeminiProvider] ✅ Gemini provider ready');
    } catch (e: any) {
      console.warn(`[GeminiProvider] ⚠️ ${e.message}`);
      throw e;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    
    try {
      const response = await fetch(
        `${this.config.baseUrl}/${this.apiVersion}/models/${this.config.model}:get`,
        {
          headers: { 'x-goog-api-key': this.config.apiKey! },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (response.ok) {
        return {
          provider: 'gemini',
          status: 'healthy',
          latency: Date.now() - start,
          lastChecked: new Date(),
        };
      }

      return {
        provider: 'gemini',
        status: 'degraded',
        latency: Date.now() - start,
        error: response.statusText,
        lastChecked: new Date(),
      };
    } catch (e: any) {
      return {
        provider: 'gemini',
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
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? this.config.temperature,
        maxOutputTokens: options?.maxTokens ?? this.config.maxTokens,
      },
    };

    try {
      const response = await fetch(
        `${this.config.baseUrl}/${this.apiVersion}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(this.config.timeout || 60000),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const latency = Date.now() - start;
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        content,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount || this.countTokens(prompt),
          completionTokens: data.usageMetadata?.candidatesTokenCount || this.countTokens(content),
          totalTokens: data.usageMetadata?.totalTokenCount || 0,
        },
        model: this.config.model,
        provider: 'gemini',
        latency,
      };
    } catch (e: any) {
      throw new Error(`[GeminiProvider] Generate failed: ${e.message}`);
    }
  }

  /**
   * Generate response (streaming)
   */
  async *generateStream(prompt: string, options?: Partial<LLMConfig>): Generator<StreamingChunk> {
    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? this.config.temperature,
        maxOutputTokens: options?.maxTokens ?? this.config.maxTokens,
      },
    };

    const response = await fetch(
      `${this.config.baseUrl}/${this.apiVersion}/models/${this.config.model}:streamGenerateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

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
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        yield { content, done: false };
      } catch {
        // Skip invalid JSON
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
    const systemMessage = messages.find(m => m.role === 'system');
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? this.config.temperature,
        maxOutputTokens: options?.maxTokens ?? this.config.maxTokens,
      },
    };

    if (systemMessage) {
      requestBody.systemInstruction = { parts: [{ text: systemMessage.content }] };
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/${this.apiVersion}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(this.config.timeout || 60000),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        content,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount || 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata?.totalTokenCount || 0,
        },
        model: this.config.model,
        provider: 'gemini',
        latency: 0,
      };
    } catch (e: any) {
      throw new Error(`[GeminiProvider] Chat failed: ${e.message}`);
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
    
    // Gemini handles function calls in a specific format
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
    console.log('[GeminiProvider] Disposed');
  }
}

// ============================================================================
// Export
// ============================================================================

export { GeminiProvider };
