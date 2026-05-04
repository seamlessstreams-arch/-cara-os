"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Users,
  Star,
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

type MeetingType = "regular" | "ad_hoc" | "special_request" | "welcome" | "goodbye";

interface AgendaItem {
  topic: string;
  raisedBy: string; // YP name or "staff"
  discussion: string;
  outcome: string;
  actionNeeded: boolean;
}

interface ActionItem {
  id: string;
  action: string;
  owner: string; // staff or YP
  dueDate: string;
  status: "pending" | "in_progress" | "completed" | "carried_forward";
  completedDate: string | null;
  notes: string;
}

interface ChildrensMeeting {
  id: string;
  date: string;
  type: MeetingType;
  facilitatedBy: string;
  staffPresent: string[];
  ypPresent: string[];
  ypAbsent: string[];
  absentReasons: Record<string, string>;
  agenda: AgendaItem[];
  actions: ActionItem[];
  childChair: string | null; // YP who chaired
  childMinuteTaker: string | null;
  mealOrSnack: string;
  overallMood: "positive" | "mixed" | "difficult";
  complaintsRaised: boolean;
  complaintsDetails: string;
  suggestionsBox: string[];
  nextMeetingDate: string;
  notes: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const TYPE_LABELS: Record<MeetingType, string> = {
  regular: "Regular", ad_hoc: "Ad Hoc", special_request: "Special Request",
  welcome: "Welcome Meeting", goodbye: "Goodbye Meeting",
};

const MOOD_LABELS: Record<string, string> = { positive: "Positive", mixed: "Mixed", difficult: "Difficult" };
const MOOD_COLOURS: Record<string, string> = {
  positive: "bg-green-100 text-green-800", mixed: "bg-amber-100 text-amber-800",
  difficult: "bg-red-100 text-red-800",
};

const ACTION_COLOURS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700", in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800", carried_forward: "bg-amber-100 text-amber-800",
};

