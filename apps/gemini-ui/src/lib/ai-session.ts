/**
 * AI credentials are session-only in this platform phase.
 *
 * The previous renderer persisted API keys in localStorage. That is not an
 * acceptable credential store. Until Mission 14 adds a native safeStorage
 * capability, keys stay in page memory and disappear when the application
 * closes. Nothing here touches localStorage.
 */

export type AiProvider = 'openrouter' | 'openai' | 'anthropic';

let sessionApiKey = '';
let sessionProvider: AiProvider = 'openrouter';

export function getAiSession(): { apiKey: string; provider: AiProvider } {
  return { apiKey: sessionApiKey, provider: sessionProvider };
}

export function setAiSession(apiKey: string, provider: AiProvider): void {
  sessionApiKey = apiKey.trim();
  sessionProvider = provider;
}

export function clearAiSession(): void {
  sessionApiKey = '';
  sessionProvider = 'openrouter';
}

export function hasAiSession(): boolean {
  return sessionApiKey.length > 0;
}
