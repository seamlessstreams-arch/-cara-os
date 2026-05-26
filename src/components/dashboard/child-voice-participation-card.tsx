"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD VOICE & PARTICIPATION DASHBOARD CARD
// Home-level card showing how well children's voices are heard across the
// home: LAC review participation, advocacy access, key work engagement,
// feedback loops, and per-child voice profiles.
// CHR 2015 Reg 7, Reg 16, Reg 45. SCCIF: "The voice of the child."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, Loader2, MessageCircle, AlertCircle,
  Sparkles, Users, FileText, Mic, Quote, ThumbsUp, ThumbsDown,
  Megaphone, UserCheck, Target, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChildVoiceParticipation } from "@/hooks/use-child-voice-participation";
import type { VoiceHealth } from "@/lib/engines/child-voice-participation-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const HEALTH_STYLES: Record<VoiceHealth, { bg: string; text: string; border: string; label: string }> = {
  outstanding:           { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:                  { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  requires_improvement:  { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "REQUIRES IMPROVEMENT" },
  inadequate:            { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
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
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

function scoreBg(score: number): string {
  if (score >= 70) return "bg-green-50";
  if (score >= 40) return "bg-amber-50";
  return "bg-red-50";
}

// ── Component ───────────────────────────────────────────────────────────────

export function ChildVoiceParticipationCard() {
  const { data, isLoading } = useChildVoiceParticipation();

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

  const healthStyle = HEALTH_STYLES[d.voice_health] ?? HEALTH_STYLES.requires_improvement;
  const rp = d.review_participation;
  const ao = d.advocacy_overview;
  const kw = d.key_work_engagement;
  const fb = d.feedback_analysis;

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Mic className="h-4 w-4 text-cyan-500" />
            <span className="text-slate-900">Child Voice & Participation</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", healthStyle.bg, healthStyle.text, healthStyle.border)}>
              {healthStyle.label}
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-600">{d.voice_score}%</span>
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row: Review Participation + Advocacy */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <FileText className={cn("h-3.5 w-3.5 shrink-0", rp.participation_rate >= 80 ? "text-green-500" : rp.participation_rate >= 50 ? "text-amber-500" : "text-red-500")} />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">LAC Review Participation</p>
              <p className="text-[10px] text-muted-foreground">
                <span className={rp.participation_rate >= 80 ? "text-green-600" : rp.participation_rate >= 50 ? "text-amber-600" : "text-red-600"}>
                  {rp.participation_rate}%
                </span>
                {" "}({rp.total_reviews_90d} reviews in 90d)
              </p>
            </div>
          </div>
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <Shield className={cn("h-3.5 w-3.5 shrink-0", ao.children_with_advocacy > 0 ? "text-green-500" : "text-red-500")} />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">Advocacy Access</p>
              <p className="text-[10px] text-muted-foreground">
                <span className={ao.children_with_advocacy > 0 ? "text-green-600" : "text-red-600"}>
                  {ao.children_with_advocacy} child{ao.children_with_advocacy !== 1 ? "ren" : ""}
                </span>
                {ao.active_referrals > 0 && <span> · {ao.active_referrals} active</span>}
                {ao.private_sessions_count > 0 && <span> · {ao.private_sessions_count} private</span>}
              </p>
            </div>
          </div>
        </div>

        {/* KPI Row: Key Work + Feedback */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <Users className={cn("h-3.5 w-3.5 shrink-0", kw.engagement_rate >= 80 ? "text-green-500" : kw.engagement_rate >= 50 ? "text-amber-500" : "text-red-500")} />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">Key Work Engagement</p>
              <p className="text-[10px] text-muted-foreground">
                <span className={kw.engagement_rate >= 80 ? "text-green-600" : kw.engagement_rate >= 50 ? "text-amber-600" : "text-red-600"}>
                  {kw.engagement_rate}% engaged
                </span>
                {" "}({kw.total_sessions_30d} sessions in 30d)
              </p>
            </div>
          </div>
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <MessageCircle className={cn("h-3.5 w-3.5 shrink-0", fb.response_rate >= 80 ? "text-green-500" : fb.response_rate >= 50 ? "text-amber-500" : fb.total_90d === 0 ? "text-slate-400" : "text-red-500")} />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">Feedback</p>
              <p className="text-[10px] text-muted-foreground">
                {fb.total_90d > 0 ? (
                  <>
                    <span className={fb.response_rate >= 80 ? "text-green-600" : "text-amber-600"}>
                      {fb.response_rate}% responded
                    </span>
                    {" "}({fb.total_90d} in 90d)
                    {fb.open_count > 0 && <span className="text-red-600"> · {fb.open_count} open</span>}
                  </>
                ) : (
                  <span className="text-slate-500">No feedback recorded</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Review Participation Breakdown */}
        {rp.total_reviews_90d > 0 && (
          <div className="grid grid-cols-5 gap-2">
            <div className="text-center rounded-lg bg-green-50 p-2">
              <p className="text-lg font-bold tabular-nums text-green-600">{rp.attended_count}</p>
              <p className="text-[10px] text-muted-foreground">Attended</p>
            </div>
            <div className="text-center rounded-lg bg-blue-50 p-2">
              <p className="text-lg font-bold tabular-nums text-blue-600">{rp.represented_count}</p>
              <p className="text-[10px] text-muted-foreground">Represented</p>
            </div>
            <div className="text-center rounded-lg bg-violet-50 p-2">
              <p className="text-lg font-bold tabular-nums text-violet-600">{rp.written_views_count}</p>
              <p className="text-[10px] text-muted-foreground">Written Views</p>
            </div>
            <div className="text-center rounded-lg bg-amber-50 p-2">
              <p className="text-lg font-bold tabular-nums text-amber-600">{rp.declined_count}</p>
              <p className="text-[10px] text-muted-foreground">Declined</p>
            </div>
            <div className={cn("text-center rounded-lg p-2", rp.did_not_participate_count > 0 ? "bg-red-50" : "bg-slate-50")}>
              <p className={cn("text-lg font-bold tabular-nums", rp.did_not_participate_count > 0 ? "text-red-600" : "text-slate-400")}>{rp.did_not_participate_count}</p>
              <p className="text-[10px] text-muted-foreground">No Part.</p>
            </div>
          </div>
        )}

        {/* Top Key Work Themes */}
        {kw.top_themes.length > 0 && (
          <div className="rounded border border-cyan-200 bg-cyan-50 p-2 text-xs">
            <p className="font-medium text-cyan-700 flex items-center gap-1 mb-1">
              <Target className="h-3 w-3" />
              Key Work Themes (30d)
            </p>
            <div className="flex flex-wrap gap-1">
              {kw.top_themes.slice(0, 6).map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-white/60 rounded px-1.5 py-0.5 text-[10px] text-cyan-800 border border-cyan-200">
                  {t.theme} <span className="font-bold">{t.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Top Advocacy Issues */}
        {ao.top_issues.length > 0 && (
          <div className="rounded border border-purple-200 bg-purple-50 p-2 text-xs">
            <p className="font-medium text-purple-700 flex items-center gap-1 mb-1">
              <Megaphone className="h-3 w-3" />
              Advocacy Issues Raised
            </p>
            <div className="flex flex-wrap gap-1">
              {ao.top_issues.slice(0, 5).map((issue, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-white/60 rounded px-1.5 py-0.5 text-[10px] text-purple-800 border border-purple-200">
                  {issue.issue} <span className="font-bold">{issue.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Per-Child Voice Profiles */}
        {d.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <UserCheck className="h-3 w-3 text-cyan-500" />
              Per-Child Voice Profiles (lowest first)
            </p>
            {d.child_profiles.map((cp) => (
              <div key={cp.child_id} className={cn("rounded border p-2 text-xs flex items-start gap-2", scoreBg(cp.voice_score))}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{cp.child_name}</span>
                    <span className={cn("text-[10px] font-bold tabular-nums", scoreColor(cp.voice_score))}>{cp.voice_score}%</span>
                    {cp.review_participated && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">Review</span>
                    )}
                    {cp.has_advocacy && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded">Advocacy</span>
                    )}
                    {cp.key_work_sessions_30d > 0 && (
                      <span className="text-[10px] bg-cyan-100 text-cyan-700 px-1 rounded">{cp.key_work_sessions_30d} KW</span>
                    )}
                    {cp.feedback_given && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">Feedback</span>
                    )}
                  </div>
                  {cp.flags.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {cp.flags.map((f, i) => (
                        <p key={i} className="text-[10px] text-red-700 flex items-center gap-1">
                          <AlertCircle className="h-2.5 w-2.5 shrink-0" />
                          {f}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feedback Breakdown */}
        {fb.total_90d > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center rounded-lg bg-red-50 p-2">
              <p className="text-lg font-bold tabular-nums text-red-600">{fb.complaints}</p>
              <p className="text-[10px] text-muted-foreground">Complaints</p>
            </div>
            <div className="text-center rounded-lg bg-green-50 p-2">
              <p className="text-lg font-bold tabular-nums text-green-600">{fb.compliments}</p>
              <p className="text-[10px] text-muted-foreground">Compliments</p>
            </div>
            <div className="text-center rounded-lg bg-blue-50 p-2">
              <p className="text-lg font-bold tabular-nums text-blue-600">{fb.suggestions}</p>
              <p className="text-[10px] text-muted-foreground">Suggestions</p>
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

        {/* ARIA Voice Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Voice Intelligence
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
