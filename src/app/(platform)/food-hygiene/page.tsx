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
  AlertTriangle, CheckCircle2, Clock, UtensilsCrossed, Thermometer, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type CheckType = "fridge_temp" | "freezer_temp" | "cooking_temp" | "cleaning_record" | "allergen_check" | "delivery_check" | "date_label_check" | "deep_clean" | "pest_check" | "hand_hygiene_audit";
type Compliance = "pass" | "fail" | "action_required" | "n_a";

interface FoodHygieneRecord {
  id: string;
  date: string;
  time: string;
  checkedBy: string;
  checkType: CheckType;
  compliance: Compliance;
  temperature: number | null;
  targetMin: number | null;
  targetMax: number | null;
  area: string;
  details: string;
  actionRequired: string;
  actionCompleted: boolean;
  actionCompletedDate: string | null;
  nextDueDate: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const CHECK_LABEL: Record<CheckType, string> = {
  fridge_temp: "Fridge Temperature", freezer_temp: "Freezer Temperature",
  cooking_temp: "Cooking Temperature", cleaning_record: "Cleaning Record",
  allergen_check: "Allergen Check", delivery_check: "Delivery Check",
  date_label_check: "Date Label Check", deep_clean: "Deep Clean",
  pest_check: "Pest Inspection", hand_hygiene_audit: "Hand Hygiene Audit",
};
const COMPLIANCE_LABEL: Record<Compliance, string> = { pass: "Pass", fail: "Fail", action_required: "Action Required", n_a: "N/A" };
const COMPLIANCE_CLR: Record<Compliance, string> = { pass: "bg-green-100 text-green-800", fail: "bg-red-100 text-red-800", action_required: "bg-amber-100 text-amber-800", n_a: "bg-slate-100 text-slate-800" };
const BORDER_COMP: Record<Compliance, string> = { pass: "border-l-green-400", fail: "border-l-red-600", action_required: "border-l-amber-400", n_a: "border-l-slate-300" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: FoodHygieneRecord[] = [
  { id: "fh_1", date: d(0), time: "07:00", checkedBy: "staff_edward", checkType: "fridge_temp", compliance: "pass", temperature: 3.5, targetMin: 0, targetMax: 5, area: "Main kitchen fridge", details: "Morning fridge temperature check. Dial thermometer reading 3.5°C. Contents stored correctly — raw below cooked. All items covered.", actionRequired: "", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(1) },
  { id: "fh_2", date: d(0), time: "07:05", checkedBy: "staff_edward", checkType: "freezer_temp", compliance: "pass", temperature: -19, targetMin: null, targetMax: -18, area: "Chest freezer", details: "Freezer temperature -19°C. No frost build-up. Items dated and rotated correctly. Oldest item: chicken breasts dated " + d(-14) + " — within 3-month window.", actionRequired: "", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(1) },
  { id: "fh_3", date: d(0), time: "07:10", checkedBy: "staff_edward", checkType: "fridge_temp", compliance: "fail", temperature: 7.2, targetMin: 0, targetMax: 5, area: "Drinks fridge (dining room)", details: "Drinks fridge running at 7.2°C — above 5°C limit. Door seal appears loose on bottom edge. Fridge packed quite full — may be restricting airflow.", actionRequired: "Adjust thermostat down. Remove excess items to allow airflow. Check door seal — may need replacement. Re-check in 2 hours. If still above 5°C, move perishable items to main kitchen fridge and arrange repair.", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(0) },
  { id: "fh_4", date: d(-1), time: "17:30", checkedBy: "staff_anna", checkType: "cooking_temp", compliance: "pass", temperature: 78, targetMin: 75, targetMax: null, area: "Kitchen — oven", details: "Chicken casserole probe temperature check before serving. Core temperature 78°C at thickest point. Probe cleaned with antibacterial wipe before and after use.", actionRequired: "", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(0) },
  { id: "fh_5", date: d(-1), time: "20:00", checkedBy: "staff_chervelle", checkType: "cleaning_record", compliance: "pass", temperature: null, targetMin: null, targetMax: null, area: "Full kitchen", details: "End of day kitchen clean completed. Surfaces wiped with antibacterial spray. Hob cleaned. Floor swept and mopped. Bins emptied. Tea towels changed. Dishwasher run. Chopping boards sanitised. Sink and draining area cleaned.", actionRequired: "", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(0) },
  { id: "fh_6", date: d(-3), time: "09:00", checkedBy: "staff_darren", checkType: "date_label_check", compliance: "action_required", temperature: null, targetMin: null, targetMax: null, area: "Main kitchen fridge + cupboards", details: "Weekly date label check. Main fridge: all items within date. Cupboards: found 1 tin of chopped tomatoes past best-before date (" + d(-10) + "), 1 packet of dried pasta past best-before (" + d(-30) + "). Both discarded. Also found an open jar of peanut butter with no 'opened' date written on it.", actionRequired: "Remind all staff to write date opened on all jars and packets when first opened. Peanut butter discarded as precaution. Note: best-before dates on tins/pasta are quality indicators, not safety — but policy is to discard anything past date.", actionCompleted: true, actionCompletedDate: d(-3), nextDueDate: d(4) },
  { id: "fh_7", date: d(-7), time: "11:00", checkedBy: "staff_darren", checkType: "allergen_check", compliance: "pass", temperature: null, targetMin: null, targetMax: null, area: "Kitchen — allergen folder", details: "Monthly allergen review. Allergen matrix updated for current menu plan. Alex: no known allergies. Jordan: sensory food aversions (not allergies). Casey: suspected dairy sensitivity (lactose) — oat milk alternative maintained in stock. All allergen labels checked on stored products. Separate utensils used for dairy-free cooking clearly labelled.", actionRequired: "", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(23) },
  { id: "fh_8", date: d(-30), time: "10:00", checkedBy: "staff_darren", checkType: "deep_clean", compliance: "pass", temperature: null, targetMin: null, targetMax: null, area: "Full kitchen deep clean", details: "Monthly deep clean completed. Behind and under all appliances cleaned. Oven interior degreased. Extractor fan filters removed and washed. Inside of fridge and freezer wiped down. All cupboard shelves wiped. Tiles and grout cleaned. Light fittings dusted. Waste disposal area sanitised.", actionRequired: "", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(0) },
  { id: "fh_9", date: d(-90), time: "10:00", checkedBy: "staff_darren", checkType: "pest_check", compliance: "pass", temperature: null, targetMin: null, targetMax: null, area: "Kitchen and pantry", details: "Quarterly pest inspection. No evidence of rodent droppings, gnaw marks, or nesting material. No insect activity. Bait stations checked by Rentokil — no take. External bins clean and lids closing properly. Gaps around pipework sealed. Proofing intact.", actionRequired: "", actionCompleted: false, actionCompletedDate: null, nextDueDate: d(0) },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function FoodHygienePage() {
  const [data] = useState(SEED);
  const [search, setSearch] = useState("");
  const [filterCompliance, setFilterCompliance] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterCompliance !== "all" && r.compliance !== filterCompliance) return false;
      if (filterType !== "all" && r.checkType !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.area.toLowerCase().includes(q) || r.details.toLowerCase().includes(q) || CHECK_LABEL[r.checkType].toLowerCase().includes(q);
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date) || b.time.localeCompare(a.time);
        case "date-asc": return a.date.localeCompare(b.date);
        case "compliance": { const o = ["fail", "action_required", "pass", "n_a"]; return o.indexOf(a.compliance) - o.indexOf(b.compliance); }
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterCompliance, filterType, sortBy]);

