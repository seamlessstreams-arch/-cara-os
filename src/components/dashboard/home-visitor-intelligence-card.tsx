"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME VISITOR & ACCESS INTELLIGENCE CARD
// Home-level: DBS compliance, ID verification, sign-in/out completion,
// safeguarding oversight for tradespeople, inspector readiness, and
// multi-agency engagement.
// CHR 2015 Reg 12, 22. SCCIF: "Safe."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, DoorOpen,
  ShieldCheck, UserCheck, LogOut, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeVisitorIntelligence } from "@/hooks/use-home-visitor-intelligence";
import type { VisitorRating } from "@/lib/engines/home-visitor-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<VisitorRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeVisitorIntelligenceCard() {
  const { data, isLoading } = useHomeVisitorIntelligence();

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

  const ratingStyle = RATING_STYLES[d.visitor_rating] ?? RATING_STYLES.insufficient_data;
  const lowDbs = d.access_compliance.dbs_check_rate < 70 && d.access_compliance.total_visitors_90d > 0;
  const isAlert = lowDbs || d.visitor_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <DoorOpen className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-cyan-500")} />
            <span className="text-slate-900">Visitor & Access</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.visitor_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.visitor_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.visitor_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.visitor_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* DBS Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.access_compliance.dbs_check_rate >= 90 ? "text-green-600" :
                  d.access_compliance.dbs_check_rate >= 70 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.access_compliance.dbs_check_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">DBS</p>
            </div>

            {/* ID Verification */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.access_compliance.id_verification_rate >= 90 ? "text-green-600" :
                  d.access_compliance.id_verification_rate >= 70 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.access_compliance.id_verification_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">ID Check</p>
            </div>

            {/* Sign-Out */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <LogOut className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.access_compliance.sign_out_completion_rate >= 90 ? "text-green-600" :
                  d.access_compliance.sign_out_completion_rate >= 70 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.access_compliance.sign_out_completion_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Sign-out</p>
            </div>

            {/* Documentation */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.access_compliance.documentation_rate >= 70 ? "text-green-600" :
                  d.access_compliance.documentation_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.access_compliance.documentation_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Documented</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.visitor_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Visitors (90d)</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Total: <span className="font-medium text-slate-600">{d.access_compliance.total_visitors_90d}</span></p>
                {d.category_breakdown.professional > 0 && (
                  <p>Professional: <span className="font-medium text-slate-600">{d.category_breakdown.professional}</span></p>
                )}
                {d.category_breakdown.family > 0 && (
                  <p>Family: <span className="font-medium text-slate-600">{d.category_breakdown.family}</span></p>
                )}
                {d.category_breakdown.inspector > 0 && (
                  <p>Inspector: <span className="font-medium text-green-600">{d.category_breakdown.inspector}</span></p>
                )}
                {d.category_breakdown.tradesperson > 0 && (
                  <p>Tradesperson: <span className="font-medium text-slate-600">{d.category_breakdown.tradesperson}</span></p>
                )}
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Safeguarding</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                {d.safeguarding_profile.visitors_with_child_contact > 0 && (
                  <p>Child contact DBS: <span className={cn("font-medium", d.safeguarding_profile.child_contact_dbs_rate >= 90 ? "text-green-600" : "text-red-600")}>{d.safeguarding_profile.child_contact_dbs_rate}%</span></p>
                )}
                {d.safeguarding_profile.tradesperson_count > 0 && (
                  <p>Tradesperson DBS: <span className={cn("font-medium", d.safeguarding_profile.tradesperson_dbs_rate >= 80 ? "text-green-600" : "text-amber-600")}>{d.safeguarding_profile.tradesperson_dbs_rate}%</span></p>
                )}
                <p>Multi-agency: <span className={cn("font-medium", d.engagement_profile.multi_agency_engagement ? "text-green-600" : "text-amber-600")}>{d.engagement_profile.multi_agency_engagement ? "Yes" : "No"}</span></p>
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

        {/* ARIA Visitor Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Visitor Intelligence
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
