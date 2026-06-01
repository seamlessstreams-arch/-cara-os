"use client";

// ==============================================================================
// CORNERSTONE — SEARCH COMMAND PALETTE
//
// Full-screen search overlay opened with Cmd+K or from the TopBar.
// Real-time results grouped by type with keyboard navigation,
// recent searches, and type filter chips.
// ==============================================================================

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSearch } from "@/hooks/use-search";
import type { SearchResult, SearchResultType } from "@/lib/search/search-engine";
import {
  Search,
  X,
  User,
  Users,
  AlertTriangle,
  CheckSquare,
  BookOpen,
  HeartPulse,
  FileText,
  ShieldAlert,
  ClipboardList,
  Star,
  Clock,
  ArrowRightLeft,
  Command,
  Loader2,
} from "lucide-react";

// ── Icon map for result types ────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ElementType> = {
  User,
  Users,
  AlertTriangle,
  CheckSquare,
  BookOpen,
  HeartPulse,
  FileText,
  ShieldAlert,
  ClipboardList,
  Star,
};

function getTypeIcon(iconName: string): React.ElementType {
  return TYPE_ICONS[iconName] ?? FileText;
}

// ── Type labels and colors ───────────────────────────────────────────────────

const TYPE_CONFIG: Record<SearchResultType, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  child: { label: "Children", color: "text-rose-600", bg: "bg-rose-50", icon: User },
  staff: { label: "Staff", color: "text-blue-600", bg: "bg-blue-50", icon: Users },
  incident: { label: "Incidents", color: "text-amber-600", bg: "bg-amber-50", icon: AlertTriangle },
  task: { label: "Tasks", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckSquare },
  daily_log: { label: "Daily Log", color: "text-purple-600", bg: "bg-purple-50", icon: BookOpen },
  care_event: { label: "Care Events", color: "text-pink-600", bg: "bg-pink-50", icon: HeartPulse },
  document: { label: "Documents", color: "text-gray-600", bg: "bg-gray-50", icon: FileText },
  risk_assessment: { label: "Risk", color: "text-red-600", bg: "bg-red-50", icon: ShieldAlert },
  care_plan: { label: "Care Plans", color: "text-teal-600", bg: "bg-teal-50", icon: ClipboardList },
  review: { label: "Reviews", color: "text-indigo-600", bg: "bg-indigo-50", icon: Star },
};

// ── Filterable types (only those the engine currently indexes) ────────────────

const FILTER_TYPES: SearchResultType[] = [
  "child", "staff", "incident", "task", "daily_log", "care_event",
];

// ── Recent searches ──────────────────────────────────────────────────────────

const RECENT_KEY = "cornerstone:search:recent";
const MAX_RECENT = 10;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(query: string): void {
  if (typeof window === "undefined") return;
  const q = query.trim();
  if (q.length < 2) return;
  try {
    const existing = getRecentSearches().filter((s) => s !== q);
    const updated = [q, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {
    // Silently ignore storage errors
  }
}

function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // Silently ignore
  }
}

// ── Snippet rendering ────────────────────────────────────────────────────────

