"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
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
  AlertTriangle, CheckCircle2, Clock, UtensilsCrossed, Thermometer, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { toast } from "sonner";
import type { FoodHygieneRecord, FoodHygieneCheckType, FoodHygieneCompliance } from "@/types/extended";
import { FOOD_HYGIENE_CHECK_TYPE_LABEL, FOOD_HYGIENE_COMPLIANCE_LABEL } from "@/types/extended";
import { useFoodHygieneRecords, useCreateFoodHygieneRecord } from "@/hooks/use-food-hygiene-records";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const COMPLIANCE_CLR: Record<FoodHygieneCompliance, string> = { pass: "bg-green-100 text-green-800", fail: "bg-red-100 text-red-800", action_required: "bg-amber-100 text-amber-800", n_a: "bg-slate-100 text-[var(--cs-navy)]" };
const BORDER_COMP: Record<FoodHygieneCompliance, string> = { pass: "border-l-green-400", fail: "border-l-red-600", action_required: "border-l-amber-400", n_a: "border-l-slate-300" };

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function FoodHygienePage() {
  const { data: res, isLoading } = useFoodHygieneRecords();
  const records = res?.data ?? [];
  const createMutation = useCreateFoodHygieneRecord();

  const [search, setSearch] = useState("");
  const [filterCompliance, setFilterCompliance] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState<Partial<FoodHygieneRecord>>({});

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = records.filter((r) => {
      if (filterCompliance !== "all" && r.compliance !== filterCompliance) return false;
      if (filterType !== "all" && r.check_type !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.area.toLowerCase().includes(q) || r.details.toLowerCase().includes(q) || FOOD_HYGIENE_CHECK_TYPE_LABEL[r.check_type].toLowerCase().includes(q);
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date) || b.time.localeCompare(a.time);
        case "date-asc": return a.date.localeCompare(b.date);
        case "compliance": { const o = ["fail", "action_required", "pass", "n_a"]; return o.indexOf(a.compliance) - o.indexOf(b.compliance); }
        default: return 0;
      }
    });
    return rows;
  }, [records, search, filterCompliance, filterType, sortBy]);

  const totalChecks = records.length;
  const passCount = records.filter((r) => r.compliance === "pass").length;
  const failCount = records.filter((r) => r.compliance === "fail").length;
  const actionReq = records.filter((r) => r.compliance === "action_required" && !r.action_completed).length;

  const exportCols: ExportColumn<FoodHygieneRecord>[] = [
    { header: "Date", accessor: (r: FoodHygieneRecord) => r.date },
    { header: "Time", accessor: (r: FoodHygieneRecord) => r.time },
    { header: "Check Type", accessor: (r: FoodHygieneRecord) => FOOD_HYGIENE_CHECK_TYPE_LABEL[r.check_type] },
    { header: "Area", accessor: (r: FoodHygieneRecord) => r.area },
    { header: "Compliance", accessor: (r: FoodHygieneRecord) => FOOD_HYGIENE_COMPLIANCE_LABEL[r.compliance] },
    { header: "Temperature", accessor: (r: FoodHygieneRecord) => r.temperature !== null ? String(r.temperature) + "°C" : "N/A" },
    { header: "Details", accessor: (r: FoodHygieneRecord) => r.details },
    { header: "Action", accessor: (r: FoodHygieneRecord) => r.action_required },
    { header: "Checked By", accessor: (r: FoodHygieneRecord) => getStaffName(r.checked_by) },
    { header: "Next Due", accessor: (r: FoodHygieneRecord) => r.next_due_date },
  ];

  if (isLoading) {
    return (
      <PageShell title="Food Hygiene & Safety" subtitle="Food Safety Act 1990 · HACCP · Reg 12 — Safe Environment">
        <div className="flex items-center justify-center py-12 text-muted-foreground">Loading food hygiene records…</div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Food Hygiene & Safety" subtitle="Food Safety Act 1990 · HACCP · Reg 12 — Safe Environment" 
      caraContext={{ pageTitle: "Food Hygiene & Safety", sourceType: "child_record" }}
      actions={<div className="flex items-center gap-2"><PrintButton title="Food Hygiene Records" /><ExportButton data={filtered} columns={exportCols} filename="food-hygiene" /><CaraStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} /><Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Record Check</Button></div>}>
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Checks", value: totalChecks, icon: UtensilsCrossed, clr: "text-blue-600" },
            { label: "Pass", value: passCount, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Fail", value: failCount, icon: AlertTriangle, clr: "text-red-600" },
            { label: "Actions Outstanding", value: actionReq, icon: Clock, clr: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="pt-4 pb-3 text-center"><s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} /><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>

        {failCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm"><p className="font-semibold text-red-800">{failCount} check(s) failed</p><p className="text-red-700">Immediate corrective action required. Temperature failures may require disposal of affected food items.</p></div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search area, details, type…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={filterCompliance} onValueChange={setFilterCompliance}><SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Results</SelectItem>{(Object.keys(FOOD_HYGIENE_COMPLIANCE_LABEL) as FoodHygieneCompliance[]).map((k) => (<SelectItem key={k} value={k}>{FOOD_HYGIENE_COMPLIANCE_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{(Object.keys(FOOD_HYGIENE_CHECK_TYPE_LABEL) as FoodHygieneCheckType[]).map((k) => (<SelectItem key={k} value={k}>{FOOD_HYGIENE_CHECK_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date-desc">Newest First</SelectItem><SelectItem value="date-asc">Oldest First</SelectItem><SelectItem value="compliance">By Result</SelectItem></SelectContent></Select>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_COMP[r.compliance])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {FOOD_HYGIENE_CHECK_TYPE_LABEL[r.check_type]}
                        <Badge variant="outline" className={COMPLIANCE_CLR[r.compliance]}>{FOOD_HYGIENE_COMPLIANCE_LABEL[r.compliance]}</Badge>
                        {r.temperature !== null && <Badge variant="outline" className={r.compliance === "pass" ? "bg-green-50" : "bg-red-50"}><Thermometer className="h-3 w-3 mr-1" />{r.temperature}°C</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{r.area} · {r.date} at {r.time} · By: {getStaffName(r.checked_by)}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {r.temperature !== null && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Reading</p><p className="text-lg font-bold">{r.temperature}°C</p></div>
                        <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Min</p><p className="text-lg font-bold">{r.target_min !== null ? `${r.target_min}°C` : "—"}</p></div>
                        <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Max</p><p className="text-lg font-bold">{r.target_max !== null ? `${r.target_max}°C` : "—"}</p></div>
                      </div>
                    )}
                    <div><p className="font-medium mb-1">Details</p><p className="text-muted-foreground">{r.details}</p></div>
                    {r.action_required && (
                      <div className={cn("rounded-lg p-3", r.action_completed ? "bg-green-50" : "bg-amber-50")}>
                        <p className={cn("font-medium mb-1", r.action_completed ? "text-green-800" : "text-amber-800")}>{r.action_completed ? "✓ Action Completed" : "⚠ Action Required"}</p>
                        <p className={cn("text-xs", r.action_completed ? "text-green-700" : "text-amber-700")}>{r.action_required}</p>
                        {r.action_completed && r.action_completed_date && <p className="text-xs text-green-600 mt-1">Completed: {r.action_completed_date}</p>}
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground"><span>Checked by: {getStaffName(r.checked_by)}</span><span>Next due: {r.next_due_date}</span></div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Food Safety Act 1990 — legal obligation to ensure food is safe to eat. Food Hygiene Regulations 2006 — HACCP principles. Food Standards Agency guidance. Children&apos;s Homes (England) Regulations 2015, Reg 12 — safe environment. Fridge ≤5°C, freezer ≤-18°C, cooked food core temp ≥75°C. Allergen information must be available for all meals served. Level 2 Food Hygiene certificate required for all staff preparing food.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Food Hygiene Check</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date</Label><Input type="date" value={draft.date ?? ""} onChange={(e) => setDraft((p) => ({ ...p, date: e.target.value }))} /></div>
            <div><Label>Time</Label><Input type="time" value={draft.time ?? ""} onChange={(e) => setDraft((p) => ({ ...p, time: e.target.value }))} /></div>
            <div><Label>Check Type</Label><Select value={draft.check_type ?? ""} onValueChange={(v) => setDraft((p) => ({ ...p, check_type: v as FoodHygieneCheckType }))}><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(FOOD_HYGIENE_CHECK_TYPE_LABEL) as FoodHygieneCheckType[]).map((k) => (<SelectItem key={k} value={k}>{FOOD_HYGIENE_CHECK_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Area</Label><Input placeholder="e.g. Main kitchen fridge" value={draft.area ?? ""} onChange={(e) => setDraft((p) => ({ ...p, area: e.target.value }))} /></div>
            <div><Label>Temperature (°C)</Label><Input type="number" placeholder="If applicable" value={draft.temperature ?? ""} onChange={(e) => setDraft((p) => ({ ...p, temperature: e.target.value ? Number(e.target.value) : null }))} /></div>
            <div><Label>Result</Label><Select value={draft.compliance ?? ""} onValueChange={(v) => setDraft((p) => ({ ...p, compliance: v as FoodHygieneCompliance }))}><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(FOOD_HYGIENE_COMPLIANCE_LABEL) as FoodHygieneCompliance[]).map((k) => (<SelectItem key={k} value={k}>{FOOD_HYGIENE_COMPLIANCE_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Details</Label><Textarea rows={3} placeholder="Details of the check…" value={draft.details ?? ""} onChange={(e) => setDraft((p) => ({ ...p, details: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Action Required</Label><Textarea rows={2} placeholder="If failed, what actions?" value={draft.action_required ?? ""} onChange={(e) => setDraft((p) => ({ ...p, action_required: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setShowNew(false); setDraft({}); }}>Cancel</Button><Button disabled={createMutation.isPending} onClick={() => { createMutation.mutate(draft, { onSuccess: () => { toast.success("Food hygiene check recorded"); setShowNew(false); setDraft({}); } }); }}>Save Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Food"
        category="food"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Food Hygiene & Safety — fridge temperatures, cleaning schedules, food storage, allergens, HACCP compliance, Environmental Health inspections, staff food hygiene training"
        recordType="ofsted_evidence"
        className="mt-6"
      />
    </PageShell>
  );
}
