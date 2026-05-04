"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TOP BAR (redesigned)
// Global search · Create · Aria button · Notifications · User profile
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GlobalCreateMenu } from "@/components/common/global-create-menu";
import { AriaDrawer, type AriaDrawerContext } from "@/components/aria/aria-drawer";
import { NotificationCentre } from "@/components/layout/notification-centre";
import { CommandPalette } from "@/components/layout/command-palette";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NAV_GROUPS } from "@/config/navigation";
import {
  Search, Bell, Sparkles, X, ChevronRight, Command,
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
  ariaContext?: AriaDrawerContext;
}

export function Header({ title, subtitle, actions, ariaContext }: HeaderProps) {
  const breadcrumb = useBreadcrumb();

  const [ariaOpen, setAriaOpen]       = useState(false);
  const [todayStr, setTodayStr]       = useState("");

  useEffect(() => {
    setTodayStr(
      new Date().toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    );
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2 sm:gap-3 px-4 md:px-6 h-[56px] sm:h-[60px]">

          {/* ── Left: breadcrumb + title ── */}
          <div className="flex-1 min-w-0">
            {breadcrumb.length > 0 && (
              <div className="flex items-center gap-1 mb-0.5">
                {breadcrumb.map((crumb, i) => (
                  <React.Fragment key={crumb.href}>
                    {i > 0 && <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />}
                    <Link
                      href={crumb.href}
                      className={cn(
                        "text-[11px] transition-colors truncate",
                        i === breadcrumb.length - 1
                          ? "text-slate-500 font-medium pointer-events-none"
                          : "text-slate-400 hover:text-slate-600",
                      )}
                    >
                      {crumb.label}
                    </Link>
                  </React.Fragment>
                ))}
              </div>
            )}
            <h1 className="text-[15px] font-semibold text-slate-900 leading-tight truncate">
              {title}
            </h1>
          </div>

          {/* ── Right: controls ── */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search (opens Command Palette) */}
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
              className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Search (⌘K)"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="text-xs">Search...</span>
              <kbd className="ml-1 inline-flex h-4 items-center rounded border border-slate-200 bg-white px-1 text-[9px] font-medium text-slate-400">
                <Command className="h-2.5 w-2.5 mr-0.5" />K
              </kbd>
            </button>
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
              className="sm:hidden flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Custom actions from the page */}
            {actions}

            {/* Global Create */}
            <GlobalCreateMenu />

            {/* Aria button */}
            <button
              onClick={() => setAriaOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all border",
                ariaOpen
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-indigo-200 text-indigo-700 hover:bg-indigo-50",
              )}
              title="Open Aria"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Aria</span>
            </button>

            {/* Notification Centre */}
            <NotificationCentre />
          </div>

          {/* Command Palette (global Cmd+K) */}
          <CommandPalette />
        </div>

        {/* ── Optional subtitle bar ── */}
        {subtitle && (
          <div className="hidden sm:block border-t border-slate-100 px-4 md:px-6 py-1.5">
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          </div>
        )}
      </header>

      {/* ── Aria Drawer ── */}
      <AriaDrawer
        open={ariaOpen}
        onClose={() => setAriaOpen(false)}
        context={{
          pageTitle: title,
          ...(ariaContext ?? {}),
        }}
      />
    </>
  );
}
