"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD HEALTH & WELLBEING INTELLIGENCE CARD
// Per-child health analysis: medication compliance, health assessment status,
// dental/optician/immunisation compliance, CAMHS engagement, wellbeing
// trajectory, and appointment attendance.
// CHR 2015 Reg 23, 7. SCCIF: Health and well-being.
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, Loader2, Heart, Pill, Stethoscope,
  AlertCircle, Sparkles, TrendingUp, TrendingDown, Minus,
  Eye, Smile, ShieldCheck, CalendarCheck, Syringe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChildHealthIntelligence } from "@/hooks/use-child-health-intelligence";
import type { HealthStatus } from "@/lib/engines/child-health-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<HealthStatus, { bg: string; text: string; border: string; label: string }> = {
  excellent:  { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "EXCELLENT" },
  good:       { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  monitoring: { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "MONITORING" },
  concern:    { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300", label: "CONCERN" },
  critical:   { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "CRITICAL" },
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

const MOOD_TREND_ICON: Record<string, typeof TrendingUp> = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
  insufficient_data: Minus,
};

// ── Component ───────────────────────────────────────────────────────────────

export function ChildHealthIntelligenceCard({ childId }: { childId: string }) {
  const { data, isLoading } = useChildHealthIntelligence(childId);

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

  const statusStyle = STATUS_STYLES[d.health_status] ?? STATUS_STYLES.monitoring;
  const med = d.medication_compliance;
  const hc = d.health_compliance;
  const camhs = d.camhs_status;
  const wb = d.wellbeing_trajectory;
  const appt = d.appointment_analysis;
  const MoodIcon = MOOD_TREND_ICON[wb.mood_trend] ?? Minus;

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-500" />
            <span className="text-slate-900">Health & Wellbeing</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", statusStyle.bg, statusStyle.text, statusStyle.border)}>
              {statusStyle.label}
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-600">{d.health_score}%</span>
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Medication Compliance KPIs */}
        {med.active_medications > 0 && (
          <div className="grid grid-cols-4 gap-2">
            <div className={cn("text-center rounded-lg p-2", med.given_rate >= 95 ? "bg-green-50" : med.given_rate >= 80 ? "bg-blue-50" : med.given_rate >= 70 ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-lg font-bold tabular-nums", med.given_rate >= 95 ? "text-green-600" : med.given_rate >= 80 ? "text-blue-600" : med.given_rate >= 70 ? "text-amber-600" : "text-red-600")}>{med.given_rate}%</p>
              <p className="text-[10px] text-muted-foreground">Med Compliance</p>
            </div>
            <div className={cn("text-center rounded-lg p-2", med.refused_count_30d === 0 ? "bg-green-50" : "bg-red-50")}>
              <p className={cn("text-lg font-bold tabular-nums", med.refused_count_30d === 0 ? "text-green-600" : "text-red-600")}>{med.refused_count_30d}</p>
              <p className="text-[10px] text-muted-foreground">Refused (30d)</p>
            </div>
            <div className={cn("text-center rounded-lg p-2", med.missed_count_30d === 0 ? "bg-green-50" : "bg-amber-50")}>
              <p className={cn("text-lg font-bold tabular-nums", med.missed_count_30d === 0 ? "text-green-600" : "text-amber-600")}>{med.missed_count_30d}</p>
              <p className="text-[10px] text-muted-foreground">Missed (30d)</p>
            </div>
            <div className={cn("text-center rounded-lg p-2", med.witnessed_rate === 100 ? "bg-green-50" : "bg-slate-50")}>
              <p className={cn("text-lg font-bold tabular-nums", med.witnessed_rate === 100 ? "text-green-600" : "text-slate-600")}>{med.witnessed_rate}%</p>
              <p className="text-[10px] text-muted-foreground">Witnessed</p>
            </div>
          </div>
        )}

        {/* Health Compliance Row */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className="rounded border p-2 text-center text-xs">
            <Stethoscope className={cn("h-3.5 w-3.5 mx-auto mb-0.5", hc.health_assessment_current ? "text-green-500" : "text-red-500")} />
            <p className="font-medium text-slate-700">Health Assess.</p>
            <p className={cn("text-[10px]", hc.health_assessment_current ? "text-green-600" : "text-red-600 font-medium")}>
              {hc.health_assessment_current ? "Current" : "Overdue"}
            </p>
          </div>
          <div className="rounded border p-2 text-center text-xs">
            <Smile className={cn("h-3.5 w-3.5 mx-auto mb-0.5", hc.dental_current ? "text-green-500" : "text-red-500")} />
            <p className="font-medium text-slate-700">Dental</p>
            <p className={cn("text-[10px]", hc.dental_current ? "text-green-600" : "text-red-600 font-medium")}>
              {hc.dental_current ? "Current" : "Overdue"}
            </p>
          </div>
          <div className="rounded border p-2 text-center text-xs">
            <Eye className={cn("h-3.5 w-3.5 mx-auto mb-0.5", hc.optician_current ? "text-green-500" : "text-amber-500")} />
            <p className="font-medium text-slate-700">Optician</p>
            <p className={cn("text-[10px]", hc.optician_current ? "text-green-600" : "text-amber-600 font-medium")}>
              {hc.optician_current ? "Current" : "Due"}
            </p>
          </div>
          <div className="rounded border p-2 text-center text-xs">
            <Syringe className={cn("h-3.5 w-3.5 mx-auto mb-0.5", hc.immunisations_up_to_date ? "text-green-500" : hc.immunisations_overdue > 0 ? "text-red-500" : "text-slate-400")} />
            <p className="font-medium text-slate-700">Immunisations</p>
            <p className={cn("text-[10px]", hc.immunisations_up_to_date ? "text-green-600" : hc.immunisations_overdue > 0 ? "text-red-600 font-medium" : "text-slate-500")}>
              {hc.immunisations_up_to_date ? "Up to date" : hc.immunisations_overdue > 0 ? `${hc.immunisations_overdue} overdue` : "No data"}
            </p>
          </div>
        </div>

        {/* CAMHS & Wellbeing Row */}
        <div className="grid grid-cols-2 gap-1.5">
          {/* CAMHS */}
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <Brain className={cn("h-3.5 w-3.5 shrink-0", camhs.engaged ? "text-purple-500" : camhs.waiting ? "text-amber-500" : "text-slate-400")} />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">CAMHS</p>
              <p className="text-[10px] text-muted-foreground">
                {camhs.engaged ? (
                  <>
                    <span className="text-purple-600">Active</span> · {camhs.attendance_rate}% attendance
                    {camhs.engagement_level && <span> · {camhs.engagement_level}</span>}
                  </>
                ) : camhs.waiting ? (
                  <span className="text-amber-600 font-medium">Waiting list</span>
                ) : camhs.status === "discharged" ? (
                  <span className="text-slate-500">Discharged</span>
                ) : (
                  <span className="text-slate-500">Not referred</span>
                )}
              </p>
              {camhs.next_appointment && (
                <p className="text-[10px] text-muted-foreground">
                  Next: {camhs.next_appointment}
                </p>
              )}
            </div>
          </div>

          {/* Wellbeing Trajectory */}
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <MoodIcon className={cn("h-3.5 w-3.5 shrink-0", wb.mood_trend === "improving" ? "text-green-500" : wb.mood_trend === "declining" ? "text-red-500" : "text-slate-400")} />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">Wellbeing</p>
              {wb.data_points > 0 ? (
                <p className="text-[10px] text-muted-foreground">
                  Mood {wb.avg_mood}/5 · Anxiety {wb.avg_anxiety}/5 · Sleep {wb.avg_sleep}/5
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">No check-in data</p>
              )}
              {wb.mood_trend !== "insufficient_data" && (
                <p className={cn("text-[10px] capitalize", wb.mood_trend === "improving" ? "text-green-600" : wb.mood_trend === "declining" ? "text-red-600" : "text-slate-500")}>
                  Trend: {wb.mood_trend}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Appointments & Recent Concerns Row */}
        <div className="grid grid-cols-2 gap-1.5">
          {appt.total_90d > 0 && (
            <div className="rounded border p-2 flex items-center gap-2 text-xs">
              <CalendarCheck className={cn("h-3.5 w-3.5 shrink-0", appt.dna_count === 0 ? "text-green-500" : "text-amber-500")} />
              <div className="min-w-0">
                <p className="font-medium text-slate-700">Appointments (90d)</p>
                <p className="text-[10px] text-muted-foreground">
                  {appt.total_90d} total · {appt.attended_rate}% attended
                  {appt.dna_count > 0 && <span className="text-red-600"> · {appt.dna_count} DNA</span>}
                  {appt.rescheduled_count > 0 && <span> · {appt.rescheduled_count} rescheduled</span>}
                </p>
              </div>
            </div>
          )}
          {(wb.recent_concerns?.length ?? 0) > 0 && (
            <div className="rounded border p-2 flex items-center gap-2 text-xs">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-slate-700">Recent Concerns</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {(wb.recent_concerns ?? []).join(", ")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Per-Medication Summary */}
        {med.medications_summary.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Pill className="h-3 w-3 text-indigo-500" />
              Medications ({med.active_medications})
            </p>
            {(med.medications_summary ?? []).map((m, i) => (
              <div key={i} className="rounded border p-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-slate-700 truncate">{m.name}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{m.type}</span>
                </div>
                <span className={cn("text-xs font-bold tabular-nums", m.compliance_rate >= 95 ? "text-green-600" : m.compliance_rate >= 80 ? "text-blue-600" : m.compliance_rate >= 70 ? "text-amber-600" : "text-red-600")}>
                  {m.compliance_rate}%
                </span>
              </div>
            ))}
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

        {/* ARIA Health Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Health Intelligence
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
