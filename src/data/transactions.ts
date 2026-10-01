import type { Transaction, TxStatus, TxType } from "@/domain/types";

// Deterministic synthetic transaction generator (Jul–Sep 2026).
// Uses a seeded PRNG so every render, server and client, yields identical data.

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Draft {
  date: string;
  merchant: string;
  category: string;
  amount: number;
  type?: TxType;
  status?: TxStatus;
  anomalyReason?: string | undefined;
  risk?: number;
  description?: string;
}

const MONTHS = ["2026-07", "2026-08", "2026-09"] as const;
const d = (m: string, day: number) => `${m}-${String(day).padStart(2, "0")}`;

function build(): Transaction[] {
  const rnd = mulberry32(20260901);
  const jitter = (base: number, pct = 0.06) => Math.round(base * (1 + (rnd() * 2 - 1) * pct) * 100) / 100;
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)]!;
  const drafts: Draft[] = [];

  MONTHS.forEach((m, mi) => {
    // Payroll & benefits
    drafts.push({ date: d(m, 1), merchant: "ADP Payroll", category: "Payroll", amount: jitter(184000, 0.02), description: "Semi-monthly payroll run" });
    drafts.push({ date: d(m, 15), merchant: "ADP Payroll", category: "Payroll", amount: jitter(184000, 0.02), description: "Semi-monthly payroll run" });
    drafts.push({ date: d(m, 3), merchant: "BlueCross BlueShield", category: "Healthcare & Benefits", amount: jitter(46000, 0.03), description: "Group medical premium" });
    drafts.push({ date: d(m, 16), merchant: "Fidelity 401(k)", category: "Healthcare & Benefits", amount: jitter(21000, 0.03), description: "Retirement plan contribution" });
    // Utilities
    drafts.push({ date: d(m, 6), merchant: "Con Edison", category: "Utilities", amount: jitter(mi === 1 ? 5200 : 4200), description: "Office electricity" });
    drafts.push({ date: d(m, 9), merchant: "Verizon Business", category: "Utilities", amount: jitter(1850, 0.02), description: "Telecom services" });
    // Subscriptions
    drafts.push({ date: d(m, 4), merchant: "Slack Technologies", category: "Subscriptions", amount: 2400, description: "Monthly workspace subscription" });
    drafts.push({ date: d(m, 7), merchant: "Zoom Video", category: "Subscriptions", amount: 1100, description: "Video conferencing licenses" });
    drafts.push({ date: d(m, 11), merchant: "Adobe Systems", category: "Subscriptions", amount: 1650, description: "Creative Cloud licenses" });
    // Software
    drafts.push({ date: d(m, 5), merchant: "Atlassian", category: "Software", amount: jitter(3800, 0.02), description: "Jira & Confluence" });
    drafts.push({ date: d(m, 12), merchant: "Salesforce", category: "Software", amount: 12500, description: "CRM enterprise licenses" });
    drafts.push({ date: d(m, 14), merchant: "GitHub", category: "Software", amount: 2100, description: "Enterprise seats" });
    // Cloud (September spike is deliberate)
    const aws = [38200, 40900, 63150][mi]!;
    drafts.push({
      date: d(m, 2), merchant: "Amazon Web Services", category: "Cloud Spend", amount: aws,
      description: "Monthly cloud infrastructure",
      ...(mi === 2 ? { anomalyReason: "Cloud spend up 54% month over month, above the 40% spike threshold", risk: 58 } : {}),
    });
    drafts.push({ date: d(m, 8), merchant: "Snowflake", category: "Cloud Spend", amount: jitter(9000, 0.08), description: "Data warehouse credits" });
    // Vendor payments
    drafts.push({ date: d(m, 10), merchant: "Apex Facilities Mgmt", category: "Vendor Payments", amount: 18500, description: "Facilities services retainer" });
    drafts.push({ date: d(m, 18), merchant: "Northwind Logistics", category: "Vendor Payments", amount: 22000, description: "Freight & logistics invoice" });
    drafts.push({ date: d(m, 21), merchant: "Meridian Supplies", category: "Vendor Payments", amount: jitter(7400, 0.05), description: "Packaging supplies" });
    // Professional services
    drafts.push({ date: d(m, 19), merchant: "Baker & Lowe LLP", category: "Professional Services", amount: jitter(15000, 0.1), description: "Legal counsel retainer" });
    if (mi >= 1) drafts.push({ date: d(m, 24), merchant: "Deloitte Advisory", category: "Professional Services", amount: mi === 1 ? 28000 : 31500, description: "Audit readiness engagement" });
    // Travel
    const travelMerchants = ["Delta Air Lines", "Marriott Hotels", "Uber for Business", "United Airlines", "Hilton Hotels"] as const;
    for (let i = 0; i < 4; i++) {
      const merchant = pick(travelMerchants);
      const base = merchant.includes("Air") ? 780 : merchant.includes("Uber") ? 140 : 620;
      drafts.push({ date: d(m, 3 + i * 6 + Math.floor(rnd() * 3)), merchant, category: "Travel", amount: jitter(base, 0.35), description: "Business travel" });
    }
    // Office expenses
    const officeMerchants = ["Staples", "W.B. Mason", "Amazon Business", "Blue Bottle Catering"] as const;
    for (let i = 0; i < 4; i++) {
      drafts.push({ date: d(m, 2 + i * 7 + Math.floor(rnd() * 3)), merchant: pick(officeMerchants), category: "Office Expenses", amount: jitter(420, 0.6), description: "Office supplies & catering" });
    }
    // Transfers
    drafts.push({ date: d(m, 27), merchant: "Treasury Sweep – Reserve", category: "Transfers", amount: [250000, 220000, 120000][mi]!, description: "Internal sweep to reserve account" });
    drafts.push({ date: d(m, 20), merchant: "Intercompany – Holdings LLC", category: "Transfers", amount: 75000, type: "credit", description: "Intercompany funding" });
    // Customer receipts (September inflows soften deliberately)
    const receipts: number[][] = [[262000, 241000, 198000], [255000, 236000, 172000], [248000, 229000, 165000]];
    ["Acme Corp", "Globex Industries", "Initech Partners"].forEach((client, ci) => {
      drafts.push({ date: d(m, 8 + ci * 7), merchant: `Client Receipt – ${client}`, category: "Customer Receipts", amount: receipts[ci]![mi]!, type: "credit", description: "Customer invoice payment" });
    });
    // Refunds
    drafts.push({ date: d(m, 13), merchant: "Delta Air Lines", category: "Refunds", amount: jitter(410, 0.2), type: "credit", description: "Cancelled flight refund" });
    drafts.push({ date: d(m, 22), merchant: "Amazon Business", category: "Refunds", amount: jitter(180, 0.3), type: "credit", description: "Returned office equipment" });
  });

  // Deliberate anomalies
  drafts.push(
    { date: "2026-08-17", merchant: "GiftCardMall", category: "Office Expenses", amount: 2500, status: "flagged", risk: 74, anomalyReason: "Gift card purchase (cash equivalent) without documented approval", description: "Bulk gift card purchase" },
    { date: "2026-09-18", merchant: "Northwind Logistics", category: "Vendor Payments", amount: 22000, status: "flagged", risk: 86, anomalyReason: "Possible duplicate: identical amount to same vendor on the same day", description: "Freight & logistics invoice" },
    { date: "2026-09-09", merchant: "Quantix Global Ltd", category: "Vendor Payments", amount: 48750, status: "flagged", risk: 91, anomalyReason: "First-time international beneficiary, round-dollar wire, no onboarding record", description: "International wire – consulting services" },
    { date: "2026-09-12", merchant: "Luxe Resort Maldives", category: "Travel", amount: 9840, status: "posted", risk: 72, anomalyReason: "Weekend resort charge outside travel policy lodging limits", description: "Resort lodging (Saturday)" },
    { date: "2026-09-22", merchant: "Brightline Consulting", category: "Professional Services", amount: 4950, status: "posted", risk: 78, anomalyReason: "One of three payments just below $5,000 within 7 days (possible split)", description: "Consulting invoice 1 of 3" },
    { date: "2026-09-24", merchant: "Brightline Consulting", category: "Professional Services", amount: 4950, status: "posted", risk: 78, anomalyReason: "One of three payments just below $5,000 within 7 days (possible split)", description: "Consulting invoice 2 of 3" },
    { date: "2026-09-26", merchant: "Brightline Consulting", category: "Professional Services", amount: 4975, status: "pending", risk: 80, anomalyReason: "One of three payments just below $5,000 within 7 days (possible split)", description: "Consulting invoice 3 of 3" },
    { date: "2026-09-28", merchant: "External Transfer – Unverified Beneficiary", category: "Transfers", amount: 95000, status: "pending", risk: 94, anomalyReason: "Large external transfer at 11:47 PM to a beneficiary not on the approved counterparty list", description: "Outbound external transfer" },
    { date: "2026-09-15", merchant: "Unknown Merchant #4471", category: "Refunds", amount: 3200, type: "credit", status: "flagged", risk: 69, anomalyReason: "Refund with no matching original transaction", description: "Unmatched refund credit" },
  );

  drafts.sort((a, b) => a.date.localeCompare(b.date) || a.merchant.localeCompare(b.merchant));

  return drafts.map((t, i) => {
    const anomaly = Boolean(t.anomalyReason);
    const base = t.category === "Transfers" ? 18 : t.category === "Travel" ? 14 : t.category === "Office Expenses" ? 10 : 6;
    const riskScore = t.risk ?? Math.min(35, Math.round(base + rnd() * 14));
    return {
      id: `TX-${String(10001 + i)}`,
      date: t.date,
      merchant: t.merchant,
      category: t.category,
      amount: Math.round(t.amount * 100) / 100,
      type: t.type ?? "debit",
      status: t.status ?? (t.date >= "2026-09-27" ? "pending" : "posted"),
      riskScore,
      anomaly,
      anomalyReason: t.anomalyReason,
      description: t.description ?? t.category,
    } satisfies Transaction;
  });
}

let cache: Transaction[] | null = null;
export function getTransactions(): Transaction[] {
  if (!cache) cache = build();
  return cache;
}

export function getTransaction(id: string) {
  return getTransactions().find((t) => t.id.toLowerCase() === id.toLowerCase());
}
