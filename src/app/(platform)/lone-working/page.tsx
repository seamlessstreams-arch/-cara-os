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
  AlertTriangle, CheckCircle2, Clock, Shield, User, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, STAFF } from "@/lib/seed-data";
import { toast } from "sonner";
import { useLoneWorkingRecords, useCreateLoneWorkingRecord } from "@/hooks/use-lone-working-records";
import type { LoneWorkingRecord, LoneWorkingScenario, LoneWorkingRiskLevel, LoneWorkingAssessmentStatus } from "@/types/extended";
import { LONE_WORKING_SCENARIO_LABEL, LONE_WORKING_RISK_LEVEL_LABEL, LONE_WORKING_ASSESSMENT_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── UI metadata ──────────────────────────────────────────────────────── */

const RISK_CLR: Record<LoneWorkingRiskLevel, string> = { low: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800", high: "bg-red-100 text-red-800" };
const STATUS_CLR: Record<LoneWorkingAssessmentStatus, string> = { current: "bg-green-100 text-green-800", due_review: "bg-amber-100 text-amber-800", expired: "bg-red-100 text-red-800" };
const BORDER_RISK: Record<LoneWorkingRiskLevel, string> = { low: "border-l-green-400", medium: "border-l-yellow-400", high: "border-l-red-500" };

export default function LoneWorkingPage() {
  const { data: res, isLoading } = useLoneWorkingRecords();
  const data: LoneWorkingRecord[] = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [sortBy, setSortBy] = useState("risk");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const createRecord = useCreateLoneWorkingRecord();
  const [lwForm, setLwForm] = useState({ staff_id: "", scenario: "waking_night" as LoneWorkingScenario, risk_level: "low" as LoneWorkingRiskLevel, review_date: "", hazards: "", control_measures: "" });
  const setLW = (k: string, v: unknown) => setLwForm((p) => ({ ...p, [k]: v }));

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lwForm.staff_id) { toast.error("Please select a staff member."); return; }
    await createRecord.mutateAsync({ staff_id: lwForm.staff_id, scenario: lwForm.scenario, risk_level: lwForm.risk_level, status: "current", assessment_date: new Date().toISOString().slice(0, 10), review_date: lwForm.review_date, assessed_by: "staff_darren", hazards: lwForm.hazards.split("\n").filter(Boolean), control_measures: lwForm.control_measures.split("\n").filter(Boolean), check_in_protocol: "", personal_alarm_issued: false, emergency_procedure: "", notes: "", created_at: new Date().toISOString() });
    toast.success("Lone working assessment saved.");
    setLwForm({ staff_id: "", scenario: "waking_night", risk_level: "low", review_date: "", hazards: "", control_measures: "" });
    setShowNew(false);
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterRisk !== "all" && r.risk_level !== filterRisk) return false;
      if (search) {
        const q = search.toLowerCase();
        return getStaffName(r.staff_id).toLowerCase().includes(q) || LONE_WORKING_SCENARIO_LABEL[r.scenario].toLowerCase().includes(q);
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "risk": { const o = ["high", "medium", "low"]; return o.indexOf(a.risk_level) - o.indexOf(b.risk_level); }
        case "date": return b.assessment_date.localeCompare(a.assessment_date);
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterRisk, sortBy]);

  const current = data.filter((r) => r.status === "current").length;
  const dueReview = data.filter((r) => r.status === "due_review").length;
  const expired = data.filter((r) => r.status === "expired").length;

  const exportCols: ExportColumn<LoneWorkingRecord>[] = [
    { header: "Staff", accessor: (r) => getStaffName(r.staff_id) },
    { header: "Scenario", accessor: (r) => LONE_WORKING_SCENARIO_LABEL[r.scenario] },
    { header: "Risk Level", accessor: (r) => LONE_WORKING_RISK_LEVEL_LABEL[r.risk_level] },
    { header: "Status", accessor: (r) => LONE_WORKING_ASSESSMENT_STATUS_LABEL[r.status] },
    { header: "Assessment Date", accessor: (r) => r.assessment_date },
    { header: "Review Date", accessor: (r) => r.review_date },
    { header: "Hazards", accessor: (r) => r.hazards.join("; ") },
    { header: "Controls", accessor: (r) => r.control_measures.join("; ") },
    { header: "Check-In Protocol", accessor: (r) => r.check_in_protocol },
    { header: "Personal Alarm", accessor: (r) => r.personal_alarm_issued ? "Yes" : "No" },
  ];

  if (isLoading) return <PageShell title="Lone Working Assessments" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell title="Lone Working Assessments" subtitle="Health & Safety at Work Act 1974 · Management of H&S at Work Regs 1999" actions={<div className="flex items-center gap-2"><PrintButton title="Lone Working" /><ExportButton data={filtered} columns={exportCols} filename="lone-working" /><Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Assessment</Button></div>}>
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Assessments", value: data.length, icon: Shield, clr: "text-blue-600" },
            { label: "Current", value: current, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Due Review", value: dueReview, icon: Clock, clr: "text-amber-600" },
            { label: "Expired", value: expired, icon: AlertTriangle, clr: "text-red-600" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="pt-4 pb-3 text-center"><s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} /><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search staff, scenario…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={filterRisk} onValueChange={setFilterRisk}><SelectTrigger className="w-[140px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Risk</SelectItem>{(Object.keys(LONE_WORKING_RISK_LEVEL_LABEL) as LoneWorkingRiskLevel[]).map((k) => (<SelectItem key={k} value={k}>{LONE_WORKING_RISK_LEVEL_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="risk">By Risk</SelectItem><SelectItem value="date">By Date</SelectItem></SelectContent></Select>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_RISK[r.risk_level])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> {getStaffName(r.staff_id)} — {LONE_WORKING_SCENARIO_LABEL[r.scenario]}<Badge variant="outline" className={RISK_CLR[r.risk_level]}>{LONE_WORKING_RISK_LEVEL_LABEL[r.risk_level]}</Badge><Badge variant="outline" className={STATUS_CLR[r.status]}>{LONE_WORKING_ASSESSMENT_STATUS_LABEL[r.status]}</Badge></CardTitle>
                      <p className="text-sm text-muted-foreground">Assessed: {r.assessment_date} · Review: {r.review_date} · By: {getStaffName(r.assessed_by)}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    <div className="bg-red-50 rounded-lg p-3"><p className="font-medium text-red-800 mb-2">Hazards Identified</p><ul className="space-y-1">{r.hazards.map((h, i) => (<li key={i} className="text-xs text-red-700 flex items-start gap-1"><AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" /> {h}</li>))}</ul></div>
                    <div className="bg-green-50 rounded-lg p-3"><p className="font-medium text-green-800 mb-2">Control Measures</p><ul className="space-y-1">{r.control_measures.map((cm, i) => (<li key={i} className="text-xs text-green-700 flex items-start gap-1"><CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" /> {cm}</li>))}</ul></div>
                    <div className="bg-blue-50 rounded-lg p-3"><p className="font-medium text-blue-800 mb-1">Check-In Protocol</p><p className="text-blue-700 text-xs">{r.check_in_protocol}</p></div>
                    <div className="bg-amber-50 rounded-lg p-3"><p className="font-medium text-amber-800 mb-1">Emergency Procedure</p><p className="text-amber-700 text-xs">{r.emergency_procedure}</p></div>
                    <div className="flex gap-4 text-xs">{r.personal_alarm_issued && <Badge variant="outline" className="bg-purple-50">Personal Alarm Issued</Badge>}</div>
                    {r.notes && <div><p className="font-medium mb-1">Notes</p><p className="text-muted-foreground text-xs">{r.notes}</p></div>}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Health and Safety at Work Act 1974 — duty to assess and mitigate risks for lone workers. Management of Health and Safety at Work Regulations 1999 — specific risk assessments required. HSE guidance on lone working. Children&apos;s Homes (England) Regulations 2015 — safe staffing. Working Time Regulations 1998 — rest periods. All lone working scenarios must have a documented risk assessment reviewed annually or when circumstances change.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Lone Working Assessment</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveAssessment} className="grid grid-cols-2 gap-4 py-2">
            <div><Label>Staff Member *</Label><Select value={lwForm.staff_id} onValueChange={(v) => setLW("staff_id", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{STAFF.filter((s) => s.employment_status === "active").map((s) => (<SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Scenario</Label><Select value={lwForm.scenario} onValueChange={(v) => setLW("scenario", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(LONE_WORKING_SCENARIO_LABEL) as LoneWorkingScenario[]).map((k) => (<SelectItem key={k} value={k}>{LONE_WORKING_SCENARIO_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Risk Level</Label><Select value={lwForm.risk_level} onValueChange={(v) => setLW("risk_level", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(LONE_WORKING_RISK_LEVEL_LABEL) as LoneWorkingRiskLevel[]).map((k) => (<SelectItem key={k} value={k}>{LONE_WORKING_RISK_LEVEL_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Review Date</Label><Input type="date" className="mt-1" value={lwForm.review_date} onChange={(e) => setLW("review_date", e.target.value)} /></div>
            <div className="col-span-2"><Label>Hazards</Label><Textarea className="mt-1" rows={3} placeholder="Identified hazards (one per line)…" value={lwForm.hazards} onChange={(e) => setLW("hazards", e.target.value)} /></div>
            <div className="col-span-2"><Label>Control Measures</Label><Textarea className="mt-1" rows={3} placeholder="How risks are managed (one per line)…" value={lwForm.control_measures} onChange={(e) => setLW("control_measures", e.target.value)} /></div>
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
