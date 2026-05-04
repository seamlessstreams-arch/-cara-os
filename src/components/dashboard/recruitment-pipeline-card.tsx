"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RECRUITMENT PIPELINE CARD
// Dashboard widget showing active vacancies, candidate funnel, SCR alerts,
// and time-to-appoint metrics at a glance.
// Critical for RMs under constant staffing pressure — Reg 32/33 compliance.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRecruitment } from "@/hooks/use-recruitment";
import { cn } from "@/lib/utils";
import {
  UserCheck, Users, Briefcase, AlertTriangle, Clock, ChevronRight,
  Shield, Loader2, CheckCircle2, Zap,
} from "lucide-react";

// ── Stage config ─────────────────────────────────────────────────────────────

const FUNNEL_STAGES: { key: string; label: string; color: string }[] = [
  { key: "enquiry",               label: "Enquiry",        color: "bg-slate-300" },
  { key: "application_received",  label: "Application",    color: "bg-blue-300" },
  { key: "sift",                  label: "Sift",           color: "bg-blue-400" },
  { key: "interview_scheduled",   label: "Interview",      color: "bg-violet-400" },
  { key: "interview_completed",   label: "Interviewed",    color: "bg-violet-500" },
  { key: "references_requested",  label: "References",     color: "bg-amber-400" },
  { key: "conditional_offer",     label: "Offer",          color: "bg-emerald-400" },
  { key: "pre_start_checks",     label: "Pre-Start",      color: "bg-emerald-500" },
  { key: "onboarding",           label: "Onboarding",     color: "bg-emerald-600" },
];

const TERMINAL_STAGES = new Set(["appointed", "unsuccessful", "withdrawn", "started"]);

// ── Component ────────────────────────────────────────────────────────────────

export function RecruitmentPipelineCard() {
  const { data, isLoading } = useRecruitment();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <UserCheck className="h-4 w-4 text-blue-500" />
            Recruitment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const candidates = data.candidates ?? [];
  const vacancies  = data.vacancies ?? [];
  const alerts     = data.alerts ?? [];
  const stats      = data.stats;

  const activeVacancies = vacancies.filter((v) => v.status === "active");
  const activeCandidates = candidates.filter((c) => !TERMINAL_STAGES.has(c.stage));
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");

  // Build funnel counts
  const funnelCounts = FUNNEL_STAGES.map((stage) => ({
    ...stage,
    count: activeCandidates.filter((c) => c.stage === stage.key).length,
  })).filter((s) => s.count > 0);

  const maxCount = Math.max(...funnelCounts.map((s) => s.count), 1);
  const hasCritical = criticalAlerts.length > 0;
  const hasBlockers = stats?.blocked > 0;

  return (
    <Card className={cn(hasCritical && "border-red-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <UserCheck className="h-4 w-4 text-blue-500" />
            Recruitment Pipeline
          </CardTitle>
          <Link href="/recruitment">
            <Badge className="text-[9px] bg-blue-100 text-blue-700 border-0 rounded-full hover:bg-blue-200 cursor-pointer">
              {activeCandidates.length} active
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-xl bg-blue-50 p-2 text-center">
            <Briefcase className="h-3 w-3 text-blue-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-blue-700 tabular-nums">{activeVacancies.length}</div>
            <div className="text-[9px] text-blue-500">Vacancies</div>
          </div>
          <div className="rounded-xl bg-violet-50 p-2 text-center">
            <Users className="h-3 w-3 text-violet-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-violet-700 tabular-nums">{activeCandidates.length}</div>
            <div className="text-[9px] text-violet-500">In Pipeline</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", hasBlockers ? "bg-red-50" : "bg-emerald-50")}>
            <Shield className={cn("h-3 w-3 mx-auto mb-0.5", hasBlockers ? "text-red-500" : "text-emerald-500")} />
            <div className={cn("text-sm font-bold tabular-nums", hasBlockers ? "text-red-700" : "text-emerald-700")}>{stats?.blocked ?? 0}</div>
            <div className={cn("text-[9px]", hasBlockers ? "text-red-500" : "text-emerald-500")}>Blocked</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-2 text-center">
            <Clock className="h-3 w-3 text-slate-400 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-slate-700 tabular-nums">{stats?.avg_days_to_appoint ?? 0}d</div>
            <div className="text-[9px] text-slate-400">Avg Appoint</div>
          </div>
        </div>

        {/* Pipeline funnel */}
        {funnelCounts.length > 0 && (
          <div className="space-y-1">
            {funnelCounts.map((stage) => (
              <div key={stage.key} className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 w-20 text-right truncate">{stage.label}</span>
                <div className="flex-1 h-3 bg-slate-50 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", stage.color)}
                    style={{ width: `${Math.max(10, (stage.count / maxCount) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-700 w-4 text-right tabular-nums">{stage.count}</span>
              </div>
            ))}
          </div>
        )}

        {funnelCounts.length === 0 && (
          <div className="py-3 text-center">
            <CheckCircle2 className="h-6 w-6 text-slate-200 mx-auto mb-1" />
            <p className="text-[11px] text-slate-400">No active candidates in pipeline</p>
          </div>
        )}

        {/* Exceptional starts warning */}
        {(stats?.exceptional_starts ?? 0) > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-2 flex items-start gap-2">
            <Zap className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-amber-700">
                {stats!.exceptional_starts} exceptional start{stats!.exceptional_starts > 1 ? "s" : ""}
              </p>
              <p className="text-[10px] text-amber-600">
                Staff working before full SCR clearance — risk mitigation required
              </p>
            </div>
          </div>
        )}

        {/* SCR compliance alerts */}
        {criticalAlerts.length > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              <p className="text-[10px] font-semibold text-red-700">SCR Compliance Alerts</p>
            </div>
            {criticalAlerts.slice(0, 3).map((alert) => (
              <p key={`${alert.candidate_id}_${alert.issue}`} className="text-[10px] text-red-600 ml-4">
                {alert.candidate_name} — {alert.issue}
              </p>
            ))}
            {criticalAlerts.length > 3 && (
              <p className="text-[10px] text-red-400 ml-4 mt-0.5">
                +{criticalAlerts.length - 3} more alert{criticalAlerts.length - 3 > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

        {/* Active vacancies list */}
        {activeVacancies.length > 0 && (
          <div className="space-y-1">
            {activeVacancies.slice(0, 3).map((v) => (
              <Link key={v.id} href={`/recruitment/vacancies/${v.id}`}>
                <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors">
                  <Briefcase className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-700 flex-1 truncate">{v.role_title}</span>
                  <span className="text-[10px] text-slate-400">{v.applications_count} apps</span>
                  <span className="text-[10px] text-slate-400">{v.days_open}d</span>
                  <ChevronRight className="h-3 w-3 text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
