# ⚡ AppForge Quantum - Self-Evolving Enterprise Platform

A production-ready, full-stack application platform powered by **Quantum-Inspired AI** and **Swarm Intelligence**. AppForge isn't just a boilerplate; it's a **self-improving organism** that writes its own code, heals its own bugs, and optimizes its own performance.

**Status:** 🚀 **QUANTUM STABLE** | **Version:** 3.0.0 (Autonomous Executive Mode)

---

## 🔮 The Quantum Advantage

AppForge integrates a proprietary **Quantum Engine (`src/utils/quantumInspiredAI.js`)** that simulates quantum computing principles on classical hardware to achieve super-intelligent results.

- **⚛️ Superposition Processing**: Explores multiple code solutions simultaneously to find the absolute best implementation.
- **🔗 Entanglement Analysis**: Instantly detects hidden dependencies and correlations across the entire codebase.
- **🌌 Quantum Tunneling Search**: Finds "fuzzy" information hidden behind semantic barriers (e.g., legacy code recovery).
- **🧬 Self-Evolution (Genetic)**: The engine can **rewrite its own source code** to add new capabilities (proven via `scripts/quantum_genesis.js`).
- **❤️ Self-Healing**: Utilizing **Quantum Error Correction**, the system automatically detects and repairs data corruption.

> **💡 Extraction Ready:** The core engine acts as a standalone module. see [QuantumEngine.js](./QuantumEngine.js).

---

## 🧠 Swarm Intelligence (Autonomous Bots)

AppForge is maintained by a **Local Swarm** of specialized AI agents that run 24/7 in the background or via GitHub Actions.

| Agent | Role | Capabilities |
|-------|------|--------------|
| **ProductOwner** | 🧠 The Brain | Reads `README.md`, invents new features, writes to `TODO.md`. |
| **God Mode** | 👨‍💻 The Coder | Reads `TODO.md`, writes full-stack code, commits changes. |
| **Sentinel** | 🛡️ Security | Scans for hardcoded secrets, vulnerability patterns, and patches them. |
| **BugHunter** | 🐞 QA | Writes and runs unit tests, fixing failures automatically. |
| **Optimizer** | ⚡ Speed | Analyzes complexity (Big O) and refactors inefficient logic. |

---

## 📋 Table of Contents

- [Features](#features)
- [Quantum Engine](#quantum-engine)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Autonomous Swarm](#autonomous-swarm)
- [Payment Integration](#payment-integration)
- [Deployment](#deployment)
- [Documentation](#documentation)

---

## ✨ Features

### Core Platform
- 🏗️ **Visual App Builder** - Drag-and-drop interface
- 📊 **Advanced Analytics** - Real-time monitoring with Vector Memory
- 🔐 **Enterprise Security** - Role-based access control
- 💳 **Crypto Payments** - Solana (USDC) + MoonPay On-Ramp

### Developer Experience
- 📝 **Code Playground** - Real-time code execution
- 📦 **Template Marketplace** - Pre-built templates
- 🔄 **Autonomous CI/CD** - Self-deploying workflows

### Business Logic
- **Subscription Management** - Tiered pricing ($45/$90/$900)
- **Admin Dashboard** - Live view of Swarm Activity (`/swarm`)
- **Notifications** - Email, SMS, Slack, Discord

---

## 🛠️ Tech Stack

### Quantum & AI
- **Quantum Engine** - Custom Genetic Algorithms & Annealing
- **Vector Memory** - Embeddings for Long-Term Recall
- **Swarm Orchestration** - Local Daemon (`pm2`) + GitHub Actions

### Frontend
- **React 18** + **Vite 6**
- **TailwindCSS** + **Radix UI** (Premium Design System)
- **TanStack Query** (State Management)

### Backend
- **Base44 Functions** (Serverless)
- **Deno** Runtime
- **Node.js** (Local Swarm)

### Blockchain
- **Solana Mainnet** (USDC)
- **MoonPay** (Fiat-to-Crypto)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Phantom Wallet (for payments)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd appforge-main

# Install dependencies
npm install

# Setup Environment
cp .env.example .env.local
# Add your BASE44_APP_ID and GITHUB_PAT
```

### Running Locally

```bash
# Start Web App
npm run dev

# The app will be available at http://localhost:5173
```

---

## 🤖 Autonomous Swarm

You can run the AI Swarm locally to let it improve the project while you sleep.

### Option 1: Local Daemon (Recommended)
Uses `pm2` to run the swarm in the background.

```bash
# Start the Swarm
npm run swarm:daemon

# View Logs (Watch the AI think!)
pm2 logs
```

### Option 2: Manual Cycle
Run a single iteration of the autonomous loop.

```bash
# Run one full cycle (Product Owner -> God Mode -> QA)
npm run swarm
```

### Option 3: GitHub Actions
The swarm is configured to run automatically on `cron` schedules via `.github/workflows/autonomous_swarm.yml`.

---

## 💳 Payment Integration (Solana)

AppForge uses a **Direct-to-Contract** payment model on Solana Mainnet.

1. **User**: Selects "Pro Plan" ($90).
2. **MoonPay**: User buys USDC with Credit Card (if needed).
3. **Transfer**: Wallet sends USDC to the AppForge Treasury.
4. **Verification**: Backend verifies on-chain signature.
5. **Access**: Account creates instantly.

**Config**: `src/config/payment.config.ts`

---

## 📄 License & extraction

This project is proprietary. However, the **Quantum Engine** has been extracted for standalone use.

**Usage:**
```javascript
import { QuantumGeneticAlgorithm } from './QuantumEngine.js';
const engine = new QuantumGeneticAlgorithm();
```
