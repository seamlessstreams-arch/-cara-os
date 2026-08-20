"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — DOMAIN CREATE MENU
// Contextual "Create" dropdown within a specific domain (Young Person,
// Employee, Home). Shows only that domain's forms, grouped by category,
// with search, permission filtering, and optional context pre-linking.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import {
  type FormDomain,
  type FormDefinition,
  DOMAIN_CONFIG,
  getFormCategories,
} from "@/config/form-registry";
import {
  Plus,
  X,
  Search,
  BookOpen,
  AlertTriangle,
  AlertOctagon,
  MapPin,
  Pill,
  PhoneCall,
  CheckSquare,
  FileCheck,
  Upload,
  ShieldCheck,
  ShieldAlert,
  MessageCircle,
  MessageSquare,
  Wrench,
  Car,
  Sparkles,
  ListChecks,
  Moon,
  CloudMoon,
  Eye,
  UtensilsCrossed,
  Shield,
  PersonStanding,
  Stethoscope,
  Smile,
  Brain,
  Syringe,
  GraduationCap,
  CalendarDays,
  Heart,
  Scale,
  Users,
  ClipboardList,
  Milestone,
  ArrowRightLeft,
  Mic,
  Award,
  BookHeart,
  Gavel,
  FileText,
  ClipboardCheck,
  HeartPulse,
  UserCheck,
  Fingerprint,
  Target,
  TrendingUp,
  Settings,
  Flame,
  Building2,
  Home,
  Sprout,
  Package,
  Bell,
  Star,
  FileSearch,
  HeartHandshake,
} from "lucide-react";

// ── Icon lookup ─────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  AlertTriangle,
  AlertOctagon,
  MapPin,
  Pill,
  PhoneCall,
  CheckSquare,
  FileCheck,
  Upload,
  ShieldCheck,
  ShieldAlert,
  MessageCircle,
  MessageSquare,
  Wrench,
  Car,
  Sparkles,
  ListChecks,
  Moon,
  CloudMoon,
  Eye,
  UtensilsCrossed,
  Shield,
  PersonStanding,
  Stethoscope,
  Smile,
  Brain,
  Syringe,
  GraduationCap,
  CalendarDays,
  Heart,
  Scale,
  Users,
  ClipboardList,
  Milestone,
  ArrowRightLeft,
  Mic,
  Award,
  BookHeart,
  Gavel,
  FileText,
  ClipboardCheck,
  HeartPulse,
  UserCheck,
  Fingerprint,
  Target,
  TrendingUp,
  Settings,
  Flame,
  Building2,
  Home,
  Sprout,
  Package,
  Bell,
  Star,
  FileSearch,
  HeartHandshake,
};

// ── Domain button colors ────────────────────────────────────────────────────

const DOMAIN_BUTTON_STYLES: Record<FormDomain, { base: string; hover: string }> = {
  young_person: {
    base: "bg-rose-600 text-white",
    hover: "hover:bg-rose-700",
  },
  employee: {
    base: "bg-blue-600 text-white",
    hover: "hover:bg-blue-700",
  },
  home: {
    base: "bg-amber-600 text-white",
    hover: "hover:bg-amber-700",
  },
};

// ── Props ───────────────────────────────────────────────────────────────────

