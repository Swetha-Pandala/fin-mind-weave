import { useSyncExternalStore } from "react";
import type { AgentRun } from "@/domain/types";
import { appConfig } from "@/config/app";
import { runAgents } from "./orchestrator";

// Client-side run history (localStorage). Swap for a database table later behind the same API.

let runs: AgentRun[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const EMPTY: AgentRun[] = [];

function emit() {
  for (const l of listeners) l();
}

function persist() {
  try {
    localStorage.setItem(appConfig.storageKey, JSON.stringify(runs.slice(0, 50)));
  } catch {
    /* storage unavailable — keep in memory */
  }
}

const SEED_PROMPTS: { prompt: string; at: string; txId?: string }[] = [
  { prompt: "Which transactions look unusual this month?", at: "2026-09-30T14:05:00Z" },
  { prompt: "Summarize current cash-flow risk.", at: "2026-09-30T15:22:00Z" },
  { prompt: "Review transaction TX-99999 for approval requirements", at: "2026-09-30T16:10:00Z" },
  { prompt: "What were the largest expense changes by category?", at: "2026-10-01T09:41:00Z" },
];

/** Loads persisted runs or seeds deterministic example runs. Call from useEffect only. */
export async function ensureRunsLoaded() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = localStorage.getItem(appConfig.storageKey);
    if (raw) {
      runs = JSON.parse(raw) as AgentRun[];
      emit();
      return;
    }
  } catch {
    /* ignore corrupt storage */
  }
  const seeded: AgentRun[] = [];
  for (const [i, s] of SEED_PROMPTS.entries()) {
    seeded.push(await runAgents(s.prompt, { createdAt: s.at, id: `RUN-SEED${i + 1}` }));
  }
  runs = seeded.reverse();
  persist();
  emit();
}

export function addRun(run: AgentRun) {
  runs = [run, ...runs];
  persist();
  emit();
}

export function clearRuns() {
  runs = [];
  persist();
  emit();
}

export function useRuns(): AgentRun[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => runs,
    () => EMPTY,
  );
}
