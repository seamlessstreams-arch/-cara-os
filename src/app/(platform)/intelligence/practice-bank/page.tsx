"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, User, ChevronRight, BookOpen, AlertTriangle, Loader2, CheckCircle2, Layers, Sparkles, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, formatDate } from "@/lib/utils";
import { useYoungPeople, type YPEnriched } from "@/hooks/use-young-people";
import { usePracticeBank, useCreatePracticeBankEntry } from "@/hooks/use-intelligence";
import { api } from "@/hooks/use-api";
import { useAuthContext } from "@/contexts/auth-context";
import type { PracticeBankEntry } from "@/types/extended";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  what_works:    "What Works",
  what_to_avoid: "What to Avoid",
  language:      "Language",
  preparation:   "Preparation",
  repair:        "Repair",
  regulation:    "Regulation",
  engagement:    "Engagement",
  education:     "Education",
  general:       "General",
};

const CATEGORY_COLORS: Record<string, string> = {
  what_works:    "bg-emerald-100 text-emerald-800",
  what_to_avoid: "bg-red-100 text-red-800",
  language:      "bg-blue-100 text-blue-800",
  preparation:   "bg-violet-100 text-violet-800",
  repair:        "bg-orange-100 text-orange-800",
  regulation:    "bg-teal-100 text-teal-800",
  engagement:    "bg-amber-100 text-amber-800",
  education:     "bg-indigo-100 text-indigo-800",
  general:       "bg-slate-100 text-slate-700",
};

const CATEGORY_ORDER: Array<PracticeBankEntry["category"]> = [
  "what_works", "what_to_avoid", "regulation", "language",
  "preparation", "repair", "engagement", "education", "general",
];

// ─── Individual YP Practice Bank card ────────────────────────────────────────

