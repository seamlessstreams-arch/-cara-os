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
  Users,
  CheckCircle,
  Clock,
  FileText,
  Star,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlacementMeeting {
  id: string;
  youngPerson: string;
  meetingType: "Weekly Review" | "Monthly Review" | "Crisis Meeting" | "Pre-Placement Plan" | "Pre-LAC Prep" | "Multi-Agency Update" | "Transition Planning";
  date: string;
  durationMinutes: number;
  chair: string;
  attendees: string[];
  externalAttendees: string[];
  childAttended: boolean;
  childContribution: string;
  agenda: string[];
  progressSinceLast: string[];
  currentConcerns: string[];
  emergingThemes: string[];
  decisionsAgreed: string[];
  actions: { action: string; owner: string; deadline: string; status: "Open" | "In Progress" | "Done" }[];
  riskUpdates: string;
  carePlanReviewed: boolean;
  nextMeeting: string;
  minutedBy: string;
  approvedBy: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: PlacementMeeting[] = [
  {
    id: "pm-001",
    youngPerson: "yp_alex",
    meetingType: "Monthly Review",
    date: d(-7),
    durationMinutes: 75,
    chair: "staff_darren",
    attendees: ["staff_darren", "staff_ryan", "staff_edward", "staff_anna"],
    externalAttendees: ["Sarah Mitchell (Social Worker)"],
    childAttended: false,
    childContribution: "Pre-meeting key work session captured Alex's views: feels settled, school improving, wants more responsibility. Shared via key worker.",
    agenda: [
      "Progress against care plan goals",
      "Education update — recent attendance and engagement",
      "Therapy review (CAMHS)",
      "Family contact update",
      "Risk register review",
      "Independence pathway progress",
    ],
    progressSinceLast: [
      "School attendance up to 92% (was 85%)",
      "Therapy engagement strong — therapist reports trust deepening",
      "Joined boxing club — committed twice weekly attendance",
      "Successfully managed first sleepover at friend's house",
    ],
    currentConcerns: [
      "Some emotional dysregulation around mother's contact day",
      "Mild concern about new peer group at school — monitoring",
    ],
    emergingThemes: [
      "Alex showing increased capacity for relational repair",
      "Identity work emerging in life story sessions",
      "Greater willingness to take age-appropriate risks",
    ],
    decisionsAgreed: [
      "Continue current care plan with no major changes",
      "Add 'pre/post mother contact ritual' to support emotional regulation",
      "Increase Alex's pocket money in line with age (£15→£20/week)",
      "Approve sleepover requests case-by-case with risk assessment",
    ],
    actions: [
      { action: "Update behaviour support plan with contact-day rituals", owner: "staff_edward", deadline: d(7), status: "In Progress" },
      { action: "Update pocket money agreement", owner: "staff_anna", deadline: d(3), status: "Done" },
      { action: "Sleepover protocol drafted", owner: "staff_ryan", deadline: d(14), status: "Open" },
      { action: "School liaison about peer monitoring", owner: "staff_edward", deadline: d(7), status: "In Progress" },
    ],
    riskUpdates: "Risk register reviewed — peer group concern added at low-medium with monitoring. Other risks unchanged.",
    carePlanReviewed: true,
    nextMeeting: d(23),
    minutedBy: "staff_anna",
    approvedBy: "staff_darren",
  },
  {
    id: "pm-002",
    youngPerson: "yp_jordan",
    meetingType: "Multi-Agency Update",
    date: d(-3),
    durationMinutes: 90,
    chair: "staff_darren",
    attendees: ["staff_darren", "staff_ryan", "staff_chervelle"],
    externalAttendees: [
      "Tom Richards (Social Worker)",
      "DC James Cole (Police - exploitation team)",
      "Dr Patel (CAMHS)",
      "Mr Williams (school DSL)",
      "Hannah Green (advocate)",
    ],
    childAttended: true,
    childContribution: "Jordan attended for first 30 minutes with advocate. Contributed views about contact arrangements with mother, peer group concerns, and football aspirations. Spoke confidently and was heard.",
    agenda: [
      "Mother's pre-release planning",
      "Contextual safeguarding map review",
      "Recent peer associations — risk assessment",
      "Therapy progress",
      "Football club ongoing — protective factor",
      "School engagement",
    ],
    progressSinceLast: [
      "No missing-from-care episodes in 6 weeks",
      "School attendance maintained at 91%",
      "Football team captain — selected by coach and peers",
      "Therapy attendance 100% — engagement deepening",
      "Successfully attended cousin's birthday with supervised contact",
    ],
    currentConcerns: [
      "Mother's release in 8 weeks — preparation needs to begin",
      "Two known associates from previous neighbourhood seen near school — police aware",
      "Some testing of boundaries around return times — minor pattern emerging",
    ],
    emergingThemes: [
      "Jordan's increased ability to articulate concerns about mother",
      "Football identity strongly protective",
      "Capacity for self-awareness developing through therapy",
    ],
    decisionsAgreed: [
      "Pre-release planning meeting with prison social worker scheduled",
      "Contact safety plan to be drafted before mother's release",
      "Continue contextual safeguarding mapping monthly",
      "Police community presence around school maintained",
      "Boundary-testing pattern: relational response, not consequence-based",
    ],
    actions: [
      { action: "Pre-release planning meeting", owner: "Tom Richards (SW)", deadline: d(14), status: "Open" },
      { action: "Contact safety plan v1 drafted", owner: "staff_darren", deadline: d(21), status: "Open" },
      { action: "Contextual safeguarding map refreshed", owner: "staff_ryan", deadline: d(14), status: "In Progress" },
      { action: "Boundary conversation with Jordan", owner: "staff_chervelle (key worker)", deadline: d(5), status: "In Progress" },
      { action: "Update CP plan ahead of next CP review", owner: "Tom Richards (SW)", deadline: d(28), status: "Open" },
    ],
    riskUpdates: "Risk profile remains medium-high. Pre-release period anticipated to elevate risk — preparation underway. Football and therapy strong protective factors.",
    carePlanReviewed: true,
    nextMeeting: d(28),
    minutedBy: "staff_chervelle",
    approvedBy: "staff_darren",
  },
  {
    id: "pm-003",
    youngPerson: "yp_casey",
    meetingType: "Weekly Review",
    date: d(-1),
    durationMinutes: 45,
    chair: "staff_ryan",
    attendees: ["staff_ryan", "staff_anna", "staff_mirela"],
    externalAttendees: [],
    childAttended: false,
    childContribution: "Casey's views captured via visual cards in key working: feeling settled, art group going well, anxious about upcoming school trip.",
    agenda: [
      "Sensory regulation patterns this week",
      "School trip preparation (next week)",
      "Art therapy progress",
      "Routine effectiveness",
      "Sleep patterns",
    ],
    progressSinceLast: [
      "No major dysregulation events",
      "Continued positive engagement with art therapy",
      "Independent friendship outing successful (cinema)",
      "Sleep patterns stable with melatonin",
    ],
    currentConcerns: [
      "Anxiety building about school trip — needs structured preparation",
      "New shower gel caused brief sensory issue — resolved",
    ],
    emergingThemes: [
      "Casey expressing more nuanced emotions through art",
      "Confidence in independent peer relationships growing",
      "Routines firmly established — sensory needs met",
    ],
    decisionsAgreed: [
      "School trip social story to be created with Casey",
      "Practice visit to trip location if feasible",
      "Sensory bag specifically packed for trip",
      "Quiet contingency option agreed with school",
    ],
    actions: [
      { action: "Create social story for school trip", owner: "staff_anna", deadline: d(3), status: "In Progress" },
      { action: "Liaise with school about contingency arrangements", owner: "staff_anna", deadline: d(2), status: "Done" },
      { action: "Pack sensory trip bag with Casey", owner: "staff_anna", deadline: d(5), status: "Open" },
      { action: "Plan shower products review", owner: "staff_mirela", deadline: d(7), status: "Open" },
    ],
    riskUpdates: "No risk changes. School trip identified as anticipated stressor — mitigations in place.",
    carePlanReviewed: false,
    nextMeeting: d(6),
    minutedBy: "staff_mirela",
    approvedBy: "staff_ryan",
  },
  {
    id: "pm-004",
    youngPerson: "yp_alex",
    meetingType: "Pre-LAC Prep",
    date: d(-14),
    durationMinutes: 60,
    chair: "staff_darren",
    attendees: ["staff_darren", "staff_edward"],
    externalAttendees: ["Sarah Mitchell (Social Worker)"],
    childAttended: false,
    childContribution: "Pre-meeting work with Alex captured priorities for LAC review: wants to discuss college aspirations, mother contact arrangements, and continuing therapy. Did not want to attend in person but views fully represented.",
    agenda: [
      "Statutory care plan currency",
      "Outstanding actions from last LAC review",
      "Reports for IRO",
      "Alex's views and wishes",
      "Multi-agency report co-ordination",
      "Logistics of upcoming LAC review",
    ],
    progressSinceLast: [
      "All actions from previous LAC review completed except one (EP referral pending)",
      "Care plan refresh completed",
      "Education report co-authored with school",
      "Health report obtained from school nurse",
    ],
    currentConcerns: [
      "EP assessment outstanding — escalating to LA",
      "Need clarity on mother contact arrangements going forward",
    ],
    emergingThemes: [
      "Alex's progress evident across all domains",
      "College thinking emerging — aspirational planning needed",
    ],
    decisionsAgreed: [
      "Home report to be submitted 5 days before LAC review",
      "Alex to meet IRO pre-review for confidential conversation",
      "College visit to be arranged before next LAC review",
      "Therapy continuation to be ratified by LAC review",
    ],
    actions: [
      { action: "Submit home report to IRO", owner: "staff_darren", deadline: d(-7), status: "Done" },
      { action: "IRO confidential meeting with Alex", owner: "staff_edward", deadline: d(-3), status: "Done" },
      { action: "EP referral escalation", owner: "Sarah Mitchell", deadline: d(0), status: "In Progress" },
      { action: "College taster day arrangement", owner: "staff_edward", deadline: d(30), status: "Open" },
    ],
    riskUpdates: "No new risks identified. Risk register reviewed for LAC review submission.",
    carePlanReviewed: true,
    nextMeeting: d(45),
    minutedBy: "staff_edward",
    approvedBy: "staff_darren",
  },
  {
    id: "pm-005",
    youngPerson: "yp_jordan",
    meetingType: "Crisis Meeting",
    date: d(-18),
    durationMinutes: 60,
    chair: "staff_darren",
    attendees: ["staff_darren", "staff_ryan", "staff_lackson"],
    externalAttendees: ["Tom Richards (SW)", "Police YOT liaison"],
    childAttended: false,
    childContribution: "Jordan was at school during meeting. Views captured immediately afterwards by key worker — felt regretful, did not understand why he had left without saying.",
    agenda: [
      "Missing episode 48 hours ago — analysis",
      "Immediate risk assessment",
      "Safety planning",
      "Communication plan",
      "Multi-agency response",
    ],
    progressSinceLast: [
      "Jordan returned within 4 hours unharmed",
      "Police welfare check completed on return",
      "Medical check by GP confirmed wellbeing",
      "Open conversation between Jordan and key worker post-event",
    ],
    currentConcerns: [
      "Trigger identified: news about mother's earlier release date",
      "Need to strengthen support around contact-related stress",
      "Pre-existing missing risk requires careful response",
    ],
    emergingThemes: [
      "Jordan's avoidance pattern emerges around mother-related stress",
      "Self-regulation strategies need strengthening",
      "Importance of pre-emptive conversations identified",
    ],
    decisionsAgreed: [
      "No sanction-based response — relational approach",
      "Strengthen pre-emptive conversations around contact news",
      "Update missing risk assessment with new trigger information",
      "Therapy session focused on this pattern within 7 days",
      "Notify CP review chair of incident",
    ],
    actions: [
      { action: "Updated missing risk assessment", owner: "staff_ryan", deadline: d(-15), status: "Done" },
      { action: "Notify CP review chair", owner: "staff_darren", deadline: d(-16), status: "Done" },
      { action: "CAMHS session focused on pattern", owner: "staff_lackson", deadline: d(-10), status: "Done" },
      { action: "Pre-emptive conversation protocol", owner: "staff_darren", deadline: d(-7), status: "Done" },
    ],
    riskUpdates: "Missing risk reviewed — new trigger added. Mitigation strategies updated. No further missing episodes since.",
    carePlanReviewed: true,
    nextMeeting: d(-3),
    minutedBy: "staff_ryan",
    approvedBy: "staff_darren",
  },
];

const typeColour: Record<string, string> = {
  "Weekly Review": "bg-blue-100 text-blue-800",
  "Monthly Review": "bg-purple-100 text-purple-800",
  "Crisis Meeting": "bg-red-100 text-red-800",
  "Pre-Placement Plan": "bg-emerald-100 text-emerald-800",
  "Pre-LAC Prep": "bg-amber-100 text-amber-800",
  "Multi-Agency Update": "bg-indigo-100 text-indigo-800",
  "Transition Planning": "bg-pink-100 text-pink-800",
};

const exportCols: ExportColumn<PlacementMeeting>[] = [
  { header: "Young Person", accessor: (r: PlacementMeeting) => getYPName(r.youngPerson) },
  { header: "Type", accessor: (r: PlacementMeeting) => r.meetingType },
  { header: "Date", accessor: (r: PlacementMeeting) => r.date },
  { header: "Duration (min)", accessor: (r: PlacementMeeting) => String(r.durationMinutes) },
  { header: "Chair", accessor: (r: PlacementMeeting) => getStaffName(r.chair) },
  { header: "Child Attended", accessor: (r: PlacementMeeting) => r.childAttended ? "Yes" : "No" },
  { header: "Care Plan Reviewed", accessor: (r: PlacementMeeting) => r.carePlanReviewed ? "Yes" : "No" },
  { header: "Open Actions", accessor: (r: PlacementMeeting) => String(r.actions.filter((a) => a.status !== "Done").length) },
  { header: "Next Meeting", accessor: (r: PlacementMeeting) => r.nextMeeting },
];

export default function PlacementMeetingMinutesPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((m) => m.youngPerson === filterYP);
    if (filterType !== "all") items = items.filter((m) => m.meetingType === filterType);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "next":
          return a.nextMeeting.localeCompare(b.nextMeeting);
        case "child":
          return a.youngPerson.localeCompare(b.youngPerson);
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterType, sortBy]);

  const total = data.length;
  const openActions = data.reduce((sum, m) => sum + m.actions.filter((a) => a.status !== "Done").length, 0);
  const childAttendedCount = data.filter((m) => m.childAttended).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingNext = data.filter((m) => m.nextMeeting >= todayStr && m.nextMeeting <= d(14)).length;

  return (
    <PageShell
      title="Placement Meeting Minutes"
      subtitle="Internal placement reviews — multi-disciplinary discussion, decisions, and actions per child"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="placement-meeting-minutes" />
          <PrintButton title="Placement Meeting Minutes" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Total Meetings</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{openActions}</p>
          <p className="text-xs text-muted-foreground">Open Actions</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{childAttendedCount}</p>
          <p className="text-xs text-muted-foreground">Child Attended</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{upcomingNext}</p>
          <p className="text-xs text-muted-foreground">Due Next 14 Days</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Users className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Placement meetings are held weekly per child as standard, with monthly multi-agency reviews and
          crisis meetings as needed. Children&apos;s views are always represented — directly where appropriate.
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
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Weekly Review">Weekly Review</SelectItem>
            <SelectItem value="Monthly Review">Monthly Review</SelectItem>
            <SelectItem value="Crisis Meeting">Crisis Meeting</SelectItem>
            <SelectItem value="Multi-Agency Update">Multi-Agency Update</SelectItem>
            <SelectItem value="Pre-LAC Prep">Pre-LAC Prep</SelectItem>
            <SelectItem value="Pre-Placement Plan">Pre-Placement Plan</SelectItem>
            <SelectItem value="Transition Planning">Transition Planning</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="next">Next Meeting</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((meeting) => {
          const isExpanded = expandedId === meeting.id;
          const openActionCount = meeting.actions.filter((a) => a.status !== "Done").length;

          return (
            <div key={meeting.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : meeting.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Users className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(meeting.youngPerson)} &middot; {meeting.meetingType}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {meeting.date} &middot; {meeting.durationMinutes}min &middot; Chair: {getStaffName(meeting.chair)} &middot; {meeting.attendees.length + meeting.externalAttendees.length} attendees
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", typeColour[meeting.meetingType])}>
                    {meeting.meetingType}
                  </span>
                  {openActionCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">{openActionCount} open</span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Internal Attendees</p>
                      <ul className="space-y-1">
                        {meeting.attendees.map((a, i) => (
                          <li key={i} className="text-sm">{getStaffName(a)}{a === meeting.chair ? " (Chair)" : ""}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">External Attendees</p>
                      {meeting.externalAttendees.length > 0 ? (
                        <ul className="space-y-1">
                          {meeting.externalAttendees.map((a, i) => (
                            <li key={i} className="text-sm">{a}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">None</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Child Contribution</p>
                    <p className="text-sm text-purple-900">{meeting.childAttended ? "Child attended in person. " : "Child did not attend. "}{meeting.childContribution}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Agenda</p>
                    <ul className="space-y-1">
                      {meeting.agenda.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <FileText className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                        <Star className="h-3 w-3 inline mr-1" />Progress Since Last
                      </p>
                      <ul className="space-y-1">
                        {meeting.progressSinceLast.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Current Concerns
                      </p>
                      <ul className="space-y-1">
                        {meeting.currentConcerns.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Decisions Agreed</p>
                    <ul className="space-y-1">
                      {meeting.decisionsAgreed.map((dec, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          {dec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Actions ({meeting.actions.length})</p>
                    <div className="space-y-1">
                      {meeting.actions.map((act, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-start justify-between gap-2">
                          <span className="flex-1">{act.action}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {act.owner.startsWith("staff_") ? getStaffName(act.owner) : act.owner} &middot; {act.deadline}
                          </span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                            act.status === "Done" ? "bg-green-100 text-green-800" :
                            act.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                            "bg-amber-100 text-amber-800"
                          )}>
                            {act.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {meeting.riskUpdates && (
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">Risk Updates</p>
                      <p className="text-sm text-red-900">{meeting.riskUpdates}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Calendar className="h-3 w-3 inline mr-1" />Next: {meeting.nextMeeting}</span>
                    <span>Minuted by: {getStaffName(meeting.minutedBy)}</span>
                    <span>Approved by: {getStaffName(meeting.approvedBy)}</span>
                    {meeting.carePlanReviewed && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Care Plan Reviewed</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Internal placement meetings support Quality Standard 4 (the
          child&apos;s plan), Quality Standard 13 (leadership and management), and Regulation 13. They feed
          directly into LAC reviews, CP conferences, and Reg 45 quality of care reviews. Children&apos;s
          views are central per UNCRC Article 12.
        </p>
      </div>
    </PageShell>
  );
}
