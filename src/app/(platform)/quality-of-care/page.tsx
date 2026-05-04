"use client";

import { useState, useMemo } from "react";
import {
  Star, Plus, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, Eye, Target, MessageSquare,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
const REVIEW_TYPES = [
  "monthly", "quarterly", "annual", "ofsted_prep", "post_incident", "reg44_response",
] as const;
type ReviewType = typeof REVIEW_TYPES[number];
const REVIEW_LABELS: Record<ReviewType, string> = {
  monthly: "Monthly Review", quarterly: "Quarterly Review",
  annual: "Annual Review", ofsted_prep: "Ofsted Prep",
  post_incident: "Post-Incident", reg44_response: "Reg 44 Response",
};

const DOMAINS = [
  "safety", "wellbeing", "education", "health", "relationships",
  "transitions", "voice_of_child", "environment", "staffing", "management",
] as const;
type Domain = typeof DOMAINS[number];
const DOMAIN_LABELS: Record<Domain, string> = {
  safety: "Safety & Protection", wellbeing: "Emotional Wellbeing",
  education: "Education & Achievement", health: "Health & Development",
  relationships: "Positive Relationships", transitions: "Stability & Transitions",
  voice_of_child: "Voice of the Child", environment: "Living Environment",
  staffing: "Staffing & Supervision", management: "Leadership & Management",
};

const RATINGS = ["outstanding", "good", "requires_improvement", "inadequate"] as const;
type Rating = typeof RATINGS[number];
const RATING_COLORS: Record<Rating, string> = {
  outstanding: "bg-green-100 text-green-800", good: "bg-blue-100 text-blue-800",
  requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800",
};
const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding", good: "Good",
  requires_improvement: "Requires Improvement", inadequate: "Inadequate",
};

interface DomainAssessment {
  domain: Domain;
  rating: Rating;
  evidence: string;
  trend: "improving" | "stable" | "declining";
}

interface ActionItem {
  action: string;
  owner: string;
  dueDate: string;
  status: "open" | "in_progress" | "completed";
  priority: "high" | "medium" | "low";
}

