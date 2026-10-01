import type { KnowledgeDocument } from "@/domain/types";

// Synthetic policy corpus. All content is fictional and for demonstration only.
export const knowledgeDocuments: KnowledgeDocument[] = [
  {
    id: "DOC-VPP",
    title: "Vendor Payment Policy",
    type: "Policy",
    owner: "Accounts Payable",
    version: "4.2",
    updated: "2026-06-30",
    summary: "Approval thresholds, vendor onboarding, duplicate payment controls and wire requirements.",
    sections: [
      { id: "vpp-1", label: "§1.1 Scope", text: "This policy applies to all payments made to external vendors, suppliers and contractors, including ACH, wire and card-based vendor payments." },
      { id: "vpp-3-2", label: "§3.2 Approval Thresholds", text: "Vendor payments above $10,000 require approval by a department director. Payments above $50,000 require CFO approval in addition to director approval. Approvals must be recorded before release of funds." },
      { id: "vpp-3-4", label: "§3.4 Split Payment Prohibition", text: "Splitting a single obligation into multiple smaller payments to stay below an approval threshold is prohibited. Multiple payments to the same vendor within seven days that individually fall just below $5,000 or $10,000 must be reviewed as a combined amount." },
      { id: "vpp-4-1", label: "§4.1 New Vendor Onboarding", text: "A new vendor must complete onboarding, including tax ID verification, bank account validation and sanctions screening, before the first payment. Payments to vendors without completed onboarding must be held." },
      { id: "vpp-5-3", label: "§5.3 Duplicate Payment Controls", text: "Accounts Payable must review any two payments to the same vendor with an identical amount on the same or adjacent business days. Suspected duplicates must be held and confirmed against invoice numbers before release." },
      { id: "vpp-6-1", label: "§6.1 Wire Transfers", text: "International wire transfers to first-time beneficiaries require callback verification using a phone number on file and dual authorization." },
    ],
  },
  {
    id: "DOC-ERP",
    title: "Expense Reimbursement Policy",
    type: "Policy",
    owner: "Finance Operations",
    version: "3.0",
    updated: "2026-03-15",
    summary: "Eligible expenses, receipt requirements, gift card restrictions and submission timelines.",
    sections: [
      { id: "erp-2-1", label: "§2.1 Eligible Expenses", text: "Reasonable and necessary business expenses incurred on behalf of the company are eligible for reimbursement, including approved travel, client meals and office supplies." },
      { id: "erp-2-4", label: "§2.4 Gift Cards and Cash Equivalents", text: "Purchases of gift cards or other cash equivalents are not reimbursable without prior written approval from Finance. Gift card purchases are a known fraud indicator and are reviewed individually." },
      { id: "erp-3-1", label: "§3.1 Receipts", text: "Itemized receipts are required for all expenses above $75. Missing receipts require a signed declaration and manager approval." },
      { id: "erp-4-2", label: "§4.2 Submission Timeline", text: "Expenses must be submitted within 30 days of being incurred. Expenses submitted after 90 days are not reimbursable." },
    ],
  },
  {
    id: "DOC-CTP",
    title: "Corporate Travel Policy",
    type: "Policy",
    owner: "Corporate Services",
    version: "5.1",
    updated: "2026-05-01",
    summary: "Booking channels, lodging caps, weekend travel and premium travel restrictions.",
    sections: [
      { id: "ctp-2-2", label: "§2.2 Booking Channels", text: "All air and hotel travel must be booked through the approved travel management provider unless an exception is approved in advance." },
      { id: "ctp-3-1", label: "§3.1 Lodging Limits", text: "Hotel spend is capped at $350 per night in tier-one cities and $225 per night elsewhere. Resort properties are not permitted for business travel unless attending an approved company event." },
      { id: "ctp-3-5", label: "§3.5 Weekend and Leisure Travel", text: "Travel charges incurred on weekends without a documented business purpose are treated as personal expenses and must be reviewed by the traveler's manager." },
      { id: "ctp-4-1", label: "§4.1 Premium Class", text: "Business-class airfare is permitted only for flights longer than six hours and requires VP approval." },
    ],
  },
  {
    id: "DOC-FMG",
    title: "Fraud Monitoring Guidelines",
    type: "Guideline",
    owner: "Financial Crimes Compliance",
    version: "2.3",
    updated: "2026-07-20",
    summary: "Red-flag indicators, risk scoring, escalation paths and case documentation.",
    sections: [
      { id: "fmg-2-1", label: "§2.1 Red-Flag Indicators", text: "Common red flags include payments to new or unverified beneficiaries, round-dollar amounts, transactions outside business hours, duplicate payments, gift card purchases, and payments just below approval thresholds." },
      { id: "fmg-2-3", label: "§2.3 Anomaly Risk Scoring", text: "Transactions are scored from 0 to 100. Scores of 70 or above are considered high risk and must be reviewed within one business day. Scores between 40 and 69 are elevated and reviewed weekly." },
      { id: "fmg-3-1", label: "§3.1 Escalation", text: "High-risk transactions must be escalated to Financial Crimes Compliance. Funds associated with unverified beneficiaries should be held pending review where operationally possible." },
      { id: "fmg-3-4", label: "§3.4 Case Documentation", text: "Each review must document the indicators observed, the evidence reviewed, the disposition and the reviewer. Reviews must not include speculative conclusions about intent." },
      { id: "fmg-4-2", label: "§4.2 Spend Spikes", text: "A month-over-month increase greater than 40% for a recurring vendor or cost center should be investigated to confirm a legitimate business driver." },
    ],
  },
  {
    id: "DOC-TOG",
    title: "Treasury Operations Guide",
    type: "Guide",
    owner: "Treasury",
    version: "1.8",
    updated: "2026-04-10",
    summary: "Liquidity buffers, cash sweeps, cash-flow monitoring and intercompany transfers.",
    sections: [
      { id: "tog-2-1", label: "§2.1 Liquidity Buffer", text: "The operating account should maintain a minimum liquidity buffer equal to one month of payroll and benefits outflows." },
      { id: "tog-2-3", label: "§2.3 Cash-Flow Monitoring", text: "Treasury monitors monthly net cash flow. Two consecutive months of negative operating cash flow, or a single month where outflows exceed inflows by more than 15%, triggers a cash-flow risk review." },
      { id: "tog-3-2", label: "§3.2 Reserve Sweeps", text: "Excess operating cash above the liquidity buffer is swept to the reserve account. Sweeps are executed as internal transfers and are not considered operating outflows." },
      { id: "tog-4-1", label: "§4.1 External Transfers", text: "External transfers to beneficiaries not on the approved counterparty list require Treasury and Compliance sign-off prior to release." },
    ],
  },
  {
    id: "DOC-SP",
    title: "Settlement Procedures",
    type: "Procedure",
    owner: "Payment Operations",
    version: "2.0",
    updated: "2026-02-28",
    summary: "Settlement windows, pending item handling, reversals and reconciliation.",
    sections: [
      { id: "sp-2-1", label: "§2.1 Settlement Windows", text: "ACH payments settle within one to two business days. Wires initiated after 5:00 PM ET settle the next business day." },
      { id: "sp-3-2", label: "§3.2 Pending Items", text: "Items pending for more than three business days must be investigated by Payment Operations and either released, returned or escalated." },
      { id: "sp-4-1", label: "§4.1 Reversals and Refunds", text: "Refunds must be matched to an original transaction. Refunds credited without a matching original transaction must be investigated as potential errors or misdirected funds." },
      { id: "sp-5-1", label: "§5.1 Daily Reconciliation", text: "All settled transactions must be reconciled to the general ledger daily. Unreconciled items older than five days are reported to the Controller." },
    ],
  },
  {
    id: "DOC-CCG",
    title: "Cloud & Software Spend Governance",
    type: "Guideline",
    owner: "IT Finance",
    version: "1.2",
    updated: "2026-06-12",
    summary: "Cloud budgets, variance thresholds, SaaS renewals and tagging requirements.",
    sections: [
      { id: "ccg-2-1", label: "§2.1 Budget Variance", text: "Cloud spend exceeding monthly budget by more than 20% requires an explanation from the owning engineering team within five business days." },
      { id: "ccg-3-1", label: "§3.1 SaaS Renewals", text: "Software subscriptions above $25,000 annually require procurement review prior to renewal." },
      { id: "ccg-4-1", label: "§4.1 Cost Allocation Tags", text: "All cloud resources must carry cost-center tags so that spend can be attributed to owning teams." },
    ],
  },
];

export function getDocument(id: string) {
  return knowledgeDocuments.find((d) => d.id === id);
}
