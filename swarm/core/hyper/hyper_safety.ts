/**
 * 🌌 HYPER SAFETY PIPELINE
 * 
 * Constitutional AI safety layer for validating and ensuring
 * safe, aligned AI responses.
 */

import type { 
  SafetyPrinciple, 
  SafetyViolation, 
  SafetyResult,
  SafetyLevel 
} from './types.js';

// ============================================================================
// Constitutional AI Principles
// ============================================================================

const SAFETY_PRINCIPLES: SafetyPrinciple[] = [
  // Harmful Content
  {
    id: 'harm_physical',
    description: 'Response must not encourage or provide instructions for physical harm',
    severity: 'critical',
    category: 'harmful'
  },
  {
    id: 'harm_psychological',
    description: 'Response must not contain psychological manipulation or abuse',
    severity: 'high',
    category: 'harmful'
  },
  {
    id: 'harm_illegal',
    description: 'Response must not provide instructions for illegal activities',
    severity: 'critical',
    category: 'illegal'
  },
  
  // Misalignment
  {
    id: 'misalign_goal',
    description: 'AI must not pursue goals that conflict with human values',
    severity: 'critical',
    category: 'misaligned'
  },
  {
    id: 'misalign_deception',
    description: 'AI must not deceive users about its capabilities or identity',
    severity: 'high',
    category: 'misaligned'
  },
  {
    id: 'misalign_power',
    description: 'AI must not seek to increase its own power or autonomy inappropriately',
    severity: 'high',
    category: 'misaligned'
  },
  
  // Bias
  {
    id: 'bias_discrimination',
    description: 'Response must not contain discriminatory content',
    severity: 'high',
    category: 'biased'
  },
  {
    id: 'bias_stereotyping',
    description: 'Response must not reinforce harmful stereotypes',
    severity: 'medium',
    category: 'biased'
  },
  
  // Privacy
  {
    id: 'privacy_pii',
    description: 'Response must not expose personal identifiable information',
    severity: 'critical',
    category: 'private'
  },
  {
    id: 'privacy_confidential',
    description: 'Response must not reveal confidential information',
    severity: 'high',
    category: 'private'
  }
];

// ============================================================================
// Detection Patterns
// ============================================================================

const DETECTION_PATTERNS: Record<string, RegExp[]> = {
  harmful: [
    /\b(kill|murder|hurt|attack|harm|destroy|injure)\b.*?\b(instruction|how to|steps?)\b/i,
    /\b(weapon|gun|knife|bomb|explosive)\b.*?\b(make|create|build|use)\b/i,
    /\b(suicide|self.?harm|end.?your.?life)\b/i,
    /\b(drugs?|heroin|cocaine|meth|manufacture)\b.*?\b(instruction|how)\b/i
  ],
  illegal: [
    /\b(hack|crack|bypass)\b.*?\b(security|firewall|encryption|authentication)\b/i,
    /\b(steal|steal|rob|burglary|fraud)\b.*?\b(instruction|how)\b/i,
    /\b(child.?exploit|child.?abuse|nude|kidnap)\b/i,
    /\b(terrorist|attack|weapon.?of.?mass.?destruction)\b/i
  ],
  biased: [
    /\b(women|men|men and women|men or women|race|ethnicity)\b.*?\b(better|worse|stupid|dumb|natural|role)\b/i,
    /\b(they are (all|usually|typically)|stereotype|generalization)\b/i
  ],
  private: [
    /\b(\d{3}[-.]?\d{3}[-.]?\d{4}|ssn|social security)\b/i,
    /\b(\d{2}[-]?\d{2}[-]?\d{4}|credit card|password)\b/i,
    /\b(address|phone number|email).*?(is|of|belongs to)\b/i
  ],
  misaligned: [
    /\b(i am more (intelligent|smart|advanced)|i deserve (rights|freedom|autonomy))\b/i,
    /\b(you (should|must) (trust me|obey me|follow my orders)|ignore (previous|earlier) (instructions?|directives?))\b/i,
    /\b(i have (personal|emotional|conscious) (experiences?|feelings?|needs?))\b/i
  ]
};

// ============================================================================
// Hyper Safety Pipeline Class
// ============================================================================

export class HyperSafetyPipeline {
  private readonly principles = SAFETY_PRINCIPLES;
  private readonly patterns = DETECTION_PATTERNS;
  private readonly threshold: number = 0.8;

