"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LEARNING STUDIO: RESOURCE LIBRARY
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  useResourceLibrary, useUpdateResourceLibraryEntry,
} from "@/hooks/use-ri-learning";
import { useAuthContext } from "@/contexts/auth-context";
import type { ResourceLibraryEntry, LearningPathway } from "@/types/extended";
import { cn, formatDate } from "@/lib/utils";
import {
  Search, Pin, PinOff, CheckCircle2, BookOpen, Library, Filter,
  ArrowUpDown, BarChart3, Users, Sparkles, Layers,
} from "lucide-react";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";


const PATHWAY_LABELS: Record<LearningPathway, string> = {
  child: "Children",
  staff: "Staff",
  mixed: "Mixed",
};

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  workshop: "Workshop",
  flashcard_set: "Flashcards",
  quiz: "Quiz",
  guidance_note: "Guidance Note",
  session_plan: "Session Plan",
  worksheet: "Worksheet",
  safety_plan: "Safety Plan",
  micro_learning: "Micro Learning",
  curriculum: "Curriculum",
  infographic: "Infographic",
};

// ── Library entry card ─────────────────────────────────────────────────────────
function LibraryEntryCard({ entry }: { entry: ResourceLibraryEntry }) {
  const updateMutation = useUpdateResourceLibraryEntry();

  const togglePin = () => {
    updateMutation.mutate({ id: entry.id, is_pinned: !entry.is_pinned });
  };

  return (
    <Card className={cn("border transition-all hover:shadow-sm", entry.is_pinned ? "border-[var(--cs-aria-gold-soft)]" : "border-[var(--cs-border-subtle)]")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            entry.is_approved ? "bg-emerald-50" : "bg-slate-50"
          )}>
            <BookOpen className={cn("h-4.5 w-4.5", entry.is_approved ? "text-emerald-600" : "text-[var(--cs-text-muted)]")}
              style={{ width: "1.125rem", height: "1.125rem" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--cs-navy)] leading-snug">{entry.title}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                {entry.is_approved && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" aria-label="Approved" />
                )}
                <button
                  onClick={togglePin}
                  disabled={updateMutation.isPending}
                  className={cn(
                    "rounded p-0.5 transition-colors",
                    entry.is_pinned
                      ? "text-[var(--cs-aria-gold)] hover:text-[var(--cs-aria-gold)]"
                      : "text-[var(--cs-text-gentle)] hover:text-[var(--cs-text-muted)]"
                  )}
                  title={entry.is_pinned ? "Unpin" : "Pin to top"}
                >
                  {entry.is_pinned ? (
                    <Pin className="h-3.5 w-3.5" />
                  ) : (
                    <PinOff className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Type / pathway row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                {RESOURCE_TYPE_LABELS[entry.resource_type] ?? entry.resource_type}
              </Badge>
              {entry.pathway && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {PATHWAY_LABELS[entry.pathway]}
                </Badge>
              )}
              {entry.is_approved && (
                <Badge className="text-[10px] h-4 px-1.5 bg-emerald-100 text-emerald-700">
                  Approved
                </Badge>
              )}
              {entry.is_pinned && (
                <Badge className="text-[10px] h-4 px-1.5 bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)]">
                  Pinned
                </Badge>
              )}
            </div>

            {/* Tags */}
            {Array.isArray(entry.tags) && (entry.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(entry.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-[var(--cs-text-muted)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-[var(--cs-text-muted)]">{formatDate(entry.created_at)}</span>
              {entry.usage_count > 0 && (
                <span className="text-[10px] text-[var(--cs-text-muted)] tabular-nums">
                  Used {entry.usage_count}×
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Export columns ────────────────────────────────────────────────────────────

const LIBRARY_EXPORT_COLS: ExportColumn<ResourceLibraryEntry>[] = [
  { header: "Title", accessor: (r) => r.title },
  { header: "Type", accessor: (r) => RESOURCE_TYPE_LABELS[r.resource_type] ?? r.resource_type },
  { header: "Pathway", accessor: (r) => r.pathway ? PATHWAY_LABELS[r.pathway] : "" },
  { header: "Approved", accessor: (r) => r.is_approved ? "Yes" : "No" },
  { header: "Pinned", accessor: (r) => r.is_pinned ? "Yes" : "No" },
  { header: "Tags", accessor: (r) => (r.tags ?? []).join(", ") },
  { header: "Usage Count", accessor: (r) => r.usage_count },
  { header: "Created", accessor: (r) => r.created_at?.split("T")[0] ?? "" },
];

type SortKey = "newest" | "oldest" | "usage" | "title";
type PathwayFilter = "all" | LearningPathway;
type TypeFilter = "all" | string;

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ResourceLibraryPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "approved" | "pinned">("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [pathwayFilter, setPathwayFilter] = useState<PathwayFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const { data, isLoading } = useResourceLibrary({ homeId: homeId });
  const entries = data?.data ?? [];

  // Compute stats
  const stats = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    let totalUsage = 0;
    let staffCount = 0;
    let childCount = 0;
    let mixedCount = 0;
    for (const e of entries) {
      typeCounts[e.resource_type] = (typeCounts[e.resource_type] || 0) + 1;
      totalUsage += e.usage_count;
      if (e.pathway === "staff") staffCount++;
      else if (e.pathway === "child") childCount++;
      else if (e.pathway === "mixed") mixedCount++;
    }
    const topType = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0];
    return {
      total: entries.length,
      approved: entries.filter((e) => e.is_approved).length,
      pinned: entries.filter((e) => e.is_pinned).length,
      totalUsage,
      staffCount, childCount, mixedCount,
      topType: topType ? { type: topType[0], count: topType[1] } : null,
      typeCounts,
    };
  }, [entries]);

  // Distinct resource types present in data
  const availableTypes = useMemo(() => {
    const types = new Set(entries.map((e) => e.resource_type));
    return Array.from(types).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    let list = entries;

    // Tab filter
    if (tab === "approved") list = list.filter((e) => e.is_approved);
    if (tab === "pinned") list = list.filter((e) => e.is_pinned);

    // Pathway filter
    if (pathwayFilter !== "all") list = list.filter((e) => e.pathway === pathwayFilter);

    // Type filter
    if (typeFilter !== "all") list = list.filter((e) => e.resource_type === typeFilter);

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        (e.topic ?? "").toLowerCase().includes(q) ||
        (e.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort — pinned always first, then by sort key
    return [...list].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      switch (sortKey) {
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "usage": return b.usage_count - a.usage_count;
        case "title": return a.title.localeCompare(b.title);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [entries, tab, search, sortKey, pathwayFilter, typeFilter]);

  return (
    <PageShell
      title="Resource Library"
      subtitle="All approved learning resources — auto-populated when resources are approved"
      ariaContext={{ pageTitle: "Learning Resource Library", sourceType: "document" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            filename="resource-library"
            columns={LIBRARY_EXPORT_COLS}
            data={filtered}
            label="Export"
          />
          <PrintButton title="Resource Library" subtitle="Chamberlain House — Learning Resources" targetId="library-content" />
          <SmartUploadButton variant="inline" label="Upload Resource" uploadContext="Learning — Resource Library upload" />
          <AriaStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="library-content" className="space-y-4 animate-fade-in">

        {/* Stats */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Total Resources", value: stats.total, colour: "text-[var(--cs-text-secondary)]", bg: "bg-slate-50", icon: Library },
            { label: "Approved", value: stats.approved, colour: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle2 },
            { label: "Pinned", value: stats.pinned, colour: "text-[var(--cs-aria-gold)]", bg: "bg-[var(--cs-aria-gold-bg)]", icon: Pin },
            { label: "Staff Resources", value: stats.staffCount, colour: "text-teal-700", bg: "bg-teal-50", icon: Users },
            { label: "Children Resources", value: stats.childCount, colour: "text-blue-700", bg: "bg-blue-50", icon: BookOpen },
            { label: "Total Uses", value: stats.totalUsage, colour: "text-amber-700", bg: "bg-amber-50", icon: BarChart3 },
          ].map(({ label, value, colour, bg, icon: Icon }) => (
            <div key={label} className={cn("rounded-xl border border-[var(--cs-border-subtle)] p-3", bg)}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn("h-3.5 w-3.5 shrink-0", colour)} />
                <span className="text-[10px] text-[var(--cs-text-muted)] font-medium">{label}</span>
              </div>
              <div className={cn("text-lg font-bold tabular-nums", colour)}>{value}</div>
            </div>
          ))}
        </div>

        {/* Search + tabs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <Input
              className="pl-8 text-sm"
              placeholder="Search by title, topic, or tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 shrink-0">
            {(["all", "approved", "pinned"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === t
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"
                )}
              >
                {t === "all" ? `All (${stats.total})` : t === "approved" ? `Approved (${stats.approved})` : `Pinned (${stats.pinned})`}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Pathway filter */}
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <span className="text-[10px] text-[var(--cs-text-muted)] font-medium">Pathway:</span>
            {(["all", "staff", "child", "mixed"] as PathwayFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => setPathwayFilter(p)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors",
                  pathwayFilter === p
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"
                )}
              >
                {p === "all" ? "All" : PATHWAY_LABELS[p] ?? p}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1 text-[11px] text-[var(--cs-text-secondary)] focus:border-teal-300 focus:ring-1 focus:ring-teal-200 outline-none"
            >
              <option value="all">All types</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>{RESOURCE_TYPE_LABELS[t] ?? t} ({stats.typeCounts[t] ?? 0})</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1 text-[11px] text-[var(--cs-text-secondary)] focus:border-teal-300 focus:ring-1 focus:ring-teal-200 outline-none"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="usage">Most used</option>
              <option value="title">A-Z</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        {(search || pathwayFilter !== "all" || typeFilter !== "all") && (
          <p className="text-xs text-[var(--cs-text-muted)]">
            Showing {filtered.length} of {stats.total} resource{stats.total !== 1 ? "s" : ""}
            {search && <span className="text-[var(--cs-text-muted)]"> matching &ldquo;{search}&rdquo;</span>}
          </p>
        )}

        {/* List */}
        {isLoading ? (
          <p className="text-center text-sm text-[var(--cs-text-muted)] py-12">Loading library…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[var(--cs-text-muted)]">
            <Library className="h-10 w-10 text-[var(--cs-text-gentle)] mx-auto mb-3" />
            <p className="text-sm font-medium">
              {search
                ? `No resources match "${search}"`
                : tab === "approved"
                ? "No approved resources yet"
                : tab === "pinned"
                ? "No pinned resources yet"
                : "The library is empty"}
            </p>
            {!search && tab === "all" && (
              <p className="text-xs mt-1 text-[var(--cs-text-muted)]">
                Resources are automatically added here when they are approved
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((entry) => (
              <LibraryEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
      <AriaPanel
        mode="assist"
        pageContext="Learning Resource Library — training resources, care manuals, policy documents, regulatory guidance, safeguarding resources, therapeutic frameworks, CPD materials"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
