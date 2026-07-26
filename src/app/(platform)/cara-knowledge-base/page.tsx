"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — KNOWLEDGE BASE
// Foundational practice knowledge that powers Cara's intelligence layer.
// Models, concepts, skills frameworks, regulation and authoritative sources
// — curated from practice literature and expert practitioners.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "@/hooks/use-api";
import type { KBEntry, KBEntryType, KBHeart } from "@/lib/cara/knowledge-base";
import {
  Brain,
  Lightbulb,
  BookOpen,
  Scale,
  Link,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  Heart,
  Sparkles,
  Search,
  GraduationCap,
  ClipboardCheck,
  ExternalLink,
} from "lucide-react";

// ─── Inlined from the former use-cara-knowledge-base hook ────────────────────

interface KBMeta {
  total: number;
  totalApproved: number;
  totalPendingReview: number;
  typeCounts: Record<KBEntryType, number>;
  tags: string[];
  schemaVersion: string;
}

interface KBResponse {
  heart: KBHeart;
  entries: KBEntry[];
  meta: KBMeta;
}

function useCaraKnowledgeBase(params?: {
  type?: KBEntryType;
  status?: "approved" | "pending_review" | "all";
  tag?: string;
}) {
  const query = new URLSearchParams();
  if (params?.type) query.set("type", params.type);
  if (params?.status) query.set("status", params.status);
  if (params?.tag) query.set("tag", params.tag);

  const qs = query.toString();

  return useQuery({
    queryKey: ["cara-knowledge-base", params],
    queryFn: () =>
      api.get<{ data: KBResponse }>(`/cara-knowledge-base${qs ? `?${qs}` : ""}`),
    staleTime: 300_000,
  });
}

