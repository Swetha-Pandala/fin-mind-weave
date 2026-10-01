import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, CircleDashed, FileText, XCircle } from "lucide-react";
import type { AgentName, AgentStep, Citation, RiskLevel } from "@/domain/types";
import { riskTone } from "@/services/risk";
import { cn } from "@/lib/utils";

export function Panel({ title, description, actions, children, className }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("surface p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-sm font-semibold tracking-tight">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="surface animate-fade-up p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className="tabular mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

const toneClass = {
  danger: "border-danger/40 bg-danger/10 text-danger",
  warning: "border-warning/40 bg-warning/10 text-warning",
  gold: "border-gold/40 bg-gold/10 text-gold",
  success: "border-success/40 bg-success/10 text-success",
  muted: "border-border bg-muted text-muted-foreground",
} as const;

export function Pill({ tone = "muted", children }: { tone?: keyof typeof toneClass; children: ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px] font-medium", toneClass[tone])}>{children}</span>;
}

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  return <Pill tone={riskTone(level)}>{level}{score !== undefined && ` · ${score}`}</Pill>;
}

export function scoreTone(score: number): keyof typeof toneClass {
  return score >= 70 ? "danger" : score >= 40 ? "warning" : "success";
}

const ALL_AGENTS: AgentName[] = ["Supervisor", "Retrieval", "Transaction Analyst", "Risk & Compliance", "Report Writer"];

export function AgentPath({ path, steps, active }: { path: AgentName[]; steps?: AgentStep[]; active?: boolean }) {
  return (
    <ol className="flex flex-wrap items-center gap-1.5" aria-label="Agent path">
      {ALL_AGENTS.filter((a) => path.includes(a)).map((a, i, arr) => {
        const step = steps?.find((s) => s.agent === a);
        const running = active && !step && (i === 0 || steps?.some((s) => s.agent === arr[i - 1]));
        const state = step?.status === "failed" ? "failed" : step ? "done" : running ? "running" : "idle";
        return (
          <li key={a} className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs",
                state === "done" && "border-primary/40 bg-primary/10 text-primary",
                state === "failed" && "border-danger/40 bg-danger/10 text-danger",
                state === "running" && "animate-pulse border-gold/40 bg-gold/10 text-gold",
                state === "idle" && "border-border text-muted-foreground",
              )}
            >
              {state === "done" ? <CheckCircle2 className="size-3" /> : state === "failed" ? <XCircle className="size-3" /> : <CircleDashed className="size-3" />}
              {a}
            </span>
            {i < arr.length - 1 && <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

export function CitationCard({ c, index }: { c: Citation; index?: number }) {
  return (
    <article className="rounded-md border border-border bg-muted/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <FileText className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <div>
            <div className="text-xs font-semibold">{index !== undefined && <span className="mr-1 text-primary">[{index + 1}]</span>}{c.docTitle}</div>
            <div className="font-mono text-[11px] text-muted-foreground">{c.sectionLabel}</div>
          </div>
        </div>
        <span className="tabular font-mono text-[11px] text-muted-foreground">{c.score.toFixed(2)}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-foreground/85">“{c.excerpt}”</p>
    </article>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border px-6 py-10 text-center">
      <AlertTriangle className="size-5 text-muted-foreground" aria-hidden />
      <div className="mt-2 text-sm font-medium">{title}</div>
      {body && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
export const axisProps = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;
export const tooltipStyle = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, color: "var(--popover-foreground)" },
  labelStyle: { color: "var(--muted-foreground)" },
  cursor: { fill: "color-mix(in oklab, var(--muted) 60%, transparent)" },
} as const;
export const compactUSD = (v: number) => (Math.abs(v) >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`);
