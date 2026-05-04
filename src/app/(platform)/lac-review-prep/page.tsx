"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Users,
  FileText,
  Heart,
  Mic,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LacReviewPrep {
  id: string;
  youngPerson: string;
  reviewType: "Initial review (28 days)" | "First review (3 months)" | "Subsequent review (6 monthly)" | "Disruption review";
  reviewScheduledFor: string;
  iroName: string;
  iroLocalAuthority: string;
  prepStatus: "Not started" | "In progress" | "Ready for review" | "Review held" | "Post-review actions";
  prepStartDate: string;
  homeReportDeadline: string;
  homeReportSubmitted: boolean;
  homeReportSubmittedDate: string;
  reportAuthor: string;
  childPrepStatus: "Not started" | "Initial conversation done" | "Views captured" | "Visual prep done" | "Ready";
  childPrepActivities: string[];
  childChooseToAttend: "Will attend" | "Will not attend" | "Partial attendance" | "Decision pending" | "Views via advocate" | "Views via key worker";
  childAdvocateInvolved: boolean;
  childAdvocateName: string;
  childWishesAndFeelings: string[];
  childTopicsToRaise: string[];
  childTopicsToAvoid: string[];
  multiAgencyReportsCollected: { agency: string; received: boolean; receivedDate: string }[];
  outstandingActions: { action: string; owner: string; deadline: string; status: "Open" | "In Progress" | "Done" }[];
  pastActionsToReviewProgress: { action: string; status: string }[];
  riskAssessmentCurrent: boolean;
  carePlanCurrent: boolean;
  pathwayPlanCurrent: boolean;
  educationReportObtained: boolean;
  healthReportObtained: boolean;
  childPostReviewSupportPlan: string;
  preparedBy: string;
  notes: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: LacReviewPrep[] = [
  {
    id: "lrp-001",
    youngPerson: "yp_alex",
    reviewType: "Subsequent review (6 monthly)",
    reviewScheduledFor: d(14),
    iroName: "Helen Frost",
    iroLocalAuthority: "Riverside County Council",
    prepStatus: "In progress",
    prepStartDate: d(-30),
    homeReportDeadline: d(7),
    homeReportSubmitted: false,
    homeReportSubmittedDate: "",
    reportAuthor: "staff_darren",
    childPrepStatus: "Views captured",
    childPrepActivities: [
      "Initial conversation with key worker (Anna) at d-25",
      "Visual 'my journey' poster created with Alex showing progress over last 6 months",
      "Wishes and feelings template completed with Alex",
      "Pre-meeting with IRO scheduled for d+10 (Alex confirmed attending this)",
      "Post-review treat planned (Alex's choice — boxing club extra session)",
    ],
    childChooseToAttend: "Partial attendance",
    childAdvocateInvolved: false,
    childAdvocateName: "",
    childWishesAndFeelings: [
      "Wants to talk about college aspirations and how Oak House can help",
      "Wants confirmation that mother contact arrangements continue",
      "Wants to discuss boxing being supported as protected commitment",
      "Doesn't want to discuss past trauma in this review",
      "Wants to talk about being trusted with more responsibility (sleepovers, money, etc.)",
    ],
    childTopicsToRaise: [
      "Educational psychology assessment delays — frustrated",
      "Wants commitment to college transition support",
      "Boxing club costs — wants confirmation continued",
    ],
    childTopicsToAvoid: [
      "Detail of historical disclosures — already addressed in CP review",
      "Father — Alex doesn't want this discussed at all",
    ],
    multiAgencyReportsCollected: [
      { agency: "School (Headteacher)", received: true, receivedDate: d(-7) },
      { agency: "School Nurse", received: true, receivedDate: d(-5) },
      { agency: "CAMHS (Dr Patel)", received: true, receivedDate: d(-3) },
      { agency: "Boxing Coach (consent obtained)", received: true, receivedDate: d(-2) },
      { agency: "Educational Psychologist", received: false, receivedDate: "" },
    ],
    outstandingActions: [
      { action: "Chase Educational Psychologist report", owner: "staff_edward", deadline: d(3), status: "In Progress" },
      { action: "Finalise home report", owner: "staff_darren", deadline: d(5), status: "In Progress" },
      { action: "IRO pre-meeting with Alex", owner: "staff_anna", deadline: d(10), status: "Open" },
      { action: "Submit home report to IRO", owner: "staff_darren", deadline: d(7), status: "Open" },
      { action: "Brief Alex on review format day before", owner: "staff_anna", deadline: d(13), status: "Open" },
    ],
    pastActionsToReviewProgress: [
      { action: "Increase school attendance to 90% (target from last review)", status: "Achieved — 92%" },
      { action: "Establish boxing club routine", status: "Achieved — 2x weekly attendance sustained" },
      { action: "EP referral submitted", status: "Submitted but report still outstanding from LA" },
      { action: "Family contact review", status: "Reviewed — current arrangements working" },
    ],
    riskAssessmentCurrent: true,
    carePlanCurrent: true,
    pathwayPlanCurrent: false,
    educationReportObtained: true,
    healthReportObtained: true,
    childPostReviewSupportPlan: "Quiet evening planned with Anna. Hot chocolate ritual. Alex chose boxing club extra session as 'reward'. Therapy session scheduled within 7 days.",
    preparedBy: "staff_darren",
    notes: "Strong review preparation. Alex actively engaged in process. Only outstanding piece is EP report — LA owns this delay. Will flag in review if not received.",
  },
  {
    id: "lrp-002",
    youngPerson: "yp_jordan",
    reviewType: "Subsequent review (6 monthly)",
    reviewScheduledFor: d(35),
    iroName: "Marcus Webb",
    iroLocalAuthority: "Valley Borough Council",
    prepStatus: "In progress",
    prepStartDate: d(-15),
    homeReportDeadline: d(28),
    homeReportSubmitted: false,
    homeReportSubmittedDate: "",
    reportAuthor: "staff_darren",
    childPrepStatus: "Initial conversation done",
    childPrepActivities: [
      "First conversation with key worker (Chervelle) at d-12",
      "Advocate (Coram Voice) introduced",
      "Wishes and feelings to be captured next week with advocate present",
    ],
    childChooseToAttend: "Will attend",
    childAdvocateInvolved: true,
    childAdvocateName: "Karen Hughes (Coram Voice)",
    childWishesAndFeelings: [
      "Mother's pre-release planning — wants to be central in this conversation",
      "Football team captaincy — proud and wants this acknowledged",
      "Concerns about peer associations near school",
      "Wants to maintain regular advocate involvement",
      "Cultural identity work — wants more Black-led mentoring",
    ],
    childTopicsToRaise: [
      "Mother's release plan — wants clarity on contact arrangements",
      "Cultural mentor — pursuing this",
      "School engagement — Jordan proud of attendance",
    ],
    childTopicsToAvoid: [
      "Specific peer names — Jordan finds this triggering",
    ],
    multiAgencyReportsCollected: [
      { agency: "School (Designated Teacher)", received: true, receivedDate: d(-5) },
      { agency: "GP", received: true, receivedDate: d(-3) },
      { agency: "CAMHS", received: false, receivedDate: "" },
      { agency: "Police (community team)", received: false, receivedDate: "" },
      { agency: "Football Coach (consent given)", received: false, receivedDate: "" },
      { agency: "Prison Liaison (re Mother)", received: false, receivedDate: "" },
    ],
    outstandingActions: [
      { action: "Wishes and feelings session with Jordan + advocate", owner: "Karen Hughes", deadline: d(7), status: "Open" },
      { action: "Chase CAMHS report", owner: "staff_chervelle", deadline: d(14), status: "Open" },
      { action: "Coordinate Mother's pre-release planning input", owner: "staff_darren", deadline: d(21), status: "In Progress" },
      { action: "Police community brief", owner: "staff_ryan", deadline: d(14), status: "Open" },
      { action: "Cultural mentor referral progressed", owner: "staff_chervelle", deadline: d(28), status: "Open" },
    ],
    pastActionsToReviewProgress: [
      { action: "Reduce missing-from-care episodes", status: "Achieved — none in 6 weeks" },
      { action: "Football team integration", status: "Achieved — Captain status" },
      { action: "Cultural identity work", status: "Progress — heritage events attended" },
      { action: "Therapy engagement", status: "Achieved — 100% attendance" },
    ],
    riskAssessmentCurrent: true,
    carePlanCurrent: true,
    pathwayPlanCurrent: false,
    educationReportObtained: true,
    healthReportObtained: true,
    childPostReviewSupportPlan: "Football match weekend after review. Time with Mum on the phone. Therapy session within 5 days. Quiet day with Chervelle to debrief.",
    preparedBy: "staff_darren",
    notes: "Complex review due to Mother's upcoming release. Advocate involvement crucial. Multi-agency input still being gathered. Will be a substantial review.",
  },
  {
    id: "lrp-003",
    youngPerson: "yp_casey",
    reviewType: "Subsequent review (6 monthly)",
    reviewScheduledFor: d(45),
    iroName: "Helen Frost",
    iroLocalAuthority: "Hillside County Council",
    prepStatus: "In progress",
    prepStartDate: d(-7),
    homeReportDeadline: d(38),
    homeReportSubmitted: false,
    homeReportSubmittedDate: "",
    reportAuthor: "staff_darren",
    childPrepStatus: "Initial conversation done",
    childPrepActivities: [
      "Initial visual conversation with Anna using preferred cards (d-5)",
      "Casey indicated they don't wish to attend",
      "Anna will gather views over 4 sessions using visual tools",
      "Art therapy session may incorporate review themes if Casey wishes",
    ],
    childChooseToAttend: "Will not attend",
    childAdvocateInvolved: false,
    childAdvocateName: "Casey declined advocate offer",
    childWishesAndFeelings: [
      "Wants to remain at Oak House",
      "Likes art therapy and wants this continued",
      "Feels safe — important for IRO to know",
      "Doesn't want change in routine for review process",
      "Questions about long-term future (where will I be at 18?)",
    ],
    childTopicsToRaise: [
      "Long-term placement security — Casey worried",
      "Art therapy continuation",
      "School trip arrangements",
    ],
    childTopicsToAvoid: [
      "Birth family — Casey doesn't want this discussed in detail",
      "Anything that suggests a placement change",
    ],
    multiAgencyReportsCollected: [
      { agency: "Specialist provision (school)", received: false, receivedDate: "" },
      { agency: "Paediatrician", received: false, receivedDate: "" },
      { agency: "SaLT", received: false, receivedDate: "" },
      { agency: "Art Therapist", received: false, receivedDate: "" },
      { agency: "Educational Psychologist", received: false, receivedDate: "" },
      { agency: "CAMHS ASD pathway (Dr Wong)", received: false, receivedDate: "" },
    ],
    outstandingActions: [
      { action: "Continue capturing Casey's views over 4 visual sessions", owner: "staff_anna", deadline: d(28), status: "In Progress" },
      { action: "Request all multi-agency reports", owner: "staff_darren", deadline: d(7), status: "In Progress" },
      { action: "IRO informed Casey not attending — adjust format", owner: "staff_darren", deadline: d(14), status: "Open" },
      { action: "Long-term placement question — clarify with LA", owner: "staff_darren", deadline: d(21), status: "Open" },
      { action: "Casey-friendly summary of decisions to be prepared post-review", owner: "staff_anna", deadline: d(50), status: "Open" },
    ],
    pastActionsToReviewProgress: [
      { action: "Sensory plan refresh", status: "Achieved" },
      { action: "Art therapy progression", status: "Achieved — significant progress" },
      { action: "School trip preparation", status: "In progress — trip next week" },
      { action: "Independent friendship development", status: "Achieved — first independent outing successful" },
    ],
    riskAssessmentCurrent: true,
    carePlanCurrent: true,
    pathwayPlanCurrent: false,
    educationReportObtained: false,
    healthReportObtained: false,
    childPostReviewSupportPlan: "Quiet weekend planned. Familiar routine maintained. Casey-friendly summary read together. Anna available for any questions.",
    preparedBy: "staff_darren",
    notes: "Casey-led review preparation. Multi-agency reports running behind — escalating. Long-term placement question needs LA dialogue. Visual format throughout.",
  },
];

const prepStatusColour: Record<string, string> = {
  "Not started": "bg-slate-100 text-slate-800",
  "In progress": "bg-amber-100 text-amber-800",
  "Ready for review": "bg-blue-100 text-blue-800",
  "Review held": "bg-green-100 text-green-800",
  "Post-review actions": "bg-purple-100 text-purple-800",
};

const exportCols: ExportColumn<LacReviewPrep>[] = [
  { header: "Young Person", accessor: (r: LacReviewPrep) => getYPName(r.youngPerson) },
  { header: "Review Type", accessor: (r: LacReviewPrep) => r.reviewType },
  { header: "Review Date", accessor: (r: LacReviewPrep) => r.reviewScheduledFor },
  { header: "IRO", accessor: (r: LacReviewPrep) => r.iroName },
  { header: "Prep Status", accessor: (r: LacReviewPrep) => r.prepStatus },
  { header: "Child Prep", accessor: (r: LacReviewPrep) => r.childPrepStatus },
  { header: "Child Attendance", accessor: (r: LacReviewPrep) => r.childChooseToAttend },
  { header: "Report Submitted", accessor: (r: LacReviewPrep) => r.homeReportSubmitted ? "Yes" : "No" },
  { header: "Open Actions", accessor: (r: LacReviewPrep) => String(r.outstandingActions.filter((a) => a.status !== "Done").length) },
];

export default function LacReviewPrepPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((p) => p.youngPerson === filterYP);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return a.reviewScheduledFor.localeCompare(b.reviewScheduledFor);
        case "child":
          return a.youngPerson.localeCompare(b.youngPerson);
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, sortBy]);

  const total = data.length;
  const reportsSubmitted = data.filter((p) => p.homeReportSubmitted).length;
  const totalOpenActions = data.reduce((sum, p) => sum + p.outstandingActions.filter((a) => a.status !== "Done").length, 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming30 = data.filter((p) => p.reviewScheduledFor >= todayStr && p.reviewScheduledFor <= d(30)).length;

  return (
    <PageShell
      title="LAC Review Preparation"
      subtitle="Pre-review work for each child — wishes and feelings, multi-agency reports, action progress"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="lac-review-prep" />
          <PrintButton title="LAC Review Preparation" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Reviews</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{upcoming30}</p>
          <p className="text-xs text-muted-foreground">Due Next 30 Days</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{reportsSubmitted}/{total}</p>
          <p className="text-xs text-muted-foreground">Home Reports Submitted</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{totalOpenActions}</p>
          <p className="text-xs text-muted-foreground">Open Actions</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Calendar className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          LAC reviews are statutory checkpoints, but they are also the child&apos;s opportunity to be heard at
          the highest level of their care planning. Preparation is everything — particularly the child&apos;s
          voice work, captured in the way each child finds easiest.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Soonest Review</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((prep) => {
          const isExpanded = expandedId === prep.id;
          const collected = prep.multiAgencyReportsCollected.filter((r) => r.received).length;
          const totalReports = prep.multiAgencyReportsCollected.length;
          const openActions = prep.outstandingActions.filter((a) => a.status !== "Done").length;

          return (
            <div key={prep.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : prep.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Calendar className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(prep.youngPerson)} &middot; {prep.reviewType}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Review {prep.reviewScheduledFor} &middot; IRO: {prep.iroName} &middot; Reports {collected}/{totalReports} &middot; {openActions} open actions
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", prepStatusColour[prep.prepStatus])}>
                    {prep.prepStatus}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* child voice prep */}
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">
                      <Mic className="h-3 w-3 inline mr-1" />Child Voice Prep ({prep.childPrepStatus})
                    </p>
                    <p className="text-sm mb-2">Attendance: <strong>{prep.childChooseToAttend}</strong></p>
                    {prep.childAdvocateInvolved && (
                      <p className="text-sm text-purple-700">Advocate: {prep.childAdvocateName}</p>
                    )}
                    <ul className="space-y-1 mt-2">
                      {prep.childPrepActivities.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-purple-600 mt-0.5">•</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* wishes and feelings */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      <Heart className="h-3 w-3 inline mr-1" />Wishes &amp; Feelings
                    </p>
                    <ul className="space-y-1">
                      {prep.childWishesAndFeelings.map((w, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* topics to raise/avoid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Topics To Raise</p>
                      <ul className="space-y-1">
                        {prep.childTopicsToRaise.map((t, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-emerald-600 mt-0.5">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Topics To Avoid</p>
                      <ul className="space-y-1">
                        {prep.childTopicsToAvoid.map((t, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* multi-agency reports */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <FileText className="h-3 w-3 inline mr-1" />Multi-Agency Reports ({collected}/{totalReports})
                    </p>
                    <div className="space-y-1">
                      {prep.multiAgencyReportsCollected.map((r, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between">
                          <span>{r.agency}</span>
                          {r.received ? (
                            <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />{r.receivedDate}</span>
                          ) : (
                            <span className="text-xs text-amber-600 flex items-center gap-1"><Clock className="h-3 w-3" />Pending</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* past actions progress */}
                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Past Actions — Progress Review</p>
                    <ul className="space-y-1">
                      {prep.pastActionsToReviewProgress.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          {a.status.startsWith("Achieved") ? <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" /> :
                           a.status.startsWith("In progress") || a.status.startsWith("Progress") ? <Clock className="h-3 w-3 text-amber-500 mt-1 shrink-0" /> :
                           <AlertTriangle className="h-3 w-3 text-red-500 mt-1 shrink-0" />}
                          <span>{a.action} — <em>{a.status}</em></span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* outstanding prep actions */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Prep Actions ({openActions} open)</p>
                    <div className="space-y-1">
                      {prep.outstandingActions.map((a, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-start justify-between gap-2">
                          <span className="flex-1">{a.action}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {a.owner.startsWith("staff_") ? getStaffName(a.owner) : a.owner} &middot; {a.deadline}
                          </span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                            a.status === "Done" ? "bg-green-100 text-green-800" :
                            a.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                            "bg-amber-100 text-amber-800"
                          )}>
                            {a.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* document currency */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Document Currency</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div className={cn("rounded-lg p-2 text-center text-sm", prep.riskAssessmentCurrent ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
                        {prep.riskAssessmentCurrent ? <CheckCircle className="h-4 w-4 inline mr-1" /> : <AlertTriangle className="h-4 w-4 inline mr-1" />}
                        Risk Assessment
                      </div>
                      <div className={cn("rounded-lg p-2 text-center text-sm", prep.carePlanCurrent ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
                        {prep.carePlanCurrent ? <CheckCircle className="h-4 w-4 inline mr-1" /> : <AlertTriangle className="h-4 w-4 inline mr-1" />}
                        Care Plan
                      </div>
                      <div className={cn("rounded-lg p-2 text-center text-sm", prep.educationReportObtained ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800")}>
                        {prep.educationReportObtained ? <CheckCircle className="h-4 w-4 inline mr-1" /> : <Clock className="h-4 w-4 inline mr-1" />}
                        Education Report
                      </div>
                      <div className={cn("rounded-lg p-2 text-center text-sm", prep.healthReportObtained ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800")}>
                        {prep.healthReportObtained ? <CheckCircle className="h-4 w-4 inline mr-1" /> : <Clock className="h-4 w-4 inline mr-1" />}
                        Health Report
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Post-Review Support Plan</p>
                    <p className="text-sm text-emerald-900">{prep.childPostReviewSupportPlan}</p>
                  </div>

                  {prep.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{prep.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Users className="h-3 w-3 inline mr-1" />Prepared by: {getStaffName(prep.preparedBy)}</span>
                    <span>Report deadline: {prep.homeReportDeadline}</span>
                    <span>Review: {prep.reviewScheduledFor}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> LAC review preparation supports Care Planning Regulations 2010,
          IRO Handbook 2010, Quality Standard 4 (the child&apos;s plan), and UNCRC Article 12. Reviews must
          consider the child&apos;s wishes and feelings as central. Preparation begins at least 4 weeks
          before the scheduled review. Linked to IRO Correspondence and Statutory Visit Log.
        </p>
      </div>
    </PageShell>
  );
}
