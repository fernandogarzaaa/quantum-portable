/**
 * 🧠 Quantum Engine - Provider Test Suite
 * 
 * Tests the LLM Provider Abstraction Layer
 * 
 * Author: AppForge Swarm
 * License: MIT
 */

import { ProviderRegistry, getProviderRegistry } from './core/providers/provider_registry.js';
import { 
  OllamaProvider, 
  SyntheticProvider,
  ClaudeProvider,
  GeminiProvider,
  GrokProvider,
  OpenAIProvider 
} from './core/providers/index.js';
import { TaskRequirements } from './core/providers/llm_provider_interface.js';

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║    🧠 Quantum Engine - Provider Test Suite                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Test 1: Provider Registry Initialization
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Test 1: Provider Registry Initialization');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const registry = getProviderRegistry();
  await registry.initialize();
  
  const providers = registry.getAllProviders();
  console.log(`   ✅ Registered ${providers.length} providers:`);
  providers.forEach(p => {
    const caps = p.getCapabilities();
    console.log(`      - ${p.getProviderType()}: ${p.getModelName()} (${caps.supportedModels.length} models)`);
  });
  console.log();

  // Test 2: Health Check
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Test 2: Provider Health Checks');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const healthMap = await registry.checkHealth();
  healthMap.forEach((health, type) => {
    const icon = health.status === 'healthy' ? '✅' : health.status === 'degraded' ? '⚠️' : '❌';
    console.log(`   ${icon} ${type}: ${health.status} (${health.latency}ms)`);
  });
  console.log();

  // Test 3: Synthetic Provider (always works)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Test 3: Synthetic Provider (Fallback)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const synthetic = new SyntheticProvider({ model: 'synthetic-v1' });
  await synthetic.initialize();
  
  const synthResponse = await synthetic.generate('Hello, what can you do?');
  console.log(`   Response: ${synthResponse.content.slice(0, 150)}...`);
  console.log(`   Latency: ${synthResponse.latency}ms`);
  console.log(`   Cost: $${synthResponse.provider}`);
  console.log();

  // Test 4: Smart Provider Selection
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Test 4: Smart Provider Selection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const lowComplexity: TaskRequirements = { complexity: 'low', requiresFunctionCalling: false };
  const highComplexity: TaskRequirements = { complexity: 'high', requiresFunctionCalling: true };
  
  const localProvider = registry.getBestProvider(lowComplexity);
  const cloudProvider = registry.getBestProvider(highComplexity);
  
  console.log(`   🏠 Local provider: ${localProvider?.getProviderType()}`);
  console.log(`   ☁️ Cloud provider: ${cloudProvider?.getProviderType()}`);
  console.log();

  // Test 5: Usage Tracking
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Test 5: Usage Tracking');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const usage = registry.getUsageStats();
  console.log(`   Total tokens: ${usage.totalTokens}`);
  console.log(`   Total cost: $${usage.totalCost.toFixed(4)}`);
  console.log();

  // Test 6: Provider Capabilities
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Test 6: Provider Capabilities');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  providers.forEach(p => {
    const caps = p.getCapabilities();
    console.log(`   ${p.getProviderType()}:`);
    console.log(`      - Streaming: ${caps.streaming ? '✅' : '❌'}`);
    console.log(`      - Function Calling: ${caps.functionCalling ? '✅' : '❌'}`);
    console.log(`      - Vision: ${caps.vision ? '✅' : '❌'}`);
    console.log(`      - Max Context: ${caps.maxContextWindow.toLocaleString()} tokens`);
    console.log(`      - Pricing: $${caps.pricing.inputPer1M}/1M in, $${caps.pricing.outputPer1M}/1M out`);
  });
  console.log();

  // Summary
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                   📊 TEST SUMMARY                         ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Providers Registered: ${providers.length}                                    ║`);
  console.log(`║  Healthy Providers: ${healthMap.get('healthy')?.length || 0}                                     ║`);
  console.log(`║  Synthetic Fallback: ✅ Ready                              ║`);
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();
  console.log('🎉 Provider Layer Test Complete!');
  console.log();
  console.log('📝 Next Steps:');
  console.log('   1. Configure API keys in .env.local');
  console.log('   2. Start Ollama: ollama serve');
  console.log('   3. Run: npx tsx swarm/core/loop.ts');
}

// Run tests
runTests().catch(console.error);
