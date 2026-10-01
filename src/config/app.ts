// Centralized, non-secret application configuration.
// Provider API keys are NEVER read here — they belong to server-side env only (see .env.example).

export type ProviderId = "demo" | "openai" | "anthropic" | "bedrock";

const envProvider = (import.meta.env["VITE_AI_PROVIDER"] as string | undefined)?.toLowerCase();

export const appConfig = {
  name: "Multi-Agent Financial Intelligence Platform",
  shortName: "FinIntel Agents",
  tagline: "Agentic AI + RAG for grounded financial operations analysis",
  author: "Swetha Pandala",
  repo: "multi-agent-financial-intelligence-platform",
  disclaimer:
    "Demo application using synthetic data. Outputs are for demonstration only and are not financial advice.",
  provider: (["openai", "anthropic", "bedrock"].includes(envProvider ?? "") ? envProvider : "demo") as ProviderId,
  currentMonth: "2026-09",
  previousMonth: "2026-08",
  retrieval: { topK: 4, minScore: 0.12, chunkSizeTokens: 220 },
  // Placeholder per-1K-token blended price used for cost estimates.
  costPer1kTokensUsd: 0.004,
  storageKey: "mafip.runs.v2",
} as const;

export const SUGGESTED_PROMPTS = [
  "Which transactions look unusual this month?",
  "What were the largest expense changes by category?",
  "Does the vendor payment policy require approval for this transaction?",
  "Summarize current cash-flow risk.",
  "Which merchants changed the most month over month?",
  "Generate an executive anomaly report.",
] as const;
