"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TOP BAR (AppShell variant)
// Minimal persistent bar: home name, search trigger, role badge, bell, avatar.
// Sits above the main content area alongside the sidebar.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { useSidebar } from "@/contexts/sidebar-context";
import { useSidebarCounts } from "@/hooks/use-sidebar-counts";
import { APP_ROLE_LABELS, type AppRole } from "@/lib/permissions";
import { Building2, Search, Bell, Command } from "lucide-react";

// ── TopBar ──────────────────────────────────────────────────────────────────

export function TopBar() {
  const { currentUser, currentRole } = useAuthContext();
  const { isMobile } = useSidebar();
  const counts = useSidebarCounts();

  const initials =
    `${currentUser?.first_name?.[0] ?? ""}${currentUser?.last_name?.[0] ?? ""}` || "?";
  const roleLabel = APP_ROLE_LABELS[currentRole as AppRole] ?? currentRole;
  const notificationCount = counts.notifications;

  function openCommandPalette() {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true })
    );
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white px-4 md:px-6",
        "border-[#e5e7eb]",
      )}
    >
      {/* ── Left: Home name ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0">
        <Building2 className="h-4.5 w-4.5 shrink-0 text-slate-400" />
        {!isMobile && (
          <span className="text-sm font-semibold text-slate-800 truncate">
            Chamberlain House
          </span>
        )}
      </div>

      {/* ── Centre: Search trigger ───────────────────────────────────── */}
      <div className="flex-1 flex justify-center">
        <button
          onClick={openCommandPalette}
          className={cn(
            "flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5",
            "text-slate-400 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-500 transition-colors",
            "max-w-xs w-full sm:w-64",
          )}
          title="Search (Cmd+K)"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs flex-1 text-left truncate">Search...</span>
          <kbd className="hidden sm:inline-flex h-4 items-center rounded border border-slate-200 bg-white px-1 text-[9px] font-medium text-slate-400">
            <Command className="h-2.5 w-2.5 mr-0.5" />K
          </kbd>
        </button>
      </div>

      {/* ── Right: role badge + bell + avatar ────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Role badge */}
        {!isMobile && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 whitespace-nowrap">
            {roleLabel}
          </span>
        )}

        {/* Notification bell */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </button>

        {/* User avatar */}
        <div
          className="group relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white cursor-default shrink-0"
          title={currentUser?.full_name ?? "User"}
        >
          {initials}

          {/* Hover tooltip with full name */}
          <div className="pointer-events-none absolute right-0 top-full mt-1.5 whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {currentUser?.full_name ?? "Unknown"}
          </div>
        </div>
      </div>
    </header>
  );
}
