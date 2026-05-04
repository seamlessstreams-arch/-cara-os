"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
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
} from "lucide-react";

/* ─── date helper ─── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ─── types ─── */
interface SleepPattern {
  weekday: { target: string; actual: string };
  weekend: { target: string; actual: string };
}

interface SleepAssessment {
  id: string;
  youngPersonId: string;
  assessedBy: string;
  assessmentDate: string;
  reviewDate: string;
  status: "active" | "needs_review" | "improving" | "concern";
  sleepPatterns: SleepPattern;
  averageHours: number;
  sleepQuality: "good" | "fair" | "poor";
  settlingTime: string;
  nightWakings: number;
  bedtimeRoutine: string[];
  barriers: string[];
  strategies: string[];
  environmentalFactors: string[];
  medications: string | null;
  referrals: string | null;
  impactOnDaytime: string;
  trend: "improving" | "stable" | "declining";
  notes: string;
}

/* ─── seed data ─── */
const assessments: SleepAssessment[] = [
  {
    id: "sa_001",
    youngPersonId: "yp_alex",
    assessedBy: "staff_anna",
    assessmentDate: d(-14),
    reviewDate: d(14),
    status: "active",
    sleepPatterns: {
      weekday: { target: "21:30", actual: "22:00" },
      weekend: { target: "22:00", actual: "22:30" },
    },
    averageHours: 8.5,
    sleepQuality: "good",
    settlingTime: "20-30 minutes",
    nightWakings: 0,
    bedtimeRoutine: [
      "Shower at 20:45",
      "Hot chocolate and chat with staff",
      "Reading in bed from 21:15",
      "Lights out 21:30",
    ],
    barriers: ["Occasionally anxious about next-day school events", "Blue light from phone before bed"],
    strategies: [
      "Worry journal before bed — write down concerns and 'park' them for tomorrow",
      "Phone charging station outside bedroom from 21:00",
      "Lavender pillow spray — Alex chose this",
      "Staff available for chat if settling is difficult",
    ],
    environmentalFactors: ["Blackout curtains fitted", "White noise machine available (Alex chooses to use)", "Room temperature maintained at 18°C"],
    medications: null,
    referrals: null,
    impactOnDaytime: "Well-rested. Good concentration at school. Positive mood in mornings.",
    trend: "stable",
    notes: "Alex's sleep has been consistently good since the worry journal was introduced 2 months ago. Phone boundary initially resisted but now accepted as helpful.",
  },
  {
    id: "sa_002",
    youngPersonId: "yp_jordan",
    assessedBy: "staff_anna",
    assessmentDate: d(-7),
    reviewDate: d(7),
    status: "concern",
    sleepPatterns: {
      weekday: { target: "21:00", actual: "23:00–01:00" },
      weekend: { target: "21:30", actual: "00:00–02:00" },
    },
    averageHours: 5.5,
    sleepQuality: "poor",
    settlingTime: "90-120 minutes",
    nightWakings: 2,
    bedtimeRoutine: [
      "Attempt wind-down at 20:30 with sensory activity",
      "Staff sit with Jordan if requested",
      "Audio book or music to settle",
      "Night light remains on (darkness is a trigger)",
    ],
    barriers: [
      "Hypervigilance — legacy of early trauma (night-time abuse)",
      "Sensory processing difficulties — heightened auditory awareness at night",
      "Anxiety about not being able to fall asleep compounds the problem",
      "Nightmares 2-3 times per week",
    ],
    strategies: [
      "Weighted blanket (Jordan's choice — 5kg)",
      "Night light with colour-changing option (currently on warm amber)",
      "Staff check every 30 min until asleep — agreed with Jordan",
      "Grounding techniques practised with therapist for nightmare recovery",
      "No pressure to sleep — 'rest is enough' messaging",
      "CAMHS consultation re: melatonin appropriateness",
    ],
    environmentalFactors: [
      "Night light always on (agreed — not negotiable for Jordan)",
      "Door slightly ajar (Jordan's choice)",
      "Room closest to staff sleep-in for reassurance",
      "Reduced auditory stimulation — carpet, soft-close door",
    ],
    medications: "Melatonin 2mg being considered — CAMHS referral in progress",
    referrals: "CAMHS sleep clinic — appointment " + d(21),
    impactOnDaytime: "Significant tiredness affecting school attendance (2 late arrivals this week). Emotional dysregulation worse on poor sleep nights. Staff noted correlation between sleep and behavioural incidents.",
    trend: "declining",
    notes: "Jordan's sleep has worsened since contact with birth mother was suspended 3 weeks ago. Therapeutic input being increased. Night staff briefed on trauma-informed approach. Never wake Jordan abruptly — allow natural waking with gentle presence.",
  },
  {
    id: "sa_003",
    youngPersonId: "yp_casey",
    assessedBy: "staff_chervelle",
    assessmentDate: d(-10),
    reviewDate: d(18),
    status: "improving",
    sleepPatterns: {
      weekday: { target: "22:00", actual: "22:30" },
      weekend: { target: "22:30", actual: "23:00" },
    },
    averageHours: 7.5,
    sleepQuality: "fair",
    settlingTime: "30-45 minutes",
    nightWakings: 1,
    bedtimeRoutine: [
      "Gaming off by 21:30 (Casey sets own alarm)",
      "Shower and change",
      "Music or podcast in bed",
      "Staff check-in at 22:00 — brief chat",
    ],
    barriers: [
      "History of going missing at night — hyperarousal patterns",
      "Gaming can overstimulate if played too close to bed",
      "Peers contacting via social media late at night",
      "Residual sleep pattern disruption from street homelessness period",
    ],
    strategies: [
      "Gaming cut-off agreed at 21:30 — Casey self-manages with alarm",
      "Phone on Do Not Disturb from 22:00 (Casey activates)",
      "Graduated trust — Casey previously had phone removed at night, now self-manages",
      "Morning routine reward — breakfast choice if good sleep pattern maintained",
      "Psychoeducation about sleep hygiene delivered by key worker",
    ],
    environmentalFactors: [
      "Window lock engaged at night (Casey aware — agreed as safety measure)",
      "Comfortable bedding — Casey chose duvet and pillows",
      "Room personalised to feel like 'home' — important for settling",
    ],
    medications: null,
    referrals: null,
    impactOnDaytime: "Improving. Casey now attending school 4/5 days (up from 2/5 two months ago). Morning mood better when sleep is good. Staff note fewer confrontations in first hour of day.",
    trend: "improving",
    notes: "Significant improvement since Casey was given more autonomy over bedtime routine. Key learning: control and choice are essential for Casey. The self-managed gaming alarm was Casey's idea and has worked better than staff-imposed limits ever did. Trust-based approach paying off.",
  },
];

