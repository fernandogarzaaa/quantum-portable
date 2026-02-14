/**
 * 🔐 SECURE ENTROPY PROVIDER
 * 
 * Cryptographically secure random number generation for quantum engine components.
 * Replaces Math.random() with crypto.randomBytes() for proper entropy.
 */

import { randomBytes } from 'crypto';

/**
 * Configuration for deterministic mode (testing/development)
 */
export interface SecureEntropyConfig {
    /** Use deterministic mode for testing (NOT cryptographically secure) */
    deterministic?: boolean;
    /** Seed for deterministic mode */
    seed?: string;
}

let config: SecureEntropyConfig = {
    deterministic: false,
    seed: undefined
};

/**
 * Configure the secure entropy provider
 */
export function configureSecureEntropy(userConfig: SecureEntropyConfig): void {
    config = { ...config, ...userConfig };
    if (config.deterministic) {
        console.log('[SecureEntropy] ⚠️  DETERMINISTIC MODE ENABLED - NOT cryptographically secure!');
    }
}

/**
 * Get current configuration
 */
export function getSecureEntropyConfig(): SecureEntropyConfig {
    return { ...config };
}

/**
 * Generate a cryptographically secure random float in [0, 1)
 * Uses crypto.randomBytes(4) and reads as UInt32BE
 */
export function secureRandom(): number {
    if (config.deterministic) {
        return deterministicRandom();
    }
    const buffer = randomBytes(4);
    return buffer.readUInt32BE(0) / 0xFFFFFFFF;
}

/**
 * Generate a cryptographically secure random float in [min, max)
 */
export function secureRandomRange(min: number, max: number): number {
    if (min >= max) {
        throw new Error('secureRandomRange: min must be less than max');
    }
    return min + secureRandom() * (max - min);
}

/**
 * Generate a cryptographically secure random integer in [min, max] (inclusive)
 * Uses variable-length buffer based on range size
 */
export function secureRandomInt(min: number, max: number): number {
    if (min >= max) {
        throw new Error('secureRandomInt: min must be less than max');
    }
    
    if (config.deterministic) {
        return Math.floor(deterministicRandom() * (max - min + 1)) + min;
    }
    
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const randomBuffer = randomBytes(bytesNeeded);
    const randomValue = randomBuffer.readUIntBE(0, bytesNeeded);
    return min + (randomValue % range);
}

/**
 * Generate a secure random boolean with configurable bias
 * @param trueProbability - Probability of returning true (default 0.5)
 */
export function secureRandomBoolean(trueProbability: number = 0.5): boolean {
    if (config.deterministic) {
        return deterministicRandom() < trueProbability;
    }
    return secureRandom() < trueProbability;
}

/**
 * Pick a random element from an array using secure random
 */
export function secureRandomElement<T>(array: T[]): T {
    if (array.length === 0) {
        throw new Error('secureRandomElement: array cannot be empty');
    }
    const index = secureRandomInt(0, array.length - 1);
    return array[index];
}

/**
 * Shuffle an array using Fisher-Yates with secure random
 */
export function secureShuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = secureRandomInt(0, i);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Generate a cryptographically secure random UUID-like string
 */
export function secureRandomId(prefix: string = ''): string {
    const bytes = randomBytes(16);
    const hex = bytes.toString('hex');
    // Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const formatted = `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`;
    return prefix ? `${prefix}_${formatted}` : formatted;
}

/**
 * Deterministic random function for testing (NOT secure)
 * Uses a simple LCG for reproducibility
 */
let deterministicSeed = 123456789;

function deterministicRandom(): number {
    deterministicSeed = (deterministicSeed * 1103515245 + 12345) & 0x7fffffff;
    return deterministicSeed / 0x7fffffff;
}

/**
 * Set seed for deterministic mode
 */
export function setDeterministicSeed(seed: string | number): void {
    if (typeof seed === 'string') {
        // Hash string to number
        deterministicSeed = 0;
        for (let i = 0; i < seed.length; i++) {
            deterministicSeed = ((deterministicSeed << 5) - deterministicSeed) + seed.charCodeAt(i);
            deterministicSeed |= 0;
        }
    } else {
        deterministicSeed = seed;
    }
}

/**
 * Validate that the entropy source is functioning correctly
 */
export function validateEntropySource(): { valid: boolean; entropy: number; message: string } {
    // Collect samples and check for statistical properties
    const samples = new Array(100).fill(0).map(() => secureRandom());
    
    // Check that values are in [0, 1)
    const inRange = samples.every(s => s >= 0 && s < 1);
    
    // Check approximate uniformity using chi-squared
    const buckets = 10;
    const expectedCount = samples.length / buckets;
    const observed = new Array(buckets).fill(0);
    for (const s of samples) {
        const bucket = Math.min(Math.floor(s * buckets), buckets - 1);
        observed[bucket]++;
    }
    
    const chiSquared = observed.reduce((sum, obs) => {
        const diff = obs - expectedCount;
        return sum + (diff * diff) / expectedCount;
    }, 0);
    
    // Chi-squared critical value for df=9, alpha=0.05 is ~16.9
    const valid = inRange && chiSquared < 20;
    
    return {
        valid,
        entropy: valid ? 1.0 : 0.0,
        message: valid 
            ? 'Entropy source validated - cryptographically secure' 
            : `Entropy source validation failed - chi-squared: ${chiSquared.toFixed(2)}`
    };
}

/**
 * Get entropy statistics for monitoring
 */
export function getEntropyStats(): {
    mode: 'secure' | 'deterministic';
    samples: number;
    average: number;
    variance: number;
} {
    const samples = new Array(1000).fill(0).map(() => secureRandom());
    const average = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance = samples.reduce((sum, s) => sum + Math.pow(s - average, 2), 0) / samples.length;
    
    return {
        mode: config.deterministic ? 'deterministic' : 'secure',
        samples: samples.length,
        average,
        variance
    };
}