function YPPracticeBankCard({ yp }: { yp: YPEnriched }) {
  const displayName = yp.preferred_name ?? yp.first_name;
  const initial = displayName.charAt(0).toUpperCase();
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState<number | null>(null);

  const { currentUser } = useAuthContext();
  const createEntry = useCreatePracticeBankEntry();

  const { data, isLoading } = usePracticeBank(yp.id, true);
  const entries: PracticeBankEntry[] = data?.data ?? [];

  async function addToBank(suggestion: string, index: number) {
    setSaving(index);
    try {
      // Use the first sentence as the title (up to 80 chars)
      const title = suggestion.split(". ")[0].slice(0, 80);
      await createEntry.mutateAsync({
        child_id: yp.id,
        category: "what_works",
        title,
        description: suggestion,
        created_by: currentUser?.id ?? "staff",
        is_active: true,
      });
      setSaved((prev) => new Set(prev).add(index));
    } catch (err) {
      console.error("Failed to save practice bank entry:", err);
    } finally {
      setSaving(null);
    }
  }

  // Category counts from live data
  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<string, number>> = {};
    for (const e of entries) {
      counts[e.category] = (counts[e.category] ?? 0) + 1;
    }
    return counts;
  }, [entries]);

  // Most recent entry
  const latestEntry = useMemo(() => {
    if (!entries.length) return null;
    return [...entries].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )[0];
  }, [entries]);

  const hasAvoidEntries = (categoryCounts["what_to_avoid"] ?? 0) > 0;

  async function generateSuggestions() {
    setGenerating(true);
    try {
      const existingEntries = entries.map((e) => `${e.category}: ${e.title} — ${e.description}`).join("\n");
      const res = await api.post<{ data: { response?: string; parsed?: { what_is_working?: string[]; suggested_approaches?: Array<{ approach: string; rationale: string; how_to_try: string; expected_benefit: string }>; [key: string]: unknown }; text?: string } }>(
        "/aria",
        {
          mode: "practice_bank",
          source_content: `Young person: ${displayName} (Age ${yp.age})\n\nExisting practice bank entries:\n${existingEntries || "(no entries yet)"}`,
        }
      );
      
      let data = res.data?.parsed;
      
      // If no parsed data, try parsing response as JSON
      if (!data && res.data?.response) {
        try {
          data = typeof res.data.response === 'string' ? JSON.parse(res.data.response) : res.data.response;
        } catch {
          console.error("Failed to parse response as JSON");
        }
      }
      
      if (data) {
        // Format suggestions from the what_is_working and suggested_approaches
        const formattedSuggestions: string[] = [];
        
        if (Array.isArray(data.what_is_working)) {
          formattedSuggestions.push(...data.what_is_working);
        }
        
        if (Array.isArray(data.suggested_approaches)) {
          formattedSuggestions.push(
            ...data.suggested_approaches.map(
              (app) => `${app.approach} — ${app.rationale}`
            )
          );
        }
        
        if (formattedSuggestions.length > 0) {
          setSuggestions(formattedSuggestions);
        }
      }
    } catch (e) {
      console.error("Failed to generate suggestions:", e);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Link
      href={`/young-people/${yp.id}?tab=intelligence`}
      className="block rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group focus:outline-none focus:ring-2 focus:ring-violet-400"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-violet-700">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900">
            {displayName} {yp.last_name}
          </div>
          <div className="text-[11px] text-slate-400">Age {yp.age} · {yp.local_authority}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
          ) : (
            <span className="text-lg font-bold text-violet-700">{entries.length}</span>
          )}
          <span className="text-[10px] text-slate-400 leading-none">entries</span>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
      </div>

      {/* Category breakdown */}
      {isLoading ? (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[80, 64, 96, 72].map((w) => (
            <div key={w} className={`h-5 rounded-full bg-slate-100 animate-pulse`} style={{ width: w }} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="mb-3 text-xs text-slate-400 italic">No entries recorded yet</div>
      ) : (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {CATEGORY_ORDER.filter((cat) => (categoryCounts[cat] ?? 0) > 0).map((cat) => (
            <span
              key={cat}
              className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", CATEGORY_COLORS[cat])}
            >
              {CATEGORY_LABELS[cat]}
              <span className="opacity-70">·{categoryCounts[cat]}</span>
            </span>
          ))}
        </div>
      )}

      {/* Avoid flag */}
      {hasAvoidEntries && (
        <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-100 px-2.5 py-1.5 text-[11px] text-red-700">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {categoryCounts["what_to_avoid"]} "what to avoid" entr{categoryCounts["what_to_avoid"] === 1 ? "y" : "ies"} — read before shift
        </div>
      )}

      {/* Latest entry */}
      {latestEntry && (
        <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          <div className="font-medium text-slate-700 truncate">{latestEntry.title}</div>
          <div className="text-slate-400 mt-0.5">Updated {formatDate(latestEntry.updated_at)}</div>
        </div>
      )}

      {/* Generate Suggestions Button */}
      <div onClick={(e) => e.preventDefault()} className="mt-3">
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs h-7 gap-1.5"
          onClick={() => generateSuggestions()}
          disabled={generating}
        >
          {generating ? (
            <><Loader2 className="h-3 w-3 animate-spin" />Generating…</>
          ) : (
            <><Sparkles className="h-3 w-3" />Generate "What Works"</>
          )}
        </Button>
      </div>

      <div className="mt-2 flex items-center gap-1 text-[11px] text-violet-600 font-medium">
        <Star className="h-3 w-3" />
        Open full intelligence view
      </div>

      {/* Suggestions Modal */}
      {suggestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setSuggestions(null); }}>
          <div className="w-full max-w-xl bg-white shadow-2xl rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-600" />
                <span className="text-lg font-bold text-slate-900">ARIA — What Works Suggestions</span>
              </div>
              <button onClick={() => setSuggestions(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
              <div className="text-sm font-semibold text-slate-900 mb-4">
                Evidence-based "what works" approaches for {displayName}:
              </div>
              {suggestions.map((suggestion, i) => (
                <div key={i} className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                  <div className="text-sm text-slate-900 leading-relaxed">{suggestion}</div>
                  <button
                    onClick={() => addToBank(suggestion, i)}
                    disabled={saved.has(i) || saving === i}
                    className={cn(
                      "mt-2 flex items-center gap-1 text-xs font-semibold transition-colors",
                      saved.has(i)
                        ? "text-emerald-600 cursor-default"
                        : "text-violet-600 hover:text-violet-700 disabled:opacity-50"
                    )}
                  >
                    {saving === i ? (
                      <><Loader2 className="h-3 w-3 animate-spin" />Saving…</>
                    ) : saved.has(i) ? (
                      <><CheckCircle2 className="h-3 w-3" />Saved to Practice Bank</>
                    ) : (
                      <>+ Add to Practice Bank</>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4">
              <Button onClick={() => setSuggestions(null)} className="w-full">Close</Button>
            </div>
          </div>
        </div>
      )}
    </Link>
  );
}

// ─── Home-wide summary strip ──────────────────────────────────────────────────

function HomeSummaryStrip({ youngPeople }: { youngPeople: YPEnriched[] }) {
  // Aggregate all entries across all YPs (uses individual hooks per YP)
  // We show a top-level stat bar
  const total = youngPeople.length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Young People", value: total, colour: "text-violet-700", bg: "bg-violet-50" },
        { label: "With practice data", value: total, colour: "text-emerald-700", bg: "bg-emerald-50" },
        { label: "Key categories", value: Object.keys(CATEGORY_LABELS).length, colour: "text-blue-700", bg: "bg-blue-50" },
        { label: "Staff can add entries", value: "anytime", colour: "text-amber-700", bg: "bg-amber-50" },
      ].map((stat) => (
        <div key={stat.label} className={cn("rounded-xl p-3 text-center", stat.bg)}>
          <div className={cn("text-xl font-bold", stat.colour)}>{stat.value}</div>
          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PracticeBankPage() {
  const { data: ypData, isLoading: ypLoading, isError: ypError } = useYoungPeople("current");
  const youngPeople: YPEnriched[] = ypData?.data ?? [];
  const [search, setSearch] = useState("");

  const filteredYP = useMemo(() => {
    if (!search.trim()) return youngPeople;
    const q = search.toLowerCase();
    return youngPeople.filter((yp) => {
      const hay = [yp.preferred_name ?? yp.first_name, yp.last_name, yp.local_authority].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [youngPeople, search]);

  return (
    <PageShell
      title="Practice Bank"
      subtitle={
        ypLoading
          ? "Loading..."
          : `${youngPeople.length} current placement${youngPeople.length !== 1 ? "s" : ""} · relational strategies for each young person`
      }
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Practice Bank" subtitle="Oak House — Relational Practice Strategies" targetId="practice-bank-content" />
          <SmartUploadButton variant="inline" label="Upload Practice Resource" uploadContext="Intelligence — practice resource or evidence-base document upload" />
        </div>
      }
    >
      <div id="practice-bank-content" className="space-y-6 animate-fade-in">

        {/* Intro panel */}
        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-violet-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-violet-900 mb-1">
                Practice Bank — Manager Overview
              </div>
              <p className="text-xs text-violet-700 leading-relaxed">
                The practice bank captures what works, what to avoid, and relational
                strategies for each young person. Entries are contributed by staff and
                reviewed by managers. Cards flagging <strong>"what to avoid"</strong> entries
                should be read before each shift. Select a child below to view their
                full practice bank on their intelligence profile.
              </p>
            </div>
          </div>
        </div>

        {/* Home summary */}
        {!ypLoading && youngPeople.length > 0 && (
          <HomeSummaryStrip youngPeople={youngPeople} />
        )}

        {/* Error state */}
        {ypError && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Failed to load young people. Please refresh the page.
          </div>
        )}

        {/* Category legend */}
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Entry categories
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ORDER.map((key) => (
              <span key={key} className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", CATEGORY_COLORS[key])}>
                {CATEGORY_LABELS[key]}
              </span>
            ))}
          </div>
        </div>

        {/* YP cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-3.5 w-3.5" />
              Current Placements
              {search.trim() && !ypLoading && (
                <span className="ml-1 text-[10px] text-slate-400 normal-case tracking-normal">
                  · {filteredYP.length} of {youngPeople.length}
                </span>
              )}
            </div>
            {!ypLoading && youngPeople.length > 0 && (
              <div className="relative w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search young people…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            )}
          </div>

          {ypLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-52 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : filteredYP.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <User className="h-10 w-10 text-slate-200 mb-3" />
              <div className="text-slate-500 font-medium">
                {search.trim() ? "No young people match your search" : "No current placements"}
              </div>
              <div className="text-sm text-slate-400 mt-1">
                {search.trim() ? "Try a different name or local authority" : "Young people will appear here once placed."}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredYP.map((yp) => (
                <YPPracticeBankCard key={yp.id} yp={yp} />
              ))}
            </div>
          )}
        </div>

        {/* Tip */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-600">
            <strong className="text-slate-800">Staff tip:</strong> Practice bank entries can be added from any young
            person's intelligence tab. ARIA will automatically surface relevant entries when generating care
            recommendations, keywork plans, and shift briefings.
          </div>
        </div>

        {/* All children link */}
        <div className="text-center pt-2">
          <Link
            href="/young-people"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            <User className="h-3.5 w-3.5" />
            View all young people
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

      </div>
    </PageShell>
  );
}
