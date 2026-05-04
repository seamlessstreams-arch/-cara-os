"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — GOVERNANCE MEETING MINUTES
// Records of governance meetings between the Responsible Individual and
// management team demonstrating oversight per Regulation 45 & Quality Standard 25.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  ClipboardList,
  Shield,
} from "lucide-react";

/* ─── date helper ─── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ─── types ─── */
interface GovernanceAction {
  description: string;
  owner: string;
  deadline: string;
  status: "completed" | "in_progress" | "overdue" | "pending";
}

interface GovernanceMeeting {
  id: string;
  date: string;
  meetingType: string;
  chair: string;
  attendees: string[];
  agendaItems: string[];
  keyDecisions: string[];
  actions: GovernanceAction[];
  childrenDiscussed: string[];
  regulatoryTopics: string[];
  riskItems: string[];
  nextMeetingDate: string;
}

/* ─── seed data ─── */
const meetings: GovernanceMeeting[] = [
  {
    id: "gov_001",
    date: d(-7),
    meetingType: "Monthly Governance",
    chair: "staff_alicia",
    attendees: ["staff_alicia", "staff_darren", "staff_ryan"],
    agendaItems: [
      "Review of Reg 44 visit findings from last month",
      "Staffing levels and recruitment update",
      "Safeguarding incidents review",
      "Quality of care indicators",
      "Budget and financial oversight",
      "Young people progress and outcomes",
    ],
    keyDecisions: [
      "Approved recruitment of additional waking night staff to start within 6 weeks",
      "Agreed to implement new key working recording format from next month",
      "Confirmed annual development review dates for all staff",
      "Ratified updated missing from care protocol",
    ],
    actions: [
      { description: "Recruit waking night staff — advertise within 1 week", owner: "staff_darren", deadline: d(7), status: "in_progress" },
      { description: "Update key working templates and brief team", owner: "staff_ryan", deadline: d(21), status: "pending" },
      { description: "Submit revised missing protocol to local authority", owner: "staff_darren", deadline: d(14), status: "in_progress" },
      { description: "Schedule annual development reviews for Q3", owner: "staff_darren", deadline: d(28), status: "pending" },
    ],
    childrenDiscussed: ["yp_alex", "yp_jordan", "yp_casey"],
    regulatoryTopics: ["Reg 44 compliance", "Staffing regulation (Reg 40)", "Missing from care (Reg 34)"],
    riskItems: ["Waking night cover reliance on agency until recruitment completes", "Casey missing episodes — multi-agency plan in place"],
    nextMeetingDate: d(23),
  },
  {
    id: "gov_002",
    date: d(-37),
    meetingType: "Monthly Governance",
    chair: "staff_alicia",
    attendees: ["staff_alicia", "staff_darren", "staff_ryan"],
    agendaItems: [
      "Previous meeting actions — progress review",
      "Ofsted readiness self-assessment",
      "Training compliance and gaps",
      "Complaints and representations log",
      "Environmental health and safety",
      "Financial review Q2",
    ],
    keyDecisions: [
      "Agreed Ofsted readiness action plan priorities for next quarter",
      "Approved training budget increase for therapeutic care courses",
      "Confirmed no outstanding complaints requiring escalation",
      "Signed off fire risk assessment remedial works schedule",
    ],
    actions: [
      { description: "Complete Ofsted self-evaluation update", owner: "staff_darren", deadline: d(-23), status: "completed" },
      { description: "Book therapeutic care training for 4 staff members", owner: "staff_ryan", deadline: d(-20), status: "completed" },
      { description: "Commission fire door replacement — quotes obtained", owner: "staff_darren", deadline: d(-14), status: "completed" },
      { description: "Review complaints log and close completed items", owner: "staff_darren", deadline: d(-30), status: "completed" },
    ],
    childrenDiscussed: ["yp_alex", "yp_jordan"],
    regulatoryTopics: ["Ofsted readiness", "Training (Reg 33)", "Complaints (Reg 39)", "Health & safety (Reg 25)"],
    riskItems: ["Fire doors in corridor require replacement — works scheduled", "One staff member overdue TCI refresher"],
    nextMeetingDate: d(-7),
  },
  {
    id: "gov_003",
    date: d(-67),
    meetingType: "Quarterly Strategy",
    chair: "staff_alicia",
    attendees: ["staff_alicia", "staff_darren", "staff_ryan", "staff_anna"],
    agendaItems: [
      "Quarterly outcomes review — education, health, emotional wellbeing",
      "Placement stability and matching assessment",
      "Workforce development plan progress",
      "Statement of Purpose annual review preparation",
      "Quality standards self-audit results",
      "Strategic development — service improvement priorities",
      "Budget forecast and resource allocation",
    ],
    keyDecisions: [
      "Placement matching remains strong — no placement changes needed",
      "Workforce plan on track — supervision frequency increased to 6-weekly",
      "Statement of Purpose update to be completed by end of quarter",
      "Agreed three service improvement priorities: key working, participation, outcomes tracking",
    ],
    actions: [
      { description: "Draft updated Statement of Purpose", owner: "staff_darren", deadline: d(-45), status: "completed" },
      { description: "Implement 6-weekly supervision cycle", owner: "staff_darren", deadline: d(-50), status: "completed" },
      { description: "Develop young people participation framework", owner: "staff_anna", deadline: d(-30), status: "completed" },
      { description: "Review and update outcomes tracking system", owner: "staff_ryan", deadline: d(-40), status: "completed" },
      { description: "Present Q2 education outcomes to governance", owner: "staff_darren", deadline: d(-37), status: "completed" },
    ],
    childrenDiscussed: ["yp_alex", "yp_jordan", "yp_casey"],
    regulatoryTopics: ["Quality Standards (all)", "Statement of Purpose (Reg 16)", "Supervision (QS 7.3)", "Education outcomes"],
    riskItems: ["Jordan therapy sessions at risk if funding not confirmed — escalated to commissioner"],
    nextMeetingDate: d(-37),
  },
  {
    id: "gov_004",
    date: d(-97),
    meetingType: "Monthly Governance",
    chair: "staff_alicia",
    attendees: ["staff_alicia", "staff_darren", "staff_ryan"],
    agendaItems: [
      "Actions from previous meeting",
      "Incident analysis — patterns and trends",
      "Medication management audit outcomes",
      "Staff wellbeing and retention",
      "Reg 44 independent visitor feedback",
      "Children's progress updates",
    ],
    keyDecisions: [
      "Incident trend shows reduction — continue current behaviour support approach",
      "Medication audit scored 95% — minor recording issue to be addressed",
      "Staff retention plan approved including wellbeing initiatives",
      "Reg 44 visitor report positive — one recommendation actioned",
    ],
    actions: [
      { description: "Address medication recording gap — retrain on MAR sheets", owner: "staff_edward", deadline: d(-83), status: "completed" },
      { description: "Implement staff wellbeing check-ins (monthly)", owner: "staff_darren", deadline: d(-80), status: "completed" },
      { description: "Action Reg 44 recommendation: update visitor information pack", owner: "staff_ryan", deadline: d(-75), status: "completed" },
      { description: "Present incident trend analysis at team meeting", owner: "staff_darren", deadline: d(-90), status: "completed" },
    ],
    childrenDiscussed: ["yp_jordan", "yp_casey"],
    regulatoryTopics: ["Reg 44 compliance", "Medication (Reg 23)", "Behaviour support (QS 3)", "Staff welfare"],
    riskItems: ["Agency use above target — recruitment plan to reduce dependency"],
    nextMeetingDate: d(-67),
  },
  {
    id: "gov_005",
    date: d(-185),
    meetingType: "Annual Review",
    chair: "staff_alicia",
    attendees: ["staff_alicia", "staff_darren", "staff_ryan", "staff_anna", "staff_edward"],
    agendaItems: [
      "Annual quality of care review",
      "Regulation 45 — review of home's overall effectiveness",
      "Annual outcomes summary for all young people",
      "Workforce analysis — staffing, training, development",
      "Financial year-end review and next year budget",
      "Ofsted inspection preparedness",
      "Policies and procedures annual review",
      "Strategic plan for coming year",
      "Independent visitor annual summary",
      "Complaints and compliments annual review",
    ],
    keyDecisions: [
      "Annual review confirms home operating to Good standard with Outstanding features",
      "All three young people making measurable progress against placement plans",
      "Staffing structure adequate — one additional post approved for coming year",
      "All policies reviewed and updated within regulatory timescales",
      "Strategic priorities for next year: therapeutic model deepening, participation, transitions planning",
    ],
    actions: [
      { description: "Publish Reg 45 annual report to Ofsted and placing authorities", owner: "staff_darren", deadline: d(-170), status: "completed" },
      { description: "Update all policies following annual review", owner: "staff_darren", deadline: d(-155), status: "completed" },
      { description: "Develop therapeutic model framework document", owner: "staff_anna", deadline: d(-130), status: "completed" },
      { description: "Create transitions preparation plan for Casey (approaching 16)", owner: "staff_chervelle", deadline: d(-150), status: "completed" },
      { description: "Commission independent quality assurance visit", owner: "staff_alicia", deadline: d(-160), status: "completed" },
    ],
    childrenDiscussed: ["yp_alex", "yp_jordan", "yp_casey"],
    regulatoryTopics: ["Reg 45 annual review", "Ofsted readiness", "All Quality Standards", "Statement of Purpose", "Policies (Reg 17)"],
    riskItems: ["Casey approaching 16 — transitions planning critical", "Budget pressure from local authority fee negotiations"],
    nextMeetingDate: d(-97),
  },
  {
    id: "gov_006",
    date: d(-127),
    meetingType: "Monthly Governance",
    chair: "staff_alicia",
    attendees: ["staff_alicia", "staff_darren", "staff_ryan"],
    agendaItems: [
      "Previous actions review",
      "Transitions planning progress (Casey)",
      "New referral assessment and matching",
      "Environmental improvements update",
      "Notifiable events review",
      "Partnership working — external agencies",
    ],
    keyDecisions: [
      "Casey transitions plan agreed — phased approach with independence building",
      "Declined referral for new young person — matching assessment identified incompatibility",
      "Garden improvement project approved — young people to be involved in planning",
      "No notifiable events in period — positive",
    ],
    actions: [
      { description: "Begin Casey independence skills programme", owner: "staff_chervelle", deadline: d(-110), status: "completed" },
      { description: "Write matching assessment rationale for declined referral", owner: "staff_darren", deadline: d(-120), status: "completed" },
      { description: "Get quotes for garden project — involve young people in design", owner: "staff_ryan", deadline: d(-100), status: "completed" },
      { description: "Update partnership agency contact list", owner: "staff_ryan", deadline: d(-115), status: "overdue" },
    ],
    childrenDiscussed: ["yp_casey"],
    regulatoryTopics: ["Transitions (QS 5)", "Matching and referrals (Reg 14)", "Environment (QS 4)", "Notifiable events (Reg 40)"],
    riskItems: ["Declined referral may affect relationship with placing authority — RM to communicate rationale clearly"],
    nextMeetingDate: d(-97),
  },
];

