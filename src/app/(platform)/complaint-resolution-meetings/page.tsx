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
  MessageCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  Heart,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResolutionMeeting {
  id: string;
  date: string;
  durationMinutes: number;
  complainantType: "Child" | "Parent" | "Social Worker" | "Other Professional" | "Member of Public";
  complainantIdentifier: string;
  originalComplaintRef: string;
  complaintSummary: string;
  meetingType: "Stage 1 - Informal" | "Stage 2 - Formal" | "Stage 3 - External Review" | "Restorative" | "Apology meeting";
  facilitator: string;
  attendeesHome: string[];
  externalAttendees: string[];
  childPresent: boolean;
  childSupportPerson: string;
  meetingFormat: "In person" | "Video call" | "Phone";
  agenda: string[];
  complainantOpening: string;
  homeResponse: string;
  pointsOfAgreement: string[];
  pointsOfDisagreement: string[];
  apologyOffered: boolean;
  apologyAcceptedByComplainant: boolean;
  practiceChangesAgreed: string[];
  followUpActions: { action: string; owner: string; deadline: string; status: "Open" | "In Progress" | "Done" }[];
  resolutionAchieved: boolean;
  complainantSatisfaction: "Satisfied" | "Partially satisfied" | "Not satisfied";
  willEscalate: boolean;
  feedbackOnProcess: string;
  minutedBy: string;
  minutesShared: boolean;
  minutesSharedDate: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: ResolutionMeeting[] = [
  {
    id: "rm-001",
    date: d(-5),
    durationMinutes: 60,
    complainantType: "Parent",
    complainantIdentifier: "Mother of YP (Riverside placement)",
    originalComplaintRef: "C-2026-014",
    complaintSummary: "Concern that scheduled phone calls were missed twice in one week without prior notice.",
    meetingType: "Stage 1 - Informal",
    facilitator: "staff_darren",
    attendeesHome: ["staff_darren", "staff_chervelle"],
    externalAttendees: ["Mother (complainant)", "Tom Richards (Social Worker — observing)"],
    childPresent: false,
    childSupportPerson: "",
    meetingFormat: "In person",
    agenda: [
      "Review of original complaint",
      "Home's account of events",
      "Mother's concerns and impact",
      "Practice review",
      "Agreed actions",
    ],
    complainantOpening: "Mother explained the impact — felt staff did not value her relationship with her child, felt set up to fail when phone calls were missed without explanation. Felt complaints were not always taken seriously.",
    homeResponse: "RM apologised unreservedly. Acknowledged failure on both occasions — once due to staffing change with no handover note, once due to oversight. Confirmed neither was deliberate. Outlined immediate process change (written contact log, dual-staff sign-off).",
    pointsOfAgreement: [
      "Two phone calls had been missed without notification — this was wrong",
      "Mother's relationship with her child should be supported, not jeopardised",
      "Home's process needed strengthening",
      "Mother's complaint had highlighted a real gap",
    ],
    pointsOfDisagreement: [
      "Mother felt earlier informal raising of concern had not been taken seriously — RM acknowledged this and offered apology for that too",
    ],
    apologyOffered: true,
    apologyAcceptedByComplainant: true,
    practiceChangesAgreed: [
      "Written contact log introduced (live, dual sign-off)",
      "Mother to be notified within 30 mins if call cannot proceed",
      "Quarterly review with mother of contact arrangements",
      "Direct phone number for RM if concerns arise",
    ],
    followUpActions: [
      { action: "Implement written contact log", owner: "staff_darren", deadline: d(7), status: "In Progress" },
      { action: "Brief all staff on new contact protocol", owner: "staff_darren", deadline: d(14), status: "Open" },
      { action: "Schedule first quarterly review with mother", owner: "staff_chervelle", deadline: d(90), status: "Open" },
      { action: "Letter of apology with practice changes shared in writing", owner: "staff_darren", deadline: d(7), status: "Open" },
    ],
    resolutionAchieved: true,
    complainantSatisfaction: "Satisfied",
    willEscalate: false,
    feedbackOnProcess: "Mother said she felt heard. Appreciated the apology being unreserved rather than defensive. Trust rebuilt enough to continue working together.",
    minutedBy: "staff_chervelle",
    minutesShared: true,
    minutesSharedDate: d(-3),
  },
  {
    id: "rm-002",
    date: d(-12),
    durationMinutes: 45,
    complainantType: "Child",
    complainantIdentifier: "Young person (anon — recorded with safeguards)",
    originalComplaintRef: "C-2026-009",
    complaintSummary: "Young person felt staff member had spoken sharply to them in front of peers when they were already upset.",
    meetingType: "Restorative",
    facilitator: "staff_darren",
    attendeesHome: ["staff_darren"],
    externalAttendees: ["Young person", "Independent advocate (Coram Voice)"],
    childPresent: true,
    childSupportPerson: "Karen Hughes (Coram Voice advocate)",
    meetingFormat: "In person",
    agenda: [
      "Welcome and check-in (advocate-facilitated)",
      "Young person shares their experience",
      "Staff member reflection (delivered in writing — YP preference)",
      "What would help repair this",
      "Future practice agreement",
    ],
    complainantOpening: "Young person explained how they felt small, embarrassed in front of friends. Felt staff had assumed something they hadn't done. Said they normally felt safe with this staff member which made it more upsetting.",
    homeResponse: "Staff member's written reflection (read by RM): genuine apology, acknowledgement that they had reacted from their own stress, recognition of impact on YP, commitment to learning. RM added: this is a learning moment, not a punishment for staff member or YP. Both matter.",
    pointsOfAgreement: [
      "Staff member acted out of character",
      "YP's feelings were valid and the impact was real",
      "Public correction was the issue, not the underlying concern",
      "Apology was sincere and accepted by YP",
    ],
    pointsOfDisagreement: [
      "None — full agreement reached",
    ],
    apologyOffered: true,
    apologyAcceptedByComplainant: true,
    practiceChangesAgreed: [
      "Staff team refresher: difficult conversations always happen privately",
      "Staff member offered reflective supervision specifically on this incident",
      "YP and staff member to have brief reset conversation when YP is ready",
      "Process learning shared anonymously across team",
    ],
    followUpActions: [
      { action: "Staff team refresher session", owner: "staff_darren", deadline: d(14), status: "In Progress" },
      { action: "Reflective supervision for staff member", owner: "staff_ryan", deadline: d(7), status: "Done" },
      { action: "Reset conversation YP / staff member (when YP ready)", owner: "Karen Hughes (advocate)", deadline: d(21), status: "Done" },
      { action: "Follow-up with YP in 4 weeks", owner: "staff_darren", deadline: d(16), status: "Open" },
    ],
    resolutionAchieved: true,
    complainantSatisfaction: "Satisfied",
    willEscalate: false,
    feedbackOnProcess: "YP said: 'I felt grown-up doing this. Karen was great. I forgave [staff member] and we're back to normal now. I'd raise something again if I had to.'",
    minutedBy: "staff_darren",
    minutesShared: true,
    minutesSharedDate: d(-10),
  },
  {
    id: "rm-003",
    date: d(-25),
    durationMinutes: 90,
    complainantType: "Social Worker",
    complainantIdentifier: "Social Worker — Hillside LA (Casey's allocated SW)",
    originalComplaintRef: "C-2026-005",
    complaintSummary: "Social Worker felt concerns raised in writing about Casey's school transport had not been adequately addressed for 6 weeks.",
    meetingType: "Stage 2 - Formal",
    facilitator: "staff_darren",
    attendeesHome: ["staff_darren", "staff_anna"],
    externalAttendees: ["Lisa Chen (SW)", "Lisa's Team Manager"],
    childPresent: false,
    childSupportPerson: "",
    meetingFormat: "In person",
    agenda: [
      "Chronology of communication",
      "SW's concerns and impact on Casey",
      "Home's reflection",
      "Identification of gaps",
      "Process improvements",
      "Restoration of partnership",
    ],
    complainantOpening: "SW outlined: emails sent on 3 occasions about transport concerns went unanswered for 7-10 days each time. Felt concerns were being deprioritised. Worried about Casey. Felt partnership was strained.",
    homeResponse: "Acknowledged response delays. Explained context (no excuse) — cover periods, email overwhelm. Apologised. Recognised that 'why' didn't change impact. Outlined immediate steps already taken: dedicated SW liaison email checked twice daily, monthly check-in calls with each SW.",
    pointsOfAgreement: [
      "Response times had been unacceptable",
      "Casey's transport situation needed urgent attention (now resolved)",
      "Multi-agency communication is partnership, not optional",
      "Home took action seriously once recognised",
    ],
    pointsOfDisagreement: [
      "SW felt initial RM response had been slightly defensive — RM accepted this feedback",
    ],
    apologyOffered: true,
    apologyAcceptedByComplainant: true,
    practiceChangesAgreed: [
      "Dedicated SW liaison email — twice-daily monitoring",
      "Monthly check-in call with each child's SW",
      "48-hour acknowledgement standard for all SW emails",
      "Quarterly partnership review meeting",
      "Multi-agency communication protocol drafted (linked initiative)",
    ],
    followUpActions: [
      { action: "SW liaison email setup", owner: "staff_darren", deadline: d(-20), status: "Done" },
      { action: "Monthly check-in calls scheduled", owner: "staff_anna", deadline: d(-15), status: "Done" },
      { action: "First quarterly partnership review", owner: "staff_darren", deadline: d(60), status: "Open" },
      { action: "Multi-agency communication protocol", owner: "staff_darren", deadline: d(20), status: "In Progress" },
    ],
    resolutionAchieved: true,
    complainantSatisfaction: "Satisfied",
    willEscalate: false,
    feedbackOnProcess: "SW Team Manager fed back: 'This is exactly the kind of response that builds confidence. Your honesty was disarming.' Working partnership restored.",
    minutedBy: "staff_anna",
    minutesShared: true,
    minutesSharedDate: d(-22),
  },
  {
    id: "rm-004",
    date: d(-2),
    durationMinutes: 30,
    complainantType: "Child",
    complainantIdentifier: "Young person — informal raised at children's meeting",
    originalComplaintRef: "C-2026-018",
    complaintSummary: "Young person felt new shower gel introduced without consultation caused them physical discomfort.",
    meetingType: "Stage 1 - Informal",
    facilitator: "staff_anna",
    attendeesHome: ["staff_anna"],
    externalAttendees: ["Young person"],
    childPresent: true,
    childSupportPerson: "Self-advocating",
    meetingFormat: "In person",
    agenda: [
      "Listen to young person",
      "Understand sensory impact",
      "Agree solution together",
    ],
    complainantOpening: "YP explained the new shower gel had a strong scent that physically hurt — couldn't tolerate it. Felt their previous preference had been overridden without asking.",
    homeResponse: "Anna acknowledged immediately — admitted she had simply ordered what she found in stock without checking. Apologised. Took YP shopping that afternoon to choose own products.",
    pointsOfAgreement: [
      "Anna had not consulted YP — that was the issue",
      "Sensory needs are non-negotiable, not preference",
      "YP knew their needs best",
      "Solution: YP picks own products going forward",
    ],
    pointsOfDisagreement: [
      "None",
    ],
    apologyOffered: true,
    apologyAcceptedByComplainant: true,
    practiceChangesAgreed: [
      "All hygiene products — YP-led choice always",
      "When stock changes, YP must be consulted",
      "Sensory profile preferences flagged on shopping list",
    ],
    followUpActions: [
      { action: "Shopping list template updated", owner: "staff_anna", deadline: d(2), status: "Done" },
      { action: "Sensory profile flag system", owner: "staff_anna", deadline: d(7), status: "Open" },
    ],
    resolutionAchieved: true,
    complainantSatisfaction: "Satisfied",
    willEscalate: false,
    feedbackOnProcess: "YP said: 'I just needed to be asked. Anna got it straight away. I picked good ones now.'",
    minutedBy: "staff_anna",
    minutesShared: false,
    minutesSharedDate: "",
  },
];

const meetingTypeColour: Record<string, string> = {
  "Stage 1 - Informal": "bg-green-100 text-green-800",
  "Stage 2 - Formal": "bg-amber-100 text-amber-800",
  "Stage 3 - External Review": "bg-red-100 text-red-800",
  "Restorative": "bg-purple-100 text-purple-800",
  "Apology meeting": "bg-blue-100 text-blue-800",
};

const satisfactionColour: Record<string, string> = {
  Satisfied: "bg-green-100 text-green-800",
  "Partially satisfied": "bg-amber-100 text-amber-800",
  "Not satisfied": "bg-red-100 text-red-800",
};

const exportCols: ExportColumn<ResolutionMeeting>[] = [
  { header: "Date", accessor: (r: ResolutionMeeting) => r.date },
  { header: "Complainant", accessor: (r: ResolutionMeeting) => `${r.complainantType}` },
  { header: "Meeting Type", accessor: (r: ResolutionMeeting) => r.meetingType },
  { header: "Original Complaint", accessor: (r: ResolutionMeeting) => r.originalComplaintRef },
  { header: "Resolution Achieved", accessor: (r: ResolutionMeeting) => r.resolutionAchieved ? "Yes" : "No" },
  { header: "Satisfaction", accessor: (r: ResolutionMeeting) => r.complainantSatisfaction },
  { header: "Apology Offered", accessor: (r: ResolutionMeeting) => r.apologyOffered ? "Yes" : "No" },
  { header: "Will Escalate", accessor: (r: ResolutionMeeting) => r.willEscalate ? "Yes" : "No" },
  { header: "Facilitator", accessor: (r: ResolutionMeeting) => getStaffName(r.facilitator) },
];

export default function ComplaintResolutionMeetingsPage() {
  const [filterType, setFilterType] = useState("all");
  const [filterSatisfaction, setFilterSatisfaction] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterType !== "all") items = items.filter((m) => m.meetingType === filterType);
    if (filterSatisfaction !== "all") items = items.filter((m) => m.complainantSatisfaction === filterSatisfaction);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "satisfaction":
          const ord = { Satisfied: 0, "Partially satisfied": 1, "Not satisfied": 2 };
          return ord[a.complainantSatisfaction] - ord[b.complainantSatisfaction];
        case "type":
          return a.meetingType.localeCompare(b.meetingType);
        default:
          return 0;
      }
    });
    return items;
  }, [filterType, filterSatisfaction, sortBy]);

  const total = data.length;
  const resolved = data.filter((m) => m.resolutionAchieved).length;
  const satisfied = data.filter((m) => m.complainantSatisfaction === "Satisfied").length;
  const escalating = data.filter((m) => m.willEscalate).length;

  return (
    <PageShell
      title="Complaint Resolution Meetings"
      subtitle="Records of meetings convened to resolve concerns — restorative, transparent, learning-focused"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="complaint-resolution-meetings" />
          <PrintButton title="Complaint Resolution Meetings" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Total Meetings</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{Math.round((resolved / total) * 100)}%</p>
          <p className="text-xs text-muted-foreground">Resolution Rate</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{satisfied}/{total}</p>
          <p className="text-xs text-muted-foreground">Fully Satisfied</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", escalating > 0 ? "text-red-600" : "text-green-600")}>{escalating}</p>
          <p className="text-xs text-muted-foreground">Escalating</p>
        </div>
      </div>

      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">
          We approach complaints restoratively — apology where appropriate, listening always, learning every time.
          A complaint is the start of a better relationship, not a transaction to be closed.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Meeting Types</SelectItem>
            <SelectItem value="Stage 1 - Informal">Stage 1 - Informal</SelectItem>
            <SelectItem value="Stage 2 - Formal">Stage 2 - Formal</SelectItem>
            <SelectItem value="Stage 3 - External Review">Stage 3 - External Review</SelectItem>
            <SelectItem value="Restorative">Restorative</SelectItem>
            <SelectItem value="Apology meeting">Apology Meeting</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSatisfaction} onValueChange={setFilterSatisfaction}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Outcomes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outcomes</SelectItem>
            <SelectItem value="Satisfied">Satisfied</SelectItem>
            <SelectItem value="Partially satisfied">Partially Satisfied</SelectItem>
            <SelectItem value="Not satisfied">Not Satisfied</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="satisfaction">By Outcome</SelectItem>
              <SelectItem value="type">By Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((m) => {
          const isExpanded = expandedId === m.id;

          return (
            <div key={m.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : m.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <MessageCircle className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.complaintSummary}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.date} &middot; {m.complainantType} &middot; Ref: {m.originalComplaintRef} &middot; {m.durationMinutes}min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", meetingTypeColour[m.meetingType])}>
                    {m.meetingType}
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", satisfactionColour[m.complainantSatisfaction])}>
                    {m.complainantSatisfaction}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Meeting Details</p>
                      <p className="text-sm">Format: {m.meetingFormat}</p>
                      <p className="text-sm">Facilitator: {getStaffName(m.facilitator)}</p>
                      <p className="text-sm">Duration: {m.durationMinutes} minutes</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Attendees</p>
                      <p className="text-sm font-medium">Home: {m.attendeesHome.map(getStaffName).join(", ")}</p>
                      <p className="text-sm">External: {m.externalAttendees.join("; ")}</p>
                      {m.childPresent && (
                        <p className="text-xs text-emerald-700 mt-1">Child present (supported by {m.childSupportPerson})</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Complainant Opening</p>
                    <p className="text-sm">{m.complainantOpening}</p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Home Response</p>
                    <p className="text-sm">{m.homeResponse}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">Points of Agreement</p>
                      <ul className="space-y-1">
                        {m.pointsOfAgreement.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Points of Disagreement</p>
                      <ul className="space-y-1">
                        {m.pointsOfDisagreement.length === 0 ? (
                          <li className="text-sm text-muted-foreground">None — full agreement</li>
                        ) : (
                          m.pointsOfDisagreement.map((p, i) => (
                            <li key={i} className="text-sm flex items-start gap-1">
                              <span className="text-amber-600 mt-0.5">•</span>
                              <span>{p}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>

                  {m.apologyOffered && (
                    <div className="bg-purple-50 rounded-lg p-3 flex items-start gap-2">
                      <Heart className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Apology</p>
                        <p className="text-sm">Apology offered &middot; {m.apologyAcceptedByComplainant ? "Accepted by complainant" : "Acknowledged by complainant"}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Practice Changes Agreed</p>
                    <ul className="space-y-1">
                      {m.practiceChangesAgreed.map((c, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <CheckCircle className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Follow-Up Actions</p>
                    <div className="space-y-1">
                      {m.followUpActions.map((a, i) => (
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

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Feedback on Process</p>
                    <p className="text-sm text-emerald-900 italic">&ldquo;{m.feedbackOnProcess}&rdquo;</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Users className="h-3 w-3 inline mr-1" />Minuted: {getStaffName(m.minutedBy)}</span>
                    {m.minutesShared && <span><Clock className="h-3 w-3 inline mr-1" />Minutes shared: {m.minutesSharedDate}</span>}
                    {m.willEscalate && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-medium"><AlertTriangle className="h-3 w-3 inline mr-0.5" />Escalating</span>}
                    {m.resolutionAchieved && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Resolved</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Resolution meetings support Children&apos;s Homes Regulations
          2015 Regulation 39 (complaints), Quality Standard 13 (leadership and management), and the home&apos;s
          restorative practice framework. All meetings are voluntary, child-led where appropriate, and
          minuted with shared transparency. Linked to Complaints Outcomes and Complaints Trend Analysis.
        </p>
      </div>
    </PageShell>
  );
}