function renderSnippet(snippet: string): React.ReactNode {
  // Split on **bold** markers
  const parts = snippet.split(/\*\*([^*]+)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-amber-200/60 text-inherit rounded-sm px-0.5 font-medium">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

// ── Format relative date ─────────────────────────────────────────────────────

function relativeDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

// ── Group results by type ────────────────────────────────────────────────────

function groupByType(results: SearchResult[]): Map<SearchResultType, SearchResult[]> {
  const groups = new Map<SearchResultType, SearchResult[]>();
  for (const r of results) {
    if (!groups.has(r.type)) groups.set(r.type, []);
    groups.get(r.type)!.push(r);
  }
  return groups;
}

// ==============================================================================
// COMPONENT
// ==============================================================================

interface SearchCommandPaletteProps {
  /** External control: set to true to open the palette. */
  externalOpen?: boolean;
  /** Callback when the palette closes. */
  onClose?: () => void;
}

export function SearchCommandPalette({ externalOpen, onClose }: SearchCommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTypes, setActiveTypes] = useState<SearchResultType[]>([]);
  const [focusIndex, setFocusIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const searchRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { results, total, facets, isLoading } = useSearch(query, {
    types: activeTypes.length > 0 ? activeTypes : undefined,
    limit: 30,
  });

  // ── External open control ──────────────────────────────────────────────────

  useEffect(() => {
    if (externalOpen) {
      openPalette();
    }
  }, [externalOpen]);

  // ── Grouped results ────────────────────────────────────────────────────────

  const grouped = useMemo(() => groupByType(results), [results]);

  // Flat list for keyboard navigation
  const flatResults = useMemo(() => {
    const flat: SearchResult[] = [];
    for (const type of FILTER_TYPES) {
      const group = grouped.get(type);
      if (group) flat.push(...group);
    }
    // Add any remaining types not in FILTER_TYPES
    for (const [type, group] of grouped) {
      if (!FILTER_TYPES.includes(type)) flat.push(...group);
    }
    return flat;
  }, [grouped]);

  // ── Open / Close ───────────────────────────────────────────────────────────

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setActiveTypes([]);
    setFocusIndex(-1);
    setRecentSearches(getRecentSearches());
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveTypes([]);
    setFocusIndex(-1);
    onClose?.();
  }, [onClose]);

  const navigateToResult = useCallback(
    (result: SearchResult) => {
      if (query.trim().length >= 2) {
        addRecentSearch(query.trim());
      }
      closePalette();
      router.push(result.url);
    },
    [query, closePalette, router],
  );

  const useRecentSearch = useCallback((q: string) => {
    setQuery(q);
    searchRef.current?.focus();
  }, []);

  // ── Cmd+K global shortcut ─────────────────────────────────────────────────

  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        e.stopPropagation();
        if (open) {
          closePalette();
        } else {
          openPalette();
        }
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [open, openPalette, closePalette]);

  // ── Autofocus ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          searchRef.current?.focus();
        });
      });
    }
  }, [open]);

  // ── Reset focus on query/filter change ─────────────────────────────────────

  useEffect(() => {
    setFocusIndex(-1);
  }, [query, activeTypes]);

  // ── Scroll focused item into view ──────────────────────────────────────────

  useEffect(() => {
    if (focusIndex >= 0 && itemRefs.current[focusIndex]) {
      itemRefs.current[focusIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [focusIndex]);

  // ── Keyboard navigation ────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          closePalette();
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusIndex((prev) =>
            prev < flatResults.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusIndex((prev) =>
            prev > 0 ? prev - 1 : flatResults.length - 1,
          );
          break;
        case "Enter":
          if (focusIndex >= 0 && focusIndex < flatResults.length) {
            e.preventDefault();
            navigateToResult(flatResults[focusIndex]);
          }
          break;
        case "Home":
          e.preventDefault();
          setFocusIndex(0);
          break;
        case "End":
          e.preventDefault();
          setFocusIndex(flatResults.length - 1);
          break;
      }
    },
    [flatResults, focusIndex, closePalette, navigateToResult],
  );

  // ── Toggle type filter ─────────────────────────────────────────────────────

  const toggleType = useCallback((type: SearchResultType) => {
    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!open) return null;

  let flatIdx = 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center pt-[10vh] sm:pt-[12vh]"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={closePalette}
        aria-hidden
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-label="Search Cornerstone"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full max-w-2xl mx-4",
          "bg-white rounded-2xl shadow-2xl",
          "flex flex-col overflow-hidden",
          "animate-in fade-in slide-in-from-bottom-4 duration-200",
        )}
        style={{ maxHeight: "min(75vh, 680px)" }}
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across children, incidents, tasks, staff, and more..."
              aria-label="Search Cornerstone"
              className={cn(
                "w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm",
                "text-gray-900 placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-[var(--cs-navy,#1e293b)]/20 focus:border-[var(--cs-navy,#1e293b)]/30",
                "focus:bg-white",
                "transition-all duration-150",
              )}
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>

          <button
            onClick={closePalette}
            aria-label="Close search"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
              "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
              "transition-colors",
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Type filter chips */}
        {query.trim().length >= 2 && (
          <div className="flex items-center gap-1.5 px-5 pb-3 flex-wrap">
            {FILTER_TYPES.map((type) => {
              const config = TYPE_CONFIG[type];
              const facet = facets.find((f) => f.type === type);
              const isActive = activeTypes.includes(type);
              const TypeIcon = config.icon;

              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150",
                    isActive
                      ? cn(config.bg, config.color, "shadow-sm ring-1 ring-current/20")
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                  )}
                >
                  <TypeIcon className="h-3 w-3" />
                  {config.label}
                  {facet && facet.count > 0 && (
                    <span className={cn(
                      "text-[10px] px-1 py-0 rounded-full",
                      isActive ? "bg-white/60" : "bg-gray-200/60",
                    )}>
                      {facet.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Scrollable results */}
        <div
          ref={scrollRef}
          className="overflow-y-auto overscroll-contain flex-1 py-2"
        >
          {/* Empty state: no query yet */}
          {query.trim().length < 2 && recentSearches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Search className="h-12 w-12 text-gray-200 mb-4" />
              <p className="text-sm font-medium text-gray-500">
                Search across children, incidents, tasks, staff, and more...
              </p>
              <p className="text-xs text-gray-400 mt-2 max-w-xs">
                Type at least 2 characters to start searching. Use the filter chips to narrow results by type.
              </p>
            </div>
          )}

          {/* Recent searches */}
          {query.trim().length < 2 && recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-5 pt-2 pb-1.5">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Recent Searches
                  </span>
                </div>
                <button
                  onClick={() => {
                    clearRecentSearches();
                    setRecentSearches([]);
                  }}
                  className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((q) => (
                <button
                  key={q}
                  onClick={() => useRecentSearch(q)}
                  className={cn(
                    "flex items-center gap-3 w-full px-5 py-2 text-sm text-left",
                    "text-gray-600 hover:bg-gray-50 transition-colors",
                  )}
                >
                  <Clock className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          )}

          {/* Loading state */}
          {query.trim().length >= 2 && isLoading && flatResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Loader2 className="h-8 w-8 text-gray-300 animate-spin mb-4" />
              <p className="text-sm text-gray-400">Searching...</p>
            </div>
          )}

          {/* No results */}
          {query.trim().length >= 2 && !isLoading && flatResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Search className="h-10 w-10 text-gray-200 mb-4" />
              <p className="text-sm font-medium text-gray-500">
                No results for &ldquo;{query.trim()}&rdquo;
              </p>
              <p className="text-xs text-gray-400 mt-2 max-w-xs">
                Try different search terms, check for typos, or remove type filters to broaden your search.
              </p>
            </div>
          )}

          {/* Grouped results */}
          {flatResults.length > 0 && (
            <>
              {Array.from(grouped.entries()).map(([type, group]) => {
                const config = TYPE_CONFIG[type];
                if (!config) return null;
                const TypeIcon = config.icon;

                return (
                  <div key={type} className="mb-1">
                    {/* Group header */}
                    <div className="flex items-center gap-2 px-5 pt-3 pb-1.5">
                      <TypeIcon className={cn("h-3 w-3", config.color)} />
                      <span className={cn("text-[10px] font-semibold uppercase tracking-wider", config.color)}>
                        {config.label}
                      </span>
                      <span className="text-[10px] text-gray-300">
                        {group.length}
                      </span>
                    </div>

                    {/* Result items */}
                    {group.map((result) => {
                      const currentIndex = flatIdx++;
                      const isFocused = currentIndex === focusIndex;
                      const ResultIcon = getTypeIcon(result.icon);

                      return (
                        <button
                          key={result.id}
                          ref={(el) => {
                            itemRefs.current[currentIndex] = el;
                          }}
                          onClick={() => navigateToResult(result)}
                          onMouseEnter={() => setFocusIndex(currentIndex)}
                          className={cn(
                            "flex items-start gap-3 w-full px-5 py-2.5 text-sm text-left transition-all duration-150",
                            "text-gray-700",
                            isFocused
                              ? "bg-[var(--cs-navy,#1e293b)]/5"
                              : "hover:bg-gray-50",
                          )}
                        >
                          {/* Icon */}
                          <span
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5 transition-colors",
                              isFocused
                                ? cn(config.bg, config.color)
                                : "bg-gray-100",
                            )}
                          >
                            <ResultIcon
                              className={cn(
                                "h-4 w-4",
                                isFocused ? config.color : "text-gray-500",
                              )}
                            />
                          </span>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate text-sm">
                                {result.title}
                              </span>
                              {result.status && (
                                <span className={cn(
                                  "text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0",
                                  result.status === "open" || result.status === "active" || result.status === "current"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : result.status === "closed" || result.status === "ended" || result.status === "inactive"
                                      ? "bg-gray-100 text-gray-500"
                                      : "bg-amber-100 text-amber-700",
                                )}>
                                  {result.status.replace(/_/g, " ")}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {result.subtitle}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                              {renderSnippet(result.snippet)}
                            </p>
                          </div>

                          {/* Date */}
                          {result.date && (
                            <span className="text-[10px] text-gray-400 shrink-0 mt-1">
                              {relativeDate(result.date)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {/* Result count */}
              {total > flatResults.length && (
                <div className="px-5 py-3 text-center">
                  <p className="text-xs text-gray-400">
                    Showing {flatResults.length} of {total} results
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with keyboard hints */}
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
              Open
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
  );
}
