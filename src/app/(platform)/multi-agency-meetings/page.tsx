"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Users,
  Plus,
  ArrowUpDown,
  Search,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type MeetingType = "lac_review" | "pep" | "cin" | "cpp" | "strategy" | "professionals" | "ehcp_annual" | "transition" | "placement" | "disruption";
type MeetingStatus = "scheduled" | "completed" | "cancelled" | "postponed";

interface Attendee {
  name: string;
  role: string;
  organisation: string;
  attended: boolean;
}

interface ActionItem {
  action: string;
  owner: string;
  dueDate: string;
  status: "pending" | "completed" | "overdue";
}

interface Meeting {
  id: string;
  youngPersonId: string;
  type: MeetingType;
  status: MeetingStatus;
  date: string;
  time: string;
  venue: string;
  chairedBy: string;
  homeRepresentative: string;
  attendees: Attendee[];
  keyDiscussionPoints: string[];
  decisionsReached: string[];
  childParticipation: string;
  actions: ActionItem[];
  nextMeetingDate: string | null;
  notes: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: Meeting[] = [
  {
    id: "mm1", youngPersonId: "yp_alex", type: "lac_review",
    status: "completed", date: d(-10), time: "10:00", venue: "Oak House — Lounge",
    chairedBy: "Lisa Morton (IRO)", homeRepresentative: "staff_darren",
    attendees: [
      { name: "Lisa Morton", role: "IRO", organisation: "Manchester CC", attended: true },
      { name: "Darren Laville", role: "Registered Manager", organisation: "Oak House", attended: true },
      { name: "Anna Kowalski", role: "Key Worker", organisation: "Oak House", attended: true },
      { name: "Sarah Hughes", role: "Social Worker", organisation: "Manchester CC", attended: true },
      { name: "Alex Thompson", role: "Young Person", organisation: "—", attended: true },
      { name: "Michelle Thompson", role: "Mother", organisation: "—", attended: false },
      { name: "Dr Patel", role: "CAMHS Clinician", organisation: "Pennine Care", attended: true },
    ],
    keyDiscussionPoints: [
      "Alex's progress in placement — stable and settled. Good relationships with staff.",
      "Education — attending college regularly. Working towards Level 1 qualification.",
      "Contact with mother — sporadic. Michelle did not attend review. SW to follow up.",
      "Mental health — CAMHS sessions continuing fortnightly. Good engagement reported.",
      "Independence skills — developing well. Cooking and travel progressing.",
      "Care plan reviewed — remains appropriate. No changes to legal status.",
    ],
    decisionsReached: [
      "Placement continues — meeting Alex's needs well.",
      "SW to contact mother re: engagement and contact arrangements.",
      "CAMHS to continue fortnightly — review in 3 months.",
      "Key worker to increase independence skills focus ahead of pathway plan.",
      "Alex's views recorded — happy in placement, wants more contact with mum.",
    ],
    childParticipation: "Alex attended the full meeting and contributed throughout. He prepared a written piece about his time at Oak House which was read out. He spoke confidently about his college course and his goals. Alex said he feels safe and happy but wishes his mum would visit more often.",
    actions: [
      { action: "SW to contact Michelle Thompson re: contact plan", owner: "Sarah Hughes (SW)", dueDate: d(4), status: "pending" },
      { action: "Key worker to develop independence skills action plan", owner: "Anna Kowalski", dueDate: d(14), status: "pending" },
      { action: "CAMHS review at 3 months", owner: "Dr Patel", dueDate: d(80), status: "pending" },
      { action: "Update care plan to reflect review outcomes", owner: "Darren Laville", dueDate: d(7), status: "completed" },
    ],
    nextMeetingDate: d(170),
    notes: "Positive review overall. IRO satisfied with quality of care. Alex's participation was excellent — IRO commended the home for supporting his voice.",
  },
  {
    id: "mm2", youngPersonId: "yp_jordan", type: "pep",
    status: "completed", date: d(-5), time: "14:00", venue: "Riverside Academy",
    chairedBy: "Mark Collins (Virtual School)", homeRepresentative: "staff_ryan",
    attendees: [
      { name: "Mark Collins", role: "Virtual School Head", organisation: "Manchester VS", attended: true },
      { name: "Ryan Mitchell", role: "Deputy Manager", organisation: "Oak House", attended: true },
      { name: "Jordan Rivera", role: "Young Person", organisation: "—", attended: true },
      { name: "Mrs Akhtar", role: "SENCo", organisation: "Riverside Academy", attended: true },
      { name: "Mr Bennett", role: "Form Tutor", organisation: "Riverside Academy", attended: true },
      { name: "David Osei", role: "Social Worker", organisation: "Salford CC", attended: false },
    ],
    keyDiscussionPoints: [
      "Attendance — 78% this term. Several instances of lateness. Home and school to coordinate morning routine.",
      "Pupil Premium Plus — £2,530 allocated. Used for 1:1 tutor and emotional literacy support.",
      "Academic progress — below expected in Maths and English. Science improving with tutor support.",
      "SEMH needs — anxiety affecting classroom participation. Quiet space card being used effectively.",
      "Friendships — Jordan has formed one good friendship. Still isolated at break times.",
    ],
    decisionsReached: [
      "1:1 tutor to continue — Monday and Wednesday mornings.",
      "Home to support morning routine — agreed wake-up protocol.",
      "School to provide homework pack on Fridays for weekend completion with staff support.",
      "Break time — Jordan to be offered structured lunchtime club (coding) to reduce isolation.",
      "SW absence noted — RM to raise with team manager.",
    ],
    childParticipation: "Jordan attended for the first 20 minutes and shared views using a pre-prepared feelings card. Jordan said school is 'okay' but mornings are hard. Likes science and the coding club idea. Left the meeting to return to class.",
    actions: [
      { action: "Home to implement structured morning routine by Monday", owner: "Ryan Mitchell", dueDate: d(2), status: "completed" },
      { action: "School to confirm coding club start date", owner: "Mrs Akhtar", dueDate: d(10), status: "pending" },
      { action: "RM to contact SW team manager re: PEP absence", owner: "Darren Laville", dueDate: d(3), status: "completed" },
      { action: "PP+ spend review at mid-term", owner: "Mark Collins", dueDate: d(45), status: "pending" },
    ],
    nextMeetingDate: d(85),
    notes: "Productive PEP. School engaged and supportive. SW absence is concerning — 3rd meeting missed. Virtual School Head shares concern. Positive that Jordan's attendance is improving from last term (was 62%).",
  },
  {
    id: "mm3", youngPersonId: "yp_casey", type: "transition",
    status: "scheduled", date: d(7), time: "11:00", venue: "Oak House — Office",
    chairedBy: "Karen Wright (PA)", homeRepresentative: "staff_darren",
    attendees: [
      { name: "Karen Wright", role: "Personal Adviser", organisation: "Manchester Leaving Care", attended: false },
      { name: "Darren Laville", role: "Registered Manager", organisation: "Oak House", attended: false },
      { name: "Casey Morgan", role: "Young Person", organisation: "—", attended: false },
      { name: "Jade Morris", role: "Social Worker", organisation: "Manchester CC", attended: false },
      { name: "Tom Harris", role: "Housing Officer", organisation: "Manchester Housing", attended: false },
    ],
    keyDiscussionPoints: [],
    decisionsReached: [],
    childParticipation: "",
    actions: [],
    nextMeetingDate: null,
    notes: "Transition planning meeting ahead of Casey's move to semi-independence. Agenda: housing options, financial readiness assessment, support package, timeline.",
  },
  {
    id: "mm4", youngPersonId: "yp_jordan", type: "strategy",
    status: "completed", date: d(-30), time: "09:00", venue: "Virtual (Teams)",
    chairedBy: "DI Rachel Singh (Police)", homeRepresentative: "staff_darren",
    attendees: [
      { name: "DI Rachel Singh", role: "Detective Inspector", organisation: "GMP", attended: true },
      { name: "Darren Laville", role: "Registered Manager", organisation: "Oak House", attended: true },
      { name: "David Osei", role: "Social Worker", organisation: "Salford CC", attended: true },
      { name: "Claire Barnett", role: "MASH Manager", organisation: "Salford MASH", attended: true },
      { name: "Dr Ahmed", role: "Paediatrician", organisation: "Royal Manchester Children's", attended: true },
    ],
    keyDiscussionPoints: [
      "Concern raised following Jordan's disclosure about experience prior to placement.",
      "Police investigation ongoing — ABE interview completed.",
      "Jordan's welfare and safety in current placement confirmed.",
      "Therapeutic support to be considered — timing discussed with CAMHS.",
      "Information sharing protocol agreed between agencies.",
    ],
    decisionsReached: [
      "Section 47 enquiry concluded — Jordan safe in current placement.",
      "Police investigation continues — no further action needed from home at this stage.",
      "CAMHS referral to be made when police confirm timing is appropriate.",
      "Home to continue current support plan — additional key work sessions.",
      "Information about investigation must not be discussed with Jordan unless led by ABE team.",
    ],
    childParticipation: "Jordan did not attend this meeting — not appropriate given the nature of the strategy discussion. Jordan's wishes and feelings were represented by SW from previous discussions.",
    actions: [
      { action: "CAMHS referral when police confirm timing", owner: "David Osei (SW)", dueDate: d(-10), status: "completed" },
      { action: "Home to maintain normal routine and additional key work", owner: "Darren Laville", dueDate: d(-25), status: "completed" },
      { action: "Police to update home on investigation progress monthly", owner: "DI Singh", dueDate: d(0), status: "pending" },
    ],
    nextMeetingDate: null,
    notes: "Sensitive strategy meeting. All agencies aligned. Jordan's safety confirmed. Important that home maintains normality and does not inadvertently contaminate evidence by discussing the investigation with Jordan.",
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const TYPE_LABELS: Record<MeetingType, string> = {
  lac_review: "LAC Review", pep: "PEP", cin: "CIN Meeting", cpp: "Child Protection Conference",
  strategy: "Strategy Meeting", professionals: "Professionals Meeting", ehcp_annual: "EHCP Annual Review",
  transition: "Transition Planning", placement: "Placement Meeting", disruption: "Disruption Meeting",
};

const STATUS_META: Record<MeetingStatus, { label: string; colour: string }> = {
  scheduled:  { label: "Scheduled",  colour: "bg-blue-100 text-blue-700" },
  completed:  { label: "Completed",  colour: "bg-green-100 text-green-700" },
  cancelled:  { label: "Cancelled",  colour: "bg-red-100 text-red-700" },
  postponed:  { label: "Postponed",  colour: "bg-amber-100 text-amber-700" },
};

const ACTION_COLOUR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700", completed: "bg-green-100 text-green-700", overdue: "bg-red-100 text-red-700",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function MultiAgencyMeetingsPage() {
  const [data] = useState<Meeting[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  const stats = useMemo(() => {
    const allActions = data.flatMap((m) => m.actions);
    return {
      total: data.length,
      upcoming: data.filter((m) => m.status === "scheduled").length,
      completed: data.filter((m) => m.status === "completed").length,
      pendingActions: allActions.filter((a) => a.status === "pending").length,
      overdueActions: allActions.filter((a) => a.status === "overdue").length,
    };
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterType !== "all") list = list.filter((m) => m.type === filterType);
    if (filterYP !== "all") list = list.filter((m) => m.youngPersonId === filterYP);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((m) => TYPE_LABELS[m.type].toLowerCase().includes(q) || m.chairedBy.toLowerCase().includes(q) || m.notes.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "type": return TYPE_LABELS[a.type].localeCompare(TYPE_LABELS[b.type]);
        case "yp":   return a.youngPersonId.localeCompare(b.youngPersonId);
        default:     return b.date.localeCompare(a.date);
      }
    });
    return list;
  }, [data, filterType, filterYP, search, sortBy]);

