"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Clock, Droplets, Thermometer, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type CheckType = "hot_temp" | "cold_temp" | "tmv_check" | "flush" | "showerhead_clean" | "tank_inspection" | "legionella_sample" | "dead_leg_flush" | "calorifier_check";
type Location = "kitchen_hot" | "kitchen_cold" | "bathroom_1_hot" | "bathroom_1_cold" | "bathroom_2_hot" | "bathroom_2_cold" | "en_suite_hot" | "en_suite_cold" | "utility_hot" | "utility_cold" | "header_tank" | "calorifier" | "bathroom_1_shower" | "bathroom_2_shower";
type Compliance = "compliant" | "non_compliant" | "action_required" | "remediated";

interface WaterRecord {
  id: string;
  date: string;
  time: string;
  checkedBy: string;
  checkType: CheckType;
  location: Location;
  temperature: number | null;
  targetMin: number | null;
  targetMax: number | null;
  compliance: Compliance;
  notes: string;
  actionRequired: string;
  actionCompleted: boolean;
  actionCompletedDate: string | null;
  nextDueDate: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const CHECK_LABEL: Record<CheckType, string> = {
  hot_temp: "Hot Water Temperature", cold_temp: "Cold Water Temperature",
  tmv_check: "TMV Check", flush: "Outlet Flush",
  showerhead_clean: "Showerhead Clean & Descale", tank_inspection: "Tank Inspection",
  legionella_sample: "Legionella Water Sample", dead_leg_flush: "Dead Leg Flush",
  calorifier_check: "Calorifier Check",
};

const LOCATION_LABEL: Record<Location, string> = {
  kitchen_hot: "Kitchen (Hot)", kitchen_cold: "Kitchen (Cold)",
  bathroom_1_hot: "Bathroom 1 (Hot)", bathroom_1_cold: "Bathroom 1 (Cold)",
  bathroom_2_hot: "Bathroom 2 (Hot)", bathroom_2_cold: "Bathroom 2 (Cold)",
  en_suite_hot: "En-Suite (Hot)", en_suite_cold: "En-Suite (Cold)",
  utility_hot: "Utility (Hot)", utility_cold: "Utility (Cold)",
  header_tank: "Header Tank", calorifier: "Calorifier",
  bathroom_1_shower: "Bathroom 1 (Shower)", bathroom_2_shower: "Bathroom 2 (Shower)",
};

const COMPLIANCE_LABEL: Record<Compliance, string> = { compliant: "Compliant", non_compliant: "Non-Compliant", action_required: "Action Required", remediated: "Remediated" };
const COMPLIANCE_CLR: Record<Compliance, string> = { compliant: "bg-green-100 text-green-800", non_compliant: "bg-red-100 text-red-800", action_required: "bg-amber-100 text-amber-800", remediated: "bg-blue-100 text-blue-800" };

const BORDER_COMP: Record<Compliance, string> = { compliant: "border-l-green-400", non_compliant: "border-l-red-600", action_required: "border-l-amber-400", remediated: "border-l-blue-400" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: WaterRecord[] = [
  // Monthly temperature checks — today
  { id: "wh_1", date: d(0), time: "08:00", checkedBy: "staff_darren", checkType: "hot_temp", location: "kitchen_hot", temperature: 62, targetMin: 50, targetMax: null, compliance: "compliant", notes: "Hot water at kitchen tap running for 1 minute. Temperature stable at 62°C.", actionRequired: "", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(30) },
  { id: "wh_2", date: d(0), time: "08:05", checkedBy: "staff_darren", checkType: "cold_temp", location: "kitchen_cold", temperature: 14, targetMin: null, targetMax: 20, compliance: "compliant", notes: "Cold water running for 2 minutes. Temperature stable at 14°C — well within limits.", actionRequired: "", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(30) },
  { id: "wh_3", date: d(0), time: "08:10", checkedBy: "staff_darren", checkType: "hot_temp", location: "bathroom_1_hot", temperature: 58, targetMin: 50, targetMax: null, compliance: "compliant", notes: "Bathroom 1 hot tap. Good flow rate. Temperature stable.", actionRequired: "", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(30) },
  { id: "wh_4", date: d(0), time: "08:15", checkedBy: "staff_darren", checkType: "cold_temp", location: "bathroom_1_cold", temperature: 22, targetMin: null, targetMax: 20, compliance: "non_compliant", notes: "Cold water temperature above 20°C limit. Pipe runs through airing cupboard — possible heat gain.", actionRequired: "Insulate cold water pipe where it passes through airing cupboard. Re-test in 48 hours. If still non-compliant, contact water hygiene contractor.", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(2) },
  { id: "wh_5", date: d(0), time: "08:20", checkedBy: "staff_darren", checkType: "tmv_check", location: "bathroom_2_hot", temperature: 43, targetMin: 38, targetMax: 44, compliance: "compliant", notes: "TMV on bathroom 2 basin functioning correctly. Mixed water output at safe temperature for children.", actionRequired: "", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(30) },
  // Weekly flushing — 3 days ago
  { id: "wh_6", date: d(-3), time: "07:00", checkedBy: "staff_edward", checkType: "flush", location: "en_suite_hot", temperature: null, targetMin: null, targetMax: null, compliance: "compliant", notes: "Guest en-suite — room unoccupied. Flushed hot and cold outlets for 2 minutes each. Clear water, no odour.", actionRequired: "", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(4) },
  { id: "wh_7", date: d(-3), time: "07:05", checkedBy: "staff_edward", checkType: "dead_leg_flush", location: "utility_hot", temperature: null, targetMin: null, targetMax: null, compliance: "compliant", notes: "Dead leg in utility room (old washing machine connection). Flushed for 3 minutes. Water clear after initial discolouration.", actionRequired: "", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(4) },
  // Quarterly showerhead clean
  { id: "wh_8", date: d(-14), time: "10:00", checkedBy: "staff_ryan", checkType: "showerhead_clean", location: "bathroom_1_shower", temperature: null, targetMin: null, targetMax: null, compliance: "compliant", notes: "Showerhead removed, descaled in citric acid solution for 1 hour, rinsed and refitted. Hose inspected — good condition. Flow rate normal.", actionRequired: "", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(76) },
  { id: "wh_9", date: d(-14), time: "10:30", checkedBy: "staff_ryan", checkType: "showerhead_clean", location: "bathroom_2_shower", temperature: null, targetMin: null, targetMax: null, compliance: "action_required", notes: "Showerhead heavily calcified. Descaling completed but hose shows signs of perishing near connector. Small amount of biofilm noted inside showerhead.", actionRequired: "Replace shower hose. Replace showerhead if biofilm recurs at next clean.", actionCompleted: true, actionCompletedDate: d(-10), nextDueDate: d(76) },
  // Annual legionella sample
  { id: "wh_10", date: d(-60), time: "09:00", checkedBy: "staff_darren", checkType: "legionella_sample", location: "header_tank", temperature: null, targetMin: null, targetMax: null, compliance: "compliant", notes: "Annual legionella risk assessment sample taken by Aqua-Safe Ltd. Results received: <100 cfu/L (acceptable level). Full report filed in H&S folder.", actionRequired: "", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(305) },
  // Calorifier check
  { id: "wh_11", date: d(-30), time: "14:00", checkedBy: "staff_darren", checkType: "calorifier_check", location: "calorifier", temperature: 65, targetMin: 60, targetMax: null, compliance: "compliant", notes: "Calorifier stored water temperature at 65°C. Thermostat functioning correctly. Drain valve checked — no sediment. Sacrificial anode inspected — approx 50% remaining. Replace at next service.", actionRequired: "Schedule anode replacement at next boiler service.", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(152) },
  // Tank inspection
  { id: "wh_12", date: d(-90), time: "11:00", checkedBy: "staff_darren", checkType: "tank_inspection", location: "header_tank", temperature: 16, targetMin: null, targetMax: 20, compliance: "compliant", notes: "Cold water storage tank inspection. Lid secure and intact. Insulation in good condition. No debris or contamination. Overflow pipe connected and discharging correctly. Ball valve functioning. Water temperature at 16°C.", actionRequired: "", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(275) },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function WaterHygienePage() {
  const [data] = useState(SEED);
  const [search, setSearch] = useState("");
  const [filterCompliance, setFilterCompliance] = useState("all");
  const [filterCheckType, setFilterCheckType] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── derived ─────────────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterCompliance !== "all" && r.compliance !== filterCompliance) return false;
      if (filterCheckType !== "all" && r.checkType !== filterCheckType) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          LOCATION_LABEL[r.location].toLowerCase().includes(q) ||
          CHECK_LABEL[r.checkType].toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date) || b.time.localeCompare(a.time);
        case "date-asc": return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
        case "compliance": {
          const order = ["non_compliant", "action_required", "remediated", "compliant"];
          return order.indexOf(a.compliance) - order.indexOf(b.compliance);
        }
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterCompliance, filterCheckType, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────────────── */

  const totalChecks = data.length;
  const compliantCount = data.filter((r) => r.compliance === "compliant").length;
  const nonCompliant = data.filter((r) => r.compliance === "non_compliant").length;
  const actionRequired = data.filter((r) => r.compliance === "action_required" && !r.actionCompleted).length;
  const overdueChecks = data.filter((r) => r.nextDueDate < d(0)).length;

  /* ── compliance schedule ─────────────────────────────────────────────────── */

  const upcomingChecks = useMemo(() => {
    return [...data]
      .filter((r) => r.nextDueDate >= d(0) && r.nextDueDate <= d(14))
      .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  }, [data]);

  /* ── export ──────────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<WaterRecord>[] = [
    { header: "Date", accessor: (r: WaterRecord) => r.date },
    { header: "Time", accessor: (r: WaterRecord) => r.time },
    { header: "Check Type", accessor: (r: WaterRecord) => CHECK_LABEL[r.checkType] },
    { header: "Location", accessor: (r: WaterRecord) => LOCATION_LABEL[r.location] },
    { header: "Temperature (°C)", accessor: (r: WaterRecord) => r.temperature !== null ? String(r.temperature) : "N/A" },
    { header: "Target Min", accessor: (r: WaterRecord) => r.targetMin !== null ? String(r.targetMin) : "" },
    { header: "Target Max", accessor: (r: WaterRecord) => r.targetMax !== null ? String(r.targetMax) : "" },
    { header: "Compliance", accessor: (r: WaterRecord) => COMPLIANCE_LABEL[r.compliance] },
    { header: "Notes", accessor: (r: WaterRecord) => r.notes },
    { header: "Action Required", accessor: (r: WaterRecord) => r.actionRequired },
    { header: "Action Completed", accessor: (r: WaterRecord) => r.actionCompleted ? `Yes — ${r.actionCompletedDate}` : "No" },
    { header: "Checked By", accessor: (r: WaterRecord) => getStaffName(r.checkedBy) },
    { header: "Next Due", accessor: (r: WaterRecord) => r.nextDueDate },
  ];

  /* ── render ──────────────────────────────────────────────────────────────── */

  return (
    <PageShell
      title="Water Hygiene & Legionella"
      subtitle="HSE ACOP L8 · HSG274 · Reg 12 — Protection of Children"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Water Hygiene Records" />
          <ExportButton data={filtered} columns={exportCols} filename="water-hygiene" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Record Check</Button>
        </div>
      }
    >
      <div id="print-area">
        {/* ── stat strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Checks", value: totalChecks, icon: Droplets, clr: "text-blue-600" },
            { label: "Compliant", value: compliantCount, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Non-Compliant", value: nonCompliant, icon: AlertTriangle, clr: "text-red-600" },
            { label: "Actions Outstanding", value: actionRequired, icon: Clock, clr: "text-amber-600" },
            { label: "Overdue Checks", value: overdueChecks, icon: ShieldCheck, clr: "text-purple-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── non-compliant alert ──────────────────────────────────────────── */}
        {nonCompliant > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">{nonCompliant} non-compliant reading(s) recorded</p>
              <p className="text-red-700">Immediate remedial action required. Cold water must be below 20°C and hot water stored above 60°C to prevent legionella growth.</p>
            </div>
          </div>
        )}