interface QualityReview {
  id: string;
  date: string;
  type: ReviewType;
  leadReviewer: string;
  overallRating: Rating;
  domains: DomainAssessment[];
  strengths: string[];
  areasForImprovement: string[];
  childrenFeedback: string;
  staffFeedback: string;
  actions: ActionItem[];
  nextReviewDate: string;
  notes: string;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: QualityReview[] = [
  {
    id: "qoc_1", date: d(-14), type: "quarterly", leadReviewer: "staff_darren",
    overallRating: "good",
    domains: [
      { domain: "safety", rating: "good", evidence: "All risk assessments current. Fire drills on schedule. Safeguarding training 100% compliant.", trend: "stable" },
      { domain: "wellbeing", rating: "good", evidence: "Key working sessions regular. Mood tracking shows improvement for 2/3 YP. One YP still needs anxiety support plan reviewed.", trend: "improving" },
      { domain: "education", rating: "requires_improvement", evidence: "School attendance at 78% — below 90% target. PEP meetings held. One YP has no current education provision.", trend: "declining" },
      { domain: "health", rating: "good", evidence: "All health assessments up to date. Dental checks completed. Medication managed well.", trend: "stable" },
      { domain: "relationships", rating: "outstanding", evidence: "Strong key worker relationships. Family contact maintained. Peer relationships positive. Children's feedback consistently mentions feeling valued.", trend: "improving" },
      { domain: "voice_of_child", rating: "good", evidence: "House meetings regular. Feedback forms completed. Children contribute to menu planning and activity choices.", trend: "stable" },
      { domain: "environment", rating: "good", evidence: "Home clean and well-maintained. Bedrooms personalised. Garden furniture needs replacement.", trend: "stable" },
      { domain: "staffing", rating: "good", evidence: "Low agency use. Supervision up to date. Team morale good. One vacancy being recruited.", trend: "stable" },
      { domain: "management", rating: "good", evidence: "RM oversight evidenced. Reg 44/45 compliant. Policies reviewed on schedule.", trend: "stable" },
      { domain: "transitions", rating: "good", evidence: "Transition plans in place. Pathway planning started for eldest YP.", trend: "improving" },
    ],
    strengths: [
      "Exceptional relationship-building with all young people",
      "Strong therapeutic approach embedded across the team",
      "Consistent routines providing stability",
      "Good partnership working with social workers and schools",
    ],
    areasForImprovement: [
      "Education attendance needs targeted intervention",
      "One YP's anxiety support plan requires specialist input",
      "Garden furniture replacement outstanding for 3 months",
    ],
    childrenFeedback: "All three young people completed feedback forms. Themes: feeling safe, enjoying activities, wanting more choice in weekend plans. One YP mentioned wishing they could have a pet.",
    staffFeedback: "Team feedback positive overall. Requests for more reflective practice sessions. One staff member flagged need for additional de-escalation training refresh.",
    actions: [
      { action: "Create education attendance action plan for Alex", owner: "staff_anna", dueDate: d(7), status: "in_progress", priority: "high" },
      { action: "Request CAMHS review of Casey's anxiety support plan", owner: "staff_darren", dueDate: d(14), status: "open", priority: "high" },
      { action: "Order replacement garden furniture", owner: "staff_ryan", dueDate: d(21), status: "open", priority: "medium" },
      { action: "Schedule reflective practice session for team", owner: "staff_darren", dueDate: d(10), status: "open", priority: "medium" },
    ],
    nextReviewDate: d(76),
    notes: "Overall quality of care remains good with pockets of outstanding practice. Education attendance is the key priority for next quarter.",
  },
  {
    id: "qoc_2", date: d(-104), type: "quarterly", leadReviewer: "staff_darren",
    overallRating: "good",
    domains: [
      { domain: "safety", rating: "good", evidence: "Risk assessments reviewed. One minor incident managed well. No safeguarding concerns.", trend: "stable" },
      { domain: "wellbeing", rating: "requires_improvement", evidence: "Jordan's placement was new — settling-in period with some anxiety. Key working just beginning.", trend: "stable" },
      { domain: "education", rating: "good", evidence: "Attendance at 85%. PEPs completed for all YP.", trend: "stable" },
      { domain: "health", rating: "good", evidence: "Initial health assessments completed for Jordan. Others up to date.", trend: "stable" },
      { domain: "relationships", rating: "good", evidence: "Strong staff consistency. Family contact arrangements in place.", trend: "improving" },
      { domain: "voice_of_child", rating: "good", evidence: "House meetings established. Children involved in decorating decisions.", trend: "improving" },
      { domain: "environment", rating: "good", evidence: "New bedroom set up for Jordan. Home well-maintained.", trend: "stable" },
      { domain: "staffing", rating: "good", evidence: "Full complement. New staff member inducted well.", trend: "stable" },
      { domain: "management", rating: "good", evidence: "Reg compliance maintained. RM visible and accessible.", trend: "stable" },
      { domain: "transitions", rating: "good", evidence: "Jordan's transition plan being developed. Alex's pathway planning early stage.", trend: "stable" },
    ],
    strengths: [
      "Smooth admission process for new young person",
      "Staff team stability and low turnover",
      "Consistent application of therapeutic model",
    ],
    areasForImprovement: [
      "Jordan's settling-in plan needs close monitoring",
      "Education attendance slipped slightly — early intervention needed",
      "Supervision frequency to be increased for newer staff",
    ],
    childrenFeedback: "Existing YP welcomed Jordan well. Alex mentioned liking having a new housemate. Casey was initially unsure but warmed up quickly.",
    staffFeedback: "Team managed the new admission well. Requested additional training on trauma-informed approaches specific to Jordan's history.",
    actions: [
      { action: "Weekly reviews of Jordan's settling-in plan", owner: "staff_anna", dueDate: d(-74), status: "completed", priority: "high" },
      { action: "Education attendance monitoring dashboard", owner: "staff_darren", dueDate: d(-90), status: "completed", priority: "medium" },
      { action: "Trauma-informed care training for team", owner: "staff_darren", dueDate: d(-60), status: "completed", priority: "medium" },
    ],
    nextReviewDate: d(-14),
    notes: "Good quarter focused on successful admission. Team resilience strong. Education attendance dip needs watching.",
  },
  {
    id: "qoc_3", date: d(-7), type: "reg44_response", leadReviewer: "staff_darren",
    overallRating: "good",
    domains: [
      { domain: "safety", rating: "good", evidence: "Reg 44 visitor confirmed all safety measures in place.", trend: "stable" },
      { domain: "voice_of_child", rating: "outstanding", evidence: "Visitor spoke with all three YP. All expressed feeling safe and happy.", trend: "improving" },
      { domain: "environment", rating: "good", evidence: "Home well-presented. Minor maintenance items noted and logged.", trend: "stable" },
      { domain: "management", rating: "good", evidence: "Documentation well-organised. RM responsive to previous recommendations.", trend: "stable" },
    ],
    strengths: [
      "Children's positive feedback to independent visitor",
      "Rapid response to previous Reg 44 recommendations",
      "Well-organised documentation and records",
    ],
    areasForImprovement: [
      "Bathroom extractor fan repair still outstanding",
      "Consider increasing children's pocket money in line with guidance",
    ],
    childrenFeedback: "Jordan told the visitor they feel this is the best home they've lived in. Alex asked about getting a games console for the lounge — to be discussed at house meeting.",
    staffFeedback: "Team prepared well for the visit. Positive that visitor noted improvements since last visit.",
    actions: [
      { action: "Arrange bathroom extractor fan repair", owner: "staff_ryan", dueDate: d(7), status: "in_progress", priority: "medium" },
      { action: "Review pocket money rates at next team meeting", owner: "staff_darren", dueDate: d(14), status: "open", priority: "low" },
    ],
    nextReviewDate: d(56),
    notes: "Positive Reg 44 visit. All previous recommendations addressed. Two minor actions arising.",
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function QualityOfCarePage() {
  const [reviews] = useState<QualityReview[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let list = [...reviews];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.notes.toLowerCase().includes(q) ||
          r.strengths.some((s) => s.toLowerCase().includes(q)) ||
          r.areasForImprovement.some((a) => a.toLowerCase().includes(q))
      );
    }
    if (filterType !== "all") list = list.filter((r) => r.type === filterType);
    if (filterRating !== "all") list = list.filter((r) => r.overallRating === filterRating);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "rating": return RATINGS.indexOf(a.overallRating) - RATINGS.indexOf(b.overallRating);
        case "actions": return b.actions.filter((a: ActionItem) => a.status !== "completed").length - a.actions.filter((a: ActionItem) => a.status !== "completed").length;
        default: return 0;
      }
    });
    return list;
  }, [reviews, search, filterType, filterRating, sortBy]);

  /* stats */
  const totalReviews = reviews.length;
  const openActions = reviews.reduce((s, r) => s + r.actions.filter((a: ActionItem) => a.status !== "completed").length, 0);
  const latestRating = reviews.length > 0 ? reviews.sort((a, b) => b.date.localeCompare(a.date))[0].overallRating : null;
  const riDomains = reviews.length > 0 ? reviews[0].domains.filter((d: DomainAssessment) => d.rating === "requires_improvement" || d.rating === "inadequate").length : 0;

  const exportCols: ExportColumn<QualityReview>[] = [
    { header: "ID", accessor: (r: QualityReview) => r.id },
    { header: "Date", accessor: (r: QualityReview) => r.date },
    { header: "Type", accessor: (r: QualityReview) => REVIEW_LABELS[r.type] },
    { header: "Lead Reviewer", accessor: (r: QualityReview) => getStaffName(r.leadReviewer) },
    { header: "Overall Rating", accessor: (r: QualityReview) => RATING_LABELS[r.overallRating] },
    { header: "Strengths", accessor: (r: QualityReview) => r.strengths.join("; ") },
    { header: "Areas for Improvement", accessor: (r: QualityReview) => r.areasForImprovement.join("; ") },
    { header: "Children's Feedback", accessor: (r: QualityReview) => r.childrenFeedback },
    { header: "Staff Feedback", accessor: (r: QualityReview) => r.staffFeedback },
    { header: "Open Actions", accessor: (r: QualityReview) => r.actions.filter((a: ActionItem) => a.status !== "completed").length },
    { header: "Action Details", accessor: (r: QualityReview) => r.actions.map((a: ActionItem) => `${a.action} (${a.owner} — ${a.status})`).join("; ") },
    { header: "Next Review", accessor: (r: QualityReview) => r.nextReviewDate },
    { header: "Notes", accessor: (r: QualityReview) => r.notes },
  ];

  return (
    <PageShell
      title="Quality of Care Reviews"
      subtitle="Periodic assessments of care quality across all domains"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Quality of Care Reviews" />
          <ExportButton data={filtered} columns={exportCols} filename="quality-of-care" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Review
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Reviews", value: totalReviews, icon: Star, colour: "text-blue-600" },
            { label: "Latest Rating", value: latestRating ? RATING_LABELS[latestRating] : "—", icon: Target, colour: latestRating === "outstanding" ? "text-green-600" : latestRating === "good" ? "text-blue-600" : "text-orange-600" },
            { label: "Open Actions", value: openActions, icon: CheckCircle2, colour: openActions > 0 ? "text-orange-600" : "text-green-600" },
            { label: "Domains Flagged", value: riDomains, icon: AlertTriangle, colour: riDomains > 0 ? "text-red-600" : "text-slate-400" },
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

        {/* ── alerts ────────────────────────────────────────────── */}
        {riDomains > 0 && (
          <div className="rounded-lg border-l-4 border-orange-400 bg-orange-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <p className="text-sm text-orange-800">
                <strong>{riDomains}</strong> domain(s) rated Requires Improvement or below in the latest review — prioritise action plans.
              </p>
            </div>
          </div>
        )}

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search strengths, improvements, notes…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {REVIEW_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{REVIEW_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              {RATINGS.map((r) => (
                <SelectItem key={r} value={r}>{RATING_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="rating">Rating (Best)</SelectItem>
                <SelectItem value="actions">Open Actions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No reviews match your filters.</div>
          )}
          {filtered.map((review) => {
            const isExpanded = expanded === review.id;
            const open = review.actions.filter((a: ActionItem) => a.status !== "completed").length;

            return (
              <div key={review.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : review.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Star className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">{review.date} — {REVIEW_LABELS[review.type]}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Led by {getStaffName(review.leadReviewer)} · {open} open action(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", RATING_COLORS[review.overallRating])}>
                      {RATING_LABELS[review.overallRating]}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* domain ratings */}
                    <div>
                      <p className="text-sm font-medium mb-2">Domain Ratings</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {review.domains.map((da: DomainAssessment) => (
                          <div key={da.domain} className="flex items-start gap-2 rounded-lg border bg-white p-2.5">
                            <Badge className={cn("text-xs shrink-0 mt-0.5", RATING_COLORS[da.rating])}>
                              {RATING_LABELS[da.rating]}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <p className="text-sm font-medium">{DOMAIN_LABELS[da.domain]}</p>
                                {da.trend === "improving" && <TrendingUp className="h-3 w-3 text-green-600" />}
                                {da.trend === "declining" && <TrendingDown className="h-3 w-3 text-red-600" />}
                              </div>
                              <p className="text-xs text-muted-foreground">{da.evidence}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* strengths & areas for improvement */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-medium text-green-700 mb-2">Strengths</p>
                        <ul className="space-y-1">
                          {review.strengths.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                        <p className="text-xs font-medium text-orange-700 mb-2">Areas for Improvement</p>
                        <ul className="space-y-1">
                          {review.areasForImprovement.map((a: string, i: number) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <AlertTriangle className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* feedback */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Eye className="h-4 w-4 text-pink-600" />
                          <p className="text-xs font-medium text-pink-700">Children&apos;s Feedback</p>
                        </div>
                        <p className="text-sm">{review.childrenFeedback}</p>
                      </div>
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          <p className="text-xs font-medium text-blue-700">Staff Feedback</p>
                        </div>
                        <p className="text-sm">{review.staffFeedback}</p>
                      </div>
                    </div>

                    {/* actions */}
                    {review.actions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Action Plan</p>
                        <div className="space-y-2">
                          {review.actions.map((action: ActionItem, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 rounded-lg border bg-white p-2.5">
                              <CheckCircle2 className={cn("h-4 w-4 mt-0.5 shrink-0",
                                action.status === "completed" ? "text-green-600" : action.status === "in_progress" ? "text-blue-600" : "text-slate-400"
                              )} />
                              <div className="flex-1 min-w-0">
                                <p className={cn("text-sm", action.status === "completed" && "line-through text-muted-foreground")}>{action.action}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  <span>{getStaffName(action.owner)}</span>
                                  <span>·</span>
                                  <span>Due: {action.dueDate}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className={cn("text-xs",
                                  action.priority === "high" ? "border-red-300 text-red-700" :
                                  action.priority === "medium" ? "border-orange-300 text-orange-700" :
                                  "border-slate-300 text-slate-700"
                                )}>{action.priority}</Badge>
                                <Badge variant="outline" className="text-xs">{action.status.replace("_", " ")}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* notes & next review */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Summary Notes</p>
                        <p className="text-sm">{review.notes}</p>
                      </div>
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Next Review Date</p>
                        <p className="text-sm font-medium">{review.nextReviewDate}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Regulation 45:</strong> The registered person must review the quality of care provided
          and produce a written report at least every 6 months. This should assess the extent to which
          the children&apos;s home&apos;s Statement of Purpose is being fulfilled. Reviews should incorporate the
          views of children, staff, placing authorities, and independent visitors.
        </div>
      </div>

      {/* ── placeholder dialog ──────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Quality of Care Review</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground text-sm">
            <Star className="h-10 w-10 mx-auto mb-3 text-blue-300" />
            <p>Full review form will capture domain-by-domain assessment,</p>
            <p>evidence, stakeholder feedback, and action plans.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
