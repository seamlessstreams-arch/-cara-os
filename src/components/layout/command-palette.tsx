"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMMAND PALETTE (Cmd+K)
// Global search across children, staff, pages, and recent actions.
// Opens with Cmd+K / Ctrl+K. Navigate with arrow keys, select with Enter.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/config/navigation";
import { YOUNG_PEOPLE, STAFF } from "@/lib/seed-data";
import { usePermissions } from "@/hooks/use-permissions";
import {
  Search, Heart, Users, ArrowRight, CornerDownLeft,
  LayoutDashboard, Shield, Pill, AlertTriangle, CheckSquare,
  Calendar, GraduationCap, FileText, Building2, BarChart3,
  Sparkles, Settings, X, Clock, ChevronRight, Command,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: React.ElementType;
  group: "children" | "staff" | "pages" | "actions";
  keywords?: string[];
}

// ── Icon map for nav items ───────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Heart, HeartHandshake: Heart, CheckSquare, Users, Building2,
  ShieldCheck: Shield, BarChart3, Sparkles, Settings, ClipboardList: FileText,
  BookOpen: FileText, AlertTriangle, Shield, Pill, Calendar, GraduationCap,
  FileText, Target: LayoutDashboard, Brain: Sparkles, Eye: Shield,
  ArrowRightLeft: ArrowRight, User: Users, Wrench: Building2, Car: Building2,
  Receipt: BarChart3, Clock, Gavel: Shield, Award: Shield, Flag: AlertTriangle,
  Lightbulb: Sparkles, Activity: BarChart3, Wand2: Sparkles, Network: Users,
  Milestone: Users, UserCheck: Users, Fingerprint: Shield, TrendingUp: BarChart3,
  MessageSquare: FileText, Puzzle: Sparkles, PlayCircle: Sparkles, Radar: Shield,
  ScrollText: FileText, ListChecks: CheckSquare, Layers: BarChart3,
  BarChart2: BarChart3, MapPin: AlertTriangle, PhoneCall: Heart, FileCheck: FileText,
  MessageCircle: FileText, ShieldAlert: Shield, ClipboardCheck: CheckSquare,
};

// ── Build static items ───────────────────────────────────────────────────────

function buildItems(): CommandItem[] {
  const items: CommandItem[] = [];

  // Children
  YOUNG_PEOPLE.forEach((child) => {
    items.push({
      id: `child_${child.id}`,
      label: child.preferred_name || child.first_name,
      description: `${child.first_name} ${child.last_name} - View profile`,
      href: `/young-people/${child.id}`,
      icon: Heart,
      group: "children",
      keywords: [child.first_name, child.last_name, child.preferred_name || ""].filter(Boolean),
    });
  });

  // Staff
  STAFF.forEach((staff) => {
    items.push({
      id: `staff_${staff.id}`,
      label: `${staff.first_name} ${staff.last_name}`,
      description: staff.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: `/staff/${staff.id}`,
      icon: Users,
      group: "staff",
      keywords: [staff.first_name, staff.last_name],
    });
  });

  // Pages from navigation
  NAV_GROUPS.forEach((group) => {
    group.children.forEach((child) => {
      const Icon = (child.icon ? ICON_MAP[child.icon] : null) ?? LayoutDashboard;
      items.push({
        id: `page_${child.href}`,
        label: child.label,
        description: `${group.label} > ${child.label}`,
        href: child.href,
        icon: Icon,
        group: "pages",
        keywords: [child.label, group.label],
      });
    });
  });

  // Quick actions
  const actions: Omit<CommandItem, "group">[] = [
    { id: "action_new_incident", label: "Log new incident", href: "/incidents", icon: AlertTriangle, description: "Create a new incident record" },
    { id: "action_new_task", label: "Create new task", href: "/tasks", icon: CheckSquare, description: "Assign a task to a team member" },
    { id: "action_daily_log", label: "Add daily log entry", href: "/daily-log", icon: FileText, description: "Record a daily log for a young person" },
    { id: "action_handover", label: "View handover", href: "/handover", icon: ArrowRight, description: "Review shift handover notes" },
    { id: "action_medication", label: "Administer medication", href: "/medication", icon: Pill, description: "Record medication administration" },
    { id: "action_supervision", label: "Schedule supervision", href: "/supervision", icon: Users, description: "Book a staff supervision session" },
    { id: "action_cara", label: "Open Cara Intelligence", href: "/intelligence", icon: Sparkles, description: "AI-powered care insights" },
  ];
  actions.forEach((a) => items.push({ ...a, group: "actions" }));

  return items;
}

const ALL_ITEMS = buildItems();

// ── Group labels ─────────────────────────────────────────────────────────────

const GROUP_LABELS: Record<string, string> = {
  children: "Children",
  staff: "Staff",
  pages: "Pages",
  actions: "Quick Actions",
};

const GROUP_ORDER: CommandItem["group"][] = ["children", "staff", "actions", "pages"];

