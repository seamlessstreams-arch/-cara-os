"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Globe,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Users,
  TrendingUp,
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

type InitiativeStatus = "planned" | "active" | "completed" | "ongoing";
type ProtectedCharacteristic = "age" | "disability" | "gender_reassignment" | "marriage_civil_partnership" | "pregnancy_maternity" | "race" | "religion_belief" | "sex" | "sexual_orientation";

interface EqualityAction {
  id: string;
  action: string;
  characteristic: ProtectedCharacteristic;
  owner: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed";
  completedDate: string | null;
  impact: string;
}

interface TrainingRecord {
  id: string;
  title: string;
  date: string;
  provider: string;
  attendees: string[];
  mandatory: boolean;
  nextDue: string;
}

interface EqualityInitiative {
  id: string;
  title: string;
  description: string;
  status: InitiativeStatus;
  leadBy: string;
  startDate: string;
  targetDate: string;
  characteristics: ProtectedCharacteristic[];
  objectives: string[];
  actions: EqualityAction[];
  outcomes: string[];
  evidence: string[];
  notes: string;
}

interface EqualityMonitoring {
  staffDiversity: { characteristic: string; breakdown: Record<string, number> }[];
  ypDiversity: { characteristic: string; breakdown: Record<string, number> }[];
  lastAuditDate: string;
  nextAuditDue: string;
  auditedBy: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const CHAR_LABELS: Record<ProtectedCharacteristic, string> = {
  age: "Age", disability: "Disability", gender_reassignment: "Gender Reassignment",
  marriage_civil_partnership: "Marriage & Civil Partnership",
  pregnancy_maternity: "Pregnancy & Maternity", race: "Race",
  religion_belief: "Religion or Belief", sex: "Sex", sexual_orientation: "Sexual Orientation",
};

const STATUS_LABELS: Record<InitiativeStatus, string> = { planned: "Planned", active: "Active", completed: "Completed", ongoing: "Ongoing" };
const STATUS_COLOURS: Record<InitiativeStatus, string> = {
  planned: "bg-blue-100 text-blue-800", active: "bg-green-100 text-green-800",
  completed: "bg-emerald-100 text-emerald-800", ongoing: "bg-purple-100 text-purple-800",
};

const MONITORING: EqualityMonitoring = {
  staffDiversity: [
    { characteristic: "Ethnicity", breakdown: { "White British": 5, "Black British": 1, "Romanian": 1, "Mixed Heritage": 1 } },
    { characteristic: "Gender", breakdown: { "Female": 5, "Male": 3 } },
    { characteristic: "Age Range", breakdown: { "18-25": 1, "26-35": 3, "36-45": 2, "46-55": 2 } },
    { characteristic: "Disability", breakdown: { "No disability disclosed": 7, "Disability disclosed": 1 } },
  ],
  ypDiversity: [
    { characteristic: "Ethnicity", breakdown: { "White British": 2, "Mixed Heritage": 1 } },
    { characteristic: "Gender", breakdown: { "Male": 2, "Non-binary": 1 } },
    { characteristic: "Disability/SEND", breakdown: { "ADHD": 1, "ASD": 1, "None disclosed": 1 } },
    { characteristic: "Religion", breakdown: { "No religion": 2, "Christian": 1 } },
  ],
  lastAuditDate: d(-30), nextAuditDue: d(60), auditedBy: "staff_darren",
};

const TRAINING: TrainingRecord[] = [
  { id: "t1", title: "Equality & Diversity Fundamentals", date: d(-60), provider: "In-house", attendees: ["staff_darren", "staff_ryan", "staff_anna", "staff_edward", "staff_chervelle", "staff_diane", "staff_lackson", "staff_mirela"], mandatory: true, nextDue: d(305) },
  { id: "t2", title: "Unconscious Bias Workshop", date: d(-30), provider: "External — Inclusive Training Co.", attendees: ["staff_darren", "staff_ryan", "staff_anna", "staff_edward", "staff_chervelle", "staff_diane", "staff_lackson", "staff_mirela"], mandatory: true, nextDue: d(335) },
  { id: "t3", title: "Supporting LGBTQ+ Young People in Care", date: d(-45), provider: "Stonewall", attendees: ["staff_anna", "staff_chervelle", "staff_darren"], mandatory: false, nextDue: d(320) },
  { id: "t4", title: "Cultural Competence in Residential Care", date: d(-15), provider: "In-house", attendees: ["staff_darren", "staff_ryan", "staff_anna", "staff_edward"], mandatory: false, nextDue: d(350) },
];

const INITIATIVES: EqualityInitiative[] = [
  {
    id: "ei1", title: "Cultural Celebration Calendar",
    description: "Create and maintain a calendar of cultural and religious celebrations relevant to children and staff in the home, ensuring these are marked, respected and celebrated appropriately.",
    status: "active", leadBy: "staff_chervelle", startDate: d(-60), targetDate: d(305),
    characteristics: ["race", "religion_belief"],
    objectives: [
      "Identify all relevant cultural and religious dates for current cohort",
      "Plan age-appropriate celebration activities for key dates",
      "Ensure dietary requirements are met during religious observances",
      "Create a visible celebration calendar in communal areas",
    ],
    actions: [
      { id: "a1", action: "Research and compile cultural dates relevant to current children", characteristic: "race", owner: "staff_chervelle", dueDate: d(-50), status: "completed", completedDate: d(-52), impact: "Calendar now includes Eid, Diwali, Christmas, Chinese New Year, Black History Month" },
      { id: "a2", action: "Create visual calendar display for communal area", characteristic: "religion_belief", owner: "staff_chervelle", dueDate: d(-40), status: "completed", completedDate: d(-42), impact: "Colourful calendar displayed in dining room. Children helped decorate it." },
      { id: "a3", action: "Plan meals for Ramadan (if applicable)", characteristic: "religion_belief", owner: "staff_anna", dueDate: d(20), status: "pending", completedDate: null, impact: "" },
      { id: "a4", action: "Arrange Black History Month activities — October", characteristic: "race", owner: "staff_chervelle", dueDate: d(150), status: "pending", completedDate: null, impact: "" },
    ],
    outcomes: ["Children have expressed interest in learning about different cultures", "Staff awareness of cultural dates improved", "Mealtimes now include diverse cuisines weekly"],
    evidence: ["Cultural calendar photographs", "Children's feedback at meetings", "Menu planning records"],
    notes: "Children are enthusiastic. Alex asked to cook a dish from their grandmother's heritage. Jordan contributed artwork for the calendar.",
  },
  {
    id: "ei2", title: "Inclusive Language & Communication Review",
    description: "Review all home documentation, signage, and communication materials to ensure inclusive language is used throughout. Update policies and guidance to reflect best practice.",
    status: "completed", leadBy: "staff_darren", startDate: d(-90), targetDate: d(-30),
    characteristics: ["sex", "gender_reassignment", "disability", "race"],
    objectives: [
      "Audit all policies for inclusive language",
      "Update children's guide to use gender-neutral language where appropriate",
      "Ensure signage is accessible (easy-read versions, visual aids)",
      "Train staff on inclusive language expectations",
    ],
    actions: [
      { id: "a5", action: "Audit all 42 policies for inclusive language", characteristic: "sex", owner: "staff_darren", dueDate: d(-70), status: "completed", completedDate: d(-72), impact: "14 policies updated to use gender-neutral language" },
      { id: "a6", action: "Create easy-read version of children's guide", characteristic: "disability", owner: "staff_anna", dueDate: d(-50), status: "completed", completedDate: d(-48), impact: "Easy-read guide now available with Widgit symbols" },
      { id: "a7", action: "Update bathroom signage to be gender-inclusive", characteristic: "gender_reassignment", owner: "staff_darren", dueDate: d(-40), status: "completed", completedDate: d(-42), impact: "Gender-neutral signage installed on communal bathroom" },
      { id: "a8", action: "Staff briefing on inclusive language", characteristic: "race", owner: "staff_darren", dueDate: d(-35), status: "completed", completedDate: d(-35), impact: "All staff attended. Positive feedback." },
    ],
    outcomes: ["All policies now use inclusive language", "Children's guide available in standard and easy-read formats", "Gender-neutral bathroom available", "Staff confident in using inclusive language"],
    evidence: ["Updated policy documents", "Easy-read children's guide", "Training attendance records", "Staff feedback forms"],
    notes: "Completed successfully. Annual review built into policy schedule.",
  },
  {
    id: "ei3", title: "Anti-Bullying & Discrimination Reporting",
    description: "Strengthen systems for children and staff to report bullying, harassment or discrimination. Ensure all reports are taken seriously, investigated promptly, and outcomes fed back.",
    status: "ongoing", leadBy: "staff_darren", startDate: d(-45), targetDate: d(320),
    characteristics: ["race", "disability", "sexual_orientation", "religion_belief"],
    objectives: [
      "Create child-friendly reporting mechanism",
      "Review and update anti-bullying policy",
      "Ensure all incidents are tracked and analysed for patterns",
      "Termly review of discrimination-related incidents",
    ],
    actions: [
      { id: "a9", action: "Create 'worry box' system for anonymous reporting", characteristic: "race", owner: "staff_anna", dueDate: d(-30), status: "completed", completedDate: d(-32), impact: "Worry boxes in each bedroom corridor and communal area. Checked weekly." },
      { id: "a10", action: "Anti-bullying policy review and update", characteristic: "disability", owner: "staff_darren", dueDate: d(-20), status: "completed", completedDate: d(-22), impact: "Policy now explicitly references all protected characteristics" },
      { id: "a11", action: "Termly discrimination incident analysis", characteristic: "sexual_orientation", owner: "staff_darren", dueDate: d(30), status: "in_progress", completedDate: null, impact: "" },
    ],
    outcomes: ["3 worry box submissions received — all addressed within 48 hours", "Zero discrimination incidents in current quarter", "Children report feeling safer"],
    evidence: ["Worry box log", "Incident data analysis", "Children's meeting minutes"],
    notes: "Ongoing initiative. Worry box working well — children using it. One submission led to a positive conversation about online language.",
  },
];

/* ── flat row for export ─────────────────────────────────────────────── */

interface FlatRow {
  initiative: string; status: string; lead: string; characteristics: string;
  actionsTotal: string; actionsComplete: string; outcomes: string;
  startDate: string; targetDate: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Initiative",        accessor: (r: FlatRow) => r.initiative },
  { header: "Status",            accessor: (r: FlatRow) => r.status },
  { header: "Lead",              accessor: (r: FlatRow) => r.lead },
  { header: "Characteristics",   accessor: (r: FlatRow) => r.characteristics },
  { header: "Actions (Total)",   accessor: (r: FlatRow) => r.actionsTotal },
  { header: "Actions (Complete)",accessor: (r: FlatRow) => r.actionsComplete },
  { header: "Outcomes",          accessor: (r: FlatRow) => r.outcomes },
  { header: "Start Date",        accessor: (r: FlatRow) => r.startDate },
  { header: "Target Date",       accessor: (r: FlatRow) => r.targetDate },
  { header: "Notes",             accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function EqualityDiversityPage() {
  const [initiatives] = useState<EqualityInitiative[]>(INITIATIVES);
  const [training] = useState<TrainingRecord[]>(TRAINING);
  const [monitoring] = useState<EqualityMonitoring>(MONITORING);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("status");
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const stats = useMemo(() => {
    const active = initiatives.filter((i) => ["active", "ongoing"].includes(i.status)).length;
    const completed = initiatives.filter((i) => i.status === "completed").length;
    const totalActions = initiatives.reduce((s, i) => s + i.actions.length, 0);
    const completedActions = initiatives.reduce((s, i) => s + i.actions.filter((a) => a.status === "completed").length, 0);
    return { active, completed, totalActions, completedActions };
  }, [initiatives]);

  const filtered = useMemo(() => {
    let list = initiatives;
    if (search) { const q = search.toLowerCase(); list = list.filter((i) => i.title.toLowerCase().includes(q)); }
    if (filterStatus !== "all") list = list.filter((i) => i.status === filterStatus);
    const out = [...list];
    switch (sortBy) {
      case "status": out.sort((a, b) => a.status.localeCompare(b.status)); break;
      case "date": out.sort((a, b) => b.startDate.localeCompare(a.startDate)); break;
    }
    return out;
  }, [initiatives, search, filterStatus, sortBy]);

  const exportData = useMemo<FlatRow[]>(() =>
    initiatives.map((i) => ({
      initiative: i.title, status: STATUS_LABELS[i.status], lead: getStaffName(i.leadBy),
      characteristics: i.characteristics.map((c) => CHAR_LABELS[c]).join(", "),
      actionsTotal: `${i.actions.length}`,
      actionsComplete: `${i.actions.filter((a) => a.status === "completed").length}`,
      outcomes: i.outcomes.join("; "), startDate: i.startDate, targetDate: i.targetDate, notes: i.notes,
    })), [initiatives]);

  return (
    <PageShell
      title="Equality & Diversity"
      subtitle="Promoting equality, celebrating diversity and monitoring protected characteristics"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Equality & Diversity" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="equality-diversity" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Initiative
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Initiatives", value: stats.active, icon: Globe, colour: "text-blue-600" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, colour: "text-green-600" },
          { label: "Total Actions", value: stats.totalActions, icon: Users, colour: "text-purple-600" },
          { label: "Actions Complete", value: stats.completedActions, icon: TrendingUp, colour: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* monitoring overview */}
      <div className="rounded-lg border bg-white p-4 mb-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-gray-400" /> Diversity Monitoring</h3>
        <p className="text-xs text-gray-500 mb-3">Last audit: {monitoring.lastAuditDate} by {getStaffName(monitoring.auditedBy)} · Next: {monitoring.nextAuditDue}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2">Staff Diversity</h4>
            {monitoring.staffDiversity.map((d) => (
              <div key={d.characteristic} className="mb-2">
                <p className="text-xs font-medium text-gray-600">{d.characteristic}</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {Object.entries(d.breakdown).map(([k, v]) => (
                    <span key={k} className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded text-xs">{k}: {v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2">Young People Diversity</h4>
            {monitoring.ypDiversity.map((d) => (
              <div key={d.characteristic} className="mb-2">
                <p className="text-xs font-medium text-gray-600">{d.characteristic}</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {Object.entries(d.breakdown).map(([k, v]) => (
                    <span key={k} className="px-2 py-0.5 bg-pink-50 text-pink-800 rounded text-xs">{k}: {v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* training */}
      <div className="rounded-lg border bg-white p-4 mb-6">
        <h3 className="font-semibold mb-3">Equality & Diversity Training</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500 border-b">
              <th className="py-2 pr-3">Course</th><th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Provider</th><th className="py-2 pr-3">Attendees</th><th className="py-2 pr-3">Type</th><th className="py-2">Next Due</th>
            </tr></thead>
            <tbody>
              {training.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{t.title}</td>
                  <td className="py-2 pr-3">{t.date}</td>
                  <td className="py-2 pr-3">{t.provider}</td>
                  <td className="py-2 pr-3">{t.attendees.length} staff</td>
                  <td className="py-2 pr-3"><span className={cn("px-2 py-0.5 rounded text-xs font-medium", t.mandatory ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800")}>{t.mandatory ? "Mandatory" : "Optional"}</span></td>
                  <td className={cn("py-2", t.nextDue <= d(30) ? "text-amber-600 font-medium" : "")}>{t.nextDue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* filters */}
      <div id="initiatives-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search initiatives…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="date">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* initiative cards */}
      <div className="space-y-4 mb-8">
        {filtered.map((init) => {
          const open = expanded[init.id] ?? false;
          const done = init.actions.filter((a) => a.status === "completed").length;
          const pct = init.actions.length ? Math.round((done / init.actions.length) * 100) : 0;
          return (
            <div key={init.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(init.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{init.title}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[init.status])}>{STATUS_LABELS[init.status]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Lead: {getStaffName(init.leadBy)} · Actions: {done}/{init.actions.length} ({pct}%)</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  <p className="mt-3 text-sm">{init.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {init.characteristics.map((c) => <span key={c} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">{CHAR_LABELS[c]}</span>)}
                  </div>

                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Objectives</h4>
                    <ul className="list-disc list-inside text-sm space-y-0.5">
                      {init.objectives.map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Actions — {done}/{init.actions.length}</h4>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                      <div className={cn("h-2 rounded-full", pct === 100 ? "bg-green-500" : "bg-blue-500")} style={{ width: `${pct}%` }} />
                    </div>
                    {init.actions.map((a) => (
                      <div key={a.id} className="flex items-start gap-2 mb-2">
                        {a.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300 mt-0.5 shrink-0" />}
                        <div>
                          <p className={cn("text-sm", a.status === "completed" ? "text-gray-500" : "")}>{a.action}</p>
                          <p className="text-xs text-gray-400">{getStaffName(a.owner)} · Due {a.dueDate}{a.completedDate ? ` · Done ${a.completedDate}` : ""}</p>
                          {a.impact && <p className="text-xs text-green-700 italic">{a.impact}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {init.outcomes.length > 0 && (
                    <div className="rounded-md bg-green-50 border border-green-200 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Outcomes Achieved</h4>
                      <ul className="list-disc list-inside text-sm text-green-800 space-y-0.5">
                        {init.outcomes.map((o, i) => <li key={i}>{o}</li>)}
                      </ul>
                    </div>
                  )}

                  {init.notes && <div><h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4><p className="text-sm text-gray-700">{init.notes}</p></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Equality Act 2010 &amp; Reg 11:</strong> The home must actively promote equality and diversity, protect all nine protected characteristics, and monitor outcomes for children and staff from diverse backgrounds. Regular training, diversity monitoring, and proactive initiatives demonstrate commitment to anti-discriminatory practice. All staff must complete mandatory equality training annually.
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Equality Initiative</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-sm font-medium">Initiative Title</label><input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. LGBTQ+ Inclusion Programme" /></div>
            <div><label className="text-sm font-medium">Description</label><textarea rows={2} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="What this initiative aims to achieve…" /></div>
            <div><label className="text-sm font-medium">Lead</label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{["staff_darren","staff_ryan","staff_anna","staff_chervelle"].map((id) => <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={() => setDialogOpen(false)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Create Initiative</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