const SEED: ChildrensMeeting[] = [
  {
    id: "cm1", date: d(-7), type: "regular",
    facilitatedBy: "staff_anna", staffPresent: ["staff_anna", "staff_edward"],
    ypPresent: ["yp_alex", "yp_casey"], ypAbsent: ["yp_jordan"],
    absentReasons: { yp_jordan: "Felt too anxious to attend — written views submitted via art" },
    childChair: "yp_alex", childMinuteTaker: null,
    mealOrSnack: "Pizza and garlic bread (chosen by children last meeting)",
    overallMood: "positive",
    agenda: [
      { topic: "Menu for next two weeks", raisedBy: "yp_casey", discussion: "Casey asked for more pasta dishes. Alex suggested taco Tuesday. Both agreed they want more input on weekend meals.", outcome: "Staff to create a weekend meal planning rota — each child picks one meal per weekend.", actionNeeded: true },
      { topic: "Garden — request for a basketball hoop", raisedBy: "yp_alex", discussion: "Alex would like a basketball hoop in the garden. Casey agreed. Jordan submitted artwork of the garden with a hoop included (very positive). Staff confirmed budget may be available.", outcome: "Staff to look into costs and suitable options. Children to choose together from shortlist.", actionNeeded: true },
      { topic: "Wifi speed", raisedBy: "yp_alex", discussion: "Alex says wifi is slow in the evening. Affects gaming and homework. Staff acknowledged — IT to be contacted.", outcome: "Darren to contact broadband provider about upgrading. Interim: gaming downloads to happen during school hours.", actionNeeded: true },
      { topic: "Bedtime routine — relaxation options", raisedBy: "Staff", discussion: "Staff suggested a chill-out hour before bed with options: reading, colouring, music, calm games. Children responded positively. Casey asked for 'warm milk and biscuits' as part of routine.", outcome: "Trial chill-out hour from next week. Warm drinks and light snack available. Evaluate after 2 weeks.", actionNeeded: true },
      { topic: "Any complaints or worries", raisedBy: "Staff", discussion: "Neither child raised complaints. Casey said 'everything's good.' Alex said 'it's alright here.' Jordan's artwork included a smiley face in the house — interpreted positively.", outcome: "No complaints. Positive feedback noted.", actionNeeded: false },
    ],
    actions: [
      { id: "a1", action: "Create weekend meal planning rota for children", owner: "staff_anna", dueDate: d(-3), status: "completed", completedDate: d(-4), notes: "Rota template created. First weekend choices being taken this Friday." },
      { id: "a2", action: "Research basketball hoops — get 3 options with prices", owner: "staff_edward", dueDate: d(3), status: "in_progress", completedDate: null, notes: "Found 2 options so far. Looking at freestanding vs wall-mounted." },
      { id: "a3", action: "Contact broadband provider about speed upgrade", owner: "staff_darren", dueDate: d(0), status: "completed", completedDate: d(-2), notes: "Engineer visit booked for Thursday. Free upgrade available." },
      { id: "a4", action: "Set up chill-out hour supplies — books, colouring, calm games", owner: "staff_anna", dueDate: d(-5), status: "completed", completedDate: d(-5), notes: "Supplies in place. Trial started Monday." },
    ],
    complaintsRaised: false, complaintsDetails: "",
    suggestionsBox: [
      "Can we get a Netflix account? (Alex)",
      "Movie night on Fridays please (Casey)",
      "More art supplies — clay and watercolours (Jordan — written submission)",
    ],
    nextMeetingDate: d(7),
    notes: "Excellent meeting. Alex chaired confidently — gave Casey time to speak. Jordan's written/art contributions valued and shared. All children engaged. Continue encouraging Jordan to attend — no pressure.",
  },
  {
    id: "cm2", date: d(-21), type: "regular",
    facilitatedBy: "staff_chervelle", staffPresent: ["staff_chervelle", "staff_anna"],
    ypPresent: ["yp_alex", "yp_jordan", "yp_casey"], ypAbsent: [],
    absentReasons: {},
    childChair: null, childMinuteTaker: "yp_casey",
    mealOrSnack: "Nachos with dips (chosen by Jordan)",
    overallMood: "mixed",
    agenda: [
      { topic: "Noise levels in the evening", raisedBy: "yp_jordan", discussion: "Jordan said the house gets too noisy after school. Finds it hard to relax. Alex acknowledged they can be loud. Casey said they'll try to be quieter. Staff discussed creating 'quiet zones.'", outcome: "Reading nook in lounge designated as quiet zone (no devices, no talking). Jordan to have priority. Trial for 2 weeks.", actionNeeded: true },
      { topic: "Christmas trip — where should we go?", raisedBy: "Staff", discussion: "Staff asked children where they'd like to go for the annual trip. Alex: bowling and pizza. Jordan: aquarium (less noisy). Casey: theme park. Long discussion about compromise.", outcome: "Agreed: Day trip to aquarium + indoor bowling on the way home. Everyone happy with compromise.", actionNeeded: true },
      { topic: "Missing items from shared areas", raisedBy: "yp_casey", discussion: "Casey said the TV remote keeps going missing. Also shared colouring pencils not being returned. Discussion about shared responsibility.", outcome: "Remote to have a 'home' spot (basket on TV unit). Shared art supplies box with sign-out sheet.", actionNeeded: true },
      { topic: "Pocket money day change request", raisedBy: "yp_alex", discussion: "Alex asked if pocket money could move from Tuesday to Friday so they can spend at the weekend. Others agreed.", outcome: "Staff to check with RM. If possible, trial moving to Friday.", actionNeeded: true },
    ],
    actions: [
      { id: "a5", action: "Set up quiet zone in lounge reading nook", owner: "staff_chervelle", dueDate: d(-18), status: "completed", completedDate: d(-19), notes: "Cushions and 'quiet zone' sign in place. Children helped design the sign." },
      { id: "a6", action: "Book aquarium + bowling for Christmas trip", owner: "staff_anna", dueDate: d(-10), status: "completed", completedDate: d(-14), notes: "Booked for 20 Dec. Aquarium 10am, bowling 2pm. Transport arranged." },
      { id: "a7", action: "Create remote control 'home' basket and art sign-out sheet", owner: "staff_chervelle", dueDate: d(-18), status: "completed", completedDate: d(-18), notes: "Working well — no further complaints." },
      { id: "a8", action: "Check pocket money day change with RM", owner: "staff_anna", dueDate: d(-14), status: "completed", completedDate: d(-15), notes: "Approved. Moving to Friday from next week." },
    ],
    complaintsRaised: false, complaintsDetails: "",
    suggestionsBox: [
      "Can we have a pet? A hamster maybe? (Casey)",
      "More choice about what we watch on TV — voting system (Alex)",
    ],
    nextMeetingDate: d(-7),
    notes: "Jordan attended for the full meeting — significant progress. Was quiet initially but spoke up about noise. Casey took minutes with support from Chervelle. All actions from previous meeting reviewed — good follow-through builds trust.",
  },
  {
    id: "cm3", date: d(-35), type: "welcome",
    facilitatedBy: "staff_darren", staffPresent: ["staff_darren", "staff_anna", "staff_edward"],
    ypPresent: ["yp_alex", "yp_jordan", "yp_casey"], ypAbsent: [],
    absentReasons: {},
    childChair: null, childMinuteTaker: null,
    mealOrSnack: "Cake and juice (Casey chose the cake — chocolate)",
    overallMood: "positive",
    agenda: [
      { topic: "Welcome Casey to Oak House", raisedBy: "Staff", discussion: "Staff introduced Casey to the meeting format. Alex and Jordan welcomed Casey. Alex showed Casey around the building after the meeting. Jordan gave Casey an artwork as a welcome gift.", outcome: "Casey felt welcomed. Buddy system agreed — Alex to be Casey's buddy for the first 2 weeks.", actionNeeded: true },
      { topic: "House rules review — making sure Casey knows them", raisedBy: "Staff", discussion: "Went through house agreement together. Casey was asked if they had any questions. Alex explained rules from a child's perspective — very helpful. Casey asked about wifi password and phone times.", outcome: "Casey given welcome pack. Wifi info shared. Phone agreement to be completed with key worker.", actionNeeded: true },
      { topic: "Casey's room — any preferences?", raisedBy: "Staff", discussion: "Casey was asked what they'd like in their room. Requested fairy lights, a bookshelf, and a soft rug. Said favourite colour is purple.", outcome: "Staff to source requested items. Casey to choose bedding from options.", actionNeeded: true },
    ],
    actions: [
      { id: "a9", action: "Alex buddy check-ins with Casey — daily for 2 weeks", owner: "yp_alex", dueDate: d(-21), status: "completed", completedDate: d(-22), notes: "Alex was brilliant. Casey settled quickly." },
      { id: "a10", action: "Complete phone agreement with Casey", owner: "staff_anna", dueDate: d(-32), status: "completed", completedDate: d(-33), notes: "Completed. Age-appropriate limits agreed." },
      { id: "a11", action: "Source fairy lights, bookshelf, and purple rug for Casey's room", owner: "staff_anna", dueDate: d(-28), status: "completed", completedDate: d(-30), notes: "All items in place. Casey very happy. Room looks great." },
    ],
    complaintsRaised: false, complaintsDetails: "",
    suggestionsBox: [],
    nextMeetingDate: d(-21),
    notes: "Lovely welcome meeting. Alex and Jordan were genuinely welcoming. Casey was shy but engaged. The peer buddy system worked brilliantly — continue for future admissions.",
  },
];

