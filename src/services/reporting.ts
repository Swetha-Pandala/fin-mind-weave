import type { Report } from "@/domain/types";
import { appConfig } from "@/config/app";
import { anomalies, cashFlowByMonth, categoryChanges, fmtPct, fmtUSD, inMonth, merchantChanges, merchantConcentration, monthLabel, riskDistribution, spendByCategory } from "./analytics";
import { retrieve } from "./retrieval";
import { assessTransactions, levelFor } from "./risk";

const CUR = appConfig.currentMonth;
const PREV = appConfig.previousMonth;

export function buildReports(): Report[] {
  const an = anomalies(CUR);
  const cf = cashFlowByMonth();
  const last = cf[cf.length - 1];
  const cats = categoryChanges(PREV, CUR);
  const merch = merchantChanges(PREV, CUR);
  const period = monthLabel(CUR);
  const risk = assessTransactions(inMonth(CUR));

  return [
    {
      id: "executive",
      title: "Executive Financial Operations Report",
      description: "Board-ready summary of spend, cash flow, anomalies and risk posture.",
      period,
      headline: `${period}: net operating cash flow ${fmtUSD(last.net)}, ${an.length} anomalies flagged, overall risk ${risk.level}.`,
      findings: [
        `Operating outflows were ${fmtUSD(last.outflow)} against inflows of ${fmtUSD(last.inflow)}.`,
        `Largest category movement: ${cats[0].name} (${fmtPct(cats[0].pct)}).`,
        `${an.filter((t) => t.riskScore >= 70).length} high-risk transactions require expedited review.`,
        `Customer receipts declined ${fmtPct(last.inflow / cf[cf.length - 2].inflow - 1)} month over month.`,
      ],
      evidence: [
        { label: "Inflows", value: fmtUSD(last.inflow) },
        { label: "Outflows", value: fmtUSD(last.outflow) },
        { label: "Net", value: fmtUSD(last.net) },
        { label: "Anomalies", value: String(an.length) },
      ],
      charts: [
        { title: "Cash flow by month", kind: "bar", data: cf.map((m) => ({ name: m.name, value: m.inflow, value2: m.outflow })), valueLabel: "Inflow", value2Label: "Outflow" },
        { title: `Spend by category · ${period}`, kind: "bar", data: spendByCategory(CUR).slice(0, 8), valueLabel: "Spend" },
      ],
      risk,
      citations: retrieve("cash flow monitoring outflows exceed inflows red flag indicators", 3),
      nextSteps: ["Initiate Treasury cash-flow review.", "Escalate high-risk anomalies to Compliance.", "Request justification for cloud spend increase."],
    },
    {
      id: "anomaly",
      title: "Transaction Anomaly Report",
      description: "Flagged transactions, indicators and recommended dispositions.",
      period,
      headline: `${an.length} anomalous transactions totaling ${fmtUSD(an.reduce((s, t) => s + t.amount, 0))}.`,
      findings: an.map((t) => `${t.id} · ${t.merchant} · ${fmtUSD(t.amount)} — ${t.anomalyReason} (risk ${t.riskScore})`),
      evidence: [
        { label: "Flagged", value: String(an.length) },
        { label: "High risk", value: String(an.filter((t) => t.riskScore >= 70).length) },
        { label: "Pending", value: String(an.filter((t) => t.status === "pending").length) },
        { label: "Top score", value: String(an[0]?.riskScore ?? 0) },
      ],
      charts: [
        { title: "Risk score distribution (all transactions)", kind: "bar", data: riskDistribution(), valueLabel: "Transactions" },
        { title: "Flagged amount by merchant", kind: "bar", data: an.map((t) => ({ name: t.merchant.slice(0, 18), value: t.amount })), valueLabel: "Amount" },
      ],
      risk: assessTransactions(an),
      citations: retrieve("red flag indicators duplicate payment split threshold anomaly risk scoring escalation", 4),
      nextSteps: ["Hold pending unverified external transfer.", "Confirm Northwind invoice numbers.", "Review Brightline payments as a combined amount."],
    },
    {
      id: "vendor",
      title: "Vendor Spend Analysis",
      description: "Merchant concentration, month-over-month changes and new vendors.",
      period,
      headline: `${merch.filter((m) => m.isNew).length} new merchants in ${period}; top 8 merchants represent ${(merchantConcentration(CUR).reduce((s, m) => s + m.share, 0) * 100).toFixed(0)}% of spend.`,
      findings: merch.slice(0, 6).map((m) => `${m.name}: ${fmtUSD(m.prev)} → ${fmtUSD(m.cur)}${m.isNew ? " (new)" : ""}`),
      evidence: merchantConcentration(CUR, undefined, 4).map((m) => ({ label: m.name, value: `${(m.share * 100).toFixed(1)}%` })),
      charts: [
        { title: `Merchant concentration · ${period}`, kind: "bar", data: merchantConcentration(CUR), valueLabel: "Spend" },
        { title: "Largest merchant changes", kind: "bar", data: merch.slice(0, 8).map((m) => ({ name: m.name.slice(0, 18), value: m.delta })), valueLabel: "Change" },
      ],
      risk: { level: levelFor(52), score: 52, indicators: ["New international vendor without onboarding record.", "Recurring vendor duplicate payment."] },
      citations: retrieve("new vendor onboarding duplicate payment controls spend spike recurring vendor", 3),
      nextSteps: ["Complete onboarding verification for new vendors.", "Consolidate overlapping professional services engagements."],
    },
    {
      id: "risk",
      title: "Monthly Risk Summary",
      description: "Risk posture, indicator trends and compliance follow-ups.",
      period,
      headline: `Overall risk ${risk.level} (score ${risk.score}) with ${risk.indicators.length} active indicators.`,
      findings: risk.indicators,
      evidence: cf.map((m) => ({ label: `${m.name} anomalies`, value: String(anomalies(m.month).length) })),
      charts: [
        { title: "Anomalies by month", kind: "line", data: cf.map((m) => ({ name: m.name, value: anomalies(m.month).length })), valueLabel: "Anomalies" },
        { title: "Net cash flow by month", kind: "line", data: cf.map((m) => ({ name: m.name, value: m.net })), valueLabel: "Net" },
      ],
      risk,
      citations: retrieve("anomaly risk scoring escalation case documentation", 3),
      nextSteps: ["Close all high-risk reviews within one business day.", "Document dispositions without speculative conclusions."],
    },
  ];
}
