"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME FAMILY ENGAGEMENT INTELLIGENCE CARD
// Home-level: family time contact, child voice, social worker notification,
// relationship trajectories, and family engagement quality.
// CHR 2015 Reg 7, 8, 9. SCCIF: "Effective."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Heart,
  MessageCircle, Shield, TrendingUp, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeFamilyEngagementIntelligence } from "@/hooks/use-home-family-engagement-intelligence";
import type { FamilyEngagementRating } from "@/lib/engines/home-family-engagement-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<FamilyEngagementRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeFamilyEngagementIntelligenceCard() {
  const { data, isLoading } = useHomeFamilyEngagementIntelligence();

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

  const ratingStyle = RATING_STYLES[d.family_engagement_rating] ?? RATING_STYLES.insufficient_data;
  const hasDeclining = d.relationship_profile.declining_count > 0;
  const hasUnsafe = d.contact_profile.safety_rate < 100 && d.contact_profile.total_sessions_90d > 0;
  const isAlert = hasUnsafe || d.family_engagement_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-pink-500")} />
            <span className="text-slate-900">Family Engagement</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.family_engagement_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.family_engagement_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row */}
        {d.family_engagement_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Contact Coverage */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.contact_profile.contact_coverage >= 80 ? "text-green-600" :
                  d.contact_profile.contact_coverage >= 60 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.contact_profile.contact_coverage}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Contact</p>
            </div>

            {/* Child Voice */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <MessageCircle className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.child_voice_profile.voice_capture_rate >= 80 ? "text-green-600" :
                  d.child_voice_profile.voice_capture_rate >= 60 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.child_voice_profile.voice_capture_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Voice</p>
            </div>

            {/* Safety */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Shield className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.contact_profile.safety_rate === 100 ? "text-green-600" : "text-red-600"
                )}>
                  {d.contact_profile.safety_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Safe</p>
            </div>

            {/* Relationship Quality */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.relationship_profile.avg_quality_score >= 7 ? "text-green-600" :
                  d.relationship_profile.avg_quality_score >= 5 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.relationship_profile.avg_quality_score}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Quality</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.family_engagement_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Contact (90d)</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Sessions: <span className="font-medium text-slate-600">{d.contact_profile.total_sessions_90d}</span></p>
                <p>Avg duration: <span className="font-medium text-slate-600">{d.contact_profile.avg_duration_minutes}min</span></p>
                {d.contact_profile.children_without_contact.length > 0 && (
                  <p>No contact: <span className="font-medium text-amber-600">{d.contact_profile.children_without_contact.length}</span></p>
                )}
                {d.contact_profile.concern_count > 0 && (
                  <p>Concerns: <span className="font-medium text-red-600">{d.contact_profile.concern_count}</span></p>
                )}
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Relationships</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Assessed: <span className={cn("font-medium", d.relationship_profile.assessment_coverage >= 80 ? "text-green-600" : "text-amber-600")}>{d.relationship_profile.children_assessed.length}/{d.relationship_profile.children_assessed.length + d.relationship_profile.children_not_assessed.length}</span></p>
                {d.relationship_profile.improving_count > 0 && (
                  <p>Improving: <span className="font-medium text-green-600">{d.relationship_profile.improving_count}</span></p>
                )}
                {hasDeclining && (
                  <p>Declining: <span className="font-medium text-red-600">{d.relationship_profile.declining_count}</span></p>
                )}
                {d.relationship_profile.overdue_reviews > 0 && (
                  <p>Overdue: <span className="font-medium text-red-600">{d.relationship_profile.overdue_reviews}</span></p>
                )}
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

        {/* ARIA Family Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Family Intelligence
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
