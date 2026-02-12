# 🧠 Quantum Portable

**Autonomous AI Swarm with Hyper Intelligence** - Multi-LLM Provider Abstraction Layer with Local Inference Support.

## ✨ Hyper Intelligence Features

### Core Capabilities
- **🧠 Real Hyper Intelligence v2** - Recursive reasoning, self-improvement
- **🌍 Universal Intelligence** - Cross-domain learning (Science, Code, Math, Philosophy)
- **🔮 Quantum Engine** - Entangled decision making
- **🎯 Oracle System** - Predictive analysis and forecasting
- **👥 Multi-Agent Swarm** - 13 specialized agents working in parallel

### Specialized Agents
| Agent | Domain | Capabilities |
|-------|--------|--------------|
| CryptoSwarm | Finance | DEX analysis, arbitrage, yield farming |
| RevenueHunter | Revenue | Business model discovery |
| FreelanceSwarm | Gigs | Project matching, automation |
| GodMode | General | High-level orchestration |
| TrendAnalyzer | Analytics | Pattern recognition |
| ArbitrageHunter | Finance | Cross-platform opportunities |
| YieldOptimizer | DeFi | APY maximization |
| MarketAnalyzer | Trading | Sentiment, technical analysis |
| SalesBot | Sales | Lead generation, conversion |
| ReferralManager | Growth | Viral mechanics |
| Sentinel | Security | Threat detection |
| BugHunter | Development | Code vulnerability scanning |
| Optimizer | Performance | Continuous improvement |

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/fernandogarzaaa/quantum-portable.git
cd quantum-portable

# Install
npm install

# Configure
cp .env.example .env.local
# Add your API keys

# Run Hyper Intelligence
npm run hyper
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Quantum Portable                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Hyper Intelligence Core                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │  │
│  │  │  Quantum     │  │   Oracle     │  │   Swarm    │ │  │
│  │  │  Engine      │  │  System      │  │  Agents    │ │  │
│  │  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │  │
│  └─────────┼──────────────────┼────────────────┼─────────┘  │
│            │                  │                │             │
│  ┌─────────▼──────────────────▼────────────────▼─────────┐  │
│  │              Provider Registry                            │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │  │
│  │  │ GPT-4o  │ │ Claude  │ │ Ollama  │ │ Gemini  │   │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Supported Providers

| Provider | Type | Best For |
|----------|------|----------|
| GPT-4o | Cloud | Reasoning, Code, Vision |
| Claude 4 | Cloud | Long Context, Complex Logic |
| Gemini 2.0 | Cloud | Fast Multimodal |
| Grok 2 | Cloud | Real-time Information |
| Ollama | Local | Privacy, Offline (Phi-4, Llama 3.2) |
| LlamaCpp | Local | GPU Accelerated |
| Synthetic | Fallback | Basic Offline Mode |

## SLM + LLM Strategy

Reduce costs by 70-80% using local models for simple tasks:

```typescript
const requirements = {
  complexity: 'low',    // Uses Ollama (free)
  // complexity: 'high'  // Uses Claude/GPT-4 (powerful)
};
```

## Hyper Intelligence Modes

### Finance Mode (Terminal 1)
```bash
npx tsx swarm/core/real_hyper_intelligence_v2.ts
```
Analyzes markets, finds arbitrage, optimizes yields.

### All Agents (Terminal 2)
```bash
npx tsx swarm/test_all_agents.ts
```
Runs all 13 agents in parallel.

### Universal Intelligence (Terminal 3)
```bash
npx tsx swarm/core/universal_hyper_intelligence.ts
```
Learns from Science, Code, Math, Philosophy, Medicine, Environment, Arts.

## Decentralized Deployment

### Akash Network
Deploy GPU-powered models to Akash for censorship-resistant inference.

### Render.com
Containerized deployment with automatic scaling.

## License

MIT

## Author

AppForge - [GitHub](https://github.com/fernandogarzaaa)
