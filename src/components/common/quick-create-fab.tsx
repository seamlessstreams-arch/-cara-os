"use client";

// ==============================================================================
// CORNERSTONE -- QUICK CREATE FAB
// Floating action button providing universal access to create any form from
// any page. Opens a command-palette style modal with search, domain tabs,
// keyboard navigation, and smart context detection from the current URL.
// ==============================================================================

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import {
  type FormDomain,
  type FormDefinition,
  DOMAIN_CONFIG,
  CATEGORY_LABELS,
  FORM_REGISTRY,
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
  Clock,
  Command,
} from "lucide-react";

// -- Icon lookup ---------------------------------------------------------------

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

// -- Domain tab styling --------------------------------------------------------

const DOMAIN_TABS: {
  domain: FormDomain;
  label: string;
  color: string;
  activeBg: string;
  activeText: string;
  indicator: string;
}[] = [
  {
    domain: "young_person",
    label: "Young Person",
    color: "text-rose-600",
    activeBg: "bg-rose-50",
    activeText: "text-rose-700",
    indicator: "bg-rose-500",
  },
  {
    domain: "employee",
    label: "Employee",
    color: "text-blue-600",
    activeBg: "bg-blue-50",
    activeText: "text-blue-700",
    indicator: "bg-blue-500",
  },
  {
    domain: "home",
    label: "Home",
    color: "text-amber-600",
    activeBg: "bg-amber-50",
    activeText: "text-amber-700",
    indicator: "bg-amber-500",
  },
];

// -- Domain badge for form items -----------------------------------------------

const DOMAIN_BADGE_STYLES: Record<FormDomain, string> = {
  young_person: "bg-rose-100 text-rose-700",
  employee: "bg-blue-100 text-blue-700",
  home: "bg-amber-100 text-amber-700",
};

// -- localStorage key for recent forms -----------------------------------------

const RECENT_FORMS_KEY = "cornerstone:quick-create:recent";
const MAX_RECENT = 5;

function getRecentFormIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_FORMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function addRecentFormId(formId: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentFormIds().filter((id) => id !== formId);
    const updated = [formId, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_FORMS_KEY, JSON.stringify(updated));
  } catch {
    // Silently ignore storage errors
  }
}

// -- Context detection ---------------------------------------------------------

interface DetectedContext {
  contextChildId?: string;
  contextStaffId?: string;
  contextLabel?: string;
}

function detectContext(pathname: string): DetectedContext {
  // /young-people/[id]/...  ->  contextChildId
  const childMatch = pathname.match(/\/young-people\/([a-zA-Z0-9_-]+)/);
  if (childMatch && childMatch[1] !== "new") {
    return {
      contextChildId: childMatch[1],
      contextLabel: "Young Person",
    };
  }

  // /staff/[id]/... or /dashboard/staff/[id]/...  ->  contextStaffId
  const staffMatch = pathname.match(
    /(?:\/staff|\/dashboard\/staff)\/([a-zA-Z0-9_-]+)/,
  );
  if (staffMatch && staffMatch[1] !== "new") {
    return {
      contextStaffId: staffMatch[1],
      contextLabel: "Staff Member",
    };
  }

  // /buildings or /dashboard  ->  home context (no ID to attach)
  if (pathname.startsWith("/buildings") || pathname === "/dashboard") {
    return { contextLabel: "Home" };
  }

  return {};
}

// -- Build href with context ---------------------------------------------------

function buildHref(
  base: string,
  ctx: DetectedContext,
): string {
  const params = new URLSearchParams();
  if (ctx.contextChildId) params.set("childId", ctx.contextChildId);
  if (ctx.contextStaffId) params.set("staffId", ctx.contextStaffId);
  const qs = params.toString();
  if (!qs) return base;
  return base.includes("?") ? `${base}&${qs}` : `${base}?${qs}`;
}

// -- Fuzzy search --------------------------------------------------------------

