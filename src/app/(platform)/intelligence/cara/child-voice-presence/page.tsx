"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD VOICE PRESENCE INTELLIGENCE
// Are children's own words, views, and choices appearing in records —
// or are we writing ABOUT them rather than WITH them?
// UN CRC Article 12: every child has the right to have their views heard.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Quote, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  AlertCircle, Sparkles, CheckCircle2, AlertTriangle, BarChart3,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";

type VoiceTrend = "improving" | "stable" | "declining";
type RecordType = "incidents" | "dailyLog" | "keyWorkingSessions" | "ypFeedback" | "lacReviews";

interface RecordTypeStats {
  type: RecordType;
  label: string;
  total: number;
  withVoice: number;
  presenceRate: number | null;
  recentRate: number | null;
  priorRate: number | null;
  trend: VoiceTrend;
  supervisionPrompt: string;
}

interface ChildVoiceProfile {
  childId: string;
  name: string;
  overallScore: number | null;
  totalRecords: number;
  recordsWithVoice: number;
  byType: Partial<Record<RecordType, { total: number; withVoice: number; rate: number | null }>>;
  topGapType: RecordType | null;
  topStrengthType: RecordType | null;
  hasData: boolean;
}

interface ChildVoicePresenceSummary {
  overallPresenceRate: number | null;
  totalRecords: number;
  totalWithVoice: number;
  childrenWithData: number;
  worstType: { type: RecordType; label: string; rate: number | null } | null;
  bestType:  { type: RecordType; label: string; rate: number | null } | null;
  lacParticipationRate: number | null;
}

interface ChildVoicePresenceResponse {
  typeStats: RecordTypeStats[];
  childProfiles: ChildVoiceProfile[];
  summary: ChildVoicePresenceSummary;
}

