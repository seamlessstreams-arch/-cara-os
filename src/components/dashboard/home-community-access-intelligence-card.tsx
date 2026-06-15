"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME COMMUNITY ACCESS INTELLIGENCE CARD
// Home-level: transport safety, RA quality, independent travel, trip planning,
// community engagement aggregated across all children.
// CHR 2015 Reg 9 (enjoyment & achievement), Reg 12 (independence).
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  AlertTriangle, Brain, Loader2, AlertCircle,
  Sparkles, MapPin, Shield, Bus,
  Users, Route, ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeCommunityAccessIntelligence } from "@/hooks/use-home-community-access-intelligence";
import type { CommunityAccessRating } from "@/lib/engines/home-community-access-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<CommunityAccessRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:        { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-600",  border: "border-slate-300",  label: "NO DATA" },
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-red-200 bg-red-50 text-red-800",
  soon: "border-amber-200 bg-amber-50 text-amber-800",
  planned: "border-blue-200 bg-blue-50 text-blue-800",
};

function scoreColor(score: number): string {
  if (score >= 65) return "text-green-600";
  if (score >= 45) return "text-amber-600";
  return "text-red-600";
}

// ── Component ───────────────────────────────────────────────────────────────

export function HomeCommunityAccessIntelligenceCard() {
  const { data, isLoading } = useHomeCommunityAccessIntelligence();

  if (isLoading) {
    return (
      <Card className="col-span-full overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  let d = data?.data;
  if (!d) return null;
  // Calm reframe: an empty-with-children engine result (inadequate + score<=15) is
  // 'not yet recorded', not a failing home — render it as honest, neutral insufficient_data.
  const __emptyState = d.community_access_rating === "inadequate" && (d.community_access_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      community_access_rating: "insufficient_data",
      concerns: [],
      recommendations: [],
      insights: [],
      headline:
        String(d.headline || "")
          .split(/ despite | — | -- /)[0]
          .replace(/[\u2014,\-]\s*$/, "")
          .trim() + " — not yet recorded; capturing entries will enable this analysis.",
    };
  }

  const ratingStyle = RATING_STYLES[d.community_access_rating] ?? RATING_STYLES.insufficient_data;

  return (
    <Card className="col-span-full overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-500" />
            <span className="text-slate-900">Community Access</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-600">{d.community_access_score}%</span>
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.community_access_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div className="text-center rounded-lg bg-emerald-50 p-2">
            <div className="flex items-center justify-center gap-1">
              <Bus className="h-3.5 w-3.5 text-emerald-500" />
              <p className={cn("text-lg font-bold tabular-nums", scoreColor(d.transport_safety.licence_checked_rate))}>
                {d.transport_safety.total_logs}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground">Transport Logs</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <div className="flex items-center justify-center gap-1">
              <Shield className="h-3.5 w-3.5 text-blue-500" />
              <p className={cn("text-lg font-bold tabular-nums", scoreColor(d.transport_ra.signed_off_rate))}>
                {d.transport_ra.active_ras}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground">Active RAs</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <div className="flex items-center justify-center gap-1">
              <Route className="h-3.5 w-3.5 text-purple-500" />
              <p className={cn("text-lg font-bold tabular-nums", scoreColor(d.independent_travel.solo_or_independent_rate))}>
                {d.independent_travel.total_records}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground">Travel Records</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <div className="flex items-center justify-center gap-1">
              <ClipboardCheck className="h-3.5 w-3.5 text-amber-500" />
              <p className={cn("text-lg font-bold tabular-nums", scoreColor(d.trip_planning.manager_approval_rate))}>
                {d.trip_planning.total_trips}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground">Trip Plans</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <div className="flex items-center justify-center gap-1">
              <Users className="h-3.5 w-3.5 text-emerald-500" />
              <p className={cn("text-lg font-bold tabular-nums", scoreColor(d.community_engagement.builds_connections_rate))}>
                {d.community_engagement.total_engagements_90d}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground">Engagements (90d)</p>
          </div>
        </div>

        {/* Transport Safety Detail */}
        {d.transport_safety.total_logs > 0 && (
          <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-xs">
            <p className="font-medium text-emerald-700 flex items-center gap-1 mb-1.5">
              <Bus className="h-3 w-3" />
              Transport Safety
            </p>
            <div className="flex flex-wrap gap-2 text-[10px]">
              <span className="bg-white/60 rounded px-1.5 py-0.5 border border-emerald-200">
                Licence: <span className="font-bold">{d.transport_safety.licence_checked_rate}%</span>
              </span>
              <span className="bg-white/60 rounded px-1.5 py-0.5 border border-emerald-200">
                Vehicle: <span className="font-bold">{d.transport_safety.vehicle_checked_rate}%</span>
              </span>
              <span className="bg-white/60 rounded px-1.5 py-0.5 border border-emerald-200">
                Incidents: <span className="font-bold">{d.transport_safety.incident_rate}%</span>
              </span>
              <span className="bg-white/60 rounded px-1.5 py-0.5 border border-emerald-200">
                Good Behaviour: <span className="font-bold">{d.transport_safety.excellent_behaviour_rate}%</span>
              </span>
            </div>
          </div>
        )}

        {/* Independent Travel Detail */}
        {d.independent_travel.total_records > 0 && (
          <div className="rounded border border-purple-200 bg-purple-50 p-2 text-xs">
            <p className="font-medium text-purple-700 flex items-center gap-1 mb-1.5">
              <Route className="h-3 w-3" />
              Independent Travel
            </p>
            <div className="flex flex-wrap gap-2 text-[10px]">
              <span className="bg-white/60 rounded px-1.5 py-0.5 border border-purple-200">
                Coverage: <span className="font-bold">{d.independent_travel.child_coverage}%</span>
              </span>
              <span className="bg-white/60 rounded px-1.5 py-0.5 border border-purple-200">
                Solo/Independent: <span className="font-bold">{d.independent_travel.solo_or_independent_rate}%</span>
              </span>
              <span className="bg-white/60 rounded px-1.5 py-0.5 border border-purple-200">
                Avg Routes: <span className="font-bold">{d.independent_travel.avg_routes_mastered}</span>
              </span>
              <span className="bg-white/60 rounded px-1.5 py-0.5 border border-purple-200">
                Confident: <span className="font-bold">{d.independent_travel.confident_or_highly_rate}%</span>
              </span>
            </div>
          </div>
        )}

        {/* Strengths */}
        {d.strengths.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Strengths ({d.strengths.length})
            </p>
            {d.strengths.slice(0, 3).map((s, i) => (
              <div key={i} className="rounded border border-green-200 bg-green-50 p-2.5 text-xs text-green-800 leading-relaxed">
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Concerns */}
        {d.concerns.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Concerns ({d.concerns.length})
            </p>
            {d.concerns.slice(0, 3).map((c, i) => (
              <div key={i} className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 leading-relaxed">
                {c}
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {d.recommendations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              Recommendations ({d.recommendations.length})
            </p>
            {d.recommendations.slice(0, 3).map((rec) => (
              <div key={rec.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", REC_STYLES[rec.urgency] ?? REC_STYLES.planned)}>
                <div className="flex items-start justify-between gap-2">
                  <span>{rec.recommendation}</span>
                  {rec.regulatory_ref && (
                    <span className="text-[10px] font-mono shrink-0 opacity-60">{rec.regulatory_ref}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cara Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-emerald-700">
              <Brain className="h-3 w-3" />
              Cara Community Access Intelligence
            </p>
            {d.insights.slice(0, 3).map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
