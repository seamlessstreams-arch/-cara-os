"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { toast } from "sonner";
import { useProfessionalConsultations, useCreateProfessionalConsultation } from "@/hooks/use-professional-consultations";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { ProfessionalConsultation, ProfConsultationType, ProfConsultationMethod } from "@/types/extended";
import { PROF_CONSULTATION_TYPE_LABEL, PROF_CONSULTATION_METHOD_LABEL } from "@/types/extended";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  Calendar, AlertTriangle, Stethoscope, MessageSquare, Loader2,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── local colour maps ───────────────────────────────────────────────────────
const TYPE_COLOR: Record<ProfConsultationType, string> = {
  camhs: "bg-pink-100 text-pink-800",
  social_worker: "bg-blue-100 text-blue-800",
  iro: "bg-purple-100 text-purple-800",
  lado: "bg-red-100 text-red-800",
  police: "bg-slate-100 text-slate-800",
  gp: "bg-green-100 text-green-800",
  therapist: "bg-rose-100 text-rose-800",
  education: "bg-indigo-100 text-indigo-800",
  legal: "bg-amber-100 text-amber-800",
  ofsted: "bg-orange-100 text-orange-800",
  other: "bg-gray-100 text-gray-800",
};

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

export default function ProfessionalConsultationsPage() {
  const { data: records = [], isLoading } = useProfessionalConsultations();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [childFilter, setChildFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const createConsultation = useCreateProfessionalConsultation();
  const [pcForm, setPcForm] = useState({ date: new Date().toISOString().slice(0, 10), time: "", type: "social_worker" as ProfConsultationType, method: "phone" as ProfConsultationMethod, professional_name: "", organisation: "", reason: "", advice_given: "" });
  const setPC = (k: string, v: unknown) => setPcForm((p) => ({ ...p, [k]: v }));

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pcForm.professional_name.trim()) { toast.error("Professional name is required."); return; }
    if (!pcForm.reason.trim()) { toast.error("Reason is required."); return; }
    await createConsultation.mutateAsync({ date: pcForm.date, time: pcForm.time, type: pcForm.type, method: pcForm.method, professional_name: pcForm.professional_name.trim(), professional_role: "", organisation: pcForm.organisation.trim(), child_id: "", reason: pcForm.reason.trim(), advice_given: pcForm.advice_given.trim(), actions_agreed: [], follow_up_required: false, follow_up_date: "", follow_up_completed: false, confidential: false, recorded_by: "staff_darren", created_at: new Date().toISOString() });
    toast.success("Consultation recorded.");
    setPcForm({ date: new Date().toISOString().slice(0, 10), time: "", type: "social_worker", method: "phone", professional_name: "", organisation: "", reason: "", advice_given: "" });
    setShowNew(false);
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const children = useMemo(() => {
    const ids = [...new Set(records.filter((r) => r.child_id).map((r) => r.child_id))];
    return ids.map((id) => ({ id, name: getYPName(id) }));
  }, [records]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((r) => r.reason.toLowerCase().includes(s) || r.advice_given.toLowerCase().includes(s) || r.professional_name.toLowerCase().includes(s));
    }
    if (typeFilter !== "all") list = list.filter((r) => r.type === typeFilter);
    if (childFilter !== "all") list = list.filter((r) => r.child_id === childFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "type": return PROF_CONSULTATION_TYPE_LABEL[a.type].localeCompare(PROF_CONSULTATION_TYPE_LABEL[b.type]);
        default: return 0;
      }
    });
    return list;
  }, [records, search, typeFilter, childFilter, sortBy]);

  const stats = useMemo(() => {
    const total = records.length;
    const thisWeek = records.filter((r) => r.date >= d(-7)).length;
    const pendingFollowUp = records.filter((r) => r.follow_up_required && !r.follow_up_completed).length;
    return { total, thisWeek, pendingFollowUp };
  }, [records]);

  const exportCols: ExportColumn<ProfessionalConsultation>[] = [
    { header: "ID", accessor: (r) => r.id },
    { header: "Date", accessor: (r) => r.date },
    { header: "Time", accessor: (r) => r.time },
    { header: "Type", accessor: (r) => PROF_CONSULTATION_TYPE_LABEL[r.type] },
    { header: "Method", accessor: (r) => PROF_CONSULTATION_METHOD_LABEL[r.method] },
    { header: "Professional", accessor: (r) => r.professional_name },
    { header: "Role", accessor: (r) => r.professional_role },
    { header: "Organisation", accessor: (r) => r.organisation },
    { header: "Young Person", accessor: (r) => r.child_id ? getYPName(r.child_id) : "General" },
    { header: "Reason", accessor: (r) => r.reason },
    { header: "Advice Given", accessor: (r) => r.advice_given },
    { header: "Actions", accessor: (r) => r.actions_agreed.join("; ") },
    { header: "Follow Up", accessor: (r) => r.follow_up_date || "—" },
    { header: "Recorded By", accessor: (r) => getStaffName(r.recorded_by) },
  ];

  if (isLoading) {
    return (
      <PageShell title="Professional Consultations" subtitle="Recording advice, guidance, and discussions with external professionals">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Professional Consultations"
      subtitle="Recording advice, guidance, and discussions with external professionals"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "contact_log" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Professional Consultations" />
          <ExportButton data={filtered} columns={exportCols} filename="professional-consultations" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Log Consultation</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Total Consultations", value: stats.total, icon: <Stethoscope className="h-4 w-4" />, color: "text-blue-600" },
            { label: "This Week", value: stats.thisWeek, icon: <Calendar className="h-4 w-4" />, color: "text-green-600" },
            { label: "Pending Follow-Up", value: stats.pendingFollowUp, icon: <AlertTriangle className="h-4 w-4" />, color: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", s.color)}>{s.icon}</div>
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-lg font-bold">{s.value}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search consultations…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {(Object.entries(PROF_CONSULTATION_TYPE_LABEL) as [ProfConsultationType, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={childFilter} onValueChange={setChildFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Child" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No consultations match your filters.</p>}
          {filtered.map((r) => {
            const open = !!expanded[r.id];
            const typeColor = TYPE_COLOR[r.type];
            return (
              <Card key={r.id} className={cn("border-l-4", r.type === "lado" || r.type === "police" ? "border-l-red-400" : r.type === "camhs" || r.type === "therapist" ? "border-l-pink-400" : "border-l-blue-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(r.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", typeColor)}>{PROF_CONSULTATION_TYPE_LABEL[r.type]}</Badge>
                        <Badge variant="outline" className="text-xs">{PROF_CONSULTATION_METHOD_LABEL[r.method]}</Badge>
                        {r.confidential && <Badge variant="outline" className="text-xs text-red-600 border-red-300">Confidential</Badge>}
                        {r.follow_up_required && !r.follow_up_completed && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Follow-up due</Badge>}
                      </div>
                      <p className="font-semibold">{r.professional_name} — {r.professional_role}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{r.date} at {r.time}</span>
                        <span>{r.organisation}</span>
                        {r.child_id && <span>Re: {getYPName(r.child_id)}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.reason}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-3 border-t pt-3 text-sm">
                      <div><p className="font-medium text-muted-foreground mb-1">Reason for Consultation</p><p>{r.reason}</p></div>
                      <div><p className="font-medium text-muted-foreground mb-1">Advice / Guidance Given</p><p className="bg-blue-50 p-2 rounded text-blue-900 text-xs">{r.advice_given}</p></div>
                      {r.actions_agreed.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Actions Agreed</p>
                          <ul className="list-disc list-inside space-y-0.5 text-xs">{r.actions_agreed.map((a, i) => <li key={i}>{a}</li>)}</ul>
                        </div>
                      )}
                      {r.follow_up_required && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Follow-up:</span>
                          <Badge variant="outline" className="text-xs">{r.follow_up_date}</Badge>
                          {r.follow_up_completed ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">Completed</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-amber-600">Pending</Badge>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">Recorded by {getStaffName(r.recorded_by)}</p>

                      {r.child_id && (
                        <SmartLinkPanel sourceType="professional_consultation" sourceId={r.id} childId={r.child_id} compact />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              All professional consultations must be recorded promptly. Advice received informs care planning and risk management. Confidential consultations (e.g. LADO) should be restricted to management access. Follow-up actions must be tracked to completion.
            </span>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Professional Consultation</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveConsultation} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Date</label><Input type="date" value={pcForm.date} onChange={(e) => setPC("date", e.target.value)} /></div>
              <div><label className="text-sm font-medium">Time</label><Input type="time" value={pcForm.time} onChange={(e) => setPC("time", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={pcForm.type} onValueChange={(v) => setPC("type", v)}><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>{(Object.entries(PROF_CONSULTATION_TYPE_LABEL) as [ProfConsultationType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Method</label>
                <Select value={pcForm.method} onValueChange={(v) => setPC("method", v)}><SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                  <SelectContent>{(Object.entries(PROF_CONSULTATION_METHOD_LABEL) as [ProfConsultationMethod, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Professional Name *</label><Input placeholder="Name of professional" value={pcForm.professional_name} onChange={(e) => setPC("professional_name", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Organisation</label><Input placeholder="Organisation" value={pcForm.organisation} onChange={(e) => setPC("organisation", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Reason *</label><Textarea placeholder="Why was this consultation sought?" rows={2} value={pcForm.reason} onChange={(e) => setPC("reason", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Advice Given</label><Textarea placeholder="What advice or guidance was provided?" rows={3} value={pcForm.advice_given} onChange={(e) => setPC("advice_given", e.target.value)} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createConsultation.isPending}>{createConsultation.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
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
