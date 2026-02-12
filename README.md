# 🧠 Quantum Portable

Portable AI Swarm - Multi-LLM Provider Abstraction Layer with Local Inference Support.

## Features

- **🔄 Multi-LLM Support** - GPT-4o, Claude 4, Gemini 2.0, Grok 2, Codex
- **🏠 Local Inference** - Ollama and LlamaCpp for offline operation
- **🧠 SLM + LLM Strategy** - Use local models for simple tasks, cloud for complex reasoning
- **🔒 Privacy First** - Keep your data local with Ollama
- **📦 Portable** - Works with any LLM provider
- **🌐 Decentralized** - Deploy to Akash Network or Render.com

## Quick Start

```bash
# Clone the repo
git clone https://github.com/fernandogarzaaa/quantum-portable.git
cd quantum-portable

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Run tests
npm test
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Quantum Portable                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐  │
│  │           Provider Registry                      │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │  │
│  │  │  Cloud  │ │  Cloud  │ │  Local  │ │Local  │ │  │
│  │  │ GPT-4o  │ │ Claude  │ │ Ollama  │ │LlamaCPP│ │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └───┬───┘ │  │
│  └───────┼──────────┼───────────┼──────────┼──────┘  │
│          │          │           │          │          │
│  ┌───────▼──────────▼──────────▼──────────▼──────┐  │
│  │           Smart Provider Selector                │  │
│  │   Low Complexity → Local (Free)               │  │
│  │   High Complexity → Cloud (Powerful)          │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Supported Providers

| Provider | Type | Cost | Features |
|----------|------|------|----------|
| GPT-4o | Cloud | $$$ | Reasoning, Code, Vision |
| Claude 4 | Cloud | $$$ | Long Context, Code |
| Gemini 2.0 | Cloud | $$ | Fast, Multimodal |
| Grok 2 | Cloud | $$ | Real-time Info |
| Ollama | Local | Free | Privacy, Offline |
| LlamaCpp | Local | Free | GPU Accelerated |
| Synthetic | Fallback | Free | Offline Basic |

## Configuration

### Environment Variables

```env
# Cloud Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
XAI_API_KEY=xai-...

# Local Models
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Decentralized
AKASH_MNEMONIC=...
RENDER_API_KEY=...
```

### Usage

```typescript
import { getProviderRegistry } from './swarm/core/providers/index.js';

async function main() {
  const registry = await getProviderRegistry();
  
  // Auto-select best provider for task
  const response = await registry.generate('Write a React component', {
    complexity: 'low' // Uses local Ollama
  });
  
  console.log(response.content);
}
```

## SLM + LLM Strategy

Reduce costs by 70-80% using local models for simple tasks:

```typescript
const requirements = {
  complexity: 'low',    // Uses Ollama (free)
  // complexity: 'high'  // Uses Claude/GPT-4 (powerful)
};
```

## Decentralized Deployment

### Akash Network

```bash
# Deploy LLM to Akash
npm run deploy:akash
```

### Render.com

```bash
# Deploy to Render
npm run deploy:render
```

## VSCode Extension

See [`extensions/vscode-swarm/`](extensions/vscode-swarm/) for IDE integration.

## License

MIT

## Author

AppForge - [GitHub](https://github.com/fernandogarzaaa)
