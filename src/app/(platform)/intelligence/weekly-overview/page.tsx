"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — WEEKLY INTELLIGENCE OVERVIEW
// Comprehensive management report: aggregated intelligence snapshot for the week.
// For Registered Managers — Chamberlain House.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  useHomeClimate,
  usePatternAlerts,
  useActionOutcomes,
  useChildExperienceLatest,
  useInterventions,
  usePracticeBank,
  useVoiceRecords,
  useAcknowledgePattern,
  useCreateChildExperienceSnapshot,
} from "@/hooks/use-intelligence";
import { useAuthContext } from "@/contexts/auth-context";
import { useYoungPeople } from "@/hooks/use-young-people";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import type {
  PatternAlert,
  ActionOutcome,
} from "@/types/extended";
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  ChevronRight,
  Users,
  MessageSquareQuote,
  Zap,
  Cpu,
  FileText,
  ShieldCheck,
} from "lucide-react";
import type { WeeklyReport } from "@/lib/cpie/weekly-report";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

// ── Constants ─────────────────────────────────────────────────────────────────



// ── Helpers ───────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-100", className)} />;
}

function scoreBarColor(score: number): string {
  if (score < 40) return "bg-red-500";
  if (score < 60) return "bg-amber-500";
  if (score < 80) return "bg-teal-500";
  return "bg-emerald-500";
}

function scoreTextColor(score: number): string {
  if (score < 40) return "text-red-600";
  if (score < 60) return "text-amber-600";
  if (score < 80) return "text-teal-600";
  return "text-emerald-600";
}

const SEV_CLASSES: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high:     "bg-orange-100 text-orange-800",
  medium:   "bg-amber-100 text-amber-800",
  low:      "bg-slate-100 text-[var(--cs-text-secondary)]",
};

const SEV_BORDER: Record<string, string> = {
  critical: "border-l-red-400",
  high:     "border-l-orange-400",
  medium:   "border-l-amber-400",
  low:      "border-l-slate-300",
};

const STATUS_CLASSES: Record<string, string> = {
  open:        "bg-slate-100 text-[var(--cs-text-secondary)]",
  in_progress: "bg-blue-100 text-blue-800",
  overdue:     "bg-red-100 text-red-800",
  stalled:     "bg-amber-100 text-amber-800",
  completed:   "bg-emerald-100 text-emerald-800",
  cancelled:   "bg-slate-100 text-[var(--cs-text-muted)]",
};

// ── Section A: Header stat cards ──────────────────────────────────────────────

