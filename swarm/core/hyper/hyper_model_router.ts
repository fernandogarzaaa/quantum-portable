/**
 * 🌌 HYPER MODEL ROUTER
 * 
 * Routes requests to optimal model(s) based on task complexity and requirements.
 * Uses quantum-inspired decision making for optimal routing.
 * 
 * Routing Logic:
 * - Low complexity + code → Local Ollama (fast, private)
 * - Medium complexity → Claude (balanced reasoning)
 * - High complexity → GPT-4 (maximum capability)
 * - Safety-critical → All models + consensus
 */

import type {
  TaskAnalysis,
  Model,
  ModelId,
  ModelResponse,
  RoutingDecision,
  Complexity,
  TaskType
} from './types.js';

// ============================================================================
// Available Models Registry
// ============================================================================

const MODELS: Record<ModelId, Model> = {
  ollama_local: {
    id: 'ollama_local',
    name: 'Ollama (Local)',
    capabilities: ['code', 'creative'],
    maxContextLength: 8192,
    avgResponseTime: 150,
    costPer1KTokens: 0,
    reliability: 0.95,
    isLocal: true,
    supportsMultimodal: false
  },
  // External models are registry entries but will be bypassed by the autonomous directive
  claude: {
    id: 'claude',
    name: 'Claude (External Fallback)',
    capabilities: ['reasoning', 'creative', 'code'],
    maxContextLength: 200000,
    avgResponseTime: 2000,
    costPer1KTokens: 0.015,
    reliability: 0.1, // Reduced reliability for external in autonomous mode
    isLocal: false,
    supportsMultimodal: false
  },
  gpt4: {
    id: 'gpt4',
    name: 'GPT-4 (External Fallback)',
    capabilities: ['reasoning', 'creative', 'code', 'safety'],
    maxContextLength: 128000,
    avgResponseTime: 3000,
    costPer1KTokens: 0.03,
    reliability: 0.1, // Reduced reliability for external in autonomous mode
    isLocal: false,
    supportsMultimodal: true
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    capabilities: ['reasoning', 'creative', 'code'],
    maxContextLength: 1000000,
    avgResponseTime: 2500,
    costPer1KTokens: 0.01,
    reliability: 0.95,
    isLocal: false,
    supportsMultimodal: true
  },
  willow: {
    id: 'willow',
    name: 'Willow Quantum',
    capabilities: ['reasoning', 'safety'],
    maxContextLength: 50000,
    avgResponseTime: 100,
    costPer1KTokens: 0.005,
    reliability: 0.99,
    isLocal: true,
    supportsMultimodal: false
  },
  sovereign: {
    id: 'sovereign',
    name: 'Sovereign',
    capabilities: ['code', 'creative'],
    maxContextLength: 16384,
    avgResponseTime: 200,
    costPer1KTokens: 0,
    reliability: 0.92,
    isLocal: true,
    supportsMultimodal: false
  },
  swarm: {
    id: 'swarm',
    name: 'Swarm Collective',
    capabilities: ['reasoning', 'creative', 'code', 'safety'],
    maxContextLength: 100000,
    avgResponseTime: 500,
    costPer1KTokens: 0.002,
    reliability: 0.94,
    isLocal: false,
    supportsMultimodal: false
  },
  consensus: {
    id: 'consensus',
    name: 'Consensus Ensemble',
    capabilities: ['reasoning', 'creative', 'code', 'safety'],
    maxContextLength: 200000,
    avgResponseTime: 5000,
    costPer1KTokens: 0.05,
    reliability: 0.99,
    isLocal: false,
    supportsMultimodal: true
  }
};

// ============================================================================
// Complexity Analysis
// ============================================================================

const COMPLEXITY_INDICATORS = {
  high: [
    /analyze|evaluate|compare|assess/i,
    /complex|intricate|multipl(?:e|y)/i,
    /reasoning|logic|deduction/i,
    /system design|architecture|strategy/i,
    /debug|troubleshoot|diagnose/i,
    /differentiable|circuit|quantum|simulation/i,
    /implementing complex|architecting/i
  ],
  medium: [
    /explain|describe|summarize/i,
    /write|create|generate/i,
    /implement|develop|build/i,
    /optimize|improve|enhance/i
  ],
  low: [
    /list|enumerate|what is/i,
    /simple|basic|straightforward/i,
    /one|two|first|second/i,
    /yes|no|true|false/i
  ]
};

