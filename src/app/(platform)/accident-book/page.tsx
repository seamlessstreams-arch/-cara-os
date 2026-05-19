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
  AlertTriangle, CheckCircle2, Clock, HardHat, Stethoscope, ShieldAlert,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useAccidentBook, useCreateAccident } from "@/hooks/use-accident-book";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import type { AccidentPersonType, AccidentSeverity, AccidentCategory, AccidentStatus, AccidentRecord } from "@/types/extended";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const PERSON_TYPE_LABEL: Record<AccidentPersonType, string> = { child: "Child", staff: "Staff", visitor: "Visitor", contractor: "Contractor" };
const SEVERITY_LABEL: Record<AccidentSeverity, string> = { minor: "Minor", moderate: "Moderate", major: "Major", riddor_reportable: "RIDDOR Reportable" };
const SEVERITY_CLR: Record<AccidentSeverity, string> = { minor: "bg-green-100 text-green-800", moderate: "bg-yellow-100 text-yellow-800", major: "bg-orange-100 text-orange-800", riddor_reportable: "bg-red-100 text-red-800" };
const CAT_LABEL: Record<AccidentCategory, string> = {
  slip_trip_fall: "Slip / Trip / Fall", collision: "Collision", burn_scald: "Burn / Scald",
  cut_laceration: "Cut / Laceration", bite: "Bite", self_harm_injury: "Self-Harm Injury",
  sport_play: "Sport / Play", assault: "Assault", medication_related: "Medication Related", other: "Other",
};
const STATUS_LABEL: Record<AccidentStatus, string> = { open: "Open", first_aid_given: "First Aid Given", medical_treatment: "Medical Treatment", hospital: "Hospital Attendance", investigated: "Investigated", closed: "Closed" };
const STATUS_CLR: Record<AccidentStatus, string> = { open: "bg-blue-100 text-blue-800", first_aid_given: "bg-green-100 text-green-800", medical_treatment: "bg-yellow-100 text-yellow-800", hospital: "bg-red-100 text-red-800", investigated: "bg-purple-100 text-purple-800", closed: "bg-slate-100 text-[var(--cs-navy)]" };

