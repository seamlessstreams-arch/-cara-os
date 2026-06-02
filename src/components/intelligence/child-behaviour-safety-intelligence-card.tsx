"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD BEHAVIOUR & SAFETY INTELLIGENCE CARD
// Per-child behaviour analysis: behaviour patterns, incidents, restraints,
// missing episodes, sanctions/rewards balance, sleep quality, and BSP compliance.
// CHR 2015 Reg 12, 19, 20, 35. SCCIF: Experiences & progress + Safety.
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, Loader2, Shield, Siren, Moon,
  AlertCircle, Sparkles, TrendingUp, TrendingDown, Minus,
  ThumbsUp, ThumbsDown, FileText, Clock, UserX, Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChildBehaviourSafetyIntelligence } from "@/hooks/use-child-behaviour-safety-intelligence";
import type { SafetyStatus } from "@/lib/engines/child-behaviour-safety-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<SafetyStatus, { bg: string; text: string; border: string; label: string }> = {
  stable:     { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "STABLE" },
  improving:  { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300", label: "IMPROVING" },
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

const TREND_ICON: Record<string, typeof TrendingUp> = {
  improving: TrendingUp,
  increasing: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
  decreasing: TrendingDown,
  insufficient_data: Minus,
};

// ── Component ───────────────────────────────────────────────────────────────

export function ChildBehaviourSafetyIntelligenceCard({ childId }: { childId: string }) {
  const { data, isLoading } = useChildBehaviourSafetyIntelligence(childId);

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

  const statusStyle = STATUS_STYLES[d.safety_status] ?? STATUS_STYLES.monitoring;
  const bp = d.behaviour_profile;
  const ip = d.incident_profile;
  const rp = d.restraint_profile;
  const mp = d.missing_profile;
  const srb = d.sanction_reward_balance;
  const sp = d.sleep_profile;
  const bsp = d.bsp_compliance;
  const BehTrendIcon = TREND_ICON[bp.trend] ?? Minus;
  const IncTrendIcon = TREND_ICON[ip.trend] ?? Minus;

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-500" />
            <span className="text-slate-900">Behaviour & Safety</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", statusStyle.bg, statusStyle.text, statusStyle.border)}>
              {statusStyle.label}
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-600">{d.safety_score}%</span>
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Behaviour KPIs */}
        {bp.total_entries_30d > 0 && (
          <div className="grid grid-cols-4 gap-2">
            <div className={cn("text-center rounded-lg p-2", bp.positive_ratio >= 70 ? "bg-green-50" : bp.positive_ratio >= 50 ? "bg-blue-50" : "bg-red-50")}>
              <p className={cn("text-lg font-bold tabular-nums", bp.positive_ratio >= 70 ? "text-green-600" : bp.positive_ratio >= 50 ? "text-blue-600" : "text-red-600")}>{bp.positive_ratio}%</p>
              <p className="text-[10px] text-muted-foreground">Positive</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-0.5">
                <BehTrendIcon className={cn("h-3.5 w-3.5", bp.trend === "improving" ? "text-green-500" : bp.trend === "declining" ? "text-red-500" : "text-slate-400")} />
                <p className={cn("text-sm font-bold capitalize", bp.trend === "improving" ? "text-green-600" : bp.trend === "declining" ? "text-red-600" : "text-slate-600")}>
                  {bp.trend === "insufficient_data" ? "N/A" : bp.trend}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Trend</p>
            </div>
            <div className={cn("text-center rounded-lg p-2", bp.high_severe_count_30d > 0 ? "bg-red-50" : "bg-green-50")}>
              <p className={cn("text-lg font-bold tabular-nums", bp.high_severe_count_30d > 0 ? "text-red-600" : "text-green-600")}>{bp.high_severe_count_30d}</p>
              <p className="text-[10px] text-muted-foreground">High/Severe</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <p className="text-lg font-bold tabular-nums text-slate-600">{bp.total_entries_30d}</p>
              <p className="text-[10px] text-muted-foreground">Total (30d)</p>
            </div>
          </div>
        )}

        {/* Incident & Restraint Row */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <Siren className={cn("h-3.5 w-3.5 shrink-0", ip.total_30d === 0 ? "text-green-500" : ip.total_30d >= 3 ? "text-red-500" : "text-amber-500")} />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">Incidents</p>
              <p className="text-[10px] text-muted-foreground">
                {ip.total_30d} in 30d · {ip.total_90d} in 90d
                {ip.open_count > 0 && <span className="text-red-600"> · {ip.open_count} unreviewed</span>}
              </p>
              {ip.total_90d > 0 && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  De-esc: {ip.de_escalation_rate}%
                  <IncTrendIcon className={cn("h-2.5 w-2.5 ml-1", ip.trend === "decreasing" ? "text-green-500" : ip.trend === "increasing" ? "text-red-500" : "text-slate-400")} />
                </p>
              )}
            </div>
          </div>
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <Shield className={cn("h-3.5 w-3.5 shrink-0", rp.total_30d === 0 ? "text-green-500" : rp.total_30d >= 2 ? "text-red-500" : "text-amber-500")} />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">Restraints</p>
              <p className="text-[10px] text-muted-foreground">
                {rp.total_30d} in 30d · {rp.total_90d} in 90d
                {rp.injury_count > 0 && <span className="text-red-600"> · {rp.injury_count} injuries</span>}
              </p>
              {rp.total_90d > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  Debrief: {rp.debrief_rate}%
                  {rp.unreviewed_count > 0 && <span className="text-red-600"> · {rp.unreviewed_count} unreviewed</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Missing & Sanctions/Rewards Row */}
        <div className="grid grid-cols-2 gap-1.5">
          {(mp.total_90d > 0 || mp.total_30d > 0) && (
            <div className="rounded border p-2 flex items-center gap-2 text-xs">
              <UserX className={cn("h-3.5 w-3.5 shrink-0", mp.total_30d === 0 ? "text-green-500" : mp.high_risk_count > 0 ? "text-red-500" : "text-amber-500")} />
              <div className="min-w-0">
                <p className="font-medium text-slate-700">Missing</p>
                <p className="text-[10px] text-muted-foreground">
                  {mp.total_30d} in 30d · {mp.total_90d} in 90d
                  {mp.repeat_missing && <span className="text-red-600"> · Repeat pattern</span>}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  RI Rate: {mp.return_interview_rate}%
                  {mp.high_risk_count > 0 && <span className="text-red-600"> · {mp.high_risk_count} high-risk</span>}
                </p>
              </div>
            </div>
          )}
          {(srb.rewards_30d > 0 || srb.sanctions_30d > 0) && (
            <div className="rounded border p-2 flex items-center gap-2 text-xs">
              <Award className={cn("h-3.5 w-3.5 shrink-0", srb.balance_rating === "positive" ? "text-green-500" : srb.balance_rating === "sanctions_heavy" ? "text-red-500" : "text-blue-500")} />
              <div className="min-w-0">
                <p className="font-medium text-slate-700">Rewards / Sanctions</p>
                <p className="text-[10px] text-muted-foreground">
                  <span className="text-green-600">{srb.rewards_30d} rewards</span>
                  {" · "}
                  <span className="text-amber-600">{srb.sanctions_30d} sanctions</span>
                  {" · "}
                  <span className={cn(srb.balance_rating === "positive" ? "text-green-600" : srb.balance_rating === "sanctions_heavy" ? "text-red-600" : "text-blue-600")}>
                    {srb.ratio}:1 ratio
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sleep & BSP Row */}
        <div className="grid grid-cols-2 gap-1.5">
          {sp.entries_14d > 0 && (
            <div className="rounded border p-2 flex items-center gap-2 text-xs">
              <Moon className={cn("h-3.5 w-3.5 shrink-0", sp.avg_quality >= 4 ? "text-blue-500" : sp.avg_quality < 2.5 ? "text-red-500" : "text-amber-500")} />
              <div className="min-w-0">
                <p className="font-medium text-slate-700">Sleep (14d)</p>
                <p className="text-[10px] text-muted-foreground">
                  Quality: {sp.avg_quality}/5 · Disturbances: {sp.avg_disturbances}
                  {sp.trend !== "insufficient_data" && <span className="capitalize"> · {sp.trend}</span>}
                </p>
              </div>
            </div>
          )}
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <FileText className={cn("h-3.5 w-3.5 shrink-0", bsp.has_plan && bsp.plan_current ? "text-green-500" : bsp.has_plan ? "text-amber-500" : "text-slate-400")} />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">BSP</p>
              <p className="text-[10px] text-muted-foreground">
                {bsp.has_plan ? (
                  <>
                    <span className={bsp.plan_current ? "text-green-600" : "text-amber-600"}>{bsp.plan_current ? "Current" : "Review due"}</span>
                    {" · "}{bsp.strategies_count} strategies · {bsp.triggers_documented} triggers
                  </>
                ) : (
                  <span className="text-slate-500">No plan</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Top Triggers & Effective Strategies */}
        {((bp.top_triggers?.length ?? 0) > 0 || (bp.effective_strategies?.length ?? 0) > 0) && (
          <div className="grid grid-cols-2 gap-1.5">
            {(bp.top_triggers?.length ?? 0) > 0 && (
              <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs">
                <p className="font-medium text-amber-700 flex items-center gap-1 mb-1">
                  <AlertTriangle className="h-3 w-3" />
                  Top Triggers
                </p>
                {(bp.top_triggers ?? []).map((t, i) => (
                  <p key={i} className="text-[10px] text-amber-800">• {t}</p>
                ))}
              </div>
            )}
            {(bp.effective_strategies?.length ?? 0) > 0 && (
              <div className="rounded border border-green-200 bg-green-50 p-2 text-xs">
                <p className="font-medium text-green-700 flex items-center gap-1 mb-1">
                  <ThumbsUp className="h-3 w-3" />
                  Effective Strategies
                </p>
                {(bp.effective_strategies ?? []).map((s, i) => (
                  <p key={i} className="text-[10px] text-green-800">• {s}</p>
                ))}
              </div>
            )}
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

        {/* ARIA Safety Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Safety Intelligence
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
