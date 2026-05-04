"use client";

import { useState, useMemo } from "react";
import {
  ClipboardCheck, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, TrendingUp, Clock,
  ChevronDown, ChevronUp, Users, FileText, Shield,
  BookOpen, Heart, Brain, Home, Award, Calendar,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
const STATUSES = ["completed", "planned"] as const;
type ReviewStatus = typeof STATUSES[number];
const STATUS_LABELS: Record<ReviewStatus, string> = {
  completed: "Completed",
  planned: "Planned",
};
const STATUS_COLORS: Record<ReviewStatus, string> = {
  completed: "bg-green-100 text-green-800",
  planned: "bg-blue-100 text-blue-800",
};

const AREA_RATINGS = ["outstanding", "good", "requires_improvement", "inadequate"] as const;
type AreaRating = typeof AREA_RATINGS[number];
const AREA_RATING_LABELS: Record<AreaRating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};
const AREA_RATING_COLORS: Record<AreaRating, string> = {
  outstanding: "bg-green-100 text-green-800",
  good: "bg-blue-100 text-blue-800",
  requires_improvement: "bg-orange-100 text-orange-800",
  inadequate: "bg-red-100 text-red-800",
};

interface AreaReviewed {
  area: string;
  rating: AreaRating;
  summary: string;
  evidence: string;
}

interface ActionArising {
  action: string;
  owner: string;
  deadline: string;
  status: "open" | "in_progress" | "completed";
}