/* ─── export columns ─── */
const exportCols: ExportColumn<SleepAssessment>[] = [
  { header: "Young Person", accessor: (r: SleepAssessment) => getYPName(r.youngPersonId) },
  { header: "Assessed By", accessor: (r: SleepAssessment) => getStaffName(r.assessedBy) },
  { header: "Date", accessor: (r: SleepAssessment) => r.assessmentDate },
  { header: "Status", accessor: (r: SleepAssessment) => r.status.replace("_", " ") },
  { header: "Avg Hours", accessor: (r: SleepAssessment) => r.averageHours.toString() },
  { header: "Quality", accessor: (r: SleepAssessment) => r.sleepQuality },
  { header: "Trend", accessor: (r: SleepAssessment) => r.trend },
  { header: "Settling Time", accessor: (r: SleepAssessment) => r.settlingTime },
  { header: "Night Wakings", accessor: (r: SleepAssessment) => r.nightWakings.toString() },
  { header: "Impact", accessor: (r: SleepAssessment) => r.impactOnDaytime },
  { header: "Review Due", accessor: (r: SleepAssessment) => r.reviewDate },
];

/* ─── component ─── */
export default function SleepAssessmentsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filtered = useMemo(() => {
    let list = [...assessments];
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.assessmentDate.localeCompare(a.assessmentDate);
        case "hours":
          return a.averageHours - b.averageHours;
        case "quality":
          const qOrder = { poor: 0, fair: 1, good: 2 };
          return qOrder[a.sleepQuality] - qOrder[b.sleepQuality];
        case "name":
          return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        default:
          return 0;
      }
    });
    return list;
  }, [filterStatus, sortBy]);

  const stats = useMemo(() => {
    const avgHours = assessments.reduce((s, a) => s + a.averageHours, 0) / assessments.length;
    const concerns = assessments.filter((a) => a.status === "concern").length;
    const improving = assessments.filter((a) => a.trend === "improving").length;
    return { avgHours: avgHours.toFixed(1), concerns, improving };
  }, []);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "concern":
        return <Badge className="bg-red-100 text-red-800">Concern</Badge>;
      case "improving":
        return <Badge className="bg-blue-100 text-blue-800">Improving</Badge>;
      case "needs_review":
        return <Badge className="bg-amber-100 text-amber-800">Needs Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const trendIcon = (trend: string) => {
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

  const qualityColor = (q: string) => {
    switch (q) {
      case "good": return "text-green-700 bg-green-50";
      case "fair": return "text-amber-700 bg-amber-50";
      case "poor": return "text-red-700 bg-red-50";
      default: return "";
    }
  };

  return (
    <PageShell
      title="Sleep Assessments"
      subtitle="Individual sleep profiles, barriers, strategies, and monitoring for each young person"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={assessments} columns={exportCols} filename="sleep-assessments" />
          <PrintButton title="Sleep Assessments" />
        </div>
      }
    >
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{assessments.length}</p>
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
                {assessments
                  .filter((a) => a.status === "concern")
                  .map((a) => getYPName(a.youngPersonId))
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
          <option value="active">Active</option>
          <option value="concern">Concern</option>
          <option value="improving">Improving</option>
          <option value="needs_review">Needs Review</option>
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

          return (
            <Card key={assessment.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(assessment.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      assessment.sleepQuality === "good" ? "bg-green-100" :
                      assessment.sleepQuality === "fair" ? "bg-amber-100" : "bg-red-100"
                    )}>
                      <Moon className={cn(
                        "h-5 w-5",
                        assessment.sleepQuality === "good" ? "text-green-600" :
                        assessment.sleepQuality === "fair" ? "text-amber-600" : "text-red-600"
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {getYPName(assessment.youngPersonId)}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {statusBadge(assessment.status)}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          {trendIcon(assessment.trend)}
                          {assessment.trend}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {assessment.averageHours}h avg
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Assessed</p>
                      <p className="text-sm">{assessment.assessmentDate}</p>
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
                          <span className="text-sm">Target: {assessment.sleepPatterns.weekday.target}</span>
                          <span className="text-sm">Actual: {assessment.sleepPatterns.weekday.actual}</span>
                        </div>
                      </div>
                      <div className="border rounded-md p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Weekend</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Target: {assessment.sleepPatterns.weekend.target}</span>
                          <span className="text-sm">Actual: {assessment.sleepPatterns.weekend.actual}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* quality metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="border rounded-md p-2 text-center">
                      <p className="text-xs text-muted-foreground">Avg Hours</p>
                      <p className="text-lg font-bold">{assessment.averageHours}</p>
                    </div>
                    <div className={cn("border rounded-md p-2 text-center", qualityColor(assessment.sleepQuality))}>
                      <p className="text-xs">Quality</p>
                      <p className="text-lg font-bold capitalize">{assessment.sleepQuality}</p>
                    </div>
                    <div className="border rounded-md p-2 text-center">
                      <p className="text-xs text-muted-foreground">Settling</p>
                      <p className="text-sm font-medium">{assessment.settlingTime}</p>
                    </div>
                    <div className="border rounded-md p-2 text-center">
                      <p className="text-xs text-muted-foreground">Night Wakings</p>
                      <p className="text-lg font-bold">{assessment.nightWakings}</p>
                    </div>
                  </div>

                  {/* bedtime routine */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Moon className="h-4 w-4" /> Bedtime Routine
                    </p>
                    <ol className="space-y-1">
                      {assessment.bedtimeRoutine.map((step, i) => (
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
                      {assessment.environmentalFactors.map((ef, i) => (
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
                    <p className="text-sm text-muted-foreground">{assessment.impactOnDaytime}</p>
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
                      <p className="text-sm font-medium">{getStaffName(assessment.assessedBy)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Review Due</p>
                      <p className="text-sm font-medium">{assessment.reviewDate}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">Regulatory Context</p>
        <p className="text-xs text-slate-600">
          Quality Standard 6 (Health and Wellbeing) requires that children&apos;s physical health
          needs are understood and met, which includes adequate sleep. Regulation 10 (Health and
          Wellbeing) requires that the health needs of each child are identified and appropriate
          steps taken. Sleep assessments inform bedtime boundaries (Reg 19), night staffing
          arrangements, and individual care plans. NICE guidance CG170 recommends sleep hygiene
          assessment for looked-after children given the high prevalence of sleep difficulties
          linked to trauma and attachment disruption.
        </p>
      </div>
    </PageShell>
  );
}
