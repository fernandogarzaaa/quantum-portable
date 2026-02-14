import { QuantumSwarmCore } from '../swarm/core/quantum_core.js';
import { geminiAdapter } from '../swarm/core/gemini_skill_adapter.js';

async function runBenchmark() {
    console.log('🧪 [QuantumPortable] Starting Integrity Benchmark...');

    try {
        // 1. Initialize Oracle Core
        console.log('📡 Initializing Oracle 3.0...');
        const core = new QuantumSwarmCore();

        // 2. Test Gemini Connectivity
        console.log('📡 Testing Gemini 3 Fidelity Gateway...');
        const geminiRes = await geminiAdapter.chat({
            system: 'You are the Sovereign Portable Test Agent.',
            user: 'Perform a cognitive handshake. Reply with "Resonance Confirmed" if operational.'
        });

        console.log(`   Result: ${geminiRes.text}`);

        // 3. Test Quantum Simulation
        console.log('📡 Testing Quantum Annealing Optimization...');
        const decision = await core.consultOracle(
            'Optimize for portable deployment',
            ['High Compression', 'Raw Synthesis', 'Holographic Storage'],
            ['efficiency']
        );

        console.log(`   Oracle Recommendation: ${decision.recommendation}`);
        console.log(`   Confidence: ${decision.confidence}`);

        console.log('\n✅ [QuantumPortable] Benchmark Complete! Core is fully operational.');
    } catch (error: any) {
        console.error(`\n❌ [QuantumPortable] Benchmark Failed: ${error.message}`);
    }
}

runBenchmark();