function HeaderStatCards() {
  const climate = useHomeClimate();
  const alerts  = usePatternAlerts({ status: "active" });
  const overdue = useActionOutcomes({ status: "overdue" });
  const vCasey = useVoiceRecords("yp_casey");
  const vAlex  = useVoiceRecords("yp_alex");
  const vJordan    = useVoiceRecords("yp_jordan");
  const { data: ypData } = useYoungPeople("current");
  const ypTotal = (ypData?.data ?? []).length || 3;

  const climateScore = climate.data?.data?.latest?.overall_climate_score ?? null;
  const climateDelta = climate.data?.data?.latest?.climate_delta ?? null;
  const climateMeta  = climate.data?.meta?.trend ?? null;

  const activeAlerts   = alerts.data?.data ?? [];
  const criticalAlerts = activeAlerts.filter((a) => a.severity === "critical");

  const overdueItems = overdue.data?.data ?? [];

  // Voice coverage: how many children had a voice record in last 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const voiceCoverage = useMemo(() => {
    const childVoice: boolean[] = [
      (vCasey.data?.data ?? []).some((r) => new Date(r.created_at).getTime() > sevenDaysAgo),
      (vAlex.data?.data ?? []).some((r) => new Date(r.created_at).getTime() > sevenDaysAgo),
      (vJordan.data?.data ?? []).some((r) => new Date(r.created_at).getTime() > sevenDaysAgo),
    ];
    return childVoice.filter(Boolean).length;
  }, [vCasey.data, vAlex.data, vJordan.data, sevenDaysAgo]);

  const voiceLoading = vCasey.isLoading || vAlex.isLoading || vJordan.isLoading;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Home Climate */}
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4 space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Home Climate</span>
          {climateDelta !== null && (
            climateDelta > 0
              ? <TrendingUp className="h-4 w-4 text-emerald-500" />
              : climateDelta < 0
              ? <TrendingDown className="h-4 w-4 text-red-500" />
              : null
          )}
        </div>
        {climate.isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : climateScore !== null ? (
          <>
            <div className={cn("text-3xl font-bold tabular-nums", scoreTextColor(climateScore))}>
              {climateScore}
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100">
              <div className={cn("h-1.5 rounded-full transition-all", scoreBarColor(climateScore))} style={{ width: `${climateScore}%` }} />
            </div>
            {climateMeta && (
              <div className="text-[10px] text-[var(--cs-text-muted)] capitalize">{climateMeta}</div>
            )}
          </>
        ) : (
          <div className="text-sm text-[var(--cs-text-muted)]">No data</div>
        )}
      </div>

      {/* Active Alerts */}
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4 space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Active Alerts</span>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </div>
        {alerts.isLoading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <>
            <div className={cn("text-3xl font-bold tabular-nums", activeAlerts.length > 0 ? "text-amber-600" : "text-emerald-600")}>
              {activeAlerts.length}
            </div>
            {criticalAlerts.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-semibold text-red-600">
                <AlertTriangle className="h-3 w-3" />
                {criticalAlerts.length} critical
              </div>
            )}
            {criticalAlerts.length === 0 && activeAlerts.length === 0 && (
              <div className="text-[10px] text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                All clear
              </div>
            )}
          </>
        )}
      </div>

      {/* Overdue Actions */}
      <div className={cn(
        "rounded-2xl border bg-white p-4 space-y-2 shadow-sm",
        overdueItems.length > 0 ? "border-red-200" : "border-[var(--cs-border)]"
      )}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Overdue Actions</span>
          <Clock className="h-4 w-4 text-[var(--cs-text-muted)]" />
        </div>
        {overdue.isLoading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <>
            <div className={cn("text-3xl font-bold tabular-nums", overdueItems.length > 0 ? "text-red-600" : "text-emerald-600")}>
              {overdueItems.length}
            </div>
            <div className="text-[10px] text-[var(--cs-text-muted)]">
              {overdueItems.length > 0 ? "Requires attention" : "No overdue actions"}
            </div>
          </>
        )}
      </div>

      {/* Voice Coverage */}
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4 space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Voice Coverage</span>
          <MessageSquareQuote className="h-4 w-4 text-[var(--cs-cara-gold)]" />
        </div>
        {voiceLoading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <>
            <div className={cn("text-3xl font-bold tabular-nums", voiceCoverage === ypTotal ? "text-emerald-600" : voiceCoverage > 0 ? "text-amber-600" : "text-red-600")}>
              {voiceCoverage}<span className="text-xl text-[var(--cs-text-muted)]">/{ypTotal}</span>
            </div>
            <div className="text-[10px] text-[var(--cs-text-muted)]">Last 7 days</div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Section B: Child card ─────────────────────────────────────────────────────

function ChildOverviewCard({ child }: { child: { id: string; name: string } }) {
  const experience  = useChildExperienceLatest(child.id);
  const alerts      = usePatternAlerts({ childId: child.id, status: "active" });
  const interventions = useInterventions(child.id);
  const practiceBank  = usePracticeBank(child.id);
  const voice         = useVoiceRecords(child.id);

  const score = experience.data?.data?.overall_score ?? null;
  const delta = experience.data?.data?.score_delta ?? null;

  const activeInterventions = (interventions.data?.data ?? []).filter(
    (i) => i.status === "active"
  ).length;
  const practiceBankCount = (practiceBank.data?.data ?? []).length;
  const alertCount        = (alerts.data?.data ?? []).length;

  const lastVoiceRecord = (voice.data?.data ?? [])
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  const isLoading = experience.isLoading || alerts.isLoading || interventions.isLoading;

  return (
    <Link
      href={`/young-people/${child.id}`}
      className="block rounded-2xl border border-[var(--cs-border)] bg-white p-5 hover:bg-[var(--cs-surface)] transition-all group focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]"
    >
      {/* Child header */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={child.name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-[var(--cs-navy)]">{child.name}</div>
          <div className="text-[11px] text-[var(--cs-text-muted)]">Young person profile</div>
        </div>
        <ChevronRight className="h-4 w-4 text-[var(--cs-text-gentle)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>

      {/* Wellbeing score bar */}
      {isLoading ? (
        <Skeleton className="h-5 w-full mb-4" />
      ) : score !== null ? (
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--cs-text-muted)] font-semibold uppercase tracking-wider">Wellbeing Score</span>
            <span className={cn("text-sm font-bold tabular-nums", scoreTextColor(score))}>
              {score}
              {delta !== null && delta !== 0 && (
                <span className={cn("ml-1 text-[10px]", delta > 0 ? "text-emerald-500" : "text-red-500")}>
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              )}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div
              className={cn("h-2 rounded-full transition-all duration-500", scoreBarColor(score))}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Mini stats row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <div className="text-[9px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-0.5">Alerts</div>
          <div className={cn("text-base font-bold tabular-nums", alertCount > 0 ? "text-amber-600" : "text-[var(--cs-text-secondary)]")}>
            {alertCount}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <div className="text-[9px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-0.5">Interventions</div>
          <div className="text-base font-bold tabular-nums text-[var(--cs-text-secondary)]">{activeInterventions}</div>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <div className="text-[9px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-0.5">Practice Bank</div>
          <div className="text-base font-bold tabular-nums text-[var(--cs-text-secondary)]">{practiceBankCount}</div>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <div className="text-[9px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-0.5">Last Voice</div>
          <div className="text-[11px] font-semibold text-[var(--cs-text-secondary)] truncate">
            {lastVoiceRecord ? formatRelative(lastVoiceRecord.recorded_at) : "—"}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ChildrenOverviewSection() {
  const { data: ypData, isLoading } = useYoungPeople("current");
  const children = (ypData?.data ?? []).map((yp) => ({ id: yp.id, name: yp.preferred_name ?? yp.id }));

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-[var(--cs-text-muted)]" />
        <h2 className="text-sm font-semibold text-[var(--cs-text-secondary)]">Children Overview</h2>
        {!isLoading && (
          <span className="text-[10px] text-[var(--cs-text-muted)] ml-auto">{children.length} current</span>
        )}
      </div>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <ChildOverviewCard key={child.id} child={child} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Section C: Pattern Alerts ─────────────────────────────────────────────────

function PatternAlertsSection() {
  const { data, isLoading } = usePatternAlerts({ status: "active" });
  const acknowledge = useAcknowledgePattern();

  const alerts: PatternAlert[] = data?.data ?? [];

  const { currentUser } = useAuthContext();

  function handleAcknowledge(id: string) {
    acknowledge.mutate({ id, status: "acknowledged", acknowledged_by: currentUser?.id ?? "staff_darren" });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Brain className="h-4 w-4 text-amber-500" />
          Pattern Alerts
          {alerts.length > 0 && (
            <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              {alerts.length} active
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-slate-200" />
            <p className="text-sm text-[var(--cs-text-muted)]">No active pattern alerts</p>
            <p className="text-xs text-[var(--cs-text-muted)]">Cara is monitoring for emerging patterns</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "rounded-xl border-l-4 border border-[var(--cs-border-subtle)] bg-slate-50 p-4",
                  SEV_BORDER[alert.severity]
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize shrink-0",
                        SEV_CLASSES[alert.severity]
                      )}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-semibold text-[var(--cs-navy)]">{alert.title}</span>
                    </div>
                    {alert.description && (
                      <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed line-clamp-2">{alert.description}</p>
                    )}
                    <div className="text-[10px] text-[var(--cs-text-muted)]">{formatDate(alert.detected_at)}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-xs shrink-0"
                    disabled={acknowledge.isPending}
                    onClick={(e) => { e.preventDefault(); handleAcknowledge(alert.id); }}
                  >
                    {acknowledge.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Acknowledge"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Section D: Actions Tracker ─────────────────────────────────────────────────



function ActionCard({ action, nameMap }: { action: ActionOutcome; nameMap: Record<string, string> }) {
  return (
    <div className={cn(
      "rounded-xl border bg-white p-3 space-y-1.5",
      action.status === "overdue" ? "border-red-200" : "border-[var(--cs-border-subtle)]"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold text-[var(--cs-navy)] leading-snug flex-1 min-w-0">{action.title}</div>
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase shrink-0 whitespace-nowrap",
          STATUS_CLASSES[action.status] ?? STATUS_CLASSES.open
        )}>
          {action.status.replace("_", " ")}
        </span>
      </div>
      {action.child_id && (
        <div className="text-[10px] text-[var(--cs-text-muted)]">
          Child: <span className="font-medium text-[var(--cs-text-secondary)]">{nameMap[action.child_id] ?? action.child_id}</span>
        </div>
      )}
      {action.due_date && (
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-medium",
          action.status === "overdue" ? "text-red-600" : "text-[var(--cs-text-muted)]"
        )}>
          <Clock className="h-2.5 w-2.5" />
          Due {formatDate(action.due_date)}
        </div>
      )}
    </div>
  );
}

function ActionsTrackerSection() {
  const { data, isLoading } = useActionOutcomes();
  const { data: ypData } = useYoungPeople("current");
  const CHILD_NAME_MAP = useMemo(
    () => Object.fromEntries((ypData?.data ?? []).map((yp) => [yp.id, yp.preferred_name ?? yp.id])),
    [ypData]
  );

  const all = data?.data ?? [];
  const inProgress = all.filter((a) => a.status === "in_progress" || a.status === "open");
  const overdueItems = all.filter((a) => a.status === "overdue");

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><Skeleton className="h-5 w-36" /></CardHeader>
          <CardContent><div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><Skeleton className="h-5 w-36" /></CardHeader>
          <CardContent><div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* In Progress / Open */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            In Progress
            <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              {inProgress.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inProgress.length === 0 ? (
            <p className="text-xs text-[var(--cs-text-muted)] py-4 text-center">No in-progress actions</p>
          ) : (
            <div className="space-y-2">
              {inProgress.map((action) => (
                <ActionCard key={action.id} action={action} nameMap={CHILD_NAME_MAP} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue */}
      <Card className={overdueItems.length > 0 ? "border-red-200" : undefined}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className={cn("h-4 w-4", overdueItems.length > 0 ? "text-red-500" : "text-[var(--cs-text-muted)]")} />
            Overdue
            {overdueItems.length > 0 && (
              <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                {overdueItems.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overdueItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-slate-200" />
              <p className="text-xs text-[var(--cs-text-muted)]">No overdue actions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {overdueItems.map((action) => (
                <ActionCard key={action.id} action={action} nameMap={CHILD_NAME_MAP} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Section E: Cara Weekly Report Generator ───────────────────────────────────

function CaraWeeklyReportSection() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [rawOutput, setRawOutput]       = useState("");
  const [isDone, setIsDone]             = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [copied, setCopied]             = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setRawOutput("");
    setIsDone(false);
    setError(null);

    try {
      const res = await fetch("/api/v1/cara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "oversight_draft",
          style: "management_oversight",
          stream: true,
          page_context: "weekly-overview",
          user_role: "registered_manager",
          question:
            "Generate a weekly management overview narrative for Chamberlain House. Cover: home climate this week, patterns identified, children's wellbeing scores, outstanding actions, children's voice coverage, and key priorities for next week. Write in management oversight style.",
          period_days: 7,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Cara returned ${res.status}`);
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") {
            setIsDone(true);
            continue;
          }

          try {
            const parsed = JSON.parse(payload) as {
              type: string;
              text?: string;
              error?: string;
            };

            if (parsed.type === "text_delta" && parsed.text) {
              setRawOutput((prev) => prev + parsed.text);
            } else if (parsed.type === "message_stop") {
              setIsDone(true);
            } else if (parsed.type === "error") {
              throw new Error(parsed.error ?? "Stream error");
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!rawOutput) return;
    await navigator.clipboard.writeText(rawOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
          Cara Weekly Report
          {isDone && rawOutput && (
            <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-0 text-[10px] rounded-full">
              <CheckCircle2 className="h-3 w-3 mr-1" />Generated
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!rawOutput && !isGenerating && (
          <div className="rounded-xl bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)] p-4 text-xs text-[var(--cs-cara-gold)] leading-relaxed">
            Cara will generate a comprehensive management narrative covering home climate, pattern alerts,
            wellbeing scores, outstanding actions, and children&apos;s voice coverage for the week.
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {rawOutput && (
          <div className="relative">
            <div className="rounded-xl border border-[var(--cs-border)] bg-slate-50 p-4">
              <pre className="text-xs text-[var(--cs-text-secondary)] whitespace-pre-wrap leading-relaxed font-sans">
                {rawOutput}
                {isGenerating && (
                  <span className="inline-block h-3.5 w-0.5 bg-[var(--cs-cara-gold-bg)]0 ml-0.5 animate-pulse align-middle" />
                )}
              </pre>
            </div>
            {isDone && (
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 flex items-center gap-1.5 rounded-lg bg-white border border-[var(--cs-border)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)] transition-colors shadow-sm"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white"
        >
          {isGenerating ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" />{rawOutput ? "Re-generate Report" : "Generate Cara Weekly Report"}</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Section F: Bulk Compute Snapshots ────────────────────────────────────────

type BulkState = "idle" | "running" | "done" | "error";

function BulkComputeSection() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [state, setState]   = useState<BulkState>("idle");
  const [progress, setProgress] = useState<string[]>([]);
  const [error, setError]   = useState<string | null>(null);

  const createSnapshot = useCreateChildExperienceSnapshot();

  const vCasey  = useVoiceRecords("yp_casey");
  const vAlex   = useVoiceRecords("yp_alex");
  const vJordan = useVoiceRecords("yp_jordan");

  const snapCasey  = useChildExperienceLatest("yp_casey");
  const snapAlex   = useChildExperienceLatest("yp_alex");
  const snapJordan = useChildExperienceLatest("yp_jordan");

  const intCasey  = useInterventions("yp_casey");
  const intAlex   = useInterventions("yp_alex");
  const intJordan = useInterventions("yp_jordan");

  const pbCasey  = usePracticeBank("yp_casey");
  const pbAlex   = usePracticeBank("yp_alex");
  const pbJordan = usePracticeBank("yp_jordan");

  async function handleBulkCompute() {
    setState("running");
    setProgress([]);
    setError(null);

    const CHILD_DATA = [
      {
        id: "yp_casey", name: "Casey",
        voices: vCasey.data?.data ?? [],
        snap: snapCasey.data?.data ?? null,
        interventions: intCasey.data?.data ?? [],
        practices: pbCasey.data?.data ?? [],
      },
      {
        id: "yp_alex", name: "Alex",
        voices: vAlex.data?.data ?? [],
        snap: snapAlex.data?.data ?? null,
        interventions: intAlex.data?.data ?? [],
        practices: pbAlex.data?.data ?? [],
      },
      {
        id: "yp_jordan", name: "Jordan",
        voices: vJordan.data?.data ?? [],
        snap: snapJordan.data?.data ?? null,
        interventions: intJordan.data?.data ?? [],
        practices: pbJordan.data?.data ?? [],
      },
    ];

    const now        = new Date();
    const periodEnd  = now.toISOString();
    const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    try {
      for (const child of CHILD_DATA) {
        setProgress((prev) => [...prev, `Computing ${child.name}…`]);

        const lines: string[] = [
          `## Child: ${child.name} (${child.id})`,
          `Computation date: ${now.toISOString()}`,
          "",
        ];

        if (child.snap) {
          lines.push(`## Previous score: ${child.snap.overall_score}`);
          if (child.snap.narrative) lines.push(`Narrative: ${child.snap.narrative}`);
          lines.push("");
        }

        if (child.interventions.length > 0) {
          lines.push("## Interventions");
          child.interventions.forEach((i) => {
            lines.push(`- ${i.title} (${i.status}, outcome: ${i.outcome})`);
          });
          lines.push("");
        }

        if (child.voices.length > 0) {
          lines.push("## Recent Voice Records");
          child.voices.slice(0, 5).forEach((v) => {
            const q = v.direct_quote ?? v.paraphrase ?? "";
            if (q) lines.push(`- [${v.capture_method}] ${v.theme}: "${q}"`);
            lines.push(`  Heeded: ${v.voice_heeded ? "Yes" : "No"}`);
          });
          lines.push("");
        }

        if (child.practices.length > 0) {
          lines.push("## Practice Bank");
          child.practices.slice(0, 5).forEach((p) => {
            lines.push(`- [${p.category}] ${p.title}`);
          });
          lines.push("");
        }

        const res = await fetch("/api/v1/cara", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "compute_experience_snapshot",
            stream: false,
            source_content: lines.join("\n"),
            prompt: `Compute experience snapshot for ${child.name}.`,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(`${child.name}: ${(errJson as { error?: string }).error ?? res.status}`);
        }

        const json = await res.json();
        const parsed = json?.data?.parsed;
        if (!parsed || typeof parsed !== "object") {
          throw new Error(`${child.name}: Cara did not return valid JSON`);
        }

        await createSnapshot.mutateAsync({
          child_id:            child.id,
          home_id:             homeId,
          period_start:        periodStart,
          period_end:          periodEnd,
          safety_score:        Number(parsed.safety_score        ?? 50),
          belonging_score:     Number(parsed.belonging_score     ?? 50),
          regulation_score:    Number(parsed.regulation_score    ?? 50),
          engagement_score:    Number(parsed.engagement_score    ?? 50),
          relationships_score: Number(parsed.relationships_score ?? 50),
          participation_score: Number(parsed.participation_score ?? 50),
          health_score:        Number(parsed.health_score        ?? 50),
          education_score:     Number(parsed.education_score     ?? 50),
          stability_score:     Number(parsed.stability_score     ?? 50),
          achievement_score:   Number(parsed.achievement_score   ?? 50),
          overall_score:       Number(parsed.overall_score       ?? 50),
          narrative:           parsed.narrative ?? "Cara analysis complete.",
          trend:               parsed.trend ?? "stable",
          strengths:           Array.isArray(parsed.strengths) ? parsed.strengths : [],
          concerns:            Array.isArray(parsed.concerns)  ? parsed.concerns  : [],
          computed_by:         "cara",
        });

        setProgress((prev) => [...prev.slice(0, -1), `✓ ${child.name} — score: ${parsed.overall_score ?? "?"}`]);
      }

      setState("done");
      setTimeout(() => setState("idle"), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setState("error");
    }
  }

  return (
    <Card className="border-[var(--cs-cara-gold-soft)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[var(--cs-cara-gold)]" />
            Compute All Wellbeing Snapshots
          </CardTitle>
          <Button
            size="sm"
            onClick={handleBulkCompute}
            disabled={state === "running"}
            className={cn(
              "gap-1.5 text-xs",
              state === "done"  ? "bg-emerald-600 hover:bg-emerald-700 text-white" :
              state === "error" ? "bg-red-600 hover:bg-red-700 text-white" :
              "bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white"
            )}
          >
            {state === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {state === "done"    && <CheckCircle2 className="h-3.5 w-3.5" />}
            {state === "idle"    && <Cpu className="h-3.5 w-3.5" />}
            {state === "error"   && <AlertTriangle className="h-3.5 w-3.5" />}
            {state === "running" ? "Computing…"
             : state === "done"  ? "All done!"
             : state === "error" ? "Retry"
             : "Compute All"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {state === "idle" && progress.length === 0 && (
          <p className="text-xs text-[var(--cs-text-muted)] leading-relaxed">
            Ask Cara to compute fresh wellbeing snapshots for all three children simultaneously,
            using their latest voice records, interventions, and practice bank data as context.
          </p>
        )}
        {progress.length > 0 && (
          <div className="rounded-xl border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] px-4 py-3 space-y-1.5">
            {progress.map((line, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-[var(--cs-cara-gold)]">
                {state === "running" && i === progress.length - 1
                  ? <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                  : <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                }
                {line}
              </div>
            ))}
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Section E2: Child Weekly Report (deterministic, per child) ────────────────
// Renders the full sectioned weekly report — written to the child, day-by-day —
// from CARA's Weekly Intelligence Object. Deterministic: no AI, works with no
// credit. Data from GET /api/v1/cpie/weekly-intelligence (`report`).

function ChildWeeklyReportSection() {
  const { data: ypData } = useYoungPeople("current");
  const children = useMemo(
    () => (ypData?.data ?? []).map((yp) => ({ id: yp.id, name: yp.preferred_name ?? yp.id })),
    [ypData],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const childId = selected ?? children[0]?.id ?? null;

  const [copied, setCopied] = useState(false);
  const [enhancedText, setEnhancedText] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceNote, setEnhanceNote] = useState<string | null>(null);

  // TanStack Query (repo convention) keyed by child — cached per child, retried,
  // deduped; switching back to a child is instant. Replaces useEffect+fetch.
  const reportQuery = useQuery({
    queryKey: ["cpie-weekly-report", childId],
    enabled: !!childId,
    queryFn: async () => {
      const r = await fetch(
        `/api/v1/cpie/weekly-intelligence?child_id=${encodeURIComponent(childId!)}`,
        { headers: { "x-user-role": "registered_manager" } },
      );
      if (!r.ok) throw new Error(`Cara returned ${r.status}`);
      const j = await r.json();
      return ((j.report as WeeklyReport) ?? null);
    },
  });
  const report = reportQuery.data ?? null;
  const loading = reportQuery.isLoading;
  const error = reportQuery.isError
    ? (reportQuery.error instanceof Error ? reportQuery.error.message : "Couldn't load the report.")
    : null;

  // The AI-polish overlay is per-child — clear it when the child changes.
  useEffect(() => {
    setEnhancedText(null);
    setEnhanceNote(null);
  }, [childId]);

  const handleCopy = async () => {
    if (!report) return;
    const text = enhancedText ?? [report.title, "", ...report.sections.map((s) => `${s.heading}\n${s.body}`)].join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // LLM enhancement (opt-in, governed via the AI gateway). Falls back gracefully:
  // when Cara has no credit the deterministic report below stays the record.
  const handleEnhance = async () => {
    if (!childId) return;
    setEnhancing(true); setEnhanceNote(null);
    try {
      const res = await fetch(`/api/v1/cpie/weekly-intelligence?child_id=${encodeURIComponent(childId)}&enhance=true`, { headers: { "x-user-role": "registered_manager" } });
      const j = await res.json();
      const e = j?.enhanced?.report;
      if (e?.enhanced && e.text) setEnhancedText(e.text as string);
      else setEnhanceNote("Cara's AI polish isn't available right now (no credit) — the deterministic report below is the reliable version.");
    } catch {
      setEnhanceNote("Couldn't reach Cara just now — the deterministic report below is the reliable version.");
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-[var(--cs-cara-gold)]" />
            Child Weekly Report
            <Badge className="bg-[var(--cs-success-bg)] text-[var(--cs-success)] border-0 text-[10px] rounded-full">
              <ShieldCheck className="h-3 w-3 mr-1" />Deterministic · no AI
            </Badge>
          </CardTitle>
          {report && !loading && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleEnhance}
                disabled={enhancing}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--cs-navy)] px-2.5 py-1.5 text-[11px] font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {enhancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {enhancing ? "Enhancing…" : enhancedText ? "Re-enhance" : "Enhance with Cara"}
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--cs-border)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)] transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />{copied ? "Copied!" : "Copy report"}
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Child selector */}
        <div className="flex flex-wrap gap-2">
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                c.id === childId
                  ? "bg-[var(--cs-navy)] text-white"
                  : "border border-[var(--cs-border)] text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]",
              )}
            >
              <Avatar name={c.name} size="sm" />
              {c.name}
            </button>
          ))}
        </div>

        {enhanceNote && (
          <div className="flex items-start gap-2 rounded-xl border border-[var(--cs-warning-soft)] bg-[var(--cs-warning-bg)] px-3 py-2.5 text-xs text-[var(--cs-warning)]">
            <Sparkles className="h-4 w-4 shrink-0" />{enhanceNote}
          </div>
        )}

        {enhancedText && (
          <div className="rounded-xl border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] p-4">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--cs-cara-gold)]">
              <Sparkles className="h-3 w-3" />Cara-enhanced draft
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--cs-text)]">{enhancedText}</p>
          </div>
        )}

        {loading && (
          <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-[var(--cs-risk-soft)] bg-[var(--cs-risk-bg)] px-3 py-2.5 text-sm text-[var(--cs-risk)]">
            <AlertTriangle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {report && !loading && (
          <article className="space-y-5">
            <header className="border-b border-[var(--cs-border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--cs-navy)]">{report.title}</h3>
              <p className="text-[11px] text-[var(--cs-text-muted)]">
                Written to {report.childName}, from CARA&apos;s Weekly Intelligence Object · {report.weekStart} to {report.weekEnding}
              </p>
            </header>

            {report.sections.map((section, idx) => {
              const newGroup = idx === 0 || report.sections[idx - 1].group !== section.group;
              return (
                <div key={idx} className="space-y-1.5">
                  {newGroup && (
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--cs-cara-gold)] pt-2">{section.group}</h4>
                  )}
                  <p className="text-[13px] font-semibold text-[var(--cs-text-secondary)]">{section.heading}</p>
                  <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", section.empty ? "text-[var(--cs-text-muted)] italic" : "text-[var(--cs-text)]")}>
                    {section.body}
                  </p>
                </div>
              );
            })}
          </article>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WeeklyOverviewPage() {
  return (
    <PageShell
      title="Weekly Intelligence Overview"
      subtitle="Chamberlain House — management snapshot for the week"
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Weekly Intelligence Overview" subtitle="Chamberlain House — Weekly Management Snapshot" targetId="weekly-overview-content" />
          <SmartUploadButton variant="inline" label="Upload Weekly Summary" uploadContext="Intelligence — weekly overview supporting document upload" />
        </div>
      }
    >
      <div id="weekly-overview-content" className="space-y-8 animate-fade-in">

        {/* A: Header stat cards */}
        <HeaderStatCards />

        {/* B: Children overview */}
        <ChildrenOverviewSection />

        {/* B2: Child weekly report (deterministic, per child) */}
        <ChildWeeklyReportSection />

        {/* C: Pattern alerts */}
        <PatternAlertsSection />

        {/* D: Actions tracker */}
        <ActionsTrackerSection />

        {/* E: Cara weekly report */}
        <CaraWeeklyReportSection />

        {/* F: Bulk compute snapshots */}
        <BulkComputeSection />

      </div>
    </PageShell>
  );
}
