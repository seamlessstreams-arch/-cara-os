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
  AlertTriangle, CheckCircle2, Clock, Pill, Package, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type AuditType = "stock_check" | "controlled_drug_check" | "destruction" | "expiry_review" | "storage_check" | "reconciliation" | "return_to_pharmacy";
type AuditResult = "satisfactory" | "discrepancy_found" | "action_required" | "completed";
type MedicationType = "regular" | "prn" | "controlled" | "otc" | "homely_remedy";

interface MedicationAuditRecord {
  id: string;
  date: string;
  time: string;
  auditedBy: string;
  witnessedBy: string | null;
  auditType: AuditType;
  result: AuditResult;
  youngPersonId: string;
  medicationName: string;
  medicationType: MedicationType;
  strength: string;
  expectedCount: number | null;
  actualCount: number | null;
  discrepancy: number;
  expiryDate: string | null;
  batchNumber: string;
  storageCorrect: boolean;
  temperatureOk: boolean;
  labellingCorrect: boolean;
  destructionMethod: string | null;
  destructionWitness: string | null;
  pharmacyName: string;
  notes: string;
  actionTaken: string;
  followUpRequired: boolean;
  followUpDate: string | null;
  signedOffBy: string | null;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const AUDIT_TYPE_LABEL: Record<AuditType, string> = {
  stock_check: "Stock Count", controlled_drug_check: "Controlled Drug Check",
  destruction: "Medication Destruction", expiry_review: "Expiry Review",
  storage_check: "Storage Inspection", reconciliation: "MAR Reconciliation",
  return_to_pharmacy: "Return to Pharmacy",
};
const AUDIT_TYPE_CLR: Record<AuditType, string> = {
  stock_check: "bg-blue-100 text-blue-800", controlled_drug_check: "bg-purple-100 text-purple-800",
  destruction: "bg-red-100 text-red-800", expiry_review: "bg-amber-100 text-amber-800",
  storage_check: "bg-green-100 text-green-800", reconciliation: "bg-indigo-100 text-indigo-800",
  return_to_pharmacy: "bg-slate-100 text-slate-800",
};

const RESULT_LABEL: Record<AuditResult, string> = { satisfactory: "Satisfactory", discrepancy_found: "Discrepancy Found", action_required: "Action Required", completed: "Completed" };
const RESULT_CLR: Record<AuditResult, string> = { satisfactory: "bg-green-100 text-green-800", discrepancy_found: "bg-red-100 text-red-800", action_required: "bg-amber-100 text-amber-800", completed: "bg-slate-100 text-slate-800" };
const MED_TYPE_LABEL: Record<MedicationType, string> = { regular: "Regular", prn: "PRN (As Needed)", controlled: "Controlled Drug", otc: "Over the Counter", homely_remedy: "Homely Remedy" };

const BORDER_RES: Record<AuditResult, string> = { satisfactory: "border-l-green-400", discrepancy_found: "border-l-red-600", action_required: "border-l-amber-400", completed: "border-l-slate-400" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: MedicationAuditRecord[] = [
  {
    id: "ma_1", date: d(-1), time: "09:00", auditedBy: "staff_darren", witnessedBy: "staff_ryan",
    auditType: "stock_check", result: "satisfactory", youngPersonId: "yp_alex",
    medicationName: "Melatonin", medicationType: "regular", strength: "3mg",
    expectedCount: 24, actualCount: 24, discrepancy: 0,
    expiryDate: d(180), batchNumber: "MEL-2024-8842",
    storageCorrect: true, temperatureOk: true, labellingCorrect: true,
    destructionMethod: null, destructionWitness: null, pharmacyName: "Boots Pharmacy, High Street",
    notes: "Monthly stock check. All 24 tablets accounted for. MAR chart cross-referenced — administration records match stock count. Medication stored correctly in locked cabinet at room temperature.",
    actionTaken: "", followUpRequired: false, followUpDate: null, signedOffBy: "staff_darren",
  },
  {
    id: "ma_2", date: d(-1), time: "09:15", auditedBy: "staff_darren", witnessedBy: "staff_ryan",
    auditType: "stock_check", result: "discrepancy_found", youngPersonId: "yp_jordan",
    medicationName: "Methylphenidate (Concerta XL)", medicationType: "controlled", strength: "36mg",
    expectedCount: 27, actualCount: 26, discrepancy: -1,
    expiryDate: d(240), batchNumber: "CON-2024-1156",
    storageCorrect: true, temperatureOk: true, labellingCorrect: true,
    destructionMethod: null, destructionWitness: null, pharmacyName: "Lloyds Pharmacy, Oak Lane",
    notes: "Monthly controlled drug check. Expected 27 tablets, actual count 26. MAR chart shows 3 administrations since last audit (correct), but stock received was recorded as 30 — recalculation suggests recording error at last intake. Previous audit showed 30 received, 0 carried forward = 30 total. 3 administered = 27 expected. However, re-count confirmed 26 present.",
    actionTaken: "Incident form completed. All staff who administered since last audit interviewed. CCTV reviewed for medication cabinet access. Pharmacy contacted to confirm dispensed quantity. Additional audit scheduled in 48 hours. Controlled drug register entry annotated.",
    followUpRequired: true, followUpDate: d(1), signedOffBy: "staff_darren",
  },
  {
    id: "ma_3", date: d(-1), time: "09:30", auditedBy: "staff_darren", witnessedBy: "staff_ryan",
    auditType: "expiry_review", result: "action_required", youngPersonId: "yp_casey",
    medicationName: "Fluoxetine", medicationType: "regular", strength: "20mg capsules",
    expectedCount: null, actualCount: 18, discrepancy: 0,
    expiryDate: d(14), batchNumber: "FLX-2024-3371",
    storageCorrect: true, temperatureOk: true, labellingCorrect: true,
    destructionMethod: null, destructionWitness: null, pharmacyName: "Boots Pharmacy, High Street",
    notes: "Expiry review identifies Fluoxetine expires in 14 days. At current administration rate (1 daily), 18 capsules will last 18 days — stock will expire before fully used. Need to request new prescription and return unused stock.",
    actionTaken: "GP contacted for repeat prescription. Pharmacy informed of near-expiry stock. Will arrange return of remaining capsules when new supply received. Reminder set in medication diary.",
    followUpRequired: true, followUpDate: d(7), signedOffBy: "staff_darren",
  },
  {
    id: "ma_4", date: d(-14), time: "10:00", auditedBy: "staff_anna", witnessedBy: "staff_chervelle",
    auditType: "destruction", result: "completed", youngPersonId: "yp_alex",
    medicationName: "Amoxicillin (suspended course)", medicationType: "regular", strength: "250mg/5ml",
    expectedCount: null, actualCount: null, discrepancy: 0,
    expiryDate: d(-7), batchNumber: "AMX-2024-9012",
    storageCorrect: true, temperatureOk: true, labellingCorrect: true,
    destructionMethod: "Returned to pharmacy in sealed medication returns bag. Pharmacy receipt obtained and filed. Controlled waste transfer note not required (non-controlled).", destructionWitness: "staff_chervelle", pharmacyName: "Boots Pharmacy, High Street",
    notes: "Amoxicillin course for Alex was suspended after adverse reaction (rash). Remaining 80ml of suspension returned to Boots Pharmacy for safe disposal. GP notified of adverse reaction — allergy added to Alex's health record. Pharmacy return receipt ref: BR-2024-4481.",
    actionTaken: "Allergy flag added to medication record and MAR chart. GP confirmed and updated NHS Summary Care Record.", followUpRequired: false, followUpDate: null, signedOffBy: "staff_darren",
  },
  {
    id: "ma_5", date: d(-1), time: "09:45", auditedBy: "staff_darren", witnessedBy: "staff_ryan",
    auditType: "storage_check", result: "satisfactory", youngPersonId: "yp_alex",
    medicationName: "All medications (storage audit)", medicationType: "regular", strength: "N/A",
    expectedCount: null, actualCount: null, discrepancy: 0,
    expiryDate: null, batchNumber: "N/A",
    storageCorrect: true, temperatureOk: true, labellingCorrect: true,
    destructionMethod: null, destructionWitness: null, pharmacyName: "N/A",
    notes: "Quarterly storage inspection. Medication cabinet locked — keys held by shift lead only. Cabinet clean and tidy. Temperature log checked — all readings between 15-25°C (satisfactory). Fridge temperature log checked — stable at 4°C. All medications in original packaging with pharmacy labels. Controlled drugs in separate locked section within cabinet. No loose tablets. Sharps bin at quarter capacity.",
    actionTaken: "", followUpRequired: false, followUpDate: null, signedOffBy: "staff_darren",
  },
  {
    id: "ma_6", date: d(-7), time: "16:00", auditedBy: "staff_ryan", witnessedBy: "staff_anna",
    auditType: "reconciliation", result: "satisfactory", youngPersonId: "yp_casey",
    medicationName: "Fluoxetine + Promethazine", medicationType: "regular", strength: "Various",
    expectedCount: null, actualCount: null, discrepancy: 0,
    expiryDate: null, batchNumber: "Various",
    storageCorrect: true, temperatureOk: true, labellingCorrect: true,
    destructionMethod: null, destructionWitness: null, pharmacyName: "Boots Pharmacy, High Street",
    notes: "Weekly MAR reconciliation for Casey. All entries on MAR chart cross-referenced with stock count. Fluoxetine 20mg: MAR shows 7 doses administered this week, stock reduced by 7 — reconciles. Promethazine 25mg PRN: MAR shows 2 PRN doses administered, stock reduced by 2 — reconciles. All signatures present. No gaps or errors on MAR. Second-checker signatures present for all administrations.",
    actionTaken: "", followUpRequired: false, followUpDate: null, signedOffBy: "staff_darren",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function MedicationAuditPage() {
  const [data] = useState(SEED);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterResult, setFilterResult] = useState("all");
  const [filterChild, setFilterChild] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── derived ─────────────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterType !== "all" && r.auditType !== filterType) return false;
      if (filterResult !== "all" && r.result !== filterResult) return false;
      if (filterChild !== "all" && r.youngPersonId !== filterChild) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.medicationName.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          getYPName(r.youngPersonId).toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date);
        case "date-asc": return a.date.localeCompare(b.date);
        case "result": {
          const order = ["discrepancy_found", "action_required", "satisfactory", "completed"];
          return order.indexOf(a.result) - order.indexOf(b.result);
        }
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterType, filterResult, filterChild, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────────────── */

  const totalAudits = data.length;
  const satisfactory = data.filter((r) => r.result === "satisfactory").length;
  const discrepancies = data.filter((r) => r.result === "discrepancy_found").length;
  const actionsOutstanding = data.filter((r) => r.followUpRequired && !r.followUpDate?.startsWith(d(0).slice(0, 7))).length;
  const expiringMeds = data.filter((r) => r.expiryDate && r.expiryDate <= d(30) && r.expiryDate >= d(0)).length;

  /* ── export ──────────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<MedicationAuditRecord>[] = [
    { header: "Date", accessor: (r: MedicationAuditRecord) => r.date },
    { header: "Audit Type", accessor: (r: MedicationAuditRecord) => AUDIT_TYPE_LABEL[r.auditType] },
    { header: "Result", accessor: (r: MedicationAuditRecord) => RESULT_LABEL[r.result] },
    { header: "Young Person", accessor: (r: MedicationAuditRecord) => getYPName(r.youngPersonId) },
    { header: "Medication", accessor: (r: MedicationAuditRecord) => r.medicationName },
    { header: "Type", accessor: (r: MedicationAuditRecord) => MED_TYPE_LABEL[r.medicationType] },
    { header: "Strength", accessor: (r: MedicationAuditRecord) => r.strength },
    { header: "Expected", accessor: (r: MedicationAuditRecord) => r.expectedCount !== null ? String(r.expectedCount) : "N/A" },
    { header: "Actual", accessor: (r: MedicationAuditRecord) => r.actualCount !== null ? String(r.actualCount) : "N/A" },
    { header: "Discrepancy", accessor: (r: MedicationAuditRecord) => String(r.discrepancy) },
    { header: "Expiry", accessor: (r: MedicationAuditRecord) => r.expiryDate || "N/A" },
    { header: "Batch", accessor: (r: MedicationAuditRecord) => r.batchNumber },
    { header: "Storage OK", accessor: (r: MedicationAuditRecord) => r.storageCorrect ? "Yes" : "No" },
    { header: "Notes", accessor: (r: MedicationAuditRecord) => r.notes },
    { header: "Action", accessor: (r: MedicationAuditRecord) => r.actionTaken },
    { header: "Audited By", accessor: (r: MedicationAuditRecord) => getStaffName(r.auditedBy) },
    { header: "Witnessed By", accessor: (r: MedicationAuditRecord) => r.witnessedBy ? getStaffName(r.witnessedBy) : "" },
  ];

  /* ── render ──────────────────────────────────────────────────────────────── */

  return (
    <PageShell
      title="Medication Audit"
      subtitle="Reg 23 · NICE Medicines Management · CQC KLoE — Safe"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Medication Audit Records" />
          <ExportButton data={filtered} columns={exportCols} filename="medication-audit" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Audit</Button>
        </div>
      }
    >
      <div id="print-area">
        {/* ── stat strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Audits", value: totalAudits, icon: Pill, clr: "text-blue-600" },
            { label: "Satisfactory", value: satisfactory, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Discrepancies", value: discrepancies, icon: AlertTriangle, clr: "text-red-600" },
            { label: "Follow-ups Due", value: actionsOutstanding, icon: Clock, clr: "text-amber-600" },
            { label: "Expiring ≤30 Days", value: expiringMeds, icon: Package, clr: "text-orange-600" },
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

        {/* ── discrepancy alert ────────────────────────────────────────────── */}
        {discrepancies > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">{discrepancies} medication discrepancy(ies) found</p>
              <p className="text-red-700">All discrepancies must be investigated, documented, and reported. Controlled drug discrepancies require notification to the Registered Manager immediately.</p>
            </div>
          </div>
        )}

