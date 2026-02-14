/**
 * 🧠 Quantum Engine - Ollama Provider
 * 
 * Local LLM provider for Ollama server.
 * Supports Phi-4, Llama 3.2, Mistral, and other Ollama models.
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
// Ollama Provider
// ============================================================================

export class OllamaProvider extends BaseLLMProvider {
  private baseUrl: string;
  private availableModels: Set<string> = new Set();

  constructor(config: LLMConfig) {
    super({
      provider: 'ollama',
      model: config.model || 'llama3.2',
      baseUrl: config.baseUrl || 'http://localhost:11434',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      streaming: config.streaming ?? true,
      timeout: config.timeout ?? 120000,
      ...config,
    });
    
    this.baseUrl = this.config.baseUrl!;
  }

  /**
   * Get Ollama-specific capabilities
   */
  getCapabilities(): ProviderCapabilities {
    return {
      streaming: true,
      functionCalling: false, // Ollama supports tools in newer versions
      vision: this.config.model.includes('vision') || this.config.model.includes('llava'),
      jsonMode: true,
      systemPrompt: true,
      maxContextWindow: this.getContextWindow(this.config.model),
      supportedModels: [
        'llama3.2',
        'llama3.1',
        'llama3',
        'phi4',
        'mistral',
        'codellama',
        'deepseek-coder',
        'neural-chat',
        'starcoder',
        'qwen2.5-coder',
      ],
      pricing: {
        inputPer1M: 0, // Local = free
        outputPer1M: 0,
      },
    };
  }

  /**
   * Get context window size for model
   */
  private getContextWindow(model: string): number {
    const contextSizes: Record<string, number> = {
      'llama3.2': 131072,
      'llama3.1': 131072,
      'llama3': 8192,
      'phi4': 8192,
      'mistral': 32768,
      'codellama': 16384,
      'deepseek-coder': 16384,
      'qwen2.5-coder': 131072,
    };
    return contextSizes[model] || 8192;
  }

  /**
   * Initialize Ollama connection
   */
  async initialize(): Promise<void> {
    try {
      console.log(`[OllamaProvider] Connecting to ${this.baseUrl}...`);
      
      // Check if server is running
      const response = await fetch(`${this.baseUrl}/api/version`);
      if (!response.ok) {
        throw new Error(`Ollama server not responding: ${response.statusText}`);
      }
      
      const version = await response.json();
      console.log(`[OllamaProvider] Connected to Ollama v${version.version || 'unknown'}`);
      
      // Pull model if not available
      await this.ensureModelAvailable();
      
      console.log(`[OllamaProvider] ✅ Ready with model: ${this.config.model}`);
    } catch (e: any) {
      console.warn(`[OllamaProvider] ⚠️ ${e.message}`);
      throw e;
    }
  }

  /**
   * Ensure model is available, pull if needed
   */
  private async ensureModelAvailable(): Promise<void> {
    try {
      // Check if model exists
      const listResponse = await fetch(`${this.baseUrl}/api/tags`);
      if (listResponse.ok) {
        const data = await listResponse.json();
        const models = data.models || [];
        const hasModel = models.some((m: any) => 
          m.name === this.config.model || 
          m.name.startsWith(this.config.model + ':')
        );
        
        if (!hasModel) {
          console.log(`[OllamaProvider] Pulling model ${this.config.model}...`);
          await this.pullModel();
        }
      }
    } catch (e) {
      console.warn(`[OllamaProvider] Could not check model availability: ${e}`);
    }
  }

  /**
   * Pull model from Ollama library
   */
  private async pullModel(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.config.model, stream: false }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.statusText}`);
      }
      
      console.log(`[OllamaProvider] Model ${this.config.model} pulled successfully`);
    } catch (e: any) {
      console.warn(`[OllamaProvider] Could not pull model: ${e.message}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/version`, {
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        return {
          provider: 'ollama',
          status: 'healthy',
          latency: Date.now() - start,
          lastChecked: new Date(),
        };
      }
      
      return {
        provider: 'ollama',
        status: 'degraded',
        latency: Date.now() - start,
        error: response.statusText,
        lastChecked: new Date(),
      };
    } catch (e: any) {
      return {
        provider: 'ollama',
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
      prompt,
      options: {
        temperature: options?.temperature ?? this.config.temperature,
        num_predict: options?.maxTokens ?? this.config.maxTokens,
      },
      stream: false,
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout || 120000),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      const latency = Date.now() - start;

      return {
        content: data.response,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        model: this.config.model,
        provider: 'ollama',
        latency,
      };
    } catch (e: any) {
      throw new Error(`[OllamaProvider] Generate failed: ${e.message}`);
    }
  }

  /**
   * Generate response (streaming)
   */
  async *generateStream(prompt: string, options?: Partial<LLMConfig>): Generator<StreamingChunk> {
    const requestBody = {
      model: this.config.model,
      prompt,
      options: {
        temperature: options?.temperature ?? this.config.temperature,
        num_predict: options?.maxTokens ?? this.config.maxTokens,
      },
      stream: true,
    };

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
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
        try {
          const data = JSON.parse(line);
          yield {
            content: data.response || '',
            done: data.done || false,
          };
        } catch {
          // Skip invalid JSON
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
    // Convert messages to Ollama format
    const prompt = messages
      .map(m => `<|im_start|>${m.role}\n${m.content}<|im_end|>`)
      .join('\n') + '<|im_start|>assistant\n';

    return this.generate(prompt, options);
  }

  /**
   * Chat completion (streaming)
   */
  async *chatStream(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: Partial<LLMConfig>
  ): Generator<StreamingChunk> {
    const prompt = messages
      .map(m => `<|im_start|>${m.role}\n${m.content}<|im_end|>`)
      .join('\n') + '<|im_start|>assistant\n';

    yield* this.generateStream(prompt, options);
  }

  /**
   * Function calling (Ollama supports tools in v0.5+)
   */
  async callFunction(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    functions: Array<{ name: string; description: string; parameters: any }>,
    options?: Partial<LLMConfig>
  ): Promise<{ response: LLMResponse; functionCall?: { name: string; arguments: any } }> {
    // Ollama function calling via system prompt
    const systemPrompt = `You have access to tools. When you need to call a function, respond with a JSON object:
\`\`\`json
{"name": "function_name", "arguments": {"arg1": "value1"}}
\`\`\`

Available functions:
${functions.map(f => `- ${f.name}: ${f.description}`).join('\n')}

Do not call any functions that are not listed above.`;

    const messagesWithTools = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const response = await this.chat(messagesWithTools, options);
    
    // Try to extract function call
    const functionCallMatch = response.content.match(/```json\s*\{["\n]*"name":\s*"([^"]+)"/);
    if (functionCallMatch) {
      const argsMatch = response.content.match(/"arguments":\s*(\{[^}]+\})/);
      return {
        response,
        functionCall: {
          name: functionCallMatch[1],
          arguments: argsMatch ? JSON.parse(argsMatch[1]) : {},
        },
      };
    }

    return { response };
  }

  /**
   * Dispose provider
   */
  dispose(): void {
    console.log('[OllamaProvider] Disposed');
  }
}

// ============================================================================
// Export
// ============================================================================

export { OllamaProvider };
