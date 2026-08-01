"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MISSING EPISODES INTELLIGENCE CARD
// Dashboard card powered by the Missing From Care Intelligence Engine.
// CHR 2015 Reg 12/34. SCCIF: Helped & Protected — Missing from care.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, ChevronRight, AlertTriangle, Brain,
  Clock, Shield, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { MissingIntelligenceResult } from "@/lib/engines/missing-from-care-engine";

interface MissingIntelligenceResponse {
  data: MissingIntelligenceResult;
}

function useMissingIntelligence() {
  return useQuery({
    queryKey: ["missing-intelligence"],
    queryFn: () => api.get<MissingIntelligenceResponse>("/missing-intelligence"),
    refetchInterval: 30_000,
  });
}

// ── Styling ─────────────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning:  "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const RISK_STYLES: Record<string, string> = {
  high:    "bg-[--cs-risk-bg] text-[--cs-risk]",
  medium:  "bg-[--cs-warning-bg] text-[--cs-warning]",
  low:     "bg-[--cs-success-bg] text-[--cs-success]",
};

// ── Component ───────────────────────────────────────────────────────────────

export function MissingEpisodesIntelligenceCard() {
  const { data, isLoading } = useMissingIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand" />
            Missing Episodes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const p = intel.profile;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand" />
            Missing Episodes
          </CardTitle>
          <Link href="/missing-from-care" className="text-xs text-brand hover:underline flex items-center gap-1">
            Episodes <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", p.active_episodes === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", p.active_episodes === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{p.active_episodes}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{p.total_episodes}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", (p.return_interview_completion_rate ?? 0) >= 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (p.return_interview_completion_rate ?? 0) >= 100 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{p.return_interview_completion_rate}%</p>
            <p className="text-[10px] text-muted-foreground">RHI Done</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", p.contextual_safeguarding_flagged === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", p.contextual_safeguarding_flagged === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{p.contextual_safeguarding_flagged}</p>
            <p className="text-[10px] text-muted-foreground">CSG Flag</p>
          </div>
        </div>

        {/* ── Recent episodes ─────────────────────────────────────────── */}

        {intel.recent_episodes.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Recent Episodes
            </p>
            {intel.recent_episodes.slice(0, 4).map((ep) => (
              <div key={ep.id} className="rounded border p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{ep.child_name}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={cn("text-[10px]", RISK_STYLES[ep.risk_level] ?? RISK_STYLES.medium)}>
                      {ep.risk_level}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{ep.type}</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{new Date(ep.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — {ep.duration}</span>
                  <span className={cn(ep.return_interview === "completed" ? "text-[--cs-success]" : "text-[--cs-warning]")}>
                    RHI: {ep.return_interview}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Push/pull factors ────────────────────────────────────────── */}

        {(intel.push_pull.pull.length > 0 || intel.push_pull.push.length > 0) && (
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1">
              <Shield className="h-3 w-3 text-blue-500" />
              Push/Pull Factors
            </p>
            <div className="flex flex-wrap gap-1">
              {intel.push_pull.push.map((f) => (
                <Badge key={f.factor} variant="outline" className="text-[10px] border-red-200 text-red-700 capitalize">
                  Push: {f.factor.replace(/_/g, " ")} ({f.count})
                </Badge>
              ))}
              {intel.push_pull.pull.map((f) => (
                <Badge key={f.factor} variant="outline" className="text-[10px] border-amber-200 text-amber-700 capitalize">
                  Pull: {f.factor.replace(/_/g, " ")} ({f.count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* ── All clear ───────────────────────────────────────────────── */}

        {p.total_episodes === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-xs text-green-700">No missing or absent episodes. All children safely in placement.</span>
          </div>
        )}

        {/* ── Cara Missing Intelligence ───────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Missing Intelligence
            </p>
            {intel.insights.slice(0, 3).map((insight, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive,
                )}
              >
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