interface Reg46Review {
  id: string;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  completedDate: string | null;
  reviewer: string;
  independentInput: string;
  overallRating: string;
  areasReviewed: AreaReviewed[];
  consultationSources: string[];
  actionsArising: ActionArising[];
  sharedWith: string[];
  status: ReviewStatus;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: Reg46Review[] = [
  {
    id: "reg46_1",
    reviewPeriodStart: d(-183),
    reviewPeriodEnd: d(0),
    completedDate: d(-14),
    reviewer: "staff_darren",
    independentInput: "Regulation 44 independent visitor report incorporated; visitor conducted separate consultation with children and staff",
    overallRating: "Good with areas for development",
    areasReviewed: [
      { area: "Safeguarding", rating: "good", summary: "Robust procedures in place with no concerns identified", evidence: "All safeguarding referrals appropriately managed. DBS checks 100% compliant. Safeguarding training up to date for all staff. Children report feeling safe." },
      { area: "Education", rating: "good", summary: "All children in education with PEPs up to date", evidence: "All young people have current education placements. Personal Education Plans reviewed termly. Designated teacher liaison in place. Attendance monitoring active." },
      { area: "Health", rating: "requires_improvement", summary: "Jordan's CAMHS referral experiencing extended wait", evidence: "Physical health assessments current for all YP. Dental and optician checks on schedule. However, Jordan has been on CAMHS waiting list for 4 months with no appointment date confirmed. Escalation letter sent to ICB." },
      { area: "Emotional wellbeing", rating: "good", summary: "Therapeutic input effective and well-embedded", evidence: "Weekly therapeutic sessions delivered consistently. Staff trained in trauma-informed approach. Key working sessions evidence positive progress. Children's self-reported wellbeing scores improving." },
      { area: "Staffing", rating: "good", summary: "Stable team with good staff-to-child ratios", evidence: "No agency staff usage this period. All supervision up to date. Team morale positive. CPD records current. Retention strong with no leavers in review period." },
      { area: "Premises", rating: "good", summary: "Home well maintained and personalised", evidence: "Health and safety checks current. Fire safety equipment serviced. Children's bedrooms personalised to their choice. Communal areas comfortable and well-kept. Minor maintenance addressed promptly." },
      { area: "Leadership", rating: "outstanding", summary: "Registered Manager driving continuous improvement", evidence: "RM demonstrates exceptional oversight of all aspects of care. Regular monitoring systems in place. Staff feel well-supported. External professionals consistently praise communication and collaboration. Innovation in practice evident." },
    ],
    consultationSources: [
      "Children's views gathered via house meeting and individual 1:1 sessions",
      "Staff views collected through team meeting and anonymous survey",
      "Placing authority views obtained via structured survey to all social workers",
      "Regulation 44 independent visitor report incorporated and cross-referenced",
    ],
    actionsArising: [
      { action: "Escalate Jordan's CAMHS wait via formal complaint to ICB", owner: "staff_darren", deadline: d(-7), status: "completed" },
      { action: "Develop contingency therapeutic support plan pending CAMHS appointment", owner: "staff_anna", deadline: d(7), status: "in_progress" },
      { action: "Review and update lone working policy to reflect current practice", owner: "staff_ryan", deadline: d(21), status: "open" },
    ],
    sharedWith: ["Ofsted (available on request)", "All placing authorities", "Staff team"],
    status: "completed",
  },
  {
    id: "reg46_2",
    reviewPeriodStart: d(-365),
    reviewPeriodEnd: d(-183),
    completedDate: d(-195),
    reviewer: "staff_darren",
    independentInput: "Independent consultant conducted staff interviews and children's consultations separately from RM",
    overallRating: "Good",
    areasReviewed: [
      { area: "Safeguarding", rating: "good", summary: "Appropriate systems and responses in place", evidence: "One safeguarding concern raised and appropriately managed through LADO. Staff demonstrated good awareness and timely reporting." },
      { area: "Education", rating: "good", summary: "Education provision stable with positive engagement", evidence: "All children attending education. PEPs current. Strong relationships with education providers maintained." },
      { area: "Health", rating: "good", summary: "Health needs well met across all young people", evidence: "All statutory health assessments completed on time. Medications managed safely. Health promotion activities embedded in routine." },
      { area: "Emotional wellbeing", rating: "good", summary: "Therapeutic model consistently applied", evidence: "Children engaging well with therapeutic support. Measurable progress evident in outcome tracking. Staff confidence in therapeutic approach growing." },
      { area: "Staffing", rating: "requires_improvement", summary: "Concerns about one staff member's practice led to disciplinary process", evidence: "Staff member Diane's practice fell below expected standards. Formal disciplinary process initiated. Additional supervision put in place for all staff. Recruitment commenced for potential replacement." },
      { area: "Premises", rating: "good", summary: "Home maintained to good standard", evidence: "All maintenance requests addressed within agreed timescales. Decorating programme on track. Garden well maintained." },
      { area: "Leadership", rating: "good", summary: "RM providing effective oversight", evidence: "Monitoring systems robust. Regulatory compliance maintained. Appropriate action taken when staff concerns identified." },
    ],
    consultationSources: [
      "Children's views gathered through independent consultant interviews",
      "Staff views collected via confidential survey and team discussion",
      "Placing authority feedback obtained from all allocated social workers",
      "Independent consultant report reviewed and incorporated",
    ],
    actionsArising: [
      { action: "Complete disciplinary process for staff_diane", owner: "staff_darren", deadline: d(-170), status: "completed" },
      { action: "Recruit replacement staff member if needed", owner: "staff_darren", deadline: d(-150), status: "completed" },
      { action: "Deliver refresher training on professional boundaries for whole team", owner: "staff_ryan", deadline: d(-160), status: "completed" },
      { action: "Implement enhanced supervision schedule for probationary period", owner: "staff_darren", deadline: d(-140), status: "completed" },
    ],
    sharedWith: ["Ofsted (available on request)", "All placing authorities", "Staff team"],
    status: "completed",
  },
  {
    id: "reg46_3",
    reviewPeriodStart: d(0),
    reviewPeriodEnd: d(183),
    completedDate: null,
    reviewer: "staff_darren",
    independentInput: "Independent Reg 44 visitor to provide separate input; scope and schedule being prepared",
    overallRating: "—",
    areasReviewed: [],
    consultationSources: [],
    actionsArising: [],
    sharedWith: [],
    status: "planned",
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function QualityReviewCyclePage() {
  const [reviews] = useState<Reg46Review[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...reviews];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.overallRating.toLowerCase().includes(q) ||
          r.independentInput.toLowerCase().includes(q) ||
          r.areasReviewed.some((a) => a.summary.toLowerCase().includes(q) || a.area.toLowerCase().includes(q)) ||
          r.actionsArising.some((a) => a.action.toLowerCase().includes(q))
      );
    }
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return (b.completedDate ?? b.reviewPeriodEnd).localeCompare(a.completedDate ?? a.reviewPeriodEnd);
        case "status": return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
        default: return 0;
      }
    });
    return list;
  }, [reviews, search, filterStatus, sortBy]);

  /* stats */
  const completedOnTime = reviews.filter((r) => r.status === "completed").length;
  const totalActions = reviews.reduce((s, r) => s + r.actionsArising.length, 0);
  const completedActions = reviews.reduce((s, r) => s + r.actionsArising.filter((a: ActionArising) => a.status === "completed").length, 0);
  const actionsCompletedPct = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
  const latestCompleted = reviews.filter((r) => r.status === "completed").sort((a, b) => (b.completedDate ?? "").localeCompare(a.completedDate ?? ""))[0];

  const exportCols: ExportColumn<Reg46Review>[] = [
    { header: "ID", accessor: (r: Reg46Review) => r.id },
    { header: "Period Start", accessor: (r: Reg46Review) => r.reviewPeriodStart },
    { header: "Period End", accessor: (r: Reg46Review) => r.reviewPeriodEnd },
    { header: "Completed Date", accessor: (r: Reg46Review) => r.completedDate ?? "—" },
    { header: "Reviewer", accessor: (r: Reg46Review) => getStaffName(r.reviewer) },
    { header: "Independent Input", accessor: (r: Reg46Review) => r.independentInput },
    { header: "Overall Rating", accessor: (r: Reg46Review) => r.overallRating },
    { header: "Status", accessor: (r: Reg46Review) => STATUS_LABELS[r.status] },
    { header: "Areas Reviewed", accessor: (r: Reg46Review) => r.areasReviewed.map((a: AreaReviewed) => `${a.area}: ${AREA_RATING_LABELS[a.rating]}`).join("; ") },
    { header: "Consultation Sources", accessor: (r: Reg46Review) => r.consultationSources.join("; ") },
    { header: "Actions", accessor: (r: Reg46Review) => r.actionsArising.map((a: ActionArising) => `${a.action} (${getStaffName(a.owner)} — ${a.status})`).join("; ") },
    { header: "Shared With", accessor: (r: Reg46Review) => r.sharedWith.join("; ") },
  ];

  const getAreaIcon = (area: string) => {
    switch (area.toLowerCase()) {
      case "safeguarding": return Shield;
      case "education": return BookOpen;
      case "health": return Heart;
      case "emotional wellbeing": return Brain;
      case "staffing": return Users;
      case "premises": return Home;
      case "leadership": return Award;
      default: return FileText;
    }
  };

  return (
    <PageShell
      title="Regulation 46 — Quality of Care Review"
      subtitle="Six-monthly independent systematic review of the quality of care provided"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Regulation 46 Quality Review Cycle" />
          <ExportButton data={filtered} columns={exportCols} filename="reg46-quality-review-cycle" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── regulatory note ──────────────────────────────────────── */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4">
          <div className="flex items-start gap-2">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Regulation 46 — Review of Quality of Care</p>
              <p>
                The registered person must maintain a system for monitoring, reviewing and evaluating the quality of care provided for children. A review must be carried out at least every 6 months and must be conducted by an individual who has the skills, experience and knowledge necessary to do so. The review must consult children, their parents, placing authorities and staff. Ofsted will scrutinise this document during inspection as evidence of the home&apos;s capacity for continuous improvement and self-evaluation.
              </p>
            </div>
          </div>
        </div>

        {/* ── stats ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Reviews Completed", value: completedOnTime, icon: ClipboardCheck, colour: "text-green-600" },
            { label: "Actions Completed", value: `${actionsCompletedPct}%`, icon: CheckCircle2, colour: actionsCompletedPct === 100 ? "text-green-600" : "text-blue-600" },
            { label: "Overall Trajectory", value: latestCompleted ? "Good" : "—", icon: TrendingUp, colour: "text-green-600" },
            { label: "Next Review Due", value: reviews.find((r) => r.status === "planned")?.reviewPeriodEnd ?? "—", icon: Calendar, colour: "text-purple-600" },
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

        {/* ── filters ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search areas, actions, ratings..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── review list ──────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No reviews match your filters.</div>
          )}
          {filtered.map((review) => {
            const isExpanded = expandedId === review.id;
            const openActions = review.actionsArising.filter((a: ActionArising) => a.status !== "completed").length;

            return (
              <div key={review.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : review.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <ClipboardCheck className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">
                        {review.reviewPeriodStart} to {review.reviewPeriodEnd}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Reviewer: {getStaffName(review.reviewer)}
                        {review.completedDate && ` · Completed: ${review.completedDate}`}
                        {openActions > 0 && ` · ${openActions} open action(s)`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", STATUS_COLORS[review.status])}>
                      {STATUS_LABELS[review.status]}
                    </Badge>
                    {review.overallRating !== "—" && (
                      <Badge variant="outline" className="text-xs">
                        {review.overallRating}
                      </Badge>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* planned review — minimal info */}
                    {review.status === "planned" && (
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <p className="text-sm font-medium text-blue-800">Upcoming Review</p>
                        </div>
                        <p className="text-sm text-blue-700 mb-2">
                          Review period: {review.reviewPeriodStart} to {review.reviewPeriodEnd}
                        </p>
                        <p className="text-sm text-blue-700">
                          {review.independentInput}
                        </p>
                      </div>
                    )}

                    {/* completed review — full detail */}
                    {review.status === "completed" && (
                      <>
                        {/* independent input */}
                        <div className="rounded-lg bg-white border p-3">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Independent Input</p>
                          <p className="text-sm">{review.independentInput}</p>
                        </div>

                        {/* areas reviewed */}
                        {review.areasReviewed.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Areas Reviewed</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {review.areasReviewed.map((area: AreaReviewed) => {
                                const AreaIcon = getAreaIcon(area.area);
                                return (
                                  <div key={area.area} className="flex items-start gap-2 rounded-lg border bg-white p-3">
                                    <AreaIcon className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-medium">{area.area}</p>
                                        <Badge className={cn("text-xs", AREA_RATING_COLORS[area.rating])}>
                                          {AREA_RATING_LABELS[area.rating]}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-slate-700 mb-1">{area.summary}</p>
                                      <p className="text-xs text-muted-foreground">{area.evidence}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* consultation sources */}
                        {review.consultationSources.length > 0 && (
                          <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                            <div className="flex items-center gap-1 mb-2">
                              <Users className="h-4 w-4 text-purple-600" />
                              <p className="text-xs font-medium text-purple-700">Consultation Sources</p>
                            </div>
                            <ul className="space-y-1">
                              {review.consultationSources.map((src: string, i: number) => (
                                <li key={i} className="flex items-start gap-1 text-sm text-purple-800">
                                  <CheckCircle2 className="h-3 w-3 text-purple-500 mt-0.5 shrink-0" />
                                  <span>{src}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* actions arising */}
                        {review.actionsArising.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Actions Arising</p>
                            <div className="space-y-2">
                              {review.actionsArising.map((action: ActionArising, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 rounded-lg border bg-white p-2.5">
                                  <CheckCircle2 className={cn("h-4 w-4 mt-0.5 shrink-0",
                                    action.status === "completed" ? "text-green-600" : action.status === "in_progress" ? "text-blue-600" : "text-slate-400"
                                  )} />
                                  <div className="flex-1 min-w-0">
                                    <p className={cn("text-sm", action.status === "completed" && "line-through text-muted-foreground")}>{action.action}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                      <span>{getStaffName(action.owner)}</span>
                                      <span>·</span>
                                      <span>Deadline: {action.deadline}</span>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className={cn("text-xs",
                                    action.status === "completed" ? "border-green-300 text-green-700" :
                                    action.status === "in_progress" ? "border-blue-300 text-blue-700" :
                                    "border-slate-300 text-slate-700"
                                  )}>{action.status.replace("_", " ")}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* shared with */}
                        {review.sharedWith.length > 0 && (
                          <div className="rounded-lg bg-white border p-3">
                            <p className="text-xs text-muted-foreground font-medium mb-1">Report Shared With</p>
                            <div className="flex flex-wrap gap-2">
                              {review.sharedWith.map((recipient: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">{recipient}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