interface DomainCreateMenuProps {
  domain: FormDomain;
  contextChildId?: string;
  contextStaffId?: string;
  className?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Append context query params to a form href. */
function buildHref(
  base: string,
  contextChildId?: string,
  contextStaffId?: string,
): string {
  const params = new URLSearchParams();
  if (contextChildId) params.set("childId", contextChildId);
  if (contextStaffId) params.set("staffId", contextStaffId);
  const qs = params.toString();
  if (!qs) return base;

  // If the href already has query params, append with &
  return base.includes("?") ? `${base}&${qs}` : `${base}?${qs}`;
}

/** Check whether a form matches a search query (multi-term AND). */
function matchesSearch(form: FormDefinition, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;

  const haystack = [
    form.id,
    form.label,
    form.description,
    form.category,
    ...(form.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return q.split(/\s+/).every((term) => haystack.includes(term));
}

// ── Component ───────────────────────────────────────────────────────────────

export function DomainCreateMenu({
  domain,
  contextChildId,
  contextStaffId,
  className,
}: DomainCreateMenuProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focusIndex, setFocusIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const { canAccess } = usePermissions();
  const domainConfig = DOMAIN_CONFIG[domain];
  const buttonStyles = DOMAIN_BUTTON_STYLES[domain];

  // ── Build filtered + grouped data ───────────────────────────────────────

  const categories = useMemo(() => getFormCategories(domain), [domain]);

  const filteredCategories = useMemo(() => {
    return categories
      .map((cat) => ({
        ...cat,
        forms: cat.forms.filter((form) => {
          // Permission check
          if (form.module && !canAccess(form.module)) return false;
          // Search filter
          if (!matchesSearch(form, search)) return false;
          return true;
        }),
      }))
      .filter((cat) => cat.forms.length > 0);
  }, [categories, canAccess, search]);

  // Flat list for keyboard navigation
  const flatItems = useMemo(
    () => filteredCategories.flatMap((cat) => cat.forms),
    [filteredCategories],
  );

  // ── Event handlers ──────────────────────────────────────────────────────

  const openMenu = useCallback(() => {
    setOpen(true);
    setSearch("");
    setFocusIndex(-1);
  }, []);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setSearch("");
    setFocusIndex(-1);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, closeMenu]);

  // Focus search on open
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  // Reset focus index when search changes
  useEffect(() => {
    setFocusIndex(-1);
  }, [search]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusIndex >= 0 && itemRefs.current[focusIndex]) {
      itemRefs.current[focusIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [focusIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          closeMenu();
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusIndex((prev) =>
            prev < flatItems.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusIndex((prev) =>
            prev > 0 ? prev - 1 : flatItems.length - 1,
          );
          break;
        case "Enter":
          if (focusIndex >= 0 && focusIndex < flatItems.length) {
            e.preventDefault();
            itemRefs.current[focusIndex]?.click();
          }
          break;
        case "Home":
          e.preventDefault();
          setFocusIndex(0);
          break;
        case "End":
          e.preventDefault();
          setFocusIndex(flatItems.length - 1);
          break;
      }
    },
    [flatItems.length, focusIndex, closeMenu],
  );

  // ── Render ──────────────────────────────────────────────────────────────

  // Track flat index across categories for refs
  let flatIndex = 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger button */}
      <button
        onClick={() => (open ? closeMenu() : openMenu())}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Create new ${domainConfig.label} record`}
        className={cn(
          "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all",
          buttonStyles.base,
          !open && buttonStyles.hover,
        )}
      >
        {open ? (
          <X className="h-3.5 w-3.5" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">Create</span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-40 sm:hidden"
            onClick={closeMenu}
            aria-hidden
          />

          {/* Menu panel */}
          <div
            role="menu"
            aria-label={`Create ${domainConfig.label} record`}
            onKeyDown={handleKeyDown}
            className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] shadow-lg animate-fade-in flex flex-col"
            style={{ maxHeight: "400px" }}
          >
            {/* Sticky search header */}
            <div className="sticky top-0 z-10 bg-[var(--cs-surface-elevated)] rounded-t-xl border-b border-[var(--cs-border)] p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-gentle)]" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search forms..."
                  aria-label="Search forms"
                  className={cn(
                    "w-full rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] py-1.5 pl-8 pr-3 text-sm",
                    "text-[var(--cs-text)] placeholder:text-[var(--cs-text-gentle)]",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--cs-navy)]/20 focus:border-[var(--cs-navy)]/30",
                    "transition-colors",
                  )}
                />
              </div>
            </div>

            {/* Scrollable form list */}
            <div className="overflow-y-auto overscroll-contain py-1.5 flex-1">
              {filteredCategories.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <Search className="h-8 w-8 text-[var(--cs-text-gentle)] mb-2 opacity-40" />
                  <p className="text-sm font-medium text-[var(--cs-text-muted)]">
                    No matching forms
                  </p>
                  <p className="text-xs text-[var(--cs-text-gentle)] mt-1">
                    Try a different search term
                  </p>
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const CategoryIcon = ICON_MAP[cat.icon] ?? FileText;

                  return (
                    <div key={cat.category} className="mb-1">
                      {/* Category header */}
                      <div className="flex items-center gap-2 px-4 pt-2.5 pb-1">
                        <CategoryIcon className="h-3 w-3 text-[var(--cs-text-gentle)]" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-gentle)]">
                          {cat.label}
                        </span>
                      </div>

                      {/* Form items */}
                      {cat.forms.map((form) => {
                        const FormIcon = ICON_MAP[form.icon] ?? Plus;
                        const currentIndex = flatIndex++;
                        const isFocused = currentIndex === focusIndex;
                        const href = buildHref(
                          form.href,
                          contextChildId,
                          contextStaffId,
                        );

                        return (
                          <Link
                            key={form.id}
                            ref={(el) => {
                              itemRefs.current[currentIndex] = el;
                            }}
                            href={href}
                            role="menuitem"
                            tabIndex={isFocused ? 0 : -1}
                            title={form.description}
                            onClick={closeMenu}
                            onMouseEnter={() => setFocusIndex(currentIndex)}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                              "text-[var(--cs-text-secondary)]",
                              isFocused
                                ? "bg-[var(--cs-surface)]"
                                : "hover:bg-[var(--cs-surface)]",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-lg shrink-0",
                                isFocused
                                  ? "bg-[var(--cs-navy)]/10"
                                  : "bg-[var(--cs-surface)]",
                              )}
                            >
                              <FormIcon
                                className={cn(
                                  "h-3.5 w-3.5",
                                  isFocused
                                    ? "text-[var(--cs-navy)]"
                                    : "text-[var(--cs-text-muted)]",
                                )}
                              />
                            </span>
                            <span className="truncate">{form.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
