"use client";

import { useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, Minus,
  Shield, CheckCircle2, AlertTriangle, XCircle,
  BarChart3, Heart, GraduationCap, Users, ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
type RAG = "green" | "amber" | "red";
type Trend = "up" | "down" | "stable";

type Category =
  | "experiences_progress"
  | "health_wellbeing"
  | "safety"
  | "education"
  | "leadership_management";

interface KPI {
  id: string;
  category: Category;
  name: string;
  value: string;
  target: string;
  rag: RAG;
  trend: Trend;
  notes: string;
}

const CATEGORY_META: Record<Category, { label: string; icon: React.ReactNode }> = {
  experiences_progress:  { label: "Overall Experiences & Progress", icon: <BarChart3 className="h-4 w-4" /> },
  health_wellbeing:      { label: "Health & Wellbeing",            icon: <Heart className="h-4 w-4" /> },
  safety:                { label: "Safety",                        icon: <Shield className="h-4 w-4" /> },
  education:             { label: "Education",                     icon: <GraduationCap className="h-4 w-4" /> },
  leadership_management: { label: "Leadership & Management",       icon: <Users className="h-4 w-4" /> },
};

const RAG_META: Record<RAG, { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  green: { label: "Green", dotColor: "bg-green-500", bgColor: "bg-green-50",  textColor: "text-green-700" },
  amber: { label: "Amber", dotColor: "bg-amber-500", bgColor: "bg-amber-50",  textColor: "text-amber-700" },
  red:   { label: "Red",   dotColor: "bg-red-500",   bgColor: "bg-red-50",    textColor: "text-red-700" },
};

const TREND_ICON: Record<Trend, React.ReactNode> = {
  up:     <TrendingUp className="h-3.5 w-3.5 text-green-600" />,
  down:   <TrendingDown className="h-3.5 w-3.5 text-red-600" />,
  stable: <Minus className="h-3.5 w-3.5 text-muted-foreground" />,
};

const TREND_LABEL: Record<Trend, string> = {
  up: "Improving",
  down: "Declining",
  stable: "Stable",
};

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: KPI[] = [
  // Overall Experiences & Progress
  {
    id: "kpi_001", category: "experiences_progress",
    name: "Placement stability", value: "100%", target: "100%",
    rag: "green", trend: "stable",
    notes: "No placement breakdowns in the last 12 months. All three young people remain settled.",
  },
  {
    id: "kpi_002", category: "experiences_progress",
    name: "Average Outcome Star score", value: "5.8 / 10", target: "6.0+",
    rag: "amber", trend: "up",
    notes: "Slightly below target. Two YP showing steady improvement; one plateau in education domain.",
  },
  {
    id: "kpi_003", category: "experiences_progress",
    name: "LAC reviews within timescale", value: "100%", target: "100%",
    rag: "green", trend: "stable",
    notes: "All LAC reviews completed on schedule. Next review due within 28 days.",
  },
  {
    id: "kpi_004", category: "experiences_progress",
    name: "Children’s views collected", value: "100%", target: "100%",
    rag: "green", trend: "stable",
    notes: "All three young people contributed views via key-work sessions and feedback forms.",
  },

  // Health & Wellbeing
  {
    id: "kpi_005", category: "health_wellbeing",
    name: "Health assessments up to date", value: "100%", target: "100%",
    rag: "green", trend: "stable",
    notes: "All initial and review health assessments completed within statutory timescales.",
  },
  {
    id: "kpi_006", category: "health_wellbeing",
    name: "Dental checks within 12 months", value: "100%", target: "100%",
    rag: "green", trend: "stable",
    notes: "All three young people have attended dental appointments within the last 12 months.",
  },
  {
    id: "kpi_007", category: "health_wellbeing",
    name: "CAMHS referrals actioned", value: "100%", target: "100%",
    rag: "green", trend: "stable",
    notes: "One active CAMHS referral progressing. No outstanding referrals awaiting action.",
  },
  {
    id: "kpi_008", category: "health_wellbeing",
    name: "Medication errors", value: "0 in quarter", target: "0",
    rag: "green", trend: "stable",
    notes: "Zero medication errors this quarter. Monthly medication audits all clear.",
  },

  // Safety
  {
    id: "kpi_009", category: "safety",
    name: "Safeguarding training compliance", value: "100%", target: "100%",
    rag: "green", trend: "stable",
    notes: "All staff have completed Level 3 safeguarding training. Annual refresher schedule in place.",
  },
  {
    id: "kpi_010", category: "safety",
    name: "Missing episodes (last quarter)", value: "2", target: "0",
    rag: "amber", trend: "down",
    notes: "Two short missing episodes (both under 2 hours). Return home interviews completed. Action plans updated.",
  },
  {
    id: "kpi_011", category: "safety",
    name: "Restraint incidents (last quarter)", value: "1", target: "≤2",
    rag: "green", trend: "up",
    notes: "One planned intervention following risk assessment protocol. Debrief completed. Within expected range.",
  },
  {
    id: "kpi_012", category: "safety",
    name: "Risk assessments current", value: "100%", target: "100%",
    rag: "green", trend: "stable",
    notes: "All individual risk assessments reviewed within the last 30 days.",
  },
  {
    id: "kpi_013", category: "safety",
    name: "Exploitation screening current", value: "100%", target: "100%",
    rag: "green", trend: "stable",
    notes: "CSE/CCE screening tools completed for all young people. No elevated concerns identified.",
  },

  // Education
  {
    id: "kpi_014", category: "education",
    name: "School/college attendance (avg)", value: "62%", target: "85%+",
    rag: "red", trend: "down",
    notes: "Below target. One YP on reduced timetable; one refusing intermittently. PEP meeting arranged to address barriers.",
  },
  {
    id: "kpi_015", category: "education",
    name: "PEPs current", value: "67% (2 of 3)", target: "100%",
    rag: "amber", trend: "stable",
    notes: "One PEP overdue by 3 weeks. Virtual school contacted to reschedule. Two PEPs up to date.",
  },
  {
    id: "kpi_016", category: "education",
    name: "Pupil Premium utilisation", value: "62%", target: "100%",
    rag: "amber", trend: "up",
    notes: "Funds partially allocated. Tutor commissioned for one YP. Awaiting confirmation on remaining spend.",
  },

  // Leadership & Management
  {
    id: "kpi_017", category: "leadership_management",
    name: "Staff supervision compliance", value: "71% (5/7 current)", target: "100%",
    rag: "amber", trend: "down",
    notes: "Two supervisions overdue due to staff sickness. Rescheduled within the next 7 days.",
  },
  {
    id: "kpi_018", category: "leadership_management",
    name: "Mandatory training compliance", value: "95%", target: "100%",
    rag: "green", trend: "stable",
    notes: "One staff member has outstanding first aid refresher booked for next week.",
  },
  {
    id: "kpi_019", category: "leadership_management",
    name: "Staff turnover (rolling 12 months)", value: "2 leavers", target: "≤1",
    rag: "amber", trend: "stable",
    notes: "Two staff departed in the period. Both positions filled. Exit interviews completed.",
  },
  {
    id: "kpi_020", category: "leadership_management",
    name: "Reg 44 visits on time", value: "100%", target: "100%",
    rag: "green", trend: "stable",
    notes: "All Regulation 44 independent visits completed within statutory timescales.",
  },
  {
    id: "kpi_021", category: "leadership_management",
    name: "Reg 45 submitted on time", value: "100%", target: "100%",
    rag: "green", trend: "stable",
    notes: "All Regulation 45 quality-of-care reports submitted to Ofsted on schedule.",
  },
  {
    id: "kpi_022", category: "leadership_management",
    name: "Complaints responded within timescale", value: "100%", target: "100%",
    rag: "green", trend: "stable",
    notes: "All complaints acknowledged within 24 hours and resolved within 28 days.",
  },
  {
    id: "kpi_023", category: "leadership_management",
    name: "Notifiable events reported within timescale", value: "100%", target: "100%",
    rag: "green", trend: "stable",
    notes: "All notifiable events reported to Ofsted within 24 hours as required.",
  },
];

/* ── export columns ──────────────────────────────────────────────────── */
const EXPORT_COLS: ExportColumn<KPI>[] = [
  { header: "ID",       accessor: (r: KPI) => r.id },
  { header: "Category", accessor: (r: KPI) => CATEGORY_META[r.category].label },
  { header: "KPI",      accessor: (r: KPI) => r.name },
  { header: "Value",    accessor: (r: KPI) => r.value },
  { header: "Target",   accessor: (r: KPI) => r.target },
  { header: "RAG",      accessor: (r: KPI) => r.rag.toUpperCase() },
  { header: "Trend",    accessor: (r: KPI) => TREND_LABEL[r.trend] },
  { header: "Notes",    accessor: (r: KPI) => r.notes },
];

/* ══════════════════════════════════════════════════════════════════════ */
export default function KPIDashboardPage() {
  const kpis = SEED;

  /* ── overall summary ─────────────────────────────────────────────── */
  const summary = useMemo(() => {
    const green = kpis.filter((k) => k.rag === "green").length;
    const amber = kpis.filter((k) => k.rag === "amber").length;
    const red   = kpis.filter((k) => k.rag === "red").length;

    let overall: RAG = "green";
    if (red > 0) overall = "red";
    else if (amber >= 3) overall = "amber";
    else if (amber > 0) overall = "amber";

    return { green, amber, red, total: kpis.length, overall };
  }, [kpis]);

  /* ── grouped by category ─────────────────────────────────────────── */
  const categories = useMemo(() => {
    const order: Category[] = [
      "experiences_progress",
      "health_wellbeing",
      "safety",
      "education",
      "leadership_management",
    ];
    return order.map((cat) => ({
      key: cat,
      ...CATEGORY_META[cat],
      items: kpis.filter((k) => k.category === cat),
    }));
  }, [kpis]);

  return (
    <PageShell
      title="KPI Dashboard"
      subtitle="Ofsted-aligned key performance indicators across care quality, safeguarding, education, staffing, and compliance"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="KPI Dashboard" />
          <ExportButton data={kpis} columns={EXPORT_COLS} filename="kpi-dashboard" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        {/* ── Overall RAG Rating ─────────────────────────────────────── */}
        <Card className={cn(
          "border-l-4",
          summary.overall === "green" ? "border-l-green-500" : summary.overall === "amber" ? "border-l-amber-500" : "border-l-red-500",
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  RAG_META[summary.overall].bgColor,
                )}>
                  {summary.overall === "green" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : summary.overall === "amber" ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Performance Rating</p>
                  <p className={cn("text-lg font-bold", RAG_META[summary.overall].textColor)}>
                    {summary.overall === "green" ? "Good" : summary.overall === "amber" ? "Requires Improvement" : "Inadequate"} — {RAG_META[summary.overall].label.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm font-semibold">{summary.green}</span>
                  <span className="text-xs text-muted-foreground">Green</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-sm font-semibold">{summary.amber}</span>
                  <span className="text-xs text-muted-foreground">Amber</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm font-semibold">{summary.red}</span>
                  <span className="text-xs text-muted-foreground">Red</span>
                </div>
                <div className="border-l pl-4 ml-2">
                  <span className="text-xs text-muted-foreground">Total KPIs</span>
                  <p className="text-sm font-bold">{summary.total}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Category Sections ──────────────────────────────────────── */}
        {categories.map((cat) => {
          const catGreens = cat.items.filter((k) => k.rag === "green").length;
          const catAmbers = cat.items.filter((k) => k.rag === "amber").length;
          const catReds   = cat.items.filter((k) => k.rag === "red").length;
          const catRag: RAG = catReds > 0 ? "red" : catAmbers > 0 ? "amber" : "green";

          return (
            <Card key={cat.key}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {cat.icon}
                    {cat.label}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      "text-xs",
                      RAG_META[catRag].bgColor,
                      RAG_META[catRag].textColor,
                    )}>
                      {catRag.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {catGreens}G / {catAmbers}A / {catReds}R
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y">
                  {cat.items.map((kpi) => (
                    <div key={kpi.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={cn(
                              "h-2.5 w-2.5 rounded-full flex-shrink-0",
                              RAG_META[kpi.rag].dotColor,
                            )} />
                            <p className="text-sm font-medium">{kpi.name}</p>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              {TREND_ICON[kpi.trend]}
                              {TREND_LABEL[kpi.trend]}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground ml-[18px]">{kpi.notes}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={cn("text-sm font-bold", RAG_META[kpi.rag].textColor)}>
                            {kpi.value}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Target: {kpi.target}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* ── Regulatory Note ────────────────────────────────────────── */}
        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <ClipboardCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Performance is monitored against Ofsted&apos;s Social Care Common Inspection Framework (SCCIF). KPIs are reviewed monthly by the Registered Manager and reported to the Responsible Individual. Amber and red indicators require an action plan within 7 working days. This dashboard supports continuous improvement and regulatory compliance under the Children&apos;s Homes (England) Regulations 2015.
            </span>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
