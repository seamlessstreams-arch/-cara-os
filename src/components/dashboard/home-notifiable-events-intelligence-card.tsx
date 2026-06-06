"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME NOTIFIABLE EVENTS INTELLIGENCE CARD
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

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<NotifiableEventsRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:        { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO DATA" },
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

  const d = data?.data;
  if (!d) return null;

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
            <Bell className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-amber-500")} />
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
                  d.events_profile.total_events_90d <= 2 ? "text-green-600" :
                  d.events_profile.total_events_90d <= 5 ? "text-amber-600" : "text-red-600"
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
                  d.events_profile.notification_compliance_rate === 100 ? "text-green-600" :
                  d.events_profile.notification_compliance_rate >= 80 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.events_profile.notification_compliance_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Notified &lt;24h</p>
            </div>

            {/* Follow-up */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <CheckCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.events_profile.follow_up_rate === 100 ? "text-green-600" :
                  d.events_profile.follow_up_rate >= 80 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.events_profile.follow_up_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Follow-up</p>
            </div>

            {/* Lessons */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.events_profile.lesson_learned_rate === 100 ? "text-green-600" :
                  d.events_profile.lesson_learned_rate >= 80 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.events_profile.lesson_learned_rate}%
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
                <p>Multi-agency: <span className={cn("font-medium", d.events_profile.multi_agency_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.events_profile.multi_agency_rate}%</span></p>
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

        {/* ARIA Events Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Events Intelligence
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
