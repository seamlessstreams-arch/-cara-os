"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getYPName, getStaffName, YOUNG_PEOPLE, STAFF } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ArrowUpDown, MapPin, Shield, AlertTriangle, CheckCircle, Users, Loader2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOutdoorActivityRiskAssessments, useCreateOutdoorActivityRiskAssessment } from "@/hooks/use-outdoor-activity-risk-assessments";
import type { OutdoorActivityRiskAssessment, OutdoorActivityType, OutdoorRiskLevel } from "@/types/extended";
import { OUTDOOR_ACTIVITY_TYPE_LABEL, OUTDOOR_RISK_LEVEL_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { toast } from "sonner";

const riskColour: Record<string, string> = { low: "bg-green-100 text-green-800", medium: "bg-amber-100 text-amber-800", high: "bg-red-100 text-red-800" };
const exportCols: ExportColumn<OutdoorActivityRiskAssessment>[] = [
  { header: "Activity", accessor: (r: OutdoorActivityRiskAssessment) => r.activity_name },
  { header: "Type", accessor: (r: OutdoorActivityRiskAssessment) => OUTDOOR_ACTIVITY_TYPE_LABEL[r.activity_type] },
  { header: "Date", accessor: (r: OutdoorActivityRiskAssessment) => r.date },
  { header: "Children", accessor: (r: OutdoorActivityRiskAssessment) => r.young_people_attending.map(getYPName).join(", ") },
  { header: "Staff", accessor: (r: OutdoorActivityRiskAssessment) => String(r.staff_escort.length) },
  { header: "Behaviour Risk", accessor: (r: OutdoorActivityRiskAssessment) => OUTDOOR_RISK_LEVEL_LABEL[r.behaviour_risk_rating] },
  { header: "Missing Risk", accessor: (r: OutdoorActivityRiskAssessment) => OUTDOOR_RISK_LEVEL_LABEL[r.missing_from_care_risk] },
  { header: "Signed Off", accessor: (r: OutdoorActivityRiskAssessment) => r.signed_off_by_rm ? "Yes" : "No" },
];

export default function OutdoorActivityRiskAssessmentsPage() {
  const { data: res, isLoading } = useOutdoorActivityRiskAssessments();
  const createRA = useCreateOutdoorActivityRiskAssessment();
  const data: OutdoorActivityRiskAssessment[] = res?.data ?? [];

  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    activity_name: "",
    activity_type: "adventure_park" as OutdoorActivityType,
    date: new Date().toISOString().split("T")[0],
    location: "",
    duration_hours: 2,
    lead_staff: "",
    behaviour_risk_rating: "low" as OutdoorRiskLevel,
    missing_from_care_risk: "low" as OutdoorRiskLevel,
  });

  async function handleCreate() {
    if (!form.activity_name || !form.location || !form.lead_staff) {
      toast.error("Please complete all required fields");
      return;
    }
    try {
      await createRA.mutateAsync({
        ...form,
        hazards: [],
        young_people_attending: [],
        staff_escort: [form.lead_staff],
        child_specific_considerations: [],
        equipment_required: [],
        emergency_procedures: ["Call 999 if emergency", "Contact RM immediately"],
        supervision_ratio: "1:2",
        pre_activity_briefing: "Standard pre-activity briefing to be completed on the day.",
        external_risk_assessment: "N/A",
        permissions_obtained: false,
        signed_off_by_rm: false,
        reviewed_by: form.lead_staff,
      });
      toast.success("Risk assessment logged");
      setShowCreate(false);
      setForm({ activity_name: "", activity_type: "adventure_park", date: new Date().toISOString().split("T")[0], location: "", duration_hours: 2, lead_staff: "", behaviour_risk_rating: "low", missing_from_care_risk: "low" });
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  }
  const filtered = useMemo(() => {
    let items = [...data];
    if (filterType !== "all") items = items.filter((a) => a.activity_type === filterType);
    items.sort((a, b) => sortBy === "date" ? a.date.localeCompare(b.date) : 0);
    return items;
  }, [data, filterType, sortBy]);
  const total = data.length;
  const highRisk = data.filter((a) => a.behaviour_risk_rating === "high" || a.missing_from_care_risk === "high" || a.hazards.some((h) => h.severity === "high")).length;
  const allSignedOff = data.every((a) => a.signed_off_by_rm);

  if (isLoading) {
    return (
      <PageShell title="Outdoor Activity Risk Assessments" subtitle="Activity-specific RAs — trips, outings, water, climbing, festivals, and city visits">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Outdoor Activity Risk Assessments" subtitle="Activity-specific RAs — trips, outings, water, climbing, festivals, and city visits"
      ariaContext={{ pageTitle: "Outdoor Activity Risk Assessments", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="outdoor-activity-risk-assessments" />
          <PrintButton title="Outdoor Activity Risk Assessments" />
          <AriaStudioQuickActionButton context={{ record_type: "risk_assessment", record_id: "home_oak", home_id: "home_oak" }} />
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" />New RA</Button>
        </div>
      }>
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Outdoor Activity Risk Assessment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Activity Name *</Label><Input placeholder="e.g. Trip to Beamish Museum" value={form.activity_name} onChange={(e) => setForm((f) => ({ ...f, activity_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Activity Type</Label><Select value={form.activity_type} onValueChange={(v) => setForm((f) => ({ ...f, activity_type: v as OutdoorActivityType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(OUTDOOR_ACTIVITY_TYPE_LABEL) as [OutdoorActivityType, string][]).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Date *</Label><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
            </div>
            <div><Label>Location *</Label><Input placeholder="e.g. Beamish, County Durham" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Duration (hours)</Label><Input type="number" min={0.5} max={24} step={0.5} value={form.duration_hours} onChange={(e) => setForm((f) => ({ ...f, duration_hours: parseFloat(e.target.value) }))} /></div>
              <div><Label>Lead Staff *</Label><Select value={form.lead_staff} onValueChange={(v) => setForm((f) => ({ ...f, lead_staff: v }))}><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{STAFF.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Behaviour Risk</Label><Select value={form.behaviour_risk_rating} onValueChange={(v) => setForm((f) => ({ ...f, behaviour_risk_rating: v as OutdoorRiskLevel }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(OUTDOOR_RISK_LEVEL_LABEL) as [OutdoorRiskLevel, string][]).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Missing Risk</Label><Select value={form.missing_from_care_risk} onValueChange={(v) => setForm((f) => ({ ...f, missing_from_care_risk: v as OutdoorRiskLevel }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(OUTDOOR_RISK_LEVEL_LABEL) as [OutdoorRiskLevel, string][]).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createRA.isPending}>{createRA.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save RA"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Active RAs</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-amber-600">{highRisk}</p><p className="text-xs text-muted-foreground">High-Risk Activities</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-green-600">{allSignedOff ? "100%" : `${data.filter((a) => a.signed_off_by_rm).length}/${total}`}</p><p className="text-xs text-muted-foreground">RM Signed Off</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-blue-600">{new Set(data.flatMap((a) => a.young_people_attending)).size}</p><p className="text-xs text-muted-foreground">Children Engaged</p></div>
      </div>
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-6 flex items-start gap-2">
        <Shield className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">Every outing has a written RA. Hazards identified, controls agreed, child-specific considerations included. Signed off by RM. Adventure happens — safely.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activity Types</SelectItem>
            {(Object.entries(OUTDOOR_ACTIVITY_TYPE_LABEL) as [OutdoorActivityType, string][]).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1"><ArrowUpDown className="h-4 w-4 text-muted-foreground" /><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date">Soonest First</SelectItem></SelectContent></Select></div>
      </div>
      <div className="space-y-3">
        {filtered.map((a) => {
          const isExpanded = expandedId === a.id;
          return (
            <div key={a.id} className="rounded-xl border bg-white overflow-hidden">
              <button className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors" onClick={() => setExpandedId(isExpanded ? null : a.id)}>
                <div className="flex items-center gap-3 flex-1 min-w-0"><MapPin className="h-5 w-5 text-amber-600 shrink-0" /><div className="min-w-0"><p className="font-medium truncate">{a.activity_name}</p><p className="text-xs text-muted-foreground mt-0.5">{a.date} &middot; {a.location} &middot; {a.young_people_attending.length} children &middot; {a.duration_hours}h</p></div></div>
                <div className="flex items-center gap-2 shrink-0 ml-3"><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", riskColour[a.behaviour_risk_rating])}>{OUTDOOR_RISK_LEVEL_LABEL[a.behaviour_risk_rating]} risk</span>{a.signed_off_by_rm && <CheckCircle className="h-4 w-4 text-green-500" />}{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</div>
              </button>
              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-3 text-sm">
                  <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Children Attending</p><p>{a.young_people_attending.map(getYPName).join(", ")}</p><p className="text-xs text-muted-foreground">Staff escort: {a.staff_escort.map(getStaffName).join(", ")} &middot; Ratio {a.supervision_ratio}</p></div>
                  <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2"><AlertTriangle className="h-3 w-3 inline mr-1" />Hazards &amp; Controls</p><div className="space-y-1">{a.hazards.map((h, i) => (<div key={i} className="bg-white rounded-lg p-2 border"><div className="flex items-center justify-between"><span className="font-medium">{h.hazard}</span><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", riskColour[h.severity])}>{OUTDOOR_RISK_LEVEL_LABEL[h.severity]}</span></div><p className="text-xs text-blue-700 mt-0.5">Control: {h.control}</p></div>))}</div></div>
                  {a.child_specific_considerations.length > 0 && <div className="bg-pink-50 rounded-lg p-3"><p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1"><Users className="h-3 w-3 inline mr-1" />Child-Specific Considerations</p><div className="space-y-1">{a.child_specific_considerations.map((c, i) => (<div key={i} className="text-sm"><strong>{getYPName(c.child_id)}:</strong> {c.consideration}</div>))}</div></div>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="bg-white rounded-lg p-3 border"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Equipment</p><p>{a.equipment_required.join(", ")}</p></div><div className="bg-white rounded-lg p-3 border"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Emergency Procedures</p><p>{a.emergency_procedures.join("; ")}</p></div></div>
                  <div className="bg-blue-50 rounded-lg p-3"><p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Briefing</p><p>{a.pre_activity_briefing}</p></div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t"><span>External RA: {a.external_risk_assessment}</span><span>Reviewed by: {getStaffName(a.reviewed_by)}</span>{a.signed_off_by_rm && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Signed off by RM</span>}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-8 rounded-lg bg-muted/50 border p-4"><p className="text-xs text-muted-foreground"><strong>Regulatory Context:</strong> Activity RAs support Quality Standard 5 (protection), Quality Standard 25, and Reg 23. Linked to Transport Risk Assessments and Holiday Planning.</p></div>
      <CareEventsPanel
        title="Care Events — Activities"
        category="activity"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Outdoor Activity Risk Assessments — trip planning, hazard identification, child-specific risk, supervision ratios, missing from care risk, signed-off by RM"
        recordType="risk_assessment"
        className="mt-6"
      />
    </PageShell>
  );
}
