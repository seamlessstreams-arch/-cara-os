"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — OFSTED SELF-EVALUATION
// Presents the home's honest self-assessment against Ofsted's SCCIF judgement
// areas — strengths, evidence, areas for development, and actions in progress.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import {
  ClipboardCheck, Search, ArrowUpDown, Filter,
  CheckCircle2, TrendingUp, ChevronDown, ChevronUp,
  Calendar, User, Star, ShieldCheck, Award,
  Target, AlertTriangle, Lightbulb, FileText,
  BookOpen,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
type SelfGrade = "outstanding" | "good" | "requires_improvement" | "inadequate";

interface ActionInProgress {
  action: string;
  owner: string;
  targetDate: string;
  status: string;
}

interface JudgementArea {
  id: string;
  area: string;
  selfGrade: SelfGrade;
  strengths: string[];
  evidence: string[];
  areasForDevelopment: string[];
  actions: ActionInProgress[];
}

/* ── label & colour maps ─────────────────────────────────────────────── */
const GRADE_LABELS: Record<SelfGrade, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

const GRADE_COLOUR: Record<SelfGrade, string> = {
  outstanding: "bg-indigo-50 text-indigo-700 border-indigo-200",
  good: "bg-emerald-50 text-emerald-700 border-emerald-200",
  requires_improvement: "bg-amber-50 text-amber-700 border-amber-200",
  inadequate: "bg-red-50 text-red-700 border-red-200",
};

const GRADE_CARD_BORDER: Record<SelfGrade, string> = {
  outstanding: "border-l-indigo-400",
  good: "border-l-emerald-400",
  requires_improvement: "border-l-amber-400",
  inadequate: "border-l-red-400",
};