  const exportData = useMemo(() => data.map((m) => ({
    youngPerson: getYPName(m.youngPersonId),
    type: TYPE_LABELS[m.type],
    status: STATUS_META[m.status].label,
    date: m.date,
    time: m.time,
    venue: m.venue,
    chairedBy: m.chairedBy,
    homeRep: getStaffName(m.homeRepresentative),
    attendeeCount: m.attendees.filter((a) => a.attended).length + "/" + m.attendees.length,
    decisions: m.decisionsReached.join("; "),
    childParticipation: m.childParticipation,
    pendingActions: m.actions.filter((a) => a.status === "pending").length,
    nextMeeting: m.nextMeetingDate || "TBC",
    notes: m.notes,
  })), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Young Person",     accessor: (r: typeof exportData[number]) => r.youngPerson },
    { header: "Meeting Type",     accessor: (r: typeof exportData[number]) => r.type },
    { header: "Status",           accessor: (r: typeof exportData[number]) => r.status },
    { header: "Date",             accessor: (r: typeof exportData[number]) => r.date },
    { header: "Time",             accessor: (r: typeof exportData[number]) => r.time },
    { header: "Venue",            accessor: (r: typeof exportData[number]) => r.venue },
    { header: "Chaired By",       accessor: (r: typeof exportData[number]) => r.chairedBy },
    { header: "Home Rep",         accessor: (r: typeof exportData[number]) => r.homeRep },
    { header: "Attendance",       accessor: (r: typeof exportData[number]) => r.attendeeCount },
    { header: "Decisions",        accessor: (r: typeof exportData[number]) => r.decisions },
    { header: "Child Participation", accessor: (r: typeof exportData[number]) => r.childParticipation },
    { header: "Pending Actions",  accessor: (r: typeof exportData[number]) => String(r.pendingActions) },
    { header: "Next Meeting",     accessor: (r: typeof exportData[number]) => r.nextMeeting },
    { header: "Notes",            accessor: (r: typeof exportData[number]) => r.notes },
  ];

