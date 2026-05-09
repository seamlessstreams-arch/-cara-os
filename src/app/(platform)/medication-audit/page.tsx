"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
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
  AlertTriangle, CheckCircle2, Clock, Pill, Package, Trash2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useMedicationAudits } from "@/hooks/use-medication-audits";
import type { MedicationAuditRecord, MedAuditType, MedAuditResult } from "@/types/extended";
import { MED_AUDIT_TYPE_LABEL, MED_AUDIT_RESULT_LABEL, MED_AUDIT_MEDICATION_TYPE_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── UI metadata ──────────────────────────────────────────────────────── */

const AUDIT_TYPE_CLR: Record<MedAuditType, string> = {
  stock_check: "bg-blue-100 text-blue-800",
  controlled_drug_check: "bg-purple-100 text-purple-800",
  destruction: "bg-red-100 text-red-800",
  expiry_review: "bg-amber-100 text-amber-800",
  storage_check: "bg-green-100 text-green-800",
  reconciliation: "bg-indigo-100 text-indigo-800",
  return_to_pharmacy: "bg-slate-100 text-slate-800",
};

const RESULT_CLR: Record<MedAuditResult, string> = {
  satisfactory: "bg-green-100 text-green-800",
  discrepancy_found: "bg-red-100 text-red-800",
  action_required: "bg-amber-100 text-amber-800",
  completed: "bg-slate-100 text-slate-800",
};

const BORDER_RES: Record<MedAuditResult, string> = {
  satisfactory: "border-l-green-400",
  discrepancy_found: "border-l-red-600",
  action_required: "border-l-amber-400",
  completed: "border-l-slate-400",
};

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

export default function MedicationAuditPage() {
  const { data: res, isLoading } = useMedicationAudits();
  const data: MedicationAuditRecord[] = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterResult, setFilterResult] = useState("all");
  const [filterChild, setFilterChild] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterType !== "all" && r.audit_type !== filterType) return false;
      if (filterResult !== "all" && r.result !== filterResult) return false;
      if (filterChild !== "all" && r.child_id !== filterChild) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.medication_name.toLowerCase().includes(q) || r.notes.toLowerCase().includes(q) || getYPName(r.child_id).toLowerCase().includes(q);
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

  const totalAudits = data.length;
  const satisfactory = data.filter((r) => r.result === "satisfactory").length;
  const discrepancies = data.filter((r) => r.result === "discrepancy_found").length;
  const actionsOutstanding = data.filter((r) => r.follow_up_required).length;
  const expiringMeds = data.filter((r) => r.expiry_date && r.expiry_date <= d(30) && r.expiry_date >= d(0)).length;

  const exportCols: ExportColumn<MedicationAuditRecord>[] = [
    { header: "Date", accessor: (r) => r.date },
    { header: "Audit Type", accessor: (r) => MED_AUDIT_TYPE_LABEL[r.audit_type] },
    { header: "Result", accessor: (r) => MED_AUDIT_RESULT_LABEL[r.result] },
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Medication", accessor: (r) => r.medication_name },
    { header: "Type", accessor: (r) => MED_AUDIT_MEDICATION_TYPE_LABEL[r.medication_type] },
    { header: "Strength", accessor: (r) => r.strength },
    { header: "Expected", accessor: (r) => r.expected_count !== null ? String(r.expected_count) : "N/A" },
    { header: "Actual", accessor: (r) => r.actual_count !== null ? String(r.actual_count) : "N/A" },
    { header: "Discrepancy", accessor: (r) => String(r.discrepancy) },
    { header: "Expiry", accessor: (r) => r.expiry_date || "N/A" },
    { header: "Batch", accessor: (r) => r.batch_number },
    { header: "Storage OK", accessor: (r) => r.storage_correct ? "Yes" : "No" },
    { header: "Notes", accessor: (r) => r.notes },
    { header: "Action", accessor: (r) => r.action_taken },
    { header: "Audited By", accessor: (r) => getStaffName(r.audited_by) },
    { header: "Witnessed By", accessor: (r) => r.witnessed_by ? getStaffName(r.witnessed_by) : "" },
  ];

  if (isLoading) return <PageShell title="Medication Audit" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Audits", value: totalAudits, icon: Pill, clr: "text-blue-600" },
            { label: "Satisfactory", value: satisfactory, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Discrepancies", value: discrepancies, icon: AlertTriangle, clr: "text-red-600" },
            { label: "Follow-ups Due", value: actionsOutstanding, icon: Clock, clr: "text-amber-600" },
            { label: "Expiring ≤30 Days", value: expiringMeds, icon: Package, clr: "text-orange-600" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="pt-4 pb-3 text-center"><s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} /><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>

        {discrepancies > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm"><p className="font-semibold text-red-800">{discrepancies} medication discrepancy(ies) found</p><p className="text-red-700">All discrepancies must be investigated, documented, and reported. Controlled drug discrepancies require notification to the Registered Manager immediately.</p></div>
          </div>
        )}

        {expiringMeds > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm"><p className="font-semibold text-amber-800">{expiringMeds} medication(s) expiring within 30 days</p><p className="text-amber-700">Request repeat prescriptions and arrange return of near-expiry stock to pharmacy.</p></div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search medication, notes, child…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{(Object.keys(MED_AUDIT_TYPE_LABEL) as MedAuditType[]).map((k) => (<SelectItem key={k} value={k}>{MED_AUDIT_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterResult} onValueChange={setFilterResult}><SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Results</SelectItem>{(Object.keys(MED_AUDIT_RESULT_LABEL) as MedAuditResult[]).map((k) => (<SelectItem key={k} value={k}>{MED_AUDIT_RESULT_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterChild} onValueChange={setFilterChild}><SelectTrigger className="w-[130px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Children</SelectItem><SelectItem value="yp_alex">Alex</SelectItem><SelectItem value="yp_jordan">Jordan</SelectItem><SelectItem value="yp_casey">Casey</SelectItem></SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date-desc">Newest First</SelectItem><SelectItem value="date-asc">Oldest First</SelectItem><SelectItem value="result">By Result</SelectItem></SelectContent></Select>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_RES[r.result])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {r.medication_name}
                        <Badge variant="outline" className={AUDIT_TYPE_CLR[r.audit_type]}>{MED_AUDIT_TYPE_LABEL[r.audit_type]}</Badge>
                        <Badge variant="outline" className={RESULT_CLR[r.result]}>{MED_AUDIT_RESULT_LABEL[r.result]}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{getYPName(r.child_id)} · {MED_AUDIT_MEDICATION_TYPE_LABEL[r.medication_type]} · {r.date} at {r.time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.discrepancy !== 0 && <Badge variant="destructive">Discrepancy: {r.discrepancy}</Badge>}
                      {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {(r.expected_count !== null || r.actual_count !== null) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Expected</p><p className="text-lg font-bold">{r.expected_count ?? "—"}</p></div>
                        <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Actual</p><p className="text-lg font-bold">{r.actual_count ?? "—"}</p></div>
                        <div className={cn("rounded p-2 text-center", r.discrepancy !== 0 ? "bg-red-50" : "bg-green-50")}><p className="font-medium text-xs">Discrepancy</p><p className="text-lg font-bold">{r.discrepancy}</p></div>
                        <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Batch</p><p className="text-xs font-mono">{r.batch_number}</p></div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div className={cn("rounded p-2 text-center text-xs", r.storage_correct ? "bg-green-50" : "bg-red-50")}><p className="font-medium">Storage</p><p>{r.storage_correct ? "✓ Correct" : "✗ Issue"}</p></div>
                      <div className={cn("rounded p-2 text-center text-xs", r.temperature_ok ? "bg-green-50" : "bg-red-50")}><p className="font-medium">Temperature</p><p>{r.temperature_ok ? "✓ OK" : "✗ Issue"}</p></div>
                      <div className={cn("rounded p-2 text-center text-xs", r.labelling_correct ? "bg-green-50" : "bg-red-50")}><p className="font-medium">Labelling</p><p>{r.labelling_correct ? "✓ Correct" : "✗ Issue"}</p></div>
                    </div>

                    {r.expiry_date && (
                      <div className={cn("rounded-lg p-2 text-xs", r.expiry_date <= d(30) ? "bg-amber-50" : "bg-muted/40")}>
                        <span className="font-medium">Expiry: </span>{r.expiry_date}
                        {r.expiry_date <= d(30) && <span className="text-amber-700 ml-2">⚠ Expires within 30 days</span>}
                      </div>
                    )}

                    {r.destruction_method && (
                      <div className="bg-red-50 rounded-lg p-3">
                        <p className="font-medium text-red-800 mb-1 flex items-center gap-1"><Trash2 className="h-4 w-4" /> Destruction Record</p>
                        <p className="text-red-700 text-xs">{r.destruction_method}</p>
                        {r.destruction_witness && <p className="text-red-600 text-xs mt-1">Witnessed by: {getStaffName(r.destruction_witness)}</p>}
                      </div>
                    )}

                    <div><p className="font-medium mb-1">Notes</p><p className="text-muted-foreground">{r.notes}</p></div>

                    {r.action_taken && (
                      <div className="bg-amber-50 rounded-lg p-3"><p className="font-medium text-amber-800 mb-1">Action Taken</p><p className="text-amber-700 text-xs">{r.action_taken}</p></div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Audited by: {getStaffName(r.audited_by)}{r.witnessed_by ? ` · Witnessed: ${getStaffName(r.witnessed_by)}` : ""}</span>
                      {r.follow_up_required && r.follow_up_date && <span>Follow-up: {r.follow_up_date}</span>}
                      <span>{r.signed_off_by ? `Signed off: ${getStaffName(r.signed_off_by)}` : "⚠ Awaiting sign-off"}</span>
                    </div>

                    <SmartLinkPanel sourceType="medication-audit" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Children&apos;s Homes (England) Regulations 2015, Reg 23 — health and wellbeing, safe management of medicines. NICE Medicines Management guidelines. Misuse of Drugs Act 1971 and Regulations 2001 — controlled drug record-keeping requirements. All controlled drugs require two-person witnessed counts. Stock checks conducted monthly (minimum). Controlled drug checks conducted weekly. Destruction of controlled drugs requires authorised witness. All discrepancies must be reported to the Registered Manager within 1 hour.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Medication Audit</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date</Label><Input type="date" /></div>
            <div><Label>Time</Label><Input type="time" /></div>
            <div><Label>Young Person</Label><Select><SelectTrigger><SelectValue placeholder="Select child…" /></SelectTrigger><SelectContent><SelectItem value="yp_alex">Alex</SelectItem><SelectItem value="yp_jordan">Jordan</SelectItem><SelectItem value="yp_casey">Casey</SelectItem></SelectContent></Select></div>
            <div><Label>Audit Type</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(MED_AUDIT_TYPE_LABEL) as MedAuditType[]).map((k) => (<SelectItem key={k} value={k}>{MED_AUDIT_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
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
      <CareEventsPanel
        title="Related Care Events"
        category="medication"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