const GRADE_ICON_COLOUR: Record<SelfGrade, string> = {
  outstanding: "text-indigo-600",
  good: "text-emerald-600",
  requires_improvement: "text-amber-600",
  inadequate: "text-red-600",
};

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: JudgementArea[] = [
  {
    id: "sef_1",
    area: "Overall Experiences and Progress of Children",
    selfGrade: "good",
    strengths: [
      "All children are in full-time education with attendance consistently above 95%",
      "Positive placement stability — zero unplanned endings or breakdowns in the past 12 months",
      "Strong, trusting relationships between children and staff, evidenced through daily interactions and key-working sessions",
      "Children's voices are heard and influential in decisions about their care, placement, and daily lives",
      "Health needs comprehensively met including physical, emotional, and dental health",
      "Positive outcomes tracked and evidenced through Outcome Star assessments showing improvement across all three children",
    ],
    evidence: [
      "Education attendance records showing 95%+ across all children for the past two terms",
      "Outcome Star assessments demonstrating measurable improvements across all domains for all 3 children",
      "Reg 44 independent visitor interviews confirm children report feeling safe and well-cared for",
      "Zero unplanned placement endings in 12 months — all placements stable and progressing",
      "Children's meeting minutes showing views sought, heard, and acted upon",
      "Health records evidencing all appointments attended and health plans reviewed quarterly",
    ],
    areasForDevelopment: [
      "Jordan's CAMHS access remains a challenge — current waiting times are outside the home's direct control but advocacy continues",
      "Casey's exploitation risk requires ongoing multi-agency vigilance and coordinated safety planning",
      "Alex's confidence in social settings is still developing — progress is positive but needs continued nurturing",
    ],
    actions: [
      {
        action: "Continue advocacy with CAMHS for Jordan's assessment — escalate through social worker and IRO if no progress by next LAC review",
        owner: "staff_darren",
        targetDate: d(30),
        status: "In progress",
      },
      {
        action: "Maintain multi-agency exploitation strategy meetings for Casey — ensure NRM referral progress is tracked",
        owner: "staff_darren",
        targetDate: d(14),
        status: "In progress",
      },
      {
        action: "Develop structured social confidence programme for Alex — link with community youth groups and introduce gradual independent outings",
        owner: "staff_darren",
        targetDate: d(45),
        status: "In progress",
      },
    ],
  },
  {
    id: "sef_2",
    area: "How Well Children Are Helped and Protected",
    selfGrade: "good",
    strengths: [
      "Robust safeguarding procedures understood and followed by all staff — evidenced through audits and supervision",
      "Timely notifications to Ofsted and placing authorities — process improvements implemented following Reg 44 feedback",
      "Effective missing from care response protocols with strong police liaison and return interview compliance",
      "Strong multi-agency relationships with social workers, police, YOT, and health professionals",
      "Exploitation awareness embedded in daily practice — staff trained in CSE/CCE indicators and referral pathways",
      "All staff trained in Therapeutic Crisis Intervention (TCI) with usage proportionate and reducing over time",
    ],
    evidence: [
      "Zero safeguarding concerns raised about staff conduct in the past 12 months",
      "Return home interviews completed for 100% of missing episodes within 72 hours",
      "TCI usage data shows proportionate application and a reducing trend quarter on quarter",
      "Behaviour incident data shows a consistent downward trend across the reporting period",
      "Multi-agency meeting attendance records showing consistent engagement and proactive information sharing",
      "Staff training records showing 100% compliance with safeguarding, CSE/CCE, and TCI refresher training",
    ],
    areasForDevelopment: [
      "One late Ofsted notification identified 3 months ago — process has since been strengthened with same-day reporting protocol",
      "Casey's exploitation concerns require continued vigilance and sustained multi-agency coordination",
      "Online safety landscape is continually evolving — staff knowledge needs regular updating",
    ],
    actions: [
      {
        action: "Implement quarterly online safety briefings for all staff — source updated training materials from CEOP and local safeguarding partnership",
        owner: "staff_darren",
        targetDate: d(21),
        status: "In progress",
      },
      {
        action: "Audit notification timeliness monthly for next quarter to evidence sustained improvement following the late notification",
        owner: "staff_darren",
        targetDate: d(60),
        status: "In progress",
      },
    ],
  },
  {
    id: "sef_3",
    area: "The Effectiveness of Leaders and Managers",
    selfGrade: "outstanding",
    strengths: [
      "Registered Manager studying Level 7 in Leadership and Management — demonstrating commitment to continuous professional development",
      "Strong governance via the Responsible Individual with regular oversight visits and constructive challenge",
      "Reg 44 independent visitor reports consistently positive with recommendations actioned within agreed timescales",
      "Excellent staff retention — only one departure in 12 months (managed exit) demonstrating stable, motivated workforce",
      "Training compliance consistently high across all mandatory and supplementary areas",
      "Therapeutic care model (trauma-informed, relational practice) clearly articulated, understood by all staff, and evidenced in daily practice",
      "Quality assurance framework robust — includes monthly audits, supervision analysis, outcome tracking, and external feedback loops",
    ],
    evidence: [
      "All Reg 44 recommendations actioned within the specified timeframe — tracker shows 100% compliance",
      "Staff qualification records showing continued progression — 2 staff completed Level 3, deputy completed Level 5",
      "Supervision compliance at 100% for the reporting period with reflective, high-quality records",
      "Quality of care review (Reg 45) completed on time with comprehensive self-assessment and action planning",
      "Ofsted relationship managed proactively — notifications timely, engagement open and transparent",
      "Staff retention data showing stable workforce with low turnover and high job satisfaction survey scores",
      "RI visit reports evidencing regular scrutiny, constructive challenge, and support for the Registered Manager",
    ],
    areasForDevelopment: [
      "Succession planning needs development — if the RM were absent for an extended period, contingency arrangements require formalisation",
      "Deputy's Level 5 qualification recently completed — needs time and support to embed learning into practice leadership",
      "Two new staff members currently in induction phase — require continued close supervision and mentoring during probation",
    ],
    actions: [
      {
        action: "Draft formal succession and business continuity plan addressing RM absence scenarios — present to RI for approval",
        owner: "staff_darren",
        targetDate: d(42),
        status: "In progress",
      },
      {
        action: "Develop structured deputy development programme with defined leadership opportunities, shadowing, and mentoring milestones",
        owner: "staff_darren",
        targetDate: d(56),
        status: "In progress",
      },
    ],
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function OfstedSelfEvaluationPage() {
  const [entries] = useState<JudgementArea[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [sortBy, setSortBy] = useState<"area" | "grade">("area");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── filtering & sorting ────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...entries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.area.toLowerCase().includes(q) ||
          e.strengths.some((s) => s.toLowerCase().includes(q)) ||
          e.evidence.some((s) => s.toLowerCase().includes(q)) ||
          e.areasForDevelopment.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filterGrade !== "all") list = list.filter((e) => e.selfGrade === filterGrade);

    const gradeOrder: Record<SelfGrade, number> = { outstanding: 0, good: 1, requires_improvement: 2, inadequate: 3 };
    list.sort((a, b) => {
      switch (sortBy) {
        case "grade":
          return gradeOrder[a.selfGrade] - gradeOrder[b.selfGrade];
        case "area":
        default:
          return a.area.localeCompare(b.area);
      }
    });
    return list;
  }, [entries, search, filterGrade, sortBy]);

  /* ── stats ──────────────────────────────────────────────────────── */
  const totalAreas = entries.length;
  const areasAtGoodPlus = entries.filter((e) => e.selfGrade === "good" || e.selfGrade === "outstanding").length;
  const totalActions = entries.reduce((sum, e) => sum + e.actions.length, 0);
  const overallGrade = "Good (with Outstanding leadership)";

  /* ── export columns ─────────────────────────────────────────────── */
  const exportCols: ExportColumn<JudgementArea>[] = [
    { header: "Judgement Area", accessor: (r: JudgementArea) => r.area },
    { header: "Self-Assessed Grade", accessor: (r: JudgementArea) => GRADE_LABELS[r.selfGrade] },
    { header: "Strengths Summary", accessor: (r: JudgementArea) => r.strengths.join("; ") },
    { header: "Development Summary", accessor: (r: JudgementArea) => r.areasForDevelopment.join("; ") },
    { header: "Actions Count", accessor: (r: JudgementArea) => r.actions.length },
  ];

  return (
    <PageShell
      title="Ofsted Self-Evaluation"
      subtitle="Self-assessment against the Social Care Common Inspection Framework (SCCIF) judgement areas"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Ofsted Self-Evaluation" />
          <ExportButton data={filtered} columns={exportCols} filename="ofsted-self-evaluation" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── overall summary banner ─────────────────────────────────── */}
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" />
              Overall Self-Assessment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Overall Self-Assessed Grade</p>
                <div className="mt-0.5">
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold">
                    {overallGrade}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm font-semibold flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  {d(-14)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Author</p>
                <p className="text-sm font-semibold flex items-center gap-1.5 mt-0.5">
                  <User className="h-3.5 w-3.5 text-indigo-500" />
                  {getStaffName("staff_darren")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next Review Due</p>
                <p className="text-sm font-semibold flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  {d(76)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── summary stats ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Overall Grade", value: "Good", icon: Award, colour: "text-emerald-600" },
            { label: "Areas at Good+", value: `${areasAtGoodPlus}/${totalAreas}`, icon: CheckCircle2, colour: "text-emerald-600" },
            { label: "Actions In Progress", value: totalActions, icon: TrendingUp, colour: "text-amber-600" },
            { label: "Judgement Areas", value: totalAreas, icon: ClipboardCheck, colour: "text-indigo-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── filters & sort ─────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search strengths, evidence, development areas..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All Grades</option>
              <option value="outstanding">Outstanding</option>
              <option value="good">Good</option>
              <option value="requires_improvement">Requires Improvement</option>
              <option value="inadequate">Inadequate</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "area" | "grade")}
              className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="area">Judgement Area</option>
              <option value="grade">Grade</option>
            </select>
          </div>
        </div>

        {/* ── judgement area cards ────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardCheck className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              No judgement areas match your filters.
            </div>
          )}
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border border-l-4 bg-white overflow-hidden",
                  GRADE_CARD_BORDER[item.selfGrade]
                )}
              >
                {/* collapsed header */}
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Star className={cn("h-5 w-5 shrink-0", GRADE_ICON_COLOUR[item.selfGrade])} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{item.area}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", GRADE_COLOUR[item.selfGrade])}>
                          {GRADE_LABELS[item.selfGrade]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {item.strengths.length} strengths &middot; {item.areasForDevelopment.length} development areas &middot; {item.actions.length} actions
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {item.selfGrade === "outstanding" && <Award className="h-4 w-4 text-indigo-500" />}
                    {item.selfGrade === "good" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {/* expanded detail */}
                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* strengths */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {item.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* evidence */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          Evidence
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {item.evidence.map((e, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <ShieldCheck className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                              {e}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* areas for development */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Areas for Development
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {item.areasForDevelopment.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <Target className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* actions in progress */}
                    {item.actions.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-teal-500" />
                            Actions In Progress
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {item.actions.map((action, i) => (
                              <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                                <p className="text-sm text-slate-700 font-medium">{action.action}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {getStaffName(action.owner)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Target: {action.targetDate}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
                                    {action.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ──────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <div className="flex items-start gap-2">
            <BookOpen className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p>
                <strong>About Self-Evaluation:</strong> Ofsted does not require children&apos;s homes to produce
                a self-evaluation form (SEF) in a prescribed format. However, the expectation is that
                registered managers maintain a clear, honest understanding of their home&apos;s strengths and
                areas for development. This self-assessment should be a living document that evolves as the
                home develops.
              </p>
              <p>
                Ofsted uses the home&apos;s self-evaluation to help focus inspection activity. A well-prepared,
                honest self-assessment demonstrates strong leadership and a commitment to continuous
                improvement. The SCCIF assesses three key judgement areas: the overall experiences and progress
                of children, how well children are helped and protected, and the effectiveness of leaders and
                managers.
              </p>
              <p>
                <strong>Important:</strong> This document should reflect genuine, honest self-reflection
                rather than self-promotion. Inspectors value homes that can identify their own areas for
                development and demonstrate active steps being taken to address them. Over-grading undermines
                credibility; under-grading fails to recognise the team&apos;s achievements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