  const totalChecks = data.length;
  const passCount = data.filter((r) => r.compliance === "pass").length;
  const failCount = data.filter((r) => r.compliance === "fail").length;
  const actionReq = data.filter((r) => r.compliance === "action_required" && !r.actionCompleted).length;

  const exportCols: ExportColumn<FoodHygieneRecord>[] = [
    { header: "Date", accessor: (r: FoodHygieneRecord) => r.date },
    { header: "Time", accessor: (r: FoodHygieneRecord) => r.time },
    { header: "Check Type", accessor: (r: FoodHygieneRecord) => CHECK_LABEL[r.checkType] },
    { header: "Area", accessor: (r: FoodHygieneRecord) => r.area },
    { header: "Compliance", accessor: (r: FoodHygieneRecord) => COMPLIANCE_LABEL[r.compliance] },
    { header: "Temperature", accessor: (r: FoodHygieneRecord) => r.temperature !== null ? String(r.temperature) + "°C" : "N/A" },
    { header: "Details", accessor: (r: FoodHygieneRecord) => r.details },
    { header: "Action", accessor: (r: FoodHygieneRecord) => r.actionRequired },
    { header: "Checked By", accessor: (r: FoodHygieneRecord) => getStaffName(r.checkedBy) },
    { header: "Next Due", accessor: (r: FoodHygieneRecord) => r.nextDueDate },
  ];

