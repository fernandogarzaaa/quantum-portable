/**
 * 🔊 Quantum Engine - Resonance Engine
 * 
 * Pattern detection and amplification across agent communications.
 * 
 * Author: AppForge Swarm
 * License: MIT
 */

import { getProviderRegistry } from '../providers/index.js';

// Type definitions
export interface ResonanceInput {
  source: string;
  content: string;
  type: 'message' | 'decision' | 'action' | 'analysis';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface DetectedPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  strength: number;
  occurrences: ResonanceInput[];
  firstDetected: Date;
  lastDetected: Date;
  tags: string[];
}

export interface ResonanceResult {
  patternId: string;
  resonanceScore: number;
  amplifiedContent: string;
  insights: string[];
  recommendations: string[];
}

export interface PatternAmplification {
  originalPattern: string;
  amplifiedVersion: string;
  amplificationFactor: number;
  expectedImpact: string;
}

// Type for pattern detector function
type PatternDetector = (inputs: ResonanceInput[]) => DetectedPattern | null;

/**
 * ResonanceEngine - Pattern detection and amplification system
 */
export class ResonanceEngine {
  private registry: ReturnType<typeof getProviderRegistry> | null = null;
  private patterns: Map<string, DetectedPattern> = new Map();
  private inputHistory: ResonanceInput[] = [];
  private customDetectors: Map<string, PatternDetector> = new Map();
  private modelName: string = 'claude-sonnet';
  private readonly MAX_HISTORY = 1000;

  constructor() {
    console.log('[ResonanceEngine] Initialized');
    this.registerDefaultDetectors();
  }

  /**
   * Initialize engine with provider registry
   */
  async initialize(registry: ReturnType<typeof getProviderRegistry>): Promise<void> {
    this.registry = registry;
    console.log('[ResonanceEngine] Connected to provider registry');
  }

  /**
   * Set the model for analysis
   */
  setModel(modelName: string): void {
    this.modelName = modelName;
    console.log(`[ResonanceEngine] Model set to: ${modelName}`);
  }

  /**
   * Process input and detect resonance
   */
  async resonate(input: ResonanceInput): Promise<ResonanceResult | null> {
    console.log(`[ResonanceEngine] Processing resonance from: ${input.source}`);

    // Store input
    this.inputHistory.push(input);
    this.trimHistory();

    // Detect patterns using custom detectors
    const matchedPatterns = this.detectPatterns(input);

    if (matchedPatterns.length === 0) {
      console.log('[ResonanceEngine] No patterns detected');
      return null;
    }

    // Get strongest pattern
    const strongestPattern = matchedPatterns.reduce((a, b) => 
      a.strength > b.strength ? a : b
    );

    // Amplify pattern insights
    const amplified = await this.amplifyPattern(strongestPattern);

    return {
      patternId: strongestPattern.id,
      resonanceScore: strongestPattern.strength,
      amplifiedContent: amplified.amplifiedVersion,
      insights: amplified.insights,
      recommendations: amplified.recommendations,
    };
  }

  /**
   * Detect patterns across all inputs
   */
  detect(): DetectedPattern[] {
    console.log('[ResonanceEngine] Scanning for patterns...');

    // Use custom detectors
    for (const [name, detector] of this.customDetectors) {
      try {
        const pattern = detector(this.inputHistory);
        if (pattern) {
          this.updatePattern(pattern);
        }
      } catch (error) {
        console.error(`[ResonanceEngine] Detector error (${name}):`, error);
      }
    }

    // Use LLM for pattern detection if available
    if (this.registry && this.inputHistory.length > 5) {
      this.detectPatternsWithLLM();
    }

    // Return all active patterns
    const activePatterns = Array.from(this.patterns.values())
      .filter(p => p.strength > 0.3)
      .sort((a, b) => b.strength - a.strength);

    console.log(`[ResonanceEngine] Found ${activePatterns.length} patterns`);
    return activePatterns;
  }

