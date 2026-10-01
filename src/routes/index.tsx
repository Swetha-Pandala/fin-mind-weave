import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Database, Gauge, Receipt, ShieldAlert, Timer } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/app/AppShell";
import { AgentPath, EmptyState, Kpi, Panel, Pill, RiskBadge, axisProps, compactUSD, tooltipStyle } from "@/components/app/widgets";
import { appConfig, SUGGESTED_PROMPTS } from "@/config/app";
import { getTransactions } from "@/data/transactions";
import { indexStats } from "@/services/retrieval";
import { anomalies, cashFlowByMonth, fmtUSD } from "@/services/analytics";
import { useRuns } from "@/services/run-store";
import { INTENT_LABEL } from "@/services/orchestrator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Multi-Agent Financial Intelligence Platform" },
      { name: "description", content: "Agentic AI + RAG portfolio demo for grounded financial operations analysis with synthetic data." },
      { property: "og:title", content: "Multi-Agent Financial Intelligence Platform" },
      { property: "og:description", content: "Multi-agent orchestration, RAG citations and explainable risk analysis on synthetic financial data." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const runs = useRuns();
  const latest = runs[0];
  const stats = indexStats();
  const txs = getTransactions();
  const cf = cashFlowByMonth();
  const an = anomalies(appConfig.currentMonth);

  return (
    <div className="hero-glow -mx-4 -mt-6 px-4 pt-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-8">
      <PageHeader
        title={appConfig.name}
        subtitle={appConfig.tagline}
        actions={
          <Link to="/assistant" className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Open AI Assistant <ArrowRight className="size-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Transactions" value={String(txs.length)} hint={`${an.length} anomalies this month`} icon={<Receipt className="size-4" />} />
        <Kpi label="Indexed documents" value={String(stats.documents)} hint={`${stats.chunks} chunks indexed`} icon={<Database className="size-4" />} />
        <Kpi label="Latest risk score" value={latest ? String(latest.response.risk.score) : "—"} hint={latest ? `${latest.response.risk.level} risk` : "No runs yet"} icon={<ShieldAlert className="size-4" />} />
        <Kpi label="Latest latency" value={latest ? `${latest.metrics.totalLatencyMs} ms` : "—"} hint={latest ? `${latest.path.length} agents` : "No runs yet"} icon={<Timer className="size-4" />} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Panel title="Quick prompts" description="Run a multi-agent workflow in one click." className="xl:col-span-1">
          <ul className="space-y-2">
            {SUGGESTED_PROMPTS.map((p) => (
              <li key={p}>
                <Link to="/assistant" search={{ q: p }} className="group flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm transition-colors hover:border-primary/50 hover:bg-primary/5">
                  <span>{p}</span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Operating cash flow" description="Inflows vs outflows, excluding internal reserve sweeps." className="xl:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={cf} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis tickFormatter={compactUSD} {...axisProps} width={52} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => fmtUSD(v)} />
                <Area type="monotone" dataKey="inflow" name="Inflow" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="outflow" name="Outflow" stroke="var(--chart-5)" fill="var(--chart-5)" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel
        title="Recent analysis history"
        className="mt-4"
        actions={<Link to="/observability" className="text-xs text-primary hover:underline">View all runs</Link>}
      >
        {runs.length === 0 ? (
          <EmptyState title="Loading run history…" body="Example runs are generated locally in demo mode." />
        ) : (
          <ul className="divide-y divide-border">
            {runs.slice(0, 5).map((r) => (
              <li key={r.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.prompt}</div>
                  <div className="mt-1.5"><AgentPath path={r.path} steps={r.steps} /></div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Pill>{INTENT_LABEL[r.intent]}</Pill>
                  {r.status === "failed" ? <Pill tone="danger">Failed</Pill> : <RiskBadge level={r.response.risk.level} score={r.response.risk.score} />}
                  <span className="tabular flex items-center gap-1 text-xs text-muted-foreground"><Gauge className="size-3" />{r.metrics.totalLatencyMs} ms</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
