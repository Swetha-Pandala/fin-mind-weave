import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Bot, Database, FileSearch, LineChart, PenLine, ShieldCheck, User, Waypoints } from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/app/AppShell";
import { Panel, Pill } from "@/components/app/widgets";
import { appConfig } from "@/config/app";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "Architecture — Multi-Agent Financial Intelligence Platform" },
      { name: "description", content: "How the supervisor, retrieval, analyst, risk and report writer agents work together. A fresh portfolio implementation by Swetha Pandala." },
      { property: "og:title", content: "Architecture — Multi-Agent Financial Intelligence Platform" },
      { property: "og:description", content: "Flow diagram, tech stack and engineering practices behind this agentic AI + RAG portfolio project." },
    ],
  }),
  component: ArchitecturePage,
});

function Node({ icon, title, sub, tone = "default" }: { icon: ReactNode; title: string; sub: string; tone?: "default" | "primary" }) {
  return (
    <div className={`rounded-md border p-3 ${tone === "primary" ? "border-primary/50 bg-primary/10" : "border-border bg-muted/30"}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

const Down = () => <div className="flex justify-center py-1.5 text-muted-foreground"><ArrowDown className="size-4" aria-hidden /></div>;

const DEMONSTRATES = [
  ["Multi-agent orchestration", "A supervisor classifies intent and routes to a planned path of specialist agents."],
  ["Retrieval-augmented generation", "Section-level chunk index with relevance thresholds; answers are withheld when nothing is retrieved."],
  ["Structured + unstructured data", "Joins ledger analytics with policy text in one grounded response."],
  ["Explainability", "Every answer exposes findings, evidence, risk indicators and the full agent trace."],
  ["Citations", "Exact document title and section label, validated against retrieved passages — never fabricated."],
  ["Evaluation", "Grounding and relevance scores, retrieved chunk counts and failure reasons per run."],
  ["Observability", "Per-agent latency, tool-call status and token/cost estimates."],
  ["Production-minded design", "Typed domain model, provider abstraction, centralized config, no secrets in source."],
];

const STACK = ["React 19", "TypeScript", "TanStack Start & Router", "Tailwind CSS v4", "shadcn/ui", "Recharts", "Provider abstraction: OpenAI · Anthropic · AWS Bedrock", "PostgreSQL / pgvector ready"];

function ArchitecturePage() {
  return (
    <div>
      <PageHeader title="Architecture & About" subtitle="A fresh portfolio implementation using synthetic data." />

      <div className="mb-4 rounded-md border border-gold/40 bg-gold/10 p-4 text-sm">
        <strong className="text-gold">Portfolio notice.</strong> This is a fresh portfolio implementation by {appConfig.author}, built with synthetic transactions and fictional policy documents. It is not a recovered or production banking system.
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Agent flow" description="User → Supervisor → specialist agents → tools → Report Writer → grounded response">
          <div className="mx-auto max-w-2xl">
            <Node icon={<User className="size-4 text-primary" />} title="User" sub="Natural-language question, optionally scoped to a transaction" />
            <Down />
            <Node tone="primary" icon={<Waypoints className="size-4 text-primary" />} title="Supervisor / Router Agent" sub="Intent classification and workflow planning" />
            <Down />
            <div className="grid gap-2 sm:grid-cols-3">
              <Node icon={<FileSearch className="size-4 text-primary" />} title="Retrieval Agent" sub="Policy search, grounded citations" />
              <Node icon={<LineChart className="size-4 text-primary" />} title="Transaction Analyst" sub="Spend, cash flow, merchants, anomalies" />
              <Node icon={<ShieldCheck className="size-4 text-primary" />} title="Risk & Compliance" sub="Indicator-based, non-advisory risk" />
            </div>
            <Down />
            <div className="grid gap-2 sm:grid-cols-2">
              <Node icon={<Database className="size-4 text-muted-foreground" />} title="Knowledge index" sub="Section chunks · TF-IDF (pgvector-ready)" />
              <Node icon={<Database className="size-4 text-muted-foreground" />} title="Ledger & analytics tools" sub="Typed aggregation services" />
            </div>
            <Down />
            <Node tone="primary" icon={<PenLine className="size-4 text-primary" />} title="Report Writer Agent" sub="Summary · findings · evidence · risk · next steps · sources" />
            <Down />
            <Node icon={<Bot className="size-4 text-primary" />} title="Grounded response + trace" sub="Citations validated; metrics logged to evaluation" />
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Tech stack">
            <div className="flex flex-wrap gap-1.5">{STACK.map((s) => <Pill key={s}>{s}</Pill>)}</div>
          </Panel>
          <Panel title="Code structure" description={`GitHub-ready: ${appConfig.repo}`}>
            <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-xs leading-relaxed">{`src/
  config/      centralized app config
  domain/      typed interfaces
  data/        synthetic seed data
  services/    orchestrator · retrieval · analytics
               risk · reporting · providers · run-store
  components/  app shell, widgets, response view
  routes/      dashboard · assistant · transactions
               knowledge · reports · observability`}</pre>
          </Panel>
          <Panel title="Model providers">
            <p className="text-sm text-muted-foreground">Runs in deterministic <strong className="text-foreground">DEMO MODE</strong> with no paid API keys. OpenAI, Anthropic or AWS Bedrock can be enabled later through server-side environment variables behind a shared provider interface.</p>
          </Panel>
        </div>
      </div>

      <Panel title="What this project demonstrates" className="mt-4">
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {DEMONSTRATES.map(([t, d]) => (
            <li key={t} className="rounded-md border border-border p-3">
              <div className="flex items-center gap-1.5 text-sm font-semibold"><ArrowRight className="size-3.5 text-primary" />{t}</div>
              <p className="mt-1 text-xs text-muted-foreground">{d}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