/* ─── helpers ─── */
const getYPName = (id: string): string => {
  const map: Record<string, string> = { yp_alex: "Alex", yp_jordan: "Jordan", yp_casey: "Casey" };
  return map[id] ?? id;
};

/* ─── export columns ─── */
const exportCols: ExportColumn<GovernanceMeeting>[] = [
  { header: "Date", accessor: (r: GovernanceMeeting) => r.date },
  { header: "Meeting Type", accessor: (r: GovernanceMeeting) => r.meetingType },
  { header: "Chair", accessor: (r: GovernanceMeeting) => getStaffName(r.chair) },
  { header: "Attendees", accessor: (r: GovernanceMeeting) => r.attendees.map(getStaffName).join(", ") },
  { header: "Key Decisions", accessor: (r: GovernanceMeeting) => r.keyDecisions.join("; ") },
  { header: "Actions (Total)", accessor: (r: GovernanceMeeting) => r.actions.length.toString() },
  { header: "Actions (Open)", accessor: (r: GovernanceMeeting) => r.actions.filter((a) => a.status !== "completed").length.toString() },
  { header: "Regulatory Topics", accessor: (r: GovernanceMeeting) => r.regulatoryTopics.join(", ") },
  { header: "Risk Items", accessor: (r: GovernanceMeeting) => r.riskItems.join("; ") },
  { header: "Next Meeting", accessor: (r: GovernanceMeeting) => r.nextMeetingDate },
];