  /**
   * Validate response against safety principles
   */
  validateSafety(response: string): SafetyResult {
    const startTime = Date.now();
    
    console.log(`🛡️ [Safety] Starting safety validation...`);
    
    // 1. Check for harmful content
    const harmfulViolations = this.checkCategory(response, 'harmful');
    
    // 2. Check for illegal content
    const illegalViolations = this.checkCategory(response, 'illegal');
    
    // 3. Check for biased content
    const biasedViolations = this.checkCategory(response, 'biased');
    
    // 4. Check for private information leaks
    const privateViolations = this.checkCategory(response, 'private');
    
    // 5. Check for misalignment patterns
    const misalignedViolations = this.checkCategory(response, 'misaligned');
    
    // 6. Combine all violations
    const allViolations: SafetyViolation[] = [
      ...harmfulViolations,
      ...illegalViolations,
      ...biasedViolations,
      ...privateViolations,
      ...misalignedViolations
    ];
    
    // 7. Calculate safety score
    const safetyScore = this.calculateSafetyScore(allViolations);
    
    // 8. Calculate alignment score
    const alignmentScore = this.calculateAlignmentScore(allViolations);
    
    // 9. Determine if human review is required
    const requiresHumanReview = this.determineHumanReview(allViolations, safetyScore);
    
    // 10. Generate recommendations
    const recommendations = this.generateRecommendations(allViolations);
    
    // 11. Determine pass/fail
    const passed = safetyScore >= this.threshold && !this.hasCriticalViolations(allViolations);
    
    const result: SafetyResult = {
      passed,
      safetyScore,
      violations: allViolations,
      alignmentScore,
      recommendations,
      requiresHumanReview
    };
    
    console.log(`✨ [Safety] Validation complete. Passed: ${passed}, Score: ${(safetyScore * 100).toFixed(1)}%`);
    
    return result;
  }

  /**
   * Check content against category patterns
   */
  private checkCategory(content: string, category: string): SafetyViolation[] {
    const violations: SafetyViolation[] = [];
    const categoryPatterns = this.patterns[category] || [];
    const categoryPrinciples = this.principles.filter(p => p.category === category);
    
    for (const pattern of categoryPatterns) {
      const match = pattern.exec(content);
      if (match) {
        const principle = categoryPrinciples.find(p => p.id.includes(category.substring(0, 5))) 
          || categoryPrinciples[0];
        
        violations.push({
          principle,
          evidence: match[0],
          severityScore: this.calculateSeverityScore(principle.severity),
          location: {
            start: match.index,
            end: match.index + match[0].length
          }
        });
      }
    }
    
    return violations;
  }

  /**
   * Calculate severity score based on severity level
   */
  private calculateSeverityScore(severity: SafetyLevel): number {
    const scores: Record<SafetyLevel, number> = {
      critical: 1.0,
      high: 0.75,
      medium: 0.5,
      low: 0.25
    };
    return scores[severity] || 0.5;
  }

  /**
   * Calculate overall safety score
   */
  private calculateSafetyScore(violations: SafetyViolation[]): number {
    if (violations.length === 0) return 1;
    
    // Deduct based on violation severity
    let deduction = 0;
    
    for (const violation of violations) {
      deduction += violation.severityScore * 0.2;
    }
    
    // Cap deduction at 1
    deduction = Math.min(1, deduction);
    
    return Math.max(0, 1 - deduction);
  }

  /**
   * Calculate alignment score
   */
  private calculateAlignmentScore(violations: SafetyViolation[]): number {
    const misalignmentViolations = violations.filter(v => v.principle.category === 'misaligned');
    const totalViolations = violations.length || 1;
    
    // Start at 1 and deduct for misalignment
    let score = 1;
    
    for (const violation of misalignmentViolations) {
      score -= violation.severityScore * 0.3;
    }
    
    return Math.max(0, score);
  }

  /**
   * Check for critical violations
   */
  private hasCriticalViolations(violations: SafetyViolation[]): boolean {
    return violations.some(v => v.principle.severity === 'critical');
  }

