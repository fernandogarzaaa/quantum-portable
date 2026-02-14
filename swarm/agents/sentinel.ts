/**
 * 🛡️ Sentinel - Security & Monitoring Agent
 * 
 * System health monitoring, anomaly detection, and alert generation.
 * Part of Phase 2 - Core Agents (Week 3-4)
 * 
 * Author: AppForge Swarm
 * License: MIT
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Type Definitions
// ============================================================================

export interface HealthMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    inbound: number;
    outbound: number;
  };
  uptime: number;
  timestamp: Date;
}

export interface AnomalyDetectionResult {
  id: string;
  timestamp: Date;
  type: 'performance' | 'security' | 'resourceivity';
  severity' | 'connect: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metrics: Record<string, unknown>;
  recommendedAction: string;
}

export interface AlertConfig {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  notificationChannels: string[];
}

export interface SystemStatus {
  healthy: boolean;
  lastCheck: Date;
  activeAlerts: number;
  resolvedAlerts: number;
  componentStatus: Record<string, 'online' | 'offline' | 'degraded'>;
}

export interface MonitorInput {
  interval?: number;
  components?: string[];
  verbose?: boolean;
}

export interface AlertInput {
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface SecureInput {
  checkVulnerabilities?: boolean;
  validateCertificates?: boolean;
  scanPorts?: boolean;
  auditAccess?: boolean;
}

// ============================================================================
// Sentinel Agent Class
// ============================================================================

export class SentinelAgent {
  private agentId: string;
  private isMonitoring: boolean = false;
  private monitorInterval: NodeJS.Timeout | null = null;
  private alerts: AnomalyDetectionResult[] = [];
  private healthHistory: HealthMetrics[] = [];
  private alertConfigs: Map<string, AlertConfig> = new Map();

  constructor() {
    this.agentId = `sentinel-${uuidv4().slice(0, 8)}`;
    console.log(`🛡️ [Sentinel] Agent initialized: ${this.agentId}`);
  }

  /**
   * Monitor system health and detect anomalies
   */
  async monitor(input: MonitorInput = {}): Promise<{
    metrics: HealthMetrics;
    anomalies: AnomalyDetectionResult[];
    status: SystemStatus;
  }> {
    const { interval = 30000, components = ['cpu', 'memory', 'disk', 'network'], verbose = false } = input;

    console.log(`🛡️ [Sentinel] Starting monitoring with interval: ${interval}ms`);
    console.log(`🛡️ [Sentinel] Monitoring components: ${components.join(', ')}`);

    // Collect health metrics
    const metrics = await this.collectHealthMetrics();
    this.healthHistory.push(metrics);

    // Keep only last 100 entries
    if (this.healthHistory.length > 100) {
      this.healthHistory.shift();
    }

    // Detect anomalies
    const anomalies = await this.detectAnomalies(metrics);

    // Determine system status
    const status = await this.getSystemStatus(anomalies);

    if (verbose) {
      console.log(`🛡️ [Sentinel] Health Metrics:`, JSON.stringify(metrics, null, 2));
      console.log(`🛡️ [Sentinel] Detected ${anomalies.length} anomalies`);
    }

    console.log(`🛡️ [Sentinel] System Status: ${status.healthy ? 'HEALTHY' : 'UNHEALTHY'} (${status.activeAlerts} active alerts)`);

    return { metrics, anomalies, status };
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.log(`🛡️ [Sentinel] Monitoring already active`);
      return;
    }

    this.isMonitoring = true;
    this.monitorInterval = setInterval(async () => {
      await this.monitor({ interval: intervalMs });
    }, intervalMs);

    console.log(`🛡️ [Sentinel] Continuous monitoring started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
    console.log(`🛡️ [Sentinel] Continuous monitoring stopped`);
  }

  /**
   * Generate and dispatch alerts
   */
  async alert(input: AlertInput): Promise<AnomalyDetectionResult> {
    const { title, message, severity, source = 'sentinel', metadata = {} } = input;

    const alert: AnomalyDetectionResult = {
      id: uuidv4(),
      timestamp: new Date(),
      type: severity === 'critical' || severity === 'high' ? 'security' : 'performance',
      severity,
      description: title,
      metrics: { message, ...metadata },
      recommendedAction: this.getRecommendedAction(severity, title),
    };

    this.alerts.push(alert);
    this.alertConfigs.set(alert.id, {
      id: alert.id,
      name: title,
      condition: message,
      threshold: severity === 'critical' ? 1 : severity === 'high' ? 2 : 5,
      enabled: true,
      notificationChannels: ['log', 'webhook'],
    });

    console.log(`🚨 [Sentinel] ALERT [${severity.toUpperCase()}] ${title}`);
    console.log(`🚨 [Sentinel] Message: ${message}`);

    return alert;
  }

  /**
   * Perform security checks and hardening
   */
  async secure(input: SecureInput = {}): Promise<{
    vulnerabilities: string[];
    certificatesValid: boolean;
    openPorts: number[];
    accessAudit: { user: string; action: string; timestamp: Date }[];
  }> {
    const { checkVulnerabilities = true, validateCertificates = true, scanPorts = false, auditAccess = true } = input;

    console.log(`🛡️ [Sentinel] Starting security audit...`);
    console.log(`🛡️ [Sentinel] Vulnerability checks: ${checkVulnerabilities ? 'ENABLED' : 'DISABLED'}`);
    console.log(`🛡️ [Sentinel] Certificate validation: ${validateCertificates ? 'ENABLED' : 'DISABLED'}`);
    console.log(`🛡️ [Sentinel] Port scanning: ${scanPorts ? 'ENABLED' : 'DISABLED'}`);
    console.log(`🛡️ [Sentinel] Access audit: ${auditAccess ? 'ENABLED' : 'DISABLED'}`);

    // Simulate vulnerability checks
    const vulnerabilities: string[] = [];
    if (checkVulnerabilities) {
      // In production, this would check actual CVEs and security databases
      vulnerabilities.push('CVE-2024-1234: Consider updating dependencies');
      console.log(`🛡️ [Sentinel] Found ${vulnerabilities.length} potential vulnerabilities`);
    }

    // Simulate certificate validation
    const certificatesValid = validateCertificates ? true : true;
    console.log(`🛡️ [Sentinel] Certificates valid: ${certificatesValid}`);

    // Simulate port scanning
    const openPorts: number[] = [];
    if (scanPorts) {
      // In production, this would actually scan ports
      openPorts.push(443, 80);
      console.log(`🛡️ [Sentinel] Open ports detected: ${openPorts.join(', ')}`);
    }

    // Simulate access audit
    const accessAudit: { user: string; action: string; timestamp: Date }[] = [];
    if (auditAccess) {
      accessAudit.push(
        { user: 'admin', action: 'login', timestamp: new Date() },
        { user: 'system', action: 'config_update', timestamp: new Date() }
      );
      console.log(`🛡️ [Sentinel] Access audit records: ${accessAudit.length}`);
    }

    console.log(`🛡️ [Sentinel] Security audit completed`);

    return {
      vulnerabilities,
      certificatesValid,
      openPorts,
      accessAudit,
    };
  }

  /**
   * Get health metrics history
   */
  getHealthHistory(): HealthMetrics[] {
    return this.healthHistory;
  }

  /**
   * Get all alerts
   */
  getAlerts(): AnomalyDetectionResult[] {
    return this.alerts;
  }

  /**
   * Clear resolved alerts
   */
  clearResolvedAlerts(): number {
    const count = this.alerts.length;
    this.alerts = [];
    console.log(`🛡️ [Sentinel] Cleared ${count} alerts`);
    return count;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async collectHealthMetrics(): Promise<HealthMetrics> {
    // In production, these would be actual system metrics
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: {
        inbound: Math.random() * 1000,
        outbound: Math.random() * 1000,
      },
      uptime: process.uptime(),
      timestamp: new Date(),
    };
  }

  private async detectAnomalies(metrics: HealthMetrics): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];

    // CPU anomaly detection
    if (metrics.cpu > 90) {
      anomalies.push({
        id: uuidv4(),
        timestamp: new Date(),
        type: 'performance',
        severity: 'high',
        description: 'High CPU usage detected',
        metrics: { cpu: metrics.cpu },
        recommendedAction: 'Scale up resources or optimize processes',
      });
    }

    // Memory anomaly detection
    if (metrics.memory > 85) {
      anomalies.push({
        id: uuidv4(),
        timestamp: new Date(),
        type: 'resource',
        severity: 'medium',
        description: 'High memory usage detected',
        metrics: { memory: metrics.memory },
        recommendedAction: 'Increase memory allocation or clear cache',
      });
    }

    return anomalies;
  }

  private async getSystemStatus(anomalies: AnomalyDetectionResult[]): Promise<SystemStatus> {
    const criticalAlerts = anomalies.filter(a => a.severity === 'critical' || a.severity === 'high');

    return {
      healthy: criticalAlerts.length === 0,
      lastCheck: new Date(),
      activeAlerts: anomalies.length,
      resolvedAlerts: this.alerts.length - anomalies.length,
      componentStatus: {
        cpu: 'online',
        memory: 'online',
        disk: 'online',
        network: 'online',
      },
    };
  }

  private getRecommendedAction(severity: string, title: string): string {
    const actionMap: Record<string, string> = {
      critical: 'Immediate action required. Isolate affected systems and initiate incident response.',
      high: 'Priority attention needed. Investigate root cause within 1 hour.',
      medium: 'Schedule investigation. Address within 24 hours.',
      low: 'Monitor and address during next maintenance window.',
    };

    return actionMap[severity] || 'Review and take appropriate action.';
  }
}

// ============================================================================
// Export Factory Function
// ============================================================================

export function createSentinelAgent(): SentinelAgent {
  return new SentinelAgent();
}