  const ypIds = [...new Set(data.map((m) => m.youngPersonId))];

  return (
    <PageShell
      title="Multi-Agency Meetings"
      subtitle="LAC reviews, PEPs, strategy meetings, CIN/CPP conferences and professionals meetings"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="multi-agency-meetings" />
          <PrintButton title="Multi-Agency Meetings" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> New Meeting
          </button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total Meetings",  v: stats.total, icon: Users, c: "text-blue-600" },
            { l: "Upcoming",        v: stats.upcoming, icon: Calendar, c: "text-purple-600" },
            { l: "Completed",       v: stats.completed, icon: CheckCircle2, c: "text-green-600" },
            { l: "Pending Actions", v: stats.pendingActions, icon: Clock, c: "text-amber-600" },
            { l: "Overdue Actions", v: stats.overdueActions, icon: AlertTriangle, c: stats.overdueActions > 0 ? "text-red-600" : "text-gray-400" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search meetings…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Meeting Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Young Person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {ypIds.map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="date">Date</option>
              <option value="type">Meeting Type</option>
              <option value="yp">Young Person</option>
            </select>
          </div>
        </div>

        {filtered.map((meeting) => (
          <div key={meeting.id} className="rounded-lg border bg-white overflow-hidden">
            <button onClick={() => setExpanded(expanded === meeting.id ? null : meeting.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{TYPE_LABELS[meeting.type]}</h3>
                    <span className="text-sm text-muted-foreground">— {getYPName(meeting.youngPersonId)}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[meeting.status].colour)}>{STATUS_META[meeting.status].label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{meeting.date} at {meeting.time} · {meeting.venue} · Chaired by {meeting.chairedBy}</p>
                </div>
              </div>
              {expanded === meeting.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === meeting.id && (
              <div className="border-t p-4 space-y-4">
                {/* attendance */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Attendance ({meeting.attendees.filter((a) => a.attended).length}/{meeting.attendees.length})</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="pb-2 pr-3">Name</th>
                          <th className="pb-2 pr-3">Role</th>
                          <th className="pb-2 pr-3">Organisation</th>
                          <th className="pb-2">Attended</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meeting.attendees.map((a, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-1.5 pr-3 font-medium">{a.name}</td>
                            <td className="py-1.5 pr-3">{a.role}</td>
                            <td className="py-1.5 pr-3 text-muted-foreground">{a.organisation}</td>
                            <td className="py-1.5">{a.attended ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <span className="text-red-500 text-xs">Absent</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {meeting.keyDiscussionPoints.length > 0 && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <h4 className="text-sm font-semibold mb-2">Key Discussion Points</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">{meeting.keyDiscussionPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
                  </div>
                )}

                {meeting.decisionsReached.length > 0 && (
                  <div className="rounded-lg bg-blue-50 p-3">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">Decisions Reached</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-900">{meeting.decisionsReached.map((d, i) => <li key={i}>{d}</li>)}</ol>
                  </div>
                )}

                {meeting.childParticipation && (
                  <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                    <h4 className="text-sm font-semibold text-pink-800 mb-1">Child Participation</h4>
                    <p className="text-sm text-pink-900">{meeting.childParticipation}</p>
                  </div>
                )}

                {meeting.actions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Action Items</h4>
                    <div className="space-y-2">
                      {meeting.actions.map((a, i) => (
                        <div key={i} className="rounded border p-2 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm">{a.action}</p>
                            <p className="text-xs text-muted-foreground">{a.owner} · Due {a.dueDate}</p>
                          </div>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", ACTION_COLOUR[a.status])}>{a.status.charAt(0).toUpperCase() + a.status.slice(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {meeting.nextMeetingDate && (
                  <p className="text-sm"><span className="text-muted-foreground">Next meeting:</span> {meeting.nextMeetingDate}</p>
                )}

                {meeting.notes && (
                  <div className="rounded-lg bg-gray-50 border p-3">
                    <h4 className="text-sm font-semibold mb-1">RM Notes</h4>
                    <p className="text-sm text-muted-foreground">{meeting.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Reg 5 / IRO Handbook / SEND Code of Practice</strong> — The home must support the child&apos;s care plan including attendance at LAC reviews, PEP meetings, and all multi-agency forums. The child&apos;s participation in these meetings must be facilitated and recorded.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Multi-Agency Meeting</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <select className="rounded border px-3 py-2 text-sm"><option value="">Young Person…</option>{ypIds.map((id) => <option key={id} value={id}>{getYPName(id)}</option>)}</select>
            <select className="rounded border px-3 py-2 text-sm"><option value="">Meeting type…</option>{Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" className="rounded border px-3 py-2 text-sm" />
              <input type="time" className="rounded border px-3 py-2 text-sm" />
            </div>
            <input placeholder="Venue" className="rounded border px-3 py-2 text-sm" />
            <input placeholder="Chaired by" className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Notes / agenda" rows={3} className="rounded border px-3 py-2 text-sm" />
          </div>
          <DialogFooter>
            <button onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => setShowDialog(false)} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">Create Meeting</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
