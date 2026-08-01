"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — FAMILY & RELATIONSHIPS INTELLIGENCE CARD
// Per-child family contact analysis, network mapping, and relationship health.
// CHR 2015 Reg 7 (contact), Reg 8 (communication), Reg 15 (missing).
// SCCIF: How well children are helped and protected.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, CheckCircle2, ChevronRight, Heart,
  Loader2, Shield, Users, AlertCircle, Sparkles, HeartHandshake,
  MapPin, Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FamilyRelationshipsResult, RelationshipHealth } from "@/lib/engines/family-relationships-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const HEALTH_STYLES: Record<RelationshipHealth, { bg: string; text: string; border: string; label: string }> = {
  thriving:    { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "THRIVING" },
  stable:      { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "STABLE" },
  strained:    { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "STRAINED" },
  concerning:  { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300", label: "CONCERNING" },
  critical:    { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "CRITICAL" },
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

export function FamilyRelationshipsCard({ childId }: { childId: string }) {
  const { data, isLoading } = useQuery<{ data: FamilyRelationshipsResult }>({
    queryKey: ["family-relationships-intelligence", childId],
    queryFn: () =>
      fetch(`/api/v1/family-relationships-intelligence?childId=${encodeURIComponent(childId)}`).then((r) => r.json()),
    enabled: !!childId,
    refetchInterval: 60_000,
  });

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

  const healthStyle = HEALTH_STYLES[d.relationship_health] ?? HEALTH_STYLES.stable;
  const ca = d.contact_analysis;
  const fn = d.family_network;
  const pe = d.professional_engagement;

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-rose-500" />
            <span className="text-slate-900">Family & Relationships</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", healthStyle.bg, healthStyle.text, healthStyle.border)}>
              {healthStyle.label}
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-600">{d.relationship_score}%</span>
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Contact KPIs */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-slate-600">{ca.total_sessions_90d}</p>
            <p className="text-[10px] text-muted-foreground">Sessions (90d)</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-slate-600">{ca.unique_family_contacts}</p>
            <p className="text-[10px] text-muted-foreground">Family Members</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", ca.safe_pct === 100 ? "bg-green-50" : (ca.safe_pct ?? 0) >= 80 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", ca.safe_pct === 100 ? "text-green-600" : (ca.safe_pct ?? 0) >= 80 ? "text-amber-600" : "text-red-600")}>{ca.safe_pct}%</p>
            <p className="text-[10px] text-muted-foreground">Safe Sessions</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", ca.concerns_raised_90d > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", ca.concerns_raised_90d > 0 ? "text-amber-600" : "text-green-600")}>{ca.concerns_raised_90d}</p>
            <p className="text-[10px] text-muted-foreground">Concerns (90d)</p>
          </div>
        </div>

        {/* Family Network Summary */}
        {fn.genogram_available && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 flex items-center gap-2 text-xs">
              <Users className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-slate-700">Family Network</p>
                <p className="text-[10px] text-muted-foreground">
                  {fn.immediate_family_count} immediate · {fn.extended_family_count} extended · {fn.important_non_family} key adults
                </p>
              </div>
            </div>
            <div className="rounded border p-2 flex items-center gap-2 text-xs">
              <Shield className="h-3.5 w-3.5 text-green-500 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-slate-700">Protective / Risk</p>
                <p className="text-[10px] text-muted-foreground">
                  <span className="text-green-600">{fn.protective_count} protective</span> ·{" "}
                  <span className={fn.risk_count > 0 ? "text-red-600" : "text-slate-500"}>{fn.risk_count} risk</span> ·{" "}
                  {fn.estranged_count} estranged
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Professional Engagement */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <Phone className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">Professionals</p>
              <p className="text-[10px] text-muted-foreground">
                {pe.active_professionals} active of {pe.total_professionals} · {pe.lac_reviews_last_12m} LAC reviews (12m)
              </p>
            </div>
          </div>
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <Heart className="h-3.5 w-3.5 text-rose-500 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">LAC Participation</p>
              <p className="text-[10px] text-muted-foreground">
                Family {pe.family_attended_lac_pct}% · Child {pe.child_participated_lac_pct}%
              </p>
            </div>
          </div>
        </div>

        {/* Placement Impact */}
        {(d.placement_impact.placement_moves > 0 || d.placement_impact.family_related_missing > 0) && (
          <div className={cn("rounded border p-2.5 text-xs",
            d.placement_impact.contact_disruption_risk ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-700"
          )}>
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="h-3 w-3" />
              <span className="font-semibold">Placement & Contact Impact</span>
            </div>
            <div className="flex gap-3 text-[10px]">
              <span>{d.placement_impact.placement_moves} placement move(s)</span>
              <span>{d.placement_impact.family_related_missing} family-related missing</span>
              <span>{d.placement_impact.total_missing_90d} total missing (90d)</span>
              {d.placement_impact.contact_disruption_risk && (
                <span className="font-medium text-amber-700">Disruption risk</span>
              )}
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
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Relationships Intelligence
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
