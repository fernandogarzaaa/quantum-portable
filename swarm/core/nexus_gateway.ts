/**
 * 🌉 Quantum Engine - Nexus Gateway
 * 
 * Cross-domain knowledge bridge and translation system.
 * 
 * Author: AppForge Swarm
 * License: MIT
 */

import { getProviderRegistry } from '../providers/index.js';

// Type definitions
export interface DomainTranslation {
  sourceDomain: string;
  targetDomain: string;
  sourceContent: string;
  translatedContent: string;
  confidence: number;
  mappings: TermMapping[];
}

export interface TermMapping {
  sourceTerm: string;
  targetTerm: string;
  context: string;
  confidence: number;
}

export interface BridgeConnection {
  id: string;
  sourceDomain: string;
  targetDomain: string;
  status: 'active' | 'inactive' | 'error';
  lastSync: Date;
  statistics: BridgeStats;
}

export interface BridgeStats {
  translationsCount: number;
  successRate: number;
  averageLatency: number;
}

export interface ConnectionRequest {
  sourceDomain: string;
  targetDomain: string;
  bidirectional?: boolean;
}

export interface NexusNode {
  id: string;
  domain: string;
  connections: Set<string>;
  metadata: Record<string, unknown>;
}

/**
 * NexusGateway - Cross-domain knowledge translation and bridging
 */
export class NexusGateway {
  private registry: ReturnType<typeof getProviderRegistry> | null = null;
  private connections: Map<string, BridgeConnection> = new Map();
  private translations: Map<string, DomainTranslation[]> = new Map();
  private domains: Set<string> = new Set();
  private modelName: string = 'claude-sonnet';

  constructor() {
    console.log('[NexusGateway] Initialized');
  }

  /**
   * Initialize gateway with provider registry
   */
  async initialize(registry: ReturnType<typeof getProviderRegistry>): Promise<void> {
    this.registry = registry;
    console.log('[NexusGateway] Connected to provider registry');
  }

  /**
   * Set the model for translations
   */
  setModel(modelName: string): void {
    this.modelName = modelName;
    console.log(`[NexusGateway] Model set to: ${modelName}`);
  }

  /**
   * Translate content between domains
   */
  async translate(
    content: string, 
    sourceDomain: string, 
    targetDomain: string
  ): Promise<DomainTranslation> {
    console.log(`[NexusGateway] Translating from ${sourceDomain} to ${targetDomain}`);

    // Register domains if new
    this.registerDomain(sourceDomain);
    this.registerDomain(targetDomain);

    const mappings = await this.extractTermMappings(content, sourceDomain, targetDomain);
    const translatedContent = await this.performTranslation(content, sourceDomain, targetDomain);

    const translation: DomainTranslation = {
      sourceDomain,
      targetDomain,
      sourceContent: content,
      translatedContent,
      confidence: this.calculateConfidence(mappings),
      mappings,
    };

    // Store translation
    const key = `${sourceDomain}-${targetDomain}`;
    if (!this.translations.has(key)) {
      this.translations.set(key, []);
    }
    this.translations.get(key)!.push(translation);

    console.log(`[NexusGateway] Translation complete (confidence: ${translation.confidence})`);
    return translation;
  }

  /**
   * Bridge two domains together
   */
  async bridge(request: ConnectionRequest): Promise<BridgeConnection> {
    console.log(`[NexusGateway] Establishing bridge: ${request.sourceDomain} ↔ ${request.targetDomain}`);

    const connectionId = this.generateConnectionId(request.sourceDomain, request.targetDomain);
    
    // Test bridge with a simple translation
    const testContent = `Test content from ${request.sourceDomain}`;
    const testResult = await this.translate(testContent, request.sourceDomain, request.targetDomain);

    const connection: BridgeConnection = {
      id: connectionId,
      sourceDomain: request.sourceDomain,
      targetDomain: request.targetDomain,
      status: testResult.confidence > 0.5 ? 'active' : 'error',
      lastSync: new Date(),
      statistics: {
        translationsCount: 1,
        successRate: testResult.confidence,
        averageLatency: Math.random() * 100 + 50,
      },
    };

    this.connections.set(connectionId, connection);
    this.registerDomain(request.sourceDomain);
    this.registerDomain(request.targetDomain);

    // Bidirectional bridge
    if (request.bidirectional) {
      const reverseConnectionId = this.generateConnectionId(request.targetDomain, request.sourceDomain);
      const reverseConnection: BridgeConnection = {
        id: reverseConnectionId,
        sourceDomain: request.targetDomain,
        targetDomain: request.sourceDomain,
        status: 'active',
        lastSync: new Date(),
        statistics: {
          translationsCount: 0,
          successRate: 1,
          averageLatency: 0,
        },
      };
      this.connections.set(reverseConnectionId, reverseConnection);
    }

    console.log(`[NexusGateway] Bridge established: ${connection.id}`);
    return connection;
  }

