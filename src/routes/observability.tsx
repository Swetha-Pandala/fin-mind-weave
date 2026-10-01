import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { PageHeader } from "@/components/app/AppShell";
import { AgentPath, EmptyState, Kpi, Panel, Pill, axisProps, tooltipStyle } from "@/components/app/widgets";
import { Button } from "@/components/ui/button";
import { clearRuns, useRuns } from "@/services/run-store";
import { INTENT_LABEL } from "@/services/orchestrator";

export const Route = createFileRoute("/observability")({
  head: () => ({
    meta: [
      { title: "Evaluation & Observability — Multi-Agent Financial Intelligence" },
      { name: "description", content: "Run history with agent paths, latency, grounding and relevance scores, token estimates and tool-call status." },
      { property: "og:title", content: "Evaluation & Observability — Multi-Agent Financial Intelligence" },
      { property: "og:description", content: "Trace every agent run: latency, grounding, relevance, cost and failures." },
    ],
  }),
  component: ObservabilityPage,
});

function ObservabilityPage() {
  const runs = useRuns();
  const [open, setOpen] = useState<string | null>(null);
  const ok = runs.filter((r) => r.status === "success");
  const avg = (f: (n: (typeof runs)[number]) => number, list = ok) => (list.length ? list.reduce((s, r) => s + f(r), 0) / list.length : 0);
  const trend = [...runs].reverse().map((r, i) => ({ name: `#${i + 1}`, grounding: r.metrics.groundingScore, relevance: r.metrics.relevanceScore }));

  return (
    <div>
      <PageHeader
        title="Evaluation & Observability"
        subtitle="Every run is traced with latency, retrieval, grounding and tool-call status."
        actions={runs.length > 0 && <Button variant="outline" onClick={clearRuns}><Trash2 /> Clear history</Button>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Total runs" value={String(runs.length)} hint={`${runs.length - ok.length} failed`} />
        <Kpi label="Avg latency" value={`${Math.round(avg((r) => r.metrics.totalLatencyMs))} ms`} />
        <Kpi label="Avg grounding" value={avg((r) => r.metrics.groundingScore).toFixed(2)} />
        <Kpi label="Avg relevance" value={avg((r) => r.metrics.relevanceScore).toFixed(2)} />
        <Kpi label="Est. cost (total)" value={`$${runs.reduce((s, r) => s + r.metrics.estCostUsd, 0).toFixed(4)}`} hint="Placeholder pricing" />
      </div>

      {trend.length > 1 && (
        <Panel title="Quality trend" description="Grounding and relevance per run" className="mt-4">
          <div className="h-52"><ResponsiveContainer>
            <LineChart data={trend}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis domain={[0, 1]} width={36} {...axisProps} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line dataKey="grounding" name="Grounding" stroke="var(--chart-1)" strokeWidth={2} />
              <Line dataKey="relevance" name="Relevance" stroke="var(--chart-3)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer></div>
        </Panel>
      )}

      <Panel title="Run history" className="mt-4">
        {runs.length === 0 ? (
          <EmptyState title="No runs recorded" body="Ask the assistant a question to generate a traced run." action={<Link to="/assistant" className="text-sm text-primary hover:underline">Open AI Assistant</Link>} />
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>{["", "Run", "Prompt / path", "Latency", "Chunks", "Grounding", "Relevance", "Tokens · cost", "Tools", "Status"].map((h) => <th key={h} scope="col" className="px-3 py-2 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runs.map((r) => {
                  const tools = r.steps.flatMap((s) => s.toolCalls);
                  const isOpen = open === r.id;
                  return (
                    <Fragment key={r.id}>
                      <tr className="align-top">
                        <td className="px-2 py-2">
                          <Button variant="ghost" size="icon" className="size-7" aria-expanded={isOpen} aria-label={isOpen ? "Collapse run" : "Expand run"} onClick={() => setOpen(isOpen ? null : r.id)}>
                            {isOpen ? <ChevronDown /> : <ChevronRight />}
                          </Button>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-mono text-xs">{r.id}</div>
                          <div className="text-[11px] text-muted-foreground">{new Date(r.createdAt).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" })} UTC</div>
                        </td>
                        <td className="max-w-md px-3 py-2">
                          <div className="truncate font-medium">{r.prompt}</div>
                          <div className="mb-1 text-[11px] text-muted-foreground">{INTENT_LABEL[r.intent]}</div>
                          <AgentPath path={r.path} steps={r.steps} />
                        </td>
                        <td className="tabular px-3 py-2">{r.metrics.totalLatencyMs} ms</td>
                        <td className="tabular px-3 py-2">{r.metrics.retrievedChunks}</td>
                        <td className="tabular px-3 py-2">{r.metrics.groundingScore.toFixed(2)}</td>
                        <td className="tabular px-3 py-2">{r.metrics.relevanceScore.toFixed(2)}</td>
                        <td className="tabular px-3 py-2">{r.metrics.estTokens.toLocaleString()} · ${r.metrics.estCostUsd.toFixed(4)}</td>
                        <td className="px-3 py-2 text-xs">
                          <span className="text-success">{tools.filter((t) => t.status === "ok").length} ok</span>
                          {tools.some((t) => t.status === "empty") && <span className="ml-1 text-warning">{tools.filter((t) => t.status === "empty").length} empty</span>}
                          {tools.some((t) => t.status === "error") && <span className="ml-1 text-danger">{tools.filter((t) => t.status === "error").length} error</span>}
                        </td>
                        <td className="px-3 py-2">
                          {r.status === "failed" ? <Pill tone="danger">Failed</Pill> : <Pill tone="success">Success</Pill>}
                          {r.failureReason && <div className="mt-1 max-w-[200px] text-[11px] text-danger">{r.failureReason}</div>}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-muted/20">
                          <td colSpan={10} className="px-6 py-3">
                            <ol className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                              {r.steps.map((s, i) => (
                                <li key={i} className="rounded-md border border-border bg-card p-3 text-xs">
                                  <div className="flex justify-between font-medium"><span>{s.agent}</span><span className="tabular font-mono text-muted-foreground">{s.latencyMs} ms</span></div>
                                  <p className="mt-1 text-muted-foreground">{s.detail}</p>
                                  <ul className="mt-2 space-y-0.5 font-mono">
                                    {s.toolCalls.map((t) => <li key={t.name}><span className={t.status === "ok" ? "text-success" : t.status === "empty" ? "text-warning" : "text-danger"}>●</span> {t.name} — {t.summary}</li>)}
                                  </ul>
                                </li>
                              ))}
                            </ol>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