const BORDER_SEV: Record<AccidentSeverity, string> = { minor: "border-l-green-400", moderate: "border-l-yellow-400", major: "border-l-orange-500", riddor_reportable: "border-l-red-600" };

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function AccidentBookPage() {
  const { data: result, isLoading } = useAccidentBook();
  const createAccident = useCreateAccident();
  const data = result?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPersonType, setFilterPersonType] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── derived ─────────────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterSeverity !== "all" && r.severity !== filterSeverity) return false;
      if (filterCategory !== "all" && r.category !== filterCategory) return false;
      if (filterPersonType !== "all" && r.person_type !== filterPersonType) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.person_name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          CAT_LABEL[r.category].toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date);
        case "date-asc": return a.date.localeCompare(b.date);
        case "severity": {
          const sev = ["minor", "moderate", "major", "riddor_reportable"];
          return sev.indexOf(b.severity) - sev.indexOf(a.severity);
        }
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterSeverity, filterCategory, filterPersonType, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────────────── */

  const totalThisMonth = data.filter((r) => {
    const now = new Date();
    const rd = new Date(r.date);
    return rd.getMonth() === now.getMonth() && rd.getFullYear() === now.getFullYear();
  }).length;
  const openRecords = data.filter((r) => r.status !== "closed").length;
  const riddorCount = data.filter((r) => r.riddor_reported).length;
  const childInjuries = data.filter((r) => r.person_type === "child").length;
  const staffInjuries = data.filter((r) => r.person_type === "staff").length;

  /* ── export ──────────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<AccidentRecord>[] = [
    { header: "Date", accessor: (r: AccidentRecord) => r.date },
    { header: "Time", accessor: (r: AccidentRecord) => r.time },
    { header: "Person", accessor: (r: AccidentRecord) => r.person_name },
    { header: "Type", accessor: (r: AccidentRecord) => PERSON_TYPE_LABEL[r.person_type] },
    { header: "Category", accessor: (r: AccidentRecord) => CAT_LABEL[r.category] },
    { header: "Severity", accessor: (r: AccidentRecord) => SEVERITY_LABEL[r.severity] },
    { header: "Location", accessor: (r: AccidentRecord) => r.location },
    { header: "Description", accessor: (r: AccidentRecord) => r.description },
    { header: "Injury Details", accessor: (r: AccidentRecord) => r.injury_details },
    { header: "First Aid", accessor: (r: AccidentRecord) => r.first_aid_given ? "Yes" : "No" },
    { header: "First Aid By", accessor: (r: AccidentRecord) => r.first_aid_by ? getStaffName(r.first_aid_by) : "" },
    { header: "Medical Attention", accessor: (r: AccidentRecord) => r.medical_attention ? "Yes" : "No" },
    { header: "Hospital", accessor: (r: AccidentRecord) => r.hospital_attendance ? "Yes" : "No" },
    { header: "RIDDOR", accessor: (r: AccidentRecord) => r.riddor_reported ? `Yes (${r.riddor_ref})` : "No" },
    { header: "Status", accessor: (r: AccidentRecord) => STATUS_LABEL[r.status] },
    { header: "Root Cause", accessor: (r: AccidentRecord) => r.root_cause },
    { header: "Preventive Measures", accessor: (r: AccidentRecord) => r.preventive_measures },
    { header: "Reported By", accessor: (r: AccidentRecord) => getStaffName(r.reported_by) },
    { header: "Signed Off", accessor: (r: AccidentRecord) => r.signed_off_by ? getStaffName(r.signed_off_by) : "Pending" },
  ];

  /* ── render ──────────────────────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <PageShell title="Accident Book" subtitle="Health & Safety at Work Act 1974 · RIDDOR 2013 · Reg 12">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Accident Book"
      subtitle="Health & Safety at Work Act 1974 · RIDDOR 2013 · Reg 12"
      ariaContext={{ pageTitle: "Accident Book", sourceType: "incident" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Accident Book" />
          <ExportButton data={filtered} columns={exportCols} filename="accident-book" />
          <AriaStudioQuickActionButton context={{ record_type: "incident", record_id: "home_oak", home_id: "home_oak" }} />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Record Accident</Button>
        </div>
      }
    >
      <div id="print-area">
        {/* ── stat strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Records", value: data.length, icon: HardHat, clr: "text-blue-600" },
            { label: "This Month", value: totalThisMonth, icon: Clock, clr: "text-indigo-600" },
            { label: "Open / In Progress", value: openRecords, icon: AlertTriangle, clr: "text-amber-600" },
            { label: "Child Injuries", value: childInjuries, icon: ShieldAlert, clr: "text-rose-600" },
            { label: "Staff Injuries", value: staffInjuries, icon: Stethoscope, clr: "text-purple-600" },
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

        {/* ── RIDDOR alert ─────────────────────────────────────────────────── */}
        {riddorCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">{riddorCount} RIDDOR-reportable accident(s)</p>
              <p className="text-red-700">These must be reported to HSE within 10 days of the incident.</p>
            </div>
          </div>
        )}

        {/* ── open records alert ────────────────────────────────────────────── */}
        {openRecords > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{openRecords} record(s) still open</p>
              <p className="text-amber-700">All accident records must be investigated and signed off by the Registered Manager.</p>
            </div>
          </div>
        )}

        {/* ── filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search person, description, location…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}><SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Severity</SelectItem>{(Object.keys(SEVERITY_LABEL) as AccidentSeverity[]).map((k) => (<SelectItem key={k} value={k}>{SEVERITY_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}><SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{(Object.keys(CAT_LABEL) as AccidentCategory[]).map((k) => (<SelectItem key={k} value={k}>{CAT_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterPersonType} onValueChange={setFilterPersonType}><SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All People</SelectItem>{(Object.keys(PERSON_TYPE_LABEL) as AccidentPersonType[]).map((k) => (<SelectItem key={k} value={k}>{PERSON_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date-desc">Newest First</SelectItem><SelectItem value="date-asc">Oldest First</SelectItem><SelectItem value="severity">By Severity</SelectItem></SelectContent></Select>
        </div>

        {/* ── records ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_SEV[r.severity])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {r.person_name}
                        <Badge variant="outline" className={SEVERITY_CLR[r.severity]}>{SEVERITY_LABEL[r.severity]}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                        <Badge variant="outline">{PERSON_TYPE_LABEL[r.person_type]}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{CAT_LABEL[r.category]} · {r.location} · {r.date} at {r.time}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-1">Description</p>
                        <p className="text-muted-foreground">{r.description}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Injury Details</p>
                        <p className="text-muted-foreground">{r.injury_details}</p>
                      </div>
                    </div>

                    {/* first aid */}
                    {r.first_aid_given && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="font-medium text-green-800 mb-1">First Aid Administered</p>
                        <p className="text-green-700 text-xs">By: {r.first_aid_by ? getStaffName(r.first_aid_by) : "N/A"}</p>
                        <p className="text-green-700 text-xs mt-1">{r.first_aid_details}</p>
                      </div>
                    )}

                    {/* notifications */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Medical Attention</p>
                        <p className="text-xs text-muted-foreground">{r.medical_attention ? "Yes" : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Hospital</p>
                        <p className="text-xs text-muted-foreground">{r.hospital_attendance ? r.hospital_name || "Yes" : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">SW Notified</p>
                        <p className="text-xs text-muted-foreground">{r.social_worker_notified ? "Yes" : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">RIDDOR Reported</p>
                        <p className="text-xs text-muted-foreground">{r.riddor_reported ? `Yes — ${r.riddor_ref}` : "No"}</p>
                      </div>
                    </div>

                    {/* body map / photos */}
                    <div className="flex gap-4 text-xs">
                      {r.body_map_completed && <Badge variant="outline" className="bg-blue-50">Body Map Completed</Badge>}
                      {r.photographs_taken && <Badge variant="outline" className="bg-purple-50">Photographs Taken</Badge>}
                      {r.witnesses.length > 0 && <span className="text-muted-foreground">Witnesses: {r.witnesses.map((w) => w.startsWith("staff_") ? getStaffName(w) : w.startsWith("yp_") ? getYPName(w) : w).join(", ")}</span>}
                    </div>

                    {/* root cause & prevention */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-1">Root Cause Analysis</p>
                        <p className="text-muted-foreground">{r.root_cause}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Preventive Measures</p>
                        <p className="text-muted-foreground">{r.preventive_measures}</p>
                      </div>
                    </div>

                    {/* footer */}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Reported by: {getStaffName(r.reported_by)}</span>
                      {r.follow_up_date && <span>Follow-up: {r.follow_up_date}</span>}
                      <span>{r.signed_off_by ? `Signed off: ${getStaffName(r.signed_off_by)}` : "⚠ Awaiting sign-off"}</span>
                    </div>

                    {/* smart links */}
                    <SmartLinkPanel
                      sourceType="accident_book"
                      sourceId={r.id}
                      childId={r.person_type === "child" ? r.person_id ?? undefined : undefined}
                      compact
                    />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────────────── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Health & Safety at Work Act 1974 — duty to record all workplace accidents. RIDDOR 2013 — specified injuries, dangerous occurrences and over-7-day incapacitation must be reported to HSE. Children&apos;s Homes (England) Regulations 2015, Reg 12 — protection of children, keeping the home safe. All accident records retained for minimum 3 years (21 years if involving a child under 18 at time of incident).</p>
        </div>
      </div>

      {/* ── new entry dialog ───────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Accident / Injury</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date</Label><Input type="date" /></div>
            <div><Label>Time</Label><Input type="time" /></div>
            <div><Label>Person Injured</Label><Input placeholder="Name" /></div>
            <div><Label>Person Type</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(PERSON_TYPE_LABEL) as AccidentPersonType[]).map((k) => (<SelectItem key={k} value={k}>{PERSON_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Category</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(CAT_LABEL) as AccidentCategory[]).map((k) => (<SelectItem key={k} value={k}>{CAT_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Severity</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(SEVERITY_LABEL) as AccidentSeverity[]).map((k) => (<SelectItem key={k} value={k}>{SEVERITY_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Location</Label><Input placeholder="Where the accident happened" /></div>
            <div className="col-span-2"><Label>Description</Label><Textarea placeholder="What happened…" rows={3} /></div>
            <div className="col-span-2"><Label>Injury Details</Label><Textarea placeholder="Describe the injury…" rows={2} /></div>
            <div className="col-span-2"><Label>First Aid Given</Label><Textarea placeholder="First aid details…" rows={2} /></div>
            <div className="col-span-2"><Label>Root Cause</Label><Textarea placeholder="What caused the accident?" rows={2} /></div>
            <div className="col-span-2"><Label>Preventive Measures</Label><Textarea placeholder="Actions to prevent recurrence…" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button disabled={createAccident.isPending} onClick={() => { createAccident.mutate({ date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5), reported_by: "staff_darren", person_type: "child", person_id: null, person_name: "", category: "other", severity: "minor", status: "open", location: "", description: "", injury_details: "", first_aid_given: false, first_aid_by: null, first_aid_details: "", medical_attention: false, hospital_attendance: false, hospital_name: null, parent_carer_notified: false, parent_notified_time: null, social_worker_notified: false, riddor_reported: false, riddor_ref: null, witnesses: [], root_cause: "", preventive_measures: "", follow_up_date: null, photographs_taken: false, body_map_completed: false, signed_off_by: null }, { onSuccess: () => { toast.success("Accident record created"); setShowNew(false); }, onError: () => toast.error("Failed to create accident record") }); }}>{createAccident.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Creating...</> : "Save Record"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Health"
        category="health"
        days={28}
        defaultCollapsed
      />      <AriaPanel
        mode="assist"
        pageContext="Accident Book — RIDDOR reporting, accidents to children and staff, first aid given, near misses, HSWA compliance, environmental hazards, Reg 40 notification triggers"
        recordType="incident"
        className="mt-6"
      />    </PageShell>
  );
}
