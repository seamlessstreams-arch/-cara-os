"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  GraduationCap,
  Users,
  Stethoscope,
  Heart,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type PlanStatus =
  | "Pre-assessment"
  | "Needs Assessment in progress"
  | "Final Plan in place"
  | "Annual Review due"
  | "Refused";

interface EhcpProvision {
  section: string;
  provision: string;
  frequency: string;
  provider: string;
}

interface EhcpRecord {
  id: string;
  youngPerson: string;
  planStatus: PlanStatus;
  planVersion: string;
  dateOfPlan: string;
  lastAnnualReviewDate: string;
  nextAnnualReviewDue: string;
  primaryNeed: string;
  secondaryNeeds: string[];
  placement: string;
  sectionA: string;
  sectionB: string;
  sectionD: string;
  sectionE: string;
  provisionsListed: EhcpProvision[];
  funding: string;
  localAuthority: string;
  sendoOfficer: string;
  transitionPlanning: string;
  childContribution: string;
  parentalInvolvement: string;
  reviewedBy: string;
  outstandingActions: string[];
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const STATUS_META: Record<PlanStatus, { label: string; color: string }> = {
  "Pre-assessment": { label: "Pre-assessment", color: "bg-slate-100 text-slate-700" },
  "Needs Assessment in progress": {
    label: "Needs Assessment",
    color: "bg-blue-100 text-blue-800",
  },
  "Final Plan in place": { label: "Final Plan", color: "bg-green-100 text-green-800" },
  "Annual Review due": { label: "Review Due", color: "bg-amber-100 text-amber-800" },
  Refused: { label: "Refused", color: "bg-red-100 text-red-800" },
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: EhcpRecord[] = [
  {
    id: "ehcp_001",
    youngPerson: "yp_casey",
    planStatus: "Final Plan in place",
    planVersion: "v3.2 (post annual review)",
    dateOfPlan: d(-820),
    lastAnnualReviewDate: d(-90),
    nextAnnualReviewDue: d(275),
    primaryNeed: "ASD (Autism Spectrum Disorder)",
    secondaryNeeds: ["SEMH", "Sensory Processing Difficulties", "Anxiety"],
    placement: "Riverside College (16+) — Specialist Pathway",
    sectionA:
      "Casey aspires to study art at college and become an illustrator or graphic designer. She values creative expression as a way to process emotions and communicate. Casey wants to live semi-independently after care, with support, and hopes to keep contact with her younger sister. She would like to learn to drive and travel to galleries in London.",
    sectionB:
      "Casey has a diagnosis of Autism Spectrum Disorder (ASD) requiring specialist educational provision. She experiences significant difficulties with social communication, flexibility of thought, and sensory regulation. Casey requires a highly structured learning environment, predictable routines, and explicit teaching of social expectations. Casey has co-occurring SEMH needs which are exacerbated by anxiety and historical trauma. Literacy and numeracy are at age-expected levels but executive function difficulties impact her ability to organise and submit coursework independently.",
    sectionD:
      "Casey accesses CAMHS for ongoing mental health support (anxiety and PTSD-related symptoms). She sees an Occupational Therapist fortnightly for sensory regulation strategies. Sleep difficulties are managed via sleep hygiene programme. Casey has historical self-harm and engagement with services is monitored by the placement.",
    sectionE:
      "Casey is a looked-after young person and her social care provision is delivered through her placement at Oak House Children's Home. Section E provision includes: trauma-informed care, key working sessions, life-story work, contact supervision with biological family, and pathway planning under the Care Leavers (England) Regulations 2010 as Casey approaches 16+.",
    provisionsListed: [
      {
        section: "F (Special Educational Provision)",
        provision: "1:1 specialist learning support assistant for all academic lessons",
        frequency: "All timetabled academic sessions",
        provider: "Riverside College SEN team",
      },
      {
        section: "F",
        provision: "Speech and Language Therapy — social communication programme",
        frequency: "Weekly 45-min session",
        provider: "Local Authority SaLT service",
      },
      {
        section: "F",
        provision: "Occupational Therapy — sensory regulation and executive function",
        frequency: "Fortnightly 60-min session",
        provider: "NHS Community Paediatric OT",
      },
      {
        section: "F",
        provision: "Access to designated quiet space and sensory tools",
        frequency: "Daily, on demand",
        provider: "Riverside College",
      },
      {
        section: "F",
        provision: "Exam access arrangements — 25% extra time, separate room, prompter",
        frequency: "All assessments and exams",
        provider: "Riverside College Exams Office",
      },
      {
        section: "G (Health Provision)",
        provision: "CAMHS therapeutic input — CBT-informed and trauma-focused",
        frequency: "Fortnightly 60-min session",
        provider: "CAMHS",
      },
      {
        section: "H1 (Social Care)",
        provision: "Trauma-informed therapeutic placement and key working",
        frequency: "Weekly key working + daily relational care",
        provider: "Oak House Children's Home",
      },
    ],
    funding:
      "Top-up funding £14,500 per annum from placing Local Authority. Additional High Needs Funding (Band 4) £6,000 p.a. via college. Pupil Premium Plus £2,530 p.a.",
    localAuthority: "Birmingham City Council (placing authority)",
    sendoOfficer: "Helena Marsh (SENDO Caseworker — Birmingham)",
    transitionPlanning:
      "Year 11 → 12 transition completed July last year. Currently planning 16-25 transition: preparing for adulthood (PfA) outcomes embedded in the plan covering employment, independent living, community inclusion, and health. Casey will be referred to Adult Social Care for assessment under the Care Act 2014 by her 17.5 birthday. Pathway plan and EHCP review will run concurrently from age 17.",
    childContribution:
      "Casey contributed views via her advocate using a strengths-based 'One Page Profile'. She drew her ideal future ('living in a small flat with a cat, working in a gallery shop'). Casey said the most helpful provision is the SaLT and the 1:1 LSA in art. She finds the quiet room 'a lifesaver'. She does not like being asked to attend large meetings — last review was held in two shorter sessions at her request.",
    parentalInvolvement:
      "Casey's mother contributed views in writing via the social worker. She supports the current EHCP provision and asked that her cultural heritage (Black British/Jamaican) is reflected in Casey's curriculum and identity work. The placement and college have committed to incorporating this into Section A and Section F provision.",
    reviewedBy: "staff_edward",
    outstandingActions: [
      "SENDO to confirm carry-over of top-up funding into next academic year",
      "Annual review paperwork (R1-R12) to be uploaded to LA portal by SENDO within 4 weeks",
      "Schedule transition review meeting with Adult Social Care by Casey's 17.5 birthday",
    ],
  },
  {
    id: "ehcp_002",
    youngPerson: "yp_alex",
    planStatus: "Needs Assessment in progress",
    planVersion: "Application stage (no plan issued yet)",
    dateOfPlan: "—",
    lastAnnualReviewDate: "—",
    nextAnnualReviewDue: "—",
    primaryNeed: "ADHD (Attention Deficit Hyperactivity Disorder)",
    secondaryNeeds: ["SEMH", "Specific Learning Difficulty (literacy)", "Attachment-related needs"],
    placement: "Eastbrook Academy — mainstream with SEN Support",
    sectionA:
      "(Draft — not yet finalised) Alex enjoys football, gaming and hands-on learning. He wants to be a PE teacher or sports coach. He says he learns best 'when he can move around' and finds long writing tasks difficult. He wants more help with reading and to feel less stressed in lessons.",
    sectionB:
      "(Draft — pending Educational Psychologist report) Alex presents with persistent difficulties consistent with ADHD (combined presentation), confirmed via paediatric assessment 6 months ago. Specific Learning Difficulty in literacy identified — reading age 2 years below chronological age. Executive function difficulties significantly impact independent learning. Attachment-related needs from early-life experiences contribute to dysregulation in unstructured periods.",
    sectionD:
      "(Draft) Alex is prescribed Methylphenidate (Equasym XL 30mg) — initiated 5 months ago, well-tolerated. Reviewed by paediatrician 3-monthly. Sleep is good. No physical health concerns.",
    sectionE:
      "(Draft) Alex is a looked-after child placed at Oak House Children's Home. Social care provision is delivered through the placement and includes therapeutic key working, contact supervision with family, life story work and identity support.",
    provisionsListed: [
      {
        section: "Currently SEN Support (no Section F yet)",
        provision: "School-based intervention — small group literacy ('Lexia')",
        frequency: "3 x 30-min sessions weekly",
        provider: "Eastbrook Academy SENCO team",
      },
      {
        section: "Currently SEN Support",
        provision: "Pupil Premium Plus funded 1:1 maths tutoring",
        frequency: "Weekly 30-min session",
        provider: "External tutor commissioned via Virtual School",
      },
      {
        section: "Currently SEN Support",
        provision: "Pastoral mentor — emotional check-ins",
        frequency: "Daily morning check-in",
        provider: "Eastbrook Academy pastoral team",
      },
      {
        section: "Health (NHS)",
        provision: "ADHD medication review",
        frequency: "Quarterly",
        provider: "Community Paediatrics",
      },
    ],
    funding: "Currently SEN Support funding only. EHCP application submitted to LA — awaiting decision on whether to issue plan.",
    localAuthority: "Birmingham City Council",
    sendoOfficer: "Pending allocation (SENDO assigned once plan is issued)",
    transitionPlanning:
      "If EHCP is issued, transition planning will form part of Year 9 review (statutory). Currently in Year 9 — careers interview booked.",
    childContribution:
      "Alex completed a 'My Voice' form with his key worker. He said school is 'alright' but wishes there was 'more help with reading without it being embarrassing'. He wants to play football for his country one day. He doesn't want to be 'the kid with the assistant' — important the EHCP provision is delivered discreetly and respects his peer relationships.",
    parentalInvolvement:
      "Alex's mother is supportive of the EHCP application and has signed consent. She attended the multi-agency planning meeting and contributed views about Alex's strengths and his early educational difficulties. Her contribution is logged in the Section A working draft.",
    reviewedBy: "staff_edward",
    outstandingActions: [
      "Educational Psychologist assessment booked — report due in 6 weeks",
      "Statutory 16-week deadline for EHCP decision: LA must respond by " + d(45),
      "Chase SENDO at Birmingham LA — draft plan must be shared with parents/carers and Alex for 15-day consultation period",
      "If plan refused, prepare evidence for SENDIST tribunal appeal in liaison with IPSEA",
    ],
  },
  {
    id: "ehcp_003",
    youngPerson: "yp_jordan",
    planStatus: "Pre-assessment",
    planVersion: "No EHCP — SEN Support only",
    dateOfPlan: "—",
    lastAnnualReviewDate: "—",
    nextAnnualReviewDue: "—",
    primaryNeed: "SEMH (Social, Emotional and Mental Health)",
    secondaryNeeds: ["Trauma-related needs", "Emerging speech and language concerns"],
    placement: "Meadowbank Secondary — SEN Support (no EHCP)",
    sectionA:
      "Not applicable — Jordan does not have an EHCP. Currently supported via the school's graduated approach (SEN Support). Educational provision is recorded in Jordan's school-based 'My Plan'.",
    sectionB:
      "Not applicable. SEN Support need recorded as SEMH primary, with emerging concerns around expressive language. The school SENCO is monitoring progress through the 'assess-plan-do-review' cycle.",
    sectionD:
      "Not applicable. Jordan is registered with the placement GP and accesses CAMHS Tier 2 (school-based emotional wellbeing practitioner). No medication.",
    sectionE:
      "Not applicable. Jordan is a looked-after child at Oak House Children's Home — social care needs are met through the placement and care plan.",
    provisionsListed: [
      {
        section: "SEN Support (school-based)",
        provision: "Pastoral mentor — weekly 1:1 check-in",
        frequency: "Weekly 30-min",
        provider: "Meadowbank Secondary",
      },
      {
        section: "SEN Support",
        provision: "Nurture group — small-group SEMH intervention",
        frequency: "2 x weekly 45-min",
        provider: "Meadowbank Secondary inclusion team",
      },
      {
        section: "SEN Support",
        provision: "School-based emotional wellbeing practitioner (CAMHS Tier 2)",
        frequency: "Fortnightly 50-min",
        provider: "Mental Health Support Team (MHST)",
      },
    ],
    funding: "SEN Support funded from school's notional SEN budget. No top-up funding. Pupil Premium Plus £2,530 p.a. supports interventions.",
    localAuthority: "Birmingham City Council",
    sendoOfficer: "N/A — no allocated SENDO unless plan applied for",
    transitionPlanning:
      "Standard Year 9 → KS4 transition planning via school. EHCP not currently considered necessary as Jordan is making expected progress with SEN Support. Decision to apply will be reviewed at next annual care plan review.",
    childContribution:
      "Jordan has not been part of any EHCP process. They contribute views to their school 'My Plan' termly and to their LAC reviews. Jordan said school is 'fine' and that the nurture group is the 'best bit'.",
    parentalInvolvement:
      "Jordan's father has been informed that an EHCP is not currently being pursued. He agrees with this approach but asked to be informed if needs escalate. Position is documented in the care plan.",
    reviewedBy: "staff_edward",
    outstandingActions: [
      "Review SEN Support effectiveness at next assess-plan-do-review cycle (school termly)",
      "If progress plateaus or needs escalate, request EHCP needs assessment from LA (parent/carer or YP can request directly)",
      "Ensure SEN Support continues to be evidenced in care plan and LAC review minutes",
    ],
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function EhcpTrackerPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "status" | "review">("status");
  const [filterStatus, setFilterStatus] = useState<"all" | PlanStatus>("all");

  const filtered = useMemo(() => {
    return data.filter((r) => filterStatus === "all" || r.planStatus === filterStatus);
  }, [data, filterStatus]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        case "review":
          // Records with no review due date go to bottom
          if (a.nextAnnualReviewDue === "—") return 1;
          if (b.nextAnnualReviewDue === "—") return -1;
          return a.nextAnnualReviewDue.localeCompare(b.nextAnnualReviewDue);
        default:
          // status order: review due > assessment in progress > final plan > pre-assessment > refused
          const order: Record<PlanStatus, number> = {
            "Annual Review due": 0,
            "Needs Assessment in progress": 1,
            "Final Plan in place": 2,
            "Pre-assessment": 3,
            Refused: 4,
          };
          return order[a.planStatus] - order[b.planStatus];
      }
    });
  }, [filtered, sortBy]);

  const exportCols: ExportColumn<EhcpRecord>[] = [
    { header: "Young Person", accessor: (r: EhcpRecord) => getYPName(r.youngPerson) },
    { header: "Plan Status", accessor: (r: EhcpRecord) => r.planStatus },
    { header: "Plan Version", accessor: (r: EhcpRecord) => r.planVersion },
    { header: "Date of Plan", accessor: (r: EhcpRecord) => r.dateOfPlan },
    { header: "Last Annual Review", accessor: (r: EhcpRecord) => r.lastAnnualReviewDate },
    { header: "Next Annual Review Due", accessor: (r: EhcpRecord) => r.nextAnnualReviewDue },
    { header: "Primary Need", accessor: (r: EhcpRecord) => r.primaryNeed },
    { header: "Secondary Needs", accessor: (r: EhcpRecord) => r.secondaryNeeds.join("; ") },
    { header: "Placement / Setting", accessor: (r: EhcpRecord) => r.placement },
    { header: "Local Authority", accessor: (r: EhcpRecord) => r.localAuthority },
    { header: "SENDO Officer", accessor: (r: EhcpRecord) => r.sendoOfficer },
    { header: "Funding", accessor: (r: EhcpRecord) => r.funding },
    { header: "Reviewed By", accessor: (r: EhcpRecord) => getStaffName(r.reviewedBy) },
    {
      header: "Outstanding Actions",
      accessor: (r: EhcpRecord) => r.outstandingActions.join(" | "),
    },
  ];

  /* summary stats */
  const activePlans = data.filter((r) => r.planStatus === "Final Plan in place").length;
  const reviewsDue = data.filter((r) => r.planStatus === "Annual Review due").length;
  const inAssessment = data.filter(
    (r) => r.planStatus === "Needs Assessment in progress"
  ).length;
  // Time-to-plan: average gap from earliest plan in our data — illustrative only.
  // Statutory deadline is 20 weeks; we display the LA's stated average.
  const avgTimeToPlan = "18 weeks (LA stated average)";

  // Alert: any plan with annual review due within 30 days (or "Annual Review due" status)
  const reviewSoon = data.filter((r) => {
    if (r.planStatus === "Annual Review due") return true;
    if (r.nextAnnualReviewDue === "—") return false;
    const dueDate = new Date(r.nextAnnualReviewDue);
    const now = new Date();
    const days = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return days <= 30 && days >= 0;
  });

  const inAssessmentList = data.filter((r) => r.planStatus === "Needs Assessment in progress");

  return (
    <PageShell
      title="EHCP Tracker"
      subtitle="Education, Health and Care Plans · SEND · Children and Families Act 2014"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="EHCP Tracker" />
          <ExportButton data={data} columns={exportCols} filename="ehcp-tracker" />
        </div>
      }
    >
      <div id="print-area">
        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{activePlans}</p>
              <p className="text-xs text-muted-foreground">Active EHCPs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p
                className={cn(
                  "text-2xl font-bold",
                  reviewsDue > 0 ? "text-amber-600" : "text-green-600"
                )}
              >
                {reviewsDue}
              </p>
              <p className="text-xs text-muted-foreground">Annual Reviews Due</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-blue-700">{inAssessment}</p>
              <p className="text-xs text-muted-foreground">In Assessment</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{avgTimeToPlan}</p>
              <p className="text-xs text-muted-foreground">
                Avg Time-to-Plan (statutory: 20 wks)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* alerts */}
        {reviewSoon.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">Annual Review Approaching</p>
              <p className="text-amber-700">
                {reviewSoon
                  .map(
                    (r) =>
                      `${getYPName(r.youngPerson)} (due ${r.nextAnnualReviewDue === "—" ? "review now" : r.nextAnnualReviewDue})`
                  )
                  .join(", ")}{" "}
                — annual reviews are statutory under the Children and Families Act 2014. Convene
                review meeting and notify SENDO officer.
              </p>
            </div>
          </div>
        )}

        {inAssessmentList.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-800">EHCP Needs Assessment Underway</p>
              <p className="text-blue-700">
                {inAssessmentList
                  .map((r) => `${getYPName(r.youngPerson)} (${r.primaryNeed})`)
                  .join(", ")}{" "}
                — LA must complete needs assessment and issue draft/refusal within 20 weeks of
                request. Track statutory deadline and chase SENDO if drift.
              </p>
            </div>
          </div>
        )}

        {/* filters and sort */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[200px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Sort: Status priority</SelectItem>
                <SelectItem value="review">Sort: Next review (soonest)</SelectItem>
                <SelectItem value="name">Sort: Name (A–Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}
            >
              <SelectTrigger className="w-[220px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Filter: All statuses</SelectItem>
                <SelectItem value="Final Plan in place">Final Plan in place</SelectItem>
                <SelectItem value="Needs Assessment in progress">
                  Needs Assessment in progress
                </SelectItem>
                <SelectItem value="Annual Review due">Annual Review due</SelectItem>
                <SelectItem value="Pre-assessment">Pre-assessment</SelectItem>
                <SelectItem value="Refused">Refused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* records */}
        <div className="space-y-3">
          {sorted.map((r) => {
            const isOpen = expandedId === r.id;
            const isFinal = r.planStatus === "Final Plan in place";
            const isInAssessment = r.planStatus === "Needs Assessment in progress";
            const isPre = r.planStatus === "Pre-assessment";
            return (
              <Card
                key={r.id}
                className={cn(
                  "border-l-4",
                  isFinal
                    ? "border-l-green-500"
                    : isInAssessment
                      ? "border-l-blue-500"
                      : r.planStatus === "Annual Review due"
                        ? "border-l-amber-500"
                        : "border-l-slate-300"
                )}
              >
                <CardHeader
                  className="pb-2 cursor-pointer"
                  onClick={() => setExpandedId(isOpen ? null : r.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        <FileText className="h-4 w-4 text-blue-600" />
                        {getYPName(r.youngPerson)}
                        <Badge variant="outline" className={STATUS_META[r.planStatus].color}>
                          {STATUS_META[r.planStatus].label}
                        </Badge>
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                          {r.primaryNeed}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.placement} · LA: {r.localAuthority} · Reviewed by{" "}
                        {getStaffName(r.reviewedBy)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Plan: {r.planVersion}
                        {r.dateOfPlan !== "—" && <> · Issued {r.dateOfPlan}</>}
                        {r.nextAnnualReviewDue !== "—" && (
                          <> · Next review {r.nextAnnualReviewDue}</>
                        )}
                      </p>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* SEN Support note for Jordan */}
                    {isPre && (
                      <div className="bg-slate-50 border border-slate-200 rounded p-3">
                        <p className="font-medium text-xs text-slate-800 mb-1 flex items-center gap-1">
                          <ClipboardList className="h-3.5 w-3.5" />
                          No EHCP — SEN Support only
                        </p>
                        <p className="text-xs text-slate-700">
                          {getYPName(r.youngPerson)} does not currently have an EHCP. Educational
                          needs are met through the school&apos;s graduated SEN Support approach
                          (assess-plan-do-review). An EHCP needs assessment can be requested by
                          the young person, parent, or carer at any time if needs escalate or
                          progress is not made via SEN Support.
                        </p>
                      </div>
                    )}

                    {/* core info grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Date of Plan</p>
                        <p className="font-medium">{r.dateOfPlan}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Last Annual Review</p>
                        <p className="font-medium">{r.lastAnnualReviewDate}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Next Review Due</p>
                        <p className="font-medium">{r.nextAnnualReviewDue}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">SENDO Officer</p>
                        <p className="font-medium">{r.sendoOfficer}</p>
                      </div>
                    </div>

                    {/* needs */}
                    <div>
                      <p className="font-medium mb-2 flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-purple-600" /> Identified Needs
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                          Primary: {r.primaryNeed}
                        </Badge>
                        {r.secondaryNeeds.map((n, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="bg-purple-50 text-purple-700"
                          >
                            {n}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* sections A, B, D, E */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="font-medium text-xs text-blue-800 mb-1 flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" /> Section A — Aspirations
                        </p>
                        <p className="text-xs text-blue-700">{r.sectionA}</p>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-200 rounded p-2">
                        <p className="font-medium text-xs text-indigo-800 mb-1 flex items-center gap-1">
                          <GraduationCap className="h-3.5 w-3.5" /> Section B — Special
                          Educational Needs
                        </p>
                        <p className="text-xs text-indigo-700">{r.sectionB}</p>
                      </div>
                      <div className="bg-rose-50 border border-rose-200 rounded p-2">
                        <p className="font-medium text-xs text-rose-800 mb-1 flex items-center gap-1">
                          <Stethoscope className="h-3.5 w-3.5" /> Section D — Health Needs
                        </p>
                        <p className="text-xs text-rose-700">{r.sectionD}</p>
                      </div>
                      <div className="bg-teal-50 border border-teal-200 rounded p-2">
                        <p className="font-medium text-xs text-teal-800 mb-1 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> Section E — Social Care Needs
                        </p>
                        <p className="text-xs text-teal-700">{r.sectionE}</p>
                      </div>
                    </div>

                    {/* provisions */}
                    <div>
                      <p className="font-medium mb-2 flex items-center gap-1">
                        <ClipboardList className="h-4 w-4 text-green-600" /> Provisions
                      </p>
                      <div className="space-y-1">
                        {r.provisionsListed.map((p, i) => (
                          <div key={i} className="bg-muted/40 rounded p-2 text-xs">
                            <div className="flex items-center justify-between mb-0.5 flex-wrap gap-1">
                              <span className="font-medium">{p.provision}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {p.section}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">
                              {p.frequency} · Provider: {p.provider}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* funding */}
                    <div className="bg-amber-50 border border-amber-200 rounded p-2">
                      <p className="font-medium text-xs text-amber-800 mb-1">Funding</p>
                      <p className="text-xs text-amber-700">{r.funding}</p>
                    </div>

                    {/* transition planning */}
                    <div>
                      <p className="font-medium text-xs mb-1 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-purple-600" /> Transition Planning
                      </p>
                      <p className="text-xs text-muted-foreground">{r.transitionPlanning}</p>
                    </div>

                    {/* child contribution */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">
                        Child&apos;s Contribution
                      </p>
                      <p className="text-xs text-blue-700">{r.childContribution}</p>
                    </div>

                    {/* parental involvement */}
                    <div>
                      <p className="font-medium text-xs mb-1">Parental / Carer Involvement</p>
                      <p className="text-xs text-muted-foreground">{r.parentalInvolvement}</p>
                    </div>

                    {/* outstanding actions */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <Clock className="h-4 w-4 text-amber-600" /> Outstanding Actions
                      </p>
                      {r.outstandingActions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No outstanding actions.</p>
                      ) : (
                        r.outstandingActions.map((a, i) => (
                          <div
                            key={i}
                            className="bg-muted/40 rounded p-2 mb-1 flex items-start gap-2 text-xs"
                          >
                            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>{a}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* reviewed by */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <span>
                        Last reviewed by {getStaffName(r.reviewedBy)} (Education Lead)
                      </span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">
            Education, Health and Care Plans (EHCPs) — Statutory Framework
          </p>
          <p>
            EHCPs are statutory documents under the Children and Families Act 2014 (Part 3) and
            the SEND Code of Practice 2015 (0-25 years). They describe the special educational,
            health and social care needs of a child or young person and the provision required.
            The Local Authority must complete a needs assessment and issue a final plan (or
            decide not to issue) within 20 weeks of a request. EHCPs must be reviewed at least
            annually (every 12 months), and within 6 months for children under 5. Children&apos;s
            home registered managers are responsible under Quality Standard 8 (Education) of the
            Children&apos;s Homes Regulations 2015 for ensuring EHCPs are in place where needed,
            up to date, and that provision is delivered. Where needs are not met, escalation to
            the SENDO and, if necessary, the SEND Tribunal (SENDIST) is the formal route. The
            child&apos;s views must be central to the EHCP process at every stage (Section A,
            child&apos;s contribution).
          </p>
        </div>
      </div>
    </PageShell>
  );
}