// ── Type configuration ────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  KBEntryType,
  { label: string; plural: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  model: {
    label: "Model",
    plural: "Models",
    icon: Brain,
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
  concept: {
    label: "Concept",
    plural: "Concepts",
    icon: Lightbulb,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  skills_framework: {
    label: "Skills framework",
    plural: "Skills frameworks",
    icon: GraduationCap,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  regulation: {
    label: "Regulation",
    plural: "Regulation",
    icon: Scale,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  source: {
    label: "Source",
    plural: "Sources",
    icon: BookOpen,
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
  },
};

const ALL_TYPES = Object.keys(TYPE_CONFIG) as KBEntryType[];

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return null;
  return (
    <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
      Pending review
    </Badge>
  );
}

// ── Knowledge entry card ──────────────────────────────────────────────────────

function EntryCard({ entry }: { entry: KBEntry }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[entry.type];
  const Icon = cfg.icon;

  return (
    <div className={cn("rounded-xl border bg-white shadow-sm overflow-hidden", entry.status !== "approved" && "opacity-80")}>
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className={cn("rounded-lg p-2 shrink-0", cfg.bg)}>
            <Icon className={cn("h-4 w-4", cfg.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-slate-900 text-sm leading-snug">{entry.title}</h3>
              <div className="flex items-center gap-1.5 shrink-0">
                <StatusBadge status={entry.status} />
                <Badge variant="outline" className={cn("text-xs border", cfg.border, cfg.color, cfg.bg)}>
                  {cfg.label}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-2">{entry.origin}</p>
            <p className="text-sm text-slate-700 leading-relaxed">{entry.summary}</p>
          </div>
        </div>

        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 ml-11">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {(entry.principles.length > 0 || entry.why_for_cara || entry.links.length > 0) && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mt-3 ml-11 transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Hide detail" : "Show detail"}
          </button>
        )}
      </div>

      {expanded && (
        <div className={cn("border-t px-5 pb-5 pt-4 space-y-4", cfg.bg)}>
          {entry.principles.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <ClipboardCheck className="h-3.5 w-3.5" />
                {entry.type === "skills_framework" ? "Skills" : "Principles"}
              </p>
              <ul className="space-y-1">
                {entry.principles.map((p, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-700">
                    <span className={cn("shrink-0 font-mono text-xs", cfg.color)}>{i + 1}.</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {entry.why_for_cara && (
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Why for Cara
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">{entry.why_for_cara}</p>
            </div>
          )}

          {entry.links.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Link className="h-3.5 w-3.5" />
                Links
              </p>
              <ul className="space-y-1">
                {entry.links.map((l, i) => (
                  <li key={i}>
                    <a
                      href={l}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("text-xs underline underline-offset-2 flex items-center gap-1", cfg.color)}
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      {l.length > 60 ? `${l.slice(0, 60)}…` : l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CaraKnowledgeBasePage() {
  const [activeType, setActiveType] = useState<KBEntryType | "all">("all");
  const [search, setSearch] = useState("");
  const [showPendingReview, setShowPendingReview] = useState(false);

  const { data, isLoading, isError } = useCaraKnowledgeBase({ status: "all" });
  const result = data?.data;

  const filtered = useMemo(() => {
    if (!result) return [];
    let entries = result.entries.filter(
      (e) => showPendingReview || e.status === "approved",
    );
    if (activeType !== "all") {
      entries = entries.filter((e) => e.type === activeType);
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      entries = entries.filter(
        (e) =>
          e.title.toLowerCase().includes(s) ||
          e.summary.toLowerCase().includes(s) ||
          e.tags.some((t) => t.toLowerCase().includes(s)) ||
          e.origin.toLowerCase().includes(s),
      );
    }
    return entries;
  }, [result, activeType, search, showPendingReview]);

  return (
    <PageShell
      title="Cara Knowledge Base"
      subtitle="Foundational practice knowledge — models, concepts, frameworks and authoritative sources"
    >
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400 mr-3" />
          <span className="text-sm text-slate-500">Loading knowledge base…</span>
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-700 font-medium">Could not load knowledge base</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">

          {/* ── Heart / identity strip ──────────────────────────────────── */}
          <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-slate-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4 text-violet-600" />
              <h2 className="text-sm font-semibold text-violet-900">Cara's heart</h2>
            </div>
            <p className="text-sm text-slate-700 italic mb-4">{result.heart.identity}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {result.heart.values.map((v) => (
                <div key={v.id} className="rounded-lg bg-white border border-violet-100 px-3 py-2">
                  <p className="text-xs font-semibold text-violet-800 mb-0.5">{v.name}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{v.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Filters ─────────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search entries…"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>

              {/* Pending review toggle */}
              {(result.meta.totalPendingReview > 0) && (
                <button
                  type="button"
                  onClick={() => setShowPendingReview((v) => !v)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    showPendingReview
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                  )}
                >
                  {showPendingReview ? "Hide" : "Show"} {result.meta.totalPendingReview} pending
                </button>
              )}
            </div>

            {/* Type filter chips */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveType("all")}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  activeType === "all"
                    ? "border-slate-800 bg-slate-800 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                )}
              >
                All ({result.meta.totalApproved})
              </button>
              {ALL_TYPES.map((type) => {
                const cfg = TYPE_CONFIG[type];
                const count = result.meta.typeCounts[type] ?? 0;
                if (count === 0) return null;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActiveType(type)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
                      activeType === type
                        ? cn(cfg.bg, cfg.border, cfg.color)
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                    )}
                  >
                    <cfg.icon className="h-3 w-3" />
                    {cfg.plural} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Entry grid ──────────────────────────────────────────────── */}
          {filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
              <BookOpen className="h-7 w-7 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">No entries match your filter</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting the type filter or search term.</p>
            </div>
          )}

          {/* ── Schema note ─────────────────────────────────────────────── */}
          <p className="text-xs text-slate-400 text-center">
            Knowledge Base v{result.meta.schemaVersion} · {result.meta.totalApproved} approved entries · {result.meta.totalPendingReview} pending review
          </p>
        </div>
      )}
    </PageShell>
  );
}