        {/* ── upcoming checks ──────────────────────────────────────────────── */}
        {upcomingChecks.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="font-semibold text-blue-800 text-sm mb-2 flex items-center gap-1"><Clock className="h-4 w-4" /> Upcoming Checks (Next 14 Days)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {upcomingChecks.map((r) => (
                <div key={r.id} className="bg-white rounded p-2 text-xs">
                  <p className="font-medium">{CHECK_LABEL[r.checkType]}</p>
                  <p className="text-muted-foreground">{LOCATION_LABEL[r.location]} · Due: {r.nextDueDate}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search location, check type, notes…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterCompliance} onValueChange={setFilterCompliance}><SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Compliance</SelectItem>{(Object.keys(COMPLIANCE_LABEL) as Compliance[]).map((k) => (<SelectItem key={k} value={k}>{COMPLIANCE_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterCheckType} onValueChange={setFilterCheckType}><SelectTrigger className="w-[200px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Check Types</SelectItem>{(Object.keys(CHECK_LABEL) as CheckType[]).map((k) => (<SelectItem key={k} value={k}>{CHECK_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date-desc">Newest First</SelectItem><SelectItem value="date-asc">Oldest First</SelectItem><SelectItem value="compliance">By Compliance</SelectItem></SelectContent></Select>
        </div>

        {/* ── records ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            const tempDisplay = r.temperature !== null ? `${r.temperature}°C` : "N/A";
            const tempOk = r.temperature !== null && (
              (r.targetMin !== null && r.temperature >= r.targetMin) &&
              (r.targetMax === null || r.temperature <= r.targetMax)
            ) || (
              r.temperature !== null &&
              r.targetMax !== null && r.targetMin === null &&
              r.temperature <= r.targetMax
            );

            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_COMP[r.compliance])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {CHECK_LABEL[r.checkType]}
                        <Badge variant="outline" className={COMPLIANCE_CLR[r.compliance]}>{COMPLIANCE_LABEL[r.compliance]}</Badge>
                        {r.temperature !== null && (
                          <Badge variant="outline" className={tempOk ? "bg-green-50" : "bg-red-50"}>
                            <Thermometer className="h-3 w-3 mr-1" /> {tempDisplay}
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {LOCATION_LABEL[r.location]} · {r.date} at {r.time} · By: {getStaffName(r.checkedBy)}
                      </p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* temperature reading */}
                    {r.temperature !== null && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-muted/40 rounded p-2 text-center">
                          <p className="font-medium text-xs">Reading</p>
                          <p className="text-lg font-bold">{tempDisplay}</p>
                        </div>
                        <div className="bg-muted/40 rounded p-2 text-center">
                          <p className="font-medium text-xs">Target Min</p>
                          <p className="text-lg font-bold">{r.targetMin !== null ? `${r.targetMin}°C` : "—"}</p>
                        </div>
                        <div className="bg-muted/40 rounded p-2 text-center">
                          <p className="font-medium text-xs">Target Max</p>
                          <p className="text-lg font-bold">{r.targetMax !== null ? `${r.targetMax}°C` : "—"}</p>
                        </div>
                      </div>
                    )}

                    {/* notes */}
                    <div>
                      <p className="font-medium mb-1">Notes</p>
                      <p className="text-muted-foreground">{r.notes}</p>
                    </div>

                    {/* action required */}
                    {r.actionRequired && (
                      <div className={cn("rounded-lg p-3", r.actionCompleted ? "bg-green-50" : "bg-amber-50")}>
                        <p className={cn("font-medium mb-1", r.actionCompleted ? "text-green-800" : "text-amber-800")}>
                          {r.actionCompleted ? "✓ Action Completed" : "⚠ Action Required"}
                        </p>
                        <p className={cn("text-xs", r.actionCompleted ? "text-green-700" : "text-amber-700")}>{r.actionRequired}</p>
                        {r.actionCompleted && r.actionCompletedDate && (
                          <p className="text-xs text-green-600 mt-1">Completed: {r.actionCompletedDate}</p>
                        )}
                      </div>
                    )}

                    {/* footer */}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Checked by: {getStaffName(r.checkedBy)}</span>
                      <span>Next due: {r.nextDueDate}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── check schedule ─────────────────────────────────────────────── */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Water Hygiene Monitoring Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {[
                { check: "Hot Water Temperature (all outlets)", freq: "Monthly", target: "≥ 50°C at outlet within 1 minute" },
                { check: "Cold Water Temperature (all outlets)", freq: "Monthly", target: "≤ 20°C at outlet within 2 minutes" },
                { check: "TMV Checks (all TMVs)", freq: "Monthly", target: "38–44°C at mixed outlet" },
                { check: "Outlet Flushing (infrequently used)", freq: "Weekly", target: "Flush for 2 minutes if unused for >7 days" },
                { check: "Dead Leg Flushing", freq: "Weekly", target: "Flush for 3 minutes" },
                { check: "Showerhead Clean & Descale", freq: "Quarterly", target: "Remove biofilm, descale, inspect hose" },
                { check: "Cold Water Tank Inspection", freq: "Annually", target: "Lid, insulation, ball valve, overflow" },
                { check: "Calorifier Inspection", freq: "Annually", target: "≥ 60°C stored, check anode, drain valve" },
                { check: "Legionella Water Sampling", freq: "Annually", target: "< 100 cfu/L acceptable" },
              ].map((s) => (
                <div key={s.check} className="bg-muted/30 rounded p-2">
                  <p className="font-medium">{s.check}</p>
                  <p className="text-muted-foreground">Frequency: {s.freq} · Target: {s.target}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── regulatory note ────────────────────────────────────────────── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>HSE Approved Code of Practice L8 — Legionnaires&apos; disease: control of legionella bacteria in water systems. HSG274 Part 2 — technical guidance for hot and cold water systems. Health and Safety at Work Act 1974. Children&apos;s Homes (England) Regulations 2015, Reg 12 — ensuring the premises are safe. Hot water stored above 60°C and distributed above 50°C within 1 minute. Cold water below 20°C. TMVs required on outlets accessible to children to prevent scalding. Annual risk assessment by competent person.</p>
        </div>
      </div>

      {/* ── new check dialog ───────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Water Hygiene Check</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date</Label><Input type="date" /></div>
            <div><Label>Time</Label><Input type="time" /></div>
            <div><Label>Check Type</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(CHECK_LABEL) as CheckType[]).map((k) => (<SelectItem key={k} value={k}>{CHECK_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Location</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(LOCATION_LABEL) as Location[]).map((k) => (<SelectItem key={k} value={k}>{LOCATION_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Temperature (°C)</Label><Input type="number" placeholder="e.g. 58" /></div>
            <div><Label>Compliance</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(COMPLIANCE_LABEL) as Compliance[]).map((k) => (<SelectItem key={k} value={k}>{COMPLIANCE_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea placeholder="Details of the check…" rows={3} /></div>
            <div className="col-span-2"><Label>Action Required</Label><Textarea placeholder="If non-compliant, what actions are needed?" rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={() => setShowNew(false)}>Save Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}