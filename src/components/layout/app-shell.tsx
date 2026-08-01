import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  FileText,
  Map as MapIcon,
  Sparkles,
  FolderOpen,
  BookOpen,
  CreditCard,
  Settings as SettingsIcon,
  Menu,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { PaymentTestModeBanner } from "@/components/billing/payment-test-mode-banner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/blueprint", label: "My Blueprint", icon: FileText },
  { to: "/roadmap", label: "Roadmap", icon: MapIcon },
  { to: "/copilot", label: "Publisher Copilot", icon: Sparkles },
  { to: "/copilot/documents", label: "Strategy Library", icon: FolderOpen },
  { to: "/resources", label: "Resources", icon: BookOpen },
  { to: "/pricing", label: "Plans & Billing", icon: CreditCard },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

function NavList({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav className="space-y-1" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        // Longest matching prefix wins so nested Copilot routes highlight the
        // specific entry rather than both it and its parent.
        const matches = NAV_ITEMS.filter(
          (candidate) => pathname === candidate.to || pathname.startsWith(`${candidate.to}/`),
        );
        const best = matches.reduce<string | null>(
          (longest, candidate) => (longest && longest.length >= candidate.to.length ? longest : candidate.to),
          null,
        );
        const active = best === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex h-full flex-col gap-8 bg-sidebar p-5">
      <Link to="/dashboard" onClick={onNavigate}>
        <Logo inverted />
      </Link>

      <div className="flex-1">
        <NavList onNavigate={onNavigate} />
      </div>

      <div className="space-y-3 border-t border-sidebar-border pt-4">
        <p className="truncate px-3 text-xs text-sidebar-foreground/60">{user?.email ?? "Signed in"}</p>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

/** Application chrome: persistent sidebar on desktop, sheet on mobile. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 w-64">
          <SidebarBody />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <PaymentTestModeBanner />
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-sidebar-border p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <Logo />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-14">{children}</main>
      </div>
    </div>
  );
}
