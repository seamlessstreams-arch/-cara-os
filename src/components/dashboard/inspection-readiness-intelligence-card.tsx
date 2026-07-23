"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — INSPECTION READINESS INTELLIGENCE CARD
// Real-time Ofsted inspection preparedness dashboard widget.
// CHR 2015 (all regulations). SCCIF: All three judgment areas.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, CheckCircle2, ChevronRight, ClipboardCheck,
  Loader2, Shield, TrendingDown, TrendingUp, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspectionReadinessIntelligence } from "@/hooks/use-inspection-readiness-intelligence";
import type { ReadinessGrade } from "@/lib/engines/inspection-readiness-intelligence-engine";

import { formatRate } from "@/lib/metrics/rate";

const GRADE_STYLES: Record<ReadinessGrade, { bg: string; text: string; border: string; label: string }> = {
  outstanding: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", label: "OUTSTANDING" },
  good: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", label: "GOOD" },
  requires_improvement: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", label: "RI" },
  inadequate: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", label: "INADEQUATE" },
};

// No records = no grade. Falling back to GOOD, as this card used to, told a
// manager their home was fine on the strength of nothing at all.
const UNGRADED = { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300", label: "NOT YET MEASURED" };

const EVIDENCE_STYLES: Record<string, string> = {
  strong: "bg-green-500",
  adequate: "bg-blue-500",
  weak: "bg-amber-500",
  missing: "bg-red-500",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const ACTION_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  high: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  medium: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
  low: "border-slate-200 bg-slate-50 text-slate-700",
};

export function InspectionReadinessIntelligenceCard() {
  const { data, isLoading } = useInspectionReadinessIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200 col-span-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const gradeStyle = d.overall_grade === null ? UNGRADED : (GRADE_STYLES[d.overall_grade] ?? UNGRADED);
  const criticalGaps = d.regulatory_gaps.filter((g) => g.severity === "critical").length;
  const nonCompliant = d.compliance_matrix.filter((c) => !c.compliant).length;

  return (
    <Card className="overflow-hidden border-slate-200 col-span-full">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-slate-600" />
            <span className="text-slate-900">Inspection Readiness</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", gradeStyle.bg, gradeStyle.text, gradeStyle.border)}>
              {gradeStyle.label}
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-600">{formatRate(d.overall_readiness_score)}</span>
          </CardTitle>
          <Link href="/inspection-readiness" className="text-xs text-slate-600 hover:underline flex items-center gap-1">
            Full Report <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SCCIF Judgment Areas */}
        <div className="grid grid-cols-3 gap-2">
          {d.judgment_areas.map((ja) => {
            const jaStyle = ja.grade === null ? UNGRADED : (GRADE_STYLES[ja.grade] ?? UNGRADED);
            return (
              <div key={ja.area} className="rounded border p-2 text-center">
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full border inline-block mb-1", jaStyle.bg, jaStyle.text, jaStyle.border)}>
                  {jaStyle.label}
                </span>
                <p className="text-lg font-bold tabular-nums text-slate-600">{formatRate(ja.score)}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{ja.area_label.split(" ").slice(1, 4).join(" ")}</p>
              </div>
            );
          })}
        </div>

        {/* Key Compliance KPIs */}
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", criticalGaps > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", criticalGaps > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{criticalGaps}</p>
            <p className="text-[10px] text-muted-foreground">Critical Gaps</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", nonCompliant > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", nonCompliant > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{nonCompliant}</p>
            <p className="text-[10px] text-muted-foreground">Non-Compliant</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-slate-600">{d.evidence_strength.filter((e) => e.strength === "strong").length}/{d.evidence_strength.length}</p>
            <p className="text-[10px] text-muted-foreground">Evidence Strong</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", d.key_risks.length > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", d.key_risks.length > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{d.key_risks.length}</p>
            <p className="text-[10px] text-muted-foreground">Key Risks</p>
          </div>
        </div>

        {/* Evidence Strength Bar */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Evidence Strength</p>
          <div className="grid grid-cols-4 gap-1.5">
            {d.evidence_strength.slice(0, 8).map((ev) => (
              <div key={ev.category} className="rounded border p-1.5 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className={cn("h-2 w-2 rounded-full", EVIDENCE_STYLES[ev.strength])} />
                </div>
                <p className="text-[10px] font-medium text-slate-700 truncate">{ev.category_label.split(" ")[0]}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{ev.strength}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Regulatory Gaps */}
        {d.regulatory_gaps.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Regulatory Gaps ({d.regulatory_gaps.length})
            </p>
            {d.regulatory_gaps.slice(0, 3).map((gap, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed",
                gap.severity === "critical" ? "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]" :
                gap.severity === "significant" ? "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]" :
                "border-slate-200 bg-slate-50 text-slate-700",
              )}>
                <div className="flex items-start justify-between gap-2">
                  <span>{gap.gap_description}</span>
                  <span className="text-[10px] font-mono shrink-0 opacity-60">{gap.regulation}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Priority Actions */}
        {d.action_priorities.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              Inspection Prep Actions ({d.action_priorities.length})
            </p>
            {d.action_priorities.slice(0, 3).map((action) => (
              <div key={action.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", ACTION_STYLES[action.severity] ?? ACTION_STYLES.medium)}>
                <div className="flex items-start justify-between gap-2">
                  <span>{action.action}</span>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[10px] font-mono opacity-60">{action.regulation}</span>
                    <span className="text-[10px] opacity-60">{action.deadline_suggestion}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Compliance Matrix */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Compliance Matrix</p>
          <div className="grid grid-cols-2 gap-1.5">
            {d.compliance_matrix.slice(0, 8).map((item) => (
              <div key={item.area} className="rounded border p-2 flex items-center gap-2 text-xs">
                {item.compliant ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={cn("font-medium truncate", item.compliant ? "text-green-700" : "text-red-700")}>{item.area}</p>
                  <p className="text-[10px] text-muted-foreground">{item.detail} • {item.regulation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cara Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Inspection Intelligence
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