  return (
    <PageShell title="Food Hygiene & Safety" subtitle="Food Safety Act 1990 · HACCP · Reg 12 — Safe Environment" actions={<div className="flex items-center gap-2"><PrintButton title="Food Hygiene Records" /><ExportButton data={filtered} columns={exportCols} filename="food-hygiene" /><Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Record Check</Button></div>}>
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Checks", value: totalChecks, icon: UtensilsCrossed, clr: "text-blue-600" },
            { label: "Pass", value: passCount, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Fail", value: failCount, icon: AlertTriangle, clr: "text-red-600" },
            { label: "Actions Outstanding", value: actionReq, icon: Clock, clr: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="pt-4 pb-3 text-center"><s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} /><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>

        {failCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm"><p className="font-semibold text-red-800">{failCount} check(s) failed</p><p className="text-red-700">Immediate corrective action required. Temperature failures may require disposal of affected food items.</p></div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search area, details, type…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={filterCompliance} onValueChange={setFilterCompliance}><SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Results</SelectItem>{(Object.keys(COMPLIANCE_LABEL) as Compliance[]).map((k) => (<SelectItem key={k} value={k}>{COMPLIANCE_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{(Object.keys(CHECK_LABEL) as CheckType[]).map((k) => (<SelectItem key={k} value={k}>{CHECK_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date-desc">Newest First</SelectItem><SelectItem value="date-asc">Oldest First</SelectItem><SelectItem value="compliance">By Result</SelectItem></SelectContent></Select>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_COMP[r.compliance])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {CHECK_LABEL[r.checkType]}
                        <Badge variant="outline" className={COMPLIANCE_CLR[r.compliance]}>{COMPLIANCE_LABEL[r.compliance]}</Badge>
                        {r.temperature !== null && <Badge variant="outline" className={r.compliance === "pass" ? "bg-green-50" : "bg-red-50"}><Thermometer className="h-3 w-3 mr-1" />{r.temperature}°C</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{r.area} · {r.date} at {r.time} · By: {getStaffName(r.checkedBy)}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {r.temperature !== null && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Reading</p><p className="text-lg font-bold">{r.temperature}°C</p></div>
                        <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Min</p><p className="text-lg font-bold">{r.targetMin !== null ? `${r.targetMin}°C` : "—"}</p></div>
                        <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Max</p><p className="text-lg font-bold">{r.targetMax !== null ? `${r.targetMax}°C` : "—"}</p></div>
                      </div>
                    )}
                    <div><p className="font-medium mb-1">Details</p><p className="text-muted-foreground">{r.details}</p></div>
                    {r.actionRequired && (
                      <div className={cn("rounded-lg p-3", r.actionCompleted ? "bg-green-50" : "bg-amber-50")}>
                        <p className={cn("font-medium mb-1", r.actionCompleted ? "text-green-800" : "text-amber-800")}>{r.actionCompleted ? "✓ Action Completed" : "⚠ Action Required"}</p>
                        <p className={cn("text-xs", r.actionCompleted ? "text-green-700" : "text-amber-700")}>{r.actionRequired}</p>
                        {r.actionCompleted && r.actionCompletedDate && <p className="text-xs text-green-600 mt-1">Completed: {r.actionCompletedDate}</p>}
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground"><span>Checked by: {getStaffName(r.checkedBy)}</span><span>Next due: {r.nextDueDate}</span></div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Food Safety Act 1990 — legal obligation to ensure food is safe to eat. Food Hygiene Regulations 2006 — HACCP principles. Food Standards Agency guidance. Children&apos;s Homes (England) Regulations 2015, Reg 12 — safe environment. Fridge ≤5°C, freezer ≤-18°C, cooked food core temp ≥75°C. Allergen information must be available for all meals served. Level 2 Food Hygiene certificate required for all staff preparing food.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Food Hygiene Check</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date</Label><Input type="date" /></div>
            <div><Label>Time</Label><Input type="time" /></div>
            <div><Label>Check Type</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(CHECK_LABEL) as CheckType[]).map((k) => (<SelectItem key={k} value={k}>{CHECK_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Area</Label><Input placeholder="e.g. Main kitchen fridge" /></div>
            <div><Label>Temperature (°C)</Label><Input type="number" placeholder="If applicable" /></div>
            <div><Label>Result</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(COMPLIANCE_LABEL) as Compliance[]).map((k) => (<SelectItem key={k} value={k}>{COMPLIANCE_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Details</Label><Textarea rows={3} placeholder="Details of the check…" /></div>
            <div className="col-span-2"><Label>Action Required</Label><Textarea rows={2} placeholder="If failed, what actions?" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={() => setShowNew(false)}>Save Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}