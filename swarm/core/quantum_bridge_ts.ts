
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BRIDGE_BINARY = path.resolve(__dirname, 'quantum_bridge/target/release/quantum_bridge.exe');

export interface BridgeOption {
    id: string;
    score: number;
}

export interface BridgeResult {
    bestOptionId: string;
    confidence: number;
    latencyNs: number;
}

/**
 * RUST-QUANTUM BRIDGE (TypeScript Interface)
 * Calls the native Rust binary for hyper-optimized decision logic.
 * This bypasses all Node.js overhead for critical-path decisions.
 */
export function resolveQuantumGate(options: BridgeOption[]): BridgeResult {
    const input = options.map(o => `${o.id}:${o.score}`).join(',');

    try {
        const output = execSync(`"${BRIDGE_BINARY}" resolve "${input}"`, {
            encoding: 'utf-8',
            timeout: 5000
        }).trim();

        // Parse: BEST:<id> CONF:<float> LATENCY:<ns>
        const parts = output.split(' ');
        const bestId = parts[0]?.split(':')[1] || '';
        const conf = parseFloat(parts[1]?.split(':')[1] || '0');
        const latency = parseInt(parts[2]?.split(':')[1] || '0');

        console.log(`🦀 [RUST-BRIDGE] Resolved: ${bestId} (${(conf * 100).toFixed(1)}% confidence, ${latency}ns)`);

        return {
            bestOptionId: bestId,
            confidence: conf,
            latencyNs: latency
        };
    } catch (e: any) {
        console.warn(`⚠️ [RUST-BRIDGE] Native resolve failed: ${e.message}. Falling back to JS.`);
        // Graceful fallback: JS-based resolution
        let best = options[0];
        for (const opt of options) {
            if (opt.score > best.score) best = opt;
        }
        return {
            bestOptionId: best.id,
            confidence: best.score / options.reduce((s, o) => s + o.score, 0),
            latencyNs: 0
        };
    }
}

export function bridgeVersion(): string {
    try {
        return execSync(`"${BRIDGE_BINARY}"`, { encoding: 'utf-8' }).trim();
    } catch {
        return 'unavailable';
    }
}
