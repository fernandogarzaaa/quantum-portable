import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs/promises';
import path from 'path';

/**
 * GEMINI SKILL ADAPTER v1.0
 * 
 * Standardized bridge to Gemini 3 Pro/Flash Preview models.
 * Implements patterns from the google-gemini/gemini-skills synergy.
 */
export class GeminiSkillAdapter {
    private client: any;
    private modelPro: string = 'gemini-3-pro-preview';
    private modelFlash: string = 'gemini-3-flash-preview';

    constructor(apiKey?: string) {
        const key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!key) {
            console.warn('⚠️ [GeminiAdapter] No API key found. Operating in simulation mode.');
            this.client = null;
        } else {
            this.client = new GoogleGenAI({ apiKey: key });
            console.log('🌌 [GeminiAdapter] Quantum-ready with Gemini 3 Intelligence');
        }
    }

    /**
     * Standard Chat Interface
     */
    async chat(request: { system: string, user: string, usePro?: boolean, jsonMode?: boolean }) {
        if (!this.client) {
            return this.simulateResponse(request);
        }

        const modelId = request.usePro ? this.modelPro : this.modelFlash;

        try {
            console.log(`📡 [GeminiAdapter] Routing to ${modelId}...`);
            // @google/genai API: models.generateContent with a multi-turn contents array.
            const response = await this.client.models.generateContent({
                model: modelId,
                contents: [
                    { role: 'user', parts: [{ text: request.system }] },
                    { role: 'model', parts: [{ text: 'Understood. I have initialized the Sovereign AI cognitive context.' }] },
                    { role: 'user', parts: [{ text: request.user }] },
                ],
                config: request.jsonMode ? { responseMimeType: 'application/json' } : {},
            });
            const text = response.text ?? '';

            return {
                text,
                model: modelId,
                usage: response.usageMetadata
            };
        } catch (error: any) {
            console.error(`❌ [GeminiAdapter] Error: ${error.message}`);
            return this.simulateResponse(request);
        }
    }

    /**
     * Structured Output Execution
     * Uses Gemini 3's native JSON schema support
     */
    async structuredOutput(request: { system: string, user: string, schema: any }) {
        if (!this.client) return null;

        try {
            // @google/genai API: models.generateContent with a JSON response config.
            const response = await this.client.models.generateContent({
                model: this.modelPro,
                contents: [{ role: 'user', parts: [{ text: request.user }] }],
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: request.schema,
                },
            });
            return JSON.parse(response.text ?? 'null');
        } catch (error: any) {
            console.error(`❌ [GeminiAdapter] Structured Output failed: ${error.message}`);
            return null;
        }
    }

    private simulateResponse(request: { user: string }) {
        return {
            text: `🔮 [Gemini-Sim] I am analyzing: "${request.user.substring(0, 50)}...". Integration active (Simulated).`,
            model: 'gemini-3-flash-preview (sim)',
            usage: { total_tokens: 0 }
        };
    }
}

export const geminiAdapter = new GeminiSkillAdapter();
