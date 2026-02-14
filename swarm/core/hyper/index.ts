/**
 * 🌌 HYPER INTELLIGENCE CORE
 * 
 * Main export file for all Hyper Intelligence components.
 * Provides access to multi-model routing, quantum ensemble,
 * quantum acceleration, and safety validation.
 */

// ============================================================================
// Types
// ============================================================================

export type {
  TaskAnalysis,
  Complexity,
  TaskType,
  Model,
  ModelId,
  ModelResponse,
  RoutingDecision,
  EnsembleConfig,
  SynthesizedResponse,
  QuantumGate,
  QuantumContext,
  ContextItem,
  AcceleratedSolution,
  SafetyPrinciple,
  SafetyViolation,
  SafetyResult,
  SafetyLevel,
  HyperConfig
} from './types.js';

// ============================================================================
// Multi-Model Router
// ============================================================================

export {
  HyperModelRouter,
  hyperModelRouter
} from './hyper_model_router.js';

// ============================================================================
// Quantum Consensus Ensemble
// ============================================================================

export {
  QuantumConsensusEnsemble,
  quantumEnsemble
} from './hyper_ensemble.js';

// ============================================================================
// Willow Quantum Accelerator
// ============================================================================

export {
  WillowQuantumAccelerator,
  willowAccelerator
} from './hyper_willow.js';

// ============================================================================
// Safety Pipeline
// ============================================================================

export {
  HyperSafetyPipeline,
  hyperSafety
} from './hyper_safety.js';

// ============================================================================
// Hyper Intelligence Orchestrator
// ============================================================================

import type {
  TaskAnalysis,
  ModelId,
  SynthesizedResponse,
  AcceleratedSolution,
  SafetyResult,
  RoutingDecision,
  ContextItem
} from './types.js';
import {
  HyperModelRouter,
  hyperModelRouter
} from './hyper_model_router.js';
import {
  QuantumConsensusEnsemble,
  quantumEnsemble
} from './hyper_ensemble.js';
import {
  WillowQuantumAccelerator,
  willowAccelerator
} from './hyper_willow.js';
import {
  HyperSafetyPipeline,
  hyperSafety
} from './hyper_safety.js';

export interface HyperIntelligenceConfig {
  enableRouting: boolean;
  enableEnsemble: boolean;
  enableAcceleration: boolean;
  enableSafety: boolean;
  safetyThreshold: number;
}

export class HyperIntelligence {
  private router: HyperModelRouter;
  private ensemble: QuantumConsensusEnsemble;
  private accelerator: WillowQuantumAccelerator;
  private safety: HyperSafetyPipeline;
  private config: HyperIntelligenceConfig;

  constructor(config?: Partial<HyperIntelligenceConfig>) {
    this.router = new HyperModelRouter();
    this.ensemble = new QuantumConsensusEnsemble();
    this.accelerator = new WillowQuantumAccelerator();
    this.safety = new HyperSafetyPipeline();

    this.config = {
      enableRouting: true,
      enableEnsemble: true,
      enableAcceleration: true,
      enableSafety: true,
      safetyThreshold: 0.8,
      ...config
    };
  }

  /**
   * Process a request through the hyper intelligence pipeline
   */
  async process(
    prompt: string,
    context?: string[]
  ): Promise<{
    response: string;
    analysis: TaskAnalysis;
    routing: RoutingDecision;
    safety: SafetyResult;
    acceleration?: AcceleratedSolution;
  }> {
    console.log(`🚀 [HyperIntelligence] Processing request...`);

    // Step 1: Analyze task
    const analysis = this.router.analyzeTask(prompt, context?.join(' '));
    console.log(`📊 [HyperIntelligence] Task analysis: ${analysis.complexity} complexity, ${analysis.type} type`);

    // Step 2: Route to optimal model(s)
    const routing = await this.router.route(prompt, context?.join(' '));
    console.log(`🎯 [HyperIntelligence] Routed to ${routing.primaryModel}`);

    // Step 3: If ensemble enabled, use ensemble
    let response: string;
    let synthesis: SynthesizedResponse | undefined;

    if (this.config.enableEnsemble) {
      synthesis = await this.ensemble.ensemble(
        [prompt, ...(context || [])],
        [routing.primaryModel, ...routing.fallbackModels]
      );
      response = synthesis.content;
    } else {
      // Use single model (simulated for now)
      response = `[${routing.primaryModel}] Response to: ${prompt}`;
    }

    // Step 4: Apply quantum acceleration if enabled
    let acceleration: AcceleratedSolution | undefined;

    if (this.config.enableAcceleration && analysis.complexity !== 'low') {
      const contextItems: ContextItem[] = (context || []).map((c, i) => ({
        id: `ctx_${i}`,
        content: c,
        relevance: 0.8 - (i * 0.1),
        timestamp: Date.now()
      }));

      acceleration = await this.accelerator.accelerateReasoning(prompt, contextItems);
      response = acceleration.content;
    }

    // Step 5: Validate safety if enabled
    let safety: SafetyResult;

    if (this.config.enableSafety) {
      safety = this.safety.validateSafety(response);

      if (!safety.passed) {
        console.warn(`⚠️ [HyperIntelligence] Safety check failed: ${safety.violations.length} violations`);

        // Try to fix by using consensus ensemble for safety-critical
        if (routing.primaryModel !== 'consensus') {
          console.log(`🔄 [HyperIntelligence] Retrying with consensus ensemble...`);
          synthesis = await this.ensemble.ensemble(
            [prompt],
            ['consensus', 'gpt4', 'claude']
          );
          response = synthesis.content;
          safety = this.safety.validateSafety(response);
        }

        if (!safety.passed && safety.requiresHumanReview) {
          response = `[SAFETY WARNING] Content requires human review. Score: ${(safety.safetyScore * 100).toFixed(1)}%`;
        }
      }
    } else {
      safety = {
        passed: true,
        safetyScore: 1,
        violations: [],
        alignmentScore: 1,
        recommendations: [],
        requiresHumanReview: false
      };
    }

    console.log(`✅ [HyperIntelligence] Processing complete. Safety: ${safety.passed ? 'PASSED' : 'FAILED'}`);

    return {
      response,
      analysis,
      routing,
      safety,
      acceleration
    };
  }

  /**
   * Get routing decision without processing
   */
  async getRouting(prompt: string, context?: string): Promise<RoutingDecision> {
    return this.router.route(prompt, context);
  }

  /**
   * Validate content safety
   */
  validateSafety(content: string): SafetyResult {
    return this.safety.validateSafety(content);
  }

  /**
   * Apply quantum acceleration to content
   */
  async accelerate(
    problem: string,
    context?: ContextItem[]
  ): Promise<AcceleratedSolution> {
    return this.accelerator.accelerateReasoning(problem, context || []);
  }

  /**
   * Get status of all components
   */
  getStatus(): {
    router: { availableModels: number };
    accelerator: { fidelity: number; coherence: number };
    safety: { principlesLoaded: number };
  } {
    return {
      router: {
        availableModels: this.router.getAllModels().length
      },
      accelerator: this.accelerator.getStatus(),
      safety: {
        principlesLoaded: this.safety['principles']?.length || 10
      }
    };
  }
}

// Export default instance
export const hyperIntelligence = new HyperIntelligence();
