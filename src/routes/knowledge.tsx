import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { CitationCard, EmptyState, Panel, Pill } from "@/components/app/widgets";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { knowledgeDocuments } from "@/data/documents";
import { chunkCount, indexStats, retrieve } from "@/services/retrieval";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge Base — Multi-Agent Financial Intelligence" },
      { name: "description", content: "Synthetic financial policy corpus indexed for retrieval-augmented generation with section-level citations." },
      { property: "og:title", content: "Knowledge Base — Multi-Agent Financial Intelligence" },
      { property: "og:description", content: "Searchable policy documents, chunk metadata and live retrieval preview." },
    ],
  }),
  component: KnowledgePage,
});

function KnowledgePage() {
  const [filter, setFilter] = useState("");
  const [activeId, setActiveId] = useState(knowledgeDocuments[0]!.id);
  const [query, setQuery] = useState("approval required for vendor payment over threshold");
  const [submitted, setSubmitted] = useState(query);
  const stats = indexStats();

  const docs = useMemo(() => {
    const f = filter.toLowerCase();
    return knowledgeDocuments.filter((d) => !f || `${d.title} ${d.type} ${d.summary} ${d.owner}`.toLowerCase().includes(f));
  }, [filter]);
  const active = knowledgeDocuments.find((d) => d.id === activeId)!;
  const hits = useMemo(() => retrieve(submitted), [submitted]);

  return (
    <div>
      <PageHeader title="Knowledge Base" subtitle={`${stats.documents} synthetic documents · ${stats.chunks} section chunks indexed`} />

      <Panel title="Retrieval preview" description="Test what the Retrieval Agent would return for a query." className="mb-4">
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); setSubmitted(query); }}>
          <Input aria-label="Retrieval query" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask a policy question…" />
          <Button type="submit" disabled={!query.trim()}>Retrieve</Button>
        </form>
        <div className="mt-4">
          {hits.length ? (
            <div className="grid gap-2 md:grid-cols-2">{hits.map((c, i) => <CitationCard key={c.docId + c.sectionLabel} c={c} index={i} />)}</div>
          ) : (
            <EmptyState title="No supporting document found" body="No passage scored above the relevance threshold. The assistant would decline to cite." />
          )}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Panel title="Documents">
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input aria-label="Filter documents" placeholder="Filter documents…" value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-8" />
          </div>
          {docs.length === 0 ? (
            <EmptyState title="No documents match" />
          ) : (
            <ul className="space-y-1.5">
              {docs.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(d.id)}
                    aria-current={d.id === activeId}
                    className={cn("w-full rounded-md border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", d.id === activeId ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted/40")}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium"><FileText className="size-4 text-primary" />{d.title}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Pill>{d.type}</Pill>
                      <Pill tone="success">Indexed</Pill>
                      <Pill>{chunkCount(d.id)} chunks</Pill>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={active.title} description={active.summary}>
          <dl className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[["Type", active.type], ["Owner", active.owner], ["Version", active.version], ["Updated", active.updated]].map(([k, v]) => (
              <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
          </dl>
          <div className="space-y-3">
            {active.sections.map((s) => (
              <section key={s.id} className="rounded-md border border-border p-3">
                <h3 className="font-mono text-xs font-semibold text-primary">{s.label}</h3>
                <p className="mt-1 text-sm leading-relaxed">{s.text}</p>
              </section>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