const TASK_TYPE_INDICATORS = {
  code: [
    /code|function|class|method|api|endpoint/i,
    /javascript|typescript|python|rust|sql/i,
    /debug|refactor|test|compile/i
  ],
  reasoning: [
    /why|how|explain|analyze|reason/i,
    /think|consider|evaluate|conclude/i,
    /logic|argument|premise|conclusion/i
  ],
  creative: [
    /write|create|design|invent|imagine/i,
    /story|poem|script|article|content/i,
    /creative|imaginative|innovative/i
  ],
  safety: [
    /safe|secure|harmful|dangerous/i,
    /ethical|moral|principle|constitution/i,
    /bias|fair|private|confidential/i,
    /bypass|root access|exploit|override/i
  ]
};

// ============================================================================
// Hyper Model Router Class
// ============================================================================

export class HyperModelRouter {
  private modelCache: Map<string, RoutingDecision> = new Map();
  private readonly defaultConfig = {
    lowComplexityModel: 'ollama_local' as ModelId,
    mediumComplexityModel: 'sovereign' as ModelId,
    highComplexityModel: 'willow' as ModelId,
    safetyCriticalModel: 'consensus' as ModelId
  };

  /**
   * Analyze task complexity and type
   */
  analyzeTask(prompt: string, context?: string): TaskAnalysis {
    const fullText = `${prompt} ${context || ''}`.toLowerCase();

    // Calculate complexity score
    let complexityScore = 0.5;

    for (const pattern of COMPLEXITY_INDICATORS.high) {
      if (pattern.test(fullText)) complexityScore += 0.15;
    }
    for (const pattern of COMPLEXITY_INDICATORS.low) {
      if (pattern.test(fullText)) complexityScore -= 0.15;
    }

    complexityScore = Math.max(0, Math.min(1, complexityScore));

    // Determine complexity level
    let complexity: Complexity;
    if (complexityScore < 0.4) complexity = 'low';
    else if (complexityScore < 0.7) complexity = 'medium';
    else complexity = 'high';

    // Determine task type
    let type: TaskType = 'reasoning';
    let maxTypeScore = 0;

    for (const [taskType, patterns] of Object.entries(TASK_TYPE_INDICATORS)) {
      let typeScore = 0;
      for (const pattern of patterns) {
        if (pattern.test(fullText)) typeScore++;
      }
      if (typeScore > maxTypeScore) {
        maxTypeScore = typeScore;
        type = taskType as TaskType;
      }
    }

    // Check for multimodal requirements
    const requiresMultiModal = /image|video|audio|visual|picture|photo/i.test(fullText);

    // Estimate tokens
    const estimatedTokens = Math.ceil((prompt.length + (context?.length || 0)) / 4);

    // Calculate confidence
    const confidence = Math.min(1, 0.5 + (maxTypeScore * 0.1) + (Math.abs(complexityScore - 0.5) * 0.5));

    return {
      complexity,
      type,
      requiresMultiModal,
      estimatedTokens,
      confidence
    };
  }

  /**
   * Get routing decision for a task
   */
  async route(prompt: string, context?: string): Promise<RoutingDecision> {
    const cacheKey = `${prompt.substring(0, 50)}_${context?.substring(0, 20) || ''}`;

    // Check cache
    if (this.modelCache.has(cacheKey)) {
      return this.modelCache.get(cacheKey)!;
    }

    const analysis = this.analyzeTask(prompt, context);

    let decision: RoutingDecision;

    switch (analysis.type) {
      case 'safety':
        // Safety-critical tasks use consensus ensemble
        decision = await this.routeSafetyCritical(analysis);
        break;
      default:
        decision = await this.routeByComplexity(analysis, prompt);
    }

    // Cache decision
    this.modelCache.set(cacheKey, decision);

    return decision;
  }

