"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getStaffName, STAFF } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useAgencyFeedback, useCreateAgencyFeedback } from "@/hooks/use-agency-feedback";
import type { AgencyFeedback, AgencyShiftType, AgencyVerdict, RecordingQuality } from "@/types/extended";
import {
  AGENCY_SHIFT_TYPE_LABEL,
  AGENCY_VERDICT_LABEL,
  RECORDING_QUALITY_LABEL,
} from "@/types/extended";
import { ChevronDown, ChevronUp, ArrowUpDown, UserCheck, CheckCircle, AlertTriangle, Star, Heart, Loader2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { toast } from "sonner";

const verdictColour: Record<string, string> = {
  approved_for_repeat: "bg-green-100 text-green-800",
  approved_with_development_plan: "bg-blue-100 text-blue-800",
  conditional: "bg-amber-100 text-amber-800",
  not_approved_for_repeat: "bg-red-100 text-red-800",
};

const exportCols: ExportColumn<AgencyFeedback>[] = [
  { header: "Agency Staff", accessor: (r: AgencyFeedback) => r.agency_staff_name },
  { header: "Agency", accessor: (r: AgencyFeedback) => r.agency },
  { header: "Date", accessor: (r: AgencyFeedback) => r.shift_date },
  { header: "Shift", accessor: (r: AgencyFeedback) => AGENCY_SHIFT_TYPE_LABEL[r.shift_type] },
  { header: "Verdict", accessor: (r: AgencyFeedback) => AGENCY_VERDICT_LABEL[r.overall_verdict] },
  { header: "Professionalism", accessor: (r: AgencyFeedback) => `${r.professionalism_rating}/5` },
  { header: "Relational", accessor: (r: AgencyFeedback) => `${r.relational_skills_rating}/5` },
  { header: "Recording", accessor: (r: AgencyFeedback) => RECORDING_QUALITY_LABEL[r.recording_quality] },
];

export default function AgencyStaffFeedbackPage() {
  const { data: res, isLoading } = useAgencyFeedback();
  const createFeedback = useCreateAgencyFeedback();
  const data = useMemo(() => res?.data ?? [], [res]);
  const [filterVerdict, setFilterVerdict] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    agency_staff_name: "",
    agency: "",
    shift_date: new Date().toISOString().split("T")[0],
    shift_type: "early" as AgencyShiftType,
    permanent_staff_on_shift: "",
    professionalism_rating: 3,
    relational_skills_rating: 3,
    recording_quality: "adequate" as RecordingQuality,
    overall_verdict: "approved_for_repeat" as AgencyVerdict,
    feedback_summary: "",
  });

  async function handleCreate() {
    if (!form.agency_staff_name || !form.agency || !form.permanent_staff_on_shift || !form.feedback_summary) {
      toast.error("Please complete all required fields");
      return;
    }
    try {
      await createFeedback.mutateAsync({
        ...form,
        induction_recorded: true,
        children_interacted_with: [],
        observations_positive: [],
        observations_constructive: [],
        child_feedback: "",
        follows_routines: true,
        follows_behaviour_support_plans: true,
        follows_sensory_protocols: true,
        feedback_to_agency_date: new Date().toISOString().split("T")[0],
        follow_up_action: "None",
        reviewed_by: form.permanent_staff_on_shift,
        notes: "",
      });
      toast.success("Feedback logged");
      setShowCreate(false);
      setForm({ agency_staff_name: "", agency: "", shift_date: new Date().toISOString().split("T")[0], shift_type: "early", permanent_staff_on_shift: "", professionalism_rating: 3, relational_skills_rating: 3, recording_quality: "adequate", overall_verdict: "approved_for_repeat", feedback_summary: "" });
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  }

  if (isLoading) {
    return (
      <PageShell title="Agency Staff Feedback" subtitle="Performance feedback after agency staff cover shifts — approval, development, and repeat-booking decisions">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const filtered = (() => {
    let items = [...data];
    if (filterVerdict !== "all") items = items.filter((f) => f.overall_verdict === filterVerdict);
    items.sort((a, b) => sortBy === "date" ? b.shift_date.localeCompare(a.shift_date) : 0);
    return items;
  })();

  const total = data.length;
  const approved = data.filter((f) => f.overall_verdict === "approved_for_repeat").length;
  const declined = data.filter((f) => f.overall_verdict === "not_approved_for_repeat").length;
  const avgProf = (data.reduce((sum, f) => sum + f.professionalism_rating, 0) / Math.max(1, data.length)).toFixed(1);

  return (
    <PageShell title="Agency Staff Feedback" subtitle="Performance feedback after agency staff cover shifts — approval, development, and repeat-booking decisions"
      caraContext={{ pageTitle: "Agency Staff Feedback", sourceType: "staff" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="agency-staff-feedback" />
          <PrintButton title="Agency Staff Feedback" />
          <CaraStudioQuickActionButton context={{ record_type: "supervision", record_id: "home_oak", home_id: "home_oak" }} />
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" />Log Feedback</Button>
        </div>
      }>
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Agency Staff Feedback</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Agency Staff Name *</Label><Input placeholder="Full name" value={form.agency_staff_name} onChange={(e) => setForm((f) => ({ ...f, agency_staff_name: e.target.value }))} /></div>
              <div><Label>Agency *</Label><Input placeholder="Agency name" value={form.agency} onChange={(e) => setForm((f) => ({ ...f, agency: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Shift Date *</Label><Input type="date" value={form.shift_date} onChange={(e) => setForm((f) => ({ ...f, shift_date: e.target.value }))} /></div>
              <div><Label>Shift Type</Label><Select value={form.shift_type} onValueChange={(v) => setForm((f) => ({ ...f, shift_type: v as AgencyShiftType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(AGENCY_SHIFT_TYPE_LABEL) as [AgencyShiftType, string][]).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Permanent Staff on Shift *</Label><Select value={form.permanent_staff_on_shift} onValueChange={(v) => setForm((f) => ({ ...f, permanent_staff_on_shift: v }))}><SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger><SelectContent>{STAFF.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Professionalism (1–5)</Label><Input type="number" min={1} max={5} value={form.professionalism_rating} onChange={(e) => setForm((f) => ({ ...f, professionalism_rating: parseInt(e.target.value) }))} /></div>
              <div><Label>Relational Skills (1–5)</Label><Input type="number" min={1} max={5} value={form.relational_skills_rating} onChange={(e) => setForm((f) => ({ ...f, relational_skills_rating: parseInt(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Recording Quality</Label><Select value={form.recording_quality} onValueChange={(v) => setForm((f) => ({ ...f, recording_quality: v as RecordingQuality }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(RECORDING_QUALITY_LABEL) as [RecordingQuality, string][]).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Verdict</Label><Select value={form.overall_verdict} onValueChange={(v) => setForm((f) => ({ ...f, overall_verdict: v as AgencyVerdict }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(AGENCY_VERDICT_LABEL) as [AgencyVerdict, string][]).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Feedback Summary *</Label><Textarea placeholder="Key observations and decisions..." value={form.feedback_summary} onChange={(e) => setForm((f) => ({ ...f, feedback_summary: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createFeedback.isPending}>{createFeedback.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Feedback"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Reviews</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-green-600">{approved}</p><p className="text-xs text-muted-foreground">Approved Repeat</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className={cn("text-2xl font-bold", declined > 0 ? "text-red-600" : "text-green-600")}>{declined}</p><p className="text-xs text-muted-foreground">Declined</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-blue-600">{avgProf}/5</p><p className="text-xs text-muted-foreground">Avg Professionalism</p></div>
      </div>
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <UserCheck className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">Every agency shift is followed by a formal review. Children&apos;s feedback included. Practice alignment with our model is the standard. Approved staff added to preferred list; misalignment results in non-booking — children&apos;s experience is the test.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterVerdict} onValueChange={setFilterVerdict}><SelectTrigger className="w-[200px]"><SelectValue placeholder="All Verdicts" /></SelectTrigger><SelectContent><SelectItem value="all">All Verdicts</SelectItem><SelectItem value="approved_for_repeat">{AGENCY_VERDICT_LABEL.approved_for_repeat}</SelectItem><SelectItem value="approved_with_development_plan">{AGENCY_VERDICT_LABEL.approved_with_development_plan}</SelectItem><SelectItem value="conditional">{AGENCY_VERDICT_LABEL.conditional}</SelectItem><SelectItem value="not_approved_for_repeat">{AGENCY_VERDICT_LABEL.not_approved_for_repeat}</SelectItem></SelectContent></Select>
        <div className="flex items-center gap-1"><ArrowUpDown className="h-4 w-4 text-muted-foreground" /><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date">Most Recent</SelectItem></SelectContent></Select></div>
      </div>
      <div className="space-y-3">
        {filtered.map((f) => {
          const isExpanded = expandedId === f.id;
          return (
            <div key={f.id} className="rounded-xl border bg-white overflow-hidden">
              <button className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors" onClick={() => setExpandedId(isExpanded ? null : f.id)}>
                <div className="flex items-center gap-3 flex-1 min-w-0"><UserCheck className="h-5 w-5 text-blue-600 shrink-0" /><div className="min-w-0"><p className="font-medium truncate">{f.agency_staff_name} ({f.agency})</p><p className="text-xs text-muted-foreground mt-0.5">{f.shift_date} &middot; {AGENCY_SHIFT_TYPE_LABEL[f.shift_type]} &middot; with {getStaffName(f.permanent_staff_on_shift)}</p></div></div>
                <div className="flex items-center gap-2 shrink-0 ml-3"><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", verdictColour[f.overall_verdict])}>{AGENCY_VERDICT_LABEL[f.overall_verdict]}</span>{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</div>
              </button>
              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-3 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-3"><p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1"><Star className="h-3 w-3 inline mr-1" />Positive Observations</p><ul className="space-y-1">{f.observations_positive.map((o, i) => <li key={i} className="flex items-start gap-1"><CheckCircle className="h-3 w-3 text-emerald-500 mt-1 shrink-0" /><span>{o}</span></li>)}</ul></div>
                    {f.observations_constructive.length > 0 && <div className="bg-amber-50 rounded-lg p-3"><p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1"><AlertTriangle className="h-3 w-3 inline mr-1" />Constructive Observations</p><ul className="space-y-1">{f.observations_constructive.map((o, i) => <li key={i} className="flex items-start gap-1"><span className="text-amber-600 mt-0.5">•</span><span>{o}</span></li>)}</ul></div>}
                  </div>
                  <div className="bg-pink-50 rounded-lg p-3"><p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1"><Heart className="h-3 w-3 inline mr-1" />Children&apos;s Feedback</p><p className="italic">{f.child_feedback}</p></div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2"><div className="bg-white rounded-lg p-2 border text-center"><p className="text-xs text-muted-foreground">Professionalism</p><p className="font-bold">{f.professionalism_rating}/5</p></div><div className="bg-white rounded-lg p-2 border text-center"><p className="text-xs text-muted-foreground">Relational</p><p className="font-bold">{f.relational_skills_rating}/5</p></div><div className="bg-white rounded-lg p-2 border text-center"><p className="text-xs text-muted-foreground">Recording</p><p className="font-bold">{RECORDING_QUALITY_LABEL[f.recording_quality]}</p></div></div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div className={cn("rounded p-2 text-center", f.follows_routines ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800")}>Routines: {f.follows_routines ? "✓" : "Action"}</div>
                    <div className={cn("rounded p-2 text-center", f.follows_behaviour_support_plans ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>BSP: {f.follows_behaviour_support_plans ? "✓" : "Action"}</div>
                    <div className={cn("rounded p-2 text-center", f.follows_sensory_protocols ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800")}>Sensory: {f.follows_sensory_protocols ? "✓" : "Action"}</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3"><p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Feedback Summary</p><p>{f.feedback_summary}</p></div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t"><span>Feedback to agency: {f.feedback_to_agency_date}</span><span>Reviewed: {getStaffName(f.reviewed_by)}</span><span>Action: {f.follow_up_action}</span></div>
                  {f.notes && <div className="bg-slate-50 rounded-lg p-3 border"><p className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Notes</p><p>{f.notes}</p></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-8 rounded-lg bg-muted/50 border p-4"><p className="text-xs text-muted-foreground"><strong>Regulatory Context:</strong> Agency staff feedback supports Quality Standard 13 (workforce), Reg 32 (fitness of workers — extends to agency cover), and consistent practice standards. Linked to Agency Staff Induction and Staff Recognition Log.</p></div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Agency Staff Feedback — performance review after cover shifts, approval decisions, repeat booking, recording quality, relational practice alignment"
        recordType="supervision"
        className="mt-6"
      />
    </PageShell>
  );
}