/* ── flat row for export ─────────────────────────────────────────────── */

interface FlatRow {
  date: string; type: string; facilitatedBy: string; ypPresent: string;
  ypAbsent: string; agendaTopics: string; actionsCount: string;
  actionsCompleted: string; mood: string; complaints: string;
  suggestions: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Date",              accessor: (r: FlatRow) => r.date },
  { header: "Type",              accessor: (r: FlatRow) => r.type },
  { header: "Facilitated By",    accessor: (r: FlatRow) => r.facilitatedBy },
  { header: "YP Present",        accessor: (r: FlatRow) => r.ypPresent },
  { header: "YP Absent",         accessor: (r: FlatRow) => r.ypAbsent },
  { header: "Agenda Topics",     accessor: (r: FlatRow) => r.agendaTopics },
  { header: "Actions",           accessor: (r: FlatRow) => r.actionsCount },
  { header: "Completed",         accessor: (r: FlatRow) => r.actionsCompleted },
  { header: "Mood",              accessor: (r: FlatRow) => r.mood },
  { header: "Complaints",        accessor: (r: FlatRow) => r.complaints },
  { header: "Suggestions",       accessor: (r: FlatRow) => r.suggestions },
  { header: "Notes",             accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function ChildrensMeetingsPage() {
  const [data] = useState<ChildrensMeeting[]>(SEED);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const total = data.length;
    const totalActions = data.reduce((s, m) => s + m.actions.length, 0);
    const completedActions = data.reduce((s, m) => s + m.actions.filter((a) => a.status === "completed").length, 0);
    const pendingActions = totalActions - completedActions;
    return { total, totalActions, completedActions, pendingActions };
  }, [data]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        m.agenda.some((a) => a.topic.toLowerCase().includes(q)) ||
        m.suggestionsBox.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filterType !== "all") list = list.filter((m) => m.type === filterType);
    const out = [...list];
    switch (sortBy) {
      case "date": out.sort((a, b) => b.date.localeCompare(a.date)); break;
      case "type": out.sort((a, b) => a.type.localeCompare(b.type)); break;
    }
    return out;
  }, [data, search, filterType, sortBy]);

  /* ── export ───────────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(() =>
    data.map((m) => ({
      date: m.date,
      type: TYPE_LABELS[m.type],
      facilitatedBy: getStaffName(m.facilitatedBy),
      ypPresent: m.ypPresent.map(getYPName).join(", "),
      ypAbsent: m.ypAbsent.length ? m.ypAbsent.map(getYPName).join(", ") : "None",
      agendaTopics: m.agenda.map((a) => a.topic).join("; "),
      actionsCount: `${m.actions.length}`,
      actionsCompleted: `${m.actions.filter((a) => a.status === "completed").length}/${m.actions.length}`,
      mood: MOOD_LABELS[m.overallMood],
      complaints: m.complaintsRaised ? m.complaintsDetails : "None",
      suggestions: m.suggestionsBox.join("; "),
      notes: m.notes,
    })), [data]);

  return (
    <PageShell
      title="Children's Meetings"
      subtitle="Child-led meetings — giving children a voice in how the home is run"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Children's Meetings" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="childrens-meetings" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Meeting
          </button>
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Meetings Held", value: stats.total, icon: MessageCircle, colour: "text-blue-600" },
          { label: "Total Actions", value: stats.totalActions, icon: CheckCircle2, colour: "text-green-600" },
          { label: "Actions Completed", value: stats.completedActions, icon: Star, colour: "text-emerald-600" },
          { label: "Actions Pending", value: stats.pendingActions, icon: AlertTriangle, colour: stats.pendingActions > 0 ? "text-amber-600" : "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── next meeting ───────────────────────────────────────────── */}
      {data[0]?.nextMeetingDate && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4">
          <Users className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-800">Next Meeting: {data[0].nextMeetingDate}</p>
            <p className="text-sm text-blue-700">Suggestions box items to discuss: {data[0].suggestionsBox.length > 0 ? data[0].suggestionsBox.length : "none yet"}. Encourage children to add items during the week.</p>
          </div>
        </div>
      )}

      {/* ── filters ────────────────────────────────────────────────── */}
      <div id="meetings-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search topics or suggestions…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((m) => {
          const open = expanded[m.id] ?? false;
          const completedActs = m.actions.filter((a) => a.status === "completed").length;
          return (
            <div key={m.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(m.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <MessageCircle className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{TYPE_LABELS[m.type]} Meeting — {m.date}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", MOOD_COLOURS[m.overallMood])}>{MOOD_LABELS[m.overallMood]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{m.agenda.length} agenda items · {completedActs}/{m.actions.length} actions complete · {m.ypPresent.length} children present</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* meeting details */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Facilitated:</span> <span className="font-medium">{getStaffName(m.facilitatedBy)}</span></div>
                    <div><span className="text-gray-500">Staff:</span> <span className="font-medium">{m.staffPresent.map(getStaffName).join(", ")}</span></div>
                    {m.childChair && <div><span className="text-gray-500">Chair:</span> <span className="font-medium">{getYPName(m.childChair)} ⭐</span></div>}
                    {m.childMinuteTaker && <div><span className="text-gray-500">Minutes:</span> <span className="font-medium">{getYPName(m.childMinuteTaker)}</span></div>}
                    <div><span className="text-gray-500">Snack:</span> <span className="font-medium">{m.mealOrSnack}</span></div>
                  </div>

                  {/* attendance */}
                  <div className="flex flex-wrap gap-2">
                    {m.ypPresent.map((yp) => (
                      <span key={yp} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">✓ {getYPName(yp)}</span>
                    ))}
                    {m.ypAbsent.map((yp) => (
                      <span key={yp} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium" title={m.absentReasons[yp] ?? ""}>
                        ○ {getYPName(yp)} {m.absentReasons[yp] ? `(${m.absentReasons[yp]})` : ""}
                      </span>
                    ))}
                  </div>

                  {/* agenda items */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Agenda &amp; Discussions</h4>
                    <div className="space-y-3">
                      {m.agenda.map((a, i) => (
                        <div key={i} className="rounded-md border p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{a.topic}</span>
                            <span className="text-xs text-gray-400">raised by {a.raisedBy === "Staff" ? "Staff" : a.raisedBy}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-1">{a.discussion}</p>
                          <p className="text-xs text-gray-600"><span className="font-medium">Outcome:</span> {a.outcome}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* actions */}
                  {m.actions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-2">Actions</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-gray-500 border-b">
                              <th className="py-2 pr-3">Action</th>
                              <th className="py-2 pr-3">Owner</th>
                              <th className="py-2 pr-3">Due</th>
                              <th className="py-2 pr-3">Status</th>
                              <th className="py-2">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {m.actions.map((a) => (
                              <tr key={a.id} className="border-b last:border-0">
                                <td className="py-2 pr-3">{a.action}</td>
                                <td className="py-2 pr-3">{a.owner.startsWith("yp_") ? getYPName(a.owner) : getStaffName(a.owner)}</td>
                                <td className="py-2 pr-3">{a.dueDate}</td>
                                <td className="py-2 pr-3">
                                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", ACTION_COLOURS[a.status])}>
                                    {a.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                  </span>
                                </td>
                                <td className="py-2 text-xs text-gray-500">{a.notes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* suggestions box */}
                  {m.suggestionsBox.length > 0 && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Suggestions Box</h4>
                      <ul className="list-disc list-inside text-sm text-pink-800 space-y-0.5">
                        {m.suggestionsBox.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* complaints */}
                  {m.complaintsRaised && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <h4 className="text-xs font-semibold text-red-700 mb-1">Complaints Raised</h4>
                      <p className="text-sm text-red-800">{m.complaintsDetails}</p>
                    </div>
                  )}

                  {/* notes */}
                  {m.notes && (
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Meeting Notes</h4>
                      <p className="text-sm">{m.notes}</p>
                    </div>
                  )}

                  {/* next meeting */}
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Next meeting:</span> {m.nextMeetingDate}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Children&apos;s Meetings — Reg 7 &amp; Reg 16:</strong> Children must be given opportunity to influence how the home is run. Regular meetings provide a structured forum for children to raise concerns, make suggestions, and participate in decisions that affect them. Meetings should be child-led where possible, with actions followed through and reported back. Children who cannot attend should be offered alternative ways to contribute. The suggestions box provides a private route for raising issues.
      </div>

      {/* ── dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Children&apos;s Meeting</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Date</label>
                <input type="date" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Facilitated By</label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>{["staff_darren","staff_ryan","staff_anna","staff_chervelle","staff_edward"].map((id) => <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Snack / Meal</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. Pizza and juice" />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea rows={2} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Any preparation notes…" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={() => setDialogOpen(false)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Create Meeting</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
