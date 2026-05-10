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
  AlertTriangle, CheckCircle2, Clock, Droplets, Thermometer, ShieldCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, STAFF } from "@/lib/seed-data";
import { useWaterHygieneRecords, useCreateWaterHygieneRecord } from "@/hooks/use-water-hygiene-records";
import { toast } from "sonner";
import type {
  WaterHygieneRecord,
  WaterHygieneCheckType,
  WaterHygieneLocation,
  WaterHygieneCompliance,
} from "@/types/extended";
import {
  WATER_HYGIENE_CHECK_TYPE_LABEL,
  WATER_HYGIENE_LOCATION_LABEL,
  WATER_HYGIENE_COMPLIANCE_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local config ─────────────────────────────────────────────────────── */

const COMPLIANCE_CLR: Record<WaterHygieneCompliance, string> = { compliant: "bg-green-100 text-green-800", non_compliant: "bg-red-100 text-red-800", action_required: "bg-amber-100 text-amber-800", remediated: "bg-blue-100 text-blue-800" };
const BORDER_COMP: Record<WaterHygieneCompliance, string> = { compliant: "border-l-green-400", non_compliant: "border-l-red-600", action_required: "border-l-amber-400", remediated: "border-l-blue-400" };

/* ── helpers ───────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

/* ── page ──────────────────────────────────────────────────────────────── */

export default function WaterHygienePage() {
  const { data: records = [], isLoading } = useWaterHygieneRecords();
  const createCheck = useCreateWaterHygieneRecord();
  const [search, setSearch] = useState("");
  const [filterCompliance, setFilterCompliance] = useState("all");
  const [filterCheckType, setFilterCheckType] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const [whForm, setWhForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    check_type: "" as WaterHygieneCheckType | "",
    location: "" as WaterHygieneLocation | "",
    temperature: "",
    compliance: "" as WaterHygieneCompliance | "",
    checked_by: "staff_darren",
    notes: "",
    action_required: "",
  });
  const setWH = (k: keyof typeof whForm, v: string) => setWhForm((p) => ({ ...p, [k]: v }));

  const handleCreateCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whForm.check_type || !whForm.location || !whForm.compliance) {
      toast.error("Check type, location and compliance result are required.");
      return;
    }
    await createCheck.mutateAsync({
      date: whForm.date,
      time: whForm.time,
      checked_by: whForm.checked_by,
      check_type: whForm.check_type as WaterHygieneCheckType,
      location: whForm.location as WaterHygieneLocation,
      temperature: whForm.temperature ? parseFloat(whForm.temperature) : null,
      target_min: null,
      target_max: null,
      compliance: whForm.compliance as WaterHygieneCompliance,
      notes: whForm.notes,
      action_required: whForm.action_required,
      action_completed: false,
      action_completed_date: null,
      next_due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    });
    toast.success("Water hygiene check recorded.");
    setWhForm({ date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5), check_type: "", location: "", temperature: "", compliance: "", checked_by: "staff_darren", notes: "", action_required: "" });
    setShowNew(false);
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── derived ─────────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let rows = records.filter((r) => {
      if (filterCompliance !== "all" && r.compliance !== filterCompliance) return false;
      if (filterCheckType !== "all" && r.check_type !== filterCheckType) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          WATER_HYGIENE_LOCATION_LABEL[r.location].toLowerCase().includes(q) ||
          WATER_HYGIENE_CHECK_TYPE_LABEL[r.check_type].toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date) || b.time.localeCompare(a.time);
        case "date-asc": return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
        case "compliance": {
          const order: WaterHygieneCompliance[] = ["non_compliant", "action_required", "remediated", "compliant"];
          return order.indexOf(a.compliance) - order.indexOf(b.compliance);
        }
        default: return 0;
      }
    });
    return rows;
  }, [records, search, filterCompliance, filterCheckType, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────────── */

  const totalChecks = records.length;
  const compliantCount = records.filter((r) => r.compliance === "compliant").length;
  const nonCompliant = records.filter((r) => r.compliance === "non_compliant").length;
  const actionRequired = records.filter((r) => r.compliance === "action_required" && !r.action_completed).length;
  const overdueChecks = records.filter((r) => r.next_due_date < d(0)).length;

  /* ── compliance schedule ─────────────────────────────────────────────── */

  const upcomingChecks = useMemo(() => {
    return [...records]
      .filter((r) => r.next_due_date >= d(0) && r.next_due_date <= d(14))
      .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));
  }, [records]);

  /* ── export ──────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<WaterHygieneRecord>[] = [
    { header: "Date", accessor: (r: WaterHygieneRecord) => r.date },
    { header: "Time", accessor: (r: WaterHygieneRecord) => r.time },
    { header: "Check Type", accessor: (r: WaterHygieneRecord) => WATER_HYGIENE_CHECK_TYPE_LABEL[r.check_type] },
    { header: "Location", accessor: (r: WaterHygieneRecord) => WATER_HYGIENE_LOCATION_LABEL[r.location] },
    { header: "Temperature (°C)", accessor: (r: WaterHygieneRecord) => r.temperature !== null ? String(r.temperature) : "N/A" },
    { header: "Target Min", accessor: (r: WaterHygieneRecord) => r.target_min !== null ? String(r.target_min) : "" },
    { header: "Target Max", accessor: (r: WaterHygieneRecord) => r.target_max !== null ? String(r.target_max) : "" },
    { header: "Compliance", accessor: (r: WaterHygieneRecord) => WATER_HYGIENE_COMPLIANCE_LABEL[r.compliance] },
    { header: "Notes", accessor: (r: WaterHygieneRecord) => r.notes },
    { header: "Action Required", accessor: (r: WaterHygieneRecord) => r.action_required },
    { header: "Action Completed", accessor: (r: WaterHygieneRecord) => r.action_completed ? `Yes — ${r.action_completed_date}` : "No" },
    { header: "Checked By", accessor: (r: WaterHygieneRecord) => getStaffName(r.checked_by) },
    { header: "Next Due", accessor: (r: WaterHygieneRecord) => r.next_due_date },
  ];

  if (isLoading) {
    return (
      <PageShell title="Water Hygiene & Legionella" subtitle="HSE ACOP L8 · HSG274 · Reg 12 — Protection of Children">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  /* ── render ──────────────────────────────────────────────────────────── */

  return (
    <PageShell
      title="Water Hygiene & Legionella"
      subtitle="HSE ACOP L8 · HSG274 · Reg 12 — Protection of Children"
      ariaContext={{ pageTitle: "Water Hygiene Records", sourceType: "home_check" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Water Hygiene Records" />
          <ExportButton data={filtered} columns={exportCols} filename="water-hygiene" />
          <AriaStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Record Check</Button>
        </div>
      }
    >
      <div id="print-area">
        {/* ── stat strip ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Checks", value: totalChecks, icon: Droplets, clr: "text-blue-600" },
            { label: "Compliant", value: compliantCount, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Non-Compliant", value: nonCompliant, icon: AlertTriangle, clr: "text-red-600" },
            { label: "Actions Outstanding", value: actionRequired, icon: Clock, clr: "text-amber-600" },
            { label: "Overdue Checks", value: overdueChecks, icon: ShieldCheck, clr: "text-purple-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── non-compliant alert ─────────────────────────────────────── */}
        {nonCompliant > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">{nonCompliant} non-compliant reading(s) recorded</p>
              <p className="text-red-700">Immediate remedial action required. Cold water must be below 20°C and hot water stored above 60°C to prevent legionella growth.</p>
            </div>
          </div>
        )}

        {/* ── upcoming checks ─────────────────────────────────────────── */}
        {upcomingChecks.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="font-semibold text-blue-800 text-sm mb-2 flex items-center gap-1"><Clock className="h-4 w-4" /> Upcoming Checks (Next 14 Days)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {upcomingChecks.map((r) => (
                <div key={r.id} className="bg-white rounded p-2 text-xs">
                  <p className="font-medium">{WATER_HYGIENE_CHECK_TYPE_LABEL[r.check_type]}</p>
                  <p className="text-muted-foreground">{WATER_HYGIENE_LOCATION_LABEL[r.location]} · Due: {r.next_due_date}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── filters ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search location, check type, notes…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterCompliance} onValueChange={setFilterCompliance}><SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Compliance</SelectItem>{(Object.keys(WATER_HYGIENE_COMPLIANCE_LABEL) as WaterHygieneCompliance[]).map((k) => (<SelectItem key={k} value={k}>{WATER_HYGIENE_COMPLIANCE_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterCheckType} onValueChange={setFilterCheckType}><SelectTrigger className="w-[200px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Check Types</SelectItem>{(Object.keys(WATER_HYGIENE_CHECK_TYPE_LABEL) as WaterHygieneCheckType[]).map((k) => (<SelectItem key={k} value={k}>{WATER_HYGIENE_CHECK_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date-desc">Newest First</SelectItem><SelectItem value="date-asc">Oldest First</SelectItem><SelectItem value="compliance">By Compliance</SelectItem></SelectContent></Select>
        </div>

        {/* ── records ─────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            const tempDisplay = r.temperature !== null ? `${r.temperature}°C` : "N/A";
            const tempOk = r.temperature !== null && (
              (r.target_min !== null && r.temperature >= r.target_min) &&
              (r.target_max === null || r.temperature <= r.target_max)
            ) || (
              r.temperature !== null &&
              r.target_max !== null && r.target_min === null &&
              r.temperature <= r.target_max
            );

            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_COMP[r.compliance])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {WATER_HYGIENE_CHECK_TYPE_LABEL[r.check_type]}
                        <Badge variant="outline" className={COMPLIANCE_CLR[r.compliance]}>{WATER_HYGIENE_COMPLIANCE_LABEL[r.compliance]}</Badge>
                        {r.temperature !== null && (
                          <Badge variant="outline" className={tempOk ? "bg-green-50" : "bg-red-50"}>
                            <Thermometer className="h-3 w-3 mr-1" /> {tempDisplay}
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {WATER_HYGIENE_LOCATION_LABEL[r.location]} · {r.date} at {r.time} · By: {getStaffName(r.checked_by)}
                      </p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* temperature reading */}
                    {r.temperature !== null && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-muted/40 rounded p-2 text-center">
                          <p className="font-medium text-xs">Reading</p>
                          <p className="text-lg font-bold">{tempDisplay}</p>
                        </div>
                        <div className="bg-muted/40 rounded p-2 text-center">
                          <p className="font-medium text-xs">Target Min</p>
                          <p className="text-lg font-bold">{r.target_min !== null ? `${r.target_min}°C` : "—"}</p>
                        </div>
                        <div className="bg-muted/40 rounded p-2 text-center">
                          <p className="font-medium text-xs">Target Max</p>
                          <p className="text-lg font-bold">{r.target_max !== null ? `${r.target_max}°C` : "—"}</p>
                        </div>
                      </div>
                    )}

                    {/* notes */}
                    <div>
                      <p className="font-medium mb-1">Notes</p>
                      <p className="text-muted-foreground">{r.notes}</p>
                    </div>

                    {/* action required */}
                    {r.action_required && (
                      <div className={cn("rounded-lg p-3", r.action_completed ? "bg-green-50" : "bg-amber-50")}>
                        <p className={cn("font-medium mb-1", r.action_completed ? "text-green-800" : "text-amber-800")}>
                          {r.action_completed ? "✓ Action Completed" : "⚠ Action Required"}
                        </p>
                        <p className={cn("text-xs", r.action_completed ? "text-green-700" : "text-amber-700")}>{r.action_required}</p>
                        {r.action_completed && r.action_completed_date && (
                          <p className="text-xs text-green-600 mt-1">Completed: {r.action_completed_date}</p>
                        )}
                      </div>
                    )}

                    {/* footer */}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Checked by: {getStaffName(r.checked_by)}</span>
                      <span>Next due: {r.next_due_date}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── check schedule ──────────────────────────────────────────── */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Water Hygiene Monitoring Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {[
                { check: "Hot Water Temperature (all outlets)", freq: "Monthly", target: "≥ 50°C at outlet within 1 minute" },
                { check: "Cold Water Temperature (all outlets)", freq: "Monthly", target: "≤ 20°C at outlet within 2 minutes" },
                { check: "TMV Checks (all TMVs)", freq: "Monthly", target: "38–44°C at mixed outlet" },
                { check: "Outlet Flushing (infrequently used)", freq: "Weekly", target: "Flush for 2 minutes if unused for >7 days" },
                { check: "Dead Leg Flushing", freq: "Weekly", target: "Flush for 3 minutes" },
                { check: "Showerhead Clean & Descale", freq: "Quarterly", target: "Remove biofilm, descale, inspect hose" },
                { check: "Cold Water Tank Inspection", freq: "Annually", target: "Lid, insulation, ball valve, overflow" },
                { check: "Calorifier Inspection", freq: "Annually", target: "≥ 60°C stored, check anode, drain valve" },
                { check: "Legionella Water Sampling", freq: "Annually", target: "< 100 cfu/L acceptable" },
              ].map((s) => (
                <div key={s.check} className="bg-muted/30 rounded p-2">
                  <p className="font-medium">{s.check}</p>
                  <p className="text-muted-foreground">Frequency: {s.freq} · Target: {s.target}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── regulatory note ─────────────────────────────────────────── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>HSE Approved Code of Practice L8 — Legionnaires&apos; disease: control of legionella bacteria in water systems. HSG274 Part 2 — technical guidance for hot and cold water systems. Health and Safety at Work Act 1974. Children&apos;s Homes (England) Regulations 2015, Reg 12 — ensuring the premises are safe. Hot water stored above 60°C and distributed above 50°C within 1 minute. Cold water below 20°C. TMVs required on outlets accessible to children to prevent scalding. Annual risk assessment by competent person.</p>
        </div>
      </div>

      {/* ── new check dialog ──────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Water Hygiene Check</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateCheck} className="grid grid-cols-2 gap-4">
            <div><Label>Date</Label><Input type="date" value={whForm.date} onChange={(e) => setWH("date", e.target.value)} /></div>
            <div><Label>Time</Label><Input type="time" value={whForm.time} onChange={(e) => setWH("time", e.target.value)} /></div>
            <div><Label>Checked By</Label><Select value={whForm.checked_by} onValueChange={(v) => setWH("checked_by", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STAFF.filter((s) => s.employment_status === "active").map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Check Type *</Label><Select value={whForm.check_type} onValueChange={(v) => setWH("check_type", v)}><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(WATER_HYGIENE_CHECK_TYPE_LABEL) as WaterHygieneCheckType[]).map((k) => (<SelectItem key={k} value={k}>{WATER_HYGIENE_CHECK_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Location *</Label><Select value={whForm.location} onValueChange={(v) => setWH("location", v)}><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(WATER_HYGIENE_LOCATION_LABEL) as WaterHygieneLocation[]).map((k) => (<SelectItem key={k} value={k}>{WATER_HYGIENE_LOCATION_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Temperature (°C)</Label><Input type="number" step="0.1" placeholder="e.g. 58" value={whForm.temperature} onChange={(e) => setWH("temperature", e.target.value)} /></div>
            <div><Label>Compliance *</Label><Select value={whForm.compliance} onValueChange={(v) => setWH("compliance", v)}><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(WATER_HYGIENE_COMPLIANCE_LABEL) as WaterHygieneCompliance[]).map((k) => (<SelectItem key={k} value={k}>{WATER_HYGIENE_COMPLIANCE_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea placeholder="Details of the check…" rows={3} value={whForm.notes} onChange={(e) => setWH("notes", e.target.value)} /></div>
            <div className="col-span-2"><Label>Action Required</Label><Textarea placeholder="If non-compliant, what actions are needed?" rows={2} value={whForm.action_required} onChange={(e) => setWH("action_required", e.target.value)} /></div>
            <div className="col-span-2">
              <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={createCheck.isPending}>{createCheck.isPending ? "Saving…" : "Save Record"}</Button></DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Water Hygiene Records — Legionella risk, hot water temperature checks, cold water flushing, shower head cleaning, boiler records, HSE ACOP L8 compliance, Reg 44 evidence"
        recordType="ofsted_evidence"
        className="mt-6"
      />
    </PageShell>
  );
}
