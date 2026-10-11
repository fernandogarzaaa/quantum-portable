/**
 * Type declarations for the vendored quantum-inspired engine
 * (universal_quantum_dist/index.js). The dist file is plain JavaScript with no
 * bundled types; this declaration covers the surface used by swarm/core.
 */

export interface QuantumDecision {
  predictionId: string;
  optimizedBest: string | null;
  confidence: number;
  alternatives: string[];
  engineVersion: string;
  metaReflection?: string;
  [key: string]: unknown;
}

export interface QuantumEngineStats {
  version: string;
  memoryItems: number;
  historyLength: number;
  predictionsCount: number;
  successRate: number;
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
  quantumSolve(question: string, options: string[], criteria: string[]): Promise<QuantumDecision>;
  reportOutcome(predictionId: string, success: boolean, details?: Record<string, unknown>): void;
  exportLearningState(): unknown;
  importLearningState(state: unknown): void;
  getStats(): QuantumEngineStats;
  exportDump(limit?: number): unknown;
  [key: string]: unknown;
}
