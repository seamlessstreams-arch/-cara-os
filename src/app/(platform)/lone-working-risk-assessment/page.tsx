"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  UserCheck,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Eye,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LoneWorkingAssessment {
  id: string;
  staffMember: string;
  role: string;
  scenarios: { scenario: string; risk: "Low" | "Medium" | "High"; controls: string[] }[];
  competencyEvidence: string[];
  trainingCompleted: { course: string; date: string; valid: boolean }[];
  emergencyProtocols: string[];
  checkInArrangements: string;
  escalationPath: string[];
  approvedActivities: string[];
  restrictedActivities: string[];
  approvedToWorkAlone: boolean;
  approvedShifts: ("Early" | "Late" | "Sleep-in" | "Wake-night" | "Weekend")[];
  vehicleApproved: boolean;
  communityVisitsApproved: boolean;
  overallRiskLevel: "Low" | "Medium" | "High";
  reviewedDate: string;
  reviewedBy: string;
  nextReviewDate: string;
  individualConsiderations: string;
  staffSelfAssessment: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: LoneWorkingAssessment[] = [
  {
    id: "lwra-001",
    staffMember: "staff_ryan",
    role: "Deputy Manager",
    scenarios: [
      {
        scenario: "Lone shift with all 3 young people present (rare backup scenario)",
        risk: "Medium",
        controls: ["On-call manager (RM) reachable", "Emergency contact list on wall", "All children's behaviour plans reviewed", "Police non-emergency on speed-dial"],
      },
      {
        scenario: "Sleep-in shift",
        risk: "Low",
        controls: ["Standard sleep-in protocol", "Welfare checks at agreed intervals", "Phone always on bedside"],
      },
      {
        scenario: "Community trip with one young person",
        risk: "Medium",
        controls: ["Pre-trip risk assessment", "Phone tracking shared with RM", "Hourly check-in agreed", "Emergency funds available"],
      },
    ],
    competencyEvidence: [
      "Senior practitioner status — 6 years' experience",
      "Diploma Level 5 Leadership in Children's Residential Care",
      "Completed all mandatory training within last 12 months",
      "Consistently positive supervision feedback",
      "No safeguarding concerns ever raised",
    ],
    trainingCompleted: [
      { course: "Safeguarding Children Level 3", date: d(-180), valid: true },
      { course: "Positive Behaviour Support", date: d(-90), valid: true },
      { course: "First Aid (Paediatric)", date: d(-120), valid: true },
      { course: "Lone Working Awareness", date: d(-60), valid: true },
      { course: "Mental Health First Aid", date: d(-200), valid: true },
    ],
    emergencyProtocols: [
      "Call 999 for medical/fire/safeguarding emergency",
      "Call on-call manager (RM 24/7)",
      "Use 'red flag' code phrase for covert escalation if needed",
      "Direct line to police (community team)",
    ],
    checkInArrangements: "Hourly check-in with on-call manager during community trips. Standard text confirmation each shift start/end.",
    escalationPath: [
      "1. Try on-call manager (RM)",
      "2. Try deputy on-call",
      "3. Try named senior practitioner",
      "4. Police 101 (or 999 if emergency)",
      "5. LADO out-of-hours number for safeguarding",
    ],
    approvedActivities: [
      "Solo shift management",
      "Community visits with all young people",
      "Vehicle transport (own + work pool)",
      "Cash handling within agreed limits",
      "Multi-agency meetings as home representative",
      "All standard residential care duties",
    ],
    restrictedActivities: [
      "None — full approval given role",
    ],
    approvedToWorkAlone: true,
    approvedShifts: ["Early", "Late", "Sleep-in", "Wake-night", "Weekend"],
    vehicleApproved: true,
    communityVisitsApproved: true,
    overallRiskLevel: "Low",
    reviewedDate: d(-60),
    reviewedBy: "staff_darren",
    nextReviewDate: d(305),
    individualConsiderations: "Senior staff member with deputy responsibilities. Highly experienced. Supports other staff during their shifts. Acts as on-call cover when RM unavailable.",
    staffSelfAssessment: "Confident in lone working scenarios. Have established back-up protocols and use them appropriately. Will continue to call on-call when uncertain — not a sign of weakness.",
  },
  {
    id: "lwra-002",
    staffMember: "staff_anna",
    role: "Senior Residential Care Worker",
    scenarios: [
      {
        scenario: "Sleep-in shift",
        risk: "Low",
        controls: ["Standard sleep-in protocol", "Welfare checks per care plans", "Phone always on bedside", "Call RM if uncertain"],
      },
      {
        scenario: "Community trip with Casey (ASD-specific)",
        risk: "Medium",
        controls: ["Pre-trip social story", "Sensory bag prepared", "Quiet contingency planned", "Casey's emergency tools available", "RM informed of trip plan"],
      },
      {
        scenario: "1:1 key working session with any child",
        risk: "Low",
        controls: ["Door slightly open per safe practice", "Session structure agreed beforehand", "Recording in shift notes"],
      },
    ],
    competencyEvidence: [
      "5 years at Oak House",
      "ASD specialist training (NAS)",
      "All mandatory training current",
      "Strong safeguarding awareness",
      "Excellent supervision feedback",
    ],
    trainingCompleted: [
      { course: "Safeguarding Children Level 3", date: d(-150), valid: true },
      { course: "ASD Practice Specialist", date: d(-100), valid: true },
      { course: "Positive Behaviour Support", date: d(-80), valid: true },
      { course: "First Aid (Paediatric)", date: d(-200), valid: true },
      { course: "Lone Working Awareness", date: d(-60), valid: true },
    ],
    emergencyProtocols: [
      "Call 999 for emergency",
      "Call on-call manager",
      "Use established escalation route",
    ],
    checkInArrangements: "Standard shift start/end confirmation. Hourly check-in for community trips. Sensory-specific protocols for Casey trips.",
    escalationPath: [
      "1. On-call manager",
      "2. Deputy",
      "3. Police if safeguarding/emergency",
    ],
    approvedActivities: [
      "Solo shift management",
      "Community visits — Casey's ASD-specific",
      "Vehicle transport",
      "Key working sessions",
      "Sleep-in and wake-night shifts",
    ],
    restrictedActivities: [
      "None within role",
    ],
    approvedToWorkAlone: true,
    approvedShifts: ["Early", "Late", "Sleep-in", "Wake-night", "Weekend"],
    vehicleApproved: true,
    communityVisitsApproved: true,
    overallRiskLevel: "Low",
    reviewedDate: d(-40),
    reviewedBy: "staff_darren",
    nextReviewDate: d(325),
    individualConsiderations: "Casey's primary key worker. Has strongest relationship with Casey of any team member. Vital that ASD-specific scenarios are well-prepared.",
    staffSelfAssessment: "Settled in role. Comfortable with all aspects of lone working. Particular awareness of Casey's needs in community settings. Will continue to plan trips meticulously.",
  },
  {
    id: "lwra-003",
    staffMember: "staff_mirela",
    role: "Residential Care Worker",
    scenarios: [
      {
        scenario: "Sleep-in shift",
        risk: "Medium",
        controls: ["First sleep-ins shadowed", "Standard sleep-in protocol", "RM on-call always available", "Encouraged to call without hesitation"],
      },
      {
        scenario: "Late shift with deputy on-call",
        risk: "Low",
        controls: ["Deputy reachable", "All policies accessible", "Standard handover received"],
      },
      {
        scenario: "Community trip with one young person",
        risk: "Medium",
        controls: ["Trip pre-approved", "Hourly check-ins", "Phone tracking", "RM aware of trip plan"],
      },
    ],
    competencyEvidence: [
      "18 months at Oak House",
      "Successfully completed induction",
      "All shadow shifts signed off",
      "Mandatory training current",
      "Positive supervision feedback consistently",
    ],
    trainingCompleted: [
      { course: "Safeguarding Children Level 3", date: d(-100), valid: true },
      { course: "Positive Behaviour Support", date: d(-150), valid: true },
      { course: "First Aid (Paediatric)", date: d(-180), valid: true },
      { course: "Lone Working Awareness", date: d(-90), valid: true },
      { course: "Trauma-Informed Practice", date: d(-200), valid: true },
    ],
    emergencyProtocols: [
      "Call 999 if emergency",
      "Call on-call manager",
      "Use escalation list on wall",
    ],
    checkInArrangements: "Standard shift start/end confirmation. Encouraged to phone in for any uncertainty (no penalty).",
    escalationPath: [
      "1. On-call manager",
      "2. Deputy on-call",
      "3. Senior practitioner",
      "4. Police if needed",
    ],
    approvedActivities: [
      "Solo daytime shifts",
      "Sleep-in shifts (now established)",
      "Wake-night shifts",
      "Community trips with one young person",
      "Vehicle transport",
    ],
    restrictedActivities: [
      "Sole responsibility for crisis intervention requiring multiple staff (call backup)",
      "Multi-agency meetings without RM/Deputy support",
    ],
    approvedToWorkAlone: true,
    approvedShifts: ["Early", "Late", "Sleep-in", "Wake-night", "Weekend"],
    vehicleApproved: true,
    communityVisitsApproved: true,
    overallRiskLevel: "Low",
    reviewedDate: d(-30),
    reviewedBy: "staff_darren",
    nextReviewDate: d(335),
    individualConsiderations: "Newer staff member but settled. Confidence growing. English not first language but excellent practice in workplace. Cultural perspectives valuable to team.",
    staffSelfAssessment: "Feel ready for full lone working. Will always ask if uncertain. Grateful for thorough induction. Looking forward to taking on more responsibility.",
  },
  {
    id: "lwra-004",
    staffMember: "staff_lackson",
    role: "Residential Care Worker",
    scenarios: [
      {
        scenario: "Sleep-in shift",
        risk: "Low",
        controls: ["Standard sleep-in protocol", "Phone bedside", "Welfare checks done"],
      },
      {
        scenario: "Late shift solo",
        risk: "Low",
        controls: ["Pre-shift handover thorough", "On-call deputy available", "Standard policies in place"],
      },
      {
        scenario: "Boxing club transport (Alex)",
        risk: "Low",
        controls: ["Familiar route and activity", "Coach known", "Pickup time confirmed", "Phone tracking"],
      },
    ],
    competencyEvidence: [
      "3 years at Oak House",
      "Sport coaching qualifications (engagement asset)",
      "Strong rapport with all young people",
      "All mandatory training current",
      "Consistently positive feedback from RM and children",
    ],
    trainingCompleted: [
      { course: "Safeguarding Children Level 3", date: d(-100), valid: true },
      { course: "Positive Behaviour Support", date: d(-60), valid: true },
      { course: "First Aid (Paediatric)", date: d(-150), valid: true },
      { course: "Lone Working Awareness", date: d(-50), valid: true },
      { course: "Driver Training", date: d(-180), valid: true },
    ],
    emergencyProtocols: [
      "Standard 999 / on-call protocol",
    ],
    checkInArrangements: "Standard arrangements. Boxing club shifts: confirm Alex returned safely.",
    escalationPath: [
      "On-call manager → Deputy → Police if needed",
    ],
    approvedActivities: [
      "All standard shifts",
      "Sport-related trips and activities",
      "Vehicle transport",
      "Community engagement",
    ],
    restrictedActivities: [
      "Multi-agency meetings without senior support (preference rather than restriction)",
    ],
    approvedToWorkAlone: true,
    approvedShifts: ["Early", "Late", "Sleep-in", "Wake-night", "Weekend"],
    vehicleApproved: true,
    communityVisitsApproved: true,
    overallRiskLevel: "Low",
    reviewedDate: d(-50),
    reviewedBy: "staff_darren",
    nextReviewDate: d(315),
    individualConsiderations: "Strong relational practice. Sport coaching role uniquely supports Alex's boxing engagement. Trusted by all young people.",
    staffSelfAssessment: "Comfortable in role. Particularly enjoy the sport-based engagement work. Will continue to seek supervision when navigating complex relational dynamics.",
  },
];

