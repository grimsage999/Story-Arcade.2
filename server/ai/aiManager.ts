import type { AIProvider, AIStoryInput, AIStoryOutput, AIPosterInput, AIPosterOutput } from "./providers/aiProvider.interface";
import { AnthropicProvider } from "./providers/anthropicProvider";
import { GeminiProvider } from "./providers/geminiProvider";
import { PerplexityProvider } from "./providers/perplexityProvider";
import { FallbackProvider } from "./providers/fallbackProvider";
import { storyLogger, posterLogger } from "../logger";

interface CircuitBreakerState {
  isOpen: boolean;
  lastFailureTime: number | null;
  failureCount: number;
}

export class AIManager {
  private providers: AIProvider[] = [];
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 30000; // 30 seconds

  constructor() {
    // Initialize providers based on configuration
    const providerOrder = process.env.AI_PROVIDER_FALLBACK_ORDER?.split(',') || ['anthropic', 'gemini', 'perplexity', 'fallback'];
    
    for (const providerName of providerOrder) {
      try {
        switch(providerName.trim()) {
          case 'anthropic':
            if (process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
              this.providers.push(new AnthropicProvider());
              storyLogger.info("Anthropic provider initialized");
            } else {
              storyLogger.debug("Anthropic provider skipped - no API key");
            }
            break;
          case 'gemini':
            if (process.env.AI_INTEGRATIONS_GEMINI_API_KEY) {
              this.providers.push(new GeminiProvider());
              storyLogger.info("Gemini provider initialized");
            } else {
              storyLogger.debug("Gemini provider skipped - no API key");
            }
            break;
          case 'perplexity':
            if (process.env.PERPLEXITY_API_KEY || process.env.perplex) {
              this.providers.push(new PerplexityProvider());
              storyLogger.info("Perplexity provider initialized");
            } else {
              storyLogger.debug("Perplexity provider skipped - no API key");
            }
            break;
          case 'fallback':
            this.providers.push(new FallbackProvider());
            storyLogger.info("Fallback provider initialized");
            break;
          default:
            console.warn(`Unknown AI provider: ${providerName}`);
        }
      } catch (error) {
        storyLogger.warn({ 
          provider: providerName, 
          error: error instanceof Error ? error.message : String(error) 
        }, "Failed to initialize AI provider");
      }
    }

    storyLogger.info({ providerCount: this.providers.length }, "AI Manager initialized with providers");

    // Initialize circuit breakers for each provider
    for (const provider of this.providers) {
      this.circuitBreakers.set(provider.getName(), {
        isOpen: false,
        lastFailureTime: null,
        failureCount: 0
      });
    }
  }

  async generateStory(input: AIStoryInput): Promise<AIStoryOutput> {
    for (const provider of this.providers) {
      if (this.isCircuitOpen(provider.getName())) {
        continue; // Skip providers with open circuits
      }

      try {
        const result = await provider.generateStory(input);
        
        // Reset circuit breaker on success
        this.resetCircuit(provider.getName());
        
        return result;
      } catch (error) {
        this.handleProviderFailure(provider.getName(), error);
        
        // Log the error but continue to next provider
        storyLogger.warn({ 
          provider: provider.getName(), 
          error: error instanceof Error ? error.message : String(error) 
        }, "AI provider failed, trying next");
      }
    }

    // If all providers failed, throw an error
    throw new Error("All AI providers failed to generate story");
  }

  async generatePoster(input: AIPosterInput): Promise<AIPosterOutput | null> {
    for (const provider of this.providers) {
      if (this.isCircuitOpen(provider.getName())) {
        continue; // Skip providers with open circuits
      }

      try {
        const result = await provider.generatePoster(input);
        
        // Reset circuit breaker on success
        this.resetCircuit(provider.getName());
        
        return result;
      } catch (error) {
        this.handleProviderFailure(provider.getName(), error);
        
        // Log the error but continue to next provider
        posterLogger.warn({ 
          provider: provider.getName(), 
          error: error instanceof Error ? error.message : String(error) 
        }, "AI poster provider failed, trying next");
      }
    }

    // If all providers failed, return null
    return null;
  }

  private isCircuitOpen(providerName: string): boolean {
    const state = this.circuitBreakers.get(providerName);
    if (!state) return false;

    if (!state.isOpen) return false;

    // Check if enough time has passed to close the circuit
    if (state.lastFailureTime && Date.now() - state.lastFailureTime > this.resetTimeout) {
      this.closeCircuit(providerName);
      return false;
    }

    return true;
  }

  private handleProviderFailure(providerName: string, error: unknown): void {
    const state = this.circuitBreakers.get(providerName);
    if (!state) return;

    state.failureCount++;
    state.lastFailureTime = Date.now();

    if (state.failureCount >= this.failureThreshold) {
      state.isOpen = true;
      storyLogger.warn({ provider: providerName }, "Circuit breaker opened due to repeated failures");
    }
  }

  private resetCircuit(providerName: string): void {
    const state = this.circuitBreakers.get(providerName);
    if (!state) return;

    state.failureCount = 0;
    state.isOpen = false;
    state.lastFailureTime = null;
  }

  private closeCircuit(providerName: string): void {
    const state = this.circuitBreakers.get(providerName);
    if (!state) return;

    state.isOpen = false;
    state.failureCount = 0;
    storyLogger.info({ provider: providerName }, "Circuit breaker closed after reset timeout");
  }

  // Health check for all providers
  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const provider of this.providers) {
      try {
        results[provider.getName()] = await provider.isHealthy();
      } catch (error) {
        results[provider.getName()] = false;
      }
    }
    
    return results;
  }
}