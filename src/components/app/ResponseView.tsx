import type { ReactNode } from "react";
import type { AgentRun } from "@/domain/types";
import { CitationCard, Pill, RiskBadge } from "./widgets";
import { INTENT_LABEL } from "@/services/orchestrator";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function ResponseView({ run }: { run: AgentRun }) {
  const r = run.response;
  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex flex-wrap items-center gap-2">
        <Pill>{INTENT_LABEL[run.intent]}</Pill>
        {run.status === "failed" ? <Pill tone="danger">Failed</Pill> : <Pill tone="success">Grounded · {r.citations.length} citation(s)</Pill>}
        {r.groundingNote && <Pill tone="warning">{r.groundingNote}</Pill>}
      </div>
      <Section title="Summary">
        <p className="text-sm leading-relaxed">{r.summary}</p>
      </Section>
      {r.keyFindings.length > 0 && (
        <Section title="Key Findings">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed marker:text-primary">
            {r.keyFindings.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </Section>
      )}
      {r.evidence.length > 0 && (
        <Section title="Evidence">
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {r.evidence.map((e) => (
              <div key={e.label} className="rounded-md border border-border bg-muted/40 p-2.5">
                <dt className="truncate text-[11px] text-muted-foreground" title={e.label}>{e.label}</dt>
                <dd className="tabular mt-0.5 text-sm font-semibold">{e.value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
      <Section title="Risk Assessment">
        <div className="mb-2"><RiskBadge level={r.risk.level} score={r.risk.score} /></div>
        <ul className="space-y-1 text-sm text-foreground/90">
          {r.risk.indicators.map((x, i) => <li key={i}>• {x}</li>)}
        </ul>
      </Section>
      <Section title="Recommended Next Steps">
        <ol className="list-decimal space-y-1 pl-5 text-sm marker:text-muted-foreground">
          {r.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </Section>
      <Section title="Sources">
        {r.citations.length ? (
          <div className="grid gap-2 md:grid-cols-2">
            {r.citations.map((c, i) => <CitationCard key={c.docId + c.sectionLabel} c={c} index={i} />)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No supporting document was found. No citations were generated.</p>
        )}
      </Section>
    </div>
  );
}
