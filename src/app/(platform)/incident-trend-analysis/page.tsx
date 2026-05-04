"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown, ChevronUp, ArrowUpDown, Search, TrendingDown, TrendingUp,
  AlertTriangle, BookOpen, Lightbulb, Clock, Users, Calendar, Target,
  CheckCircle2, BarChart3, MapPin, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type ActionStatus = "completed" | "in_progress" | "not_started" | "overdue";

interface PreventionAction {
  action: string;
  owner: string;
  deadline: string;
  status: ActionStatus;
}

interface TrendRecord {
  id: string;
  period: string;
  totalIncidents: number;
  incidentTypeBreakdown: Record<string, number>;
  childrenInvolved: string[];
  topTriggers: string[];
  timeOfDayPatterns: Record<string, number>;
  dayOfWeekPatterns: Record<string, number>;
  staffOnDutyPatterns: string;
  keyLearning: string[];
  preventionActions: PreventionAction[];
  reductionVsPrevious: number;
  analyst: string;
  reviewDate: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const STATUS_LABEL: Record<ActionStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  not_started: "Not Started",
  overdue: "Overdue",
};

const STATUS_CLR: Record<ActionStatus, string> = {
  completed: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  not_started: "bg-slate-100 text-slate-700",
  overdue: "bg-red-100 text-red-800",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: TrendRecord[] = [
  {
    id: "trend_q1_2026",
    period: "Q1 2026",
    totalIncidents: 14,
    incidentTypeBreakdown: {
      "Verbal aggression": 5,
      "Physical aggression": 2,
      "Property damage": 3,
      "Self-harm": 1,
      "Missing from care": 2,
      "Substance use": 1,
    },
    childrenInvolved: ["yp_alex", "yp_jordan", "yp_casey"],
    topTriggers: [
      "School demands / homework refusal",
      "Peer conflict in shared spaces",
      "Transition between activities",
      "Contact with family (Alex)",
    ],
    timeOfDayPatterns: { Morning: 2, Afternoon: 4, Evening: 7, Night: 1 },
    dayOfWeekPatterns: { Mon: 3, Tue: 2, Wed: 1, Thu: 2, Fri: 4, Sat: 1, Sun: 1 },
    staffOnDutyPatterns:
      "Highest incident concentration during Friday late shifts. Agency staff cover correlates with 35% of physical incidents. Core team shifts (Ryan, Darren) show notably lower escalation rates.",
    keyLearning: [
      "Friday evening transitions (school finish to dinner) remain a high-risk window — sensory load and weekend uncertainty.",
      "Agency staff briefings need to include Alex's contact-day vulnerability and Casey's sensory triggers.",
      "Homework support strategy is reducing morning incidents materially vs Q4.",
      "Casey's de-escalation plan v3 (introduced January) is showing measurable benefit.",
    ],
    preventionActions: [
      { action: "Embed Friday evening 'low-demand' protocol — quiet activity, smaller groups", owner: "staff_darren", deadline: d(45), status: "in_progress" },
      { action: "Refresh agency staff induction pack with YP-specific triggers", owner: "staff_ryan", deadline: d(20), status: "in_progress" },
      { action: "Roll out post-contact debrief routine for Alex (every contact day)", owner: "staff_darren", deadline: d(14), status: "completed" },
      { action: "Trial sensory toolkit in shared lounge", owner: "staff_ryan", deadline: d(60), status: "not_started" },
    ],
    reductionVsPrevious: -22,
    analyst: "staff_darren",
    reviewDate: d(-7),
  },
  {
    id: "trend_q4_2025",
    period: "Q4 2025",
    totalIncidents: 18,
    incidentTypeBreakdown: {
      "Verbal aggression": 7,
      "Physical aggression": 4,
      "Property damage": 3,
      "Self-harm": 1,
      "Missing from care": 2,
      "Substance use": 1,
    },
    childrenInvolved: ["yp_alex", "yp_jordan", "yp_casey"],
    topTriggers: [
      "School exclusion period (Jordan)",
      "Christmas / family contact pressures",
      "Peer conflict",
      "Disrupted routine over holidays",
    ],
    timeOfDayPatterns: { Morning: 4, Afternoon: 5, Evening: 8, Night: 1 },
    dayOfWeekPatterns: { Mon: 4, Tue: 3, Wed: 2, Thu: 2, Fri: 4, Sat: 2, Sun: 1 },
    staffOnDutyPatterns:
      "Holiday period saw heavy reliance on agency cover (Christmas / New Year). Two physical incidents occurred during agency-only shifts. Ryan's structured holiday plan (introduced mid-December) reduced incidents in final fortnight.",
    keyLearning: [
      "Holiday breaks need a dedicated structured plan — boredom and unstructured time were major drivers.",
      "Jordan's school exclusion (3 weeks in November) created a clear incident spike — exclusion contingency plan needed.",
      "Christmas family contact requires more pre/post planning and emotional preparation.",
      "Agency-only shifts must be avoided during high-risk periods where possible.",
    ],
    preventionActions: [
      { action: "Develop holiday structured-day template", owner: "staff_ryan", deadline: d(-30), status: "completed" },
      { action: "Create school exclusion contingency plan", owner: "staff_darren", deadline: d(-45), status: "completed" },
      { action: "Restrict agency-only shifts during Christmas week (rota policy)", owner: "staff_darren", deadline: d(-15), status: "completed" },
      { action: "Pre/post contact emotional prep guide for Alex", owner: "staff_darren", deadline: d(-10), status: "completed" },
    ],
    reductionVsPrevious: 13,
    analyst: "staff_darren",
    reviewDate: "2026-01-12",
  },
  {
    id: "trend_q3_2025",
    period: "Q3 2025",
    totalIncidents: 16,
    incidentTypeBreakdown: {
      "Verbal aggression": 6,
      "Physical aggression": 3,
      "Property damage": 4,
      "Self-harm": 0,
      "Missing from care": 2,
      "Substance use": 1,
    },
    childrenInvolved: ["yp_alex", "yp_jordan", "yp_casey"],
    topTriggers: [
      "Return to school (September)",
      "Casey's transition into placement (settling phase)",
      "Peer conflict over shared spaces",
      "Curfew negotiations (Jordan)",
    ],
    timeOfDayPatterns: { Morning: 3, Afternoon: 4, Evening: 8, Night: 1 },
    dayOfWeekPatterns: { Mon: 3, Tue: 3, Wed: 2, Thu: 2, Fri: 3, Sat: 2, Sun: 1 },
    staffOnDutyPatterns:
      "September return-to-school period was a notable spike. Casey's first 6 weeks generated 5 incidents (settling period — expected). Senior staff coverage during Casey's settling phase reduced severity.",
    keyLearning: [
      "September return-to-school is a known vulnerability — needs proactive preparation, not reactive response.",
      "New placement settling periods (first 6-8 weeks) require enhanced supervision and predictable routine.",
      "Curfew rules are clearer when negotiated collaboratively with Jordan rather than imposed.",
      "Sharing the kitchen/lounge generates predictable conflict — needs structured 'space rota' in busy windows.",
    ],
    preventionActions: [
      { action: "Build September return-to-school playbook", owner: "staff_ryan", deadline: d(-90), status: "completed" },
      { action: "Refine new admission settling plan template", owner: "staff_darren", deadline: d(-75), status: "completed" },
      { action: "Co-produce curfew framework with Jordan", owner: "staff_darren", deadline: d(-60), status: "completed" },
      { action: "Introduce shared-space rota during peak hours", owner: "staff_ryan", deadline: d(-50), status: "completed" },
    ],
    reductionVsPrevious: -27,
    analyst: "staff_darren",
    reviewDate: "2025-10-09",
  },
  {
    id: "trend_q2_2025",
    period: "Q2 2025",
    totalIncidents: 22,
    incidentTypeBreakdown: {
      "Verbal aggression": 8,
      "Physical aggression": 5,
      "Property damage": 5,
      "Self-harm": 1,
      "Missing from care": 2,
      "Substance use": 1,
    },
    childrenInvolved: ["yp_alex", "yp_jordan"],
    topTriggers: [
      "Exam period (May/June) — Jordan & Alex",
      "Family contact disruption (Alex)",
      "Peer conflict",
      "Rule challenges (early summer freedom)",
    ],
    timeOfDayPatterns: { Morning: 5, Afternoon: 6, Evening: 9, Night: 2 },
    dayOfWeekPatterns: { Mon: 4, Tue: 3, Wed: 3, Thu: 3, Fri: 5, Sat: 3, Sun: 1 },
    staffOnDutyPatterns:
      "Pre-exam period overwhelmed core team — relied heavily on agency cover. Evening shifts disproportionately affected. No clear correlation with specific staff members beyond agency vs core split.",
    keyLearning: [
      "Exam periods need dedicated wellbeing planning — sleep, nutrition, low-demand environment.",
      "Alex's contact disruptions (cancellations) were under-recognised as a trigger — now flagged proactively.",
      "Evening incident clustering needs structural attention (shift planning, activity programming).",
      "Early summer 'freedom expectation' — needs collaborative boundary-setting in May rather than reactive limits in June.",
    ],
    preventionActions: [
      { action: "Develop exam-period wellbeing protocol", owner: "staff_darren", deadline: d(-150), status: "completed" },
      { action: "Add contact-cancellation alert to Alex's care plan", owner: "staff_darren", deadline: d(-140), status: "completed" },
      { action: "Restructure evening activity programme", owner: "staff_ryan", deadline: d(-130), status: "completed" },
      { action: "Annual May 'summer expectations' meeting with each YP", owner: "staff_darren", deadline: d(-120), status: "completed" },
    ],
    reductionVsPrevious: 0,
    analyst: "staff_darren",
    reviewDate: "2025-07-08",
  },
];

/* ── ui helpers ─────────────────────────────────────────────────────────────── */

function ReductionBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <Badge variant="outline" className="bg-slate-100 text-slate-700">
        No change vs previous
      </Badge>
    );
  }
  const positive = value < 0; // negative number = reduction = good
  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1",
        positive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
      )}
    >
      {positive ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
      {positive ? `${Math.abs(value)}% reduction` : `${value}% increase`}
    </Badge>
  );
}

