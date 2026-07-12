"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMMAND PALETTE (⌘K)
// The app has ~530 pages but the sidebar surfaces 27 — this is how everything
// else is reached. Global search across children, staff, create actions and every
// page, opened with ⌘K / Ctrl+K, the header search button, or the custom
// "cara:open-palette" event. Arrow keys + Enter to navigate; recents remembered.
//
// Mounted ONCE in the (platform) layout — it is the single ⌘K owner (the
// Quick-Create launcher moved to ⌘J). Scoring lives in the pure, tested
// lib/command-palette ranker; this component stays thin: data in (live hooks,
// permission-filtered), selection out (router.push).
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, GLOBAL_CREATE_ITEMS } from "@/config/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useStaff } from "@/hooks/use-staff";
import type { StaffEnriched } from "@/hooks/use-staff";
import {
  rankEntries,
  emptyQueryEntries,
  type PaletteEntry,
  type PaletteKind,
} from "@/lib/command-palette/rank";
import { buildPaletteEntries, type PalettePerson } from "@/lib/command-palette/entries";
import {
  Search, Heart, Users, ArrowRight, CornerDownLeft, Clock,
  LayoutDashboard, Shield, Pill, AlertTriangle, CheckSquare,
  Calendar, GraduationCap, FileText, Building2, BarChart3,
  Sparkles, Settings, Command, Plus,
} from "lucide-react";

// ── Icon resolution (compact: common nav icons map to a small visual set) ─────

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Heart, HeartHandshake: Heart, CheckSquare, Users, Building2,
  ShieldCheck: Shield, BarChart3, Sparkles, Settings, ClipboardList: FileText,
  BookOpen: FileText, AlertTriangle, Shield, Pill, Calendar, GraduationCap,
  FileText, CalendarDays: Calendar, CalendarClock: Calendar, CalendarCheck: Calendar,
  MessageSquare: FileText, MessageCircle: FileText, ScrollText: FileText,
  FileCheck: FileText, FileSignature: FileText, ListChecks: CheckSquare,
  ClipboardCheck: CheckSquare, Target: LayoutDashboard, Brain: Sparkles,
  Wand2: Sparkles, Lightbulb: Sparkles, PlayCircle: Sparkles, Puzzle: Sparkles,
  Radar: Shield, ShieldAlert: Shield, Eye: Shield, Gavel: Shield, Award: Shield,
  Fingerprint: Shield, Flag: AlertTriangle, MapPin: AlertTriangle,
  ArrowRightLeft: ArrowRight, User: Users, UserCheck: Users, Network: Users,
  Milestone: Users, TrendingUp: BarChart3, Activity: BarChart3, Layers: BarChart3,
  BarChart2: BarChart3, LineChart: BarChart3, Receipt: BarChart3,
  Wrench: Building2, Car: Building2, Lock: Shield, Moon: Clock, Clock,
  PhoneCall: Heart, Zap: Sparkles, Sunrise: Clock, Plus,
};

function iconFor(entry: PaletteEntry): React.ElementType {
  if (entry.kind === "child") return Heart;
  if (entry.kind === "staff") return Users;
  if (entry.kind === "action") return Plus;
  return (entry.iconKey && ICON_MAP[entry.iconKey]) || LayoutDashboard;
}

// ── Recents (localStorage) ─────────────────────────────────────────────────────

const RECENTS_KEY = "cara:palette:recents";
const RECENTS_MAX = 7;

function readRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function pushRecent(id: string): string[] {
  const next = [id, ...readRecents().filter((x) => x !== id)].slice(0, RECENTS_MAX);
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — recents just don't persist
  }
  return next;
}

// ── Section labels ─────────────────────────────────────────────────────────────

const KIND_LABEL: Record<PaletteKind, string> = {
  child: "Children",
  staff: "Staff",
  action: "Create",
  page: "Pages",
};
const KIND_ORDER: PaletteKind[] = ["child", "staff", "action", "page"];

