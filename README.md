# Multi-Agent Financial Intelligence Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TanStack Start](https://img.shields.io/badge/TanStack_Start-v1-E0234E)](https://tanstack.com/start)
[![Tailwind v4](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Demo Mode](https://img.shields.io/badge/DEMO_MODE-no_API_keys-10B981)](#quick-start)
[![License: MIT](https://img.shields.io/badge/License-MIT-4B5563)](LICENSE)

A recruiter-ready portfolio implementation by **Swetha Pandala** demonstrating multi-agent orchestration, RAG with grounded citations, deterministic financial analytics, explainable risk assessment, and run-level observability — all on synthetic data, fully functional with **zero API keys**.

> **Disclaimer:** Demo application using synthetic data. Outputs are for demonstration only and are not financial advice. This is a fresh portfolio implementation, not a production or recovered system.

| | |
|---|---|
| ![Dashboard](public/screenshots/dashboard.png) | ![AI Assistant](public/screenshots/assistant.png) |
| *Dashboard — KPIs, quick prompts, cash-flow chart* | *AI Assistant — grounded response with citations & run metrics* |
| ![Observability](public/screenshots/observability.png) | |
| *Evaluation & Observability — quality trend + run traces* | |

## What it demonstrates

- **Multi-agent orchestration** — a Supervisor classifies natural-language queries into 8 intents and routes each through a dynamic agent path, so simple questions skip unnecessary agents.
- **RAG with a grounding contract** — retrieval over section-chunked internal policy documents; the Report Writer may only attach citations returned by the retriever, and withholds answers when nothing relevant is found (no fabrication).
- **Structured, explainable output** — every response is a typed `StructuredResponse` (summary, key findings, evidence, risk assessment, next steps, sources), rendered in dedicated UI widgets.
- **Deterministic analytics** — anomaly detection, category/merchant deltas, cash-flow analysis and approval-threshold logic run as pure functions over the ledger; money math is never left to an LLM.
- **Observability & evaluation** — every run records per-agent latency, tool-call status, retrieved chunks, grounding/relevance scores, and token/cost estimates; failures are traced and attributed to the responsible agent.
- **Provider abstraction** — a demo provider enables no-key operation; real providers (OpenAI / Anthropic / Bedrock) plug in via server-side code only, keeping secrets out of the browser.

## Agent pipeline

```
User prompt
     │
     ▼
Supervisor ── classify intent & plan path (8 intents, 4 pipeline shapes)
     │
     ▼
Retrieval (RAG) ── TF-IDF over policy section chunks · top_k=4 · relevance floor
     │
     ▼
Transaction Analyst ── anomalies, trends, cash flow, approval thresholds
     │
     ▼
Risk & Compliance ── score → Low / Moderate / Elevated / High + indicators
     │
     ▼
Report Writer ── structured response + citations + grounding note
     │
     ▼
AgentRun persisted (path, steps, tool calls, metrics) → Evaluation & Observability
```

## Quick start

```bash
bun install    # or npm install
bun run dev    # or npm run dev
```

Runs out of the box in deterministic **DEMO MODE** — no API keys required. To connect a real LLM provider, see `.env.example` and `src/services/providers.ts`; provider keys are read **server-side only** and never reach the client.

## Project structure

```
src/config      centralized, non-secret configuration
src/domain      typed interfaces (Transaction, KnowledgeDocument, Citation, AgentRun, ...)
src/data        deterministic synthetic seed data (seeded PRNG, lazy build)
src/services    orchestrator, retrieval, analytics, risk, reporting, providers, run-store
src/components  app shell & shared widgets (KPIs, agent path, citation cards)
src/routes      dashboard, assistant, transactions, knowledge, reports, observability, architecture
```

Engineering rules (why each layer exists) are documented in `AGENTS.md`.

## Tech stack

React 19 · TypeScript · TanStack Start v1 (SSR + server functions + file routing) · Vite 7 · Tailwind CSS v4 · shadcn/ui + Radix · TanStack Query · recharts · `useSyncExternalStore` run store.

## Key design decisions

| Decision | Why |
|---|---|
| UI never computes business logic | Agents/analytics live in `src/services/`, testable without React |
| Single traced entry point (`runAgents()`) | One instrumented path for metrics and observability |
| Citations only from retrieval results | Prevents fabricated sources; enforced by a citation validator |
| Deterministic demo provider | End-to-end operation with zero keys; real providers swap in behind the same interface |
| Seeded, deterministic data | Identical SSR/client output; reproducible demos and tests |
| Per-intent agent paths | Cost/latency control — pay only for the agents a query needs |

## Production path

The demo maps directly to real-world deployments (fraud/AML monitoring, AP controls, treasury cash management, internal policy bots): swap localStorage run history for a database behind the same API, TF-IDF retrieval for a hybrid vector store, and add streaming LLM calls in server functions with guardrails, RLS-backed tenancy, and OpenTelemetry-style trace export.

## Author

**Swetha Pandala** — built as a portfolio project demonstrating enterprise-grade agentic AI engineering patterns. All data is synthetic.

Licensed under [MIT](LICENSE).
