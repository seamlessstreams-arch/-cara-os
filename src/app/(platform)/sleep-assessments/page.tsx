"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  ChevronUp,
  ChevronDown,
  Moon,
  Sun,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowUpDown,
  CheckCircle2,
  Home,
  Loader2,
} from "lucide-react";
import { useSleepAssessmentRecords } from "@/hooks/use-sleep-assessment-records";
import type { SleepAssessmentRecord, SleepAssessmentStatus, SleepAssessmentQuality, SleepAssessmentTrend } from "@/types/extended";
import {
  SLEEP_ASSESSMENT_STATUS_LABEL,
  SLEEP_ASSESSMENT_QUALITY_LABEL,
  SLEEP_ASSESSMENT_TREND_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ─── local config ─── */

const STATUS_CLR: Record<SleepAssessmentStatus, string> = {
  active: "bg-green-100 text-green-800",
  concern: "bg-red-100 text-red-800",
  improving: "bg-blue-100 text-blue-800",
  needs_review: "bg-amber-100 text-amber-800",
};

const QUALITY_CLR: Record<SleepAssessmentQuality, string> = {
  good: "text-green-700 bg-green-50",
  fair: "text-amber-700 bg-amber-50",
  poor: "text-red-700 bg-red-50",
};

const QUALITY_ICON_CLR: Record<SleepAssessmentQuality, { bg: string; fg: string }> = {
  good: { bg: "bg-green-100", fg: "text-green-600" },
  fair: { bg: "bg-amber-100", fg: "text-amber-600" },
  poor: { bg: "bg-red-100", fg: "text-red-600" },
};

/* ─── component ─── */

export default function SleepAssessmentsPage() {
  const { data: records = [], isLoading } = useSleepAssessmentRecords();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.assessment_date.localeCompare(a.assessment_date);
        case "hours":
          return a.average_hours - b.average_hours;
        case "quality": {
          const qOrder: Record<SleepAssessmentQuality, number> = { poor: 0, fair: 1, good: 2 };
          return qOrder[a.sleep_quality] - qOrder[b.sleep_quality];
        }
        case "name":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default:
          return 0;
      }
    });
    return list;
  }, [records, filterStatus, sortBy]);

  const stats = useMemo(() => {
    if (records.length === 0) return { avgHours: "0", concerns: 0, improving: 0 };
    const avgHours = records.reduce((s, a) => s + a.average_hours, 0) / records.length;
    const concerns = records.filter((a) => a.status === "concern").length;
    const improving = records.filter((a) => a.trend === "improving").length;
    return { avgHours: avgHours.toFixed(1), concerns, improving };
  }, [records]);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const trendIcon = (trend: SleepAssessmentTrend) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "stable":
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case "declining":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const exportCols: ExportColumn<SleepAssessmentRecord>[] = [
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Assessed By", accessor: (r) => getStaffName(r.assessed_by) },
    { header: "Date", accessor: (r) => r.assessment_date },
    { header: "Status", accessor: (r) => SLEEP_ASSESSMENT_STATUS_LABEL[r.status] },
    { header: "Avg Hours", accessor: (r) => r.average_hours.toString() },
    { header: "Quality", accessor: (r) => SLEEP_ASSESSMENT_QUALITY_LABEL[r.sleep_quality] },
    { header: "Trend", accessor: (r) => SLEEP_ASSESSMENT_TREND_LABEL[r.trend] },
    { header: "Settling Time", accessor: (r) => r.settling_time },
    { header: "Night Wakings", accessor: (r) => r.night_wakings.toString() },
    { header: "Impact", accessor: (r) => r.impact_on_daytime },
    { header: "Review Due", accessor: (r) => r.review_date },
  ];

  if (isLoading) {
    return (
      <PageShell title="Sleep Assessments" subtitle="Individual sleep profiles, barriers, strategies, and monitoring for each young person">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Sleep Assessments"
      subtitle="Individual sleep profiles, barriers, strategies, and monitoring for each young person"
      caraContext={{ pageTitle: "Sleep Assessments", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="sleep-assessments" />
          <PrintButton title="Sleep Assessments" />
          <CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{records.length}</p>
            <p className="text-xs text-muted-foreground">Active Assessments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.avgHours}h</p>
            <p className="text-xs text-muted-foreground">Avg Sleep (team)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.concerns}</p>
            <p className="text-xs text-muted-foreground">Concerns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.improving}</p>
            <p className="text-xs text-muted-foreground">Improving</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── alert ─── */}
      {stats.concerns > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Sleep Concern Active</p>
              <p className="text-xs text-red-700 mt-1">
                {records
                  .filter((a) => a.status === "concern")
                  .map((a) => getYPName(a.child_id))
                  .join(", ")}{" "}
                — review strategies and consider escalation to health professionals.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── filters ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {(Object.keys(SLEEP_ASSESSMENT_STATUS_LABEL) as SleepAssessmentStatus[]).map((k) => (
            <option key={k} value={k}>{SLEEP_ASSESSMENT_STATUS_LABEL[k]}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Assessment Date</option>
            <option value="hours">Sleep Hours</option>
            <option value="quality">Quality</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* ─── assessment cards ─── */}
      <div className="space-y-4">
        {filtered.map((assessment) => {
          const expanded = expandedId === assessment.id;
          const qIcon = QUALITY_ICON_CLR[assessment.sleep_quality];

          return (
            <Card key={assessment.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(assessment.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full", qIcon.bg)}>
                      <Moon className={cn("h-5 w-5", qIcon.fg)} />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {getYPName(assessment.child_id)}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={STATUS_CLR[assessment.status]}>{SLEEP_ASSESSMENT_STATUS_LABEL[assessment.status]}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          {trendIcon(assessment.trend)}
                          {SLEEP_ASSESSMENT_TREND_LABEL[assessment.trend]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {assessment.average_hours}h avg
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Assessed</p>
                      <p className="text-sm">{assessment.assessment_date}</p>
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-5">
                  {/* sleep patterns */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Sleep Patterns
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-md p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Weekday</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Target: {assessment.sleep_patterns.weekday.target}</span>
                          <span className="text-sm">Actual: {assessment.sleep_patterns.weekday.actual}</span>
                        </div>
                      </div>
                      <div className="border rounded-md p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Weekend</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Target: {assessment.sleep_patterns.weekend.target}</span>
                          <span className="text-sm">Actual: {assessment.sleep_patterns.weekend.actual}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* quality metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="border rounded-md p-2 text-center">
                      <p className="text-xs text-muted-foreground">Avg Hours</p>
                      <p className="text-lg font-bold">{assessment.average_hours}</p>
                    </div>
                    <div className={cn("border rounded-md p-2 text-center", QUALITY_CLR[assessment.sleep_quality])}>
                      <p className="text-xs">Quality</p>
                      <p className="text-lg font-bold capitalize">{SLEEP_ASSESSMENT_QUALITY_LABEL[assessment.sleep_quality]}</p>
                    </div>
                    <div className="border rounded-md p-2 text-center">
                      <p className="text-xs text-muted-foreground">Settling</p>
                      <p className="text-sm font-medium">{assessment.settling_time}</p>
                    </div>
                    <div className="border rounded-md p-2 text-center">
                      <p className="text-xs text-muted-foreground">Night Wakings</p>
                      <p className="text-lg font-bold">{assessment.night_wakings}</p>
                    </div>
                  </div>

                  {/* bedtime routine */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Moon className="h-4 w-4" /> Bedtime Routine
                    </p>
                    <ol className="space-y-1">
                      {assessment.bedtime_routine.map((step, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-xs font-medium text-foreground bg-muted rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* barriers */}
                  <div>
                    <p className="text-sm font-medium mb-2 text-red-700 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Barriers to Sleep
                    </p>
                    <ul className="space-y-1">
                      {assessment.barriers.map((b, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-red-400 mt-1.5">•</span> {b}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* strategies */}
                  <div>
                    <p className="text-sm font-medium mb-2 text-green-700 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Strategies
                    </p>
                    <ul className="space-y-1">
                      {assessment.strategies.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-green-400 mt-1.5">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* environment */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Home className="h-4 w-4" /> Environmental Factors
                    </p>
                    <ul className="space-y-1">
                      {assessment.environmental_factors.map((ef, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-blue-400 mt-1.5">•</span> {ef}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* medications & referrals */}
                  {(assessment.medications || assessment.referrals) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {assessment.medications && (
                        <div className="border border-purple-200 rounded-md p-3 bg-purple-50">
                          <p className="text-xs font-medium text-purple-800">Medications</p>
                          <p className="text-sm text-purple-700 mt-1">{assessment.medications}</p>
                        </div>
                      )}
                      {assessment.referrals && (
                        <div className="border border-indigo-200 rounded-md p-3 bg-indigo-50">
                          <p className="text-xs font-medium text-indigo-800">Referrals</p>
                          <p className="text-sm text-indigo-700 mt-1">{assessment.referrals}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* daytime impact */}
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-2">
                      <Sun className="h-4 w-4" /> Impact on Daytime Functioning
                    </p>
                    <p className="text-sm text-muted-foreground">{assessment.impact_on_daytime}</p>
                  </div>

                  {/* notes */}
                  <div className="bg-muted/30 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Clinical Notes</p>
                    <p className="text-sm text-muted-foreground">{assessment.notes}</p>
                  </div>

                  {/* footer */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Assessed By</p>
                      <p className="text-sm font-medium">{getStaffName(assessment.assessed_by)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Review Due</p>
                      <p className="text-sm font-medium">{assessment.review_date}</p>
                    </div>
                  </div>

                  <SmartLinkPanel sourceType="sleep-assessments" sourceId={assessment.id} childId={assessment.child_id} compact />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-[var(--cs-border)] rounded-lg p-4">
        <p className="text-sm font-medium text-[var(--cs-text-secondary)] mb-1">Regulatory Context</p>
        <p className="text-xs text-[var(--cs-text-secondary)]">
          Quality Standard 6 (Health and Wellbeing) requires that children&apos;s physical health
          needs are understood and met, which includes adequate sleep. Regulation 10 (Health and
          Wellbeing) requires that the health needs of each child are identified and appropriate
          steps taken. Sleep assessments inform bedtime boundaries (Reg 19), night staffing
          arrangements, and individual care plans.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Health & Sleep"
        category={["health", "sleep"]}
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Sleep Assessments — child sleep assessments, sleep disturbance, sleep interventions, bedtime routines, sleep quality evidence, care plan evidence, health assessment evidence, Reg 45 wellbeing evidence"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