// ── Component ──────────────────────────────────────────────────────────────────

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recents, setRecents] = useState<string[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { canAccess } = usePermissions();

  // Live people (TanStack cache is shared with the dashboard, so this is warm).
  const ypQuery = useYoungPeople("current");
  const staffQuery = useStaff({ status: "active" });

  const entries = useMemo(() => {
    const children: PalettePerson[] = (ypQuery.data?.data ?? []).map((yp) => ({
      id: yp.id,
      name: yp.preferred_name || `${yp.first_name} ${yp.last_name}`.trim(),
      aliases: [yp.first_name, yp.last_name, yp.preferred_name ?? ""].filter(Boolean),
      hint: `Young person${yp.key_worker ? ` · key worker ${yp.key_worker}` : ""}`,
    }));
    const staff: PalettePerson[] = ((staffQuery.data?.data ?? []) as StaffEnriched[]).map((s) => ({
      id: s.id,
      name: s.full_name || `${s.first_name} ${s.last_name}`.trim(),
      aliases: [s.first_name, s.last_name].filter(Boolean),
      hint: s.role ? s.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Staff",
    }));
    const all = buildPaletteEntries({
      navGroups: NAV_GROUPS,
      createItems: GLOBAL_CREATE_ITEMS,
      children,
      staff,
    });
    // Server-side permissions are the enforcement; this mirrors the sidebar so
    // the palette never advertises a page the caller's role can't open.
    return all.filter((e) => !e.module || canAccess(e.module));
  }, [ypQuery.data, staffQuery.data, canAccess]);

  const results: PaletteEntry[] = useMemo(() => {
    if (!query.trim()) return emptyQueryEntries(entries, recents, 12);
    return rankEntries(entries, query, { recents, limit: 14 }).map((r) => r.entry);
  }, [entries, query, recents]);

  const grouped = useMemo(() => {
    const isRecentsView = !query.trim() && recents.length > 0;
    if (isRecentsView) {
      const recentSet = new Set(recents);
      const recent = results.filter((e) => recentSet.has(e.id));
      const rest = results.filter((e) => !recentSet.has(e.id));
      const groups: { label: string; items: PaletteEntry[] }[] = [];
      if (recent.length) groups.push({ label: "Recent", items: recent });
      if (rest.length) groups.push({ label: "Suggestions", items: rest });
      return groups;
    }
    return KIND_ORDER.map((k) => ({
      label: KIND_LABEL[k],
      items: results.filter((e) => e.kind === k),
    })).filter((g) => g.items.length > 0);
  }, [results, query, recents]);

  const flatItems = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  // ── Open triggers: ⌘K / Ctrl+K (single owner) + the header's custom event ──
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("cara:open-palette", onOpenEvent);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("cara:open-palette", onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setRecents(readRecents());
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const select = useCallback(
    (entry: PaletteEntry) => {
      setRecents(pushRecent(entry.id));
      setOpen(false);
      router.push(entry.href);
    },
    [router],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = flatItems[selectedIndex];
        if (item) select(item);
      }
    },
    [flatItems, selectedIndex, select],
  );

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  useEffect(() => setSelectedIndex(0), [query]);

  if (!open) return null;

  let flatIndex = -1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Panel — Ask CARA dark glass, matching the command-centre hero */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="fixed inset-x-0 top-[12%] z-[71] mx-auto w-full max-w-2xl px-4 animate-fade-in"
      >
        <div
          className="overflow-hidden rounded-[22px] border border-white/[0.09] text-white shadow-[0_30px_80px_-20px_rgba(3,6,15,0.95)]"
          style={{
            background:
              "radial-gradient(120% 80% at 100% -10%, rgba(99,102,241,0.16) 0%, transparent 50%)," +
              "radial-gradient(80% 60% at -5% 0%, rgba(45,212,191,0.10) 0%, transparent 45%)," +
              "linear-gradient(180deg, #0b1020 0%, #0c1226 60%, #0e1730 100%)",
          }}
        >
          {/* Input row */}
          <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3.5">
            <Search className="h-[18px] w-[18px] shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search children, staff, pages — or type “new” to create…"
              aria-label="Search everything"
              className="flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-slate-500"
            />
            <kbd className="hidden h-5 items-center rounded border border-white/15 bg-white/[0.06] px-1.5 text-[10px] font-medium text-slate-400 sm:inline-flex">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-2" role="listbox" aria-label="Results">
            {flatItems.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Search className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                <p className="text-sm font-medium text-slate-300">No matches</p>
                <p className="mt-1 text-xs text-slate-500">Try fewer letters — fuzzy matching finds near-misses.</p>
              </div>
            ) : (
              grouped.map((g) => (
                <div key={g.label}>
                  <div className="px-4 pb-1 pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{g.label}</span>
                  </div>
                  {g.items.map((item) => {
                    flatIndex++;
                    const idx = flatIndex;
                    const isSelected = idx === selectedIndex;
                    const Icon = iconFor(item);
                    return (
                      <button
                        key={item.id}
                        data-index={idx}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => select(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          isSelected ? "bg-white/[0.08]" : "hover:bg-white/[0.05]",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors",
                            item.kind === "child"
                              ? "bg-amber-300/15 text-amber-200"
                              : item.kind === "staff"
                                ? "bg-teal-300/15 text-teal-200"
                                : item.kind === "action"
                                  ? "bg-indigo-300/15 text-indigo-200"
                                  : "bg-white/[0.06] text-slate-400",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cn("block truncate text-[14px] font-medium", isSelected ? "text-white" : "text-slate-200")}>
                            {item.label}
                          </span>
                          {item.hint && <span className="block truncate text-[11.5px] text-slate-500">{item.hint}</span>}
                        </span>
                        {isSelected && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-teal-300" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hints */}
          <div className="flex items-center justify-between border-t border-white/[0.08] bg-white/[0.02] px-4 py-2">
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <kbd className="inline-flex h-4 items-center rounded border border-white/15 bg-white/[0.06] px-1 text-[9px] font-medium">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="inline-flex h-4 items-center rounded border border-white/15 bg-white/[0.06] px-1 text-[9px] font-medium">↵</kbd>
                open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="inline-flex h-4 items-center rounded border border-white/15 bg-white/[0.06] px-1 text-[9px] font-medium">esc</kbd>
                close
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <Command className="h-3 w-3" />
              <span>K anywhere · ⌘J quick create</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