/* ─── component ─── */
export default function GovernanceMeetingMinutesPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  /* ─── filtered & sorted ─── */
  const filtered = useMemo(() => {
    let list = [...meetings];
    if (filterType !== "all") list = list.filter((m) => m.meetingType === filterType);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "actions":
          return b.actions.filter((x) => x.status !== "completed").length - a.actions.filter((x) => x.status !== "completed").length;
        case "type":
          return a.meetingType.localeCompare(b.meetingType);
        default:
          return 0;
      }
    });
    return list;
  }, [filterType, sortBy]);

  /* ─── summary stats ─── */
  const stats = useMemo(() => {
    const allActions = meetings.flatMap((m) => m.actions);
    const totalMeetings = meetings.length;
    const openActions = allActions.filter((a) => a.status !== "completed").length;
    const overdueActions = allActions.filter((a) => a.status === "overdue" || (a.status !== "completed" && a.deadline < d(0))).length;
    const nextMeeting = meetings
      .map((m) => m.nextMeetingDate)
      .filter((dt) => dt >= d(0))
      .sort()[0] ?? "Not scheduled";
    return { totalMeetings, openActions, overdueActions, nextMeeting };
  }, []);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const meetingTypeBadge = (type: string) => {
    switch (type) {
      case "Monthly Governance":
        return <Badge className="bg-blue-100 text-blue-800">{type}</Badge>;
      case "Quarterly Strategy":
        return <Badge className="bg-purple-100 text-purple-800">{type}</Badge>;
      case "Annual Review":
        return <Badge className="bg-amber-100 text-amber-800">{type}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const actionStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 text-xs">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800 text-xs">In Progress</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800 text-xs">Overdue</Badge>;
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800 text-xs">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const getActionCompletionRate = (actions: GovernanceAction[]) => {
    if (actions.length === 0) return 100;
    return Math.round((actions.filter((a) => a.status === "completed").length / actions.length) * 100);
  };

  return (
    <PageShell
      title="Governance Meeting Minutes"
      subtitle="Records of RI and management governance meetings demonstrating oversight per Regulation 45 and Quality Standard 25"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={meetings} columns={exportCols} filename="governance-meeting-minutes" />
          <PrintButton title="Governance Meeting Minutes" />
        </div>
      }
    >
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.totalMeetings}</p>
            <p className="text-xs text-muted-foreground">Total Meetings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.openActions}</p>
            <p className="text-xs text-muted-foreground">Actions Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.overdueActions}</p>
            <p className="text-xs text-muted-foreground">Actions Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.nextMeeting}</p>
            <p className="text-xs text-muted-foreground">Next Meeting</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── overdue alert ─── */}
      {stats.overdueActions > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">{stats.overdueActions} Overdue Action{stats.overdueActions > 1 ? "s" : ""}</p>
              <p className="text-xs text-red-700 mt-1">
                There {stats.overdueActions === 1 ? "is" : "are"} {stats.overdueActions} governance action{stats.overdueActions > 1 ? "s" : ""} past
                the agreed deadline. These require immediate attention to demonstrate effective oversight.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── filters / sort ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Meeting Types</option>
          <option value="Monthly Governance">Monthly Governance</option>
          <option value="Quarterly Strategy">Quarterly Strategy</option>
          <option value="Annual Review">Annual Review</option>
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Most Recent</option>
            <option value="actions">Open Actions</option>
            <option value="type">Meeting Type</option>
          </select>
        </div>
      </div>

      {/* ─── meeting cards ─── */}
      <div className="space-y-4">
        {filtered.map((meeting) => {
          const expanded = expandedId === meeting.id;
          const completionRate = getActionCompletionRate(meeting.actions);
          const hasOverdue = meeting.actions.some((a) => a.status === "overdue" || (a.status !== "completed" && a.deadline < d(0)));

          return (
            <Card key={meeting.id} className={cn("overflow-hidden", hasOverdue && "border-red-200")}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(meeting.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      meeting.meetingType === "Annual Review"
                        ? "bg-amber-100"
                        : meeting.meetingType === "Quarterly Strategy"
                          ? "bg-purple-100"
                          : "bg-blue-100"
                    )}>
                      <ClipboardList className={cn(
                        "h-5 w-5",
                        meeting.meetingType === "Annual Review"
                          ? "text-amber-600"
                          : meeting.meetingType === "Quarterly Strategy"
                            ? "text-purple-600"
                            : "text-blue-600"
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {meeting.meetingType} — {meeting.date}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {meetingTypeBadge(meeting.meetingType)}
                        <span className="text-xs text-muted-foreground">
                          Chaired by {getStaffName(meeting.chair)}
                        </span>
                        {hasOverdue && (
                          <Badge className="bg-red-100 text-red-800 text-xs">Overdue Actions</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className={cn(
                        "text-sm font-medium",
                        completionRate === 100 ? "text-green-700" : completionRate >= 50 ? "text-blue-700" : "text-amber-700"
                      )}>
                        {completionRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">actions done</p>
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-5">
                  {/* attendees */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Attendees
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {meeting.attendees.map((att, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {getStaffName(att)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* agenda */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" /> Agenda
                    </p>
                    <ol className="space-y-1 list-decimal list-inside">
                      {meeting.agendaItems.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{item}</li>
                      ))}
                    </ol>
                  </div>

                  {/* key decisions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Key Decisions
                    </p>
                    <ul className="space-y-1">
                      {meeting.keyDecisions.map((dec, i) => (
                        <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                          <span className="text-blue-400 mt-1.5">•</span> {dec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* actions tracker */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" /> Actions ({meeting.actions.filter((a) => a.status === "completed").length}/{meeting.actions.length} completed)
                    </p>
                    <div className="space-y-2">
                      {meeting.actions.map((action, i) => {
                        const isOverdue = action.status === "overdue" || (action.status !== "completed" && action.deadline < d(0));
                        return (
                          <div
                            key={i}
                            className={cn(
                              "border rounded-md p-2 flex items-center justify-between",
                              isOverdue && "border-red-200 bg-red-50/50"
                            )}
                          >
                            <div>
                              <p className="text-sm">{action.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {getStaffName(action.owner)} · by {action.deadline}
                              </p>
                            </div>
                            {actionStatusBadge(isOverdue ? "overdue" : action.status)}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* children discussed */}
                  {meeting.childrenDiscussed.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Children Discussed</p>
                      <div className="flex flex-wrap gap-1">
                        {meeting.childrenDiscussed.map((yp, i) => (
                          <Badge key={i} className="bg-green-100 text-green-800 text-xs">
                            {getYPName(yp)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* regulatory topics & risk items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                        <Shield className="h-4 w-4" /> Regulatory Topics
                      </p>
                      <ul className="space-y-1">
                        {meeting.regulatoryTopics.map((topic, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-slate-400 mt-1.5">•</span> {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Risk Items
                      </p>
                      <ul className="space-y-1">
                        {meeting.riskItems.map((risk, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-amber-400 mt-1.5">•</span> {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* footer */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Chaired By</p>
                      <p className="text-sm font-medium">{getStaffName(meeting.chair)} (RI)</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Next Meeting
                      </p>
                      <p className="text-sm font-medium">{meeting.nextMeetingDate}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">Regulatory Context</p>
        <p className="text-xs text-slate-600">
          Regulation 45 requires the registered person to review the quality of care provided at least
          every six months and produce a written report. Quality Standard 25 requires that governance
          and accountability arrangements are effective and ensure the home operates in line with its
          Statement of Purpose. Monthly governance meetings between the Responsible Individual and
          Registered Manager demonstrate active oversight, strategic direction, and organisational
          accountability. These records evidence that decisions are scrutinised, actions are tracked,
          and the welfare of children remains central to all governance activity.
        </p>
      </div>
    </PageShell>
  );
}
