"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName, YOUNG_PEOPLE, STAFF } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ArrowUpDown, Pill, AlertTriangle, CheckCircle, Heart, Lightbulb, Loader2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMedicationErrorInvestigations, useCreateMedicationErrorInvestigation } from "@/hooks/use-medication-error-investigations";
import type { MedicationErrorInvestigation, MedInvSeverity, MedInvStatus, MedInvErrorType } from "@/types/extended";
import { MED_INV_ERROR_TYPE_LABEL, MED_INV_SEVERITY_LABEL, MED_INV_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { toast } from "sonner";

const severityColour: Record<MedInvSeverity, string> = {
  no_harm: "bg-[--cs-success-bg] text-[--cs-success]",
  minor_harm: "bg-[--cs-warning-bg] text-[--cs-warning]",
  moderate_harm: "bg-orange-100 text-orange-800",
  major_harm: "bg-[--cs-risk-bg] text-[--cs-risk]",
};

const statusColour: Record<MedInvStatus, string> = {
  investigating: "bg-[--cs-info-bg] text-[--cs-info]",
  closed_resolved: "bg-[--cs-success-bg] text-[--cs-success]",
  reported_monitoring: "bg-purple-100 text-purple-800",
};

export default function MedicationErrorInvestigationPage() {
  const { data: res, isLoading } = useMedicationErrorInvestigations();
  const createInvestigation = useCreateMedicationErrorInvestigation();
  const data: MedicationErrorInvestigation[] = res?.data ?? [];

  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    child_id: "",
    error_type: "wrong_dose_given" as MedInvErrorType,
    error_severity: "no_harm" as MedInvSeverity,
    date_of_error: new Date().toISOString().split("T")[0],
    staff_involved: "",
    child_impact_observed: "",
    root_cause_analysis: "",
  });

  async function handleCreate() {
    if (!form.child_id || !form.staff_involved || !form.child_impact_observed || !form.root_cause_analysis) {
      toast.error("Please complete all required fields");
      return;
    }
    try {
      await createInvestigation.mutateAsync({
        ...form,
        date_discovered: form.date_of_error,
        immediate_actions_taken: [],
        gp_consulted: false,
        gp_advice: "",
        parent_la_informed: false,
        child_informed_age_appropriately: false,
        child_response: "",
        contributing_factors: [],
        systemic_changes: [],
        training_arising: [],
        policy_arising: "",
        staff_emotional_impact: "",
        debrief_held: false,
        debrief_date: "",
        ofsted_notification_required: form.error_severity === "major_harm",
        ofsted_notification_date: "",
        status: "investigating" as MedInvStatus,
        preventive_action_embedded: false,
        reviewed_by: form.staff_involved,
        notes: "",
      });
      toast.success("Investigation opened");
      setShowCreate(false);
      setForm({ child_id: "", error_type: "wrong_dose_given", error_severity: "no_harm", date_of_error: new Date().toISOString().split("T")[0], staff_involved: "", child_impact_observed: "", root_cause_analysis: "" });
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  }

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterSeverity !== "all") items = items.filter((e) => e.error_severity === filterSeverity);
    if (filterStatus !== "all") items = items.filter((e) => e.status === filterStatus);
    items.sort((a, b) => sortBy === "date" ? b.date_of_error.localeCompare(a.date_of_error) : 0);
    return items;
  }, [data, filterSeverity, filterStatus, sortBy]);

  const total = data.length;
  const noHarm = data.filter((e) => e.error_severity === "no_harm").length;
  const ofstedNotified = data.filter((e) => e.ofsted_notification_required).length;
  const embedded = data.filter((e) => e.preventive_action_embedded).length;

  const exportCols: ExportColumn<MedicationErrorInvestigation>[] = [
    { header: "Date", accessor: (r) => r.date_of_error },
    { header: "Child", accessor: (r) => getYPName(r.child_id) },
    { header: "Error Type", accessor: (r) => MED_INV_ERROR_TYPE_LABEL[r.error_type] },
    { header: "Staff", accessor: (r) => getStaffName(r.staff_involved) },
    { header: "Severity", accessor: (r) => MED_INV_SEVERITY_LABEL[r.error_severity] },
    { header: "Status", accessor: (r) => MED_INV_STATUS_LABEL[r.status] },
    { header: "Ofsted Notified", accessor: (r) => r.ofsted_notification_required ? "Yes" : "No" },
    { header: "Embedded", accessor: (r) => r.preventive_action_embedded ? "Yes" : "No" },
  ];

  if (isLoading) return <PageShell title="Medication Error Investigation" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell title="Medication Error Investigation" subtitle="Where harm or near-harm occurred — investigated through just-culture lens, learning embedded"
      caraContext={{ pageTitle: "Medication Error Investigation", sourceType: "medication" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="medication-error-investigation" />
          <PrintButton title="Medication Error Investigation" />
          <CaraStudioQuickActionButton context={{ record_type: "medication", record_id: "home_oak", home_id: "home_oak" }} />
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" />Log Error</Button>
        </div>
      }>
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Medication Error Investigation</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Child *</Label><Select value={form.child_id} onValueChange={(v) => setForm((f) => ({ ...f, child_id: v }))}><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger><SelectContent>{YOUNG_PEOPLE.map((yp) => <SelectItem key={yp.id} value={yp.id}>{yp.preferred_name ?? yp.first_name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Date of Error *</Label><Input type="date" value={form.date_of_error} onChange={(e) => setForm((f) => ({ ...f, date_of_error: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Error Type</Label><Select value={form.error_type} onValueChange={(v) => setForm((f) => ({ ...f, error_type: v as MedInvErrorType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(MED_INV_ERROR_TYPE_LABEL) as [MedInvErrorType, string][]).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Severity</Label><Select value={form.error_severity} onValueChange={(v) => setForm((f) => ({ ...f, error_severity: v as MedInvSeverity }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(MED_INV_SEVERITY_LABEL) as [MedInvSeverity, string][]).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Staff Involved *</Label><Select value={form.staff_involved} onValueChange={(v) => setForm((f) => ({ ...f, staff_involved: v }))}><SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger><SelectContent>{STAFF.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Child Impact Observed *</Label><Textarea placeholder="What was observed, how the child was affected..." value={form.child_impact_observed} onChange={(e) => setForm((f) => ({ ...f, child_impact_observed: e.target.value }))} rows={2} /></div>
            <div><Label>Initial Root Cause *</Label><Textarea placeholder="What went wrong and why..." value={form.root_cause_analysis} onChange={(e) => setForm((f) => ({ ...f, root_cause_analysis: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createInvestigation.isPending}>{createInvestigation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Open Investigation"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Investigations</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-[--cs-success]">{noHarm}/{total}</p><p className="text-xs text-muted-foreground">No Harm</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-[--cs-risk]">{ofstedNotified}</p><p className="text-xs text-muted-foreground">Ofsted Notified</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-[--cs-success]">{embedded}/{total}</p><p className="text-xs text-muted-foreground">Embedded Learning</p></div>
      </div>
      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Lightbulb className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">Just-culture investigation. Errors investigated for systemic causes — not blamed on individuals. Staff supported; learning embedded; child kept safe and informed appropriately. Distinct from near-misses (caught before harm).</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterSeverity} onValueChange={setFilterSeverity}><SelectTrigger className="w-[180px]"><SelectValue placeholder="All Severity" /></SelectTrigger><SelectContent><SelectItem value="all">All Severities</SelectItem>{(Object.keys(MED_INV_SEVERITY_LABEL) as MedInvSeverity[]).map((s) => <SelectItem key={s} value={s}>{MED_INV_SEVERITY_LABEL[s]}</SelectItem>)}</SelectContent></Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem>{(Object.keys(MED_INV_STATUS_LABEL) as MedInvStatus[]).map((s) => <SelectItem key={s} value={s}>{MED_INV_STATUS_LABEL[s]}</SelectItem>)}</SelectContent></Select>
        <div className="flex items-center gap-1"><ArrowUpDown className="h-4 w-4 text-muted-foreground" /><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date">Most Recent</SelectItem></SelectContent></Select></div>
      </div>
      <div className="space-y-3">
        {filtered.map((e) => {
          const isExpanded = expandedId === e.id;
          return (
            <div key={e.id} className="rounded-xl border bg-white overflow-hidden">
              <button className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors" onClick={() => setExpandedId(isExpanded ? null : e.id)}>
                <div className="flex items-center gap-3 flex-1 min-w-0"><Pill className="h-5 w-5 text-purple-600 shrink-0" /><div className="min-w-0"><p className="font-medium truncate">{getYPName(e.child_id)} — {MED_INV_ERROR_TYPE_LABEL[e.error_type]}</p><p className="text-xs text-muted-foreground mt-0.5">{e.date_of_error} &middot; Staff: {getStaffName(e.staff_involved)}</p></div></div>
                <div className="flex items-center gap-2 shrink-0 ml-3"><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", severityColour[e.error_severity])}>{MED_INV_SEVERITY_LABEL[e.error_severity]}</span><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColour[e.status])}>{MED_INV_STATUS_LABEL[e.status]}</span>{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</div>
              </button>
              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-3 text-sm">
                  <div className="bg-[--cs-warning-bg] rounded-lg p-3"><p className="text-xs font-semibold text-[--cs-warning] uppercase tracking-wide mb-1"><AlertTriangle className="h-3 w-3 inline mr-1" />Child Impact</p><p>{e.child_impact_observed}</p></div>
                  <div className="bg-[--cs-info-bg] rounded-lg p-3"><p className="text-xs font-semibold text-[--cs-info] uppercase tracking-wide mb-1">Immediate Actions Taken</p><ul className="space-y-1">{e.immediate_actions_taken.map((a, i) => <li key={i} className="flex items-start gap-1"><CheckCircle className="h-3 w-3 text-[--cs-info] mt-1 shrink-0" /><span>{a}</span></li>)}</ul></div>
                  <div className="bg-purple-50 rounded-lg p-3"><p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1"><Lightbulb className="h-3 w-3 inline mr-1" />Root Cause Analysis</p><p>{e.root_cause_analysis}</p></div>
                  {(e.contributing_factors?.length ?? 0) > 0 && <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Contributing Factors</p><ul className="space-y-1">{(e.contributing_factors ?? []).map((f, i) => <li key={i} className="flex items-start gap-1"><span className="text-[--cs-warning] mt-0.5">•</span><span>{f}</span></li>)}</ul></div>}
                  <div className="bg-[--cs-success-bg] rounded-lg p-3"><p className="text-xs font-semibold text-[--cs-success] uppercase tracking-wide mb-1">Systemic Changes</p><ul className="space-y-1">{e.systemic_changes.map((c, i) => <li key={i} className="flex items-start gap-1"><CheckCircle className="h-3 w-3 text-[--cs-success] mt-1 shrink-0" /><span>{c}</span></li>)}</ul></div>
                  <div className="bg-pink-50 rounded-lg p-3"><p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1"><Heart className="h-3 w-3 inline mr-1" />Staff Emotional Impact &amp; Support</p><p>{e.staff_emotional_impact}</p></div>
                  {e.child_informed_age_appropriately && <div className="bg-blue-50 rounded-lg p-3"><p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child&apos;s Response</p><p>{e.child_response}</p></div>}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>GP consulted: {e.gp_consulted ? "Yes" : "No"}</span>
                    <span>LA informed: {e.parent_la_informed ? "Yes" : "No"}</span>
                    {e.ofsted_notification_required && <span className="px-2 py-0.5 rounded-full bg-[--cs-risk-bg] text-[--cs-risk] font-medium">Ofsted notified {e.ofsted_notification_date}</span>}
                    {e.preventive_action_embedded && <span className="px-2 py-0.5 rounded-full bg-[--cs-success-bg] text-[--cs-success] font-medium">Embedded</span>}
                    <span>Reviewed: {getStaffName(e.reviewed_by)}</span>
                  </div>
                  {e.notes && <div className="bg-slate-50 rounded-lg p-3 border"><p className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Notes</p><p>{e.notes}</p></div>}
                  <SmartLinkPanel sourceType="medication-error-investigation" sourceId={e.id} childId={e.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-8 rounded-lg bg-muted/50 border p-4"><p className="text-xs text-muted-foreground"><strong>Regulatory Context:</strong> Medication errors investigated per CQC standards, NICE NG5, and Reg 40 (notification where required). Just-culture lens. Linked to Medication Near-Miss Log, MAR Sheet, and Lessons Learned Register.</p></div>
      <CareEventsPanel
        title="Care Events — Medication"
        category="medication"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