function fuzzyMatch(form: FormDefinition, query: string): boolean {
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

// -- Highlight matching text ---------------------------------------------------

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const terms = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) return text;

  // Build a regex that matches any of the search terms
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = terms.some(
          (t) => part.toLowerCase() === t.toLowerCase(),
        );
        return isMatch ? (
          <mark
            key={i}
            className="bg-amber-200/60 text-inherit rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}

// ==============================================================================
// COMPONENT
// ==============================================================================

export function QuickCreateFab() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeDomain, setActiveDomain] = useState<FormDomain | null>(null);
  const [focusIndex, setFocusIndex] = useState(-1);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const searchRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();
  const { canAccess } = usePermissions();

  // -- Context from URL -------------------------------------------------------

  const context = useMemo(() => detectContext(pathname), [pathname]);

  // -- Load recent forms on mount ---------------------------------------------

  useEffect(() => {
    setRecentIds(getRecentFormIds());
  }, [open]);

  // -- Filtered forms ---------------------------------------------------------

  const allCategories = useMemo(() => {
    const domains: FormDomain[] = activeDomain
      ? [activeDomain]
      : ["young_person", "employee", "home"];

    return domains.flatMap((domain) =>
      getFormCategories(domain).map((cat) => ({
        ...cat,
        domain,
        forms: cat.forms.filter((form) => {
          if (form.module && !canAccess(form.module)) return false;
          if (!fuzzyMatch(form, search)) return false;
          return true;
        }),
      })),
    ).filter((cat) => cat.forms.length > 0);
  }, [activeDomain, canAccess, search]);

  // -- Recent forms (resolved) ------------------------------------------------

  const recentForms = useMemo(() => {
    if (search.trim()) return []; // Hide recents when searching
    return recentIds
      .map((id) => FORM_REGISTRY.find((f) => f.id === id))
      .filter((f): f is FormDefinition => {
        if (!f) return false;
        if (f.module && !canAccess(f.module)) return false;
        if (activeDomain && f.domain !== activeDomain) return false;
        return true;
      })
      .slice(0, MAX_RECENT);
  }, [recentIds, canAccess, activeDomain, search]);

  // -- Flat list for keyboard navigation --------------------------------------

  const flatItems = useMemo(() => {
    const items: FormDefinition[] = [];
    // Recent forms first
    for (const form of recentForms) {
      items.push(form);
    }
    // Then all category forms
    for (const cat of allCategories) {
      for (const form of cat.forms) {
        // Avoid duplicating recent items
        if (!recentForms.some((r) => r.id === form.id)) {
          items.push(form);
        }
      }
    }
    return items;
  }, [recentForms, allCategories]);

  // -- Open / Close -----------------------------------------------------------

  const openModal = useCallback(() => {
    setOpen(true);
    setSearch("");
    setActiveDomain(null);
    setFocusIndex(-1);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setSearch("");
    setActiveDomain(null);
    setFocusIndex(-1);
  }, []);

  const selectForm = useCallback(
    (form: FormDefinition) => {
      addRecentFormId(form.id);
      closeModal();
    },
    [closeModal],
  );

  // -- Keyboard shortcut: Cmd+K / Ctrl+K -------------------------------------

  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        e.stopPropagation();
        if (open) {
          closeModal();
        } else {
          openModal();
        }
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [open, openModal, closeModal]);

  // -- Autofocus search on open -----------------------------------------------

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          searchRef.current?.focus();
        });
      });
    }
  }, [open]);

  // -- Reset focus index when search/domain changes ---------------------------

  useEffect(() => {
    setFocusIndex(-1);
  }, [search, activeDomain]);

  // -- Scroll focused item into view ------------------------------------------

  useEffect(() => {
    if (focusIndex >= 0 && itemRefs.current[focusIndex]) {
      itemRefs.current[focusIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [focusIndex]);

  // -- Keyboard navigation inside modal ---------------------------------------

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          closeModal();
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
    [flatItems.length, focusIndex, closeModal],
  );

  // -- Track flat index for refs in render ------------------------------------

  let flatIdx = 0;

  // -- Render helper: single form item ----------------------------------------

  function renderFormItem(
    form: FormDefinition,
    opts: { isRecent?: boolean; showDomainBadge?: boolean },
  ) {
    const FormIcon = ICON_MAP[form.icon] ?? Plus;
    const currentIndex = flatIdx++;
    const isFocused = currentIndex === focusIndex;
    const href = buildHref(form.href, context);
    const domainLabel = DOMAIN_CONFIG[form.domain].label;

    return (
      <Link
        key={`${opts.isRecent ? "recent-" : ""}${form.id}`}
        ref={(el) => {
          itemRefs.current[currentIndex] = el;
        }}
        href={href}
        role="menuitem"
        tabIndex={isFocused ? 0 : -1}
        title={form.description}
        onClick={() => selectForm(form)}
        onMouseEnter={() => setFocusIndex(currentIndex)}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150",
          "text-gray-700",
          isFocused
            ? "bg-[var(--cs-navy,#1e293b)]/5"
            : "hover:bg-gray-50",
        )}
      >
        {/* Icon */}
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors",
            isFocused
              ? "bg-[var(--cs-navy,#1e293b)]/10"
              : "bg-gray-100",
          )}
        >
          <FormIcon
            className={cn(
              "h-4 w-4",
              isFocused
                ? "text-[var(--cs-navy,#1e293b)]"
                : "text-gray-500",
            )}
          />
        </span>

        {/* Label + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate text-sm">
              {highlightText(form.label, search)}
            </span>
            {opts.isRecent && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                <Clock className="h-2.5 w-2.5" />
                Recent
              </span>
            )}
            {opts.showDomainBadge && (
              <span
                className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0",
                  DOMAIN_BADGE_STYLES[form.domain],
                )}
              >
                {domainLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate mt-0.5 leading-tight">
            {highlightText(form.description, search)}
          </p>
        </div>
      </Link>
    );
  }

  // -- Build the set of category forms excluding recent duplicates ------------

  const dedupedCategories = useMemo(() => {
    const recentIdSet = new Set(recentForms.map((f) => f.id));
    return allCategories
      .map((cat) => ({
        ...cat,
        forms: cat.forms.filter((f) => !recentIdSet.has(f.id)),
      }))
      .filter((cat) => cat.forms.length > 0);
  }, [allCategories, recentForms]);

  // -- Render -----------------------------------------------------------------

  return (
    <>
      {/* FAB button */}
      <button
        onClick={openModal}
        aria-label="Quick create -- open form selector"
        className={cn(
          "fixed z-50 flex items-center justify-center rounded-full",
          "bg-[var(--cs-navy,#1e293b)] text-white shadow-lg",
          "transition-all duration-200 ease-out",
          "hover:scale-110 hover:shadow-xl",
          "active:scale-95",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cs-navy,#1e293b)]/50 focus-visible:ring-offset-2",
          // Desktop: 56px, bottom-right
          "bottom-6 right-6 h-14 w-14",
          // Mobile: 48px, raised above bottom nav
          "max-sm:bottom-20 max-sm:right-4 max-sm:h-12 max-sm:w-12",
        )}
      >
        <Plus className="h-6 w-6 max-sm:h-5 max-sm:w-5" />
      </button>

      {/* Modal overlay + panel */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] sm:pt-[15vh]"
          onKeyDown={handleKeyDown}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={closeModal}
            aria-hidden
          />

          {/* Panel */}
          <div
            role="dialog"
            aria-label="Quick create -- select a form"
            aria-modal="true"
            className={cn(
              "relative z-10 w-full max-w-lg mx-4",
              "bg-white rounded-2xl shadow-2xl",
              "flex flex-col overflow-hidden",
              "animate-in fade-in slide-in-from-bottom-4 duration-200",
            )}
            style={{ maxHeight: "min(70vh, 600px)" }}
          >
            {/* Search header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search forms..."
                  aria-label="Search forms"
                  className={cn(
                    "w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm",
                    "text-gray-900 placeholder:text-gray-400",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--cs-navy,#1e293b)]/20 focus:border-[var(--cs-navy,#1e293b)]/30",
                    "focus:bg-white",
                    "transition-all duration-150",
                  )}
                />
              </div>

              {/* Close button */}
              <button
                onClick={closeModal}
                aria-label="Close"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                  "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                  "transition-colors",
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Context indicator */}
            {context.contextLabel && (
              <div className="px-5 pb-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>
                    Creating for{" "}
                    <span className="font-medium text-gray-700">
                      {context.contextLabel}
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* Universal "Record anything" shortcut — when a child is in context */}
            {context.contextChildId && (
              <div className="px-5 pb-3">
                <Link
                  href={`/record/${context.contextChildId}`}
                  onClick={closeModal}
                  className="flex items-center gap-2.5 rounded-xl px-4 py-3 bg-[var(--cs-navy,#0f1e36)] text-white hover:opacity-95 transition-opacity"
                >
                  <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold,#c89b3c)] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">Record anything</p>
                    <p className="text-[11px] text-white/60 leading-tight">
                      Just write what happened — we&apos;ll route it everywhere
                    </p>
                  </div>
                </Link>
              </div>
            )}

            {/* Universal staff entry — when a staff member is in context */}
            {context.contextStaffId && (
              <div className="px-5 pb-3">
                <Link
                  href={`/record-staff/${context.contextStaffId}`}
                  onClick={closeModal}
                  className="flex items-center gap-2.5 rounded-xl px-4 py-3 bg-[var(--cs-navy,#0f1e36)] text-white hover:opacity-95 transition-opacity"
                >
                  <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold,#c89b3c)] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">Record anything</p>
                    <p className="text-[11px] text-white/60 leading-tight">
                      Supervision, training, observation or wellbeing — we&apos;ll route it
                    </p>
                  </div>
                </Link>
              </div>
            )}

            {/* Universal home entry — when the home is in context (no person) */}
            {!context.contextChildId && !context.contextStaffId && context.contextLabel === "Home" && (
              <div className="px-5 pb-3">
                <Link
                  href="/record-home"
                  onClick={closeModal}
                  className="flex items-center gap-2.5 rounded-xl px-4 py-3 bg-[var(--cs-navy,#0f1e36)] text-white hover:opacity-95 transition-opacity"
                >
                  <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold,#c89b3c)] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">Record anything</p>
                    <p className="text-[11px] text-white/60 leading-tight">
                      Fire drill, H&amp;S check, repair or audit — we&apos;ll route it
                    </p>
                  </div>
                </Link>
              </div>
            )}

            {/* Domain tabs */}
            <div className="flex items-center gap-1 px-5 pb-3">
              {/* "All" tab */}
              <button
                onClick={() => setActiveDomain(null)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                  !activeDomain
                    ? "bg-[var(--cs-navy,#1e293b)] text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                )}
              >
                All
              </button>

              {DOMAIN_TABS.map((tab) => (
                <button
                  key={tab.domain}
                  onClick={() =>
                    setActiveDomain(
                      activeDomain === tab.domain ? null : tab.domain,
                    )
                  }
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                    activeDomain === tab.domain
                      ? cn(tab.activeBg, tab.activeText, "shadow-sm")
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                  )}
                >
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      tab.indicator,
                    )}
                  />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Scrollable form list */}
            <div
              ref={scrollRef}
              className="overflow-y-auto overscroll-contain flex-1 py-2"
            >
              {/* No results */}
              {flatItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <Search className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-500">
                    No matching forms
                  </p>
                  <p className="text-xs text-gray-400 mt-1 max-w-[250px]">
                    Try different search terms or select a different domain tab
                  </p>
                </div>
              ) : (
                <>
                  {/* Recent forms */}
                  {recentForms.length > 0 && (
                    <div className="mb-1">
                      <div className="flex items-center gap-2 px-5 pt-2 pb-1.5">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Recent
                        </span>
                      </div>
                      {recentForms.map((form) =>
                        renderFormItem(form, {
                          isRecent: true,
                          showDomainBadge: !activeDomain,
                        }),
                      )}
                    </div>
                  )}

                  {/* Grouped forms by domain then category */}
                  {dedupedCategories.map((cat) => {
                    const CatIcon = ICON_MAP[cat.icon] ?? FileText;
                    const domainLabel = DOMAIN_CONFIG[cat.domain].label;

                    return (
                      <div key={`${cat.domain}-${cat.category}`} className="mb-1">
                        {/* Category header */}
                        <div className="flex items-center gap-2 px-5 pt-3 pb-1.5">
                          <CatIcon className="h-3 w-3 text-gray-400" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            {!activeDomain
                              ? `${domainLabel} -- ${cat.label}`
                              : cat.label}
                          </span>
                        </div>

                        {/* Form items */}
                        {cat.forms.map((form) =>
                          renderFormItem(form, {
                            showDomainBadge: !activeDomain,
                          }),
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer with keyboard hint */}
            <div className="border-t border-gray-100 px-5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono">
                    <ArrowRightLeft className="h-2.5 w-2.5 rotate-90 inline" />
                  </kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono">
                    Enter
                  </kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono">
                    Esc
                  </kbd>
                  Close
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono">
                  <Command className="h-2.5 w-2.5 inline" />
                </kbd>
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono">
                  K
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
