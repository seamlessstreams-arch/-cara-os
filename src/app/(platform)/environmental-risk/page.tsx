"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Clock,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type RiskCategory = "building" | "garden_grounds" | "kitchen" | "bathroom" | "bedroom" | "communal" | "external_area" | "vehicle" | "equipment" | "chemical_hazard";
type RiskLevel = "low" | "medium" | "high" | "critical";
type AssessmentStatus = "current" | "due_review" | "overdue" | "archived";

interface Control {
  measure: string;
  implementedBy: string;
  dateImplemented: string;
  effective: boolean;
}

interface EnvironmentalRisk {
  id: string;
  category: RiskCategory;
  location: string;
  hazard: string;
  whoAtRisk: string[];
  riskLevel: RiskLevel;
  residualRisk: RiskLevel;
  status: AssessmentStatus;
  assessedBy: string;
  assessmentDate: string;
  reviewDate: string;
  controls: Control[];
  additionalActions: string[];
  incidentHistory: string;
  notes: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const CAT_LABELS: Record<RiskCategory, string> = {
  building: "Building", garden_grounds: "Garden & Grounds", kitchen: "Kitchen",
  bathroom: "Bathroom", bedroom: "Bedroom", communal: "Communal Area",
  external_area: "External Area", vehicle: "Vehicle", equipment: "Equipment",
  chemical_hazard: "Chemical / COSHH",
};

const RISK_LABELS: Record<RiskLevel, string> = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
const RISK_COLOURS: Record<RiskLevel, string> = {
  low: "bg-green-100 text-green-800", medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<AssessmentStatus, string> = {
  current: "Current", due_review: "Due Review", overdue: "Overdue", archived: "Archived",
};
const STATUS_COLOURS: Record<AssessmentStatus, string> = {
  current: "bg-green-100 text-green-800", due_review: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800", archived: "bg-gray-100 text-gray-700",
};

const SEED: EnvironmentalRisk[] = [
  {
    id: "er1", category: "kitchen", location: "Main kitchen",
    hazard: "Knife storage — sharp knives accessible in drawer. Risk of self-harm or accidental injury.",
    whoAtRisk: ["Young people", "Staff"], riskLevel: "high", residualRisk: "low",
    status: "current", assessedBy: "staff_darren", assessmentDate: d(-14), reviewDate: d(76),
    controls: [
      { measure: "Knives stored in locked magnetic knife block in locked cupboard", implementedBy: "staff_darren", dateImplemented: "2024-09-15", effective: true },
      { measure: "Key held by shift leader only — signed out/in each shift", implementedBy: "staff_darren", dateImplemented: "2024-09-15", effective: true },
      { measure: "Knife audit at each shift change — count and condition check", implementedBy: "staff_ryan", dateImplemented: "2024-09-15", effective: true },
      { measure: "Children supervised when using knives for cooking activities", implementedBy: "staff_anna", dateImplemented: "2024-09-15", effective: true },
    ],
    additionalActions: ["Consider replacing some metal knives with ceramic safety knives for routine use"],
    incidentHistory: "No incidents since controls implemented.",
    notes: "Risk level reduced from high to low with controls. Review if new YP admitted with self-harm history — may need enhanced measures.",
  },
  {
    id: "er2", category: "bathroom", location: "First floor bathrooms (x2)",
    hazard: "Ligature points — shower rail, towel hooks, door handles. Risk of self-harm.",
    whoAtRisk: ["Young people"], riskLevel: "high", residualRisk: "medium",
    status: "current", assessedBy: "staff_darren", assessmentDate: d(-14), reviewDate: d(76),
    controls: [
      { measure: "Anti-ligature shower rails installed (collapsible under weight)", implementedBy: "staff_darren", dateImplemented: "2024-10-01", effective: true },
      { measure: "Anti-ligature hooks replaced standard hooks", implementedBy: "staff_darren", dateImplemented: "2024-10-01", effective: true },
      { measure: "Individual risk assessments determine bathroom supervision levels", implementedBy: "staff_anna", dateImplemented: "2024-09-15", effective: true },
      { measure: "Bathroom doors can be unlocked from outside in emergency", implementedBy: "staff_darren", dateImplemented: "2024-09-15", effective: true },
    ],
    additionalActions: ["Annual anti-ligature audit by specialist contractor due in 3 months", "Door handle review — consider anti-ligature handles"],
    incidentHistory: "One incident (pre-controls) involving shower rail. No incidents since anti-ligature fittings installed.",
    notes: "Residual risk remains medium due to inherent nature of bathroom environments. Individual care plans address specific YP risk levels.",
  },
  {
    id: "er3", category: "garden_grounds", location: "Rear garden including fence perimeter",
    hazard: "Fence perimeter — sections where climbing could enable absconding. Garden shed contains tools.",
    whoAtRisk: ["Young people"], riskLevel: "medium", residualRisk: "low",
    status: "current", assessedBy: "staff_ryan", assessmentDate: d(-7), reviewDate: d(83),
    controls: [
      { measure: "6ft fence with anti-climb trellis on sections nearest street", implementedBy: "staff_ryan", dateImplemented: "2024-09-20", effective: true },
      { measure: "Garden shed locked — key with shift leader", implementedBy: "staff_ryan", dateImplemented: "2024-09-15", effective: true },
      { measure: "Tool inventory checked weekly", implementedBy: "staff_edward", dateImplemented: "2024-09-15", effective: true },
      { measure: "Garden use supervised — staff aware when children outside", implementedBy: "staff_anna", dateImplemented: "2024-09-15", effective: true },
    ],
    additionalActions: ["Replace trellis section near back gate — weathering noted"],
    incidentHistory: "No absconding attempts via garden. One instance of YP climbing tree near fence — tree pruned.",
    notes: "Good controls in place. Seasonal review needed — vegetation growth in summer can create climbing aids. Winter: check ice/snow on paths.",
  },
  {
    id: "er4", category: "chemical_hazard", location: "Cleaning storage cupboard (utility room)",
    hazard: "Cleaning chemicals — bleach, oven cleaner, disinfectant. Risk of ingestion, skin contact, or misuse.",
    whoAtRisk: ["Young people", "Staff"], riskLevel: "medium", residualRisk: "low",
    status: "current", assessedBy: "staff_ryan", assessmentDate: d(-7), reviewDate: d(83),
    controls: [
      { measure: "All chemicals stored in locked cupboard with COSHH signage", implementedBy: "staff_ryan", dateImplemented: "2024-09-15", effective: true },
      { measure: "COSHH data sheets available in folder next to cupboard", implementedBy: "staff_ryan", dateImplemented: "2024-09-15", effective: true },
      { measure: "Staff trained in safe handling — annual refresher", implementedBy: "staff_darren", dateImplemented: "2024-09-15", effective: true },
      { measure: "Inventory and stock rotation system in place", implementedBy: "staff_ryan", dateImplemented: "2024-09-15", effective: true },
    ],
    additionalActions: [],
    incidentHistory: "No incidents. COSHH audit last month — compliant.",
    notes: "Consider transitioning to eco-friendly cleaning products where effective — reduced risk profile.",
  },
  {
    id: "er5", category: "external_area", location: "Front car park and entrance path",
    hazard: "Vehicle movements in car park. Uneven paving on entrance path. Inadequate lighting at dusk.",
    whoAtRisk: ["Young people", "Staff", "Visitors"], riskLevel: "medium", residualRisk: "low",
    status: "due_review", assessedBy: "staff_ryan", assessmentDate: d(-80), reviewDate: d(10),
    controls: [
      { measure: "5mph speed limit signs installed", implementedBy: "staff_ryan", dateImplemented: "2024-10-01", effective: true },
      { measure: "Motion-sensor security lights on entrance path", implementedBy: "staff_darren", dateImplemented: "2024-10-15", effective: true },
      { measure: "Uneven paving slab repaired (reported via maintenance)", implementedBy: "staff_ryan", dateImplemented: "2024-11-01", effective: true },
      { measure: "Children enter/exit via main door (away from car park) as standard", implementedBy: "staff_anna", dateImplemented: "2024-09-15", effective: true },
    ],
    additionalActions: ["Review path surface for winter — gritting schedule needed"],
    incidentHistory: "One near-miss — visitor reversed near YP. Resolved with speed limit signs and one-way system.",
    notes: "Review due within 2 weeks. Winter gritting plan needed.",
  },
  {
    id: "er6", category: "bedroom", location: "All YP bedrooms (3 rooms)",
    hazard: "Window opening — risk of fall from height (first floor). Furniture positioning near windows.",
    whoAtRisk: ["Young people"], riskLevel: "medium", residualRisk: "low",
    status: "current", assessedBy: "staff_darren", assessmentDate: d(-14), reviewDate: d(76),
    controls: [
      { measure: "Window restrictors installed — maximum opening 100mm", implementedBy: "staff_darren", dateImplemented: "2024-09-15", effective: true },
      { measure: "Furniture positioned away from windows — no climbing aids", implementedBy: "staff_anna", dateImplemented: "2024-09-15", effective: true },
      { measure: "Window restrictors checked monthly as part of H&S audit", implementedBy: "staff_ryan", dateImplemented: "2024-09-15", effective: true },
      { measure: "Individual risk assessment if YP has history of climbing/jumping", implementedBy: "staff_darren", dateImplemented: "2024-09-15", effective: true },
    ],
    additionalActions: [],
    incidentHistory: "No incidents.",
    notes: "Restrictors tested and compliant at last H&S audit. Keys held by RM for emergency override.",
  },
];

/* ── flat row ────────────────────────────────────────────────────────── */

interface FlatRow {
  category: string; location: string; hazard: string; whoAtRisk: string;
  riskLevel: string; residualRisk: string; status: string;
  assessedBy: string; assessmentDate: string; reviewDate: string;
  controls: string; incidentHistory: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Category",        accessor: (r: FlatRow) => r.category },
  { header: "Location",        accessor: (r: FlatRow) => r.location },
  { header: "Hazard",          accessor: (r: FlatRow) => r.hazard },
  { header: "Who at Risk",     accessor: (r: FlatRow) => r.whoAtRisk },
  { header: "Risk Level",      accessor: (r: FlatRow) => r.riskLevel },
  { header: "Residual Risk",   accessor: (r: FlatRow) => r.residualRisk },
  { header: "Status",          accessor: (r: FlatRow) => r.status },
  { header: "Assessed By",     accessor: (r: FlatRow) => r.assessedBy },
  { header: "Assessment Date", accessor: (r: FlatRow) => r.assessmentDate },
  { header: "Review Date",     accessor: (r: FlatRow) => r.reviewDate },
  { header: "Controls",        accessor: (r: FlatRow) => r.controls },
  { header: "Incident History", accessor: (r: FlatRow) => r.incidentHistory },
  { header: "Notes",           accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function EnvironmentalRiskPage() {
  const [data] = useState<EnvironmentalRisk[]>(SEED);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [sortBy, setSortBy] = useState("risk");
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const stats = useMemo(() => {
    const total = data.filter((r) => r.status !== "archived").length;
    const highCritical = data.filter((r) => ["high", "critical"].includes(r.riskLevel) && r.status !== "archived").length;
    const controlled = data.filter((r) => r.residualRisk === "low" && r.status !== "archived").length;
    const reviewDue = data.filter((r) => ["due_review", "overdue"].includes(r.status)).length;
    return { total, highCritical, controlled, reviewDue };
  }, [data]);

  const filtered = useMemo(() => {
    let list = data;
    if (search) { const q = search.toLowerCase(); list = list.filter((r) => r.hazard.toLowerCase().includes(q) || r.location.toLowerCase().includes(q)); }
    if (filterRisk !== "all") list = list.filter((r) => r.riskLevel === filterRisk);
    const out = [...list];
    switch (sortBy) {
      case "risk": { const o: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }; out.sort((a, b) => o[a.riskLevel] - o[b.riskLevel]); break; }
      case "review": out.sort((a, b) => a.reviewDate.localeCompare(b.reviewDate)); break;
      case "category": out.sort((a, b) => a.category.localeCompare(b.category)); break;
    }
    return out;
  }, [data, search, filterRisk, sortBy]);

  const exportData = useMemo<FlatRow[]>(() =>
    data.map((r) => ({
      category: CAT_LABELS[r.category], location: r.location, hazard: r.hazard,
      whoAtRisk: r.whoAtRisk.join(", "), riskLevel: RISK_LABELS[r.riskLevel],
      residualRisk: RISK_LABELS[r.residualRisk], status: STATUS_LABELS[r.status],
      assessedBy: getStaffName(r.assessedBy), assessmentDate: r.assessmentDate,
      reviewDate: r.reviewDate, controls: r.controls.map((c) => c.measure).join("; "),
      incidentHistory: r.incidentHistory, notes: r.notes,
    })), [data]);

  return (
    <PageShell
      title="Environmental Risk Assessments"
      subtitle="Hazard identification, control measures and residual risk management across the home"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Environmental Risk Assessments" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="environmental-risk" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Assessment
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Assessments", value: stats.total, icon: MapPin, colour: "text-blue-600" },
          { label: "High/Critical Risks", value: stats.highCritical, icon: AlertTriangle, colour: stats.highCritical > 0 ? "text-red-600" : "text-gray-400" },
          { label: "Well Controlled", value: stats.controlled, icon: Shield, colour: "text-green-600" },
          { label: "Reviews Due", value: stats.reviewDue, icon: Clock, colour: stats.reviewDue > 0 ? "text-amber-600" : "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      {stats.reviewDue > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Risk Assessments Due for Review</p>
            <p className="text-sm text-amber-700">{stats.reviewDue} assessment(s) are due or overdue for review. Environmental risk assessments must be reviewed regularly and after any incident.</p>
          </div>
        </div>
      )}

      <div id="risk-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search hazards or locations…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risks</SelectItem>
            {Object.entries(RISK_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="risk">Risk Level</SelectItem>
              <SelectItem value="review">Review Due</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expanded[r.id] ?? false;
          return (
            <div key={r.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(r.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{r.location}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", RISK_COLOURS[r.riskLevel])}>Risk: {RISK_LABELS[r.riskLevel]}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", RISK_COLOURS[r.residualRisk])}>Residual: {RISK_LABELS[r.residualRisk]}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[r.status])}>{STATUS_LABELS[r.status]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{CAT_LABELS[r.category]} · {r.controls.length} controls · Review {r.reviewDate}</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Hazard</h4>
                    <p className="text-sm">{r.hazard}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Who at risk:</span> <span className="font-medium">{r.whoAtRisk.join(", ")}</span></div>
                    <div><span className="text-gray-500">Assessed by:</span> <span className="font-medium">{getStaffName(r.assessedBy)}</span></div>
                    <div><span className="text-gray-500">Date:</span> <span className="font-medium">{r.assessmentDate}</span></div>
                    <div><span className="text-gray-500">Review:</span> <span className={cn("font-medium", r.reviewDate <= d(14) ? "text-amber-600" : "")}>{r.reviewDate}</span></div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1"><span className={cn("px-2 py-1 rounded text-xs font-medium", RISK_COLOURS[r.riskLevel])}>Initial: {RISK_LABELS[r.riskLevel]}</span></div>
                    <span className="text-gray-400">→</span>
                    <div className="flex items-center gap-1"><span className={cn("px-2 py-1 rounded text-xs font-medium", RISK_COLOURS[r.residualRisk])}>Residual: {RISK_LABELS[r.residualRisk]}</span></div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Control Measures</h4>
                    {r.controls.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        {c.effective ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />}
                        <div>
                          <p className="text-sm">{c.measure}</p>
                          <p className="text-xs text-gray-400">{getStaffName(c.implementedBy)} · {c.dateImplemented} · {c.effective ? "Effective" : "Needs review"}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {r.additionalActions.length > 0 && (
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1">Additional Actions Required</h4>
                      <ul className="list-disc list-inside text-sm text-amber-800 space-y-0.5">
                        {r.additionalActions.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Incident History</h4>
                    <p className="text-sm">{r.incidentHistory}</p>
                  </div>

                  {r.notes && <div><h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4><p className="text-sm text-gray-700">{r.notes}</p></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Health &amp; Safety at Work Act / Reg 25:</strong> The registered person must ensure the premises are safe, well-maintained and appropriate. Environmental risk assessments must identify hazards, assess likelihood and severity, implement control measures, and calculate residual risk. Assessments must be reviewed regularly, after any incident, and when circumstances change (new admission, building work, seasonal changes).
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Environmental Risk Assessment</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Category</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(CAT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Risk Level</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(RISK_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Location</label><input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. Main kitchen" /></div>
            <div><label className="text-sm font-medium">Hazard Description</label><textarea rows={2} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Describe the hazard…" /></div>
            <div><label className="text-sm font-medium">Who is at Risk?</label><input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. Young people, Staff, Visitors" /></div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={() => setDialogOpen(false)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Create Assessment</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
