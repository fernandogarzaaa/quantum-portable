# quantum-portable

> **Prototype / archived precursor to [AppForge](https://github.com/fernandogarzaaa/appforge).**
> This repository captures an early extraction of the "quantum" swarm core that was later folded into AppForge proper. It is preserved for reference and reuse — not actively maintained as a standalone product.

A small TypeScript / Node (ESM) workspace that extracts a self-contained "quantum-inspired" swarm core, an LLM provider abstraction, and a few prototype agents. The earlier AppForge Quantum README that previously lived here described an aspirational full-stack platform (React + Tailwind + Solana payments + visual app builder). None of that lives in this repo — the actual code here is a backend-only library and runner.

## What is actually in this repo

```
package.json                    # quantum-portable v1.1.0, ESM, ts-node loader
universal_quantum_dist/
  index.js                      # QuantumEngine v3.0 — quantum-inspired state store + utilities
swarm/
  core/
    quantum_core.ts             # QuantumSwarmCore class wrapping the engine
    oracle.ts                   # Predictive oracle over LLM providers
    nexus_gateway.ts            # Routing / gateway helpers
    memory.ts                   # In-process memory layer
    resonance_engine.ts
    swarm_collaboration.ts
    real_hyper_intelligence_v2.ts
    universal_hyper_intelligence.ts
    quantum_bridge_ts.ts
    secure_entropy.ts           # Crypto-grade RNG helpers
    gemini_skill_adapter.ts
    hyper/                      # Ensemble, router, safety, willow modules
  providers/
    claude_provider.ts          # LLM provider implementations
    codex_provider.ts
    gemini_provider.ts
    grok_provider.ts
    llamacpp_provider.ts
    ollama_provider.ts
    openai_provider.ts
    synthetic_provider.ts
    provider_registry.ts
    llm_provider_interface.ts
    index.ts
  agents/
    crypto_swarm.ts             # Prototype agents
    market_analyzer.ts
    revenue_hunter.ts
    sentinel.ts
  decentralized/
    akash_provider.ts
  test_hyper_intelligence.ts
  test_providers.ts
scripts/
  portable_benchmark.ts         # Benchmark harness used by `npm test`
QUANTUM_LAUNCHER.bat            # Windows launcher
```

## Dependencies

From `package.json`:

- `@google/genai` (Gemini client)
- `dotenv`
- `socket.io-client`
- dev: `typescript`, `ts-node`

## Scripts

```bash
npm install
npm test    # runs scripts/portable_benchmark.ts via ts-node
npm start   # configured for swarm/core/oracle_api_service.ts
```

> ⚠️ `npm start` references `swarm/core/oracle_api_service.ts`, which is **not** present in this snapshot — the script is preserved from an earlier layout. Either supply that file or run individual modules with `node --loader ts-node/esm <file>` instead.

## Status

Archived precursor. Use [AppForge](https://github.com/fernandogarzaaa/appforge) for the maintained, integrated version of this work. The contents here are useful as:

- a portable extraction of the LLM provider interface and registry
- a reference for the standalone `QuantumEngine` (`universal_quantum_dist/index.js`)
- a benchmark/test scaffold for swarm-style agents

## License

See [LICENSE](./LICENSE).
