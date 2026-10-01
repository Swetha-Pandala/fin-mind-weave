import { appConfig, type ProviderId } from "@/config/app";

/**
 * LLM provider abstraction. DEMO MODE uses deterministic templated synthesis so the
 * app works end-to-end without paid API keys. Real providers should be implemented
 * inside a server function (createServerFn) that reads keys from server env vars —
 * never from the browser.
 */
export interface LLMProvider {
  id: ProviderId;
  label: string;
  model: string;
  available: boolean;
  /** Polishes a drafted response. Demo mode returns the draft unchanged. */
  refine(draft: string): Promise<string>;
}

const demo: LLMProvider = {
  id: "demo",
  label: "Deterministic Demo Mode",
  model: "rules-v1 (no LLM)",
  available: true,
  refine: async (draft) => draft,
};

function notConfigured(id: ProviderId, label: string, model: string): LLMProvider {
  return {
    id,
    label,
    model,
    available: false,
    refine: async () => {
      throw new Error(`${label} is not configured. Add a server-side implementation and API key, see .env.example.`);
    },
  };
}

export const providers: Record<ProviderId, LLMProvider> = {
  demo,
  openai: notConfigured("openai", "OpenAI", "gpt-4.1"),
  anthropic: notConfigured("anthropic", "Anthropic", "claude-sonnet"),
  bedrock: notConfigured("bedrock", "AWS Bedrock", "anthropic.claude-v3"),
};

/** Returns the configured provider, falling back to demo mode when unavailable. */
export function getProvider(): LLMProvider {
  const p = providers[appConfig.provider];
  return p.available ? p : demo;
}
