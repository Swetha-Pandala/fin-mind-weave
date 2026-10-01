import type { Transaction } from "@/domain/types";
import { getTransactions } from "@/data/transactions";

export const fmtUSD = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits, minimumFractionDigits: digits });

export const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${(n * 100).toFixed(1)}%`;

export const monthLabel = (m: string) =>
  new Date(`${m}-15T12:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

const isSweep = (t: Transaction) => t.merchant.startsWith("Treasury Sweep");

export function inMonth(month: string, txs = getTransactions()) {
  return txs.filter((t) => t.date.startsWith(month));
}

export function months(txs = getTransactions()) {
  return Array.from(new Set(txs.map((t) => t.date.slice(0, 7)))).sort();
}

/** Operating spend excludes internal reserve sweeps (Treasury Operations Guide §3.2). */
export function spendByCategory(month?: string, txs = getTransactions()) {
  const map = new Map<string, number>();
  for (const t of month ? inMonth(month, txs) : txs) {
    if (t.type !== "debit" || isSweep(t)) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value);
}

export function cashFlowByMonth(txs = getTransactions()) {
  return months(txs).map((m) => {
    let inflow = 0;
    let outflow = 0;
    for (const t of inMonth(m, txs)) {
      if (isSweep(t)) continue;
      if (t.type === "credit") inflow += t.amount;
      else outflow += t.amount;
    }
    return { month: m, name: monthLabel(m), inflow: Math.round(inflow), outflow: Math.round(outflow), net: Math.round(inflow - outflow) };
  });
}

export function categoryChanges(prev: string, cur: string, txs = getTransactions()) {
  const a = new Map(spendByCategory(prev, txs).map((x) => [x.name, x.value]));
  const b = new Map(spendByCategory(cur, txs).map((x) => [x.name, x.value]));
  const names = new Set([...a.keys(), ...b.keys()]);
  return [...names]
    .map((name) => {
      const p = a.get(name) ?? 0;
      const c = b.get(name) ?? 0;
      return { name, prev: p, cur: c, delta: c - p, pct: p ? (c - p) / p : 1 };
    })
    .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
}

export function merchantChanges(prev: string, cur: string, txs = getTransactions()) {
  const sum = (m: string) => {
    const map = new Map<string, number>();
    for (const t of inMonth(m, txs)) if (t.type === "debit" && !isSweep(t)) map.set(t.merchant, (map.get(t.merchant) ?? 0) + t.amount);
    return map;
  };
  const a = sum(prev);
  const b = sum(cur);
  const names = new Set([...a.keys(), ...b.keys()]);
  return [...names]
    .map((name) => {
      const p = a.get(name) ?? 0;
      const c = b.get(name) ?? 0;
      return { name, prev: Math.round(p), cur: Math.round(c), delta: Math.round(c - p), isNew: p === 0 && c > 0 };
    })
    .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
}

export function merchantConcentration(month?: string, txs = getTransactions(), top = 8) {
  const map = new Map<string, number>();
  let total = 0;
  for (const t of month ? inMonth(month, txs) : txs) {
    if (t.type !== "debit" || isSweep(t)) continue;
    map.set(t.merchant, (map.get(t.merchant) ?? 0) + t.amount);
    total += t.amount;
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([name, value]) => ({ name, value: Math.round(value), share: total ? value / total : 0 }));
}

export function riskDistribution(txs = getTransactions()) {
  const buckets = [
    { name: "0–19", min: 0, max: 19 },
    { name: "20–39", min: 20, max: 39 },
    { name: "40–69", min: 40, max: 69 },
    { name: "70–100", min: 70, max: 100 },
  ];
  return buckets.map((b) => ({
    name: b.name,
    value: txs.filter((t) => t.riskScore >= b.min && t.riskScore <= b.max).length,
  }));
}

export function anomalies(month?: string, txs = getTransactions()) {
  return (month ? inMonth(month, txs) : txs).filter((t) => t.anomaly).sort((a, b) => b.riskScore - a.riskScore);
}
