"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CARE LANGUAGE AUDIT
// Are we writing about children in language that pathologises, criminalises,
// or moralises — or do our records show therapeutic understanding?
// PACE Model: behaviour communicates need, not bad character.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  FileText, User, Users, Sparkles, AlertCircle,
} from "lucide-react";
import { api } from "@/hooks/use-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type PatternCategory =
  | "criminalising"
  | "moralising"
  | "power_control"
  | "minimising_trauma"
  | "character_labelling";

interface StaffLanguageProfile {
  staffId: string;
  name: string;
  totalHits: number;
  hitsByCategory: Partial<Record<PatternCategory, number>>;
  mostCommonPhrase: string | null;
  supervisionNote: string;
}

interface ChildLanguageProfile {
  childId: string;
  name: string;
  totalHits: number;
  hitsByCategory: Partial<Record<PatternCategory, number>>;
  mostAffectedCategory: PatternCategory | null;
}

interface CategorySummary {
  category: PatternCategory;
  label: string;
  totalHits: number;
  topPhrase: string | null;
  topStaffId: string | null;
}

interface LanguageAuditSummary {
  totalHits: number;
  totalRecordsScanned: number;
  hitRate: number;
  categoryCounts: Partial<Record<PatternCategory, number>>;
  staffWithHits: number;
  childrenAffected: number;
  mostFlaggedPhrase: string | null;
}

interface CareLanguageAuditResponse {
  staffProfiles: StaffLanguageProfile[];
  childProfiles: ChildLanguageProfile[];
  categorySummary: CategorySummary[];
  summary: LanguageAuditSummary;
}

// ── Category styling ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<PatternCategory, { label: string; badge: string; dot: string }> = {
  criminalising:       { label: "Criminalising",       badge: "bg-rose-50 text-rose-800 border-rose-300",   dot: "bg-rose-500"    },
  moralising:          { label: "Moralising",           badge: "bg-orange-50 text-orange-800 border-orange-300", dot: "bg-orange-500" },
  character_labelling: { label: "Character Labelling",  badge: "bg-amber-50 text-amber-800 border-amber-300", dot: "bg-amber-400"   },
  power_control:       { label: "Power / Control",      badge: "bg-blue-50 text-blue-800 border-blue-300",   dot: "bg-blue-400"    },
  minimising_trauma:   { label: "Minimising Trauma",    badge: "bg-violet-50 text-violet-800 border-violet-300", dot: "bg-violet-400" },
};

// ── Category bar ──────────────────────────────────────────────────────────────

function CategoryBar({ cat, maxHits }: { cat: CategorySummary; maxHits: number }) {
  const cfg = CATEGORY_CONFIG[cat.category];
  const width = maxHits > 0 ? Math.round((cat.totalHits / maxHits) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex w-36 shrink-0 items-center gap-1.5">
        <div className={`h-2 w-2 rounded-full ${cfg.dot}`} />
        <span className="text-xs text-slate-600">{cfg.label}</span>
      </div>
      <div className="flex-1">
        <div className="h-2 w-full rounded-full bg-slate-100">
          <div className={`h-2 rounded-full ${cfg.dot}`} style={{ width: `${width}%` }} />
        </div>
      </div>
      <span className="w-8 text-right text-xs font-semibold tabular-nums text-slate-700">{cat.totalHits}</span>
    </div>
  );
}

// ── Staff card ────────────────────────────────────────────────────────────────