  /**
   * Amplify a detected pattern
   */
  async amplify(patternId: string): Promise<PatternAmplification | null> {
    const pattern = this.patterns.get(patternId);
    if (!pattern) {
      console.log(`[ResonanceEngine] Pattern not found: ${patternId}`);
      return null;
    }

    const provider = this.registry?.getProvider(this.modelName);
    let amplifiedVersion = pattern.description;
    let insights: string[] = [];

    if (provider) {
      try {
        const prompt = `
          Analyze and amplify this detected pattern:
          
          Pattern: ${pattern.name}
          Description: ${pattern.description}
          Occurrences: ${pattern.frequency}
          Strength: ${pattern.strength}
          
          Provide:
          1. An amplified/expanded version of the pattern description
          2. Key insights about this pattern
          3. Expected impact if this pattern continues
        `;
        const response = await provider.complete(prompt, { maxTokens: 400 });
        
        const lines = response.text.split('\n').filter(l => l.trim());
        amplifiedVersion = lines[0] || pattern.description;
        insights = lines.slice(1, 4);
      } catch (error) {
        console.error('[ResonanceEngine] Amplification error:', error);
      }
    }

    const amplification: PatternAmplification = {
      originalPattern: pattern.description,
      amplifiedVersion,
      amplificationFactor: pattern.strength * 1.5,
      expectedImpact: this.predictImpact(pattern),
    };

    // Update pattern with amplification
    pattern.strength = Math.min(1, pattern.strength * 1.2);
    
    console.log(`[ResonanceEngine] Amplified pattern: ${pattern.name}`);
    return amplification;
  }

