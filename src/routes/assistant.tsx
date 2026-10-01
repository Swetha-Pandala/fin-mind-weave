import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, CornerDownLeft, Loader2, Network, User } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { AgentPath, Panel, Pill } from "@/components/app/widgets";
import { ResponseView } from "@/components/app/ResponseView";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SUGGESTED_PROMPTS } from "@/config/app";
import type { AgentName, AgentRun, AgentStep } from "@/domain/types";
import { runAgents } from "@/services/orchestrator";
import { addRun } from "@/services/run-store";

export const Route = createFileRoute("/assistant")({
  validateSearch: (s: Record<string, unknown>): { q?: string; tx?: string } => ({
    q: typeof s.q === "string" ? s.q : undefined,
    tx: typeof s.tx === "string" ? s.tx : undefined,
  }),
  head: () => ({
    meta: [
      { title: "AI Assistant — Multi-Agent Financial Intelligence" },
      { name: "description", content: "Ask grounded questions about synthetic transactions and policies; see agent traces and citations." },
      { property: "og:title", content: "AI Assistant — Multi-Agent Financial Intelligence" },
      { property: "og:description", content: "Enterprise chat with supervisor routing, RAG citations and explainable risk assessment." },
    ],
  }),
  component: Assistant,
});

interface Exchange { prompt: string; run?: AgentRun; live: AgentStep[]; path: AgentName[] }

function Assistant() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/assistant" });
  const [input, setInput] = useState("");
  const [items, setItems] = useState<Exchange[]>([]);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function ask(prompt: string, txId?: string) {
    const q = prompt.trim();
    if (!q || busy) return;
    setBusy(true);
    setInput("");
    const idx = items.length;
    setItems((xs) => [...xs, { prompt: q, live: [], path: [] }]);
    try {
      const run = await runAgents(q, {
        txId,
        simulateDelay: true,
        onStep: (step, path) => setItems((xs) => xs.map((x, i) => (i === idx ? { ...x, live: [...x.live, step], path } : x))),
      });
      addRun(run);
      setItems((xs) => xs.map((x, i) => (i === idx ? { ...x, run, path: run.path } : x)));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (started.current || !search.q) return;
    started.current = true;
    void ask(search.q, search.tx);
    void navigate({ to: ".", search: {}, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [items]);

  const latest = [...items].reverse().find((x) => x.run || x.live.length);
  const latestRun = latest?.run;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(input);
  }

  return (
    <div>
      <PageHeader title="AI Assistant" subtitle="Supervisor-routed agents with grounded citations. Every run is traced." />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="surface flex min-h-[70vh] flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6" aria-live="polite">
            {items.length === 0 && (
              <div className="mx-auto max-w-xl py-8 text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-lg border border-primary/40 bg-primary/10 text-primary"><Network className="size-6" /></div>
                <h2 className="mt-4 text-lg font-semibold">Ask about transactions, policies or risk</h2>
                <p className="mt-1 text-sm text-muted-foreground">Answers include evidence, a risk assessment and exact policy citations.</p>
                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button key={p} type="button" onClick={() => void ask(p)} className="rounded-md border border-border bg-muted/30 px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {items.map((x, i) => (
              <div key={i} className="space-y-4">
                <div className="flex justify-end gap-2">
                  <div className="max-w-[85%] rounded-lg bg-primary px-3.5 py-2 text-sm text-primary-foreground">{x.prompt}</div>
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary"><User className="size-3.5" /></div>
                </div>
                <div className="flex gap-3">
                  <div className="grid size-7 shrink-0 place-items-center rounded-md border border-primary/40 bg-primary/10 text-primary"><Bot className="size-4" /></div>
                  <div className="min-w-0 flex-1 space-y-3">
                    {x.path.length > 0 && <AgentPath path={x.path} steps={x.run?.steps ?? x.live} active={!x.run} />}
                    {x.run ? (
                      <ResponseView run={x.run} />
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />{x.live.at(-1)?.detail ?? "Supervisor is planning the workflow…"}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form onSubmit={onSubmit} className="border-t border-border p-3">
            <label htmlFor="prompt" className="sr-only">Ask a question</label>
            <div className="flex items-end gap-2">
              <Textarea
                id="prompt"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void ask(input);
                  }
                }}
                placeholder="e.g. Does the vendor payment policy require approval for TX-10100?"
                rows={2}
                className="min-h-[52px] resize-none bg-background"
              />
              <Button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="h-[52px] w-12 shrink-0">
                {busy ? <Loader2 className="animate-spin" /> : <CornerDownLeft />}
              </Button>
            </div>
          </form>
        </div>

        <aside className="space-y-4">
          <Panel title="Agent trace" description="Step-by-step execution of the latest run.">
            {latest ? (
              <ol className="space-y-3">
                {(latestRun?.steps ?? latest.live).map((s, i) => (
                  <li key={i} className="relative border-l border-border pl-4">
                    <span className={`absolute -left-[5px] top-1.5 size-2.5 rounded-full ${s.status === "failed" ? "bg-danger" : "bg-primary"}`} aria-hidden />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{s.agent}</span>
                      <span className="tabular font-mono text-[11px] text-muted-foreground">{s.latencyMs} ms</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{s.action}</div>
                    <p className="mt-1 text-xs leading-relaxed">{s.detail}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {s.toolCalls.map((t) => (
                        <Pill key={t.name} tone={t.status === "ok" ? "success" : t.status === "empty" ? "warning" : "danger"}>
                          <span className="font-mono">{t.name}</span>
                        </Pill>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">Run a prompt to see the agent trace.</p>
            )}
          </Panel>
          <Panel title="Latest run metrics">
            {latestRun ? (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Total latency", `${latestRun.metrics.totalLatencyMs} ms`],
                  ["Chunks retrieved", String(latestRun.metrics.retrievedChunks)],
                  ["Grounding", latestRun.metrics.groundingScore.toFixed(2)],
                  ["Relevance", latestRun.metrics.relevanceScore.toFixed(2)],
                  ["Est. tokens", latestRun.metrics.estTokens.toLocaleString()],
                  ["Est. cost", `$${latestRun.metrics.estCostUsd.toFixed(4)}`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="tabular font-semibold">{v}</dd>
                  </div>
                ))}
                <div className="col-span-2 text-xs text-muted-foreground">Provider: {latestRun.provider}</div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">{busy ? "Running…" : "No completed run in this session yet."}</p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
