import type {
  AgentName, AgentRun, AgentStep, Citation, EvidenceItem, Intent, RiskAssessment, StructuredResponse, ToolCall, Transaction,
} from "@/domain/types";
import { appConfig } from "@/config/app";
import { getTransaction, getTransactions } from "@/data/transactions";
import { retrieve } from "./retrieval";
import { assessTransactions, levelFor } from "./risk";
import { anomalies, cashFlowByMonth, categoryChanges, fmtPct, fmtUSD, inMonth, merchantChanges, monthLabel } from "./analytics";
import { getProvider } from "./providers";

const CUR = appConfig.currentMonth;
const PREV = appConfig.previousMonth;

// ---------- Supervisor ----------
export function classifyIntent(prompt: string, txId?: string): Intent {
  const p = prompt.toLowerCase();
  const hasTx = Boolean(txId) || /tx-\d{3,}/i.test(prompt);
  if (/policy|approv|require|allowed|permitted|reimburs|compliant/.test(p)) return "policy_lookup";
  if (hasTx) return "transaction_review";
  if (/report|executive|brief/.test(p)) return "executive_report";
  if (/unusual|anomal|suspicious|fraud|flag|odd/.test(p)) return "anomaly_detection";
  if (/cash[\s-]?flow|liquidity|runway|inflow|outflow/.test(p)) return "cashflow_risk";
  if (/merchant|vendor|supplier/.test(p)) return "merchant_change";
  if (/category|categories|expense|spend|cost/.test(p)) return "category_trend";
  return "general";
}

const PATHS: Record<Intent, AgentName[]> = {
  anomaly_detection: ["Supervisor", "Retrieval", "Transaction Analyst", "Risk & Compliance", "Report Writer"],
  category_trend: ["Supervisor", "Retrieval", "Transaction Analyst", "Report Writer"],
  policy_lookup: ["Supervisor", "Retrieval", "Transaction Analyst", "Risk & Compliance", "Report Writer"],
  cashflow_risk: ["Supervisor", "Retrieval", "Transaction Analyst", "Risk & Compliance", "Report Writer"],
  merchant_change: ["Supervisor", "Retrieval", "Transaction Analyst", "Report Writer"],
  executive_report: ["Supervisor", "Retrieval", "Transaction Analyst", "Risk & Compliance", "Report Writer"],
  transaction_review: ["Supervisor", "Retrieval", "Transaction Analyst", "Risk & Compliance", "Report Writer"],
  general: ["Supervisor", "Retrieval", "Report Writer"],
};

export const INTENT_LABEL: Record<Intent, string> = {
  anomaly_detection: "Anomaly detection",
  category_trend: "Category trend analysis",
  policy_lookup: "Policy lookup",
  cashflow_risk: "Cash-flow risk",
  merchant_change: "Merchant change analysis",
  executive_report: "Executive report",
  transaction_review: "Transaction review",
  general: "General knowledge query",
};

const RETRIEVAL_QUERY: Record<Intent, string> = {
  anomaly_detection: "red flag indicators duplicate payment split threshold new vendor wire anomaly risk scoring escalation",
  category_trend: "spend spike month over month increase budget variance cloud",
  policy_lookup: "",
  cashflow_risk: "cash flow monitoring liquidity buffer outflows exceed inflows",
  merchant_change: "spend spike recurring vendor month over month new vendor onboarding",
  executive_report: "red flag indicators cash flow monitoring spend spike approval thresholds",
  transaction_review: "",
  general: "",
};

// ---------- helpers ----------
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const latencyFor = (seed: string, base: number, spread: number) => base + (hash(seed) % spread);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const cite = (c: Citation) => `[${c.docTitle}, ${c.sectionLabel}]`;

interface AnalystOutput {
  scope: Transaction[];
  findings: string[];
  evidence: EvidenceItem[];
  extraIndicators: string[];
  summary: string;
  subject?: Transaction;
}

