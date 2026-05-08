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
  AlertTriangle, CheckCircle2, Clock, Hammer, PoundSterling,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { usePropertyDamageRecords } from "@/hooks/use-property-damage-records";
import type {
  PropertyDamageRecord,
  PropertyDamageType,
  PropertyDamageSeverity,
  PropertyRepairStatus,
  PropertyLocation,
} from "@/types/extended";
import {
  PROPERTY_DAMAGE_TYPE_LABEL,
  PROPERTY_DAMAGE_SEVERITY_LABEL,
  PROPERTY_REPAIR_STATUS_LABEL,
  PROPERTY_LOCATION_LABEL,
} from "@/types/extended";

/* ── local colour maps ───────────────────────────────────────────────────── */

const TYPE_CLR: Record<PropertyDamageType, string> = { accidental: "bg-blue-100 text-blue-800", deliberate: "bg-red-100 text-red-800", wear_and_tear: "bg-slate-100 text-slate-800", environmental: "bg-amber-100 text-amber-800", unknown: "bg-gray-100 text-gray-800" };
const SEVERITY_CLR: Record<PropertyDamageSeverity, string> = { minor: "bg-green-100 text-green-800", moderate: "bg-yellow-100 text-yellow-800", major: "bg-orange-100 text-orange-800", structural: "bg-red-100 text-red-800" };
const STATUS_CLR: Record<PropertyRepairStatus, string> = { reported: "bg-blue-100 text-blue-800", assessed: "bg-indigo-100 text-indigo-800", repair_scheduled: "bg-purple-100 text-purple-800", repaired: "bg-green-100 text-green-800", write_off: "bg-slate-100 text-slate-800", insurance_claim: "bg-amber-100 text-amber-800" };
const BORDER_TYPE: Record<PropertyDamageType, string> = { accidental: "border-l-blue-400", deliberate: "border-l-red-500", wear_and_tear: "border-l-slate-400", environmental: "border-l-amber-400", unknown: "border-l-gray-400" };

/* ── page ────────────────────────────────────────────────────────────────── */

