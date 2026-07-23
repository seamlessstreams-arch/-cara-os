"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME NOTIFIABLE EVENTS INTELLIGENCE CARD
// Home-level: notification compliance, follow-up quality, lessons learned,
// multi-agency reporting, and event pattern analysis.
// CHR 2015 Reg 40. SCCIF: "Safe", "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Bell,
  Clock, CheckCheck, FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeNotifiableEventsIntelligence } from "@/hooks/use-home-notifiable-events-intelligence";
import type { NotifiableEventsRating } from "@/lib/engines/home-notifiable-events-intelligence-engine";

/** Rates are null when nothing was recorded — show the gap, never a fabricated number. */
function pct(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value}%` : "—";
}

function meets(value: number | null | undefined, threshold: number): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= threshold;
}

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<NotifiableEventsRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:        { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO DATA" },
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  soon: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  planned: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

// ── Component ───────────────────────────────────────────────────────────────

export function HomeNotifiableEventsIntelligenceCard() {
  const { data, isLoading } = useHomeNotifiableEventsIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200">
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
  const __emptyState = d.events_rating === "inadequate" && (d.events_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      events_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.events_rating] ?? RATING_STYLES.insufficient_data;
  const hasPending = d.events_profile.pending_count > 0;
  const hasRepeat = d.events_profile.repeat_children.length > 0;
  const isHighVolume = d.events_profile.total_events_90d > 5;
  const isAlert = hasPending || isHighVolume || d.events_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className={cn("h-4 w-4", isAlert ? "text-[--cs-risk]" : "text-amber-500")} />
            <span className="text-slate-900">Notifiable Events</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.events_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.events_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.events_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.events_profile.total_events_90d > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Events */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <FileWarning className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.events_profile.total_events_90d <= 2 ? "text-[--cs-success]" :
                  d.events_profile.total_events_90d <= 5 ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {d.events_profile.total_events_90d}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Events (90d)</p>
            </div>

            {/* Notification */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.events_profile.notification_compliance_rate === 100 ? "text-[--cs-success]" :
                  meets(d.events_profile.notification_compliance_rate, 80) ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {pct(d.events_profile.notification_compliance_rate)}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Notified &lt;24h</p>
            </div>

            {/* Follow-up */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <CheckCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.events_profile.follow_up_rate === 100 ? "text-[--cs-success]" :
                  meets(d.events_profile.follow_up_rate, 80) ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {pct(d.events_profile.follow_up_rate)}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Follow-up</p>
            </div>

            {/* Lessons */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.events_profile.lesson_learned_rate === 100 ? "text-[--cs-success]" :
                  meets(d.events_profile.lesson_learned_rate, 80) ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {pct(d.events_profile.lesson_learned_rate)}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Lessons</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.events_profile.total_events_90d > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Compliance</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Multi-agency: <span className={cn("font-medium", d.events_profile.multi_agency_rate === 100 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{pct(d.events_profile.multi_agency_rate)}</span></p>
                {d.events_profile.pending_count > 0 && <p>Pending: <span className="font-medium text-red-600">{d.events_profile.pending_count}</span></p>}
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Patterns</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Children involved: <span className="font-medium text-slate-600">{d.events_profile.children_involved.length}</span></p>
                {hasRepeat && <p>Repeat children: <span className="font-medium text-amber-600">{d.events_profile.repeat_children.length}</span></p>}
              </div>
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
              <div key={i} className="rounded border border-[--cs-success-soft] bg-[--cs-success-bg] p-2.5 text-xs text-[--cs-success] leading-relaxed">
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
              <div key={i} className="rounded border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-2.5 text-xs text-[--cs-risk] leading-relaxed">
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

        {/* Cara Events Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Events Intelligence
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
