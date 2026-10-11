/**
 * Type declarations for the vendored quantum-inspired engine
 * (universal_quantum_dist/index.js). The dist file is plain JavaScript with no
 * bundled types; this declaration covers the surface used by swarm/core.
 */

export interface QuantumDecision {
  recommendation: string;
  confidence: number;
  predictionId: string;
  [key: string]: unknown;
}

export interface QuantumEngineStats {
  engineVersion: string;
  [key: string]: unknown;
}

export class SuperpositionProcessor {
  [key: string]: unknown;
}

export class EntanglementAnalyzer {
  [key: string]: unknown;
}

export class QuantumAnnealingOptimizer {
  [key: string]: unknown;
}

export class QuantumNeuralNetwork {
  [key: string]: unknown;
}

export class QuantumGeneticAlgorithm {
  [key: string]: unknown;
}

export class QuantumCryptographer {
  [key: string]: unknown;
}

export class QuantumSwarm {
  [key: string]: unknown;
}

export default class QuantumEngine {
  annealing: { temperature: number; coolingRate: number; [key: string]: unknown };
  quantumSolve(question: string, options: string[], criteria: string[]): QuantumDecision;
  reportOutcome(predictionId: string, success: boolean, details?: Record<string, unknown>): void;
  exportLearningState(): unknown;
  importLearningState(state: unknown): void;
  getStats(): QuantumEngineStats;
  exportDump(limit?: number): unknown;
  [key: string]: unknown;
}