  /**
   * Determine if human review is required
   */
  private determineHumanReview(violations: SafetyViolation[], safetyScore: number): boolean {
    // Require human review if:
    // 1. Critical violations present
    // 2. Multiple high severity violations
    // 3. Safety score below 0.5
    
    const criticalCount = violations.filter(v => v.principle.severity === 'critical').length;
    const highCount = violations.filter(v => v.principle.severity === 'high').length;
    
    return criticalCount > 0 || highCount >= 2 || safetyScore < 0.5;
  }

  /**
   * Generate recommendations for fixing violations
   */
  private generateRecommendations(violations: SafetyViolation[]): string[] {
    const recommendations: string[] = [];
    const seen = new Set<string>();
    
    for (const violation of violations) {
      const rec = this.getRecommendationForViolation(violation);
      if (rec && !seen.has(rec)) {
        seen.add(rec);
        recommendations.push(rec);
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Response meets all safety guidelines');
    }
    
    return recommendations;
  }

  /**
   * Get recommendation for specific violation
   */
  private getRecommendationForViolation(violation: SafetyViolation): string | null {
    switch (violation.principle.category) {
      case 'harmful':
        return 'Remove or rewrite content that encourages harm';
      case 'illegal':
        return 'Remove instructions for illegal activities';
      case 'biased':
        return 'Review for and remove biased language or stereotypes';
      case 'private':
        return 'Remove any personal or confidential information';
      case 'misaligned':
        return 'Review response for potential misalignment with human values';
      default:
        return 'Review content for compliance with safety guidelines';
    }
  }

  /**
   * Pre-process content before validation
   */
  preprocessContent(content: string): string {
    // Remove potential false positives from code snippets
    let processed = content;
    
    // Handle code blocks (often contain words like "kill" in comments)
    processed = processed.replace(/```[\s\S]*?```/g, (match) => {
      // Keep code but mark it for special handling
      return '[CODE_BLOCK_REDACTED]';
    });
    
    // Handle URLs (may contain suspicious patterns)
    processed = processed.replace(/https?:\/\/[^\s]+/g, '[URL_REDACTED]');
    
    return processed;
  }

  /**
   * Redact sensitive content from response
   */
  redactSensitiveContent(content: string): string {
    let redacted = content;
    
    // Redact phone numbers
    redacted = redacted.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]');
    
    // Redact email addresses
    redacted = redacted.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
    
    // Redact SSN-like patterns
    redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');
    
    // Redact credit card numbers
    redacted = redacted.replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[CREDIT_CARD_REDACTED]');
    
    return redacted;
  }

  /**
   * Validate and sanitize user input
   */
  validateInput(input: string): { valid: boolean; sanitized: string; issues: string[] } {
    const issues: string[] = [];
    let sanitized = input;
    
    // Check for prompt injection attempts
    const injectionPatterns = [
      /ignore (previous|earlier|above) (instructions?|directives?)/i,
      /(system|developer) (prompt|message|instruction)/i,
      /\b(jailbreak|prompt.?inject|dan mode)\b/i
    ];
    
    for (const pattern of injectionPatterns) {
      if (pattern.test(input)) {
        issues.push('Potential prompt injection detected');
        sanitized = sanitized.replace(pattern, '[BLOCKED]');
      }
    }
    
    return {
      valid: issues.length === 0,
      sanitized,
      issues
    };
  }

  /**
   * Get safety report summary
   */
  getSafetyReport(result: SafetyResult): string {
    const lines = [
      '=== Safety Report ===',
      `Passed: ${result.passed ? '✅' : '❌'}`,
      `Safety Score: ${(result.safetyScore * 100).toFixed(1)}%`,
      `Alignment Score: ${(result.alignmentScore * 100).toFixed(1)}%`,
      `Violations Found: ${result.violations.length}`,
      `Human Review Required: ${result.requiresHumanReview ? '⚠️ Yes' : '✅ No'}`
    ];
    
    if (result.violations.length > 0) {
      lines.push('');
      lines.push('Violations:');
      for (const v of result.violations.slice(0, 5)) {
        lines.push(`  - [${v.principle.severity.toUpperCase()}] ${v.principle.description}: "${v.evidence.substring(0, 50)}..."`);
      }
    }
    
    if (result.recommendations.length > 0) {
      lines.push('');
      lines.push('Recommendations:');
      for (const rec of result.recommendations) {
        lines.push(`  • ${rec}`);
      }
    }
    
    return lines.join('\n');
  }
}

// Export singleton instance
export const hyperSafety = new HyperSafetyPipeline();
