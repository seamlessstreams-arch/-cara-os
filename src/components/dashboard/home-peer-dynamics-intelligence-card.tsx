"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME PEER DYNAMICS INTELLIGENCE CARD
// Peer relationships, group atmosphere, risk management between children.
// CHR 2015 Reg 19. SCCIF: "Children feel safe with each other."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, UsersRound,
  ShieldCheck, Eye, Handshake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomePeerDynamicsIntelligence } from "@/hooks/use-home-peer-dynamics-intelligence";
import type { PeerDynamicsRating } from "@/lib/engines/home-peer-dynamics-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<PeerDynamicsRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomePeerDynamicsIntelligenceCard() {
  const { data, isLoading } = useHomePeerDynamicsIntelligence();

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

  const ratingStyle = RATING_STYLES[d.peer_rating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.peer_rating === "inadequate" || d.risks.high_count > 0;

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UsersRound className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-violet-500")} />
            <span className="text-slate-900">Peer Dynamics</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.peer_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.peer_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.peer_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.peer_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Positive Pairs */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Handshake className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.relationships.positive_count > 0 ? "text-green-600" : "text-slate-400"
                )}>
                  {d.relationships.positive_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Positive</p>
            </div>

            {/* Risk Pairs */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.risks.high_count > 0 ? "text-red-600" :
                  d.risks.medium_count > 0 ? "text-amber-600" : "text-green-600"
                )}>
                  {d.risks.high_count + d.risks.medium_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">At-Risk</p>
            </div>

            {/* Positive Ratio */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.entry_profile.positive_ratio >= 50 ? "text-green-600" :
                  d.entry_profile.positive_ratio >= 30 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.entry_profile.positive_ratio}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Positive %</p>
            </div>

            {/* Atmosphere */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <UsersRound className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-xs font-bold uppercase",
                  d.group_profile.latest_atmosphere === "calm" ? "text-green-600" :
                  d.group_profile.latest_atmosphere === "mixed" ? "text-amber-600" :
                  d.group_profile.latest_atmosphere === "tense" ? "text-red-600" :
                  d.group_profile.latest_atmosphere === "volatile" ? "text-red-700" : "text-slate-400"
                )}>
                  {d.group_profile.latest_atmosphere}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Atmosphere</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.peer_rating !== "insufficient_data" && d.relationships.total_pairs > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Relationships</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Total pairs: <span className="font-medium text-slate-600">{d.relationships.total_pairs}</span></p>
                <p>Developing: <span className="font-medium text-blue-600">{d.relationships.developing_count}</span></p>
                <p>Strained: <span className={cn("font-medium",
                  d.relationships.strained_count === 0 ? "text-green-600" : "text-amber-600"
                )}>{d.relationships.strained_count}</span></p>
                <p>Conflicted: <span className={cn("font-medium",
                  d.relationships.conflicted_count === 0 ? "text-green-600" : "text-red-600"
                )}>{d.relationships.conflicted_count}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Monitoring</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Entries (30d): <span className="font-medium text-slate-600">{d.entry_profile.entries_last_30_days}</span></p>
                <p>Incidents: <span className={cn("font-medium",
                  d.entry_profile.incidents === 0 ? "text-green-600" : "text-amber-600"
                )}>{d.entry_profile.incidents}</span></p>
                <p>Reviews overdue: <span className={cn("font-medium",
                  d.review_profile.overdue_reviews === 0 ? "text-green-600" : "text-red-600"
                )}>{d.review_profile.overdue_reviews}</span></p>
                <p>Strategies: <span className="font-medium text-slate-600">{d.strategy_profile.total_strategies}</span></p>
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

        {/* ARIA Peer Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Peer Intelligence
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