function MiniBarChart({
  data,
  colorClass,
}: {
  data: Record<string, number>;
  colorClass: string;
}) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="space-y-1">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2 text-xs">
          <div className="w-20 text-muted-foreground">{k}</div>
          <div className="flex-1 bg-slate-100 rounded h-3 overflow-hidden">
            <div
              className={cn("h-full rounded", colorClass)}
              style={{ width: `${(v / max) * 100}%` }}
            />
          </div>
          <div className="w-6 text-right font-medium">{v}</div>
        </div>
      ))}
    </div>
  );
}

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function IncidentTrendAnalysisPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(SEED[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.period.toLowerCase().includes(q) ||
          r.topTriggers.some((t) => t.toLowerCase().includes(q)) ||
          r.keyLearning.some((l) => l.toLowerCase().includes(q)),
      );
    }
    rows.sort((a, b) =>
      sortBy === "newest"
        ? b.reviewDate.localeCompare(a.reviewDate)
        : a.reviewDate.localeCompare(b.reviewDate),
    );
    return rows;
  }, [data, search, sortBy]);

  // Most recent record for the headline stats (assume index 0 of SEED is current quarter)
  const current = SEED[0];
  const previous = SEED[1];
  const periodChange = current.reductionVsPrevious;
  const openActions = current.preventionActions.filter(
    (a) => a.status !== "completed",
  ).length;
  const learningItems = current.keyLearning.length;

  const exportCols: ExportColumn<TrendRecord>[] = [
    { header: "Period", accessor: (r: TrendRecord) => r.period },
    { header: "Total Incidents", accessor: (r: TrendRecord) => String(r.totalIncidents) },
    {
      header: "Change vs Previous (%)",
      accessor: (r: TrendRecord) => `${r.reductionVsPrevious}`,
    },
    {
      header: "Children Involved",
      accessor: (r: TrendRecord) => r.childrenInvolved.map((id) => getYPName(id)).join("; "),
    },
    {
      header: "Top Triggers",
      accessor: (r: TrendRecord) => r.topTriggers.join("; "),
    },
    {
      header: "Type Breakdown",
      accessor: (r: TrendRecord) =>
        Object.entries(r.incidentTypeBreakdown)
          .map(([k, v]) => `${k}: ${v}`)
          .join("; "),
    },
    {
      header: "Key Learning",
      accessor: (r: TrendRecord) => r.keyLearning.join(" | "),
    },
    {
      header: "Prevention Actions",
      accessor: (r: TrendRecord) =>
        r.preventionActions
          .map(
            (a) =>
              `${a.action} (owner: ${getStaffName(a.owner)}, due: ${a.deadline}, ${STATUS_LABEL[a.status]})`,
          )
          .join(" | "),
    },
    {
      header: "Staff On-Duty Pattern",
      accessor: (r: TrendRecord) => r.staffOnDutyPatterns,
    },
    { header: "Analyst", accessor: (r: TrendRecord) => getStaffName(r.analyst) },
    { header: "Review Date", accessor: (r: TrendRecord) => r.reviewDate },
  ];

  return (
    <PageShell
      title="Incident Trend Analysis"
      subtitle="Quarterly Pattern Reports · Triggers · Hotspots · Learning"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Incident Trend Analysis" />
          <ExportButton data={data} columns={exportCols} filename="incident-trend-analysis" />
        </div>
      }
    >
      <div id="print-area">
        {/* ── Summary Stats ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <BarChart3 className="h-5 w-5 mx-auto mb-1 text-blue-600" />
              <p className="text-2xl font-bold">{current.totalIncidents}</p>
              <p className="text-xs text-muted-foreground">{current.period} Incidents</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              {periodChange < 0 ? (
                <TrendingDown className="h-5 w-5 mx-auto mb-1 text-green-600" />
              ) : periodChange > 0 ? (
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-red-600" />
              ) : (
                <Activity className="h-5 w-5 mx-auto mb-1 text-slate-500" />
              )}
              <p
                className={cn(
                  "text-2xl font-bold",
                  periodChange < 0 && "text-green-700",
                  periodChange > 0 && "text-red-700",
                )}
              >
                {periodChange === 0
                  ? "0%"
                  : periodChange < 0
                    ? `${Math.abs(periodChange)}%`
                    : `+${periodChange}%`}
              </p>
              <p className="text-xs text-muted-foreground">
                vs {previous?.period ?? "Last Quarter"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <Target className="h-5 w-5 mx-auto mb-1 text-amber-600" />
              <p className="text-2xl font-bold">{openActions}</p>
              <p className="text-xs text-muted-foreground">Prevention Actions Open</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <Lightbulb className="h-5 w-5 mx-auto mb-1 text-purple-600" />
              <p className="text-2xl font-bold">{learningItems}</p>
              <p className="text-xs text-muted-foreground">Key Learning Items</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search by period, trigger, or learning..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Trend Cards ─────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            const positive = r.reductionVsPrevious < 0;
            const negative = r.reductionVsPrevious > 0;
            return (
              <Card
                key={r.id}
                className={cn(
                  "border-l-4",
                  positive && "border-l-green-500",
                  negative && "border-l-red-500",
                  r.reductionVsPrevious === 0 && "border-l-slate-300",
                )}
              >
                <CardHeader
                  className="pb-2 cursor-pointer"
                  onClick={() => setExpandedId(isOpen ? null : r.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {r.period}
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {r.totalIncidents} incidents
                        </Badge>
                        <ReductionBadge value={r.reductionVsPrevious} />
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Reviewed {r.reviewDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {r.childrenInvolved.length} YP involved
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          Analyst: {getStaffName(r.analyst)}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* Children involved */}
                    <div>
                      <p className="font-medium mb-1 text-xs">Children Involved</p>
                      <div className="flex flex-wrap gap-1">
                        {r.childrenInvolved.map((id) => (
                          <Badge
                            key={id}
                            variant="outline"
                            className="bg-slate-50 text-slate-700 text-xs"
                          >
                            {getYPName(id)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Incident Type Breakdown */}
                    <div className="bg-slate-50 border rounded p-3">
                      <p className="font-medium mb-2 text-xs flex items-center gap-1">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Incident Type Breakdown
                      </p>
                      <MiniBarChart
                        data={r.incidentTypeBreakdown}
                        colorClass="bg-blue-500"
                      />
                    </div>

                    {/* Top Triggers */}
                    <div>
                      <p className="font-medium mb-1 text-xs flex items-center gap-1 text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Top Triggers
                      </p>
                      <ul className="space-y-1">
                        {r.topTriggers.map((t, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <span className="text-amber-500 mt-0.5">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Time + Day patterns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-purple-50 border border-purple-200 rounded p-3">
                        <p className="font-medium mb-2 text-xs flex items-center gap-1 text-purple-800">
                          <Clock className="h-3.5 w-3.5" />
                          Time of Day
                        </p>
                        <MiniBarChart
                          data={r.timeOfDayPatterns}
                          colorClass="bg-purple-500"
                        />
                      </div>
                      <div className="bg-indigo-50 border border-indigo-200 rounded p-3">
                        <p className="font-medium mb-2 text-xs flex items-center gap-1 text-indigo-800">
                          <Calendar className="h-3.5 w-3.5" />
                          Day of Week
                        </p>
                        <MiniBarChart
                          data={r.dayOfWeekPatterns}
                          colorClass="bg-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Staff on duty pattern */}
                    <div className="bg-cyan-50 border border-cyan-200 rounded p-3">
                      <p className="font-medium text-xs text-cyan-800 mb-1 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        Staffing Patterns / Hotspots
                      </p>
                      <p className="text-xs text-cyan-900">{r.staffOnDutyPatterns}</p>
                    </div>

                    {/* Key learning */}
                    <div>
                      <p className="font-medium mb-1 text-xs flex items-center gap-1 text-purple-700">
                        <Lightbulb className="h-3.5 w-3.5" />
                        Key Learning
                      </p>
                      <ul className="space-y-1">
                        {r.keyLearning.map((l, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs bg-purple-50 border border-purple-100 rounded p-2"
                          >
                            <Lightbulb className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                            <span>{l}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Prevention actions */}
                    <div>
                      <p className="font-medium mb-1 text-xs flex items-center gap-1 text-blue-700">
                        <Target className="h-3.5 w-3.5" />
                        Prevention Actions
                      </p>
                      <div className="space-y-1.5">
                        {r.preventionActions.map((a, i) => (
                          <div
                            key={i}
                            className="bg-muted/40 rounded p-2 flex items-start justify-between gap-3"
                          >
                            <div className="flex-1">
                              <p className="text-xs font-medium">{a.action}</p>
                              <p className="text-[11px] text-muted-foreground">
                                Owner: {getStaffName(a.owner)} · Deadline: {a.deadline}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(STATUS_CLR[a.status], "text-[10px]")}
                            >
                              {a.status === "completed" && (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              )}
                              {STATUS_LABEL[a.status]}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── Regulatory Note ─────────────────────────────────────────────── */}
        <div className="mt-8 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Context</p>
          <p>
            Quarterly incident trend analysis underpins the Registered Manager&apos;s duty under
            Regulation 45 (review of quality of care) of the Children&apos;s Homes (England)
            Regulations 2015. It demonstrates the home&apos;s use of intelligence to identify
            triggers, hotspots, and learning, and to drive measurable preventative action —
            evidence required for Quality Standard 5 (the protection of children) and
            triangulated with Reg 44 visitor reports, ARIA pattern alerts, and individual
            behaviour-support plans. Period-over-period comparison evidences whether
            interventions are reducing incident frequency and severity, supporting Ofsted&apos;s
            Social Care Common Inspection Framework (SCCIF) judgements on leadership and
            management.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
