"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STRENGTHS-BASED RECORDING INDEX
// The positive complement to the Care Language Audit.
// Are we recording what children CAN do, achieve, and feel — or only
// documenting challenges and deficits?
// 21 Skills principle: document the whole child, including their strengths.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star, TrendingUp, ChevronDown, ChevronUp, Sparkles,
  AlertCircle, CheckCircle2, Award, User, Users,
} from "lucide-react";
import { api } from "@/hooks/use-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type StrengthCategory =
  | "achievement"
  | "positive_connection"
  | "resilience_coping"
  | "voice_agency"
  | "positive_mood";

interface StaffStrengthsProfile {
  staffId: string;
  name: string;
  totalRecords: number;
  recordsWithStrengths: number;
  strengthsRate: number | null;
  markerCount: number;
  topCategory: StrengthCategory | null;
  topCategoryLabel: string | null;
  recognitionNote: string;
}

interface ChildStrengthsProfile {
  childId: string;
  name: string;
  totalRecords: number;
  recordsWithStrengths: number;
  strengthsRate: number | null;
  topStrengthPhrase: string | null;
}

interface CategoryResult {
  category: StrengthCategory;
  label: string;
  totalCount: number;
  topPhrase: string | null;
}

interface StrengthsRecordingSummary {
  overallRate: number;
  totalRecords: number;
  totalWithStrengths: number;
  topPractitioner: { staffId: string; name: string; rate: number | null } | null;
  mostDocumentedChild: { childId: string; name: string; rate: number | null } | null;
  topStrengthsCategory: StrengthCategory | null;
  topStrengthsCategoryLabel: string | null;
}

interface StrengthsRecordingIndexResponse {
  staffProfiles: StaffStrengthsProfile[];
  childProfiles: ChildStrengthsProfile[];
  categoryResults: CategoryResult[];
  summary: StrengthsRecordingSummary;
}

// ── Category styling ──────────────────────────────────────────────────────────

const CAT_CONFIG: Record<StrengthCategory, { label: string; colour: string; dot: string }> = {
  achievement:         { label: "Achievement",          colour: "bg-emerald-500", dot: "bg-emerald-500" },
  positive_connection: { label: "Positive Connection",  colour: "bg-blue-500",    dot: "bg-blue-500"    },
  resilience_coping:   { label: "Resilience & Coping",  colour: "bg-violet-500",  dot: "bg-violet-500"  },
  voice_agency:        { label: "Voice & Agency",        colour: "bg-orange-500",  dot: "bg-orange-500"  },
  positive_mood:       { label: "Positive Mood",         colour: "bg-rose-400",    dot: "bg-rose-400"    },
};

function RateBadge({ rate }: { rate: number | null }) {
  if (rate === null) return <span className="text-xs text-slate-400">—</span>;
  const cls =
    rate >= 60 ? "bg-emerald-50 text-emerald-800 border-emerald-300" :
    rate >= 30 ? "bg-amber-50 text-amber-800 border-amber-300" :
                 "bg-slate-100 text-slate-600 border-slate-300";
  return (
    <Badge variant="outline" className={`${cls} font-semibold tabular-nums`}>
      {rate}%
    </Badge>
  );
}

// ── Category bar ──────────────────────────────────────────────────────────────

function CategoryBar({ cat, maxCount }: { cat: CategoryResult; maxCount: number }) {
  const cfg = CAT_CONFIG[cat.category];
  const w = maxCount > 0 ? Math.round((cat.totalCount / maxCount) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex w-40 shrink-0 items-center gap-1.5">
        <div className={`h-2 w-2 rounded-full ${cfg.dot}`} />
        <span className="text-xs text-slate-600">{cfg.label}</span>
      </div>
      <div className="flex-1">
        <div className="h-2 w-full rounded-full bg-slate-100">
          <div className={`h-2 rounded-full ${cfg.colour}`} style={{ width: `${w}%` }} />
        </div>
      </div>
      <span className="w-8 text-right text-xs font-semibold tabular-nums text-slate-700">{cat.totalCount}</span>
    </div>
  );
}

// ── Staff card ────────────────────────────────────────────────────────────────