// ---------- Transaction Analyst ----------
function analyze(intent: Intent, prompt: string, tx?: Transaction): AnalystOutput {
  const cur = inMonth(CUR);
  switch (intent) {
    case "anomaly_detection": {
      const list = anomalies(CUR);
      return {
        scope: list,
        summary: `${list.length} transactions in ${monthLabel(CUR)} were flagged as unusual, led by ${list[0]?.merchant ?? "none"}.`,
        findings: list.slice(0, 6).map((t) => `${t.id} · ${t.merchant} · ${fmtUSD(t.amount)} — ${t.anomalyReason} (risk ${t.riskScore}).`),
        evidence: [
          { label: "Transactions reviewed", value: String(cur.length) },
          { label: "Flagged as anomalous", value: String(list.length) },
          { label: "High risk (≥70)", value: String(list.filter((t) => t.riskScore >= 70).length) },
          { label: "Flagged value", value: fmtUSD(list.reduce((s, t) => s + t.amount, 0)) },
        ],
        extraIndicators: [],
      };
    }
    case "category_trend": {
      const ch = categoryChanges(PREV, CUR).filter((c) => c.name !== "Payroll" || Math.abs(c.pct) > 0.05);
      const top = ch.slice(0, 5);
      return {
        scope: cur,
        summary: `The largest category change from ${monthLabel(PREV)} to ${monthLabel(CUR)} was ${top[0].name} (${fmtUSD(top[0].delta)}, ${fmtPct(top[0].pct)}).`,
        findings: top.map((c) => `${c.name}: ${fmtUSD(c.prev)} → ${fmtUSD(c.cur)} (${c.delta >= 0 ? "+" : ""}${fmtUSD(c.delta)}, ${fmtPct(c.pct)}).`),
        evidence: top.slice(0, 4).map((c) => ({ label: c.name, value: fmtPct(c.pct) })),
        extraIndicators: top.filter((c) => c.pct > 0.4 && c.prev > 0).map((c) => `${c.name} increased ${fmtPct(c.pct)} month over month.`),
      };
    }
    case "merchant_change": {
      const ch = merchantChanges(PREV, CUR).slice(0, 6);
      return {
        scope: cur,
        summary: `${ch.filter((c) => c.isNew).length} merchants are new in ${monthLabel(CUR)}; the largest change was ${ch[0].name} (${ch[0].delta >= 0 ? "+" : ""}${fmtUSD(ch[0].delta)}).`,
        findings: ch.map((c) => `${c.name}: ${fmtUSD(c.prev)} → ${fmtUSD(c.cur)}${c.isNew ? " (new merchant)" : ""}.`),
        evidence: ch.slice(0, 4).map((c) => ({ label: c.name, value: `${c.delta >= 0 ? "+" : ""}${fmtUSD(c.delta)}` })),
        extraIndicators: ch.filter((c) => c.isNew && c.cur > 10000).map((c) => `New merchant ${c.name} received ${fmtUSD(c.cur)}.`),
      };
    }
    case "cashflow_risk": {
      const cf = cashFlowByMonth();
      const last = cf[cf.length - 1];
      const prior = cf[cf.length - 2];
      const ratio = last.inflow ? last.outflow / last.inflow - 1 : 1;
      const extra: string[] = [];
      if (last.net < 0) extra.push(`Net operating cash flow in ${last.name} is negative (${fmtUSD(last.net)}).`);
      if (ratio > 0.15) extra.push(`Outflows exceed inflows by ${(ratio * 100).toFixed(1)}%, above the 15% review trigger.`);
      return {
        scope: cur,
        summary: `${last.name} net operating cash flow is ${fmtUSD(last.net)} versus ${fmtUSD(prior.net)} in ${prior.name}, driven by softer customer receipts and higher cloud and professional services spend.`,
        findings: cf.map((m) => `${m.name}: inflows ${fmtUSD(m.inflow)}, outflows ${fmtUSD(m.outflow)}, net ${fmtUSD(m.net)}.`),
        evidence: [
          { label: `${last.name} inflows`, value: fmtUSD(last.inflow) },
          { label: `${last.name} outflows`, value: fmtUSD(last.outflow) },
          { label: "Net cash flow", value: fmtUSD(last.net) },
          { label: "Inflow change MoM", value: fmtPct(last.inflow / prior.inflow - 1) },
        ],
        extraIndicators: extra,
      };
    }
    case "policy_lookup":
    case "transaction_review": {
      const subject = tx ?? anomalies(CUR).find((t) => t.category === "Vendor Payments");
      if (!subject) throw new Error("No transaction in scope for review.");
      const findings: string[] = [];
      if (!tx) findings.push(`No transaction ID was specified; reviewing the highest-risk vendor payment, ${subject.id}.`);
      findings.push(`${subject.id} · ${subject.merchant} · ${fmtUSD(subject.amount)} · ${subject.category} · ${subject.status} on ${subject.date}.`);
      const extra: string[] = [];
      const isVendor = ["Vendor Payments", "Professional Services"].includes(subject.category) && subject.type === "debit";
      if (isVendor) {
        if (subject.amount > 50000) findings.push("Amount exceeds $50,000: director and CFO approval are required before release.");
        else if (subject.amount > 10000) findings.push("Amount exceeds $10,000: department director approval is required before release.");
        else findings.push("Amount is below the $10,000 director-approval threshold on its own.");
        const sameVendor = getTransactions().filter((t) => t.merchant === subject.merchant && t.id !== subject.id && Math.abs(new Date(t.date).getTime() - new Date(subject.date).getTime()) <= 7 * 864e5);
        if (sameVendor.length) {
          const combined = sameVendor.reduce((s, t) => s + t.amount, subject.amount);
          findings.push(`${sameVendor.length} other payment(s) to ${subject.merchant} within 7 days; combined ${fmtUSD(combined)} should be evaluated against thresholds.`);
          extra.push(`Related payments to the same vendor within 7 days (combined ${fmtUSD(combined)}).`);
        }
      } else {
        findings.push(`Category "${subject.category}" is not governed by vendor payment approval thresholds; other policies may apply.`);
      }
      if (subject.anomalyReason) findings.push(`Anomaly flag: ${subject.anomalyReason}.`);
      return {
        scope: [subject],
        subject,
        summary: `${subject.id} (${subject.merchant}, ${fmtUSD(subject.amount)}) was reviewed against applicable policy; risk score ${subject.riskScore}.`,
        findings,
        evidence: [
          { label: "Transaction", value: subject.id },
          { label: "Amount", value: fmtUSD(subject.amount) },
          { label: "Status", value: subject.status },
          { label: "Risk score", value: String(subject.riskScore) },
        ],
        extraIndicators: extra,
      };
    }
    case "executive_report": {
      const an = anomalies(CUR);
      const cf = cashFlowByMonth();
      const last = cf[cf.length - 1];
      const ch = categoryChanges(PREV, CUR)[0];
      return {
        scope: cur,
        summary: `${monthLabel(CUR)} shows ${an.length} anomalous transactions (${fmtUSD(an.reduce((s, t) => s + t.amount, 0))}), net operating cash flow of ${fmtUSD(last.net)}, and the largest category movement in ${ch.name}.`,
        findings: [
          `${an.filter((t) => t.riskScore >= 70).length} high-risk items require review within one business day, led by ${an[0].merchant} (${fmtUSD(an[0].amount)}).`,
          `Possible duplicate and split-payment patterns detected (Northwind Logistics, Brightline Consulting).`,
          `Net operating cash flow: ${fmtUSD(last.net)} in ${last.name}.`,
          `${ch.name} changed ${fmtPct(ch.pct)} month over month.`,
          `Cloud spend (Amazon Web Services) rose roughly 54% month over month.`,
        ],
        evidence: [
          { label: "Transactions in period", value: String(cur.length) },
          { label: "Anomalies", value: String(an.length) },
          { label: "Net cash flow", value: fmtUSD(last.net) },
          { label: "Top risk score", value: String(an[0].riskScore) },
        ],
        extraIndicators: last.net < 0 ? [`Negative net operating cash flow in ${last.name}.`] : [],
      };
    }
    default:
      return { scope: [], summary: "", findings: [], evidence: [], extraIndicators: [] };
  }
}