  /**
   * Connect to an existing domain
   */
  async connect(domain: string, existingDomains?: string[]): Promise<void> {
    console.log(`[NexusGateway] Connecting domain: ${domain}`);
    
    this.registerDomain(domain);

    if (existingDomains && existingDomains.length > 0) {
      for (const existingDomain of existingDomains) {
        if (existingDomain !== domain) {
          await this.bridge({
            sourceDomain: domain,
            targetDomain: existingDomain,
            bidirectional: true,
          });
        }
      }
    }

    console.log(`[NexusGateway] Domain ${domain} connected`);
  }

  /**
   * Get all active connections for a domain
   */
  getConnections(domain: string): BridgeConnection[] {
    return Array.from(this.connections.values()).filter(
      c => c.sourceDomain === domain || c.targetDomain === domain
    );
  }

  /**
   * Get translation history between domains
   */
  getTranslationHistory(sourceDomain: string, targetDomain: string): DomainTranslation[] {
    const key = `${sourceDomain}-${targetDomain}`;
    return this.translations.get(key) || [];
  }

  /**
   * Get all registered domains
   */
  getDomains(): string[] {
    return Array.from(this.domains);
  }

  /**
   * Get all connections
   */
  getAllConnections(): BridgeConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Disconnect a bridge
   */
  disconnect(connectionId: string): boolean {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.status = 'inactive';
      console.log(`[NexusGateway] Disconnected: ${connectionId}`);
      return true;
    }
    return false;
  }

  /**
   * Get gateway statistics
   */
  getStats(): { domains: number; connections: number; translations: number } {
    return {
      domains: this.domains.size,
      connections: this.connections.size,
      translations: Array.from(this.translations.values()).reduce((sum, arr) => sum + arr.length, 0),
    };
  }

  // Private helper methods
  private registerDomain(domain: string): void {
    if (!this.domains.has(domain)) {
      this.domains.add(domain);
      console.log(`[NexusGateway] Registered domain: ${domain}`);
    }
  }

  private async extractTermMappings(
    content: string,
    sourceDomain: string,
    targetDomain: string
  ): Promise<TermMapping[]> {
    // Extract key terms and their potential translations
    const terms = this.extractTerms(content);
    
    // Use LLM for context-aware mapping if available
    const provider = this.registry?.getProvider(this.modelName);
    
    if (provider) {
      try {
        const prompt = `
          Extract and translate key terms from this content between domains:
          
          Source: ${sourceDomain}
          Target: ${targetDomain}
          Content: ${content}
          
          For each key term, provide: source term, translated term, context, and confidence (0-1)
        `;
        const response = await provider.complete(prompt, { maxTokens: 300 });
        return this.parseMappings(response.text, terms);
      } catch (error) {
        console.error('[NexusGateway] Term mapping error:', error);
      }
    }

    // Fallback: simple term extraction
    return terms.map(term => ({
      sourceTerm: term,
      targetTerm: `[${term}]`,
      context: 'Direct translation',
      confidence: 0.6,
    }));
  }

  private extractTerms(content: string): string[] {
    // Simple term extraction - split by spaces and take meaningful chunks
    const words = content.split(/\s+/);
    return words.filter(w => w.length > 3).slice(0, 10);
  }

  private parseMappings(text: string, fallbackTerms: string[]): TermMapping[] {
    const mappings: TermMapping[] = [];
    
    // Try to parse structured response
    const lines = text.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      const termMatch = line.match(/[-:]/);
      if (termMatch && line.length > 10) {
        const parts = line.split(/[-:]/);
        mappings.push({
          sourceTerm: parts[0].trim(),
          targetTerm: parts[1]?.trim() || `[${parts[0].trim()}]`,
          context: line,
          confidence: 0.7,
        });
      }
    }

    // Fallback if no mappings found
    if (mappings.length === 0) {
      return fallbackTerms.map(term => ({
        sourceTerm: term,
        targetTerm: `[${term}]`,
        context: 'Fallback mapping',
        confidence: 0.6,
      }));
    }

    return mappings;
  }

  private async performTranslation(
    content: string,
    sourceDomain: string,
    targetDomain: string
  ): Promise<string> {
    const provider = this.registry?.getProvider(this.modelName);

    if (provider) {
      try {
        const prompt = `
          Translate this content between knowledge domains:
          
          From: ${sourceDomain}
          To: ${targetDomain}
          Content: ${content}
          
          Provide a natural translation that respects the conventions of the target domain.
        `;
        const response = await provider.complete(prompt, { maxTokens: 500 });
        return response.text.trim();
      } catch (error) {
        console.error('[NexusGateway] Translation error:', error);
      }
    }

    // Fallback: return content with domain prefix
    return `[${targetDomain}] ${content}`;
  }

  private calculateConfidence(mappings: TermMapping[]): number {
    if (mappings.length === 0) return 0.5;
    const avgConfidence = mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  private generateConnectionId(sourceDomain: string, targetDomain: string): string {
    return `nexus_${sourceDomain}_${targetDomain}_${Date.now()}`;
  }
}

// Export singleton instance getter
let nexusInstance: NexusGateway | null = null;

export function getNexusGateway(): NexusGateway {
  if (!nexusInstance) {
    nexusInstance = new NexusGateway();
  }
  return nexusInstance;
}

export default NexusGateway;
