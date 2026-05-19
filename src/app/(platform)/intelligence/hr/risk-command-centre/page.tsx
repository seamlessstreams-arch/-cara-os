"use client";

// ══════════════════════════════════════════════════════════════════════════════
// HR RISK COMMAND CENTRE
//
// Strategic dashboard for the Registered Manager and Responsible Individual.
// Shows the full HR risk position across the home at a glance: open cases by
// risk level, active suspensions, safeguarding-linked cases, overdue tasks,
// safer recruitment gate position, and cases requiring RI oversight.
//
// In production this pulls from hr_cases, hr_tasks, hr_safer_recruitment, and
// hr_staff_profiles. Until Supabase is wired, the dashboard renders with
// empty-state guidance that explains what each section does and why it matters.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useEffect } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { useHrRisk } from "@/hooks/use-intelligence-layer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Users,
  Clock,
  Eye,
  Gavel,
  FileWarning,
  Activity,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  BarChart3,
  CircleDot,
} from "lucide-react";
import type {
  HrCaseType,
  HrRiskLevel,
  HrCaseStatus,
  HrSafeguardingStatus,
} from "@/lib/hr/types";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CaseSummary {
  id: string;
  staffName: string;
  caseType: HrCaseType;
  riskLevel: HrRiskLevel;
  status: HrCaseStatus;
  safeguardingStatus: HrSafeguardingStatus;
  openedAt: string;
  daysSinceOpened: number;
  lastActionAt: string;
  caseOwner: string;
  riOversightRequired: boolean;
  riOversightCompleted: boolean;
  overdueTaskCount: number;
}

interface RecruitmentSummary {
  staffName: string;
  completedChecks: number;
  totalChecks: number;
  gateOutcome: "approved" | "blocked" | "senior_risk_acceptance";
  criticalMissing: string[];
}

interface HrTaskSummary {
  id: string;
  title: string;
  linkedCaseId?: string;
  assignedTo: string;
  dueDate: string;
  daysOverdue: number;
  priority: "urgent" | "high" | "medium" | "low";
}

// ─── Demo data ──────────────────────────────────────────────────────────────
// In production these come from the API. The demo set is realistic enough to
// show the dashboard working but contains no real personal data.

// ─── Helpers ────────────────────────────────────────────────────────────────

const RISK_COLOURS: Record<HrRiskLevel, string> = {
  green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  black: "bg-gray-900 text-white dark:bg-gray-800 dark:text-gray-100",
};

const RISK_DOT_COLOURS: Record<HrRiskLevel, string> = {
  green: "bg-green-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  black: "bg-gray-900 dark:bg-gray-300",
};

const STATUS_LABELS: Record<HrCaseStatus, string> = {
  open: "Open",
  investigation: "Investigation",
  suspended: "Suspended",
  meeting_scheduled: "Meeting scheduled",
  outcome_pending: "Outcome pending",
  awaiting_appeal: "Awaiting appeal",
  closed: "Closed",
  withdrawn: "Withdrawn",
};

const CASE_TYPE_LABELS: Record<HrCaseType, string> = {
  disciplinary: "Disciplinary",
  grievance: "Grievance",
  capability: "Capability",
  sickness_absence: "Sickness / absence",
  probation: "Probation",
  conduct: "Conduct",
  gross_misconduct: "Gross misconduct",
  bullying_harassment: "Bullying / harassment",
  whistleblowing: "Whistleblowing",
  suspension: "Suspension",
  safeguarding_allegation: "Safeguarding allegation",
  professional_boundaries: "Professional boundaries",
  medication_error: "Medication error",
  poor_recording: "Poor recording",
  staff_conflict: "Staff conflict",
  union_involvement: "Union involvement",
  appeal: "Appeal",
  informal_concern: "Informal concern",
  restorative: "Restorative",
};

