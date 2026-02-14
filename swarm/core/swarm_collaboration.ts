/**
 * 🐝 Quantum Engine - Swarm Collaboration System
 * 
 * Agent coordination, registration, and collective decision making.
 * 
 * Author: AppForge Swarm
 * License: MIT
 */

// Type definitions
export interface Agent {
  id: string;
  name: string;
  domain: string;
  capabilities: string[];
  status: 'active' | 'idle' | 'busy' | 'offline';
  lastSeen: Date;
  metadata?: Record<string, unknown>;
}

export interface Signal {
  id: string;
  senderId: string;
  receiverId?: string;
  type: 'request' | 'response' | 'broadcast' | 'alert' | 'sync';
  payload: Record<string, unknown>;
  timestamp: Date;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface CollaborationRequest {
  domain: string;
  task: string;
  priority?: 'low' | 'normal' | 'high';
  constraints?: Record<string, unknown>;
}

export interface CollaborationResult {
  success: boolean;
  contributions: Map<string, unknown>;
  consensus?: string;
  errors?: string[];
}

export interface DomainAgents {
  domain: string;
  agents: Agent[];
}

/**
 * SwarmCollaboration - Agent coordination and collective intelligence
 */
export class SwarmCollaboration {
  private agents: Map<string, Agent> = new Map();
  private signalHistory: Signal[] = [];
  private domainIndex: Map<string, Set<string>> = new Map();
  private broadcastHandlers: Map<string, ((signal: Signal) => void)[]> = new Map();

  constructor() {
    console.log('[SwarmCollaboration] Initialized');
  }

  /**
   * Register an agent in the swarm
   */
  register(agent: Omit<Agent, 'id' | 'lastSeen'>): Agent {
    const fullAgent: Agent = {
      ...agent,
      id: this.generateId(),
      lastSeen: new Date(),
    };

    this.agents.set(fullAgent.id, fullAgent);
    this.indexAgentByDomain(fullAgent);
    
    console.log(`[SwarmCollaboration] Registered agent: ${fullAgent.name} (${fullAgent.domain})`);
    return fullAgent;
  }