export default function PropertyDamagePage() {
  const { data: records = [], isLoading } = usePropertyDamageRecords();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = records.filter((r) => {
      if (filterType !== "all" && r.damage_type !== filterType) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.description.toLowerCase().includes(q) || r.specific_area.toLowerCase().includes(q) || r.responsible_person_name.toLowerCase().includes(q);
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date);
        case "date-asc": return a.date.localeCompare(b.date);
        case "cost": return (b.estimated_cost) - (a.estimated_cost);
        default: return 0;
      }
    });
    return rows;
  }, [records, search, filterType, filterStatus, sortBy]);

  const totalRecords = records.length;
  const deliberate = records.filter((r) => r.damage_type === "deliberate").length;
  const awaitingRepair = records.filter((r) => r.status !== "repaired" && r.status !== "write_off").length;
  const totalEstCost = records.reduce((sum, r) => sum + r.estimated_cost, 0);
  const insuranceClaims = records.filter((r) => r.insurance_claimed).length;

  const exportCols: ExportColumn<PropertyDamageRecord>[] = [
    { header: "Date", accessor: (r) => r.date },
    { header: "Location", accessor: (r) => r.specific_area },
    { header: "Type", accessor: (r) => PROPERTY_DAMAGE_TYPE_LABEL[r.damage_type] },
    { header: "Severity", accessor: (r) => PROPERTY_DAMAGE_SEVERITY_LABEL[r.severity] },
    { header: "Status", accessor: (r) => PROPERTY_REPAIR_STATUS_LABEL[r.status] },
    { header: "Responsible", accessor: (r) => r.responsible_person_name },
    { header: "Description", accessor: (r) => r.description },
    { header: "Est. Cost (£)", accessor: (r) => String(r.estimated_cost) },
    { header: "Insurance", accessor: (r) => r.insurance_claimed ? `Yes (${r.insurance_ref})` : "No" },
    { header: "Reported By", accessor: (r) => getStaffName(r.reported_by) },
  ];

  if (isLoading) {
    return (
      <PageShell title="Property Damage Log" subtitle="Asset Management · Insurance Records · Behaviour Context">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Property Damage Log" subtitle="Asset Management · Insurance Records · Behaviour Context" actions={<div className="flex items-center gap-2"><PrintButton title="Property Damage Log" /><ExportButton data={filtered} columns={exportCols} filename="property-damage" /><Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Report Damage</Button></div>}>
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Records", value: totalRecords, icon: Hammer, clr: "text-blue-600" },
            { label: "Deliberate", value: deliberate, icon: AlertTriangle, clr: "text-red-600" },
            { label: "Awaiting Repair", value: awaitingRepair, icon: Clock, clr: "text-amber-600" },
            { label: "Est. Total Cost", value: `£${totalEstCost}`, icon: PoundSterling, clr: "text-purple-600" },
            { label: "Insurance Claims", value: insuranceClaims, icon: CheckCircle2, clr: "text-indigo-600" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="pt-4 pb-3 text-center"><s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} /><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search description, location, person…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{(Object.keys(PROPERTY_DAMAGE_TYPE_LABEL) as PropertyDamageType[]).map((k) => (<SelectItem key={k} value={k}>{PROPERTY_DAMAGE_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{(Object.keys(PROPERTY_REPAIR_STATUS_LABEL) as PropertyRepairStatus[]).map((k) => (<SelectItem key={k} value={k}>{PROPERTY_REPAIR_STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date-desc">Newest First</SelectItem><SelectItem value="date-asc">Oldest First</SelectItem><SelectItem value="cost">By Cost</SelectItem></SelectContent></Select>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_TYPE[r.damage_type])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {r.specific_area}
                        <Badge variant="outline" className={TYPE_CLR[r.damage_type]}>{PROPERTY_DAMAGE_TYPE_LABEL[r.damage_type]}</Badge>
                        <Badge variant="outline" className={SEVERITY_CLR[r.severity]}>{PROPERTY_DAMAGE_SEVERITY_LABEL[r.severity]}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{PROPERTY_REPAIR_STATUS_LABEL[r.status]}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{r.date} at {r.time} · {r.responsible_person_name} · Est. £{r.estimated_cost}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div><p className="font-medium mb-1">Description</p><p className="text-muted-foreground">{r.description}</p></div>
                    {r.behaviour_context && r.behaviour_context !== "N/A — weather damage" && r.behaviour_context !== "N/A — natural wear and tear" && (
                      <div className="bg-blue-50 rounded-lg p-3"><p className="font-medium text-blue-800 mb-1">Behaviour Context</p><p className="text-blue-700 text-xs">{r.behaviour_context}</p></div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2"><p className="font-medium text-xs">Est. Cost</p><p className="text-xs text-muted-foreground">£{r.estimated_cost}</p></div>
                      <div className="bg-muted/40 rounded p-2"><p className="font-medium text-xs">Actual Cost</p><p className="text-xs text-muted-foreground">{r.actual_cost !== null ? `£${r.actual_cost}` : "TBC"}</p></div>
                      <div className="bg-muted/40 rounded p-2"><p className="font-medium text-xs">Photos</p><p className="text-xs text-muted-foreground">{r.photographs_taken ? "Yes" : "No"}</p></div>
                      <div className="bg-muted/40 rounded p-2"><p className="font-medium text-xs">Insurance</p><p className="text-xs text-muted-foreground">{r.insurance_claimed ? `Yes — ${r.insurance_ref}` : "No"}</p></div>
                    </div>
                    {r.repair_details && (
                      <div className={cn("rounded-lg p-3", r.repair_completed_date ? "bg-green-50" : "bg-amber-50")}>
                        <p className={cn("font-medium mb-1", r.repair_completed_date ? "text-green-800" : "text-amber-800")}>{r.repair_completed_date ? "✓ Repair Completed" : "⏳ Repair Details"}</p>
                        <p className={cn("text-xs", r.repair_completed_date ? "text-green-700" : "text-amber-700")}>{r.repair_details}</p>
                        {r.repair_completed_date && <p className="text-xs text-green-600 mt-1">Completed: {r.repair_completed_date}</p>}
                      </div>
                    )}
                    {r.linked_incident_id && <Badge variant="outline" className="bg-muted/30">Linked Incident: {r.linked_incident_id}</Badge>}
                    {r.risk_assessment_updated && <Badge variant="outline" className="bg-purple-50">Risk Assessment Updated</Badge>}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Reported by: {getStaffName(r.reported_by)}</span>
                      <span>Location: {PROPERTY_LOCATION_LABEL[r.location]}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Recording Guidance</p>
          <p>All property damage must be recorded regardless of cause or value. Deliberate damage should be cross-referenced with incident reports and behaviour support plans. Patterns of property damage may indicate unmet needs and should be discussed in supervision and key work sessions. Insurance claims require photographs and written descriptions. Children should never be made to feel punished for accidental damage. Cost recovery from children in care is not permitted under Children Act 1989.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Report Property Damage</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date</Label><Input type="date" /></div>
            <div><Label>Time</Label><Input type="time" /></div>
            <div><Label>Location</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(PROPERTY_LOCATION_LABEL) as PropertyLocation[]).map((k) => (<SelectItem key={k} value={k}>{PROPERTY_LOCATION_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Damage Type</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(PROPERTY_DAMAGE_TYPE_LABEL) as PropertyDamageType[]).map((k) => (<SelectItem key={k} value={k}>{PROPERTY_DAMAGE_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Specific Area</Label><Input placeholder="e.g. Alex's bedroom door" /></div>
            <div className="col-span-2"><Label>Description</Label><Textarea rows={3} placeholder="What was damaged and how?" /></div>
            <div><Label>Severity</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(PROPERTY_DAMAGE_SEVERITY_LABEL) as PropertyDamageSeverity[]).map((k) => (<SelectItem key={k} value={k}>{PROPERTY_DAMAGE_SEVERITY_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Estimated Cost (£)</Label><Input type="number" placeholder="0" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={() => setShowNew(false)}>Save Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
