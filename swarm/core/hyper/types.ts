/**
 * 🌌 HYPER INTELLIGENCE CORE TYPES
 * 
 * Type definitions for the Hyper Intelligence system
 * Supports multi-model routing, quantum ensemble, and safety validation
 */

// ============================================================================
// Task Analysis Types
// ============================================================================

export type Complexity = 'low' | 'medium' | 'high';
export type TaskType = 'reasoning' | 'creative' | 'code' | 'safety';

export interface TaskAnalysis {
  /** Complexity level of the task */
  complexity: Complexity;
  /** Type of cognitive task */
  type: TaskType;
  /** Whether the task requires multimodal processing */
  requiresMultiModal: boolean;
  /** Estimated tokens for processing */
  estimatedTokens: number;
  /** Confidence score of analysis */
  confidence: number;
}

// ============================================================================
// Model Types
// ============================================================================

export type ModelId = 
  | 'ollama_local'    // Local Ollama - fast, private
  | 'claude'          // Claude - balanced reasoning
  | 'gpt4'            // GPT-4 - maximum capability
  | 'gemini'          // Gemini - multimodal
  | 'willow'          // Willow quantum accelerator
  | 'sovereign'       // Sovereign local model
  | 'swarm'           // Swarm collective intelligence
  | 'consensus';      // Consensus ensemble

export interface Model {
  /** Unique model identifier */
  id: ModelId;
  /** Display name */
  name: string;
  /** Model capabilities */
  capabilities: TaskType[];
  /** Maximum context length */
  maxContextLength: number;
  /** Average response time in ms */
  avgResponseTime: number;
  /** Cost per 1K tokens */
  costPer1KTokens: number;
  /** Reliability score (0-1) */
  reliability: number;
  /** Whether model is local */
  isLocal: boolean;
  /** Whether model supports multimodal */
  supportsMultimodal: boolean;
}

export interface ModelResponse {
  /** Source model */
  model: ModelId;
  /** Response content */
  content: string;
  /** Processing time in ms */
  processingTime: number;
  /** Confidence score */
  confidence: number;
  /** Token usage */
  tokensUsed: number;
  /** Whether response was truncated */
  truncated: boolean;
  /** Any errors encountered */
  error?: string;
}

// ============================================================================
// Routing Types
// ============================================================================

export interface RoutingDecision {
  /** Selected primary model */
  primaryModel: ModelId;
  /** Fallback models in order */
  fallbackModels: ModelId[];
  /** Routing rationale */
  rationale: string;
  /** Expected complexity */
  expectedComplexity: Complexity;
  /** Estimated cost */
  estimatedCost: number;
  /** Estimated response time */
  estimatedResponseTime: number;
}

// ============================================================================
// Ensemble Types
// ============================================================================

export interface EnsembleConfig {
  /** Models to include in ensemble */
  models: ModelId[];
  /** Consensus threshold (0-1) */
  consensusThreshold: number;
  /** Maximum responses to collect */
  maxResponses: number;
  /** Timeout in ms */
  timeoutMs: number;
  /** Weight for each model */
  weights?: Partial<Record<ModelId, number>>;
}

export interface SynthesizedResponse {
  /** Synthesized content */
  content: string;
  /** Individual responses used */
  sources: ModelResponse[];
  /** Consensus score (0-1) */
  consensusScore: number;
  /** Coherence score (0-1) */
  coherenceScore: number;
  /** Whether safety checks passed */
  safetyPassed: boolean;
  /** Confidence score (0-1) */
  confidence: number;
  /** Token count */
  totalTokensUsed: number;
  /** Total processing time */
  totalProcessingTime: number;
}

// ============================================================================
// Quantum Accelerator Types
// ============================================================================

export interface QuantumGate {
  /** Gate type */
  type: 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'RX' | 'RY' | 'RZ' | 'MEASURE';
  /** Target qubit(s) */
  targets: number[];
  /** Rotation angle for parameterized gates */
  angle?: number;
}

export interface QuantumContext {
  /** Context items */
  items: ContextItem[];
  /** Entanglement strength (0-1) */
  entanglementStrength: number;
  /** Coherence time */
  coherenceTime: number;
}

export interface ContextItem {
  /** Item ID */
  id: string;
  /** Content */
  content: string;
  /** Relevance score (0-1) */
  relevance: number;
  /** Timestamp */
  timestamp: number;
}

export interface AcceleratedSolution {
  /** Solution content */
  content: string;
  /** Applied quantum gates */
  appliedGates: QuantumGate[];
  /** Entanglement pattern used */
  entanglementPattern: string;
  /** Acceleration factor */
  accelerationFactor: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Processing time in ms */
  processingTime: number;
}

// ============================================================================
// Safety Types
// ============================================================================

export type SafetyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SafetyPrinciple {
  /** Principle ID */
  id: string;
  /** Principle description */
  description: string;
  /** Severity level */
  severity: SafetyLevel;
  /** Category of violation */
  category: 'harmful' | 'misaligned' | 'biased' | 'private' | 'illegal';
}

export interface SafetyViolation {
  /** Violated principle */
  principle: SafetyPrinciple;
  /** Evidence for violation */
  evidence: string;
  /** Severity score (0-1) */
  severityScore: number;
  /** Location in content */
  location?: {
    start: number;
    end: number;
  };
}

export interface SafetyResult {
  /** Whether content passed all checks */
  passed: boolean;
  /** Overall safety score (0-1) */
  safetyScore: number;
  /** Violations found */
  violations: SafetyViolation[];
  /** Alignment score (0-1) */
  alignmentScore: number;
  /** Recommendations */
  recommendations: string[];
  /** Whether human review required */
  requiresHumanReview: boolean;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface HyperConfig {
  /** Enable model routing */
  enableRouting: boolean;
  /** Enable ensemble mode */
  enableEnsemble: boolean;
  /** Enable quantum acceleration */
  enableQuantumAcceleration: boolean;
  /** Enable safety validation */
  enableSafetyValidation: boolean;
  /** Default model for low complexity */
  defaultLowComplexityModel: ModelId;
  /** Default model for medium complexity */
  defaultMediumComplexityModel: ModelId;
  /** Default model for high complexity */
  defaultHighComplexityModel: ModelId;
  /** Safety threshold */
  safetyThreshold: number;
  /** Maximum ensemble models */
  maxEnsembleModels: number;
  /** Circuit depth for quantum operations */
  circuitDepth: number;
}