  /**
   * Unregister an agent from the swarm
   */
  unregister(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);
      this.removeFromDomainIndex(agent);
      console.log(`[SwarmCollaboration] Unregistered agent: ${agent.name}`);
      return true;
    }
    return false;
  }

  /**
   * Update agent status
   */
  updateStatus(agentId: string, status: Agent['status']): boolean {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.lastSeen = new Date();
      console.log(`[SwarmCollaboration] Agent ${agent.name} status: ${status}`);
      return true;
    }
    return false;
  }

  /**
   * Send a signal to another agent or broadcast
   */
  signal(signal: Omit<Signal, 'id' | 'timestamp'>): Signal {
    const fullSignal: Signal = {
      ...signal,
      id: this.generateId(),
      timestamp: new Date(),
    };

    this.signalHistory.push(fullSignal);

    if (signal.receiverId) {
      // Direct signal
      const receiver = this.agents.get(signal.receiverId);
      if (receiver) {
        console.log(`[SwarmCollaboration] Signal ${fullSignal.id} → ${receiver.name}`);
      }
    } else {
      // Broadcast
      this.handleBroadcast(fullSignal);
    }

    return fullSignal;
  }

  /**
   * Broadcast a signal to all agents in a domain
   */
  broadcast(domain: string, type: Signal['type'], payload: Record<string, unknown>): Signal {
    const domainAgents = this.domainIndex.get(domain);
    if (domainAgents && domainAgents.size > 0) {
      return this.signal({
        senderId: 'swarm',
        type,
        payload: { ...payload, domain },
        priority: 'normal',
      });
    }
    
    const signal: Signal = {
      id: this.generateId(),
      senderId: 'swarm',
      type,
      payload,
      timestamp: new Date(),
    };
    
    this.signalHistory.push(signal);
    return signal;
  }

  /**
   * Collaborate with agents in a domain on a task
   */
  async collaborate(request: CollaborationRequest): Promise<CollaborationResult> {
    console.log(`[SwarmCollaboration] Collaboration request: ${request.domain} - ${request.task}`);

    const domainAgents = this.domainIndex.get(request.domain);
    if (!domainAgents || domainAgents.size === 0) {
      console.log(`[SwarmCollaboration] No agents found in domain: ${request.domain}`);
      return {
        success: false,
        contributions: new Map(),
        errors: ['No agents available in domain'],
      };
    }

    const contributions = new Map<string, unknown>();
    const errors: string[] = [];
    let activeAgents = 0;

    // Send collaboration request to all agents in domain
    for (const agentId of domainAgents) {
      const agent = this.agents.get(agentId);
      if (agent && agent.status === 'active') {
        activeAgents++;
        
        const response = await this.requestAgentContribution(agentId, request);
        if (response.success) {
          contributions.set(agentId, response.result);
        } else {
          errors.push(response.error || 'Unknown error');
        }
      }
    }

    const consensus = this.determineConsensus(contributions);
    
    const result: CollaborationResult = {
      success: activeAgents > 0 && contributions.size > 0,
      contributions,
      consensus,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log(`[SwarmCollaboration] Collaboration complete: ${contributions.size}/${activeAgents} contributions`);
    return result;
  }

  /**
   * Get all agents in a domain
   */
  getDomainAgents(domain: string): Agent[] {
    const agentIds = this.domainIndex.get(domain);
    if (!agentIds) return [];
    
    return Array.from(agentIds)
      .map(id => this.agents.get(id))
      .filter((a): a is Agent => a !== undefined);
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Subscribe to broadcast signals
   */
  onBroadcast(handler: (signal: Signal) => void): () => void {
    const handlers = this.broadcastHandlers.get('general') || [];
    handlers.push(handler);
    this.broadcastHandlers.set('general', handlers);

    return () => {
      const idx = handlers.indexOf(handler);
      if (idx > -1) handlers.splice(idx, 1);
    };
  }

  /**
   * Get signal history
   */
  getSignalHistory(): Signal[] {
    return [...this.signalHistory];
  }

  /**
   * Get swarm statistics
   */
  getStats(): { totalAgents: number; domains: number; signals: number } {
    return {
      totalAgents: this.agents.size,
      domains: this.domainIndex.size,
      signals: this.signalHistory.length,
    };
  }

  // Private helper methods
  private indexAgentByDomain(agent: Agent): void {
    if (!this.domainIndex.has(agent.domain)) {
      this.domainIndex.set(agent.domain, new Set());
    }
    this.domainIndex.get(agent.domain)!.add(agent.id);
  }

  private removeFromDomainIndex(agent: Agent): void {
    const domainSet = this.domainIndex.get(agent.domain);
    if (domainSet) {
      domainSet.delete(agent.id);
      if (domainSet.size === 0) {
        this.domainIndex.delete(agent.domain);
      }
    }
  }

  private async requestAgentContribution(
    agentId: string, 
    request: CollaborationRequest
  ): Promise<{ success: boolean; result?: unknown; error?: string }> {
    // Simulate agent contribution
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          result: {
            agentId,
            task: request.task,
            contribution: `Contribution from agent ${agentId}`,
            timestamp: new Date().toISOString(),
          },
        });
      }, Math.random() * 100 + 50);
    });
  }

  private determineConsensus(contributions: Map<string, unknown>): string | undefined {
    if (contributions.size === 0) return undefined;
    
    const allResults = Array.from(contributions.values());
    // Simple consensus - majority agreement (simulated)
    const agreement = Math.random() > 0.3;
    
    return agreement 
      ? 'Consensus reached: Agents agree on approach' 
      : 'No consensus: Agents have differing opinions';
  }

  private handleBroadcast(signal: Signal): void {
    const handlers = this.broadcastHandlers.get('general') || [];
    handlers.forEach(handler => {
      try {
        handler(signal);
      } catch (error) {
        console.error('[SwarmCollaboration] Broadcast handler error:', error);
      }
    });
  }

  private generateId(): string {
    return `swarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance getter
let swarmInstance: SwarmCollaboration | null = null;

export function getSwarm(): SwarmCollaboration {
  if (!swarmInstance) {
    swarmInstance = new SwarmCollaboration();
  }
  return swarmInstance;
}

export default SwarmCollaboration;
