"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Shield,
  ArrowUpDown,
  Search,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge }        from "@/components/ui/badge";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────── */

type Status = "on_track" | "attention_needed" | "not_age_appropriate";

interface Domain {
  name: string;
  score: number;
  maxScore: number;
  evidence: string;
  nextSteps: string;
}

interface PathwayAssessment {
  id: string;
  youngPersonId: string;
  assessedBy: string;
  assessmentDate: string;
  reviewDate: string;
  overallReadiness: number;
  domains: Domain[];
  status: Status;
  expectedTransitionAge: number;
  pathwayPlanLinked: boolean;
  notes: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: PathwayAssessment[] = [
  {
    id: "pa1",
    youngPersonId: "yp_casey",
    assessedBy: "staff_chervelle",
    assessmentDate: d(-14),
    reviewDate: d(60),
    overallReadiness: 65,
    domains: [
      { name: "Managing money", score: 4, maxScore: 5, evidence: "Manages pocket money well, opened savings account", nextSteps: "Introduce monthly budgeting with bills simulation" },
      { name: "Cooking & nutrition", score: 3, maxScore: 5, evidence: "Can cook basic meals, needs support with planning", nextSteps: "Weekly meal planning sessions, introduce batch cooking" },
      { name: "Personal hygiene", score: 5, maxScore: 5, evidence: "Fully independent", nextSteps: "Maintain — no further intervention needed" },
      { name: "Household tasks", score: 3, maxScore: 5, evidence: "Can do laundry, needs prompting for cleaning", nextSteps: "Create cleaning rota for own space, reduce prompting" },
      { name: "Using public transport", score: 4, maxScore: 5, evidence: "Travels independently to school and activities", nextSteps: "Plan unfamiliar multi-leg journeys independently" },
      { name: "Health management", score: 3, maxScore: 5, evidence: "Attends appointments but needs reminding, understands medication", nextSteps: "Self-manage appointment diary, explore GP self-referral" },
      { name: "Education/employment", score: 3, maxScore: 5, evidence: "In school, no clear post-16 plan yet", nextSteps: "Careers guidance session, explore apprenticeship options" },
      { name: "Social networks", score: 4, maxScore: 5, evidence: "Good friendships, some concerning peers", nextSteps: "Work on identifying healthy vs unhealthy relationships" },
      { name: "Emotional readiness", score: 2, maxScore: 5, evidence: "Still needs adult support with regulation, not ready for independence", nextSteps: "Continue therapeutic support, build coping toolkit" },
      { name: "Knowing rights", score: 4, maxScore: 5, evidence: "Articulate about rights, engages with advocacy", nextSteps: "Introduce housing rights and tenancy law basics" },
    ],
    status: "on_track",
    expectedTransitionAge: 18,
    pathwayPlanLinked: true,
    notes: "Casey is progressing well in practical skills but emotional readiness remains the key concern. Transition timeline should not be rushed — Casey needs continued therapeutic support alongside skill-building.",
  },
  {
    id: "pa2",
    youngPersonId: "yp_alex",
    assessedBy: "staff_anna",
    assessmentDate: d(-21),
    reviewDate: d(90),
    overallReadiness: 35,
    domains: [
      { name: "Managing money", score: 2, maxScore: 5, evidence: "Basic understanding of coins/notes, no budgeting practice yet", nextSteps: "Start pocket money tracking with visual chart" },
      { name: "Cooking & nutrition", score: 2, maxScore: 5, evidence: "Can make toast and cereal, interested in baking", nextSteps: "Cook together weekly — start with simple recipes Alex chooses" },
      { name: "Personal hygiene", score: 4, maxScore: 5, evidence: "Good routine established, occasional reminders needed for teeth", nextSteps: "Maintain routine, introduce responsibility for buying own products" },
      { name: "Household tasks", score: 2, maxScore: 5, evidence: "Will help when asked but no independent initiative", nextSteps: "Assign one regular chore as own responsibility" },
      { name: "Using public transport", score: 2, maxScore: 5, evidence: "Not yet age-appropriate for solo travel", nextSteps: "Accompanied bus journeys to build familiarity and confidence" },
      { name: "Health management", score: 3, maxScore: 5, evidence: "Understands why appointments matter, can describe own needs", nextSteps: "Practice explaining health needs to professionals" },
      { name: "Education/employment", score: 4, maxScore: 5, evidence: "Engaged well in school, good attendance, clear interests", nextSteps: "Support subject choices, explore extracurricular options" },
      { name: "Social networks", score: 3, maxScore: 5, evidence: "Has a small friendship group, some social anxiety", nextSteps: "Support social confidence through group activities" },
      { name: "Emotional readiness", score: 3, maxScore: 5, evidence: "Can identify emotions, developing self-regulation strategies", nextSteps: "Continue key-working on emotional literacy" },
      { name: "Knowing rights", score: 3, maxScore: 5, evidence: "Knows about children's rights, participates in house meetings", nextSteps: "Introduce advocacy and complaints process" },
    ],
    status: "not_age_appropriate",
    expectedTransitionAge: 18,
    pathwayPlanLinked: false,
    notes: "Alex is young and not expected to score highly yet. Focus is on age-appropriate skill building (cooking together, understanding money, building confidence). No pressure toward independence — still needs primary care experience.",
  },
  {
    id: "pa3",
    youngPersonId: "yp_jordan",
    assessedBy: "staff_anna",
    assessmentDate: d(-21),
    reviewDate: d(90),
    overallReadiness: 25,
    domains: [
      { name: "Managing money", score: 1, maxScore: 5, evidence: "No understanding of money management yet", nextSteps: "Introduce coins/notes through play, pocket money with visual savings jar" },
      { name: "Cooking & nutrition", score: 2, maxScore: 5, evidence: "Will help with supervised baking, limited interest otherwise", nextSteps: "Sensory-friendly cooking activities — focus on textures Jordan tolerates" },
      { name: "Personal hygiene", score: 3, maxScore: 5, evidence: "Needs support due to sensory needs — dislikes certain textures", nextSteps: "Occupational therapy input on sensory-friendly hygiene products" },
      { name: "Household tasks", score: 2, maxScore: 5, evidence: "Can tidy own room with visual checklist support", nextSteps: "Expand to one communal area task with sensory accommodations" },
      { name: "Using public transport", score: 1, maxScore: 5, evidence: "Significant anxiety about public transport, sensory overload", nextSteps: "Gradual exposure — short accompanied journeys at quiet times" },
      { name: "Health management", score: 2, maxScore: 5, evidence: "Relies on staff, finds appointments distressing", nextSteps: "Social story about health appointments, pre-visit preparation" },
      { name: "Education/employment", score: 3, maxScore: 5, evidence: "Engaged with adapted curriculum, makes progress with support", nextSteps: "Continue EHCP support, explore interests for future options" },
      { name: "Social networks", score: 2, maxScore: 5, evidence: "Finds group settings challenging, one close peer relationship", nextSteps: "Build confidence in small group settings, nurture existing friendship" },
      { name: "Emotional readiness", score: 2, maxScore: 5, evidence: "Dysregulation linked to attachment difficulties and sensory needs", nextSteps: "Trauma-informed therapeutic work, sensory regulation strategies" },
      { name: "Knowing rights", score: 2, maxScore: 5, evidence: "Beginning to understand choices and preferences", nextSteps: "Use visual aids to explain rights in accessible way" },
    ],
    status: "not_age_appropriate",
    expectedTransitionAge: 18,
    pathwayPlanLinked: false,
    notes: "Jordan is the youngest and has additional needs (sensory processing, attachment difficulties). Independence work should be playful, trauma-informed, and at Jordan's pace. Key focus: self-care with sensory accommodations, and building confidence in social settings.",
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const STATUS_META: Record<Status, { label: string; colour: string }> = {
  on_track:            { label: "On Track",            colour: "bg-green-100 text-green-700" },
  attention_needed:    { label: "Attention Needed",    colour: "bg-amber-100 text-amber-700" },
  not_age_appropriate: { label: "Not Age-Appropriate", colour: "bg-blue-100 text-blue-700" },
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function IndependencePathwayPage() {
  const [data] = useState<PathwayAssessment[]>(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState<"readiness" | "name" | "review">("readiness");

  /* ── filtered & sorted ───────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...data];
    if (filterYP !== "all") list = list.filter((a) => a.youngPersonId === filterYP);
    list.sort((a, b) => {
      switch (sortBy) {
        case "readiness": return b.overallReadiness - a.overallReadiness;
        case "review":    return a.reviewDate.localeCompare(b.reviewDate);
        default:          return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
      }
    });
    return list;
  }, [data, filterYP, sortBy]);

  /* ── summary stats ───────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const avgReadiness = Math.round(data.reduce((s, a) => s + a.overallReadiness, 0) / data.length);
    const domainsNeedingAttention = data.flatMap((a) =>
      a.domains.filter((dm) => dm.score <= 2).map((dm) => ({ domain: dm.name, youngPerson: getYPName(a.youngPersonId), score: dm.score }))
    );
    const nextReviews = data
      .map((a) => ({ youngPerson: getYPName(a.youngPersonId), reviewDate: a.reviewDate }))
      .sort((a, b) => a.reviewDate.localeCompare(b.reviewDate));
    return { avgReadiness, domainsNeedingAttention, nextReviews };
  }, [data]);

  /* ── readiness colour helper ─────────────────────────────────────────── */
  const readinessColour = (pct: number) =>
    pct >= 60 ? "text-green-600" : pct >= 40 ? "text-amber-600" : "text-red-600";

  const readinessBg = (pct: number) =>
    pct >= 60 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";

  const scoreBadge = (score: number) =>
    score >= 4 ? "bg-green-100 text-green-700" :
    score >= 3 ? "bg-amber-100 text-amber-700" :
    "bg-red-100 text-red-700";

  /* ── export ──────────────────────────────────────────────────────────── */
  const exportData = useMemo(() => data.flatMap((a) => a.domains.map((dm) => ({
    youngPerson: getYPName(a.youngPersonId),
    assessedBy: getStaffName(a.assessedBy),
    assessmentDate: a.assessmentDate,
    reviewDate: a.reviewDate,
    overallReadiness: `${a.overallReadiness}%`,
    status: STATUS_META[a.status].label,
    domain: dm.name,
    score: `${dm.score}/${dm.maxScore}`,
    evidence: dm.evidence,
    nextSteps: dm.nextSteps,
    expectedTransitionAge: String(a.expectedTransitionAge),
    pathwayPlanLinked: a.pathwayPlanLinked ? "Yes" : "No",
    notes: a.notes,
  }))), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Young Person",          accessor: (r: typeof exportData[number]) => r.youngPerson },
    { header: "Assessed By",           accessor: (r: typeof exportData[number]) => r.assessedBy },
    { header: "Assessment Date",       accessor: (r: typeof exportData[number]) => r.assessmentDate },
    { header: "Review Date",           accessor: (r: typeof exportData[number]) => r.reviewDate },
    { header: "Overall Readiness",     accessor: (r: typeof exportData[number]) => r.overallReadiness },
    { header: "Status",                accessor: (r: typeof exportData[number]) => r.status },
    { header: "Domain",                accessor: (r: typeof exportData[number]) => r.domain },
    { header: "Score",                 accessor: (r: typeof exportData[number]) => r.score },
    { header: "Evidence",              accessor: (r: typeof exportData[number]) => r.evidence },
    { header: "Next Steps",            accessor: (r: typeof exportData[number]) => r.nextSteps },
    { header: "Expected Transition",   accessor: (r: typeof exportData[number]) => r.expectedTransitionAge },
    { header: "Pathway Plan Linked",   accessor: (r: typeof exportData[number]) => r.pathwayPlanLinked },
    { header: "Notes",                 accessor: (r: typeof exportData[number]) => r.notes },
  ];

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <PageShell
      title="Independence Pathway"
      subtitle="Overall pathway assessment and transition readiness tracking for each young person"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="independence-pathway" />
          <PrintButton title="Independence Pathway" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── summary stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Readiness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-brand" />
                <div>
                  <p className={cn("text-3xl font-bold", readinessColour(stats.avgReadiness))}>{stats.avgReadiness}%</p>
                  <p className="text-xs text-muted-foreground">across {data.length} young people</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Domains Needing Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-3xl font-bold text-amber-600">{stats.domainsNeedingAttention.length}</p>
                  <p className="text-xs text-muted-foreground">scored 2/5 or below</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Next Review Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-lg font-bold">{stats.nextReviews[0]?.reviewDate}</p>
                  <p className="text-xs text-muted-foreground">{stats.nextReviews[0]?.youngPerson}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── per-child readiness overview ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.map((a) => {
            const avgDomain = Math.round((a.domains.reduce((s, dm) => s + dm.score, 0) / a.domains.length) * 20);
            return (
              <div key={a.id} className="rounded-lg border bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{getYPName(a.youngPersonId)}</h3>
                  <span className={cn("text-lg font-bold", readinessColour(a.overallReadiness))}>
                    {a.overallReadiness}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", readinessBg(a.overallReadiness))} style={{ width: `${a.overallReadiness}%` }} />
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge className={cn("text-xs", STATUS_META[a.status].colour)}>{STATUS_META[a.status].label}</Badge>
                  {a.pathwayPlanLinked && <Badge className="text-xs bg-purple-100 text-purple-700">Pathway Plan Linked</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  Assessed {a.assessmentDate} by {getStaffName(a.assessedBy)} · Review due {a.reviewDate}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── filters ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterYP}
              onChange={(e) => setFilterYP(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="all">All Young People</option>
              {data.map((a) => (
                <option key={a.youngPersonId} value={a.youngPersonId}>{getYPName(a.youngPersonId)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="rounded border px-2 py-1.5 text-sm">
              <option value="readiness">Readiness Score</option>
              <option value="name">Name</option>
              <option value="review">Next Review</option>
            </select>
          </div>
        </div>

        {/* ── expandable assessment cards ───────────────────────────────── */}
        {filtered.map((assessment) => (
          <div key={assessment.id} className="rounded-lg border bg-white overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === assessment.id ? null : assessment.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <h3 className="font-semibold">{getYPName(assessment.youngPersonId)}</h3>
                  <p className="text-xs text-muted-foreground">
                    Readiness {assessment.overallReadiness}% · {assessment.domains.length} domains assessed · Review due {assessment.reviewDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={cn("text-xs", STATUS_META[assessment.status].colour)}>
                  {STATUS_META[assessment.status].label}
                </Badge>
                {expandedId === assessment.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </button>

            {expandedId === assessment.id && (
              <div className="border-t p-4 space-y-4">
                {/* assessment meta */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Assessed by:</span>
                    <p className="font-medium">{getStaffName(assessment.assessedBy)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Assessment date:</span>
                    <p className="font-medium">{assessment.assessmentDate}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expected transition age:</span>
                    <p className="font-medium">{assessment.expectedTransitionAge}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pathway Plan linked:</span>
                    <p className="font-medium">{assessment.pathwayPlanLinked ? "Yes" : "No"}</p>
                  </div>
                </div>

                {/* readiness bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Overall Readiness</span>
                    <span className={cn("text-sm font-bold", readinessColour(assessment.overallReadiness))}>{assessment.overallReadiness}%</span>
                  </div>
                  <div className="w-full h-4 rounded-full bg-gray-100 overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", readinessBg(assessment.overallReadiness))} style={{ width: `${assessment.overallReadiness}%` }} />
                  </div>
                </div>

                {/* domains table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-3">Domain</th>
                        <th className="pb-2 pr-3">Score</th>
                        <th className="pb-2 pr-3">Evidence</th>
                        <th className="pb-2">Next Steps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessment.domains.map((dm, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 pr-3 font-medium whitespace-nowrap">{dm.name}</td>
                          <td className="py-2 pr-3">
                            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", scoreBadge(dm.score))}>
                              {dm.score}/{dm.maxScore}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-xs text-muted-foreground max-w-[250px]">{dm.evidence}</td>
                          <td className="py-2 text-xs max-w-[200px]">{dm.nextSteps}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* domain visual breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {assessment.domains.map((dm, i) => (
                    <div key={i} className="rounded-lg border p-2 text-center">
                      <p className="text-xs text-muted-foreground truncate">{dm.name}</p>
                      <p className={cn("text-lg font-bold", dm.score >= 4 ? "text-green-600" : dm.score >= 3 ? "text-amber-600" : "text-red-600")}>
                        {dm.score}/{dm.maxScore}
                      </p>
                    </div>
                  ))}
                </div>

                {/* notes */}
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Assessment Notes</h4>
                  <p className="text-sm text-blue-900">{assessment.notes}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ── domains needing attention ─────────────────────────────────── */}
        {stats.domainsNeedingAttention.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Domains Needing Attention (Scored 2/5 or Below)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {stats.domainsNeedingAttention.map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div>
                      <span className="text-sm font-medium">{item.domain}</span>
                      <span className="text-xs text-muted-foreground ml-2">({item.youngPerson})</span>
                    </div>
                    <Badge className="bg-red-100 text-red-700 text-xs">{item.score}/5</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── upcoming reviews ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              Upcoming Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.nextReviews.map((review, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="text-sm font-medium">{review.youngPerson}</span>
                  <span className="text-sm text-muted-foreground">{review.reviewDate}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── regulatory note ───────────────────────────────────────────── */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <strong>Regulatory Framework</strong>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><strong>Regulation 12</strong> (Children&apos;s Homes Regulations 2015) — The registered person must ensure children are supported to develop independence skills appropriate to their age and abilities.</li>
            <li><strong>Children (Leaving Care) Act 2000</strong> — Local authorities must assess and meet the needs of eligible and relevant children, including preparation for independence.</li>
            <li><strong>Quality Standard 5</strong> (Guide to Children&apos;s Homes Standards) — Children are prepared for adulthood through a planned approach tailored to their individual needs.</li>
            <li><strong>Pathway Plan</strong> — Required from age 16 for all looked-after children, reviewed at least every 6 months, covering education, health, finances, and accommodation.</li>
          </ul>
        </div>
      </div>
    </PageShell>
  );
}
