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
  AlertTriangle, CheckCircle2, Clock, Hammer, PoundSterling,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type DamageType = "accidental" | "deliberate" | "wear_and_tear" | "environmental" | "unknown";
type Severity = "minor" | "moderate" | "major" | "structural";
type RepairStatus = "reported" | "assessed" | "repair_scheduled" | "repaired" | "write_off" | "insurance_claim";
type Location = "bedroom" | "bathroom" | "kitchen" | "living_room" | "hallway" | "garden" | "office" | "utility" | "exterior" | "vehicle" | "communal";

interface DamageRecord {
  id: string;
  date: string;
  time: string;
  reportedBy: string;
  location: Location;
  specificArea: string;
  damageType: DamageType;
  severity: Severity;
  status: RepairStatus;
  responsiblePersonId: string | null;
  responsiblePersonName: string;
  description: string;
  photographsTaken: boolean;
  estimatedCost: number;
  actualCost: number | null;
  insuranceClaimed: boolean;
  insuranceRef: string | null;
  repairDetails: string;
  repairCompletedDate: string | null;
  linkedIncidentId: string | null;
  behaviourContext: string;
  riskAssessmentUpdated: boolean;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const TYPE_LABEL: Record<DamageType, string> = { accidental: "Accidental", deliberate: "Deliberate", wear_and_tear: "Wear & Tear", environmental: "Environmental", unknown: "Unknown" };
const TYPE_CLR: Record<DamageType, string> = { accidental: "bg-blue-100 text-blue-800", deliberate: "bg-red-100 text-red-800", wear_and_tear: "bg-slate-100 text-slate-800", environmental: "bg-amber-100 text-amber-800", unknown: "bg-gray-100 text-gray-800" };
const SEVERITY_LABEL: Record<Severity, string> = { minor: "Minor", moderate: "Moderate", major: "Major", structural: "Structural" };
const SEVERITY_CLR: Record<Severity, string> = { minor: "bg-green-100 text-green-800", moderate: "bg-yellow-100 text-yellow-800", major: "bg-orange-100 text-orange-800", structural: "bg-red-100 text-red-800" };
const STATUS_LABEL: Record<RepairStatus, string> = { reported: "Reported", assessed: "Assessed", repair_scheduled: "Repair Scheduled", repaired: "Repaired", write_off: "Written Off", insurance_claim: "Insurance Claim" };
const STATUS_CLR: Record<RepairStatus, string> = { reported: "bg-blue-100 text-blue-800", assessed: "bg-indigo-100 text-indigo-800", repair_scheduled: "bg-purple-100 text-purple-800", repaired: "bg-green-100 text-green-800", write_off: "bg-slate-100 text-slate-800", insurance_claim: "bg-amber-100 text-amber-800" };
const LOC_LABEL: Record<Location, string> = { bedroom: "Bedroom", bathroom: "Bathroom", kitchen: "Kitchen", living_room: "Living Room", hallway: "Hallway", garden: "Garden", office: "Office", utility: "Utility", exterior: "Exterior", vehicle: "Vehicle", communal: "Communal Area" };
const BORDER_TYPE: Record<DamageType, string> = { accidental: "border-l-blue-400", deliberate: "border-l-red-500", wear_and_tear: "border-l-slate-400", environmental: "border-l-amber-400", unknown: "border-l-gray-400" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: DamageRecord[] = [
  {
    id: "pd_1", date: d(-2), time: "19:45", reportedBy: "staff_chervelle",
    location: "bedroom", specificArea: "Alex's bedroom — interior door",
    damageType: "deliberate", severity: "moderate", status: "repair_scheduled",
    responsiblePersonId: "yp_alex", responsiblePersonName: "Alex",
    description: "Alex punched the interior of his bedroom door during an incident related to a phone confiscation. Door panel cracked — visible split running approximately 30cm vertically. Door still functions but structural integrity compromised.",
    photographsTaken: true, estimatedCost: 120, actualCost: null,
    insuranceClaimed: false, insuranceRef: null,
    repairDetails: "Maintenance contractor notified. Replacement hollow-core door ordered (matching specification). Fitting scheduled for " + d(5) + ". Interim: door functional but monitored.",
    repairCompletedDate: null, linkedIncidentId: "INC-2024-089",
    behaviourContext: "Alex was asked to hand in his phone at 9pm per his device agreement. He became dysregulated and punched the door. He was not physically aggressive towards staff. He calmed within 10 minutes and apologised. De-escalation techniques used effectively. Alex later reflected on the incident in a 1:1 with Darren — acknowledged he was 'angry about the phone rule, not at anyone'. BSP reviewed — door-punching identified as Alex's primary displacement behaviour when overwhelmed.",
    riskAssessmentUpdated: true,
    notes: "Third door damage this placement (previously: March — kicked, repaired; January — punched, minor dent). Pattern identified and discussed with SW. BSP updated to include de-escalation before phone handover time.",
  },
  {
    id: "pd_2", date: d(-7), time: "08:30", reportedBy: "staff_darren",
    location: "kitchen", specificArea: "Kitchen window — lower pane",
    damageType: "accidental", severity: "minor", status: "repaired",
    responsiblePersonId: "yp_jordan", responsiblePersonName: "Jordan",
    description: "Jordan accidentally knocked a mug off the kitchen counter while making breakfast. Mug bounced off counter and hit the lower kitchen window pane, causing a small chip (approx 1cm) in the corner of the glass. No shatter. Window still intact and functional.",
    photographsTaken: true, estimatedCost: 0, actualCost: 0,
    insuranceClaimed: false, insuranceRef: null,
    repairDetails: "Chip assessed by maintenance — too small to require glass replacement. Safety film applied over chip area as precaution. Added to annual window replacement schedule.",
    repairCompletedDate: d(-6), linkedIncidentId: null,
    behaviourContext: "Genuine accident. Jordan was making toast and turned quickly with a mug. Jordan was upset about the damage — reassured by staff that accidents happen. No behavioural concerns.",
    riskAssessmentUpdated: false,
    notes: "Jordan offered to pay from pocket money — declined by RM. Reassured that it was an accident.",
  },
  {
    id: "pd_3", date: d(-14), time: "22:15", reportedBy: "staff_lackson",
    location: "hallway", specificArea: "Hallway wall — between living room and stairs",
    damageType: "deliberate", severity: "minor", status: "repaired",
    responsiblePersonId: "yp_casey", responsiblePersonName: "Casey",
    description: "Casey kicked the hallway wall during a verbal altercation with Alex. Small indentation in plasterboard approximately 5cm in diameter. Paint cracked around the impact area.",
    photographsTaken: false, estimatedCost: 25, actualCost: 20,
    insuranceClaimed: false, insuranceRef: null,
    repairDetails: "Plaster filler applied by Ryan. Sanded and repainted to match. Repair completed within 48 hours.",
    repairCompletedDate: d(-12), linkedIncidentId: "INC-2024-085",
    behaviourContext: "Casey and Alex had an argument about TV channel choice. Casey walked away (good de-escalation) but kicked the wall in the hallway. Casey later apologised. Discussed in next key work session — Casey identified that walking away was positive but needs a safe space to express frustration physically (stress ball, pillow punch provided in bedroom).",
    riskAssessmentUpdated: false,
    notes: "Relatively minor incident. Casey's coping strategies improving — walking away from conflict is progress.",
  },
  {
    id: "pd_4", date: d(-30), time: "14:00", reportedBy: "staff_darren",
    location: "garden", specificArea: "Garden shed — roof and door",
    damageType: "environmental", severity: "moderate", status: "assessed",
    responsiblePersonId: null, responsiblePersonName: "N/A — storm damage",
    description: "Storm damage during high winds. Shed roof felt partially lifted and door blown off one hinge. Contents (garden toys, tools) got wet. No structural collapse but shed unusable in current state.",
    photographsTaken: true, estimatedCost: 350, actualCost: null,
    insuranceClaimed: true, insuranceRef: "INS-2024-PD-0041",
    repairDetails: "Insurance claim submitted with photographs. Awaiting assessor visit scheduled for " + d(3) + ". Shed contents moved to temporary storage. Garden tools secured in utility room.",
    repairCompletedDate: null, linkedIncidentId: null,
    behaviourContext: "N/A — weather damage",
    riskAssessmentUpdated: true,
    notes: "Environmental risk assessment updated to include shed condition. YP reminded not to enter shed until repaired.",
  },
  {
    id: "pd_5", date: d(-45), time: "16:30", reportedBy: "staff_ryan",
    location: "living_room", specificArea: "Living room sofa — 3-seater",
    damageType: "wear_and_tear", severity: "minor", status: "assessed",
    responsiblePersonId: null, responsiblePersonName: "N/A — general wear",
    description: "Living room 3-seater sofa arm cushion seam splitting. Foam visible. Sofa is 3 years old and heavily used. Fabric worn on seat cushions. Not a sudden damage event — gradual deterioration.",
    photographsTaken: false, estimatedCost: 500, actualCost: null,
    insuranceClaimed: false, insuranceRef: null,
    repairDetails: "Quoted for reupholstery (£300) vs replacement (£500). RM recommends replacement as overall condition is poor. Budget request submitted to RI. Temporary cushion cover placed over split seam.",
    repairCompletedDate: null, linkedIncidentId: null,
    behaviourContext: "N/A — natural wear and tear",
    riskAssessmentUpdated: false,
    notes: "Added to quarterly expenditure request. No safety concern — cosmetic issue.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function PropertyDamagePage() {
  const [data] = useState(SEED);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterType !== "all" && r.damageType !== filterType) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.description.toLowerCase().includes(q) || r.specificArea.toLowerCase().includes(q) || r.responsiblePersonName.toLowerCase().includes(q);
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date);
        case "date-asc": return a.date.localeCompare(b.date);
        case "cost": return (b.estimatedCost) - (a.estimatedCost);
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterType, filterStatus, sortBy]);

  const totalRecords = data.length;
  const deliberate = data.filter((r) => r.damageType === "deliberate").length;
  const awaitingRepair = data.filter((r) => r.status !== "repaired" && r.status !== "write_off").length;
  const totalEstCost = data.reduce((sum, r) => sum + r.estimatedCost, 0);
  const insuranceClaims = data.filter((r) => r.insuranceClaimed).length;

  const exportCols: ExportColumn<DamageRecord>[] = [
    { header: "Date", accessor: (r: DamageRecord) => r.date },
    { header: "Location", accessor: (r: DamageRecord) => r.specificArea },
    { header: "Type", accessor: (r: DamageRecord) => TYPE_LABEL[r.damageType] },
    { header: "Severity", accessor: (r: DamageRecord) => SEVERITY_LABEL[r.severity] },
    { header: "Status", accessor: (r: DamageRecord) => STATUS_LABEL[r.status] },
    { header: "Responsible", accessor: (r: DamageRecord) => r.responsiblePersonName },
    { header: "Description", accessor: (r: DamageRecord) => r.description },
    { header: "Est. Cost (£)", accessor: (r: DamageRecord) => String(r.estimatedCost) },
    { header: "Insurance", accessor: (r: DamageRecord) => r.insuranceClaimed ? `Yes (${r.insuranceRef})` : "No" },
    { header: "Reported By", accessor: (r: DamageRecord) => getStaffName(r.reportedBy) },
  ];

  return (
    <PageShell title="Property Damage Log" subtitle="Asset Management · Insurance Records · Behaviour Context" actions={<div className="flex items-center gap-2"><PrintButton title="Property Damage Log" /><ExportButton data={filtered} columns={exportCols} filename="property-damage" /><Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Report Damage</Button></div>}>
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Records", value: totalRecords, icon: Hammer, clr: "text-blue-600" },
            { label: "Deliberate", value: deliberate, icon: AlertTriangle, clr: "text-red-600" },
            { label: "Awaiting Repair", value: awaitingRepair, icon: Clock, clr: "text-amber-600" },
            { label: "Est. Total Cost", value: `£${totalEstCost}`, icon: PoundSterling, clr: "text-purple-600" },
            { label: "Insurance Claims", value: insuranceClaims, icon: CheckCircle2, clr: "text-indigo-600" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="pt-4 pb-3 text-center"><s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} /><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search description, location, person…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{(Object.keys(TYPE_LABEL) as DamageType[]).map((k) => (<SelectItem key={k} value={k}>{TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{(Object.keys(STATUS_LABEL) as RepairStatus[]).map((k) => (<SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date-desc">Newest First</SelectItem><SelectItem value="date-asc">Oldest First</SelectItem><SelectItem value="cost">By Cost</SelectItem></SelectContent></Select>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_TYPE[r.damageType])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {r.specificArea}
                        <Badge variant="outline" className={TYPE_CLR[r.damageType]}>{TYPE_LABEL[r.damageType]}</Badge>
                        <Badge variant="outline" className={SEVERITY_CLR[r.severity]}>{SEVERITY_LABEL[r.severity]}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{r.date} at {r.time} · {r.responsiblePersonName} · Est. £{r.estimatedCost}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div><p className="font-medium mb-1">Description</p><p className="text-muted-foreground">{r.description}</p></div>
                    {r.behaviourContext && r.behaviourContext !== "N/A — weather damage" && r.behaviourContext !== "N/A — natural wear and tear" && (
                      <div className="bg-blue-50 rounded-lg p-3"><p className="font-medium text-blue-800 mb-1">Behaviour Context</p><p className="text-blue-700 text-xs">{r.behaviourContext}</p></div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2"><p className="font-medium text-xs">Est. Cost</p><p className="text-xs text-muted-foreground">£{r.estimatedCost}</p></div>
                      <div className="bg-muted/40 rounded p-2"><p className="font-medium text-xs">Actual Cost</p><p className="text-xs text-muted-foreground">{r.actualCost !== null ? `£${r.actualCost}` : "TBC"}</p></div>
                      <div className="bg-muted/40 rounded p-2"><p className="font-medium text-xs">Photos</p><p className="text-xs text-muted-foreground">{r.photographsTaken ? "Yes" : "No"}</p></div>
                      <div className="bg-muted/40 rounded p-2"><p className="font-medium text-xs">Insurance</p><p className="text-xs text-muted-foreground">{r.insuranceClaimed ? `Yes — ${r.insuranceRef}` : "No"}</p></div>
                    </div>
                    {r.repairDetails && (
                      <div className={cn("rounded-lg p-3", r.repairCompletedDate ? "bg-green-50" : "bg-amber-50")}>
                        <p className={cn("font-medium mb-1", r.repairCompletedDate ? "text-green-800" : "text-amber-800")}>{r.repairCompletedDate ? "✓ Repair Completed" : "⏳ Repair Details"}</p>
                        <p className={cn("text-xs", r.repairCompletedDate ? "text-green-700" : "text-amber-700")}>{r.repairDetails}</p>
                        {r.repairCompletedDate && <p className="text-xs text-green-600 mt-1">Completed: {r.repairCompletedDate}</p>}
                      </div>
                    )}
                    {r.linkedIncidentId && <Badge variant="outline" className="bg-muted/30">Linked Incident: {r.linkedIncidentId}</Badge>}
                    {r.riskAssessmentUpdated && <Badge variant="outline" className="bg-purple-50">Risk Assessment Updated</Badge>}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Reported by: {getStaffName(r.reportedBy)}</span>
                      <span>Location: {LOC_LABEL[r.location]}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Recording Guidance</p>
          <p>All property damage must be recorded regardless of cause or value. Deliberate damage should be cross-referenced with incident reports and behaviour support plans. Patterns of property damage may indicate unmet needs and should be discussed in supervision and key work sessions. Insurance claims require photographs and written descriptions. Children should never be made to feel punished for accidental damage. Cost recovery from children in care is not permitted under Children Act 1989.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Report Property Damage</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date</Label><Input type="date" /></div>
            <div><Label>Time</Label><Input type="time" /></div>
            <div><Label>Location</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(LOC_LABEL) as Location[]).map((k) => (<SelectItem key={k} value={k}>{LOC_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Damage Type</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(TYPE_LABEL) as DamageType[]).map((k) => (<SelectItem key={k} value={k}>{TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Specific Area</Label><Input placeholder="e.g. Alex's bedroom door" /></div>
            <div className="col-span-2"><Label>Description</Label><Textarea rows={3} placeholder="What was damaged and how?" /></div>
            <div><Label>Severity</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(SEVERITY_LABEL) as Severity[]).map((k) => (<SelectItem key={k} value={k}>{SEVERITY_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Estimated Cost (£)</Label><Input type="number" placeholder="0" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={() => setShowNew(false)}>Save Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}