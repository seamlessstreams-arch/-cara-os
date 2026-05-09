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
  AlertTriangle, CheckCircle2, Clock, Stethoscope, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useHealthMonitoring, useCreateHealthMonitoring } from "@/hooks/use-health-monitoring";
import type { HealthMonitoringEntry, HealthMonitoringType, HealthMonitoringStatus } from "@/types/extended";
import { HEALTH_MONITORING_TYPE_LABEL, HEALTH_MONITORING_STATUS_LABEL } from "@/types/extended";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { toast } from "sonner";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const TYPE_CLR: Record<HealthMonitoringType, string> = {
  dental: "bg-blue-100 text-blue-800", optician: "bg-purple-100 text-purple-800",
  immunisation: "bg-green-100 text-green-800", gp_registration: "bg-teal-100 text-teal-800",
  annual_health: "bg-indigo-100 text-indigo-800", hearing: "bg-amber-100 text-amber-800",
  growth: "bg-pink-100 text-pink-800", sexual_health: "bg-slate-100 text-slate-800",
};
const STAT_CLR: Record<HealthMonitoringStatus, string> = { completed: "bg-green-100 text-green-800", scheduled: "bg-blue-100 text-blue-800", overdue: "bg-red-100 text-red-800", declined: "bg-amber-100 text-amber-800", cancelled: "bg-gray-100 text-gray-800", not_due: "bg-slate-100 text-slate-800" };

/* ── component ─────────────────────────────────────────────────────────────── */