// ── Component ────────────────────────────────────────────────────────────────

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { canAccess } = usePermissions();

  // Filter items
  const filtered = useMemo(() => {
    if (!query.trim()) {
      // Show top items from each group when empty
      const children = ALL_ITEMS.filter((i) => i.group === "children").slice(0, 4);
      const staff    = ALL_ITEMS.filter((i) => i.group === "staff").slice(0, 3);
      const actions  = ALL_ITEMS.filter((i) => i.group === "actions");
      const pages    = ALL_ITEMS.filter((i) => i.group === "pages").slice(0, 5);
      return [...children, ...staff, ...actions, ...pages];
    }

    const q = query.toLowerCase().trim();
    const terms = q.split(/\s+/);

    return ALL_ITEMS
      .map((item) => {
        const searchable = [
          item.label,
          item.description || "",
          ...(item.keywords || []),
        ].join(" ").toLowerCase();

        // All terms must match
        const allMatch = terms.every((t) => searchable.includes(t));
        if (!allMatch) return null;

        // Score: exact label match > starts-with > contains
        let score = 0;
        if (item.label.toLowerCase() === q) score = 100;
        else if (item.label.toLowerCase().startsWith(q)) score = 80;
        else if (item.label.toLowerCase().includes(q)) score = 60;
        else score = 40;

        // Boost children and staff (most commonly searched)
        if (item.group === "children") score += 10;
        if (item.group === "staff") score += 5;

        return { item, score };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 15)
      .map((r) => r!.item);
  }, [query]);

  // Group filtered items
  const grouped = useMemo(() => {
    const groups: { group: CommandItem["group"]; items: CommandItem[] }[] = [];
    for (const g of GROUP_ORDER) {
      const items = filtered.filter((i) => i.group === g);
      if (items.length > 0) groups.push({ group: g, items });
    }
    return groups;
  }, [filtered]);

  // Flat list for keyboard navigation
  const flatItems = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  // ── Keyboard shortcut to open ──────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // ── Navigation keyboard handlers ───────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
      if (item) {
        router.push(item.href);
        setOpen(false);
      }
    }
  }, [flatItems, selectedIndex, router]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Reset index when query changes
  useEffect(() => setSelectedIndex(0), [query]);

  if (!open) return null;

  let flatIndex = -1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-fade-in"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="fixed inset-x-0 top-[15%] mx-auto w-full max-w-lg z-[61] px-4 animate-fade-in">
        <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] shadow-[var(--cs-shadow-elevated)] overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--cs-border-subtle)]">
            <Search className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search children, staff, pages, actions..."
              className="flex-1 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-gentle)] outline-none bg-transparent"
            />
            <div className="flex items-center gap-1 shrink-0">
              <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-[var(--cs-border)] bg-[var(--cs-surface)] px-1.5 text-[10px] font-medium text-[var(--cs-text-muted)]">
                ESC
              </kbd>
            </div>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
            {flatItems.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Search className="h-8 w-8 text-[var(--cs-text-gentle)] mx-auto mb-2" />
                <p className="text-sm font-medium text-[var(--cs-text-secondary)]">No results found</p>
                <p className="text-xs text-[var(--cs-text-muted)] mt-1">Try a different search term</p>
              </div>
            ) : (
              grouped.map((g) => (
                <div key={g.group}>
                  <div className="px-4 py-1.5">
                    <span className="text-[10px] font-semibold text-[var(--cs-text-gentle)] uppercase tracking-widest">
                      {GROUP_LABELS[g.group]}
                    </span>
                  </div>
                  {(g.items ?? []).map((item) => {
                    flatIndex++;
                    const idx = flatIndex;
                    const isSelected = idx === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        data-index={idx}
                        onClick={() => {
                          router.push(item.href);
                          setOpen(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          isSelected ? "bg-[var(--cs-cara-gold-bg)]" : "hover:bg-[var(--cs-surface)]",
                        )}
                      >
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-xl shrink-0 transition-colors",
                          isSelected ? "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)]" : "bg-[var(--cs-surface)] text-[var(--cs-text-muted)]",
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            isSelected ? "text-[var(--cs-navy)]" : "text-[var(--cs-text-primary)]",
                          )}>
                            {item.label}
                          </p>
                          {item.description && (
                            <p className="text-[11px] text-[var(--cs-text-muted)] truncate">{item.description}</p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-1 shrink-0">
                            <CornerDownLeft className="h-3 w-3 text-[var(--cs-cara-gold)]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hints */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--cs-border-subtle)] bg-[var(--cs-surface)]/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[10px] text-[var(--cs-text-gentle)]">
                <kbd className="inline-flex h-4 items-center rounded border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-1 text-[9px] font-medium">
                  ↑↓
                </kbd>
                <span>navigate</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[var(--cs-text-gentle)]">
                <kbd className="inline-flex h-4 items-center rounded border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-1 text-[9px] font-medium">
                  ↵
                </kbd>
                <span>select</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[var(--cs-text-gentle)]">
                <kbd className="inline-flex h-4 items-center rounded border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-1 text-[9px] font-medium">
                  esc
                </kbd>
                <span>close</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[var(--cs-text-gentle)]">
              <Command className="h-3 w-3" />
              <span>K to open</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
