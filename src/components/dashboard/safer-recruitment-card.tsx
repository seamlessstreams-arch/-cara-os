"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SAFER RECRUITMENT INTELLIGENCE CARD
// Dashboard card powered by the Safer Recruitment Intelligence Engine — live data.
// CHR 2015 Reg 32 (fitness of staff), Reg 33 (employment of staff),
// Reg 34, Schedule 2, SCCIF Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, ChevronRight, AlertTriangle, Brain,
  Loader2, UserCheck, Clock, CheckCircle2, FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSaferRecruitmentIntelligence } from "@/hooks/use-safer-recruitment-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const DBS_BADGE: Record<string, string> = {
  verified: "bg-green-100 text-green-700",
  received: "bg-green-100 text-green-700",
  in_progress: "bg-amber-100 text-amber-700",
  requested: "bg-blue-100 text-blue-700",
  not_started: "bg-gray-100 text-gray-600",
  concern_flagged: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
  none: "bg-gray-100 text-gray-500",
};

function formatStage(stage: string): string {
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Component ────────────────────────────────────────────────────────────────

export function SaferRecruitmentCard() {
  const { data, isLoading } = useSaferRecruitmentIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            Safer Recruitment
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

  const o = intel.overview;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            Safer Recruitment
          </CardTitle>
          <Link href="/safer-recruitment-tracker" className="text-xs text-brand hover:underline flex items-center gap-1">
            Full Pipeline <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", o.compliance_rate >= 80 ? "bg-green-50" : o.compliance_rate >= 50 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.compliance_rate >= 80 ? "text-green-600" : o.compliance_rate >= 50 ? "text-amber-600" : "text-red-600")}>
              {o.compliance_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Compliant</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.active_candidates}</p>
            <p className="text-[10px] text-muted-foreground">In Pipeline</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.overdue_checks === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.overdue_checks === 0 ? "text-green-600" : "text-red-600")}>
              {o.overdue_checks}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.dbs_completion_rate >= 80 ? "bg-green-50" : o.dbs_completion_rate >= 50 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.dbs_completion_rate >= 80 ? "text-green-600" : o.dbs_completion_rate >= 50 ? "text-amber-600" : "text-red-600")}>
              {o.dbs_completion_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">DBS Done</p>
          </div>
        </div>

        {/* ── Key metrics bar ──────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.schedule2_completion_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Schedule 2</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.avg_days_in_pipeline}d</p>
            <p className="text-[10px] text-muted-foreground">Avg Pipeline</p>
          </div>
          <div>
            <p className={cn("font-bold tabular-nums", o.outstanding_references > 0 ? "text-amber-600" : "text-green-600")}>
              {o.outstanding_references}
            </p>
            <p className="text-[10px] text-muted-foreground">Refs Outstanding</p>
          </div>
        </div>

        {/* ── Check completion by type ─────────────────────────────────── */}

        {intel.check_analysis.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Check Completion</p>
            {intel.check_analysis.slice(0, 5).map((ca) => (
              <div key={ca.check_type} className="flex items-center gap-2 text-xs">
                <span className="w-24 text-right text-muted-foreground capitalize truncate">
                  {ca.check_type.replace(/_/g, " ")}
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", ca.completion_rate >= 80 ? "bg-green-400" : ca.completion_rate >= 50 ? "bg-amber-400" : "bg-red-400")}
                    style={{ width: `${Math.max(4, ca.completion_rate)}%` }}
                  />
                </div>
                <span className="w-8 text-right font-medium tabular-nums">{ca.completion_rate}%</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Candidate profiles ───────────────────────────────────────── */}

        {intel.candidate_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">
              Candidates ({intel.candidate_profiles.length})
            </p>
            {intel.candidate_profiles.map((profile) => (
              <div key={profile.candidate_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{profile.candidate_name}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge className={cn("text-[9px]", DBS_BADGE[profile.dbs_status] ?? DBS_BADGE.none)}>
                      DBS: {profile.dbs_status === "none" ? "—" : profile.dbs_status.replace(/_/g, " ")}
                    </Badge>
                    {profile.can_start && (
                      <Badge className="text-[9px] bg-green-100 text-green-700">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Ready
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                  <span className="text-[10px]">{formatStage(profile.current_stage)}</span>
                  <span className="text-[10px]">{profile.days_in_pipeline}d in pipeline</span>
                  <span className="text-[10px]">{profile.references_received}/{profile.references_total} refs</span>
                </div>
                {/* Check progress bar */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", profile.check_completion_pct >= 100 ? "bg-green-500" : profile.check_completion_pct >= 50 ? "bg-amber-500" : "bg-red-500")}
                      style={{ width: `${profile.check_completion_pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium tabular-nums">{profile.check_completion_pct}%</span>
                </div>
                {/* Risk flags */}
                {(profile.risk_flags?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(profile.risk_flags ?? []).map((flag, i) => (
                      <Badge key={i} className="text-[9px] bg-red-100 text-red-700">
                        <FileWarning className="h-2.5 w-2.5 mr-0.5" />{flag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              SCR Alerts
            </p>
            {intel.alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium,
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA Recruitment Intelligence ────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Recruitment Intelligence
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