function useChildVoicePresenceIntelligence() {
  return useQuery({
    queryKey: ["child-voice-presence-intelligence"],
    queryFn: () =>
      api.get<{ data: ChildVoicePresenceResponse }>("/child-voice-presence-intelligence"),
    staleTime: 60_000,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: VoiceTrend }) {
  if (trend === "improving") return <TrendingUp  className="h-3.5 w-3.5 text-emerald-600" />;
  if (trend === "declining") return <TrendingDown className="h-3.5 w-3.5 text-rose-500"   />;
  return <Minus className="h-3.5 w-3.5 text-slate-400" />;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-slate-400">—</span>;
  const cls =
    score >= 60 ? "bg-emerald-50 text-emerald-800 border-emerald-300" :
    score >= 35 ? "bg-amber-50 text-amber-800 border-amber-300" :
                   "bg-rose-50 text-rose-800 border-rose-300";
  return (
    <Badge variant="outline" className={`${cls} font-semibold tabular-nums`}>
      {score}%
    </Badge>
  );
}

const TYPE_COLOURS: Record<RecordType, string> = {
  incidents:          "bg-rose-500",
  dailyLog:           "bg-blue-500",
  keyWorkingSessions: "bg-emerald-500",
  ypFeedback:         "bg-violet-500",
  lacReviews:         "bg-orange-500",
};

// ── Record type card ──────────────────────────────────────────────────────────

function RecordTypeCard({ stat, maxTotal }: { stat: RecordTypeStats; maxTotal: number }) {
  const [expanded, setExpanded] = useState(false);
  const barWidth = maxTotal > 0 ? Math.round((stat.total / maxTotal) * 100) : 0;
  const fillWidth = stat.presenceRate ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${TYPE_COLOURS[stat.type]}`} />
            <CardTitle className="text-sm">{stat.label}</CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendIcon trend={stat.trend} />
            <ScoreBadge score={stat.presenceRate} />
          </div>
        </div>
        <CardDescription className="text-xs">
          {stat.withVoice} of {stat.total} records include child voice
          {stat.recentRate !== null && ` · ${stat.recentRate}% recent`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {/* Total records bar */}
        <div>
          <div className="h-2 w-full rounded-full bg-slate-100" title={`${stat.total} records`}>
            <div className="h-2 rounded-full bg-slate-200" style={{ width: `${barWidth}%` }}>
              <div className="h-2 rounded-full bg-blue-400" style={{ width: `${fillWidth}%` }} />
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-full justify-between px-0 text-[11px] text-slate-400 hover:text-slate-600"
          onClick={() => setExpanded(!expanded)}
        >
          <span>Supervision prompt</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
        {expanded && (
          <div className="rounded-md bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800 leading-relaxed">
            {stat.supervisionPrompt}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Child card ────────────────────────────────────────────────────────────────

function ChildCard({ profile }: { profile: ChildVoiceProfile }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-800">{profile.name}</p>
          <p className="text-[11px] text-slate-400">
            {profile.hasData
              ? `${profile.recordsWithVoice} of ${profile.totalRecords} records include voice`
              : "No records analysed"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {profile.hasData && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          )}
          <ScoreBadge score={profile.overallScore} />
        </div>
      </div>

      {expanded && profile.hasData && (
        <div className="mt-3 space-y-1.5 border-t pt-3">
          {(Object.entries(profile.byType) as Array<[RecordType, { total: number; withVoice: number; rate: number | null }]>).map(([type, stats]) => (
            <div key={type} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${TYPE_COLOURS[type]}`} />
                <span className="text-slate-600">
                  {type === "incidents" ? "Incidents" :
                   type === "dailyLog" ? "Daily Log" :
                   type === "keyWorkingSessions" ? "Key Working" :
                   type === "ypFeedback" ? "YP Feedback" : "LAC Reviews"}
                </span>
              </div>
              <span className="tabular-nums text-slate-500">
                {stats.withVoice}/{stats.total}
                {stats.rate !== null && <span className="ml-1 text-slate-400">({stats.rate}%)</span>}
              </span>
            </div>
          ))}
          {profile.topGapType && (
            <p className="mt-2 text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1">
              Gap: voice least present in{" "}
              {profile.topGapType === "incidents" ? "incident records" :
               profile.topGapType === "dailyLog" ? "daily log" :
               profile.topGapType === "keyWorkingSessions" ? "key working sessions" :
               profile.topGapType === "ypFeedback" ? "YP feedback" : "LAC reviews"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Summary tile ──────────────────────────────────────────────────────────────

function SummaryTile({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${accent ?? ""}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChildVoicePresencePage() {
  const { data: res, isLoading, isError } = useChildVoicePresenceIntelligence();
  const [showAllChildren, setShowAllChildren] = useState(false);

  const payload = res?.data;
  const typeStats    = payload?.typeStats ?? [];
  const childProfiles = payload?.childProfiles ?? [];
  const summary       = payload?.summary;

  const maxTotal = typeStats.reduce((m, t) => Math.max(m, t.total), 1);
  const childrenWithData = childProfiles.filter((c) => c.hasData);
  const visibleChildren = showAllChildren ? childrenWithData : childrenWithData.slice(0, 5);

  return (
    <PageShell
      title="Child Voice Presence"
      description="Are children's words, views, and choices appearing in records? Analysis of voice presence across five recording types — grounded in UN CRC Article 12."
    >
      {isLoading && (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
          Analysing child voice across records…
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Could not load child voice presence data.
        </div>
      )}

      {!isLoading && !isError && payload && (
        <div className="space-y-6">
          {/* Summary tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile
              label="Overall voice rate"
              value={summary?.overallPresenceRate !== null && summary?.overallPresenceRate !== undefined ? `${summary.overallPresenceRate}%` : "—"}
              sub={`${summary?.totalWithVoice ?? 0} of ${summary?.totalRecords ?? 0} records`}
            />
            <SummaryTile
              label="Records analysed"
              value={summary?.totalRecords ?? 0}
              sub={`${summary?.childrenWithData ?? 0} children with data`}
            />
            <SummaryTile
              label="Strongest area"
              value={summary?.bestType?.label ?? "—"}
              sub={summary?.bestType?.rate !== null && summary?.bestType?.rate !== undefined ? `${summary.bestType.rate}% voice presence` : undefined}
            />
            <SummaryTile
              label="Biggest gap"
              value={summary?.worstType?.label ?? "—"}
              sub={summary?.worstType?.rate !== null && summary?.worstType?.rate !== undefined ? `${summary.worstType.rate}% voice presence` : undefined}
            />
          </div>

          {/* LAC participation strip */}
          {summary?.lacParticipationRate !== null && summary?.lacParticipationRate !== undefined && (
            <div className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm ${
              summary.lacParticipationRate >= 75
                ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                : "bg-amber-50 border-amber-100 text-amber-800"
            }`}>
              {summary.lacParticipationRate >= 75
                ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                : <AlertTriangle className="h-4 w-4 shrink-0" />}
              <span>
                <strong>{summary.lacParticipationRate}%</strong> of LAC reviews had child participation (attended, views submitted, or advocate present).
              </span>
            </div>
          )}

          {/* Article 12 principle callout */}
          <div className="flex items-start gap-3 rounded-lg bg-slate-50 border px-4 py-3 text-xs text-slate-600">
            <Quote className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
            <p>
              <strong>UN CRC Article 12</strong> — every child has the right to express their views freely in all matters affecting them.
              A record is not just a professional account: it is evidence that this child was heard.
            </p>
          </div>

          {/* Recording type breakdown */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <BarChart3 className="h-4 w-4" />
              Voice presence by recording type
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {typeStats.map((stat) => (
                <RecordTypeCard key={stat.type} stat={stat} maxTotal={maxTotal} />
              ))}
            </div>
          </div>

          {/* Per-child breakdown */}
          {childrenWithData.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Quote className="h-4 w-4" />
                Voice presence per child
              </h2>
              <div className="space-y-2">
                {visibleChildren.map((profile) => (
                  <ChildCard key={profile.childId} profile={profile} />
                ))}
                {childrenWithData.length > 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllChildren(!showAllChildren)}
                    className="w-full text-xs"
                  >
                    {showAllChildren
                      ? "Show fewer"
                      : `Show all ${childrenWithData.length} children`}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-400">
            Cara detects language patterns — the manager reflects on what this means for each child's experience.
          </p>
        </div>
      )}
    </PageShell>
  );
}
