"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — TOP BAR (redesigned)
// Global search · Create · Cara button · Notifications · User profile
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GlobalCreateMenu } from "@/components/common/global-create-menu";
import { CaraDrawer, type CaraDrawerContext } from "@/components/cara/cara-drawer";
import { NotificationCentre } from "@/components/layout/notification-centre";
import { NAV_GROUPS } from "@/config/navigation";
import {
  Search, Sparkles, ChevronRight, Command,
} from "lucide-react";

// ── Breadcrumb helper ─────────────────────────────────────────────────────────

function useBreadcrumb(): { label: string; href: string }[] {
  const pathname = usePathname();

  // Find which nav group + child matches the current path
  for (const group of NAV_GROUPS) {
    for (const child of group.children) {
      const match =
        pathname === child.href ||
        (child.href !== "/dashboard" && pathname.startsWith(child.href + "/"));
      if (match) {
        return [
          { label: group.label, href: group.href },
          { label: child.label, href: child.href },
        ];
      }
    }
  }
  return [];
}

// ── Header component ──────────────────────────────────────────────────────────

interface HeaderProps {
  title:    string;
  subtitle?: string;
  actions?:  React.ReactNode;
  caraContext?: CaraDrawerContext;
}

export function Header({ title, subtitle, actions, caraContext }: HeaderProps) {
  const breadcrumb = useBreadcrumb();

  const [caraOpen, setCaraOpen] = useState(false);

  return (
    <>
      <header className="cara-chrome sticky top-0 z-30 border-b border-[var(--cs-border)] bg-[var(--cs-surface-elevated)]/85 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--cs-surface-elevated)]/75">
        <div className="flex items-center gap-2 sm:gap-3 px-4 md:px-6 h-[56px] sm:h-[60px]">

          {/* ── Left: breadcrumb + title ── */}
          <div className="flex-1 min-w-0">
            {breadcrumb.length > 0 && (
              <div className="flex items-center gap-1 mb-0.5">
                {/* key includes the index: group and child crumbs can share an
                    href (e.g. "/staff"), so href alone is not unique */}
                {breadcrumb.map((crumb, i) => (
                  <React.Fragment key={`${i}-${crumb.href}`}>
                    {i > 0 && <ChevronRight className="h-3 w-3 text-[var(--cs-text-gentle)] shrink-0" />}
                    <Link
                      href={crumb.href}
                      className={cn(
                        "text-[11px] transition-colors truncate",
                        i === breadcrumb.length - 1
                          ? "text-[var(--cs-text-muted)] font-medium pointer-events-none"
                          : "text-[var(--cs-text-gentle)] hover:text-[var(--cs-text-secondary)]",
                      )}
                    >
                      {crumb.label}
                    </Link>
                  </React.Fragment>
                ))}
              </div>
            )}
            {/* suppressHydrationWarning: several pages derive the title/subtitle
                from the current time (greeting, live date). Statically prerendered
                HTML can straddle a time boundary, so the client text legitimately
                differs — accept the client value instead of a hydration error. */}
            <h1 suppressHydrationWarning className="text-[17px] font-extrabold text-[var(--cs-navy)] leading-tight truncate tracking-tight">
              {title}
            </h1>
          </div>

          {/* ── Right: controls ── */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search (opens Command Palette) */}
            <button
              onClick={() => document.dispatchEvent(new CustomEvent("cara:open-palette"))}
              className="hidden sm:flex items-center gap-2 rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-1.5 text-[var(--cs-text-muted)] hover:bg-[var(--cs-cara-gold-bg)] hover:border-[var(--cs-cara-gold-soft)] hover:text-[var(--cs-text-secondary)] transition-colors"
              title="Search (⌘K)"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="text-xs">Search...</span>
              <kbd className="ml-1 inline-flex h-4 items-center rounded border border-[var(--cs-border)] bg-white/10 px-1 text-[9px] font-medium text-[var(--cs-text-muted)]">
                <Command className="h-2.5 w-2.5 mr-0.5" />K
              </kbd>
            </button>
            <button
              onClick={() => document.dispatchEvent(new CustomEvent("cara:open-palette"))}
              className="sm:hidden flex h-8 w-8 items-center justify-center rounded-xl text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface)] hover:text-[var(--cs-text-secondary)] transition-colors"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Custom actions from the page */}
            {actions}

            {/* Global Create */}
            <GlobalCreateMenu />

            {/* Cara button */}
            <button
              onClick={() => setCaraOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all border",
                caraOpen
                  ? "bg-[var(--cs-cara-gold)] text-[var(--cs-navy)] border-[var(--cs-cara-gold)] shadow-[var(--cs-shadow-glow-gold)]"
                  : "border-[var(--cs-cara-gold-soft)] text-[var(--cs-cara-gold)] hover:bg-[var(--cs-cara-gold-bg)] hover:border-[var(--cs-cara-gold)]",
              )}
              title="Open Cara"
            >
              <Sparkles className={cn("h-3.5 w-3.5", caraOpen && "cara-pulse")} />
              <span className="hidden sm:inline">Cara</span>
            </button>

            {/* Notification Centre */}
            <NotificationCentre />
          </div>

          {/* Command Palette (global Cmd+K) */}
        </div>

        {/* ── Optional subtitle bar ── */}
        {subtitle && (
          <div className="hidden sm:block border-t border-[var(--cs-border-subtle)] px-4 md:px-6 py-1.5">
            <p suppressHydrationWarning className="text-[11px] text-[var(--cs-text-muted)]">{subtitle}</p>
          </div>
        )}
      </header>

      {/* ── Cara Drawer ── */}
      <CaraDrawer
        open={caraOpen}
        onClose={() => setCaraOpen(false)}
        context={{
          pageTitle: title,
          ...(caraContext ?? {}),
        }}
      />
    </>
  );
}