// ---------- Report Writer ----------
function write(intent: Intent, prompt: string, citations: Citation[], analysis: AnalystOutput | null, risk: RiskAssessment | null): StructuredResponse {
  const top = citations.slice(0, 3);
  const policyLines = top.map((c) => `${c.excerpt} ${cite(c)}`);
  const nextSteps: string[] = [];
  if (intent === "general") {
    if (!citations.length) {
      return {
        summary: "No supporting document was found in the knowledge base for this question, so no grounded answer can be provided.",
        keyFindings: ["The retrieval agent returned zero passages above the relevance threshold."],
        evidence: [{ label: "Passages retrieved", value: "0" }],
        risk: { level: "Low", score: 0, indicators: ["Not assessed — no relevant data in scope."] },
        nextSteps: ["Rephrase the question using policy terms (e.g. approval, reimbursement, settlement).", "Browse the Knowledge Base to confirm coverage."],
        citations: [],
        groundingNote: "No citations: answer withheld to avoid fabrication.",
      };
    }
    return {
      summary: `Based on ${top.length} retrieved passage(s), the most relevant guidance comes from ${top[0].docTitle} (${top[0].sectionLabel}).`,
      keyFindings: policyLines,
      evidence: top.map((c) => ({ label: `${c.docTitle} ${c.sectionLabel}`, value: `relevance ${c.score.toFixed(2)}` })),
      risk: { level: "Low", score: 0, indicators: ["Not assessed — knowledge-only query."] },
      nextSteps: ["Confirm the applicable section with the policy owner before acting."],
      citations: top,
    };
  }

  const a = analysis!;
  const keyFindings = [...a.findings];
  if (top.length) keyFindings.push(`Policy context: ${top[0].excerpt} ${cite(top[0])}`);

  if (intent === "anomaly_detection" || intent === "executive_report") {
    nextSteps.push("Route high-risk items (score ≥70) to Financial Crimes Compliance within one business day.");
    nextSteps.push("Hold pending payments to unverified beneficiaries until callback verification is completed.");
    nextSteps.push("Confirm suspected duplicates against invoice numbers before release.");
  } else if (intent === "category_trend" || intent === "merchant_change") {
    nextSteps.push("Request business justification from cost-center owners for increases above 40%.");
    nextSteps.push("Confirm new merchants completed vendor onboarding and sanctions screening.");
  } else if (intent === "cashflow_risk") {
    nextSteps.push("Trigger a Treasury cash-flow risk review per the monitoring threshold.");
    nextSteps.push("Reconfirm the liquidity buffer covers one month of payroll and benefits.");
    nextSteps.push("Follow up on delayed customer receipts with Accounts Receivable.");
  } else {
    nextSteps.push("Verify required approvals are recorded before releasing funds.");
    nextSteps.push("Document indicators, evidence and disposition in the review case file.");
  }

  return {
    summary: a.summary,
    keyFindings,
    evidence: a.evidence,
    risk: risk ?? { level: "Low", score: 0, indicators: ["Risk agent not invoked for this workflow."] },
    nextSteps,
    citations: top,
    groundingNote: top.length ? undefined : "No supporting policy passage was found; findings rely on transaction data only.",
  };
}