        {/* ── expiring alert ───────────────────────────────────────────────── */}
        {expiringMeds > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{expiringMeds} medication(s) expiring within 30 days</p>
              <p className="text-amber-700">Request repeat prescriptions and arrange return of near-expiry stock to pharmacy.</p>
            </div>
          </div>
        )}

        {/* ── filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search medication, notes, child…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{(Object.keys(AUDIT_TYPE_LABEL) as AuditType[]).map((k) => (<SelectItem key={k} value={k}>{AUDIT_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterResult} onValueChange={setFilterResult}><SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Results</SelectItem>{(Object.keys(RESULT_LABEL) as AuditResult[]).map((k) => (<SelectItem key={k} value={k}>{RESULT_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterChild} onValueChange={setFilterChild}><SelectTrigger className="w-[130px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Children</SelectItem><SelectItem value="yp_alex">Alex</SelectItem><SelectItem value="yp_jordan">Jordan</SelectItem><SelectItem value="yp_casey">Casey</SelectItem></SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date-desc">Newest First</SelectItem><SelectItem value="date-asc">Oldest First</SelectItem><SelectItem value="result">By Result</SelectItem></SelectContent></Select>
        </div>

        {/* ── records ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_RES[r.result])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {r.medicationName}
                        <Badge variant="outline" className={AUDIT_TYPE_CLR[r.auditType]}>{AUDIT_TYPE_LABEL[r.auditType]}</Badge>
                        <Badge variant="outline" className={RESULT_CLR[r.result]}>{RESULT_LABEL[r.result]}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {getYPName(r.youngPersonId)} · {MED_TYPE_LABEL[r.medicationType]} · {r.date} at {r.time}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.discrepancy !== 0 && <Badge variant="destructive">Discrepancy: {r.discrepancy}</Badge>}
                      {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* stock count details */}
                    {(r.expectedCount !== null || r.actualCount !== null) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-muted/40 rounded p-2 text-center">
                          <p className="font-medium text-xs">Expected</p>
                          <p className="text-lg font-bold">{r.expectedCount ?? "—"}</p>
                        </div>
                        <div className="bg-muted/40 rounded p-2 text-center">
                          <p className="font-medium text-xs">Actual</p>
                          <p className="text-lg font-bold">{r.actualCount ?? "—"}</p>
                        </div>
                        <div className={cn("rounded p-2 text-center", r.discrepancy !== 0 ? "bg-red-50" : "bg-green-50")}>
                          <p className="font-medium text-xs">Discrepancy</p>
                          <p className="text-lg font-bold">{r.discrepancy}</p>
                        </div>
                        <div className="bg-muted/40 rounded p-2 text-center">
                          <p className="font-medium text-xs">Batch</p>
                          <p className="text-xs font-mono">{r.batchNumber}</p>
                        </div>
                      </div>
                    )}

                    {/* storage checks */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className={cn("rounded p-2 text-center text-xs", r.storageCorrect ? "bg-green-50" : "bg-red-50")}>
                        <p className="font-medium">Storage</p>
                        <p>{r.storageCorrect ? "✓ Correct" : "✗ Issue"}</p>
                      </div>
                      <div className={cn("rounded p-2 text-center text-xs", r.temperatureOk ? "bg-green-50" : "bg-red-50")}>
                        <p className="font-medium">Temperature</p>
                        <p>{r.temperatureOk ? "✓ OK" : "✗ Issue"}</p>
                      </div>
                      <div className={cn("rounded p-2 text-center text-xs", r.labellingCorrect ? "bg-green-50" : "bg-red-50")}>
                        <p className="font-medium">Labelling</p>
                        <p>{r.labellingCorrect ? "✓ Correct" : "✗ Issue"}</p>
                      </div>
                    </div>

                    {/* expiry */}
                    {r.expiryDate && (
                      <div className={cn("rounded-lg p-2 text-xs", r.expiryDate <= d(30) ? "bg-amber-50" : "bg-muted/40")}>
                        <span className="font-medium">Expiry: </span>{r.expiryDate}
                        {r.expiryDate <= d(30) && <span className="text-amber-700 ml-2">⚠ Expires within 30 days</span>}
                      </div>
                    )}

                    {/* destruction details */}
                    {r.destructionMethod && (
                      <div className="bg-red-50 rounded-lg p-3">
                        <p className="font-medium text-red-800 mb-1 flex items-center gap-1"><Trash2 className="h-4 w-4" /> Destruction Record</p>
                        <p className="text-red-700 text-xs">{r.destructionMethod}</p>
                        {r.destructionWitness && <p className="text-red-600 text-xs mt-1">Witnessed by: {getStaffName(r.destructionWitness)}</p>}
                      </div>
                    )}

                    {/* notes */}
                    <div>
                      <p className="font-medium mb-1">Notes</p>
                      <p className="text-muted-foreground">{r.notes}</p>
                    </div>

                    {/* action */}
                    {r.actionTaken && (
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="font-medium text-amber-800 mb-1">Action Taken</p>
                        <p className="text-amber-700 text-xs">{r.actionTaken}</p>
                      </div>
                    )}

                    {/* footer */}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Audited by: {getStaffName(r.auditedBy)}{r.witnessedBy ? ` · Witnessed: ${getStaffName(r.witnessedBy)}` : ""}</span>
                      {r.followUpRequired && r.followUpDate && <span>Follow-up: {r.followUpDate}</span>}
                      <span>{r.signedOffBy ? `Signed off: ${getStaffName(r.signedOffBy)}` : "⚠ Awaiting sign-off"}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────────────── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Children&apos;s Homes (England) Regulations 2015, Reg 23 — health and wellbeing, safe management of medicines. NICE Medicines Management guidelines. Misuse of Drugs Act 1971 and Regulations 2001 — controlled drug record-keeping requirements. All controlled drugs require two-person witnessed counts. Stock checks conducted monthly (minimum). Controlled drug checks conducted weekly. Destruction of controlled drugs requires authorised witness. All discrepancies must be reported to the Registered Manager within 1 hour.</p>
        </div>
      </div>

      {/* ── new audit dialog ───────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Medication Audit</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date</Label><Input type="date" /></div>
            <div><Label>Time</Label><Input type="time" /></div>
            <div><Label>Young Person</Label><Select><SelectTrigger><SelectValue placeholder="Select child…" /></SelectTrigger><SelectContent><SelectItem value="yp_alex">Alex</SelectItem><SelectItem value="yp_jordan">Jordan</SelectItem><SelectItem value="yp_casey">Casey</SelectItem></SelectContent></Select></div>
            <div><Label>Audit Type</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(AUDIT_TYPE_LABEL) as AuditType[]).map((k) => (<SelectItem key={k} value={k}>{AUDIT_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Medication Name</Label><Input placeholder="e.g. Melatonin" /></div>
            <div><Label>Strength</Label><Input placeholder="e.g. 3mg" /></div>
            <div><Label>Expected Count</Label><Input type="number" /></div>
            <div><Label>Actual Count</Label><Input type="number" /></div>
            <div><Label>Batch Number</Label><Input placeholder="e.g. MEL-2024-8842" /></div>
            <div><Label>Expiry Date</Label><Input type="date" /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea placeholder="Audit findings…" rows={3} /></div>
            <div className="col-span-2"><Label>Action Required</Label><Textarea placeholder="If issues found, what actions?" rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={() => setShowNew(false)}>Save Audit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}