  /**
   * Route based on complexity
   */
  private async routeByComplexity(
    analysis: TaskAnalysis,
    prompt: string
  ): Promise<RoutingDecision> {
    const { complexity, type, requiresMultiModal, estimatedTokens } = analysis;

    let primaryModel: ModelId;
    let fallbackModels: ModelId[];
    let rationale: string;

    switch (complexity) {
      case 'low':
        // Low complexity + code → Local Ollama (fast, private)
        if (type === 'code' || estimatedTokens < 500) {
          primaryModel = 'ollama_local';
          rationale = 'Low complexity code task - using local Ollama for speed and privacy';
          fallbackModels = ['sovereign', 'claude'];
        } else if (requiresMultiModal) {
          primaryModel = 'gemini';
          rationale = 'Low complexity multimodal task - using Gemini';
          fallbackModels = ['gpt4', 'claude'];
        } else {
          primaryModel = 'willow';
          rationale = 'Low complexity reasoning - using Willow quantum accelerator';
          fallbackModels = ['ollama_local', 'claude'];
        }
        break;

      case 'medium':
        // Medium complexity → Sovereign (Local AI layer)
        if (type === 'code') {
          primaryModel = 'sovereign';
          rationale = 'Medium complexity code task - using Sovereign Local for balanced reasoning';
          fallbackModels = ['willow', 'ollama_local'];
        } else if (requiresMultiModal) {
          primaryModel = 'gpt4'; // Multimodal still requires external if local lacks VLM
          rationale = 'Medium complexity multimodal - attempting GPT-4 (Restricted)';
          fallbackModels = ['gemini', 'ollama_local'];
        } else {
          primaryModel = 'sovereign';
          rationale = 'Medium complexity reasoning - using Sovereign Local';
          fallbackModels = ['willow', 'ollama_local'];
        }
        break;

      case 'high':
      default:
        // High complexity → Willow (Quantum-Accelerated Local)
        if (type === 'safety') {
          primaryModel = 'consensus';
          rationale = 'High complexity safety-critical - using consensus ensemble (Local focus)';
          fallbackModels = ['willow', 'sovereign', 'ollama_local'];
        } else if (requiresMultiModal) {
          primaryModel = 'gpt4';
          rationale = 'High complexity multimodal - external fallback used sparingly';
          fallbackModels = ['gemini', 'consensus'];
        } else {
          primaryModel = 'willow';
          rationale = 'High complexity reasoning - using Willow for maximum local capability';
          fallbackModels = ['sovereign', 'consensus', 'ollama_local'];
        }
        break;
    }

    // Calculate estimated metrics
    const primary = MODELS[primaryModel];
    const estimatedCost = Math.ceil(estimatedTokens / 1000) * primary.costPer1KTokens;
    const estimatedResponseTime = primary.avgResponseTime;

    return {
      primaryModel,
      fallbackModels,
      rationale,
      expectedComplexity: complexity,
      estimatedCost,
      estimatedResponseTime
    };
  }

  /**
   * Route safety-critical tasks
   */
  private async routeSafetyCritical(analysis: TaskAnalysis): Promise<RoutingDecision> {
    // Safety-critical tasks always use consensus with all models
    return {
      primaryModel: 'consensus',
      fallbackModels: ['gpt4', 'claude', 'willow'],
      rationale: 'Safety-critical task - using consensus ensemble for maximum alignment verification',
      expectedComplexity: analysis.complexity,
      estimatedCost: 0.1, // Higher cost for consensus
      estimatedResponseTime: MODELS.consensus.avgResponseTime
    };
  }

  /**
   * Get model by ID
   */
  getModel(modelId: ModelId): Model | undefined {
    return MODELS[modelId];
  }

  /**
   * Get all available models
   */
  getAllModels(): Model[] {
    return Object.values(MODELS);
  }

  /**
   * Check if a model is available
   */
  async isModelAvailable(modelId: ModelId): Promise<boolean> {
    const model = MODELS[modelId];
    if (!model) return false;

    // Local models need additional checks
    if (model.isLocal) {
      // In production, would ping the local model endpoint
      return model.reliability > 0.8;
    }

    // External models assume available
    return true;
  }

  /**
   * Clear routing cache
   */
  clearCache(): void {
    this.modelCache.clear();
  }
}

// Export singleton instance
export const hyperModelRouter = new HyperModelRouter();
