/**
 * 🔮 Quantum Engine - Oracle Prediction System
 * 
 * Predictive analysis and forecasting system using LLM providers.
 * 
 * Author: AppForge Swarm
 * License: MIT
 */

import { getProviderRegistry, LLMProviderInterface } from '../providers/index.js';

// Type definitions
export interface PredictionInput {
  context: string;
  domain: string;
  timeframe?: string;
  parameters?: Record<string, unknown>;
}

export interface PredictionResult {
  id: string;
  timestamp: Date;
  prediction: string;
  confidence: number;
  reasoning: string;
  domain: string;
  timeframe?: string;
  alternatives?: PredictionResult[];
}

export interface ConsultationInput {
  question: string;
  context?: string;
  domain?: string;
  options?: string[];
}

export interface ConsultationResult {
  answer: string;
  confidence: number;
  reasoning: string;
  sources?: string[];
  recommendations?: string[];
}

export interface ForecastInput {
  metric: string;
  historicalData?: string;
  period: string;
  factors?: string[];
}

export interface ForecastResult {
  forecast: string;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  keyFactors: string[];
  timeline: string[];
}

/**
 * Oracle - Predictive analysis and forecasting system
 */
export class Oracle {
  private registry: ReturnType<typeof getProviderRegistry> | null = null;
  private predictionHistory: PredictionResult[] = [];
  private modelName: string = 'claude-sonnet';

  /**
   * Initialize Oracle with provider registry
   */
  async initialize(registry: ReturnType<typeof getProviderRegistry>): Promise<void> {
    this.registry = registry;
    console.log('[Oracle] Initialized and connected to provider registry');
  }

  /**
   * Set the model to use for predictions
   */
  setModel(modelName: string): void {
    this.modelName = modelName;
    console.log(`[Oracle] Model set to: ${modelName}`);
  }

  /**
   * Generate a prediction based on input context
   */
  async predict(input: PredictionInput): Promise<PredictionResult> {
    console.log(`[Oracle] Generating prediction for domain: ${input.domain}`);

    const prompt = this.buildPredictionPrompt(input);
    const provider = this.registry?.getProvider(this.modelName);
    
    let prediction = 'Unable to generate prediction';
    let reasoning = 'No reasoning available';
    let confidence = 0.5;

    if (provider) {
      try {
        const response = await provider.complete(prompt, { maxTokens: 500 });
        const parsed = this.parsePredictionResponse(response.text);
        prediction = parsed.prediction;
        reasoning = parsed.reasoning;
        confidence = parsed.confidence;
      } catch (error) {
        console.error('[Oracle] Prediction error:', error);
      }
    } else {
      // Fallback simulation
      prediction = this.simulatePrediction(input);
      reasoning = 'Simulated prediction (no provider available)';
      confidence = 0.6;
    }

    const result: PredictionResult = {
      id: this.generateId(),
      timestamp: new Date(),
      prediction,
      confidence,
      reasoning,
      domain: input.domain,
      timeframe: input.timeframe,
    };

    this.predictionHistory.push(result);
    console.log(`[Oracle] Prediction complete: ${result.id} (confidence: ${confidence})`);
    
    return result;
  }

  /**
   * Consult the oracle for advice or answers
   */
  async consult(input: ConsultationInput): Promise<ConsultationResult> {
    console.log(`[Oracle] Consulting on: ${input.question.substring(0, 50)}...`);

    const prompt = this.buildConsultationPrompt(input);
    const provider = this.registry?.getProvider(this.modelName);

    let answer = 'Unable to provide consultation';
    let reasoning = '';
    let confidence = 0.5;

    if (provider) {
      try {
        const response = await provider.complete(prompt, { maxTokens: 400 });
        const parsed = this.parseConsultationResponse(response.text);
        answer = parsed.answer;
        reasoning = parsed.reasoning;
        confidence = parsed.confidence;
      } catch (error) {
        console.error('[Oracle] Consultation error:', error);
      }
    } else {
      // Fallback simulation
      answer = this.simulateConsultation(input);
      reasoning = 'Simulated consultation (no provider available)';
      confidence = 0.5;
    }

    const result: ConsultationResult = {
      answer,
      confidence,
      reasoning,
      recommendations: this.generateRecommendations(answer),
    };

    console.log(`[Oracle] Consultation complete (confidence: ${confidence})`);
    return result;
  }

  /**
   * Generate a forecast for a metric
   */
  async forecast(input: ForecastInput): Promise<ForecastResult> {
    console.log(`[Oracle] Generating forecast for: ${input.metric}`);

    const prompt = this.buildForecastPrompt(input);
    const provider = this.registry?.getProvider(this.modelName);

    let forecast = 'Unable to generate forecast';
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let confidence = 0.5;
    let keyFactors: string[] = [];
    let timeline: string[] = [];

    if (provider) {
      try {
        const response = await provider.complete(prompt, { maxTokens: 400 });
        const parsed = this.parseForecastResponse(response.text);
        forecast = parsed.forecast;
        trend = parsed.trend;
        confidence = parsed.confidence;
        keyFactors = parsed.keyFactors;
        timeline = parsed.timeline;
      } catch (error) {
        console.error('[Oracle] Forecast error:', error);
      }
    } else {
      // Fallback simulation
      const simulated = this.simulateForecast(input);
      forecast = simulated.forecast;
      trend = simulated.trend;
      confidence = 0.5;
      keyFactors = simulated.keyFactors;
      timeline = simulated.timeline;
    }

    const result: ForecastResult = {
      forecast,
      trend,
      confidence,
      keyFactors,
      timeline,
    };

    console.log(`[Oracle] Forecast complete: ${trend} trend (confidence: ${confidence})`);
    return result;
  }

