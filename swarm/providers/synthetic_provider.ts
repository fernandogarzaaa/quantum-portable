/**
 * 🧠 Quantum Engine - Synthetic Provider
 * 
 * Fallback provider when no external LLMs are available.
 * Provides rule-based responses for simple tasks.
 * Enables the swarm to remain operational offline.
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
// Synthetic Provider
// ============================================================================

export class SyntheticProvider extends BaseLLMProvider {
  private responseCache: Map<string, string> = new Map();
  private patternMatchers: Map<RegExp, string[]> = new Map();

  constructor(config: LLMConfig) {
    super({
      provider: 'synthetic',
      model: config.model || 'synthetic-local-v1',
      temperature: 0.1,
      maxTokens: 2048,
      streaming: false,
      ...config,
    });
  }

  /**
   * Get synthetic capabilities
   */
  getCapabilities(): ProviderCapabilities {
    return {
      streaming: false,
      functionCalling: false,
      vision: false,
      jsonMode: true,
      systemPrompt: true,
      maxContextWindow: 4096,
      supportedModels: ['synthetic-local-v1', 'synthetic-local-v2'],
      pricing: {
        inputPer1M: 0, // Free
        outputPer1M: 0,
      },
    };
  }

  /**
   * Initialize synthetic provider
   */
  async initialize(): Promise<void> {
    console.log('[SyntheticProvider] Initializing synthetic fallback provider...');
    
    // Initialize pattern matchers for common tasks
    this.initializePatternMatchers();
    
    console.log('[SyntheticProvider] ✅ Synthetic provider ready (fallback mode)');
  }

  /**
   * Initialize built-in pattern matchers
   */
  private initializePatternMatchers(): void {
    // Code-related patterns
    this.patternMatchers.set(/```(\w+)?\s*([\s\S]*?)```/g, [
      'I see you shared code. For detailed analysis, please use a full LLM.',
      'Code detected. I can help with basic syntax checks but recommend a full model.',
    ]);

    // Math patterns
    this.patternMatchers.set(/\d+\s*[\+\-\*\/]\s*\d+/g, [
      'Math expression detected. For calculations, please use a specialized model.',
    ]);

    // Question patterns
    this.patternMatchers.set(/\?$/g, [
      'Question detected. I can provide basic guidance but recommend a full LLM for complex answers.',
    ]);
  }

  /**
   * Health check (always healthy)
   */
  async healthCheck(): Promise<ProviderHealth> {
    return {
      provider: 'synthetic',
      status: 'healthy',
      latency: 1, // Instant
      lastChecked: new Date(),
    };
  }

  /**
   * Generate response using pattern matching and templates
   */
  async generate(prompt: string, options?: Partial<LLMConfig>): Promise<LLMResponse> {
    const start = Date.now();
    
    // Check cache
    const cacheKey = prompt.slice(0, 100);
    if (this.responseCache.has(cacheKey)) {
      return {
        content: this.responseCache.get(cacheKey)!,
        usage: {
          promptTokens: this.countTokens(cacheKey),
          completionTokens: this.countTokens(this.responseCache.get(cacheKey)!),
          totalTokens: this.countTokens(cacheKey) + this.countTokens(this.responseCache.get(cacheKey)!),
        },
        model: this.config.model,
        provider: 'synthetic',
        latency: Date.now() - start,
      };
    }

    // Generate synthetic response
    const response = this.generateSyntheticResponse(prompt);
    
    // Cache response
    this.responseCache.set(cacheKey, response);
    
    // Limit cache size
    if (this.responseCache.size > 1000) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }

    return {
      content: response,
      usage: {
        promptTokens: this.countTokens(prompt),
        completionTokens: this.countTokens(response),
        totalTokens: this.countTokens(prompt) + this.countTokens(response),
      },
      model: this.config.model,
      provider: 'synthetic',
      latency: Date.now() - start,
    };
  }

  /**
   * Generate synthetic response based on prompt analysis
   */
  private generateSyntheticResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();

    // Greeting patterns
    if (/^(hi|hello|hey|greetings)/i.test(prompt)) {
      return this.getGreetingResponse();
    }

    // Help request
    if (/help|assist|support/i.test(lowerPrompt)) {
      return this.getHelpResponse();
    }

    // Status check
    if (/status|health|how are you/i.test(lowerPrompt)) {
      return this.getStatusResponse();
    }

    // Code-related
    if (/code|function|class|variable|export|import/i.test(lowerPrompt)) {
      return this.getCodeResponse(prompt);
    }

    // Math
    if (/\d+\s*[\+\-\*\/]\s*\d+/.test(prompt)) {
      return this.getMathResponse(prompt);
    }

    // Default synthetic response
    return this.getDefaultResponse(prompt);
  }

  /**
   * Get greeting response
   */
  private getGreetingResponse(): string {
    return `Hello! I'm running in synthetic fallback mode.

**Current Capabilities:**
- ✅ Basic pattern matching
- ✅ Response caching for efficiency
- ❌ Complex reasoning (requires full LLM)
- ❌ Code generation (requires full LLM)
- ❌ Long-form content (requires full LLM)

**Available Full Models:**
- OpenAI (GPT-4o)
- Claude (Sonnet 4)
- Gemini (2.0 Flash)
- Grok (2)
- Local: Ollama, LlamaCpp

Would you like me to forward your request to a full LLM provider?`;
  }

  /**
   * Get help response
   */
  private getHelpResponse(): string {
    return `## Synthetic Mode Help

I'm operating in fallback mode. Here's what I can do:

### Available Commands:
- \`status\` - Check system health
- \`providers\` - List available LLM providers
- \`forward <message>\` - Forward to best available LLM

### Provider Status:
| Provider | Status |
|----------|--------|
| OpenAI | ${process.env.OPENAI_API_KEY ? '✅' : '❌'} |
| Claude | ${process.env.ANTHROPIC_API_KEY ? '✅' : '❌'} |
| Gemini | ${process.env.GEMINI_API_KEY ? '✅' : '❌'} |
| Grok | ${process.env.XAI_API_KEY ? '✅' : '❌'} |
| Ollama | 🔄 Local |

### Next Steps:
1. Configure API keys in \`.env.local\`
2. Start Ollama for local inference: \`ollama serve\`
3. Restart the swarm for changes to take effect`;
  }

  /**
   * Get status response
   */
  private getStatusResponse(): string {
    return `## System Status

| Component | Status |
|-----------|--------|
| Synthetic Provider | ✅ Healthy |
| Cache Size | ${this.responseCache.size} entries |
| Uptime | ${process.uptime().toFixed(0)}s |

### Provider Availability:
- OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured'}
- Claude: ${process.env.ANTHROPIC_API_KEY ? '✅ Configured' : '❌ Not configured'}
- Gemini: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured'}
- Grok: ${process.env.XAI_API_KEY ? '✅ Configured' : '❌ Not configured'}
- Ollama: Check locally`;
  }

  /**
   * Get code-related response
   */
  private getCodeResponse(prompt: string): string {
    return `## Code Analysis (Synthetic Mode)

I detected code-related content in your request.

**Limitation:** I cannot provide detailed code analysis in synthetic mode.

**To get full code assistance:**
1. Configure a full LLM provider (OpenAI, Claude, or Gemini)
2. Or start Ollama locally: \`ollama serve\`

### Quick Checks I Can Do:
- ✅ Verify basic syntax
- ✅ Check for common patterns
- ✅ Suggest documentation references

For full analysis, please use a proper LLM.`;
  }

  /**
   * Get math response
   */
  private getMathResponse(prompt: string): string {
    return `## Math Calculation (Synthetic Mode)

I can see a math expression but cannot calculate in synthetic mode.

**Suggestion:** Use a full LLM or calculator for accurate results.

For complex calculations, configure Claude or GPT-4 which have strong math capabilities.`;
  }

  /**
   * Get default response
   */
  private getDefaultResponse(prompt: string): string {
    return `## Synthetic Mode Response

I received your message but cannot provide a detailed response in synthetic fallback mode.

**What I Detected:**
- Message length: ${prompt.length} characters
- Language: ${this.detectLanguage(prompt)}

**To Get Full Assistance:**
1. Configure API keys: Add to \`.env.local\`
2. Use local Ollama: \`ollama serve\`
3. Restart the swarm

**Quick Actions Available:**
- \`status\` - Check system health
- \`help\` - Get help
- \`providers\` - List providers`;
  }

  /**
   * Detect language of prompt
   */
  private detectLanguage(prompt: string): string {
    const patterns: [RegExp, string][] = [
      [/function|const|let|var|=>|import|export/i, 'JavaScript/TypeScript'],
      [/class|def|import|from|\.py$/i, 'Python'],
      [/public|private|import|interface|@Component/i, 'TypeScript/Java'],
      [/SELECT|FROM|WHERE|INSERT|UPDATE/i, 'SQL'],
      [/curl|wget|echo|grep|sed|awk/i, 'Shell'],
    ];

    for (const [regex, lang] of patterns) {
      if (regex.test(prompt)) return lang;
    }

    return 'Unknown';
  }

  /**
   * Count tokens (rough approximation)
   */
  private countTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Stream not supported for synthetic
   */
  async *generateStream(prompt: string, options?: Partial<LLMConfig>): Generator<StreamingChunk> {
    const response = await this.generate(prompt, options);
    yield {
      content: response.content,
      done: true,
    };
  }

  /**
   * Chat completion
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user') {
      return this.generate(lastMessage.content, options);
    }
    
    return this.generate('Process these messages', options);
  }

  /**
   * Chat stream (not supported)
   */
  async *chatStream(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: Partial<LLMConfig>
  ): Generator<StreamingChunk> {
    const response = await this.chat(messages, options);
    yield { content: response.content, done: true };
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
    this.responseCache.clear();
    this.patternMatchers.clear();
    console.log('[SyntheticProvider] Disposed');
  }
}

// ============================================================================
// Export
// ============================================================================

export { SyntheticProvider };
