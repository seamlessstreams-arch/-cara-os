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
  AlertTriangle, CheckCircle2, Clock, Pill, GraduationCap, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type CompetencyType = "level_3_cert" | "administration" | "controlled_drugs" | "prn_assessment" | "epipen" | "buccal_midazolam" | "insulin" | "rectal_diazepam" | "inhaler" | "refresher";
type CompetencyStatus = "competent" | "not_yet_competent" | "expired" | "in_training" | "supervised_only";

interface MedTrainingRecord {
  id: string;
  staffId: string;
  competencyType: CompetencyType;
  status: CompetencyStatus;
  assessmentDate: string;
  assessedBy: string;
  expiryDate: string;
  score: number | null;
  passThreshold: number;
  practicalAssessment: boolean;
  writtenAssessment: boolean;
  observations: number;
  notes: string;
  actionPlan: string;
  nextAssessmentDate: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const COMP_LABEL: Record<CompetencyType, string> = {
  level_3_cert: "Level 3 Medication Certificate", administration: "General Administration",
  controlled_drugs: "Controlled Drugs", prn_assessment: "PRN Assessment",
  epipen: "EpiPen", buccal_midazolam: "Buccal Midazolam",
  insulin: "Insulin Administration", rectal_diazepam: "Rectal Diazepam",
  inhaler: "Inhaler Technique", refresher: "Annual Refresher",
};
const STATUS_LABEL: Record<CompetencyStatus, string> = { competent: "Competent", not_yet_competent: "Not Yet Competent", expired: "Expired", in_training: "In Training", supervised_only: "Supervised Only" };
const STATUS_CLR: Record<CompetencyStatus, string> = { competent: "bg-green-100 text-green-800", not_yet_competent: "bg-red-100 text-red-800", expired: "bg-amber-100 text-amber-800", in_training: "bg-blue-100 text-blue-800", supervised_only: "bg-purple-100 text-purple-800" };
const BORDER_ST: Record<CompetencyStatus, string> = { competent: "border-l-green-400", not_yet_competent: "border-l-red-500", expired: "border-l-amber-400", in_training: "border-l-blue-400", supervised_only: "border-l-purple-400" };

const STAFF_IDS = ["staff_darren", "staff_ryan", "staff_anna", "staff_edward", "staff_chervelle", "staff_lackson", "staff_mirela"];

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: MedTrainingRecord[] = [
  { id: "mt_1", staffId: "staff_darren", competencyType: "level_3_cert", status: "competent", assessmentDate: d(-90), assessedBy: "External — Care Skills Academy", expiryDate: d(275), score: 94, passThreshold: 80, practicalAssessment: true, writtenAssessment: true, observations: 3, notes: "Completed Level 3 medication management certificate. Covered: 6 R's, controlled drugs, documentation, error reporting, storage. Darren scored 94% on written and passed all practical stations.", actionPlan: "", nextAssessmentDate: d(275) },
  { id: "mt_2", staffId: "staff_ryan", competencyType: "level_3_cert", status: "competent", assessmentDate: d(-120), assessedBy: "External — Care Skills Academy", expiryDate: d(245), score: 88, passThreshold: 80, practicalAssessment: true, writtenAssessment: true, observations: 3, notes: "Ryan completed Level 3 cert. Good understanding of controlled drug procedures. Minor gap identified in recording of refused doses — addressed in feedback.", actionPlan: "Reviewed refused dose recording procedure. Demonstrated correct process.", nextAssessmentDate: d(245) },
  { id: "mt_3", staffId: "staff_anna", competencyType: "level_3_cert", status: "competent", assessmentDate: d(-60), assessedBy: "External — Care Skills Academy", expiryDate: d(305), score: 91, passThreshold: 80, practicalAssessment: true, writtenAssessment: true, observations: 3, notes: "Anna passed with strong score. Excellent practical skills. Particularly strong on allergy awareness and interaction checking.", actionPlan: "", nextAssessmentDate: d(305) },
  { id: "mt_4", staffId: "staff_edward", competencyType: "level_3_cert", status: "in_training", assessmentDate: d(-14), assessedBy: "staff_darren", expiryDate: d(0), score: 72, passThreshold: 80, practicalAssessment: true, writtenAssessment: true, observations: 2, notes: "Edward did not meet the pass threshold on written assessment (72%). Practical skills are adequate. Areas for development: PRN documentation, controlled drug register entries. Edward is motivated and wants to re-sit.", actionPlan: "Edward to complete e-learning modules on PRN documentation and CD register. 2 further supervised observations needed. Re-assessment booked for " + d(14) + ".", nextAssessmentDate: d(14) },
  { id: "mt_5", staffId: "staff_chervelle", competencyType: "controlled_drugs", status: "competent", assessmentDate: d(-30), assessedBy: "staff_darren", expiryDate: d(335), score: null, passThreshold: 0, practicalAssessment: true, writtenAssessment: false, observations: 3, notes: "Chervelle demonstrated competency in controlled drug procedures: double-checking, counting, register entries, storage, witnessed destruction. 3 supervised observations completed over 2 weeks — all satisfactory.", actionPlan: "", nextAssessmentDate: d(335) },
  { id: "mt_6", staffId: "staff_lackson", competencyType: "level_3_cert", status: "expired", assessmentDate: d(-400), assessedBy: "External — Care Skills Academy", expiryDate: d(-35), score: 85, passThreshold: 80, practicalAssessment: true, writtenAssessment: true, observations: 3, notes: "Lackson's Level 3 certificate has expired. Was due for renewal but had annual leave during scheduled course. Currently administering medication under supervision only.", actionPlan: "Booked on next available Level 3 course: " + d(7) + ". Until completion, Lackson to administer medication only when supervised by a competent staff member.", nextAssessmentDate: d(7) },
  { id: "mt_7", staffId: "staff_mirela", competencyType: "administration", status: "supervised_only", assessmentDate: d(-21), assessedBy: "staff_darren", expiryDate: d(0), score: null, passThreshold: 0, practicalAssessment: true, writtenAssessment: false, observations: 1, notes: "Mirela is new to the team. Completed initial medication awareness training. Currently shadowing competent staff for medication rounds. 1 of 3 required supervised observations completed.", actionPlan: "Complete 2 more supervised observations. Enrol on next Level 3 course (estimated " + d(30) + "). Until Level 3 complete, can assist but not lead medication administration.", nextAssessmentDate: d(30) },
  { id: "mt_8", staffId: "staff_anna", competencyType: "epipen", status: "competent", assessmentDate: d(-45), assessedBy: "Paramedic — Training Day", expiryDate: d(320), score: null, passThreshold: 0, practicalAssessment: true, writtenAssessment: false, observations: 2, notes: "Anna completed EpiPen training with visiting paramedic. Demonstrated correct technique using trainer pen. Understands when to administer, positioning, and post-administration care. Although no current YP requires EpiPen, this is contingency training for any future placement.", actionPlan: "", nextAssessmentDate: d(320) },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function MedicationTrainingPage() {
  const [data] = useState(SEED);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStaff, setFilterStaff] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterStaff !== "all" && r.staffId !== filterStaff) return false;
      if (search) {
        const q = search.toLowerCase();
        return getStaffName(r.staffId).toLowerCase().includes(q) || COMP_LABEL[r.competencyType].toLowerCase().includes(q);
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.assessmentDate.localeCompare(a.assessmentDate);
        case "date-asc": return a.assessmentDate.localeCompare(b.assessmentDate);
        case "expiry": return a.expiryDate.localeCompare(b.expiryDate);
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterStatus, filterStaff, sortBy]);

  const competent = data.filter((r) => r.status === "competent").length;
  const expired = data.filter((r) => r.status === "expired").length;
  const inTraining = data.filter((r) => r.status === "in_training" || r.status === "supervised_only").length;
  const expiringIn30 = data.filter((r) => r.status === "competent" && r.expiryDate <= d(30) && r.expiryDate >= d(0)).length;

  const exportCols: ExportColumn<MedTrainingRecord>[] = [
    { header: "Staff", accessor: (r: MedTrainingRecord) => getStaffName(r.staffId) },
    { header: "Competency", accessor: (r: MedTrainingRecord) => COMP_LABEL[r.competencyType] },
    { header: "Status", accessor: (r: MedTrainingRecord) => STATUS_LABEL[r.status] },
    { header: "Assessment Date", accessor: (r: MedTrainingRecord) => r.assessmentDate },
    { header: "Expiry", accessor: (r: MedTrainingRecord) => r.expiryDate },
    { header: "Score", accessor: (r: MedTrainingRecord) => r.score !== null ? `${r.score}%` : "N/A" },
    { header: "Practical", accessor: (r: MedTrainingRecord) => r.practicalAssessment ? "Yes" : "No" },
    { header: "Written", accessor: (r: MedTrainingRecord) => r.writtenAssessment ? "Yes" : "No" },
    { header: "Observations", accessor: (r: MedTrainingRecord) => String(r.observations) },
    { header: "Assessed By", accessor: (r: MedTrainingRecord) => r.assessedBy },
  ];

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

        {/* competency matrix */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">Staff Competency Matrix</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b"><th className="text-left p-2">Staff</th><th className="text-center p-2">Level 3</th><th className="text-center p-2">CD</th><th className="text-center p-2">PRN</th><th className="text-center p-2">EpiPen</th><th className="text-center p-2">Overall</th></tr></thead>
                <tbody>
                  {STAFF_IDS.map((sid) => {
                    const records = data.filter((r) => r.staffId === sid);
                    const l3 = records.find((r) => r.competencyType === "level_3_cert");
                    const cd = records.find((r) => r.competencyType === "controlled_drugs");
                    const prn = records.find((r) => r.competencyType === "prn_assessment");
                    const epi = records.find((r) => r.competencyType === "epipen");
                    const allCompetent = l3?.status === "competent";
                    return (
                      <tr key={sid} className="border-b"><td className="p-2 font-medium">{getStaffName(sid)}</td>
                        {[l3, cd, prn, epi].map((rec, i) => (<td key={i} className="text-center p-2">{rec ? <Badge variant="outline" className={cn("text-xs", STATUS_CLR[rec.status])}>{STATUS_LABEL[rec.status]}</Badge> : <span className="text-muted-foreground">—</span>}</td>))}
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
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{(Object.keys(STATUS_LABEL) as CompetencyStatus[]).map((k) => (<SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select>
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
                      <CardTitle className="text-base flex items-center gap-2">{getStaffName(r.staffId)} — {COMP_LABEL[r.competencyType]}<Badge variant="outline" className={STATUS_CLR[r.status]}>{STATUS_LABEL[r.status]}</Badge>{r.score !== null && <Badge variant="outline" className={r.score >= r.passThreshold ? "bg-green-50" : "bg-red-50"}>{r.score}%</Badge>}</CardTitle>
                      <p className="text-sm text-muted-foreground">Assessed: {r.assessmentDate} · Expires: {r.expiryDate} · By: {r.assessedBy}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Practical</p><p className="text-xs">{r.practicalAssessment ? "✓ Passed" : "—"}</p></div>
                      <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Written</p><p className="text-xs">{r.writtenAssessment ? `✓ ${r.score !== null ? r.score + "%" : "Passed"}` : "—"}</p></div>
                      <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Observations</p><p className="text-xs">{r.observations} completed</p></div>
                    </div>
                    <div><p className="font-medium mb-1">Notes</p><p className="text-muted-foreground">{r.notes}</p></div>
                    {r.actionPlan && <div className="bg-amber-50 rounded-lg p-3"><p className="font-medium text-amber-800 mb-1">Action Plan</p><p className="text-amber-700 text-xs">{r.actionPlan}</p></div>}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground"><span>Next assessment: {r.nextAssessmentDate}</span></div>
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
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Staff Member</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{STAFF_IDS.map((s) => (<SelectItem key={s} value={s}>{getStaffName(s)}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Competency Type</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(COMP_LABEL) as CompetencyType[]).map((k) => (<SelectItem key={k} value={k}>{COMP_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Assessment Date</Label><Input type="date" /></div>
            <div><Label>Score (%)</Label><Input type="number" placeholder="e.g. 88" /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea rows={3} placeholder="Assessment details…" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={() => setShowNew(false)}>Save Assessment</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}