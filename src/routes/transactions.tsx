import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Bot, Search } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/app/AppShell";
import { EmptyState, Panel, Pill, axisProps, chartColors, compactUSD, scoreTone, tooltipStyle } from "@/components/app/widgets";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getTransactions } from "@/data/transactions";
import type { Transaction } from "@/domain/types";
import { cashFlowByMonth, fmtUSD, merchantConcentration, riskDistribution, spendByCategory } from "@/services/analytics";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — Multi-Agent Financial Intelligence" },
      { name: "description", content: "Explore 100+ synthetic transactions with filters, charts, risk scores and anomaly flags." },
      { property: "og:title", content: "Transactions — Multi-Agent Financial Intelligence" },
      { property: "og:description", content: "Synthetic ledger with spend, cash-flow, merchant concentration and anomaly analytics." },
    ],
  }),
  component: TransactionsPage,
});

type SortKey = "date" | "merchant" | "amount" | "riskScore";

function TransactionsPage() {
  const all = getTransactions();
  const categories = useMemo(() => Array.from(new Set(all.map((t) => t.category))).sort(), [all]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [onlyAnomalies, setOnlyAnomalies] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "date", dir: -1 });
  const [selected, setSelected] = useState<Transaction | null>(null);

  const rows = useMemo(() => {
    const term = q.toLowerCase().trim();
    return all
      .filter((t) => (cat === "all" || t.category === cat) && (type === "all" || t.type === type) && (status === "all" || t.status === status) && (!onlyAnomalies || t.anomaly))
      .filter((t) => !term || `${t.id} ${t.merchant} ${t.category} ${t.description}`.toLowerCase().includes(term))
      .sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))) * sort.dir;
      });
  }, [all, q, cat, type, status, onlyAnomalies, sort]);

  const toggleSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }));
  const reset = () => { setQ(""); setCat("all"); setType("all"); setStatus("all"); setOnlyAnomalies(false); };

  const SortHead = ({ k, label, right }: { k: SortKey; label: string; right?: boolean }) => (
    <th scope="col" aria-sort={sort.key === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className={`px-3 py-2 font-medium ${right ? "text-right" : "text-left"}`}>
      <button type="button" onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
        {label}
        {sort.key === k ? (sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-50" />}
      </button>
    </th>
  );

  return (
    <div>
      <PageHeader title="Transactions" subtitle={`${all.length} synthetic transactions · Jul–Sep 2026`} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Spend by category" description="All months, operating debits">
          <div className="h-60"><ResponsiveContainer>
            <BarChart data={spendByCategory().slice(0, 8)} layout="vertical" margin={{ left: 8, right: 12 }}>
              <CartesianGrid stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tickFormatter={compactUSD} {...axisProps} />
              <YAxis type="category" dataKey="name" width={130} {...axisProps} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => fmtUSD(v)} />
              <Bar dataKey="value" name="Spend" fill="var(--chart-1)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Cash flow" description="Monthly inflows vs outflows">
          <div className="h-60"><ResponsiveContainer>
            <BarChart data={cashFlowByMonth()}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis tickFormatter={compactUSD} width={52} {...axisProps} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => fmtUSD(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="inflow" name="Inflow" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="outflow" name="Outflow" fill="var(--chart-5)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Merchant concentration" description="Top 8 merchants by spend">
          <div className="h-60"><ResponsiveContainer>
            <BarChart data={merchantConcentration()} layout="vertical" margin={{ left: 8, right: 12 }}>
              <CartesianGrid stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tickFormatter={compactUSD} {...axisProps} />
              <YAxis type="category" dataKey="name" width={150} {...axisProps} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => fmtUSD(v)} />
              <Bar dataKey="value" name="Spend" fill="var(--chart-2)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Risk score distribution" description="Transaction count by risk band">
          <div className="h-60"><ResponsiveContainer>
            <BarChart data={riskDistribution()}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis allowDecimals={false} width={32} {...axisProps} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" name="Transactions" radius={[3, 3, 0, 0]}>
                {riskDistribution().map((_, i) => <Cell key={i} fill={[chartColors[0], chartColors[1], chartColors[2], chartColors[4]][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer></div>
        </Panel>
      </div>

      <Panel className="mt-4">
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input aria-label="Search transactions" placeholder="Search ID, merchant, category…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="sm:w-48" aria-label="Category"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="sm:w-32" aria-label="Type"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="debit">Debit</SelectItem><SelectItem value="credit">Credit</SelectItem></SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-36" aria-label="Status"><SelectValue /></SelectTrigger>
              <SelectContent>{["all", "posted", "pending", "flagged"].map((s) => <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s[0].toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant={onlyAnomalies ? "default" : "outline"} onClick={() => setOnlyAnomalies((v) => !v)} aria-pressed={onlyAnomalies}>Anomalies only</Button>
          </div>
        </div>
        <div className="mb-2 text-xs text-muted-foreground">{rows.length} of {all.length} transactions</div>
        {rows.length === 0 ? (
          <EmptyState title="No transactions match these filters" action={<Button variant="outline" size="sm" onClick={reset}>Reset filters</Button>} />
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium">ID</th>
                  <SortHead k="date" label="Date" />
                  <SortHead k="merchant" label="Merchant" />
                  <th scope="col" className="px-3 py-2 text-left font-medium">Category</th>
                  <SortHead k="amount" label="Amount" right />
                  <th scope="col" className="px-3 py-2 text-left font-medium">Status</th>
                  <SortHead k="riskScore" label="Risk" right />
                  <th scope="col" className="px-3 py-2 text-left font-medium">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((t) => (
                  <tr key={t.id} tabIndex={0} onClick={() => setSelected(t)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelected(t))} className="cursor-pointer hover:bg-muted/40 focus-visible:bg-muted/60 focus-visible:outline-none">
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{t.id}</td>
                    <td className="tabular px-3 py-2">{t.date}</td>
                    <td className="px-3 py-2 font-medium">{t.merchant}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.category}</td>
                    <td className={`tabular px-3 py-2 text-right ${t.type === "credit" ? "text-success" : ""}`}>{t.type === "credit" ? "+" : "−"}{fmtUSD(t.amount, 2)}</td>
                    <td className="px-3 py-2"><Pill tone={t.status === "flagged" ? "danger" : t.status === "pending" ? "warning" : "muted"}>{t.status}</Pill></td>
                    <td className="px-3 py-2 text-right"><Pill tone={scoreTone(t.riskScore)}>{t.riskScore}</Pill></td>
                    <td className="px-3 py-2">{t.anomaly ? <Pill tone="danger">Anomaly</Pill> : <span className="text-muted-foreground">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.merchant}</SheetTitle>
                <SheetDescription className="font-mono">{selected.id}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 p-4">
                <div className={`tabular text-3xl font-semibold ${selected.type === "credit" ? "text-success" : ""}`}>{selected.type === "credit" ? "+" : "−"}{fmtUSD(selected.amount, 2)}</div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[["Date", selected.date], ["Category", selected.category], ["Type", selected.type], ["Status", selected.status], ["Risk score", String(selected.riskScore)], ["Description", selected.description]].map(([k, v]) => (
                    <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="capitalize-first">{v}</dd></div>
                  ))}
                </dl>
                {selected.anomaly && (
                  <div className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm">
                    <div className="font-medium text-danger">Anomaly indicator</div>
                    <p className="mt-1">{selected.anomalyReason}</p>
                  </div>
                )}
                <Link to="/assistant" search={{ q: `Review transaction ${selected.id} for risk and policy approval requirements`, tx: selected.id }} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  <Bot className="size-4" /> Ask AI about this transaction
                </Link>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