function StaffCard({ profile, maxHits }: { profile: StaffLanguageProfile; maxHits: number }) {
  const [expanded, setExpanded] = useState(false);
  const barWidth = maxHits > 0 ? Math.round((profile.totalHits / maxHits) * 100) : 0;
  const topCat = Object.entries(profile.hitsByCategory).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0] as [PatternCategory, number] | undefined;
  const topCatCfg = topCat ? CATEGORY_CONFIG[topCat[0]] : null;

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
            <User className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{profile.name}</p>
            {topCatCfg && (
              <Badge variant="outline" className={`mt-0.5 text-[10px] ${topCatCfg.badge}`}>
                {topCatCfg.label} most common
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
          <span className="text-sm font-bold tabular-nums text-slate-700">{profile.totalHits}</span>
        </div>
      </div>
      <div className="mt-2">
        <div className="h-1.5 w-full rounded-full bg-slate-100">
          <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${barWidth}%` }} />
        </div>
      </div>
      {expanded && (
        <div className="mt-3 space-y-2 border-t pt-3">
          {(Object.entries(profile.hitsByCategory) as Array<[PatternCategory, number]>).map(([cat, n]) => {
            const cfg = CATEGORY_CONFIG[cat];
            return (
              <div key={cat} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                  <span className="text-slate-600">{cfg.label}</span>
                </div>
                <span className="font-semibold tabular-nums text-slate-700">{n}</span>
              </div>
            );
          })}
          {profile.mostCommonPhrase && (
            <p className="text-[11px] text-slate-500">
              Most common: <span className="font-medium text-slate-700">&ldquo;{profile.mostCommonPhrase}&rdquo;</span>
            </p>
          )}
          <div className="rounded-md bg-blue-50 border border-blue-100 p-2.5 text-[11px] text-blue-800 leading-relaxed">
            {profile.supervisionNote}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Child card ────────────────────────────────────────────────────────────────

function ChildCard({ profile }: { profile: ChildLanguageProfile }) {
  const topCatCfg = profile.mostAffectedCategory ? CATEGORY_CONFIG[profile.mostAffectedCategory] : null;
  return (
    <div className="flex items-center justify-between rounded-lg border bg-white p-3">
      <div>
        <p className="text-sm font-medium text-slate-800">{profile.name}</p>
        {topCatCfg && (
          <Badge variant="outline" className={`mt-0.5 text-[10px] ${topCatCfg.badge}`}>
            mainly {topCatCfg.label.toLowerCase()}
          </Badge>
        )}
      </div>
      <span className="text-sm font-bold tabular-nums text-slate-700">{profile.totalHits} flags</span>
    </div>
  );
}

// ── Summary tile ──────────────────────────────────────────────────────────────

function SummaryTile({ label, value, sub, warn }: { label: string; value: string | number; sub?: string; warn?: boolean }) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${warn ? "border-amber-200 bg-amber-50" : ""}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-0.5 text-2xl font-bold ${warn ? "text-amber-800" : "text-slate-800"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CareLanguageAuditPage() {
  const { data: res, isLoading, isError } = useQuery({
    queryKey: ["care-language-audit"],
    queryFn: () =>
      api.get<{ data: CareLanguageAuditResponse }>("/care-language-audit"),
    staleTime: 120_000,
  });
  const [showAllStaff, setShowAllStaff] = useState(false);
  const [showAllChildren, setShowAllChildren] = useState(false);

  const payload = res?.data;
  const staffProfiles     = payload?.staffProfiles ?? [];
  const childProfiles     = payload?.childProfiles ?? [];
  const categorySummary   = payload?.categorySummary ?? [];
  const summary           = payload?.summary;

  const maxStaffHits    = staffProfiles[0]?.totalHits ?? 1;
  const maxCategoryHits = categorySummary[0]?.totalHits ?? 1;
  const visibleStaff    = showAllStaff    ? staffProfiles  : staffProfiles.slice(0, 5);
  const visibleChildren = showAllChildren ? childProfiles  : childProfiles.slice(0, 5);

  const isClean = (summary?.totalHits ?? 0) === 0;

  return (
    <PageShell
      title="Care Language Audit"
      description="Retrospective scan of incident records, behaviour logs, and daily logs for language that criminalises, moralises, or minimises — rather than understanding behaviour therapeutically."
    >
      {isLoading && (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
          Scanning historical records for language patterns…
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Could not load care language audit data.
        </div>
      )}

      {!isLoading && !isError && payload && (
        <div className="space-y-6">
          {/* Summary tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile
              label="Language flags found"
              value={summary?.totalHits ?? 0}
              sub={`across ${summary?.totalRecordsScanned ?? 0} records scanned`}
              warn={(summary?.totalHits ?? 0) > 0}
            />
            <SummaryTile
              label="Records flagged rate"
              value={`${summary?.hitRate ?? 0}%`}
              sub="of all records scanned"
              warn={(summary?.hitRate ?? 0) > 10}
            />
            <SummaryTile
              label="Staff with flags"
              value={summary?.staffWithHits ?? 0}
              sub="need development focus"
            />
            <SummaryTile
              label="Children affected"
              value={summary?.childrenAffected ?? 0}
              sub="described in flagged language"
            />
          </div>

          {/* Clean state */}
          {isClean && (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-medium">No flags found across {summary?.totalRecordsScanned ?? 0} records.</p>
                <p className="mt-0.5 text-xs text-emerald-700">
                  This is strong evidence of therapeutic, strengths-based recording culture. Continue to model this in supervision.
                </p>
              </div>
            </div>
          )}

          {/* PACE principle */}
          {!isClean && (
            <div className="flex items-start gap-3 rounded-lg bg-slate-50 border px-4 py-3 text-xs text-slate-600">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <p>
                <strong>PACE principle:</strong> Behaviour communicates need, not bad character. Records should reflect curiosity about
                the child&apos;s experience — not judgement. Language that criminalises or moralises can shape how we see and respond
                to children, and may constitute poor care if it becomes a pattern.
              </p>
            </div>
          )}

          {!isClean && (
            <>
              {/* Category breakdown */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    Flags by language category
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categorySummary.map((cat) => (
                    <CategoryBar key={cat.category} cat={cat} maxHits={maxCategoryHits} />
                  ))}
                  {summary?.mostFlaggedPhrase && (
                    <p className="mt-1 text-xs text-slate-500">
                      Most frequent phrase: <span className="font-medium text-slate-700">&ldquo;{summary.mostFlaggedPhrase}&rdquo;</span>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Staff profiles */}
              {staffProfiles.length > 0 && (
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <User className="h-4 w-4" />
                    By staff member
                  </h2>
                  <div className="space-y-2">
                    {visibleStaff.map((p) => (
                      <StaffCard key={p.staffId} profile={p} maxHits={maxStaffHits} />
                    ))}
                    {staffProfiles.length > 5 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllStaff(!showAllStaff)}
                        className="w-full text-xs"
                      >
                        {showAllStaff ? "Show fewer" : `Show all ${staffProfiles.length} staff`}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Children affected */}
              {childProfiles.length > 0 && (
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Users className="h-4 w-4" />
                    Children most described in flagged language
                  </h2>
                  <div className="space-y-2">
                    {visibleChildren.map((p) => (
                      <ChildCard key={p.childId} profile={p} />
                    ))}
                    {childProfiles.length > 5 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllChildren(!showAllChildren)}
                        className="w-full text-xs"
                      >
                        {showAllChildren ? "Show fewer" : `Show all ${childProfiles.length} children`}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-400">
            Cara detects language patterns — the manager decides what to address in supervision and how.
          </p>
        </div>
      )}
    </PageShell>
  );
}
