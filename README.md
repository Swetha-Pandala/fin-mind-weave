# Multi-Agent Financial Intelligence Platform

A fresh portfolio implementation by **Swetha Pandala** demonstrating multi-agent orchestration, RAG with grounded citations, structured financial analytics, explainable risk assessment and run-level observability. **All data is synthetic.** Not financial advice.

## Agents
Supervisor/Router → Retrieval → Transaction Analyst → Risk & Compliance → Report Writer (`src/services/orchestrator.ts`).

## Run
```bash
bun install
bun run dev
```
Works out of the box in deterministic **DEMO MODE** — no API keys. See `.env.example` to configure OpenAI, Anthropic or AWS Bedrock via `src/services/providers.ts` (keys are server-side only).

## Structure
```
src/config     centralized config
src/domain     typed interfaces (Transaction, KnowledgeDocument, Citation, AgentRun, ...)
src/data       synthetic seed transactions & policy documents
src/services   orchestrator, retrieval, analytics, risk, reporting, providers, run-store
src/components app shell & shared widgets
src/routes     dashboard, assistant, transactions, knowledge, reports, observability, architecture
```