  /**
   * Get all detected patterns
   */
  getPatterns(): DetectedPattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.lastDetected.getTime() - a.lastDetected.getTime());
  }

  /**
   * Get pattern by ID
   */
  getPattern(patternId: string): DetectedPattern | undefined {
    return this.patterns.get(patternId);
  }

  /**
   * Clear detected patterns
   */
  clearPatterns(): void {
    this.patterns.clear();
    console.log('[ResonanceEngine] Patterns cleared');
  }

  /**
   * Register a custom pattern detector
   */
  registerDetector(name: string, detector: PatternDetector): void {
    this.customDetectors.set(name, detector);
    console.log(`[ResonanceEngine] Registered detector: ${name}`);
  }

  /**
   * Get input history
   */
  getHistory(): ResonanceInput[] {
    return [...this.inputHistory];
  }

  /**
   * Get engine statistics
   */
  getStats(): { patterns: number; inputs: number; detectors: number } {
    return {
      patterns: this.patterns.size,
      inputs: this.inputHistory.length,
      detectors: this.customDetectors.size,
    };
  }

  // Private helper methods
  private registerDefaultDetectors(): void {
    // Frequency detector
    this.customDetectors.set('frequency', (inputs) => {
      const frequencyMap = new Map<string, ResonanceInput[]>();
      
      for (const input of inputs) {
        const key = input.type;
        if (!frequencyMap.has(key)) {
          frequencyMap.set(key, []);
        }
        frequencyMap.get(key)!.push(input);
      }

      // Find most frequent type
      let maxType = '';
      let maxCount = 0;
      
      for (const [type, typeInputs] of frequencyMap) {
        if (typeInputs.length > maxCount) {
          maxCount = typeInputs.length;
          maxType = type;
        }
      }

      if (maxCount >= 3) {
        return {
          id: this.generateId(),
          name: `Frequent ${maxType}`,
          description: `Detected ${maxCount} ${maxType} communications`,
          frequency: maxCount,
          strength: Math.min(1, maxCount / 10),
          occurrences: typeInputs,
          firstDetected: inputs[0].timestamp,
          lastDetected: inputs[inputs.length - 1].timestamp,
          tags: [maxType, 'frequency'],
        };
      }

      return null;
    });

    // Time-based detector
    this.customDetectors.set('timePattern', (inputs) => {
      if (inputs.length < 5) return null;

      const hourlyActivity = new Map<number, number>();
      
      for (const input of inputs) {
        const hour = new Date(input.timestamp).getHours();
        hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
      }

      // Find peak hour
      let peakHour = 0;
      let peakCount = 0;
      
      for (const [hour, count] of hourlyActivity) {
        if (count > peakCount) {
          peakCount = count;
          peakHour = hour;
        }
      }

      if (peakCount >= inputs.length * 0.3) {
        return {
          id: this.generateId(),
          name: `Peak Activity at ${peakHour}:00`,
          description: `Highest activity observed during hour ${peakHour}`,
          frequency: peakCount,
          strength: peakCount / inputs.length,
          occurrences: inputs.filter(i => new Date(i.timestamp).getHours() === peakHour),
          firstDetected: inputs[0].timestamp,
          lastDetected: inputs[inputs.length - 1].timestamp,
          tags: ['time', 'activity'],
        };
      }

      return null;
    });

    console.log('[ResonanceEngine] Registered default detectors');
  }

  private detectPatterns(input: ResonanceInput): DetectedPattern[] {
    const matchedPatterns: DetectedPattern[] = [];

    for (const [id, pattern] of this.patterns) {
      // Check if new input matches existing pattern
      const similarity = this.calculateSimilarity(input, pattern);
      if (similarity > 0.5) {
        pattern.frequency++;
        pattern.strength = Math.min(1, pattern.strength * 1.1);
        pattern.occurrences.push(input);
        pattern.lastDetected = input.timestamp;
        matchedPatterns.push(pattern);
      }
    }

    return matchedPatterns;
  }

  private async detectPatternsWithLLM(): Promise<void> {
    const provider = this.registry?.getProvider(this.modelName);
    if (!provider) return;

    try {
      const recentInputs = this.inputHistory.slice(-20);
      const prompt = `
        Analyze these recent communications and identify any emerging patterns:
        
        ${recentInputs.map(i => `[${i.type}] ${i.content.substring(0, 100)}`).join('\n')}
        
        Return any detected patterns with: name, description, frequency indicator
      `;

      const response = await provider.complete(prompt, { maxTokens: 300 });
      console.log('[ResonanceEngine] LLM pattern detection complete');
    } catch (error) {
      console.error('[ResonanceEngine] LLM detection error:', error);
    }
  }

  private updatePattern(pattern: DetectedPattern): void {
    const existing = this.patterns.get(pattern.id);
    if (existing) {
      existing.lastDetected = pattern.lastDetected;
      existing.strength = Math.min(1, existing.strength * 1.05);
    } else {
      this.patterns.set(pattern.id, pattern);
      console.log(`[ResonanceEngine] New pattern detected: ${pattern.name}`);
    }
  }

  private async amplifyPattern(pattern: DetectedPattern): Promise<{
    amplifiedVersion: string;
    insights: string[];
    recommendations: string[];
  }> {
    const provider = this.registry?.getProvider(this.modelName);
    
    let amplifiedVersion = pattern.description;
    const insights: string[] = [];
    const recommendations: string[] = [];

    if (provider) {
      try {
        const prompt = `
          Amplify this pattern and provide insights:
          
          Pattern: ${pattern.name}
          Details: ${pattern.description}
          Frequency: ${pattern.frequency}
          
          Provide:
          1. Amplified understanding
          2. Key insights (3 bullet points)
          3. Recommendations (3 bullet points)
        `;
        const response = await provider.complete(prompt, { maxTokens: 400 });
        
        const lines = response.text.split('\n').filter(l => l.trim());
        amplifiedVersion = lines[0] || pattern.description;
        
        // Extract insights (lines starting with • or -)
        insights.push(...lines.filter(l => l.trim().startsWith('•') || l.trim().startsWith('-')).slice(0, 3));
        recommendations.push(...lines.filter(l => l.trim().startsWith('1.') || l.trim().startsWith('2.') || l.trim().startsWith('3.')).slice(0, 3));
      } catch (error) {
        console.error('[ResonanceEngine] Amplification error:', error);
      }
    }

    // Fallback insights
    if (insights.length === 0) {
      insights.push('Pattern shows consistent behavior');
      insights.push('Consider monitoring frequency changes');
      recommendations.push('Continue tracking pattern evolution');
    }

    return { amplifiedVersion, insights, recommendations };
  }

  private calculateSimilarity(input: ResonanceInput, pattern: DetectedPattern): number {
    // Simple similarity based on type matching
    const typeMatch = pattern.tags.includes(input.type) ? 0.5 : 0;
    
    // Content similarity (basic keyword matching)
    const keywords = pattern.description.toLowerCase().split(' ');
    const contentMatches = keywords.filter(k => 
      input.content.toLowerCase().includes(k)
    ).length;
    const contentSimilarity = Math.min(1, contentMatches / 5);

    return typeMatch + contentSimilarity;
  }

  private predictImpact(pattern: DetectedPattern): string {
    if (pattern.strength > 0.8) {
      return 'High impact - significant pattern with strong resonance';
    } else if (pattern.strength > 0.5) {
      return 'Medium impact - moderate pattern influence';
    }
    return 'Low impact - emerging pattern, monitor closely';
  }

  private trimHistory(): void {
    while (this.inputHistory.length > this.MAX_HISTORY) {
      this.inputHistory.shift();
    }
  }

  private generateId(): string {
    return `resonance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance getter
let resonanceInstance: ResonanceEngine | null = null;

export function getResonanceEngine(): ResonanceEngine {
  if (!resonanceInstance) {
    resonanceInstance = new ResonanceEngine();
  }
  return resonanceInstance;
}

export default ResonanceEngine;
