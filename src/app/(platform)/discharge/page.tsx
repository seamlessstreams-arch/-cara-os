"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  LogOut,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CalendarDays,
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

type DischargeReason = "reunification" | "foster_care" | "other_residential" | "semi_independent" | "independent" | "adoption" | "age_18" | "placement_breakdown" | "secure_unit" | "other";
type PlanStatus = "not_started" | "in_progress" | "on_track" | "at_risk" | "completed" | "cancelled";

interface ChecklistItem {
  id: string;
  task: string;
  category: string;
  completed: boolean;
  completedDate: string | null;
  completedBy: string | null;
  notes: string;
}

interface TransitionAction {
  id: string;
  action: string;
  owner: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  notes: string;
}

interface DischargeRecord {
  id: string;
  youngPersonId: string;
  reason: DischargeReason;
  status: PlanStatus;
  plannedDate: string;
  actualDate: string | null;
  destination: string;
  destinationAddress: string;
  receivingProvider: string | null;
  socialWorker: string;
  socialWorkerContact: string;
  keyWorker: string;
  checklist: ChecklistItem[];
  transitionActions: TransitionAction[];
  riskAssessmentCompleted: boolean;
  belongingsReturned: boolean;
  belongingsWitnessed: string | null;
  exitInterview: { completed: boolean; date: string | null; conductedBy: string | null; childViews: string; };
  aftercareProvision: string[];
  stayInTouchPlan: string;
  childViews: string;
  professionalViews: string;
  notes: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const REASON_LABELS: Record<DischargeReason, string> = {
  reunification: "Return to Family", foster_care: "Foster Care",
  other_residential: "Other Residential", semi_independent: "Semi-Independent",
  independent: "Independent Living", adoption: "Adoption",
  age_18: "Aged Out (18+)", placement_breakdown: "Placement Breakdown",
  secure_unit: "Secure Unit", other: "Other",
};

const STATUS_LABELS: Record<PlanStatus, string> = {
  not_started: "Not Started", in_progress: "In Progress", on_track: "On Track",
  at_risk: "At Risk", completed: "Completed", cancelled: "Cancelled",
};

const STATUS_COLOURS: Record<PlanStatus, string> = {
  not_started: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-800",
  on_track: "bg-green-100 text-green-800",
  at_risk: "bg-red-100 text-red-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-100 text-gray-500",
};

const SEED: DischargeRecord[] = [
  {
    id: "dis1", youngPersonId: "yp_alex", reason: "semi_independent",
    status: "in_progress", plannedDate: d(90), actualDate: null,
    destination: "Supported Lodgings – 14 Maple Avenue", destinationAddress: "14 Maple Avenue, Stockport, SK4 1AB",
    receivingProvider: "Stockport Supported Living Ltd", socialWorker: "Lisa Chen",
    socialWorkerContact: "lisa.chen@stockport.gov.uk", keyWorker: "staff_anna",
    riskAssessmentCompleted: true, belongingsReturned: false, belongingsWitnessed: null,
    exitInterview: { completed: false, date: null, conductedBy: null, childViews: "" },
    aftercareProvision: ["Personal Adviser allocated", "Staying Put option discussed", "Pathway Plan in place", "Council Tax exemption applied"],
    stayInTouchPlan: "Alex has agreed to weekly phone calls with key worker for first 3 months, then fortnightly. Open invitation to visit Oak House.",
    childViews: "Alex is excited about the move but nervous about managing bills. Wants to keep in touch with staff and visit Jordan and Casey.",
    professionalViews: "Alex has made excellent progress in independence skills. Budgeting remains an area to strengthen before move. Supported lodgings provide appropriate level of oversight.",
    notes: "Transition timeline agreed at LAC review. Gradual overnight stays at supported lodgings to begin 6 weeks before move.",
    checklist: [
      { id: "c1", task: "Pathway Plan updated and signed", category: "Planning", completed: true, completedDate: d(-14), completedBy: "staff_anna", notes: "" },
      { id: "c2", task: "Leaving care entitlements explained", category: "Planning", completed: true, completedDate: d(-14), completedBy: "staff_anna", notes: "Setting up grant discussed" },
      { id: "c3", task: "GP registration transferred", category: "Health", completed: false, completedDate: null, completedBy: null, notes: "New GP identified near Maple Avenue" },
      { id: "c4", task: "Dental registration arranged", category: "Health", completed: false, completedDate: null, completedBy: null, notes: "" },
      { id: "c5", task: "Education/training placement confirmed", category: "Education", completed: true, completedDate: d(-7), completedBy: "staff_edward", notes: "College placement continuing" },
      { id: "c6", task: "Bank account set up", category: "Finance", completed: true, completedDate: d(-21), completedBy: "staff_anna", notes: "Nationwide account opened" },
      { id: "c7", task: "Benefit entitlements assessed", category: "Finance", completed: false, completedDate: null, completedBy: null, notes: "Universal Credit application to be submitted" },
      { id: "c8", task: "Life story work completed", category: "Emotional", completed: true, completedDate: d(-30), completedBy: "staff_anna", notes: "" },
      { id: "c9", task: "Personal belongings inventory finalised", category: "Practical", completed: false, completedDate: null, completedBy: null, notes: "" },
      { id: "c10", task: "Emergency contacts card provided", category: "Safety", completed: false, completedDate: null, completedBy: null, notes: "" },
      { id: "c11", task: "Overnight stays at new placement", category: "Transition", completed: false, completedDate: null, completedBy: null, notes: "3 overnight stays planned" },
      { id: "c12", task: "Goodbye celebration planned", category: "Emotional", completed: false, completedDate: null, completedBy: null, notes: "Alex wants a pizza evening" },
    ],
    transitionActions: [
      { id: "a1", action: "Arrange visit to supported lodgings with Alex", owner: "staff_anna", dueDate: d(7), status: "in_progress", notes: "Provider available next Wednesday" },
      { id: "a2", action: "Complete budgeting workshop sessions (3/6)", owner: "staff_edward", dueDate: d(30), status: "in_progress", notes: "Sessions 1-3 done. Focus on utility bills next." },
      { id: "a3", action: "Apply for Setting Up Home allowance", owner: "staff_anna", dueDate: d(45), status: "pending", notes: "£2,000 available. Need to identify essential items." },
      { id: "a4", action: "Transfer medication to new GP", owner: "staff_darren", dueDate: d(80), status: "pending", notes: "" },
      { id: "a5", action: "Final LAC review before discharge", owner: "staff_darren", dueDate: d(60), status: "pending", notes: "IRO to be contacted for date" },
    ],
  },
  {
    id: "dis2", youngPersonId: "yp_casey", reason: "reunification",
    status: "on_track", plannedDate: d(45), actualDate: null,
    destination: "Mother's home – 8 Birch Lane", destinationAddress: "8 Birch Lane, Cheadle, SK8 3PQ",
    receivingProvider: null, socialWorker: "James Okafor",
    socialWorkerContact: "james.okafor@stockport.gov.uk", keyWorker: "staff_anna",
    riskAssessmentCompleted: true, belongingsReturned: false, belongingsWitnessed: null,
    exitInterview: { completed: false, date: null, conductedBy: null, childViews: "" },
    aftercareProvision: ["Family support worker allocated", "Outreach visits weekly for 12 weeks", "School liaison to continue"],
    stayInTouchPlan: "Casey's mum has agreed to call Oak House if any concerns. School SENCO will provide continuity. Family support worker for 3 months post-return.",
    childViews: "Casey is very happy about going home. Worried about missing friends at Oak House but excited to be back with mum and the cat.",
    professionalViews: "Mum has engaged well with parenting programme. Home conditions much improved. Risk assessment shows reduced concerns. Graduated return with increasing overnight stays recommended.",
    notes: "Court order variation pending. Graduated return starts with weekends, building to full weeks. Final court hearing scheduled.",
    checklist: [
      { id: "c13", task: "Court order variation filed", category: "Legal", completed: true, completedDate: d(-10), completedBy: null, notes: "Hearing date set" },
      { id: "c14", task: "Home conditions assessment completed", category: "Safety", completed: true, completedDate: d(-20), completedBy: null, notes: "Social worker confirmed satisfactory" },
      { id: "c15", task: "School place confirmed at current school", category: "Education", completed: true, completedDate: d(-5), completedBy: "staff_anna", notes: "Transport arrangements needed" },
      { id: "c16", task: "GP registration transferred", category: "Health", completed: true, completedDate: d(-3), completedBy: "staff_anna", notes: "Same GP surgery — no transfer needed" },
      { id: "c17", task: "Graduated return overnights commenced", category: "Transition", completed: true, completedDate: d(-7), completedBy: "staff_anna", notes: "2 weekends completed successfully" },
      { id: "c18", task: "Belongings packed and inventoried", category: "Practical", completed: false, completedDate: null, completedBy: null, notes: "" },
      { id: "c19", task: "Life story work up to date", category: "Emotional", completed: true, completedDate: d(-15), completedBy: "staff_anna", notes: "" },
      { id: "c20", task: "Safety plan agreed with family", category: "Safety", completed: true, completedDate: d(-12), completedBy: null, notes: "SW-led family meeting" },
    ],
    transitionActions: [
      { id: "a6", action: "Complete final 2 weekend overnights", owner: "staff_anna", dueDate: d(14), status: "in_progress", notes: "Weekend 3 this Friday" },
      { id: "a7", action: "Arrange transport for school from home", owner: "staff_anna", dueDate: d(21), status: "pending", notes: "Bus pass application" },
      { id: "a8", action: "Pack belongings with Casey", owner: "staff_anna", dueDate: d(35), status: "pending", notes: "Casey wants to choose what goes first" },
    ],
  },
  {
    id: "dis3", youngPersonId: "yp_jordan", reason: "placement_breakdown",
    status: "completed", plannedDate: "2025-03-01", actualDate: "2025-03-01",
    destination: "Previous placement — emergency return", destinationAddress: "Undisclosed",
    receivingProvider: "Greenfield Children's Home", socialWorker: "Sarah Malik",
    socialWorkerContact: "sarah.malik@stockport.gov.uk", keyWorker: "staff_ryan",
    riskAssessmentCompleted: true, belongingsReturned: true, belongingsWitnessed: "staff_darren",
    exitInterview: { completed: true, date: "2025-02-28", conductedBy: "staff_darren", childViews: "Jordan said they didn't feel safe after the incident. Wanted to move. Will miss Mr Bear though (brought it)." },
    aftercareProvision: [],
    stayInTouchPlan: "Jordan left contact number. Staff to send birthday card. Jordan knows they can call.",
    childViews: "Jordan expressed relief at moving but sadness about leaving. Felt the placement 'wasn't working out.' Asked to take the art supplies.",
    professionalViews: "Despite best efforts, the peer dynamic became unmanageable. Jordan's needs may be better met in a smaller home. Full disruption meeting to be held.",
    notes: "Emergency move following critical incident. Disruption meeting scheduled for 2 weeks post-move. All relevant parties notified.",
    checklist: [
      { id: "c21", task: "Emergency risk assessment completed", category: "Safety", completed: true, completedDate: "2025-02-28", completedBy: "staff_darren", notes: "" },
      { id: "c22", task: "Social worker notified", category: "Planning", completed: true, completedDate: "2025-02-28", completedBy: "staff_darren", notes: "Phone call 18:30" },
      { id: "c23", task: "Belongings packed and signed off", category: "Practical", completed: true, completedDate: "2025-03-01", completedBy: "staff_ryan", notes: "Full inventory attached" },
      { id: "c24", task: "Medication transferred to receiving home", category: "Health", completed: true, completedDate: "2025-03-01", completedBy: "staff_darren", notes: "MAR chart photocopied" },
      { id: "c25", task: "School notified of move", category: "Education", completed: true, completedDate: "2025-03-01", completedBy: "staff_anna", notes: "" },
      { id: "c26", task: "Disruption meeting arranged", category: "Review", completed: true, completedDate: "2025-03-05", completedBy: "staff_darren", notes: "Held 14/03 — lessons learned recorded" },
    ],
    transitionActions: [
      { id: "a9", action: "Complete disruption meeting report", owner: "staff_darren", dueDate: "2025-03-14", status: "completed", notes: "Report filed with RM" },
      { id: "a10", action: "Send personal items left behind", owner: "staff_ryan", dueDate: "2025-03-07", status: "completed", notes: "Art supplies posted" },
    ],
  },
];

/* ── flat row for export ─────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string; reason: string; status: string; plannedDate: string;
  actualDate: string; destination: string; socialWorker: string; keyWorker: string;
  checklistProgress: string; actionsProgress: string; riskAssessment: string;
  belongingsReturned: string; exitInterview: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person",       accessor: (r: FlatRow) => r.youngPerson },
  { header: "Reason",             accessor: (r: FlatRow) => r.reason },
  { header: "Status",             accessor: (r: FlatRow) => r.status },
  { header: "Planned Date",       accessor: (r: FlatRow) => r.plannedDate },
  { header: "Actual Date",        accessor: (r: FlatRow) => r.actualDate },
  { header: "Destination",        accessor: (r: FlatRow) => r.destination },
  { header: "Social Worker",      accessor: (r: FlatRow) => r.socialWorker },
  { header: "Key Worker",         accessor: (r: FlatRow) => r.keyWorker },
  { header: "Checklist Progress", accessor: (r: FlatRow) => r.checklistProgress },
  { header: "Actions Progress",   accessor: (r: FlatRow) => r.actionsProgress },
  { header: "Risk Assessment",    accessor: (r: FlatRow) => r.riskAssessment },
  { header: "Belongings Returned",accessor: (r: FlatRow) => r.belongingsReturned },
  { header: "Exit Interview",     accessor: (r: FlatRow) => r.exitInterview },
  { header: "Notes",              accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function DischargePage() {
  const [data] = useState<DischargeRecord[]>(SEED);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const active = data.filter((r) => !["completed", "cancelled"].includes(r.status)).length;
    const completed = data.filter((r) => r.status === "completed").length;
    const atRisk = data.filter((r) => r.status === "at_risk").length;
    const overdueActions = data.reduce((s, r) => s + r.transitionActions.filter((a) => a.status === "overdue" || (a.status !== "completed" && a.dueDate < d(0))).length, 0);
    return { active, completed, atRisk, overdueActions };
  }, [data]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        getYPName(r.youngPersonId).toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    const out = [...list];
    switch (sortBy) {
      case "date":   out.sort((a, b) => a.plannedDate.localeCompare(b.plannedDate)); break;
      case "name":   out.sort((a, b) => getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId))); break;
      case "status": out.sort((a, b) => a.status.localeCompare(b.status)); break;
    }
    return out;
  }, [data, search, filterStatus, sortBy]);

  /* ── export data ──────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(() =>
    data.map((r) => {
      const done = r.checklist.filter((c) => c.completed).length;
      const actionsDone = r.transitionActions.filter((a) => a.status === "completed").length;
      return {
        youngPerson: getYPName(r.youngPersonId),
        reason: REASON_LABELS[r.reason],
        status: STATUS_LABELS[r.status],
        plannedDate: r.plannedDate,
        actualDate: r.actualDate ?? "—",
        destination: r.destination,
        socialWorker: r.socialWorker,
        keyWorker: getStaffName(r.keyWorker),
        checklistProgress: `${done}/${r.checklist.length}`,
        actionsProgress: `${actionsDone}/${r.transitionActions.length}`,
        riskAssessment: r.riskAssessmentCompleted ? "Complete" : "Pending",
        belongingsReturned: r.belongingsReturned ? "Yes" : "No",
        exitInterview: r.exitInterview.completed ? "Complete" : "Pending",
        notes: r.notes,
      };
    }), [data]);

  return (
    <PageShell
      title="Discharge & Moving On"
      subtitle="Transition planning, discharge checklists and aftercare provision"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Discharge & Moving On" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="discharge-planning" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Discharge Plan
          </button>
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Plans", value: stats.active, icon: Clock, colour: "text-blue-600" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, colour: "text-green-600" },
          { label: "At Risk", value: stats.atRisk, icon: AlertTriangle, colour: stats.atRisk > 0 ? "text-red-600" : "text-gray-400" },
          { label: "Overdue Actions", value: stats.overdueActions, icon: CalendarDays, colour: stats.overdueActions > 0 ? "text-amber-600" : "text-gray-400" },
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

      {/* ── per-child summary ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {data.map((r) => {
          const done = r.checklist.filter((c) => c.completed).length;
          const pct = r.checklist.length ? Math.round((done / r.checklist.length) * 100) : 0;
          return (
            <div key={r.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{getYPName(r.youngPersonId)}</h3>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[r.status])}>{STATUS_LABELS[r.status]}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{REASON_LABELS[r.reason]} · {r.status === "completed" ? `Left ${r.actualDate}` : `Planned ${r.plannedDate}`}</p>
              <p className="text-xs text-gray-600 mt-1 truncate">{r.destination}</p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Checklist</span>
                  <span className="font-medium">{done}/{r.checklist.length} ({pct}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={cn("h-2 rounded-full", pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-500")} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── filters ────────────────────────────────────────────────── */}
      <div id="discharge-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search children or destinations…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
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
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expanded[r.id] ?? false;
          const done = r.checklist.filter((c) => c.completed).length;
          const pct = r.checklist.length ? Math.round((done / r.checklist.length) * 100) : 0;
          const categories = [...new Set(r.checklist.map((c) => c.category))];
          return (
            <div key={r.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(r.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{getYPName(r.youngPersonId)}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[r.status])}>{STATUS_LABELS[r.status]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{REASON_LABELS[r.reason]} → {r.destination} · Checklist {pct}%</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* key details */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Planned:</span> <span className="font-medium">{r.plannedDate}</span></div>
                    <div><span className="text-gray-500">Actual:</span> <span className="font-medium">{r.actualDate ?? "—"}</span></div>
                    <div><span className="text-gray-500">SW:</span> <span className="font-medium">{r.socialWorker}</span></div>
                    <div><span className="text-gray-500">Key Worker:</span> <span className="font-medium">{getStaffName(r.keyWorker)}</span></div>
                    <div className="col-span-2"><span className="text-gray-500">Destination:</span> <span className="font-medium">{r.destination}</span></div>
                    {r.receivingProvider && <div className="col-span-2"><span className="text-gray-500">Provider:</span> <span className="font-medium">{r.receivingProvider}</span></div>}
                  </div>

                  {/* quick status */}
                  <div className="flex flex-wrap gap-2">
                    <span className={cn("px-2 py-1 rounded text-xs font-medium", r.riskAssessmentCompleted ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>{r.riskAssessmentCompleted ? "✓ Risk Assessment" : "✗ Risk Assessment"}</span>
                    <span className={cn("px-2 py-1 rounded text-xs font-medium", r.belongingsReturned ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600")}>{r.belongingsReturned ? "✓ Belongings Returned" : "○ Belongings Pending"}</span>
                    <span className={cn("px-2 py-1 rounded text-xs font-medium", r.exitInterview.completed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600")}>{r.exitInterview.completed ? "✓ Exit Interview" : "○ Exit Interview"}</span>
                  </div>

                  {/* checklist by category */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Discharge Checklist — {done}/{r.checklist.length} complete</h4>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                      <div className={cn("h-2 rounded-full", pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-500")} style={{ width: `${pct}%` }} />
                    </div>
                    {categories.map((cat) => (
                      <div key={cat} className="mb-2">
                        <p className="text-xs font-medium text-gray-600 mb-1">{cat}</p>
                        {r.checklist.filter((c) => c.category === cat).map((c) => (
                          <div key={c.id} className="flex items-start gap-2 ml-2 mb-1">
                            {c.completed ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300 mt-0.5 shrink-0" />}
                            <div>
                              <p className={cn("text-sm", c.completed ? "text-gray-500 line-through" : "")}>{c.task}</p>
                              {c.completed && c.completedDate && <p className="text-xs text-gray-400">{c.completedDate}{c.completedBy ? ` — ${getStaffName(c.completedBy)}` : ""}</p>}
                              {c.notes && <p className="text-xs text-gray-500 italic">{c.notes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* transition actions */}
                  {r.transitionActions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-2">Transition Actions</h4>
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
                            {r.transitionActions.map((a) => {
                              const overdue = a.status !== "completed" && a.dueDate < d(0);
                              return (
                                <tr key={a.id} className="border-b last:border-0">
                                  <td className="py-2 pr-3">{a.action}</td>
                                  <td className="py-2 pr-3">{getStaffName(a.owner)}</td>
                                  <td className={cn("py-2 pr-3", overdue ? "text-red-600 font-medium" : "")}>{a.dueDate}</td>
                                  <td className="py-2 pr-3">
                                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                                      a.status === "completed" ? "bg-green-100 text-green-800" :
                                      overdue ? "bg-red-100 text-red-800" :
                                      a.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                                      "bg-gray-100 text-gray-700"
                                    )}>{overdue ? "Overdue" : a.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                                  </td>
                                  <td className="py-2 text-xs text-gray-500">{a.notes}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* aftercare */}
                  {r.aftercareProvision.length > 0 && (
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Aftercare Provision</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                        {r.aftercareProvision.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* stay in touch */}
                  {r.stayInTouchPlan && (
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Stay in Touch Plan</h4>
                      <p className="text-sm">{r.stayInTouchPlan}</p>
                    </div>
                  )}

                  {/* child's view */}
                  {r.childViews && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Child&apos;s Views on Moving</h4>
                      <p className="text-sm text-pink-800">{r.childViews}</p>
                    </div>
                  )}

                  {/* exit interview */}
                  {r.exitInterview.completed && r.exitInterview.childViews && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Exit Interview — {r.exitInterview.date} ({r.exitInterview.conductedBy ? getStaffName(r.exitInterview.conductedBy) : ""})</h4>
                      <p className="text-sm text-pink-800">{r.exitInterview.childViews}</p>
                    </div>
                  )}

                  {/* professional views */}
                  {r.professionalViews && (
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Professional Views</h4>
                      <p className="text-sm text-blue-800">{r.professionalViews}</p>
                    </div>
                  )}

                  {/* notes */}
                  {r.notes && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4>
                      <p className="text-sm text-gray-700">{r.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Discharge Planning:</strong> All children leaving care must have a planned transition with a comprehensive discharge checklist. Emergency moves require immediate risk assessment and disruption meeting within 2 weeks. Belongings must be inventoried with an independent witness. Exit interviews capture the child&apos;s voice. Aftercare provision must be documented and shared with receiving placement.
      </div>

      {/* ── dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Discharge Plan</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Young Person</label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{["yp_alex","yp_jordan","yp_casey"].map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Reason</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(REASON_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Planned Date</label>
                <input type="date" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Destination</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. Supported Lodgings – 14 Maple Avenue" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Social Worker</label>
                <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Name" />
              </div>
              <div>
                <label className="text-sm font-medium">SW Contact</label>
                <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Email" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea rows={2} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Additional context…" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={() => setDialogOpen(false)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Create Plan</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
