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
  AlertTriangle, CheckCircle2, Clock, GraduationCap, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, STAFF } from "@/lib/seed-data";
import { toast } from "sonner";
import { useMedTrainingRecords, useCreateMedTrainingRecord } from "@/hooks/use-med-training-records";
import type { MedTrainingRecord, MedCompetencyType, MedCompetencyStatus } from "@/types/extended";
import { MED_COMPETENCY_TYPE_LABEL, MED_COMPETENCY_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const STATUS_CLR: Record<MedCompetencyStatus, string> = { competent: "bg-green-100 text-green-800", not_yet_competent: "bg-red-100 text-red-800", expired: "bg-amber-100 text-amber-800", in_training: "bg-blue-100 text-blue-800", supervised_only: "bg-purple-100 text-purple-800" };
const BORDER_ST: Record<MedCompetencyStatus, string> = { competent: "border-l-green-400", not_yet_competent: "border-l-red-500", expired: "border-l-amber-400", in_training: "border-l-blue-400", supervised_only: "border-l-purple-400" };

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const STAFF_IDS = ["staff_darren", "staff_ryan", "staff_anna", "staff_edward", "staff_chervelle", "staff_lackson", "staff_mirela"];

export default function MedicationTrainingPage() {
  const { data: res, isLoading } = useMedTrainingRecords();
  const data: MedTrainingRecord[] = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStaff, setFilterStaff] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const createRecord = useCreateMedTrainingRecord();
  const [mtForm, setMtForm] = useState({ staff_id: "", competency_type: "administration" as MedCompetencyType, assessment_date: new Date().toISOString().slice(0, 10), score: "", notes: "" });
  const setMT = (k: string, v: unknown) => setMtForm((p) => ({ ...p, [k]: v }));

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mtForm.staff_id) { toast.error("Please select a staff member."); return; }
    const expiry = new Date(mtForm.assessment_date);
    expiry.setFullYear(expiry.getFullYear() + 1);
    await createRecord.mutateAsync({ staff_id: mtForm.staff_id, competency_type: mtForm.competency_type, status: "competent", assessment_date: mtForm.assessment_date, assessed_by: "staff_darren", expiry_date: expiry.toISOString().slice(0, 10), score: mtForm.score ? parseInt(mtForm.score) : null, pass_threshold: 80, practical_assessment: false, written_assessment: true, observations: 0, notes: mtForm.notes.trim(), action_plan: "", next_assessment_date: expiry.toISOString().slice(0, 10), created_at: new Date().toISOString() });
    toast.success("Competency assessment recorded.");
    setMtForm({ staff_id: "", competency_type: "administration", assessment_date: new Date().toISOString().slice(0, 10), score: "", notes: "" });
    setShowNew(false);
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterStaff !== "all" && r.staff_id !== filterStaff) return false;
      if (search) {
        const q = search.toLowerCase();
        return getStaffName(r.staff_id).toLowerCase().includes(q) || MED_COMPETENCY_TYPE_LABEL[r.competency_type].toLowerCase().includes(q);
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.assessment_date.localeCompare(a.assessment_date);
        case "date-asc": return a.assessment_date.localeCompare(b.assessment_date);
        case "expiry": return a.expiry_date.localeCompare(b.expiry_date);
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterStatus, filterStaff, sortBy]);

  const competent = data.filter((r) => r.status === "competent").length;
  const expired = data.filter((r) => r.status === "expired").length;
  const inTraining = data.filter((r) => r.status === "in_training" || r.status === "supervised_only").length;
  const expiringIn30 = data.filter((r) => r.status === "competent" && r.expiry_date <= d(30) && r.expiry_date >= d(0)).length;

  const exportCols: ExportColumn<MedTrainingRecord>[] = [
    { header: "Staff", accessor: (r) => getStaffName(r.staff_id) },
    { header: "Competency", accessor: (r) => MED_COMPETENCY_TYPE_LABEL[r.competency_type] },
    { header: "Status", accessor: (r) => MED_COMPETENCY_STATUS_LABEL[r.status] },
    { header: "Assessment Date", accessor: (r) => r.assessment_date },
    { header: "Expiry", accessor: (r) => r.expiry_date },
    { header: "Score", accessor: (r) => r.score !== null ? `${r.score}%` : "N/A" },
    { header: "Practical", accessor: (r) => r.practical_assessment ? "Yes" : "No" },
    { header: "Written", accessor: (r) => r.written_assessment ? "Yes" : "No" },
    { header: "Observations", accessor: (r) => String(r.observations) },
    { header: "Assessed By", accessor: (r) => r.assessed_by },
  ];

  if (isLoading) return <PageShell title="Medication Training & Competency" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell title="Medication Training & Competency" subtitle="Reg 23 · NICE · Safe Medicines Management" actions={<div className="flex items-center gap-2"><PrintButton title="Medication Training" /><ExportButton data={filtered} columns={exportCols} filename="medication-training" /><Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Record Assessment</Button></div>}>
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Competent", value: competent, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Expired", value: expired, icon: AlertTriangle, clr: "text-red-600" },
            { label: "In Training", value: inTraining, icon: GraduationCap, clr: "text-blue-600" },
            { label: "Expiring ≤30d", value: expiringIn30, icon: Clock, clr: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="pt-4 pb-3 text-center"><s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} /><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>

        {expired > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm"><p className="font-semibold text-red-800">{expired} expired competency(ies)</p><p className="text-red-700">Staff with expired medication competencies must not administer medication unsupervised. Immediate re-assessment or supervised-only status required.</p></div>
          </div>
        )}

        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">Staff Competency Matrix</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b"><th className="text-left p-2">Staff</th><th className="text-center p-2">Level 3</th><th className="text-center p-2">CD</th><th className="text-center p-2">PRN</th><th className="text-center p-2">EpiPen</th><th className="text-center p-2">Overall</th></tr></thead>
                <tbody>
                  {STAFF_IDS.map((sid) => {
                    const records = data.filter((r) => r.staff_id === sid);
                    const l3 = records.find((r) => r.competency_type === "level_3_cert");
                    const cd = records.find((r) => r.competency_type === "controlled_drugs");
                    const prn = records.find((r) => r.competency_type === "prn_assessment");
                    const epi = records.find((r) => r.competency_type === "epipen");
                    const allCompetent = l3?.status === "competent";
                    return (
                      <tr key={sid} className="border-b"><td className="p-2 font-medium">{getStaffName(sid)}</td>
                        {[l3, cd, prn, epi].map((rec, i) => (<td key={i} className="text-center p-2">{rec ? <Badge variant="outline" className={cn("text-xs", STATUS_CLR[rec.status])}>{MED_COMPETENCY_STATUS_LABEL[rec.status]}</Badge> : <span className="text-muted-foreground">—</span>}</td>))}
                        <td className="text-center p-2"><Badge variant="outline" className={allCompetent ? "bg-green-50" : "bg-amber-50"}>{allCompetent ? "✓ Can Lead" : "Supervised"}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search staff, competency…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{(Object.keys(MED_COMPETENCY_STATUS_LABEL) as MedCompetencyStatus[]).map((k) => (<SelectItem key={k} value={k}>{MED_COMPETENCY_STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterStaff} onValueChange={setFilterStaff}><SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Staff</SelectItem>{STAFF_IDS.map((s) => (<SelectItem key={s} value={s}>{getStaffName(s)}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date-desc">Newest First</SelectItem><SelectItem value="date-asc">Oldest First</SelectItem><SelectItem value="expiry">By Expiry</SelectItem></SelectContent></Select>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_ST[r.status])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">{getStaffName(r.staff_id)} — {MED_COMPETENCY_TYPE_LABEL[r.competency_type]}<Badge variant="outline" className={STATUS_CLR[r.status]}>{MED_COMPETENCY_STATUS_LABEL[r.status]}</Badge>{r.score !== null && <Badge variant="outline" className={r.score >= r.pass_threshold ? "bg-green-50" : "bg-red-50"}>{r.score}%</Badge>}</CardTitle>
                      <p className="text-sm text-muted-foreground">Assessed: {r.assessment_date} · Expires: {r.expiry_date} · By: {r.assessed_by}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Practical</p><p className="text-xs">{r.practical_assessment ? "✓ Passed" : "—"}</p></div>
                      <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Written</p><p className="text-xs">{r.written_assessment ? `✓ ${r.score !== null ? r.score + "%" : "Passed"}` : "—"}</p></div>
                      <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Observations</p><p className="text-xs">{r.observations} completed</p></div>
                    </div>
                    <div><p className="font-medium mb-1">Notes</p><p className="text-muted-foreground">{r.notes}</p></div>
                    {r.action_plan && <div className="bg-amber-50 rounded-lg p-3"><p className="font-medium text-amber-800 mb-1">Action Plan</p><p className="text-amber-700 text-xs">{r.action_plan}</p></div>}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground"><span>Next assessment: {r.next_assessment_date}</span></div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Children&apos;s Homes (England) Regulations 2015, Reg 23 — safe management of medicines. All staff administering medication must hold a current Level 3 medication management certificate or equivalent and be assessed as competent. Competency assessments include written knowledge test (≥80% pass), practical demonstration, and minimum 3 supervised observations. Annual refresher training required. Controlled drug competency assessed separately. Staff with expired competencies may only administer under direct supervision of a competent staff member.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Competency Assessment</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveAssessment} className="grid grid-cols-2 gap-4 py-2">
            <div><Label>Staff Member *</Label><Select value={mtForm.staff_id} onValueChange={(v) => setMT("staff_id", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{STAFF.filter((s) => s.employment_status === "active").map((s) => (<SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Competency Type</Label><Select value={mtForm.competency_type} onValueChange={(v) => setMT("competency_type", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(MED_COMPETENCY_TYPE_LABEL) as MedCompetencyType[]).map((k) => (<SelectItem key={k} value={k}>{MED_COMPETENCY_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Assessment Date</Label><Input type="date" className="mt-1" value={mtForm.assessment_date} onChange={(e) => setMT("assessment_date", e.target.value)} /></div>
            <div><Label>Score (%)</Label><Input type="number" className="mt-1" placeholder="e.g. 88" value={mtForm.score} onChange={(e) => setMT("score", e.target.value)} /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea className="mt-1" rows={3} placeholder="Assessment details…" value={mtForm.notes} onChange={(e) => setMT("notes", e.target.value)} /></div>
            <DialogFooter className="col-span-2"><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={createRecord.isPending}>{createRecord.isPending ? "Saving…" : "Save Assessment"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
