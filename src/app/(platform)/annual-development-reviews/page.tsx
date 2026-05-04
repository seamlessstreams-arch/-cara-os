"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, ChevronDown, ChevronUp, ArrowUpDown, CheckCircle2,
  Clock, Search, Star, Target, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type ReviewStatus = "completed" | "scheduled" | "overdue" | "deferred";
type PerformanceRating = "outstanding" | "good" | "requires_improvement" | "inadequate";

interface AnnualReview {
  id: string;
  staffId: string;
  reviewerId: string;
  reviewDate: string;
  status: ReviewStatus;
  period: string;
  performanceRating: PerformanceRating;
  strengths: string[];
  areasForDevelopment: string[];
  objectivesSet: { objective: string; target: string; progress: string }[];
  qualificationsProgress: string;
  trainingCompleted: string[];
  trainingNeeded: string[];
  careerAspirations: string;
  wellbeingSummary: string;
  managerComments: string;
  staffComments: string;
  nextReviewDate: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const STATUS_LABEL: Record<ReviewStatus, string> = { completed: "Completed", scheduled: "Scheduled", overdue: "Overdue", deferred: "Deferred" };
const STATUS_CLR: Record<ReviewStatus, string> = { completed: "bg-green-100 text-green-800", scheduled: "bg-blue-100 text-blue-800", overdue: "bg-red-100 text-red-800", deferred: "bg-amber-100 text-amber-800" };
const STATUS_BORDER: Record<ReviewStatus, string> = { completed: "border-l-green-400", scheduled: "border-l-blue-400", overdue: "border-l-red-500", deferred: "border-l-amber-400" };

const RATING_LABEL: Record<PerformanceRating, string> = { outstanding: "Outstanding", good: "Good", requires_improvement: "Requires Improvement", inadequate: "Inadequate" };
const RATING_CLR: Record<PerformanceRating, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-blue-100 text-blue-800", requires_improvement: "bg-amber-100 text-amber-800", inadequate: "bg-red-100 text-red-800" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: AnnualReview[] = [
  {
    id: "adr_001", staffId: "staff_ryan", reviewerId: "staff_darren",
    reviewDate: d(-30), status: "completed", period: "April 2024 – March 2025",
    performanceRating: "outstanding",
    strengths: [
      "Excellent leadership as Deputy Manager — consistent, calm, and reliable",
      "Strong relationship with all three young people, particularly Jordan",
      "High-quality recording and documentation",
      "Proactive in identifying training needs for the team",
      "Managed complex situations independently and appropriately",
    ],
    areasForDevelopment: [
      "Confidence in chairing professional meetings (Ryan is working on this)",
      "Delegation — Ryan tends to take on tasks rather than delegate to the team",
    ],
    objectivesSet: [
      { objective: "Chair at least 2 professional meetings independently", target: d(180), progress: "1 completed (LAC review)" },
      { objective: "Complete Level 5 Diploma in Leadership module 3", target: d(120), progress: "On track — assignment 2 submitted" },
      { objective: "Lead a team training session on trauma-informed practice", target: d(90), progress: "Not yet started" },
    ],
    qualificationsProgress: "Level 5 Diploma in Leadership & Management — Year 2 of 3. On track. Modules 1 and 2 completed with merit.",
    trainingCompleted: ["PRICE Level 3 refresher", "Safeguarding Level 3", "First Aid recertification", "CSE awareness", "GDPR refresher"],
    trainingNeeded: ["Advanced de-escalation", "Chairing professional meetings", "Attachment theory workshop"],
    careerAspirations: "Ryan aspires to become a Registered Manager within 3-5 years. Currently developing leadership skills through the Level 5 diploma and deputy role. Discussed pathway: complete L5 → gain RM mentoring experience → apply for RM posts.",
    wellbeingSummary: "Ryan reports feeling well-supported and motivated. Acknowledges the deputy role can be demanding but manages this through good work-life balance and regular exercise. No wellbeing concerns raised.",
    managerComments: "Ryan continues to perform at an outstanding level. He is a natural leader who commands respect from the team through his practice, not his position. Ryan's development towards RM is progressing well and I am confident he will be ready for an RM role within the next 2-3 years.",
    staffComments: "I feel really supported in my role and I'm enjoying the challenges of the deputy position. I'm keen to develop my meeting skills and continue with my Level 5. Thank you for the opportunities this year.",
    nextReviewDate: d(335),
  },
  {
    id: "adr_002", staffId: "staff_anna", reviewerId: "staff_darren",
    reviewDate: d(-14), status: "completed", period: "April 2024 – March 2025",
    performanceRating: "good",
    strengths: [
      "Exceptional direct work skills — particularly creative and therapeutic approaches",
      "Strong bond with Casey — provides consistent, nurturing care",
      "Excellent use of reflective supervision",
      "Proactive safeguarding awareness — identifies concerns early",
    ],
    areasForDevelopment: [
      "Managing emotional impact of work — Anna has been affected by the LADO referral",
      "Confidence in challenging professional decisions in multi-agency meetings",
      "Broadening key working beyond Casey — Anna could develop mentoring skills",
    ],
    objectivesSet: [
      { objective: "Complete EAP counselling programme", target: d(60), progress: "4 of 6 sessions completed" },
      { objective: "Attend multi-agency meeting as lead professional", target: d(120), progress: "Not yet started" },
      { objective: "Develop and deliver a direct work resource for the team", target: d(150), progress: "Planning stage" },
    ],
    qualificationsProgress: "Level 3 Diploma in Residential Childcare — completed in 2023. Discussed potential progression to Level 5. Anna is interested but wants to focus on emotional recovery first.",
    trainingCompleted: ["Art therapy approaches", "Self-harm awareness", "PRICE Level 2 refresher", "Safeguarding Level 3"],
    trainingNeeded: ["Trauma-informed care advanced", "Professional assertiveness", "Loss and bereavement"],
    careerAspirations: "Anna is passionate about direct work and therapeutic approaches. She is interested in becoming a senior practitioner specialising in therapeutic care. Discussed the possibility of a senior RCW role within Oak House.",
    wellbeingSummary: "This has been a challenging year for Anna due to the LADO referral. She took 2 weeks off for stress and anxiety and has been on a phased return. EAP counselling has helped significantly. Anna reports feeling 'much better' and is re-engaging with her work positively. Continued monitoring agreed.",
    managerComments: "Anna is a talented practitioner whose direct work skills are outstanding. The LADO experience was understandably distressing and Anna's resilience in returning to work is commendable. Rating is 'Good' rather than 'Outstanding' due to the wellbeing impact this year — not a reflection of Anna's capability but an acknowledgement of the support she needs. I expect Anna to return to outstanding performance next year.",
    staffComments: "This year has been tough but I feel I've come through it stronger. I'm grateful for the support from Darren and the team. I'm excited about developing the therapeutic work and I'm feeling positive about the future.",
    nextReviewDate: d(350),
  },
  {
    id: "adr_003", staffId: "staff_edward", reviewerId: "staff_darren",
    reviewDate: d(7), status: "scheduled", period: "April 2024 – March 2025",
    performanceRating: "requires_improvement",
    strengths: [],
    areasForDevelopment: [],
    objectivesSet: [],
    qualificationsProgress: "Level 3 Diploma — module 4 of 8. Behind schedule (target was module 6 by now).",
    trainingCompleted: [],
    trainingNeeded: ["Medication Level 3 re-sit (failed first attempt at 72%)", "PRICE refresher overdue"],
    careerAspirations: "",
    wellbeingSummary: "",
    managerComments: "Edward's review is scheduled for next week. Pre-meeting preparation notes: Edward has struggled with medication competency (failed Level 3 at 72%, pass mark 80%). Supervision has been overdue on two occasions. Level 3 diploma is behind schedule. Sickness: 6 days in 5 months (approaching trigger). However, Edward is committed and keen to improve. The review should be supportive while setting clear expectations.",
    staffComments: "",
    nextReviewDate: d(372),
  },
  {
    id: "adr_004", staffId: "staff_chervelle", reviewerId: "staff_darren",
    reviewDate: d(-45), status: "completed", period: "April 2024 – March 2025",
    performanceRating: "good",
    strengths: [
      "Enthusiastic, reliable, and consistently positive presence",
      "Excellent rapport with all young people — natural warmth",
      "Strong commitment to professional development",
      "Interest in progressing to senior role — ambitious and motivated",
      "Good PRICE skills — handled interventions calmly and competently",
    ],
    areasForDevelopment: [
      "Recording quality — Chervelle's logs sometimes lack detail",
      "Developing leadership confidence for senior role aspiration",
      "Understanding of Reg 44/45 reporting requirements",
    ],
    objectivesSet: [
      { objective: "Improve daily log detail — use the SMART recording template", target: d(60), progress: "In progress — logs improving" },
      { objective: "Shadow Ryan at 2 professional meetings", target: d(90), progress: "1 completed" },
      { objective: "Complete senior RCW competency assessment", target: d(120), progress: "Not yet started" },
    ],
    qualificationsProgress: "Level 3 Diploma in Residential Childcare — completed in 2024 with distinction. Discussing Level 5 pathway.",
    trainingCompleted: ["PRICE Level 2", "Safeguarding Level 3", "First Aid", "Food Hygiene Level 2", "CSE awareness"],
    trainingNeeded: ["Advanced recording skills", "Leadership fundamentals", "Reg 44/45 awareness"],
    careerAspirations: "Chervelle wants to become a Senior RCW and eventually pursue management. She has the right attitude and commitment. Discussed development pathway: improve recording → senior competency assessment → senior role (when available) → Level 5 diploma.",
    wellbeingSummary: "Chervelle reports feeling well and motivated. She enjoys the work and finds it rewarding. No wellbeing concerns. Good work-life balance maintained.",
    managerComments: "Chervelle is a real asset to the team. Her warmth and energy are valued by the children and colleagues. The areas for development are achievable and Chervelle is already making progress. I fully support her aspiration to a senior role.",
    staffComments: "I love working at Oak House and I'm really excited about the opportunity to become a senior. I know I need to work on my recording and I'm making an effort. Thank you for believing in me.",
    nextReviewDate: d(320),
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function AnnualDevelopmentReviewsPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => getStaffName(r.staffId).toLowerCase().includes(q));
    }
    if (filterStatus !== "all") rows = rows.filter((r) => r.status === filterStatus);
    rows.sort((a, b) => sortBy === "newest" ? b.reviewDate.localeCompare(a.reviewDate) : a.reviewDate.localeCompare(b.reviewDate));
    return rows;
  }, [data, search, filterStatus, sortBy]);

  const total = data.length;
  const completed = data.filter((r) => r.status === "completed").length;
  const scheduled = data.filter((r) => r.status === "scheduled").length;
  const overdue = data.filter((r) => r.status === "overdue").length;

  const exportCols: ExportColumn<AnnualReview>[] = [
    { header: "Staff", accessor: (r: AnnualReview) => getStaffName(r.staffId) },
    { header: "Reviewer", accessor: (r: AnnualReview) => getStaffName(r.reviewerId) },
    { header: "Date", accessor: (r: AnnualReview) => r.reviewDate },
    { header: "Period", accessor: (r: AnnualReview) => r.period },
    { header: "Rating", accessor: (r: AnnualReview) => RATING_LABEL[r.performanceRating] },
    { header: "Status", accessor: (r: AnnualReview) => STATUS_LABEL[r.status] },
    { header: "Objectives", accessor: (r: AnnualReview) => String(r.objectivesSet.length) },
    { header: "Next Review", accessor: (r: AnnualReview) => r.nextReviewDate },
  ];

  return (
    <PageShell
      title="Annual Development Reviews"
      subtitle="Staff Appraisals · Professional Development · Performance Management"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Annual Development Reviews" />
          <ExportButton data={data} columns={exportCols} filename="annual-development-reviews" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Schedule Review</Button>
        </div>
      }
    >
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Reviews", value: total, icon: Star, clr: "text-blue-600" },
            { label: "Completed", value: completed, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Scheduled", value: scheduled, icon: Clock, clr: "text-amber-600" },
            { label: "Overdue", value: overdue, icon: Target, clr: "text-red-600" },
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

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {(Object.entries(STATUS_LABEL) as [ReviewStatus, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}>
            <ArrowUpDown className="h-4 w-4 mr-1" />{sortBy === "newest" ? "Newest" : "Oldest"}
          </Button>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", STATUS_BORDER[r.status])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getStaffName(r.staffId)}
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                        {r.status === "completed" && <Badge variant="outline" className={RATING_CLR[r.performanceRating]}>{RATING_LABEL[r.performanceRating]}</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Period: {r.period} · Review: {r.reviewDate} · Reviewer: {getStaffName(r.reviewerId)} · Next: {r.nextReviewDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.objectivesSet.length > 0 && <Badge variant="outline" className="bg-muted/50">{r.objectivesSet.length} objectives</Badge>}
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {r.strengths.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-green-700">Strengths</p>
                        <ul className="space-y-1">{r.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" /><span>{s}</span></li>
                        ))}</ul>
                      </div>
                    )}

                    {r.areasForDevelopment.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-amber-700">Areas for Development</p>
                        <ul className="space-y-1">{r.areasForDevelopment.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs"><TrendingUp className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" /><span>{a}</span></li>
                        ))}</ul>
                      </div>
                    )}

                    {r.objectivesSet.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Objectives Set</p>
                        {r.objectivesSet.map((obj, i) => (
                          <div key={i} className="bg-muted/40 rounded p-2 mb-1">
                            <p className="text-xs font-medium">{obj.objective}</p>
                            <p className="text-xs text-muted-foreground">Target: {obj.target} · Progress: {obj.progress}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {r.qualificationsProgress && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="font-medium text-xs text-blue-800 mb-1">Qualifications Progress</p>
                        <p className="text-xs text-blue-700">{r.qualificationsProgress}</p>
                      </div>
                    )}

                    {r.trainingCompleted.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Training Completed</p>
                        <div className="flex flex-wrap gap-1">{r.trainingCompleted.map((t, i) => (
                          <Badge key={i} variant="outline" className="bg-green-50 text-green-700 text-xs">{t}</Badge>
                        ))}</div>
                      </div>
                    )}

                    {r.trainingNeeded.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Training Needed</p>
                        <div className="flex flex-wrap gap-1">{r.trainingNeeded.map((t, i) => (
                          <Badge key={i} variant="outline" className="bg-amber-50 text-amber-700 text-xs">{t}</Badge>
                        ))}</div>
                      </div>
                    )}

                    {r.careerAspirations && (
                      <div className="bg-purple-50 border border-purple-200 rounded p-2">
                        <p className="font-medium text-xs text-purple-800 mb-1">Career Aspirations</p>
                        <p className="text-xs text-purple-700">{r.careerAspirations}</p>
                      </div>
                    )}

                    {r.wellbeingSummary && (
                      <div><p className="font-medium mb-1">Wellbeing</p><p className="text-muted-foreground text-xs">{r.wellbeingSummary}</p></div>
                    )}

                    {r.managerComments && (
                      <div><p className="font-medium mb-1">Manager Comments</p><p className="text-muted-foreground text-xs">{r.managerComments}</p></div>
                    )}

                    {r.staffComments && (
                      <div className="bg-muted/30 border rounded p-2">
                        <p className="font-medium text-xs mb-1">Staff Comments</p>
                        <p className="text-xs italic">&ldquo;{r.staffComments}&rdquo;</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Workforce Development Framework</p>
          <p>Annual development reviews (appraisals) must be conducted for all staff within the children&apos;s home. Reviews should cover: performance against objectives, professional development, qualification progress, training needs, career aspirations, and wellbeing. Reviews are conducted by the line manager and contribute to the home&apos;s workforce development plan. All staff must hold or be working towards the Level 3 Diploma in Residential Childcare within 2 years of starting. Registered Managers must hold the Level 5 Diploma. Reviews are monitored through Reg 44/45 reporting and Ofsted inspection of workforce development.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Schedule Review</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Staff Member</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff_ryan">{getStaffName("staff_ryan")}</SelectItem>
                  <SelectItem value="staff_anna">{getStaffName("staff_anna")}</SelectItem>
                  <SelectItem value="staff_edward">{getStaffName("staff_edward")}</SelectItem>
                  <SelectItem value="staff_chervelle">{getStaffName("staff_chervelle")}</SelectItem>
                  <SelectItem value="staff_lackson">{getStaffName("staff_lackson")}</SelectItem>
                  <SelectItem value="staff_mirela">{getStaffName("staff_mirela")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Review Date</Label><Input type="date" /></div>
            <div><Label>Review Period</Label><Input placeholder="e.g. April 2024 – March 2025" /></div>
            <div><Label>Preparation Notes</Label><Textarea placeholder="Notes for the review..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={() => setShowNew(false)}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