const riskColour: Record<string, string> = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-red-100 text-red-800",
};

const exportCols: ExportColumn<LoneWorkingAssessment>[] = [
  { header: "Staff Member", accessor: (r: LoneWorkingAssessment) => getStaffName(r.staffMember) },
  { header: "Role", accessor: (r: LoneWorkingAssessment) => r.role },
  { header: "Approved Solo", accessor: (r: LoneWorkingAssessment) => r.approvedToWorkAlone ? "Yes" : "No" },
  { header: "Vehicle Approved", accessor: (r: LoneWorkingAssessment) => r.vehicleApproved ? "Yes" : "No" },
  { header: "Community Visits", accessor: (r: LoneWorkingAssessment) => r.communityVisitsApproved ? "Yes" : "No" },
  { header: "Overall Risk", accessor: (r: LoneWorkingAssessment) => r.overallRiskLevel },
  { header: "Reviewed", accessor: (r: LoneWorkingAssessment) => r.reviewedDate },
  { header: "Next Review", accessor: (r: LoneWorkingAssessment) => r.nextReviewDate },
];

export default function LoneWorkingRiskAssessmentPage() {
  const [filterStaff, setFilterStaff] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [sortBy, setSortBy] = useState("review");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterStaff !== "all") items = items.filter((a) => a.staffMember === filterStaff);
    if (filterRisk !== "all") items = items.filter((a) => a.overallRiskLevel === filterRisk);
    items.sort((a, b) => {
      switch (sortBy) {
        case "review":
          return a.nextReviewDate.localeCompare(b.nextReviewDate);
        case "name":
          return a.staffMember.localeCompare(b.staffMember);
        case "risk":
          const ord = { High: 0, Medium: 1, Low: 2 };
          return ord[a.overallRiskLevel] - ord[b.overallRiskLevel];
        default:
          return 0;
      }
    });
    return items;
  }, [filterStaff, filterRisk, sortBy]);

  const total = data.length;
  const allApproved = data.every((a) => a.approvedToWorkAlone);
  const dueReview = data.filter((a) => a.nextReviewDate <= d(60)).length;
  const trainingExpiring = data.filter((a) => a.trainingCompleted.some((t) => !t.valid)).length;

  return (
    <PageShell
      title="Lone Working Risk Assessment"
      subtitle="Per-staff lone working assessments — scenarios, controls, and approved activities"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="lone-working-risk-assessments" />
          <PrintButton title="Lone Working Risk Assessments" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Assessments</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allApproved ? "100%" : `${data.filter((a) => a.approvedToWorkAlone).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Approved Solo Working</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", dueReview > 0 ? "text-amber-600" : "text-green-600")}>{dueReview}</p>
          <p className="text-xs text-muted-foreground">Review Due 60 Days</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", trainingExpiring > 0 ? "text-red-600" : "text-green-600")}>{trainingExpiring}</p>
          <p className="text-xs text-muted-foreground">Training Expiring</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <UserCheck className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Lone working in residential care is high-stakes — staff must be safe, supported, and competent.
          Each assessment is individualised to the staff member, their role, and the specific scenarios they
          face. Calling on-call is always encouraged, never penalised.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterStaff} onValueChange={setFilterStaff}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Staff" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            {data.map((a) => (
              <SelectItem key={a.staffMember} value={a.staffMember}>{getStaffName(a.staffMember)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Risk Levels" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="review">Earliest Review</SelectItem>
              <SelectItem value="name">By Name</SelectItem>
              <SelectItem value="risk">By Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((assessment) => {
          const isExpanded = expandedId === assessment.id;

          return (
            <div key={assessment.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : assessment.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <UserCheck className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getStaffName(assessment.staffMember)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {assessment.role} &middot; Reviewed {assessment.reviewedDate} &middot; Next due {assessment.nextReviewDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", riskColour[assessment.overallRiskLevel])}>
                    {assessment.overallRiskLevel} Risk
                  </span>
                  {assessment.approvedToWorkAlone && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* scenarios */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Lone Working Scenarios</p>
                    <div className="space-y-2">
                      {assessment.scenarios.map((s, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 border">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">{s.scenario}</p>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", riskColour[s.risk])}>{s.risk}</span>
                          </div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Controls:</p>
                          <ul className="space-y-0.5">
                            {s.controls.map((c, ci) => (
                              <li key={ci} className="text-xs flex items-start gap-1">
                                <Shield className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* approved/restricted */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                        <CheckCircle className="h-3 w-3 inline mr-1" />Approved Activities
                      </p>
                      <ul className="space-y-1">
                        {assessment.approvedActivities.map((a, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-green-600 mt-0.5">•</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Restricted Activities
                      </p>
                      <ul className="space-y-1">
                        {assessment.restrictedActivities.map((r, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* training */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Training Status</p>
                    <div className="space-y-1">
                      {assessment.trainingCompleted.map((t, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between">
                          <span>{t.course}</span>
                          <span className="text-xs text-muted-foreground">{t.date}</span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                            t.valid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          )}>
                            {t.valid ? "Valid" : "Expired"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* check-in & escalation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                        <Phone className="h-3 w-3 inline mr-1" />Check-In Arrangements
                      </p>
                      <p className="text-sm">{assessment.checkInArrangements}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Escalation Path</p>
                      <ol className="space-y-1 text-sm list-decimal pl-4">
                        {assessment.escalationPath.map((e, i) => (
                          <li key={i}>{e.replace(/^\d+\.\s*/, "")}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {/* approved shifts */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Approved Shift Types</p>
                    <div className="flex flex-wrap gap-1">
                      {assessment.approvedShifts.map((s) => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{s}</span>
                      ))}
                    </div>
                  </div>

                  {/* self-assessment */}
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Staff Self-Assessment</p>
                    <p className="text-sm text-purple-900 italic">&ldquo;{assessment.staffSelfAssessment}&rdquo;</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Individual Considerations</p>
                    <p className="text-sm">{assessment.individualConsiderations}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Eye className="h-3 w-3 inline mr-1" />Reviewed by: {getStaffName(assessment.reviewedBy)}</span>
                    <span><Clock className="h-3 w-3 inline mr-1" />Next review: {assessment.nextReviewDate}</span>
                    {assessment.vehicleApproved && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">Vehicle Approved</span>}
                    {assessment.communityVisitsApproved && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Community Approved</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Lone working assessments support Health and Safety at Work
          Act 1974, Management of Health and Safety at Work Regulations 1999, Quality Standard 13 (leadership
          and management), and the home&apos;s safer-recruitment-to-supervision continuum. Reviewed annually
          minimum, or when role/circumstances change.
        </p>
      </div>
    </PageShell>
  );
}
