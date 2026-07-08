"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD 360 INTELLIGENCE CARD
// Per-child holistic intelligence profile across all care domains.
// CHR 2015 Reg 5, Reg 9, Reg 14. SCCIF: Overall Experiences.
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity, AlertTriangle, Brain, CalendarDays, CheckCircle2,
  ChevronRight, GraduationCap, Heart, Loader2, MessageCircle,
  Pill, Shield, Target, TrendingDown, TrendingUp, Minus,
  User, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChild360 } from "@/hooks/use-child-360";
import type { DomainRAG, DomainScore, OverallWellbeingLevel } from "@/lib/engines/child-360-intelligence-engine";

const WELLBEING_STYLES: Record<OverallWellbeingLevel, { bg: string; text: string; border: string; label: string }> = {
  thriving: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", label: "THRIVING" },
  stable: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", label: "STABLE" },
  needs_attention: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", label: "ATTENTION" },
  concerning: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300", label: "CONCERNING" },
  critical: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", label: "CRITICAL" },
};

const RAG_DOT: Record<DomainRAG, string> = {
  green: "bg-green-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

const DOMAIN_ICONS: Record<string, typeof Activity> = {
  safety: Shield,
  emotional: Heart,
  education: GraduationCap,
  health: Pill,
  relationships: MessageCircle,
  outcomes: Target,
  engagement: User,
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const ACTION_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-amber-200 bg-amber-50 text-amber-800",
  medium: "border-blue-200 bg-blue-50 text-blue-800",
  low: "border-slate-200 bg-slate-50 text-slate-700",
};

function TrendIcon({ direction }: { direction: string }) {
  if (direction === "improving") return <TrendingUp className="h-3 w-3 text-green-600" />;
  if (direction === "declining") return <TrendingDown className="h-3 w-3 text-red-600" />;
  return <Minus className="h-3 w-3 text-slate-400" />;
}

export function Child360IntelligenceCard({ childId }: { childId: string }) {
  const { data, isLoading } = useChild360(childId);

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
  const cpie = data?.cpie;

  const wbStyle = WELLBEING_STYLES[d.overall_wellbeing] ?? WELLBEING_STYLES.stable;
  const firstName = d.child_name.split(" ")[0];

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-600" />
            <span className="text-slate-900">360° Intelligence Profile</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", wbStyle.bg, wbStyle.text, wbStyle.border)}>
              {wbStyle.label}
            </span>
          </CardTitle>
          <span className="text-[10px] text-muted-foreground">{d.age_years}yrs • {d.days_in_placement}d placement</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CPIE whole-child spine — who this child is, from the canonical Digital
            Twin (the same layer Ask CARA, weekly/monthly summaries and Reg 44
            read). The person first; the analytics below are supporting detail. */}
        {cpie && (
          <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-2.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-teal-600" />
              <p className="text-xs font-semibold text-teal-900">Who {firstName} is</p>
              <span className="ml-auto text-[10px] text-teal-700/70">CARA Digital Twin</span>
            </div>
            {cpie.who && cpie.who !== "—" && (
              <p className="text-xs text-slate-700"><span className="font-medium">Loves:</span> {cpie.who}.{cpie.strengths.length ? ` Strengths: ${cpie.strengths.join(", ")}.` : ""}</p>
            )}
            <p className="text-xs text-slate-700">{cpie.livedExperienceRead}</p>
            {cpie.childVoice && (
              <p className="text-xs italic text-slate-600">“{cpie.childVoice}”</p>
            )}
            {cpie.curiosityPrompt && (
              <p className="text-[11px] text-teal-800/90"><span className="font-medium">Worth asking:</span> {cpie.curiosityPrompt}</p>
            )}
          </div>
        )}
        {/* Domain Health Matrix */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Domain Health</p>
          <div className="grid grid-cols-4 gap-1.5">
            {d.domain_scores.map((ds) => {
              const Icon = DOMAIN_ICONS[ds.domain] ?? Activity;
              return (
                <div key={ds.domain} className="rounded border p-1.5 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <span className={cn("h-2 w-2 rounded-full", RAG_DOT[ds.rag])} />
                    <Icon className="h-3 w-3 text-slate-500" />
                  </div>
                  <p className="text-[10px] font-medium text-slate-700 truncate">{ds.domain_label.split(" ")[0]}</p>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-[10px] tabular-nums text-muted-foreground">{ds.score}%</span>
                    <TrendIcon direction={ds.trend} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", d.safety_profile.open_incidents_count > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", d.safety_profile.open_incidents_count > 0 ? "text-red-600" : "text-green-600")}>
              {d.safety_profile.open_incidents_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Open Incidents</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-slate-600">
              {d.emotional_wellbeing.average_mood_7d ?? "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">Mood (7d)</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", d.health_profile.missed_doses_7d > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", d.health_profile.missed_doses_7d > 0 ? "text-amber-600" : "text-green-600")}>
              {d.health_profile.medication_compliance_7d ?? "—"}%
            </p>
            <p className="text-[10px] text-muted-foreground">Med Comp</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-slate-600">
              {d.outcomes_profile.targets_on_track}/{d.outcomes_profile.total_active_targets}
            </p>
            <p className="text-[10px] text-muted-foreground">On Track</p>
          </div>
        </div>

        {/* Strengths */}
        {d.strengths.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Strengths ({d.strengths.length})
            </p>
            <div className="space-y-1">
              {d.strengths.slice(0, 4).map((s, i) => (
                <div key={i} className="rounded border border-green-200 bg-green-50 p-2 text-xs text-green-800 leading-relaxed">
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concerns */}
        {d.concerns.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Concerns ({d.concerns.length})
            </p>
            <div className="space-y-1">
              {d.concerns.slice(0, 4).map((c, i) => (
                <div key={i} className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800 leading-relaxed">
                  {c}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Priority Actions */}
        {d.priority_actions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              Priority Actions ({d.priority_actions.length})
            </p>
            {d.priority_actions.slice(0, 4).map((action) => (
              <div key={action.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", ACTION_STYLES[action.severity] ?? ACTION_STYLES.medium)}>
                <div className="flex items-start justify-between gap-2">
                  <span>{action.action}</span>
                  {action.regulatory_ref && (
                    <span className="text-[10px] font-mono shrink-0 opacity-60">{action.regulatory_ref}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Key Dates */}
        {d.key_dates.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Key Dates
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {d.key_dates.slice(0, 4).map((kd, i) => (
                <div key={i} className={cn("rounded border p-2 text-xs", kd.overdue ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 bg-slate-50 text-slate-700")}>
                  <p className="font-semibold tabular-nums">{kd.date}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{kd.label}</p>
                  {kd.overdue && <span className="text-[10px] font-bold text-red-600">OVERDUE</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cara Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Child Intelligence
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