  /**
   * Get prediction history
   */
  getHistory(): PredictionResult[] {
    return [...this.predictionHistory];
  }

  /**
   * Clear prediction history
   */
  clearHistory(): void {
    this.predictionHistory = [];
    console.log('[Oracle] History cleared');
  }

  // Private helper methods
  private buildPredictionPrompt(input: PredictionInput): string {
    return `
      As an Oracle prediction system, analyze the following context and provide a prediction:
      
      Domain: ${input.domain}
      Timeframe: ${input.timeframe || 'Unknown'}
      Context: ${input.context}
      
      ${input.parameters ? `Additional Parameters: ${JSON.stringify(input.parameters)}` : ''}
      
      Provide:
      1. A clear prediction statement
      2. Your confidence level (0-1)
      3. Reasoning for this prediction
    `;
  }

  private buildConsultationPrompt(input: ConsultationInput): string {
    return `
      As an Oracle advisor, answer the following question:
      
      Question: ${input.question}
      ${input.context ? `Context: ${input.context}` : ''}
      ${input.domain ? `Domain: ${input.domain}` : ''}
      ${input.options ? `Options to consider: ${input.options.join(', ')}` : ''}
      
      Provide:
      1. A clear answer or guidance
      2. Your confidence level (0-1)
      3. Reasoning for this advice
    `;
  }

  private buildForecastPrompt(input: ForecastInput): string {
    return `
      As an Oracle forecasting system, predict the future of:
      
      Metric: ${input.metric}
      Period: ${input.period}
      ${input.historicalData ? `Historical Data: ${input.historicalData}` : ''}
      ${input.factors ? `Factors to consider: ${input.factors.join(', ')}` : ''}
      
      Provide:
      1. A forecast statement
      2. Trend direction (up/down/stable)
      3. Key factors affecting the forecast
      4. Timeline of expected changes
    `;
  }

  private parsePredictionResponse(text: string): { prediction: string; reasoning: string; confidence: number } {
    // Simple parsing - extract key sections
    const lines = text.split('\n').filter(l => l.trim());
    const prediction = lines[0] || text.substring(0, 200);
    const reasoning = lines.slice(1, 4).join(' ') || text.substring(0, 300);
    const confidenceMatch = text.match(/confidence[:\s]*([\d.]+)/i);
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;
    return { prediction, reasoning, confidence };
  }

  private parseConsultationResponse(text: string): { answer: string; reasoning: string; confidence: number } {
    const lines = text.split('\n').filter(l => l.trim());
    const answer = lines[0] || text.substring(0, 200);
    const reasoning = lines.slice(1, 3).join(' ') || text.substring(0, 200);
    const confidenceMatch = text.match(/confidence[:\s]*([\d.]+)/i);
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;
    return { answer, reasoning, confidence };
  }

  private parseForecastResponse(text: string): { 
    forecast: string; 
    trend: 'up' | 'down' | 'stable'; 
    confidence: number; 
    keyFactors: string[]; 
    timeline: string[] 
  } {
    const forecast = text.split('\n')[0] || text.substring(0, 200);
    const trendMatch = text.match(/trend[:\s]*(up|down|stable)/i);
    const trend = trendMatch ? (trendMatch[1].toLowerCase() as 'up' | 'down' | 'stable') : 'stable';
    const confidenceMatch = text.match(/confidence[:\s]*([\d.]+)/i);
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;
    const keyFactors = text.match(/factors?[:\s]*(.+)/i)?.[1]?.split(',').map(f => f.trim()) || [];
    const timeline = text.match(/timeline[:\s]*(.+)/i)?.[1]?.split(',').map(t => t.trim()) || [];
    return { forecast, trend, confidence, keyFactors, timeline };
  }

  private simulatePrediction(input: PredictionInput): string {
    return `Based on ${input.domain} analysis, ${input.context.substring(0, 100)}...`;
  }

  private simulateConsultation(input: ConsultationInput): string {
    return `Regarding "${input.question.substring(0, 50)}...", consider the following approach...`;
  }

  private simulateForecast(input: ForecastInput): { forecast: string; trend: 'up' | 'down' | 'stable'; keyFactors: string[]; timeline: string[] } {
    return {
      forecast: `${input.metric} is expected to ${Math.random() > 0.5 ? 'increase' : 'decrease'} over the ${input.period}`,
      trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
      keyFactors: ['Market conditions', 'User engagement', 'External factors'],
      timeline: ['Week 1', 'Week 2', 'Month 1', 'Quarter 1']
    };
  }

  private generateRecommendations(answer: string): string[] {
    return [
      'Consider multiple perspectives',
      'Validate with additional data sources',
      'Monitor key indicators regularly'
    ];
  }

  private generateId(): string {
    return `oracle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance getter
let oracleInstance: Oracle | null = null;

export function getOracle(): Oracle {
  if (!oracleInstance) {
    oracleInstance = new Oracle();
  }
  return oracleInstance;
}

export default Oracle;
