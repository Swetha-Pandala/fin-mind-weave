// Core domain types for the Multi-Agent Financial Intelligence Platform.

export type TxType = "debit" | "credit";
export type TxStatus = "posted" | "pending" | "flagged" | "reversed";

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  merchant: string;
  category: string;
  amount: number; // always positive; direction given by `type`
  type: TxType;
  status: TxStatus;
  riskScore: number; // 0-100
  anomaly: boolean;
  anomalyReason?: string;
  description: string;
}

export interface DocumentSection {
  id: string;
  label: string; // e.g. "§3.2 Approval Thresholds"
  text: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  type: "Policy" | "Guideline" | "Procedure" | "Guide";
  owner: string;
  version: string;
  updated: string;
  summary: string;
  sections: DocumentSection[];
}

export interface Citation {
  docId: string;
  docTitle: string;
  sectionLabel: string;
  excerpt: string;
  score: number; // 0-1 normalized retrieval score
}

export type AgentName =
  | "Supervisor"
  | "Retrieval"
  | "Transaction Analyst"
  | "Risk & Compliance"
  | "Report Writer";

export interface ToolCall {
  name: string;
  status: "ok" | "empty" | "error";
  summary: string;
}

export interface AgentStep {
  agent: AgentName;
  action: string;
  status: "success" | "failed";
  latencyMs: number;
  detail: string;
  toolCalls: ToolCall[];
}

export type Intent =
  | "anomaly_detection"
  | "category_trend"
  | "policy_lookup"
  | "cashflow_risk"
  | "merchant_change"
  | "executive_report"
  | "transaction_review"
  | "general";

export type RiskLevel = "Low" | "Moderate" | "Elevated" | "High";

export interface RiskAssessment {
  level: RiskLevel;
  score: number;
  indicators: string[];
}

export interface EvidenceItem {
  label: string;
  value: string;
}

export interface StructuredResponse {
  summary: string;
  keyFindings: string[];
  evidence: EvidenceItem[];
  risk: RiskAssessment;
  nextSteps: string[];
  citations: Citation[];
  groundingNote?: string;
}

export interface EvaluationMetric {
  totalLatencyMs: number;
  retrievedChunks: number;
  groundingScore: number; // 0-1
  relevanceScore: number; // 0-1
  estTokens: number;
  estCostUsd: number;
}

export interface AgentRun {
  id: string;
  createdAt: string;
  prompt: string;
  intent: Intent;
  provider: string;
  path: AgentName[];
  steps: AgentStep[];
  response: StructuredResponse;
  metrics: EvaluationMetric;
  status: "success" | "failed";
  failureReason?: string;
  relatedTxId?: string;
}

export interface ReportChart {
  title: string;
  kind: "bar" | "line";
  data: { name: string; value: number; value2?: number }[];
  valueLabel: string;
  value2Label?: string;
}

export interface Report {
  id: "executive" | "anomaly" | "vendor" | "risk";
  title: string;
  description: string;
  period: string;
  headline: string;
  findings: string[];
  evidence: EvidenceItem[];
  charts: ReportChart[];
  risk: RiskAssessment;
  citations: Citation[];
  nextSteps: string[];
}
