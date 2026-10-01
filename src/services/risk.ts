import type { RiskAssessment, RiskLevel, Transaction } from "@/domain/types";

export function levelFor(score: number): RiskLevel {
  if (score >= 75) return "High";
  if (score >= 55) return "Elevated";
  if (score >= 30) return "Moderate";
  return "Low";
}

/** Aggregate risk across a set of transactions using non-advisory, indicator-based language. */
export function assessTransactions(txs: Transaction[], extraIndicators: string[] = []): RiskAssessment {
  const flagged = txs.filter((t) => t.anomaly);
  if (!txs.length) return { level: "Low", score: 0, indicators: ["No transactions in scope."] };
  const top = flagged.length ? Math.max(...flagged.map((t) => t.riskScore)) : Math.max(...txs.map((t) => t.riskScore));
  const breadth = Math.min(15, flagged.length * 2);
  const score = Math.min(99, Math.round(top * 0.85 + breadth));
  const indicators = [
    ...flagged.slice(0, 5).map((t) => `${t.merchant}: ${t.anomalyReason}`),
    ...extraIndicators,
  ];
  return { level: levelFor(score), score, indicators: indicators.length ? indicators : ["No red-flag indicators observed in scope."] };
}

export function riskTone(level: RiskLevel) {
  return level === "High" ? "danger" : level === "Elevated" ? "warning" : level === "Moderate" ? "gold" : "success";
}