function StaffCard({ profile }: { profile: StaffStrengthsProfile }) {
  const [expanded, setExpanded] = useState(false);
  const isChampion = (profile.strengthsRate ?? 0) >= 60;
  const catCfg = profile.topCategory ? CAT_CONFIG[profile.topCategory] : null;

  return (
    <div className={`rounded-lg border bg-white p-3 ${isChampion ? "border-emerald-200" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full ${isChampion ? "bg-emerald-100" : "bg-slate-100"}`}>
            {isChampion ? <Award className="h-3.5 w-3.5 text-emerald-600" /> : <User className="h-3.5 w-3.5 text-slate-500" />}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{profile.name}</p>
            {catCfg && (
              <span className="text-[10px] text-slate-400">top: {catCfg.label}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
          <RateBadge rate={profile.strengthsRate} />
        </div>
      </div>
      <div className="mt-2">
        <div className="h-1.5 w-full rounded-full bg-slate-100">
          <div
            className={`h-1.5 rounded-full ${isChampion ? "bg-emerald-500" : "bg-blue-400"}`}
            style={{ width: `${profile.strengthsRate ?? 0}%` }}
          />
        </div>
      </div>
      {expanded && (
        <div className="mt-3 space-y-2 border-t pt-3">
          <p className="text-[11px] text-slate-500">
            {profile.recordsWithStrengths} of {profile.totalRecords} records include strengths language ·{" "}
            {profile.markerCount} total markers
          </p>
          <div className={`rounded-md border p-2.5 text-[11px] leading-relaxed ${
            isChampion
              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
              : "bg-blue-50 border-blue-100 text-blue-800"
          }`}>
            {profile.recognitionNote}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Child card ────────────────────────────────────────────────────────────────

function ChildCard({ profile }: { profile: ChildStrengthsProfile }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-white p-3">
      <div>
        <p className="text-sm font-medium text-slate-800">{profile.name}</p>
        {profile.topStrengthPhrase && (
          <p className="mt-0.5 text-[11px] text-slate-400">
            Most documented: &ldquo;{profile.topStrengthPhrase}&rdquo;
          </p>
        )}
      </div>
      <RateBadge rate={profile.strengthsRate} />
    </div>
  );
}

// ── Summary tile ──────────────────────────────────────────────────────────────

function SummaryTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StrengthsRecordingPage() {
  const { data: res, isLoading, isError } = useQuery({
    queryKey: ["strengths-recording-index"],
    queryFn: () =>
      api.get<{ data: StrengthsRecordingIndexResponse }>("/strengths-recording-index"),
    staleTime: 120_000,
  });
  const [showAll, setShowAll] = useState(false);

  const payload  = res?.data;
  const staff    = payload?.staffProfiles ?? [];
  const children = payload?.childProfiles ?? [];
  const cats     = payload?.categoryResults ?? [];
  const summary  = payload?.summary;

  const maxCatCount = cats[0]?.totalCount ?? 1;
  const visibleStaff = showAll ? staff : staff.slice(0, 6);

  return (
    <PageShell
      title="Strengths-Based Recording Index"
      description="How often do records celebrate what children can do, achieve, and feel? The positive complement to the Care Language Audit."
    >
      {isLoading && (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
          Scanning for strengths-based language across records…
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Could not load strengths recording data.
        </div>
      )}

      {!isLoading && !isError && payload && (
        <div className="space-y-6">
          {/* Summary tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile
              label="Strengths presence rate"
              value={`${summary?.overallRate ?? 0}%`}
              sub={`${summary?.totalWithStrengths ?? 0} of ${summary?.totalRecords ?? 0} records`}
            />
            <SummaryTile
              label="Top strength type"
              value={summary?.topStrengthsCategoryLabel ?? "—"}
              sub="most frequent in records"
            />
            <SummaryTile
              label="Champion recorder"
              value={summary?.topPractitioner?.name ?? "—"}
              sub={summary?.topPractitioner?.rate !== null && summary?.topPractitioner?.rate !== undefined ? `${summary.topPractitioner.rate}% strengths rate` : undefined}
            />
            <SummaryTile
              label="Most documented child"
              value={summary?.mostDocumentedChild?.name ?? "—"}
              sub={summary?.mostDocumentedChild?.rate !== null && summary?.mostDocumentedChild?.rate !== undefined ? `${summary.mostDocumentedChild.rate}% records with strengths` : undefined}
            />
          </div>

          {/* Context strip */}
          <div className="flex items-start gap-3 rounded-lg bg-slate-50 border px-4 py-3 text-xs text-slate-600">
            <Star className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <p>
              <strong>21 Skills principle:</strong> Good recording documents the whole child — not just difficulties.
              When records only capture what went wrong, children learn that&apos;s how they are seen. Strengths-based
              recording shapes the team&apos;s understanding of who each child is becoming.
            </p>
          </div>

          {/* Category breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4" />
                Strengths language by type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cats.map((cat) => (
                <CategoryBar key={cat.category} cat={cat} maxCount={maxCatCount} />
              ))}
            </CardContent>
          </Card>

          {/* Zero state for overall */}
          {(summary?.overallRate ?? 0) < 5 && (
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <p>
                Very few strengths-based phrases were found across all records. This is common — practice is often
                stronger than the recording reflects. Use supervision to help staff notice and document the positive
                moments they see every day.
              </p>
            </div>
          )}

          {/* Staff profiles */}
          {staff.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <User className="h-4 w-4" />
                By staff member
              </h2>
              <div className="space-y-2">
                {visibleStaff.map((p) => (
                  <StaffCard key={p.staffId} profile={p} />
                ))}
                {staff.length > 6 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAll(!showAll)}
                    className="w-full text-xs"
                  >
                    {showAll ? "Show fewer" : `Show all ${staff.length} staff`}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Children documented */}
          {children.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Users className="h-4 w-4" />
                Strengths documented per child
              </h2>
              <div className="space-y-2">
                {children.slice(0, 6).map((c) => (
                  <ChildCard key={c.childId} profile={c} />
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-[11px] text-slate-400">
            Cara identifies language patterns — the manager brings these insights to supervision to develop recording culture together.
          </p>
        </div>
      )}
    </PageShell>
  );
}
