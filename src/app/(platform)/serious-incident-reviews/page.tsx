"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Clock, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName, STAFF } from "@/lib/seed-data";
import { toast } from "sonner";
import { useSeriousIncidentReviewRecords, useCreateSeriousIncidentReviewRecord } from "@/hooks/use-serious-incident-review-records";
import type { SeriousIncidentReviewRecord, SeriousIncidentReviewType, SeriousIncidentReviewStatus } from "@/types/extended";
import {
  SERIOUS_INCIDENT_REVIEW_TYPE_LABEL,
  SERIOUS_INCIDENT_REVIEW_STATUS_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local config ─────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const RT_CLR: Record<SeriousIncidentReviewType, string> = { serious_incident: "bg-red-100 text-red-800", near_miss: "bg-amber-100 text-amber-800", safeguarding_practice: "bg-purple-100 text-purple-800", complaint_learning: "bg-orange-100 text-orange-800", external_review: "bg-blue-100 text-blue-800", thematic: "bg-indigo-100 text-indigo-800" };
const RS_CLR: Record<SeriousIncidentReviewStatus, string> = { initiated: "bg-blue-100 text-blue-800", under_review: "bg-amber-100 text-amber-800", draft_report: "bg-purple-100 text-purple-800", final_report: "bg-indigo-100 text-indigo-800", actions_in_progress: "bg-orange-100 text-orange-800", closed: "bg-green-100 text-green-800", monitoring: "bg-teal-100 text-teal-800" };
const CONF_CLR: Record<string, string> = { standard: "bg-gray-100 text-gray-800", restricted: "bg-amber-100 text-amber-800", highly_restricted: "bg-red-900 text-white" };

/* ── component ────────────────────────────────────────────────────────────── */

export default function SeriousIncidentReviewsPage() {
  const { data: records = [], isLoading } = useSeriousIncidentReviewRecords();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const createSIR = useCreateSeriousIncidentReviewRecord();
  const [sirForm, setSirForm] = useState({ title: "", review_type: "serious_incident" as SeriousIncidentReviewType, incident_date: "", review_commenced_date: new Date().toISOString().slice(0, 10), background: "" });
  const setSIR = (k: keyof typeof sirForm, v: string) => setSirForm((p) => ({ ...p, [k]: v }));

  const handleInitiateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sirForm.title.trim()) { toast.error("Title is required."); return; }
    if (!sirForm.incident_date) { toast.error("Incident date is required."); return; }
    await createSIR.mutateAsync({ title: sirForm.title.trim(), review_type: sirForm.review_type, incident_date: sirForm.incident_date, review_commenced_date: sirForm.review_commenced_date, review_completed_date: null, linked_incidents: [], young_people_involved: [], staff_involved: [], review_lead: "staff_darren", panel_members: [], background_summary: sirForm.background.trim(), key_findings: [], lessons_learned: [], recommendations: [], actions: [], external_notifications: [], practice_changes: [], training_implications: [], policy_changes: [], status: "initiated", next_review_date: null, confidentiality: "standard" });
    toast.success("Serious incident review initiated.");
    setSirForm({ title: "", review_type: "serious_incident", incident_date: "", review_commenced_date: new Date().toISOString().slice(0, 10), background: "" });
    setDialogOpen(false);
  };

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);
  const today = d(0);

  const filtered = useMemo(() => {
    let out = [...records];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => r.title.toLowerCase().includes(s) || r.background_summary.toLowerCase().includes(s)); }
    if (typeFilter !== "all") out = out.filter(r => r.review_type === typeFilter);
    if (statusFilter !== "all") out = out.filter(r => r.status === statusFilter);
    out.sort((a, b) => sortBy === "oldest" ? a.incident_date.localeCompare(b.incident_date) : b.incident_date.localeCompare(a.incident_date));
    return out;
  }, [records, search, typeFilter, statusFilter, sortBy]);

  const openReviews = records.filter(r => r.status !== "closed").length;
  const pendingActions = records.reduce((s, r) => s + r.actions.filter(a => a.status !== "completed").length, 0);
  const lessonsTotal = records.reduce((s, r) => s + r.lessons_learned.length, 0);

  const exportCols: ExportColumn<SeriousIncidentReviewRecord>[] = useMemo(() => [
    { header: "Title", accessor: (r) => r.title },
    { header: "Type", accessor: (r) => SERIOUS_INCIDENT_REVIEW_TYPE_LABEL[r.review_type] },
    { header: "Incident Date", accessor: (r) => r.incident_date },
    { header: "Status", accessor: (r) => SERIOUS_INCIDENT_REVIEW_STATUS_LABEL[r.status] },
    { header: "Review Lead", accessor: (r) => getStaffName(r.review_lead) },
    { header: "YP Involved", accessor: (r) => r.young_people_involved.map(id => getYPName(id)).join(", ") },
    { header: "Key Findings", accessor: (r) => r.key_findings.join("; ") },
    { header: "Lessons", accessor: (r) => r.lessons_learned.map(l => l.lesson).join("; ") },
    { header: "Actions Pending", accessor: (r) => String(r.actions.filter(a => a.status !== "completed").length) },
    { header: "Confidentiality", accessor: (r) => r.confidentiality },
  ], []);

  if (isLoading) {
    return (
      <PageShell title="Serious Incident Reviews" subtitle="Learning reviews, practice analysis, and lessons implemented">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Serious Incident Reviews"
      subtitle="Learning reviews, practice analysis, and lessons implemented"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Serious Incident Reviews" />
          <ExportButton data={filtered} columns={exportCols} filename="serious-incident-reviews" />
          <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />New Review</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Reviews", value: records.length, icon: FileText, colour: "text-blue-600" },
            { label: "Open Reviews", value: openReviews, icon: Clock, colour: "text-amber-600" },
            { label: "Pending Actions", value: pendingActions, icon: AlertTriangle, colour: "text-red-600" },
            { label: "Lessons Captured", value: lessonsTotal, icon: CheckCircle2, colour: "text-green-600" },
          ].map(s => (
            <Card key={s.label}><CardContent className="pt-4 flex items-center gap-3"><s.icon className={cn("h-8 w-8", s.colour)} /><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
          ))}
        </div>

        <Card><CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]"><Label className="text-xs">Search</Label><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Title, summary…" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
            <div className="w-44"><Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Type</Label><Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(SERIOUS_INCIDENT_REVIEW_TYPE_LABEL) as [SeriousIncidentReviewType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-44"><Label className="text-xs">Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(SERIOUS_INCIDENT_REVIEW_STATUS_LABEL) as [SeriousIncidentReviewStatus, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="oldest">Oldest</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent></Card>

        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            const pendAct = r.actions.filter(a => a.status !== "completed").length;
            return (
              <Card key={r.id} className={cn(r.confidentiality === "highly_restricted" && "border-red-400")}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{r.title}</CardTitle>
                        <Badge className={cn("text-xs", RT_CLR[r.review_type])}>{SERIOUS_INCIDENT_REVIEW_TYPE_LABEL[r.review_type]}</Badge>
                        <Badge className={cn("text-xs", RS_CLR[r.status])}>{SERIOUS_INCIDENT_REVIEW_STATUS_LABEL[r.status]}</Badge>
                        <Badge className={cn("text-xs", CONF_CLR[r.confidentiality])}>{r.confidentiality.replace("_", " ")}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {pendAct > 0 && <Badge className="text-xs bg-red-100 text-red-800">{pendAct} actions pending</Badge>}
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Incident: {r.incident_date} · Lead: {getStaffName(r.review_lead)} · YP: {r.young_people_involved.map(id => getYPName(id)).join(", ")}</p>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-1">Background Summary</p>
                      <p className="text-sm text-blue-900">{r.background_summary}</p>
                    </div>

                    <div><p className="text-xs font-semibold mb-1">Review Panel</p>
                      <div className="flex gap-2 flex-wrap">{r.panel_members.map((m, i) => <Badge key={i} variant="outline" className="text-xs">{m.name} ({m.role})</Badge>)}</div>
                    </div>

                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-1">Key Findings</p>
                      <ol className="text-sm text-amber-900 list-decimal list-inside space-y-0.5">{r.key_findings.map((f, i) => <li key={i}>{f}</li>)}</ol>
                    </div>

                    <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                      <p className="text-xs font-semibold text-purple-800 mb-1">Lessons Learned</p>
                      {r.lessons_learned.map((l, i) => (
                        <div key={i} className="flex items-start gap-2 mb-1 last:mb-0">
                          <Badge className={cn("text-xs shrink-0", l.impact_level === "high" ? "bg-red-100 text-red-800" : l.impact_level === "medium" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800")}>{l.impact_level}</Badge>
                          <span className="text-sm text-purple-900">{l.lesson} <span className="text-xs text-muted-foreground">({l.category})</span></span>
                        </div>
                      ))}
                    </div>

                    <div><p className="text-xs font-semibold mb-2">Action Plan</p>
                      <table className="w-full text-sm border"><thead className="bg-muted/50"><tr><th className="text-left p-2 font-medium">Action</th><th className="text-left p-2 font-medium">Owner</th><th className="text-left p-2 font-medium">Due</th><th className="text-left p-2 font-medium">Status</th></tr></thead>
                        <tbody>{r.actions.map((a, i) => {
                          const od = a.status !== "completed" && a.due_date < today;
                          return (
                            <tr key={i} className={cn("border-t", od && "bg-red-50")}>
                              <td className="p-2">{a.action}</td><td className="p-2">{getStaffName(a.owner)}</td>
                              <td className={cn("p-2", od && "text-red-600 font-medium")}>{a.due_date}</td>
                              <td className="p-2"><Badge className={cn("text-xs", a.status === "completed" ? "bg-green-100 text-green-800" : a.status === "in_progress" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800")}>{a.status.replace("_", " ")}</Badge></td>
                            </tr>
                          );
                        })}</tbody>
                      </table>
                    </div>

                    {r.external_notifications.length > 0 && (
                      <div><p className="text-xs font-semibold mb-1">External Notifications</p>
                        <div className="flex gap-2 flex-wrap">{r.external_notifications.map((n, i) => <Badge key={i} variant="outline" className="text-xs">{n.body} — {n.date} (Ref: {n.reference})</Badge>)}</div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-3">
                      {r.practice_changes.length > 0 && (
                        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                          <p className="text-xs font-semibold text-green-800 mb-1">Practice Changes</p>
                          <ul className="text-xs text-green-900 list-disc list-inside">{r.practice_changes.map((p, i) => <li key={i}>{p}</li>)}</ul>
                        </div>
                      )}
                      {r.training_implications.length > 0 && (
                        <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                          <p className="text-xs font-semibold text-indigo-800 mb-1">Training Implications</p>
                          <ul className="text-xs text-indigo-900 list-disc list-inside">{r.training_implications.map((t, i) => <li key={i}>{t}</li>)}</ul>
                        </div>
                      )}
                      {r.policy_changes.length > 0 && (
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                          <p className="text-xs font-semibold text-slate-800 mb-1">Policy Changes</p>
                          <ul className="text-xs text-slate-900 list-disc list-inside">{r.policy_changes.map((p, i) => <li key={i}>{p}</li>)}</ul>
                        </div>
                      )}
                    </div>

                    {r.next_review_date && <p className="text-xs text-muted-foreground">Next review: <strong>{r.next_review_date}</strong></p>}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>Children&apos;s Homes Regulations 2015, Reg 40 — Notification of serious events. All serious incidents must be reviewed with lessons learned documented and actions implemented. Ofsted must be notified of serious events. Reviews must consider multi-agency input and result in measurable improvements to practice.</p>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Initiate Review</DialogTitle></DialogHeader>
          <form onSubmit={handleInitiateReview} className="space-y-3">
            <div><Label>Title *</Label><Input placeholder="Review title" value={sirForm.title} onChange={(e) => setSIR("title", e.target.value)} /></div>
            <div><Label>Review Type</Label><Select value={sirForm.review_type} onValueChange={(v) => setSIR("review_type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(SERIOUS_INCIDENT_REVIEW_TYPE_LABEL) as [SeriousIncidentReviewType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Incident Date *</Label><Input type="date" value={sirForm.incident_date} onChange={(e) => setSIR("incident_date", e.target.value)} /></div><div><Label>Review Start</Label><Input type="date" value={sirForm.review_commenced_date} onChange={(e) => setSIR("review_commenced_date", e.target.value)} /></div></div>
            <div><Label>Background Summary</Label><Textarea rows={3} placeholder="Background and context…" value={sirForm.background} onChange={(e) => setSIR("background", e.target.value)} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={createSIR.isPending}>{createSIR.isPending ? "Initiating…" : "Initiate"}</Button></DialogFooter>
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
