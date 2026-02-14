/**
 * 🧠 Quantum Engine - Persistent Memory System
 * 
 * Stores agent interactions and learnings with file-based JSON persistence.
 * Integrates with provider registry for LLM context.
 * 
 * Author: AppForge Swarm
 * License: MIT
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getProviderRegistry, LLMProviderInterface } from '../providers/index.js';

// Type definitions
export interface MemoryEntry {
  id: string;
  timestamp: Date;
  type: 'interaction' | 'learning' | 'decision' | 'context';
  content: string;
  metadata: Record<string, unknown>;
  tags: string[];
  agentId?: string;
}

export interface MemoryQuery {
  type?: string;
  tags?: string[];
  agentId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface MemoryStats {
  totalEntries: number;
  entriesByType: Record<string, number>;
  lastUpdated: Date;
  storagePath: string;
}

/**
 * PersistentMemory - File-based memory storage for agent interactions
 */
export class PersistentMemory {
  private storagePath: string;
  private entries: Map<string, MemoryEntry> = new Map();
  private registry: ReturnType<typeof getProviderRegistry> | null = null;

  constructor(storagePath: string = './data/memory') {
    this.storagePath = storagePath;
    this.ensureStorageExists();
    console.log(`[Memory] Initialized at: ${this.storagePath}`);
  }

  /**
   * Initialize connection to provider registry for LLM context
   */
  async initialize(registry: ReturnType<typeof getProviderRegistry>): Promise<void> {
    this.registry = registry;
    await this.load();
    console.log('[Memory] Connected to provider registry');
  }

  /**
   * Ensure storage directory exists
   */
  private ensureStorageExists(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
      console.log(`[Memory] Created storage directory: ${this.storagePath}`);
    }
  }

  /**
   * Save a memory entry to persistent storage
   */
  async save(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry> {
    const fullEntry: MemoryEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date(),
    };

    this.entries.set(fullEntry.id, fullEntry);
    await this.persistToFile();
    
    console.log(`[Memory] Saved entry: ${fullEntry.id} (${fullEntry.type})`);
    return fullEntry;
  }

  /**
   * Load all memory entries from storage
   */
  async load(): Promise<void> {
    const memoryFile = path.join(this.storagePath, 'memory.json');
    
    if (fs.existsSync(memoryFile)) {
      try {
        const data = fs.readFileSync(memoryFile, 'utf-8');
        const parsed = JSON.parse(data);
        this.entries = new Map(parsed.map((e: MemoryEntry) => [e.id, { ...e, timestamp: new Date(e.timestamp) }]));
        console.log(`[Memory] Loaded ${this.entries.size} entries from storage`);
      } catch (error) {
        console.error('[Memory] Failed to load memory:', error);
        this.entries = new Map();
      }
    } else {
      console.log('[Memory] No existing memory file found');
    }
  }

  /**
   * Query memory entries with filters
   */
  query(params: MemoryQuery): MemoryEntry[] {
    let results = Array.from(this.entries.values());

    if (params.type) {
      results = results.filter(e => e.type === params.type);
    }

    if (params.tags && params.tags.length > 0) {
      results = results.filter(e => 
        params.tags!.some(tag => e.tags.includes(tag))
      );
    }

    if (params.agentId) {
      results = results.filter(e => e.agentId === params.agentId);
    }

    if (params.startDate) {
      results = results.filter(e => new Date(e.timestamp) >= params.startDate!);
    }

    if (params.endDate) {
      results = results.filter(e => new Date(e.timestamp) <= params.endDate!);
    }

    // Sort by timestamp descending
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    if (params.limit) {
      results = results.slice(0, params.limit);
    }

    console.log(`[Memory] Query returned ${results.length} entries`);
    return results;
  }

  /**
   * Forget (delete) memory entries matching criteria
   */
  async forget(criteria: MemoryQuery): Promise<number> {
    const toDelete = this.query