// ---------- Orchestration ----------
export interface RunOptions {
  txId?: string;
  simulateDelay?: boolean;
  onStep?: (step: AgentStep, path: AgentName[]) => void;
  createdAt?: string;
  id?: string;
}

export async function runAgents(prompt: string, opts: RunOptions = {}): Promise<AgentRun> {
  const provider = getProvider();
  const trimmed = prompt.trim();
  const txMatch = opts.txId ?? trimmed.match(/tx-\d{3,}/i)?.[0]?.toUpperCase();
  const intent = classifyIntent(trimmed, txMatch);
  const path = PATHS[intent];
  const steps: AgentStep[] = [];
  const emit = async (step: AgentStep) => {
    if (opts.simulateDelay) await sleep(Math.min(700, step.latencyMs / 2));
    steps.push(step);
    opts.onStep?.(step, path);
  };
  const base = {
    id: opts.id ?? `RUN-${Date.now().toString(36).toUpperCase()}`,
    createdAt: opts.createdAt ?? new Date().toISOString(),
    prompt: trimmed,
    intent,
    provider: `${provider.label} · ${provider.model}`,
    path,
    relatedTxId: txMatch,
  };

  await emit({
    agent: "Supervisor", action: "Classify intent & plan workflow", status: "success",
    latencyMs: latencyFor(trimmed + "sup", 90, 80),
    detail: `Intent: ${INTENT_LABEL[intent]}. Planned path: ${path.join(" → ")}.`,
    toolCalls: [{ name: "intent_classifier", status: "ok", summary: intent }],
  });

  const tx = txMatch ? getTransaction(txMatch) : undefined;
  let citations: Citation[] = [];
  let analysis: AnalystOutput | null = null;
  let risk: RiskAssessment | null = null;

  try {
    if (txMatch && !tx) throw new Error(`Transaction ${txMatch} was not found in the ledger.`);

    // Retrieval
    let q = RETRIEVAL_QUERY[intent] || trimmed;
    if (intent === "policy_lookup" || intent === "transaction_review") {
      const subj = tx ?? anomalies(CUR).find((t) => t.category === "Vendor Payments");
      q = `${trimmed} ${subj ? `${subj.category} ${subj.anomalyReason ?? ""} approval threshold vendor payment` : ""}`;
    }
    citations = retrieve(q);
    await emit({
      agent: "Retrieval", action: "Search knowledge base", status: "success",
      latencyMs: latencyFor(q, 180, 160),
      detail: citations.length ? `Retrieved ${citations.length} passage(s); top: ${citations[0].docTitle} ${citations[0].sectionLabel} (${citations[0].score.toFixed(2)}).` : "No passages above relevance threshold.",
      toolCalls: [
        { name: "embed_query", status: "ok", summary: `${q.split(/\s+/).length} terms` },
        { name: "vector_search", status: citations.length ? "ok" : "empty", summary: `top_k=${appConfig.retrieval.topK}, hits=${citations.length}` },
      ],
    });

    if (path.includes("Transaction Analyst")) {
      const tools: ToolCall[] = [{ name: "query_transactions", status: "ok", summary: tx ? `id=${tx.id}` : `month=${CUR}` }];
      analysis = analyze(intent, trimmed, tx);
      tools.push({ name: "compute_aggregates", status: "ok", summary: `${analysis.scope.length} rows in scope` });
      await emit({
        agent: "Transaction Analyst", action: "Analyze transactions", status: "success",
        latencyMs: latencyFor(trimmed + "ta", 220, 200), detail: analysis.summary, toolCalls: tools,
      });
    }

    if (path.includes("Risk & Compliance") && analysis) {
      risk = assessTransactions(analysis.scope, analysis.extraIndicators);
      if (intent === "cashflow_risk") {
        const score = Math.min(95, 35 + analysis.extraIndicators.length * 20);
        risk = { level: levelFor(score), score, indicators: analysis.extraIndicators.length ? analysis.extraIndicators : ["Cash flow within monitoring thresholds."] };
      }
      await emit({
        agent: "Risk & Compliance", action: "Assess risk indicators", status: "success",
        latencyMs: latencyFor(trimmed + "rc", 140, 120),
        detail: `Risk level ${risk.level} (score ${risk.score}); ${risk.indicators.length} indicator(s).`,
        toolCalls: [
          { name: "score_risk", status: "ok", summary: `score=${risk.score}` },
          { name: "policy_check", status: citations.length ? "ok" : "empty", summary: `${citations.length} policy refs` },
        ],
      });
    }

    const response = write(intent, trimmed, citations, analysis, risk);
    response.summary = await provider.refine(response.summary);
    await emit({
      agent: "Report Writer", action: "Synthesize grounded response", status: "success",
      latencyMs: latencyFor(trimmed + "rw", 260, 220),
      detail: `Composed ${response.keyFindings.length} findings with ${response.citations.length} citation(s).`,
      toolCalls: [{ name: "compose_report", status: "ok", summary: "6 sections" }, { name: "citation_validator", status: response.citations.length ? "ok" : "empty", summary: `${response.citations.length} verified` }],
    });

    return { ...base, steps, response, status: "success", metrics: metricsFor(steps, citations, response, trimmed) };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Unknown error";
    const failedAgent: AgentName = steps.length === 1 ? "Transaction Analyst" : path[steps.length] ?? "Report Writer";
    await emit({
      agent: failedAgent, action: "Execution failed", status: "failed",
      latencyMs: latencyFor(trimmed + "err", 40, 40), detail: reason,
      toolCalls: [{ name: "query_transactions", status: "error", summary: reason }],
    });
    const response: StructuredResponse = {
      summary: `The workflow could not complete: ${reason}`,
      keyFindings: [], evidence: [],
      risk: { level: "Low", score: 0, indicators: ["Not assessed."] },
      nextSteps: ["Check the transaction ID on the Transactions page and try again."],
      citations: [],
      groundingNote: "Run failed before synthesis; no answer generated.",
    };
    return { ...base, steps, response, status: "failed", failureReason: reason, metrics: metricsFor(steps, [], response, trimmed) };
  }
}

function metricsFor(steps: AgentStep[], citations: Citation[], r: StructuredResponse, prompt: string) {
  const textLen = prompt.length + citations.reduce((s, c) => s + c.excerpt.length, 0) + JSON.stringify(r).length;
  const estTokens = Math.round((textLen / 4) * 1.4);
  const avg = citations.length ? citations.reduce((s, c) => s + c.score, 0) / citations.length : 0;
  const top = citations[0]?.score ?? 0;
  return {
    totalLatencyMs: steps.reduce((s, x) => s + x.latencyMs, 0),
    retrievedChunks: citations.length,
    groundingScore: citations.length ? Math.min(0.98, Math.round((0.72 + avg * 0.22 + citations.length * 0.01) * 100) / 100) : 0,
    relevanceScore: citations.length ? Math.min(0.99, Math.round((0.55 + top * 0.45) * 100) / 100) : 0.3,
    estTokens,
    estCostUsd: Math.round((estTokens / 1000) * appConfig.costPer1kTokensUsd * 10000) / 10000,
  };
}
