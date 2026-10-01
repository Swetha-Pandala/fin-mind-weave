import type { Citation, KnowledgeDocument } from "@/domain/types";
import { knowledgeDocuments } from "@/data/documents";
import { appConfig } from "@/config/app";

// Lightweight lexical retriever (TF-IDF over section chunks).
// Swap for a vector store (pgvector) later behind the same `retrieve()` signature.

const STOP = new Set("a an the of to and or for in on at by is are be with this that it as from was were which what does do any our we us my me i you your there than then into over under about how".split(" "));

export function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9$%\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => w.replace(/(ies)$/, "y").replace(/(s)$/, ""));
}

interface Chunk {
  doc: KnowledgeDocument;
  label: string;
  text: string;
  tokens: string[];
}

let index: { chunks: Chunk[]; idf: Map<string, number> } | null = null;

function getIndex() {
  if (index) return index;
  const chunks: Chunk[] = knowledgeDocuments.flatMap((doc) =>
    doc.sections.map((s) => ({ doc, label: s.label, text: s.text, tokens: tokenize(`${doc.title} ${s.label} ${s.text}`) })),
  );
  const df = new Map<string, number>();
  for (const c of chunks) for (const t of new Set(c.tokens)) df.set(t, (df.get(t) ?? 0) + 1);
  const idf = new Map<string, number>();
  for (const [t, n] of df) idf.set(t, Math.log(1 + chunks.length / n));
  index = { chunks, idf };
  return index;
}

export function indexStats() {
  const { chunks } = getIndex();
  return { documents: knowledgeDocuments.length, chunks: chunks.length };
}

export function chunkCount(docId: string) {
  return getIndex().chunks.filter((c) => c.doc.id === docId).length;
}

export function retrieve(query: string, topK: number = appConfig.retrieval.topK): Citation[] {
  const { chunks, idf } = getIndex();
  const q = Array.from(new Set(tokenize(query)));
  if (!q.length) return [];
  const maxPossible = q.reduce((s, t) => s + (idf.get(t) ?? 0), 0) || 1;
  const scored = chunks.map((c) => {
    const set = new Set(c.tokens);
    let s = 0;
    for (const t of q) if (set.has(t)) s += idf.get(t) ?? 0;
    return { c, score: s / maxPossible };
  });
  return scored
    .filter((x) => x.score >= appConfig.retrieval.minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ c, score }) => ({
      docId: c.doc.id,
      docTitle: c.doc.title,
      sectionLabel: c.label,
      excerpt: c.text,
      score: Math.round(Math.min(1, score) * 100) / 100,
    }));
}
