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
import { Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp, CheckCircle2, Clock, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName, STAFF } from "@/lib/seed-data";
import { toast } from "sonner";
import { useStaffReflectionRecords, useCreateStaffReflectionRecord } from "@/hooks/use-staff-reflection-records";
import type { StaffReflectionRecord, StaffReflectionType, StaffReflectionMood } from "@/types/extended";
import { STAFF_REFLECTION_TYPE_LABEL, STAFF_REFLECTION_MOOD_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local config (colours not serializable) ─────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const RT_CLR: Record<StaffReflectionType, string> = { daily: "bg-blue-100 text-blue-800", incident: "bg-red-100 text-red-800", training: "bg-green-100 text-green-800", supervision: "bg-purple-100 text-purple-800", personal_development: "bg-indigo-100 text-indigo-800", critical_event: "bg-red-200 text-red-900", positive_practice: "bg-emerald-100 text-emerald-800" };
const MOOD_CLR: Record<StaffReflectionMood, string> = { positive: "bg-green-100 text-green-800", neutral: "bg-gray-100 text-gray-800", challenging: "bg-amber-100 text-amber-800", difficult: "bg-red-100 text-red-800" };

/* ── component ────────────────────────────────────────────────────────────── */

export default function StaffReflectionsPage() {
  const { data: records = [], isLoading } = useStaffReflectionRecords();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const createRecord = useCreateStaffReflectionRecord();
  const [rfForm, setRfForm] = useState({ staff_id: "", title: "", type: "daily" as StaffReflectionType, mood: "positive" as StaffReflectionMood, what_happened: "", what_i_felt: "", what_i_learned: "", what_i_would_do_differently: "" });
  const setRF = (k: string, v: unknown) => setRfForm((p) => ({ ...p, [k]: v }));

  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfForm.title.trim()) { toast.error("Title is required."); return; }
    await createRecord.mutateAsync({ staff_id: rfForm.staff_id || "staff_darren", date: new Date().toISOString().slice(0, 10), type: rfForm.type, mood: rfForm.mood, title: rfForm.title.trim(), what_happened: rfForm.what_happened.trim(), what_i_felt: rfForm.what_i_felt.trim(), what_i_learned: rfForm.what_i_learned.trim(), what_i_would_do_differently: rfForm.what_i_would_do_differently.trim(), linked_to_yp: [], linked_incident: null, shared_with_manager: false, manager_feedback: "", development_goal: "", is_private: false });
    toast.success("Reflection saved.");
    setRfForm({ staff_id: "", title: "", type: "daily", mood: "positive", what_happened: "", what_i_felt: "", what_i_learned: "", what_i_would_do_differently: "" });
    setDialogOpen(false);
  };

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);
  const staffIds = [...new Set(records.map(r => r.staff_id))];

  const filtered = useMemo(() => {
    let out = [...records];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => r.title.toLowerCase().includes(s) || getStaffName(r.staff_id).toLowerCase().includes(s)); }
    if (typeFilter !== "all") out = out.filter(r => r.type === typeFilter);
    if (staffFilter !== "all") out = out.filter(r => r.staff_id === staffFilter);
    out.sort((a, b) => sortBy === "oldest" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    return out;
  }, [records, search, typeFilter, staffFilter, sortBy]);

  const exportCols: ExportColumn<StaffReflectionRecord>[] = useMemo(() => [
    { header: "Date", accessor: (r: StaffReflectionRecord) => r.date },
    { header: "Staff", accessor: (r: StaffReflectionRecord) => getStaffName(r.staff_id) },
    { header: "Type", accessor: (r: StaffReflectionRecord) => STAFF_REFLECTION_TYPE_LABEL[r.type] },
    { header: "Mood", accessor: (r: StaffReflectionRecord) => STAFF_REFLECTION_MOOD_LABEL[r.mood] },
    { header: "Title", accessor: (r: StaffReflectionRecord) => r.title },
    { header: "What Happened", accessor: (r: StaffReflectionRecord) => r.what_happened },
    { header: "What I Learned", accessor: (r: StaffReflectionRecord) => r.what_i_learned },
    { header: "Development Goal", accessor: (r: StaffReflectionRecord) => r.development_goal },
    { header: "Shared", accessor: (r: StaffReflectionRecord) => r.shared_with_manager ? "Yes" : "No" },
    { header: "Linked YP", accessor: (r: StaffReflectionRecord) => r.linked_to_yp.map(id => getYPName(id)).join(", ") || "—" },
  ], []);

  if (isLoading) {
    return (
      <PageShell title="Staff Reflective Logs" subtitle="Individual reflections on practice, incidents, and professional development">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Staff Reflective Logs"
      subtitle="Individual reflections on practice, incidents, and professional development"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Reflective Logs" />
          <ExportButton data={filtered} columns={exportCols} filename="staff-reflections" />
          <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />New Reflection</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        {/* summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Reflections", value: records.length, icon: BookOpen, colour: "text-blue-600" },
            { label: "Shared with Manager", value: records.filter(r => r.shared_with_manager).length, icon: CheckCircle2, colour: "text-green-600" },
            { label: "This Month", value: records.filter(r => r.date >= d(-30)).length, icon: Clock, colour: "text-indigo-600" },
            { label: "Staff Contributing", value: staffIds.length, icon: BookOpen, colour: "text-purple-600" },
          ].map(s => (
            <Card key={s.label}><CardContent className="pt-4 flex items-center gap-3"><s.icon className={cn("h-8 w-8", s.colour)} /><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
          ))}
        </div>

        {/* filter */}
        <Card><CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]"><Label className="text-xs">Search</Label><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Title, staff…" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
            <div className="w-44"><Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Type</Label><Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(STAFF_REFLECTION_TYPE_LABEL) as [StaffReflectionType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-40"><Label className="text-xs">Staff</Label><Select value={staffFilter} onValueChange={setStaffFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Staff</SelectItem>{staffIds.map(id => <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="oldest">Oldest</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent></Card>

        {/* reflection cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            return (
              <Card key={r.id}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{r.title}</CardTitle>
                        <Badge className={cn("text-xs", RT_CLR[r.type])}>{STAFF_REFLECTION_TYPE_LABEL[r.type]}</Badge>
                        <Badge className={cn("text-xs", MOOD_CLR[r.mood])}>{STAFF_REFLECTION_MOOD_LABEL[r.mood]}</Badge>
                        {r.is_private && <Badge className="text-xs bg-slate-800 text-white">Private</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{r.date} · {getStaffName(r.staff_id)}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-3 pt-0">
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-1">What Happened</p>
                      <p className="text-sm text-blue-900">{r.what_happened}</p>
                    </div>
                    <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                      <p className="text-xs font-semibold text-pink-800 mb-1">What I Felt</p>
                      <p className="text-sm text-pink-900">{r.what_i_felt}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-xs font-semibold text-green-800 mb-1">What I Learned</p>
                      <p className="text-sm text-green-900">{r.what_i_learned}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-1">What I Would Do Differently</p>
                      <p className="text-sm text-amber-900">{r.what_i_would_do_differently}</p>
                    </div>
                    {r.development_goal && (
                      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                        <p className="text-xs font-semibold text-purple-800 mb-1">Development Goal</p>
                        <p className="text-sm text-purple-900">{r.development_goal}</p>
                      </div>
                    )}
                    {r.linked_to_yp.length > 0 && <div className="flex gap-1 flex-wrap"><span className="text-xs text-muted-foreground">Linked YP:</span>{r.linked_to_yp.map(id => <Badge key={id} variant="outline" className="text-xs">{getYPName(id)}</Badge>)}</div>}
                    {r.linked_incident && <p className="text-xs text-muted-foreground">Linked incident: {r.linked_incident}</p>}
                    {r.shared_with_manager && r.manager_feedback && (
                      <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                        <p className="text-xs font-semibold text-indigo-800 mb-1">Manager Feedback</p>
                        <p className="text-sm text-indigo-900">{r.manager_feedback}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Professional Development</p>
          <p>Reflective practice is a cornerstone of professional development in residential child care. Staff are encouraged to reflect regularly on practice, incidents, and learning. Reflections shared with managers contribute to supervision discussions and appraisal evidence.</p>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Reflection</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveReflection} className="space-y-3 py-2">
            <div><Label>Staff Member</Label><Select value={rfForm.staff_id} onValueChange={(v) => setRF("staff_id", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select (defaults to you)…" /></SelectTrigger><SelectContent>{STAFF.filter((s) => s.employment_status === "active").map((s) => (<SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Title *</Label><Input className="mt-1" placeholder="Title of reflection" value={rfForm.title} onChange={(e) => setRF("title", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label><Select value={rfForm.type} onValueChange={(v) => setRF("type", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(STAFF_REFLECTION_TYPE_LABEL) as [StaffReflectionType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Mood</Label><Select value={rfForm.mood} onValueChange={(v) => setRF("mood", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(STAFF_REFLECTION_MOOD_LABEL) as [StaffReflectionMood, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>What Happened</Label><Textarea className="mt-1" rows={3} value={rfForm.what_happened} onChange={(e) => setRF("what_happened", e.target.value)} /></div>
            <div><Label>What I Felt</Label><Textarea className="mt-1" rows={2} value={rfForm.what_i_felt} onChange={(e) => setRF("what_i_felt", e.target.value)} /></div>
            <div><Label>What I Learned</Label><Textarea className="mt-1" rows={2} value={rfForm.what_i_learned} onChange={(e) => setRF("what_i_learned", e.target.value)} /></div>
            <div><Label>What I Would Do Differently</Label><Textarea className="mt-1" rows={2} value={rfForm.what_i_would_do_differently} onChange={(e) => setRF("what_i_would_do_differently", e.target.value)} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={createRecord.isPending}>{createRecord.isPending ? "Saving…" : "Save"}</Button></DialogFooter>
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