function formatRiskLevel(level: HrRiskLevel): string {
  return level === "black" ? "Black" : level.charAt(0).toUpperCase() + level.slice(1);
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function HrRiskCommandCentrePage() {
  const [riskFilter, setRiskFilter] = useState<HrRiskLevel | "all">("all");
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [rawCases, setRawCases] = useState<CaseSummary[]>([]);
  const [rawOverdueTasks, setRawOverdueTasks] = useState<HrTaskSummary[]>([]);
  const [rawRecruitment, setRawRecruitment] = useState<RecruitmentSummary[]>([]);

  const { data: apiData } = useHrRisk();
  useEffect(() => {
    if (apiData?.persisted) {
      if (Array.isArray(apiData.cases)) setRawCases(apiData.cases as CaseSummary[]);
      if (Array.isArray(apiData.overdueTasks)) setRawOverdueTasks(apiData.overdueTasks as HrTaskSummary[]);
      if (Array.isArray(apiData.recruitment)) setRawRecruitment(apiData.recruitment as RecruitmentSummary[]);
    }
  }, [apiData]);

  const cases = useMemo(() => {
    if (riskFilter === "all") return rawCases;
    return rawCases.filter((c) => c.riskLevel === riskFilter);
  }, [riskFilter, rawCases]);

  // ── Risk heatmap counts ────────────────────────────────────
  const riskCounts = useMemo(() => {
    const counts: Record<HrRiskLevel, number> = { green: 0, amber: 0, red: 0, black: 0 };
    for (const c of rawCases) counts[c.riskLevel]++;
    return counts;
  }, [rawCases]);

  const activeSuspensions = useMemo(
    () => rawCases.filter((c) => c.status === "suspended"),
    [rawCases],
  );

  const safeguardingLinked = useMemo(
    () => rawCases.filter((c) => c.safeguardingStatus !== "not_safeguarding"),
    [rawCases],
  );

  const riOversightPending = useMemo(
    () => rawCases.filter((c) => c.riOversightRequired && !c.riOversightCompleted),
    [rawCases],
  );

  const totalOverdueTasks = rawOverdueTasks.length;

  const recruitmentBlocked = useMemo(
    () => rawRecruitment.filter((r) => r.gateOutcome === "blocked"),
    [rawRecruitment],
  );

  return (
    <PageShell
      title="HR Risk Command Centre"
      subtitle="Strategic overview of the home's HR risk position. Live case status, overdue actions, safeguarding-linked cases, safer recruitment gates, and RI oversight."
    >
      {/* ── Headline metrics ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <MetricCard
          label="Open cases"
          value={rawCases.length}
          icon={<Activity className="h-5 w-5" />}
          accent="text-blue-600 dark:text-blue-400"
        />
        <MetricCard
          label="Active suspensions"
          value={activeSuspensions.length}
          icon={<ShieldAlert className="h-5 w-5" />}
          accent="text-red-600 dark:text-red-400"
          alert={activeSuspensions.length > 0}
        />
        <MetricCard
          label="Safeguarding-linked"
          value={safeguardingLinked.length}
          icon={<FileWarning className="h-5 w-5" />}
          accent="text-orange-600 dark:text-orange-400"
          alert={safeguardingLinked.length > 0}
        />
        <MetricCard
          label="Overdue tasks"
          value={totalOverdueTasks}
          icon={<Clock className="h-5 w-5" />}
          accent="text-amber-600 dark:text-amber-400"
          alert={totalOverdueTasks > 0}
        />
        <MetricCard
          label="RI oversight pending"
          value={riOversightPending.length}
          icon={<Eye className="h-5 w-5" />}
          accent="text-purple-600 dark:text-purple-400"
          alert={riOversightPending.length > 0}
        />
        <MetricCard
          label="Recruitment blocked"
          value={recruitmentBlocked.length}
          icon={<Users className="h-5 w-5" />}
          accent="text-rose-600 dark:text-rose-400"
          alert={recruitmentBlocked.length > 0}
        />
      </div>

      {/* ── Risk heatmap ───────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            Risk heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {(["black", "red", "amber", "green"] as HrRiskLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setRiskFilter(riskFilter === level ? "all" : level)}
                className={cn(
                  "rounded-lg p-4 text-center transition-all border-2",
                  riskFilter === level
                    ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
                    : "border-transparent",
                  RISK_COLOURS[level],
                )}
              >
                <div className="text-3xl font-bold">{riskCounts[level]}</div>
                <div className="text-sm font-medium mt-1">{formatRiskLevel(level)}</div>
              </button>
            ))}
          </div>
          {riskFilter !== "all" && (
            <p className="text-sm text-muted-foreground mt-3">
              Showing {formatRiskLevel(riskFilter)} cases only.{" "}
              <button
                onClick={() => setRiskFilter("all")}
                className="text-blue-600 dark:text-blue-400 underline"
              >
                Show all
              </button>
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* ── Open cases list ────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gavel className="h-5 w-5 text-muted-foreground" />
                  Open cases ({cases.length})
                </CardTitle>
                <Select
                  value={riskFilter}
                  onValueChange={(v) => setRiskFilter(v as HrRiskLevel | "all")}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter by risk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All risk levels</SelectItem>
                    <SelectItem value="black">Black</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="amber">Amber</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {cases.length === 0 ? (
                <EmptyState message="No cases match the selected risk level." />
              ) : (
                cases.map((c) => (
                  <div
                    key={c.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedCase(expandedCase === c.id ? null : c.id)
                      }
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-3 w-3 rounded-full flex-shrink-0",
                            RISK_DOT_COLOURS[c.riskLevel],
                          )}
                        />
                        <div>
                          <div className="font-medium text-sm">
                            {c.staffName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {CASE_TYPE_LABELS[c.caseType]} &middot;{" "}
                            {STATUS_LABELS[c.status]} &middot;{" "}
                            {c.daysSinceOpened} days
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.safeguardingStatus !== "not_safeguarding" && (
                          <Badge variant="destructive" className="text-xs">
                            Safeguarding
                          </Badge>
                        )}
                        {c.overdueTaskCount > 0 && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                            {c.overdueTaskCount} overdue
                          </Badge>
                        )}
                        {c.riOversightRequired && !c.riOversightCompleted && (
                          <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
                            RI pending
                          </Badge>
                        )}
                        {expandedCase === c.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                    {expandedCase === c.id && (
                      <div className="px-4 pb-4 border-t bg-muted/30">
                        <div className="grid grid-cols-2 gap-4 pt-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Risk level:</span>{" "}
                            <Badge className={cn("text-xs", RISK_COLOURS[c.riskLevel])}>
                              {formatRiskLevel(c.riskLevel)}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Case owner:</span>{" "}
                            {c.caseOwner}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Safeguarding:</span>{" "}
                            {c.safeguardingStatus.replace(/_/g, " ")}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last action:</span>{" "}
                            {c.lastActionAt}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Opened:</span>{" "}
                            {c.openedAt}
                          </div>
                          <div>
                            <span className="text-muted-foreground">RI oversight:</span>{" "}
                            {c.riOversightRequired
                              ? c.riOversightCompleted
                                ? "Completed"
                                : "Required — not yet completed"
                              : "Not required"}
                          </div>
                        </div>
                        {c.riskLevel === "black" || c.riskLevel === "red" ? (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-900 text-sm">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-red-800 dark:text-red-300">
                                  {c.riskLevel === "black"
                                    ? "Black-rated case — requires immediate RI oversight, daily review, and an active safeguarding response."
                                    : "Red-rated case — requires close management, regular review, and documented decision-making at each stage."}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right column ───────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Overdue tasks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-amber-600" />
                Overdue tasks ({totalOverdueTasks})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rawOverdueTasks.length === 0 ? (
                <EmptyState message="No overdue HR tasks." />
              ) : (
                rawOverdueTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 border rounded-lg text-sm space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{t.title}</span>
                      <Badge
                        variant={t.priority === "urgent" ? "destructive" : "outline"}
                        className="text-xs flex-shrink-0"
                      >
                        {t.priority}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {t.assignedTo} &middot; {t.daysOverdue} day{t.daysOverdue !== 1 ? "s" : ""} overdue
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* RI oversight pending */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-5 w-5 text-purple-600" />
                RI oversight pending ({riOversightPending.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {riOversightPending.length === 0 ? (
                <EmptyState message="All cases requiring RI oversight have been reviewed." />
              ) : (
                <div className="space-y-2">
                  {riOversightPending.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 border rounded-lg text-sm"
                    >
                      <div>
                        <div className="font-medium">{c.staffName}</div>
                        <div className="text-xs text-muted-foreground">
                          {CASE_TYPE_LABELS[c.caseType]} &middot;{" "}
                          {c.daysSinceOpened} days open
                        </div>
                      </div>
                      <Badge className={cn("text-xs", RISK_COLOURS[c.riskLevel])}>
                        {formatRiskLevel(c.riskLevel)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Safer recruitment position ───────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            Safer recruitment gate position
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {rawRecruitment.map((r) => (
              <div
                key={r.staffName}
                className={cn(
                  "p-4 border rounded-lg",
                  r.gateOutcome === "approved"
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
                    : r.gateOutcome === "blocked"
                      ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
                      : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{r.staffName}</span>
                  <Badge
                    className={cn(
                      "text-xs",
                      r.gateOutcome === "approved"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : r.gateOutcome === "blocked"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
                    )}
                  >
                    {r.gateOutcome === "approved"
                      ? "Approved"
                      : r.gateOutcome === "blocked"
                        ? "Blocked"
                        : "Senior risk acceptance"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {r.completedChecks} of {r.totalChecks} checks complete
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      r.gateOutcome === "approved"
                        ? "bg-green-500"
                        : r.gateOutcome === "blocked"
                          ? "bg-red-500"
                          : "bg-amber-500",
                    )}
                    style={{
                      width: `${(r.completedChecks / r.totalChecks) * 100}%`,
                    }}
                  />
                </div>
                {r.criticalMissing.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Outstanding:</span>{" "}
                    {r.criticalMissing.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Active suspensions ───────────────────────────────────────────── */}
      {activeSuspensions.length > 0 && (
        <Card className="mb-6 border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-400">
              <ShieldAlert className="h-5 w-5" />
              Active suspensions ({activeSuspensions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSuspensions.map((c) => (
              <div
                key={c.id}
                className="p-4 border border-red-100 dark:border-red-900/50 rounded-lg bg-red-50/50 dark:bg-red-950/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{c.staffName}</span>
                  <Badge variant="destructive" className="text-xs">
                    Day {c.daysSinceOpened} of suspension
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  {CASE_TYPE_LABELS[c.caseType]} &middot;{" "}
                  Safeguarding: {c.safeguardingStatus.replace(/_/g, " ")} &middot;{" "}
                  Last reviewed: {c.lastActionAt}
                </div>
                <div className="p-3 bg-white dark:bg-gray-900 rounded border text-sm">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-muted-foreground">
                      <span className="font-medium text-foreground">ARIA suggested review:</span>{" "}
                      Suspension has been in place for {c.daysSinceOpened} days. Regulation and ACAS guidance
                      require that suspensions are reviewed regularly and are not left open-ended.
                      The manager should confirm: is the investigation progressing? Has a welfare
                      contact been made this week? Is continued suspension still the least
                      restrictive proportionate measure? Document the review and rationale.
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    ARIA suggested draft — the Registered Manager confirms the review.
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── ARIA professional insight ────────────────────────────────────── */}
      <Card className="border-blue-200 dark:border-blue-900">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-blue-600" />
            ARIA — command centre insight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
              <p className="mb-3">
                <span className="font-medium text-foreground">Position summary:</span>{" "}
                The home is currently managing {rawCases.length} open HR cases across{" "}
                {Object.entries(riskCounts)
                  .filter(([, v]) => v > 0)
                  .map(([k, v]) => `${v} ${formatRiskLevel(k as HrRiskLevel).toLowerCase()}`)
                  .join(", ")}
                {" "}risk levels.{" "}
                {activeSuspensions.length > 0 &&
                  `${activeSuspensions.length} active suspension${activeSuspensions.length > 1 ? "s" : ""} require${activeSuspensions.length === 1 ? "s" : ""} regular review. `}
                {safeguardingLinked.length > 0 &&
                  `${safeguardingLinked.length} case${safeguardingLinked.length > 1 ? "s are" : " is"} safeguarding-linked. `}
                {totalOverdueTasks > 0 &&
                  `${totalOverdueTasks} HR task${totalOverdueTasks > 1 ? "s are" : " is"} overdue — these should be addressed promptly to maintain an auditable trail. `}
                {riOversightPending.length > 0 &&
                  `${riOversightPending.length} case${riOversightPending.length > 1 ? "s" : ""} await${riOversightPending.length === 1 ? "s" : ""} RI oversight. `}
              </p>
              <p className="mb-3">
                <span className="font-medium text-foreground">What an inspector would look for:</span>{" "}
                Evidence that the Registered Manager and Responsible Individual have an accurate,
                up-to-date picture of the HR position. That safeguarding-linked cases are being
                managed with appropriate urgency and external consultation. That suspensions are
                reviewed regularly and are not left without contact or progress. That overdue
                actions are escalated rather than left to drift.
              </p>
              <p>
                <span className="font-medium text-foreground">Professional observation:</span>{" "}
                {riskCounts.black > 0
                  ? "A black-rated case is active. This demands daily management attention, RI oversight, and documented rationale at every decision point. The case file should show a clear chronology, evidence of external advice sought, and the child impact assessment."
                  : riskCounts.red > 0
                    ? "Red-rated cases are active. The manager should ensure each case has a clear plan, documented decisions, and regular review points. Where cases have been open for more than 14 days, a review of progress and proportionality is advisable."
                    : totalOverdueTasks > 0
                      ? "The current case profile is manageable, but overdue tasks suggest some drift in follow-through. Addressing these promptly will strengthen the audit trail and demonstrate active management."
                      : "The current HR risk profile is stable. Maintaining regular oversight reviews and keeping the safer recruitment position up to date will evidence proactive management to any inspector."}
              </p>
            </div>
            <p className="text-xs italic">
              ARIA suggested draft — the Registered Manager reviews and takes action as they see fit.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Regulatory note ──────────────────────────────────────────────── */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground">
        <p className="font-medium mb-1">Regulatory context</p>
        <p>
          Children&apos;s Homes (England) Regulations 2015, Reg 32 (fitness of workers to work with children)
          and Reg 33 (employment of staff). Working Together to Safeguard Children 2023.
          ACAS Code of Practice on Disciplinary and Grievance Procedures.
          Keeping Children Safe in Education 2024 (where regulated activity applies).
          The Registered Manager has overall responsibility for safer recruitment, HR compliance,
          and ensuring that workforce concerns are managed in a way that protects children.
        </p>
      </div>
    </PageShell>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon,
  accent,
  alert,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  alert?: boolean;
}) {
  return (
    <Card className={cn(alert && value > 0 && "border-orange-200 dark:border-orange-900")}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={accent}>{icon}</span>
          {alert && value > 0 && (
            <CircleDot className="h-3 w-3 text-orange-500 animate-pulse" />
          )}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
