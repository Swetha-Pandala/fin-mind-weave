import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Activity, BarChart3, BookOpen, Bot, FileText, LayoutDashboard, Menu, Network, ShieldAlert } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/config/app";
import { ensureRunsLoaded } from "@/services/run-store";
import { getProvider } from "@/services/providers";

export const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assistant", label: "AI Assistant", icon: Bot },
  { to: "/transactions", label: "Transactions", icon: BarChart3 },
  { to: "/knowledge", label: "Knowledge Base", icon: BookOpen },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/observability", label: "Evaluation", icon: Activity },
  { to: "/architecture", label: "Architecture", icon: Network },
] as const;

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="grid size-9 place-items-center rounded-md border border-primary/40 bg-primary/10 text-primary">
        <Network className="size-5" aria-hidden />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">{appConfig.shortName}</div>
        <div className="text-[11px] text-muted-foreground">Portfolio · {appConfig.author}</div>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Primary" className="flex flex-col gap-0.5">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium [&>svg]:text-primary" }}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function ModeBadge() {
  const p = getProvider();
  return (
    <div className="rounded-md border border-border bg-muted/50 p-3 text-xs">
      <div className="flex items-center gap-2 font-medium">
        <span className="size-2 rounded-full bg-success" aria-hidden />
        {p.id === "demo" ? "DEMO MODE" : p.label}
      </div>
      <div className="mt-1 text-muted-foreground">{p.model}</div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    void ensureRunsLoaded();
  }, []);
  const current = NAV.find((n) => (n.to === "/" ? path === "/" : path.startsWith(n.to)));

  return (
    <div className="min-h-screen bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Brand />
        <div className="mt-8 flex-1">
          <NavLinks />
        </div>
        <ModeBadge />
      </aside>

      <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open navigation">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-sidebar p-4">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Brand />
            <div className="mt-8">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <div className="mt-6">
              <ModeBadge />
            </div>
          </SheetContent>
        </Sheet>
        <span className="text-sm font-medium">{current?.label ?? appConfig.shortName}</span>
      </header>

      <div className="lg:pl-60">
        <main id="main" className="mx-auto max-w-[1400px] px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>

      <div role="note" className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-2 text-center text-[11px] text-muted-foreground backdrop-blur lg:left-60">
        <ShieldAlert className="mr-1.5 inline size-3.5 text-warning" aria-hidden />
        {appConfig.disclaimer}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
