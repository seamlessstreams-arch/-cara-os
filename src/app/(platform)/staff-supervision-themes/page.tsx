"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown, ChevronUp, ArrowUpDown, Layers, Users, CheckCircle2,
  TrendingUp, Heart, BookOpen, MessageSquare, Briefcase, Shield,
  Brain, AlertTriangle, FileText, Target, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type ThemeArea =
  | "Practice"
  | "Wellbeing"
  | "Training"
  | "Communication"
  | "Workload"
  | "Safeguarding"
  | "Reflective";

type ThemeStatus = "Emerging" | "Active" | "Addressed" | "Monitoring";

interface SupervisionTheme {
  id: string;
  identifiedDate: string;
  themeArea: ThemeArea;
  themeTitle: string;
  frequencyAcrossTeam: number;
  staffAffected: string[];
  description: string;
  rootCauseAnalysis: string;
  organisationalResponse: string[];
  trainingImplications: string[];
  policyImplications: string[];
  status: ThemeStatus;
  reviewedBy: string;
  nextReviewDate: string;
  anonymous: boolean;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const AREA_LABEL: Record<ThemeArea, string> = {
  Practice: "Practice",
  Wellbeing: "Wellbeing",
  Training: "Training",
  Communication: "Communication",
  Workload: "Workload",
  Safeguarding: "Safeguarding",
  Reflective: "Reflective",
};

const AREA_CLR: Record<ThemeArea, string> = {
  Practice: "bg-blue-100 text-blue-800",
  Wellbeing: "bg-pink-100 text-pink-800",
  Training: "bg-purple-100 text-purple-800",
  Communication: "bg-cyan-100 text-cyan-800",
  Workload: "bg-amber-100 text-amber-800",
  Safeguarding: "bg-red-100 text-red-800",
  Reflective: "bg-indigo-100 text-indigo-800",
};

const AREA_BORDER: Record<ThemeArea, string> = {
  Practice: "border-l-blue-400",
  Wellbeing: "border-l-pink-400",
  Training: "border-l-purple-400",
  Communication: "border-l-cyan-400",
  Workload: "border-l-amber-400",
  Safeguarding: "border-l-red-500",
  Reflective: "border-l-indigo-400",
};

const AREA_ICON: Record<ThemeArea, typeof Heart> = {
  Practice: Briefcase,
  Wellbeing: Heart,
  Training: BookOpen,
  Communication: MessageSquare,
  Workload: TrendingUp,
  Safeguarding: Shield,
  Reflective: Brain,
};

const STATUS_LABEL: Record<ThemeStatus, string> = {
  Emerging: "Emerging",
  Active: "Active",
  Addressed: "Addressed",
  Monitoring: "Monitoring",
};

const STATUS_CLR: Record<ThemeStatus, string> = {
  Emerging: "bg-amber-100 text-amber-800",
  Active: "bg-blue-100 text-blue-800",
  Addressed: "bg-green-100 text-green-800",
  Monitoring: "bg-slate-100 text-slate-700",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: SupervisionTheme[] = [
  {
    id: "sst_001",
    identifiedDate: d(-72),
    themeArea: "Practice",
    themeTitle: "Inconsistent application of consequence framework",
    frequencyAcrossTeam: 5,
    staffAffected: ["staff_ryan", "staff_anna", "staff_edward", "staff_chervelle", "staff_lackson"],
    description:
      "Multiple staff have raised in supervision that the consequence framework is being applied inconsistently across shifts. Some shifts apply consequences immediately, others use a more reflective approach. Young people have commented that the responses they get depend on which staff are on duty, which undermines fairness and predictability.",
    rootCauseAnalysis:
      "The framework was updated 6 months ago following a Reg 44 recommendation, but team training did not include scenario-based practice. Staff understand the policy in principle but interpret it differently when applied to specific incidents. Edward, in particular, defaults to harder consequences while Anna defaults to relational repair — both valid but the inconsistency is the issue.",
    organisationalResponse: [
      "Schedule a full-team workshop on the consequence framework with worked scenarios",
      "Include consequence framework as a standing agenda item in team meetings for next 3 months",
      "Pair shifts so newer staff work alongside more reflective practitioners during transition",
      "Share exemplar log entries showing consequence framework applied well",
    ],
    trainingImplications: [
      "Consequence framework refresher with case studies",
      "Therapeutic parenting approaches workshop",
      "Reflective practice on punishment vs consequence",
    ],
    policyImplications: [
      "Review consequence framework wording for ambiguity",
      "Add worked examples appendix to the policy",
      "Strengthen induction so new staff see this modelled before practising",
    ],
    status: "Active",
    reviewedBy: "staff_darren",
    nextReviewDate: d(21),
    anonymous: false,
  },
  {
    id: "sst_002",
    identifiedDate: d(-58),
    themeArea: "Wellbeing",
    themeTitle: "Vicarious trauma after disclosures",
    frequencyAcrossTeam: 4,
    staffAffected: ["staff_anna", "staff_chervelle", "staff_lackson", "staff_mirela"],
    description:
      "Following Casey's recent disclosure work, several staff have reported in supervision that they are carrying emotional weight home after shifts. Staff describe difficulty sleeping, intrusive thoughts about the children's histories, and reduced enjoyment of personal life. This is a recognised feature of trauma-informed care but had not been formally surfaced before.",
    rootCauseAnalysis:
      "The home has not had a formal vicarious trauma framework. Staff have relied on informal peer support and individual supervision. The intensity of recent direct work, combined with two complex disclosures in 8 weeks, has exposed the gap. Anna's earlier LADO experience also created a heightened sensitivity in the team.",
    organisationalResponse: [
      "Introduce monthly group reflective practice facilitated by external clinician",
      "Refresh the EAP signposting and reduce stigma around accessing it",
      "Embed end-of-shift wind-down conversations into handover routine",
      "Add vicarious trauma check-in to every supervision agenda",
    ],
    trainingImplications: [
      "Vicarious trauma awareness training (whole team)",
      "Self-care and grounding techniques workshop",
      "Trauma-informed supervision training for RM and Deputy",
    ],
    policyImplications: [
      "Add vicarious trauma section to staff wellbeing policy",
      "Update supervision template to include wellbeing as standing item",
    ],
    status: "Active",
    reviewedBy: "staff_darren",
    nextReviewDate: d(14),
    anonymous: false,
  },
  {
    id: "sst_003",
    identifiedDate: d(-104),
    themeArea: "Training",
    themeTitle: "Gaps in attachment theory understanding",
    frequencyAcrossTeam: 6,
    staffAffected: ["staff_ryan", "staff_anna", "staff_edward", "staff_chervelle", "staff_lackson", "staff_mirela"],
    description:
      "Staff have asked for deeper attachment theory input in supervision. While induction covers the basics, the team feel they are working with attachment-disrupted young people daily but lack the language and theoretical depth to plan interventions confidently. Mirela in particular has raised this multiple times.",
    rootCauseAnalysis:
      "Attachment is covered briefly in Level 3 Diploma but not in operational depth. The home's previous attachment training was 18 months ago and team turnover means several staff missed it. The team's hunger for this input reflects strong professional curiosity, not deficit.",
    organisationalResponse: [
      "Commission attachment theory training (2-day external workshop)",
      "Build attachment-informed care plan reviews into monthly clinical meeting",
      "Create attachment profile summaries (already piloted) for each child as ready reference",
      "Set up reflective book club around 'Why Love Matters'",
    ],
    trainingImplications: [
      "Attachment theory in residential care (2 days)",
      "DDP/PACE introduction",
      "Attachment-informed key working",
    ],
    policyImplications: [
      "Attachment-informed practice statement in Statement of Purpose",
      "Care planning template to include attachment profile section",
    ],
    status: "Addressed",
    reviewedBy: "staff_darren",
    nextReviewDate: d(60),
    anonymous: false,
  },
  {
    id: "sst_004",
    identifiedDate: d(-42),
    themeArea: "Communication",
    themeTitle: "Handover information loss between shifts",
    frequencyAcrossTeam: 5,
    staffAffected: ["staff_ryan", "staff_anna", "staff_edward", "staff_chervelle", "staff_mirela"],
    description:
      "Staff repeatedly raise that important information is being missed between shifts — particularly around medication timings, mood patterns, and follow-up actions agreed with young people. The communication book is in use but not consistently. Night staff in particular have flagged that they sometimes start a shift without knowing about the day's incidents.",
    rootCauseAnalysis:
      "Handover format has drifted. The structured 5-point handover (introduced in 2023) is now used inconsistently. Time pressure at shift change is the main driver, with rushed handovers when both shifts are busy. The communication book duplicates the daily log and staff are unsure which to use.",
    organisationalResponse: [
      "Reinstate the 5-point structured handover with printed prompt cards in office",
      "Allocate 30 minutes for protected handover (build into rota)",
      "Clarify role of communication book vs daily log and remove duplication",
      "Trial digital handover summary to be reviewed in 6 weeks",
    ],
    trainingImplications: [
      "Refresher on handover protocol",
      "SBAR communication technique for clinical handovers",
    ],
    policyImplications: [
      "Update handover policy to specify 5-point format and time allocation",
      "Communication book vs daily log clarification",
    ],
    status: "Active",
    reviewedBy: "staff_ryan",
    nextReviewDate: d(7),
    anonymous: false,
  },
  {
    id: "sst_005",
    identifiedDate: d(-28),
    themeArea: "Workload",
    themeTitle: "Recording burden affecting direct work time",
    frequencyAcrossTeam: 7,
    staffAffected: ["staff_ryan", "staff_anna", "staff_edward", "staff_chervelle", "staff_lackson", "staff_mirela", "staff_darren"],
    description:
      "Every staff member has raised in supervision that recording requirements are encroaching on direct work time. Staff report logging the same information across multiple systems (daily log, behaviour log, body map, communication book) and feeling that documentation is now competing with the relational work that is the core of their role.",
    rootCauseAnalysis:
      "The home has added several specialist logs over the last 18 months — each well-intentioned but cumulatively burdensome. The Cornerstone platform is intended to consolidate this but transition is partial. There is also a culture of over-recording driven by inspection anxiety; staff are unclear on what 'good enough' recording looks like.",
    organisationalResponse: [
      "Audit current recording requirements and remove duplication",
      "Accelerate Cornerstone platform rollout to consolidate logs",
      "Set clear standards for 'good enough' recording (proportionality)",
      "Allocate dedicated recording time within shift (20 mins protected)",
    ],
    trainingImplications: [
      "SMART recording workshop",
      "Proportionate recording in residential care",
    ],
    policyImplications: [
      "Recording policy to define minimum standards and reduce duplication",
      "Time allocation guidance for documentation within shifts",
    ],
    status: "Emerging",
    reviewedBy: "staff_darren",
    nextReviewDate: d(10),
    anonymous: false,
  },
  {
    id: "sst_006",
    identifiedDate: d(-49),
    themeArea: "Safeguarding",
    themeTitle: "Hesitation in challenging professional decisions",
    frequencyAcrossTeam: 4,
    staffAffected: ["staff_anna", "staff_chervelle", "staff_lackson", "staff_mirela"],
    description:
      "Staff have anonymously and openly raised that they sometimes feel uncertain about challenging social workers, IROs, or other external professionals when they disagree with a decision affecting a young person. This was particularly evident around a recent contact decision the team felt was unsafe but didn't formally challenge until prompted.",
    rootCauseAnalysis:
      "Power dynamics with external professionals, fear of being seen as 'difficult', and lack of clear escalation pathways. Some staff are early-career and have not had formal training in professional assertiveness. The team also lacks confidence that challenges will be backed by management — though Darren has consistently demonstrated this in practice.",
    organisationalResponse: [
      "Commission professional assertiveness training",
      "Develop clear written escalation pathway poster (RM → RI → LADO → Ofsted)",
      "Role-play challenging conversations in team meeting",
      "RM to model challenge in shadowed multi-agency meetings",
    ],
    trainingImplications: [
      "Professional assertiveness in multi-agency working",
      "Escalation and whistleblowing refresher",
      "Challenging upwards: a worker's guide",
    ],
    policyImplications: [
      "Strengthen 'professional challenge' section of safeguarding policy",
      "Update escalation flow chart in office",
    ],
    status: "Active",
    reviewedBy: "staff_darren",
    nextReviewDate: d(18),
    anonymous: true,
  },
  {
    id: "sst_007",
    identifiedDate: d(-15),
    themeArea: "Reflective",
    themeTitle: "Difficulty sitting with uncertainty in practice",
    frequencyAcrossTeam: 3,
    staffAffected: ["staff_edward", "staff_chervelle", "staff_lackson"],
    description:
      "Newer practitioners have reflected on finding it difficult to tolerate not knowing the 'right' answer when working with young people in crisis. They describe wanting to fix or solve, and finding it uncomfortable when interventions don't produce immediate change. This is a developmental theme rather than a deficit.",
    rootCauseAnalysis:
      "Therapeutic residential work requires the capacity to hold uncertainty — to sit with painful feelings without rushing to resolution. This is a skill developed through experience, supervision, and reflective practice. The team's relative newness (3 staff under 18 months in role) is a contributing factor.",
    organisationalResponse: [
      "Introduce structured reflective practice sessions monthly",
      "Pair newer staff with experienced practitioners for case discussion",
      "Use Schon's reflective cycle as a framework in supervision",
      "Normalise 'I don't know' as an acceptable practice position",
    ],
    trainingImplications: [
      "Reflective practice in residential care",
      "Containment and holding (Bion) workshop",
      "Tolerating uncertainty in trauma work",
    ],
    policyImplications: [
      "Reflective practice expectation in supervision policy",
    ],
    status: "Emerging",
    reviewedBy: "staff_ryan",
    nextReviewDate: d(28),
    anonymous: false,
  },
  {
    id: "sst_008",
    identifiedDate: d(-130),
    themeArea: "Practice",
    themeTitle: "Bedtime routines inconsistent across shifts",
    frequencyAcrossTeam: 4,
    staffAffected: ["staff_anna", "staff_chervelle", "staff_lackson", "staff_mirela"],
    description:
      "Earlier in the year, staff raised that bedtime routines for the three young people were varying significantly depending on staffing. Different bedtimes, different wind-down practices, and inconsistent screen-off times. Young people had commented on this in their meetings. Resolved through team agreement and clearer routine plans.",
    rootCauseAnalysis:
      "Each shift had developed its own informal bedtime culture without explicit team agreement. Routine plans existed for each child but were not consistently followed. Some staff prioritised relational time, others prioritised the schedule.",
    organisationalResponse: [
      "Team workshop to agree consistent bedtime framework",
      "Updated routine plans signed by all staff",
      "Bedtime routine added to monthly key worker review",
      "Reviewed in children's meeting and feedback positive",
    ],
    trainingImplications: [
      "Routine and rhythm in therapeutic care (delivered)",
    ],
    policyImplications: [
      "Routine plans to be reviewed monthly with each child",
    ],
    status: "Addressed",
    reviewedBy: "staff_darren",
    nextReviewDate: d(75),
    anonymous: false,
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function StaffSupervisionThemesPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterArea, setFilterArea] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "frequency">("newest");

  /* summary stats */
  const stats = useMemo(() => {
    const active = data.filter((r) => r.status === "Active" || r.status === "Emerging").length;
    const addressed = data.filter((r) => r.status === "Addressed").length;

    const allStaff = new Set<string>();
    data.forEach((r) => r.staffAffected.forEach((s) => allStaff.add(s)));

    const areaCounts = data.reduce<Record<string, number>>((acc, r) => {
      acc[r.themeArea] = (acc[r.themeArea] ?? 0) + 1;
      return acc;
    }, {});
    const mostCommonArea =
      Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    return {
      active,
      addressed,
      staffAffected: allStaff.size,
      mostCommonArea,
    };
  }, [data]);

  /* filtered & sorted */
  const filtered = useMemo(() => {
    let rows = [...data];
    if (filterArea !== "all") rows = rows.filter((r) => r.themeArea === filterArea);
    if (filterStatus !== "all") rows = rows.filter((r) => r.status === filterStatus);
    rows.sort((a, b) => {
      if (sortBy === "frequency") return b.frequencyAcrossTeam - a.frequencyAcrossTeam;
      if (sortBy === "oldest") return a.identifiedDate.localeCompare(b.identifiedDate);
      return b.identifiedDate.localeCompare(a.identifiedDate);
    });
    return rows;
  }, [data, filterArea, filterStatus, sortBy]);

  /* export */
  const exportCols: ExportColumn<SupervisionTheme>[] = [
    { header: "Identified", accessor: (r: SupervisionTheme) => r.identifiedDate },
    { header: "Area", accessor: (r: SupervisionTheme) => r.themeArea },
    { header: "Theme", accessor: (r: SupervisionTheme) => r.themeTitle },
    { header: "Frequency", accessor: (r: SupervisionTheme) => String(r.frequencyAcrossTeam) },
    { header: "Staff Affected", accessor: (r: SupervisionTheme) => r.anonymous ? "Anonymous" : r.staffAffected.map((s) => getStaffName(s)).join("; ") },
    { header: "Status", accessor: (r: SupervisionTheme) => r.status },
    { header: "Reviewed By", accessor: (r: SupervisionTheme) => getStaffName(r.reviewedBy) },
    { header: "Next Review", accessor: (r: SupervisionTheme) => r.nextReviewDate },
    { header: "Description", accessor: (r: SupervisionTheme) => r.description },
    { header: "Root Cause", accessor: (r: SupervisionTheme) => r.rootCauseAnalysis },
    { header: "Organisational Response", accessor: (r: SupervisionTheme) => r.organisationalResponse.join("; ") },
    { header: "Training Implications", accessor: (r: SupervisionTheme) => r.trainingImplications.join("; ") },
    { header: "Policy Implications", accessor: (r: SupervisionTheme) => r.policyImplications.join("; ") },
  ];

  return (
    <PageShell
      title="Staff Supervision Themes"
      subtitle="Aggregated learning from supervision · Organisational reflection · Training and policy implications"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Supervision Themes" />
          <ExportButton data={data} columns={exportCols} filename="staff-supervision-themes" />
        </div>
      }
    >
      <div id="print-area">
        {/* ── summary stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Active Themes", value: stats.active, icon: Layers, clr: "text-blue-600" },
            { label: "Staff Affected", value: stats.staffAffected, icon: Users, clr: "text-purple-600" },
            { label: "Themes Addressed", value: stats.addressed, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Most Common Area", value: stats.mostCommonArea, icon: Target, clr: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── filters ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Theme area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {(Object.keys(AREA_LABEL) as ThemeArea[]).map((k) => (
                <SelectItem key={k} value={k}>{AREA_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {(Object.keys(STATUS_LABEL) as ThemeStatus[]).map((k) => (
                <SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[170px]">
              <ArrowUpDown className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="frequency">Frequency (high → low)</SelectItem>
            </SelectContent>
          </Select>

          {(filterArea !== "all" || filterStatus !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterArea("all"); setFilterStatus("all"); }}
            >
              Clear filters
            </Button>
          )}

          <span className="text-xs text-muted-foreground ml-auto">
            Showing {filtered.length} of {data.length}
          </span>
        </div>

        {/* ── theme cards ───────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            const Icon = AREA_ICON[r.themeArea];
            return (
              <Card key={r.id} className={cn("border-l-4", AREA_BORDER[r.themeArea])}>
                <CardHeader
                  className="pb-2 cursor-pointer"
                  onClick={() => setExpandedId(isOpen ? null : r.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {r.themeTitle}
                        <Badge variant="outline" className={AREA_CLR[r.themeArea]}>
                          {AREA_LABEL[r.themeArea]}
                        </Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>
                          {STATUS_LABEL[r.status]}
                        </Badge>
                        {r.anonymous && (
                          <Badge variant="outline" className="bg-slate-100 text-slate-700 text-xs flex items-center gap-1">
                            <EyeOff className="h-3 w-3" />Anonymous
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Identified: {r.identifiedDate} · Reviewed by: {getStaffName(r.reviewedBy)} · Next review: {r.nextReviewDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          "bg-muted/60 font-semibold",
                          r.frequencyAcrossTeam >= 6 && "bg-red-50 text-red-700 border-red-200",
                          r.frequencyAcrossTeam >= 4 && r.frequencyAcrossTeam < 6 && "bg-amber-50 text-amber-700 border-amber-200",
                          r.frequencyAcrossTeam < 4 && "bg-blue-50 text-blue-700 border-blue-200",
                        )}
                      >
                        <Users className="h-3 w-3 mr-1" />
                        {r.frequencyAcrossTeam} staff
                      </Badge>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div>
                      <p className="font-medium mb-1">Description</p>
                      <p className="text-muted-foreground text-xs">{r.description}</p>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-200 rounded p-2">
                      <p className="font-medium text-xs text-indigo-800 mb-1 flex items-center gap-1">
                        <Brain className="h-3.5 w-3.5" />Root Cause Analysis
                      </p>
                      <p className="text-xs text-indigo-700">{r.rootCauseAnalysis}</p>
                    </div>

                    {!r.anonymous && r.staffAffected.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Staff Who Raised This Theme</p>
                        <div className="flex flex-wrap gap-1">
                          {r.staffAffected.map((s) => (
                            <Badge key={s} variant="outline" className="bg-muted/50 text-xs">
                              {getStaffName(s)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {r.anonymous && (
                      <div className="bg-slate-50 border border-slate-200 rounded p-2 flex items-start gap-2">
                        <EyeOff className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-600">
                          Identities of staff who raised this theme are protected. Aggregated frequency only.
                        </p>
                      </div>
                    )}

                    {r.organisationalResponse.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-green-700 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />Organisational Response
                        </p>
                        <ul className="space-y-1">
                          {r.organisationalResponse.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {r.trainingImplications.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5 text-purple-600" />Training Implications
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {r.trainingImplications.map((t, i) => (
                            <Badge key={i} variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {r.policyImplications.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-blue-600" />Policy Implications
                        </p>
                        <ul className="space-y-1">
                          {r.policyImplications.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                No themes match the current filters.
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── regulatory note ───────────────────────────────────────────── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory & Practice Framework</p>
          <p>
            Aggregated supervision themes support the registered manager&apos;s duty under the Children&apos;s Homes (England) Regulations 2015 — particularly Regulation 13 (the leadership and management standard, Quality Standard 13) which requires the registered person to lead and manage the home so that staff work effectively to meet children&apos;s needs.
            Working Together to Safeguard Children 2023 expects organisations to have clear arrangements for reflective supervision and for learning from practice to inform organisational development. Themes identified here feed into the workforce development plan, training schedule, policy review cycle, and the Statement of Purpose. Anonymity is preserved where staff disclosed concerns confidentially. Quarterly aggregated themes are shared with the Responsible Individual and reviewed at the home&apos;s clinical governance meeting.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