export default function HealthMonitoringPage() {
  const { data: raw, isLoading } = useHealthMonitoring();
  const createMut = useCreateHealthMonitoring();
  const records = useMemo(() => raw?.data ?? [], [raw]);

  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("overdue");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState({
    child_id: "",
    type: "" as HealthMonitoringType | "",
    provider: "",
    date: "",
    next_due: "",
    outcome: "",
  });

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const filtered = useMemo(() => {
    let out = [...records];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => getYPName(r.child_id).toLowerCase().includes(s) || r.provider.toLowerCase().includes(s)); }
    if (childFilter !== "all") out = out.filter(r => r.child_id === childFilter);
    if (typeFilter !== "all") out = out.filter(r => r.type === typeFilter);
    if (statusFilter !== "all") out = out.filter(r => r.status === statusFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "type": return a.type.localeCompare(b.type);
        default: { const od = (r: HealthMonitoringEntry) => r.status === "overdue" ? 0 : r.status === "scheduled" ? 1 : 2; return od(a) - od(b); }
      }
    });
    return out;
  }, [records, search, childFilter, typeFilter, statusFilter, sortBy]);

  const childIds = ["yp_alex", "yp_jordan", "yp_casey"];
  const overdue = records.filter(r => r.status === "overdue").length;
  const scheduled = records.filter(r => r.status === "scheduled").length;
  const completed = records.filter(r => r.status === "completed").length;

  const exportCols: ExportColumn<HealthMonitoringEntry>[] = useMemo(() => [
    { header: "Young Person", accessor: (r: HealthMonitoringEntry) => getYPName(r.child_id) },
    { header: "Type", accessor: (r: HealthMonitoringEntry) => HEALTH_MONITORING_TYPE_LABEL[r.type] },
    { header: "Provider", accessor: (r: HealthMonitoringEntry) => r.provider },
    { header: "Date", accessor: (r: HealthMonitoringEntry) => r.date },
    { header: "Next Due", accessor: (r: HealthMonitoringEntry) => r.next_due },
    { header: "Status", accessor: (r: HealthMonitoringEntry) => HEALTH_MONITORING_STATUS_LABEL[r.status] },
    { header: "Attended By", accessor: (r: HealthMonitoringEntry) => r.attended_by ? getStaffName(r.attended_by) : "—" },
    { header: "Outcome", accessor: (r: HealthMonitoringEntry) => r.outcome || "—" },
    { header: "Consent From", accessor: (r: HealthMonitoringEntry) => r.consent_from },
    { header: "Follow-Up", accessor: (r: HealthMonitoringEntry) => r.follow_up || "None" },
  ], []);

  if (isLoading) {
    return (
      <PageShell title="Health Monitoring" subtitle="Loading…">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Health Monitoring"
      subtitle="Dental, optician, immunisation, and routine health checks — Regulation 23"
      actions={[
        <PrintButton key="p" title="Health Monitoring" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="health-monitoring" />,
        <Button key="n" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Record</Button>,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Records", value: records.length, icon: Stethoscope, colour: "text-blue-600" },
            { label: "Completed", value: completed, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Scheduled", value: scheduled, icon: Clock, colour: "text-blue-600" },
            { label: "Overdue", value: overdue, icon: AlertTriangle, colour: "text-red-600" },
          ].map(s => (
            <Card key={s.label}><CardContent className="pt-4 flex items-center gap-3"><s.icon className={cn("h-8 w-8", s.colour)} /><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
          ))}
        </div>

        {/* overdue alert */}
        {overdue > 0 && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">{overdue} overdue appointment{overdue > 1 ? "s" : ""}</p>
              <ul className="text-sm text-red-800 mt-1 list-disc list-inside">{records.filter(r => r.status === "overdue").map(r => <li key={r.id}>{getYPName(r.child_id)} — {HEALTH_MONITORING_TYPE_LABEL[r.type]} (due {r.next_due})</li>)}</ul>
            </div>
          </div>
        )}

        {/* per-child health matrix */}
        <Card>
          <CardHeader><CardTitle className="text-base">Health Check Matrix</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-muted/50">
                  <tr><th className="text-left p-2 font-medium">Young Person</th>
                  {(Object.entries(HEALTH_MONITORING_TYPE_LABEL) as [HealthMonitoringType, string][]).map(([k, v]) => <th key={k} className="text-center p-2 font-medium text-xs">{v}</th>)}</tr>
                </thead>
                <tbody>
                  {childIds.map(cid => (
                    <tr key={cid} className="border-t">
                      <td className="p-2 font-medium">{getYPName(cid)}</td>
                      {(Object.keys(HEALTH_MONITORING_TYPE_LABEL) as HealthMonitoringType[]).map(t => {
                        const rec = records.filter(r => r.child_id === cid && r.type === t).sort((a, b) => b.date.localeCompare(a.date))[0];
                        return (
                          <td key={t} className="p-2 text-center">
                            {rec ? <Badge className={cn("text-xs", STAT_CLR[rec.status])}>{HEALTH_MONITORING_STATUS_LABEL[rec.status]}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* filter */}
        <Card><CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]"><Label className="text-xs">Search</Label><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Name, provider…" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Child</Label><Select value={childFilter} onValueChange={setChildFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-44"><Label className="text-xs">Type</Label><Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(HEALTH_MONITORING_TYPE_LABEL) as [HealthMonitoringType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-36"><Label className="text-xs">Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(HEALTH_MONITORING_STATUS_LABEL) as [HealthMonitoringStatus, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="overdue">Overdue First</SelectItem><SelectItem value="date">Date</SelectItem><SelectItem value="type">Type</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent></Card>

        {/* record cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            return (
              <Card key={r.id} className={cn(r.status === "overdue" && "border-red-300")}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{getYPName(r.child_id)}</CardTitle>
                        <Badge className={cn("text-xs", TYPE_CLR[r.type])}>{HEALTH_MONITORING_TYPE_LABEL[r.type]}</Badge>
                        <Badge className={cn("text-xs", STAT_CLR[r.status])}>{HEALTH_MONITORING_STATUS_LABEL[r.status]}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{r.date}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.provider}</p>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-3 pt-0">
                    {r.attended_by && <p className="text-sm"><strong>Attended by:</strong> {getStaffName(r.attended_by)}</p>}
                    {r.outcome && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-semibold text-green-800 mb-1">Outcome</p>
                        <p className="text-sm text-green-900">{r.outcome}</p>
                      </div>
                    )}
                    {r.recommendations.length > 0 && (
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-1">Recommendations</p>
                        <ul className="text-sm text-blue-900 list-disc list-inside">{r.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}</ul>
                      </div>
                    )}
                    {r.follow_up && <p className="text-sm"><strong>Follow-up:</strong> {r.follow_up}</p>}
                    {r.child_views && (
                      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                        <p className="text-xs font-semibold text-pink-800 mb-1">Child&apos;s Views</p>
                        <p className="text-sm text-pink-900">{r.child_views}</p>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      <span>Consent: {r.consent_from}</span> · <span>Next due: <strong className={cn(r.next_due < today && "text-red-600")}>{r.next_due}</strong></span>
                    </div>
                    <SmartLinkPanel sourceType="health-monitoring" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>Children&apos;s Homes Regulations 2015, Reg 23 — Health of children. Looked-after children must have access to dental check-ups every 6 months, annual eye tests, up-to-date immunisations, and statutory health assessments. All health appointments must be tracked, consented by the appropriate person, and outcomes documented.</p>
        </div>
      </div>

      {/* dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Health Record</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Young Person</Label><Select value={draft.child_id} onValueChange={v => setDraft(d => ({ ...d, child_id: v }))}><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger><SelectContent>{childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Type</Label><Select value={draft.type} onValueChange={v => setDraft(d => ({ ...d, type: v as HealthMonitoringType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(HEALTH_MONITORING_TYPE_LABEL) as [HealthMonitoringType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Provider</Label><Input placeholder="e.g. Millbrook Dental Practice" value={draft.provider} onChange={e => setDraft(d => ({ ...d, provider: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Date</Label><Input type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} /></div><div><Label>Next Due</Label><Input type="date" value={draft.next_due} onChange={e => setDraft(d => ({ ...d, next_due: e.target.value }))} /></div></div>
            <div><Label>Outcome</Label><Textarea rows={2} placeholder="Appointment outcome…" value={draft.outcome} onChange={e => setDraft(d => ({ ...d, outcome: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!draft.child_id || !draft.type) return;
              createMut.mutate({
                child_id: draft.child_id,
                type: draft.type as HealthMonitoringType,
                provider: draft.provider,
                date: draft.date,
                next_due: draft.next_due,
                outcome: draft.outcome,
                status: "scheduled" as HealthMonitoringStatus,
                recommendations: [],
                follow_up: "",
                consent_obtained: false,
                consent_from: "",
                child_views: "",
                attended_by: null,
                notes: "",
              }, {
                onSuccess: () => {
                  toast.success("Health record added");
                  setDialogOpen(false);
                  setDraft({ child_id: "", type: "", provider: "", date: "", next_due: "", outcome: "" });
                },
              });
            }}>Save Record</Button>
          </DialogFooter>
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
