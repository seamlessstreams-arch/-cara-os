"use client";

import { useState, useMemo } from "react";
import { currentUserId } from "@/lib/auth/current-user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  HardHat,
  Stethoscope,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn, todayStr } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import type { AccidentPersonType, AccidentSeverity, AccidentCategory, AccidentStatus, AccidentRecord, BodyMark, AccidentNotification, NotifiableEvent, NotifiableNotification } from "@/types/extended";

import { api } from "@/hooks/use-api";
import { BodyMapDiagram, BodyMarkList } from "@/components/body-map/body-map-diagram";
import { ChildAccountField } from "@/components/safeguarding/child-account-field";
import { ConsistencyToggle } from "@/components/safeguarding/consistency-toggle";
import { ChipMultiSelect } from "@/components/safeguarding/chip-multi-select";
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

const NOTIFICATION_OPTIONS: { key: AccidentNotification; label: string }[] = [
  { key: "parent_carer", label: "Parent/carer" },
  { key: "social_worker", label: "Social worker" },
  { key: "manager", label: "Manager" },
  { key: "keyworker", label: "Keyworker" },
  { key: "dsl", label: "DSL" },
  { key: "lado", label: "LADO" },
  { key: "iro", label: "IRO" },
  { key: "placing_authority", label: "Placing authority" },
];
const NOTIFICATION_LABEL: Record<AccidentNotification, string> = Object.fromEntries(
  NOTIFICATION_OPTIONS.map((o) => [o.key, o.label]),
) as Record<AccidentNotification, string>;

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function AccidentBookPage() {
  const qc = useQueryClient();
  const { data: result, isLoading } = useQuery<{ data: AccidentRecord[] }>({
    queryKey: ["accident-book"],
    queryFn: () => api.get<{ data: AccidentRecord[] }>("/api/v1/accident-book"),
  });
  const createAccident = useMutation({
    mutationFn: (data: Partial<AccidentRecord>) =>
      api.post("/api/v1/accident-book", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accident-book"] }),
  });
  // Reg 40 loop: turn an accident flagged notifiable into the actual (pending)
  // Ofsted/placing notification record, pre-filled from the accident, so it is
  // tracked in Notifiable Events rather than only flagged here.
  const createNotifiable = useMutation({
    mutationFn: (payload: Partial<NotifiableEvent>) =>
      api.post("/api/v1/notifiable-events", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifiable-events"] }),
  });
  const [createdReg40, setCreatedReg40] = useState<Set<string>>(new Set());
  const buildReg40Payload = (r: AccidentRecord): Partial<NotifiableEvent> => {
    const detail = [r.description, r.injury_details].map((s) => (s || "").trim()).filter(Boolean).join(" — ") || "See the linked accident record.";
    const blank = (): NotifiableNotification => ({ body: detail, notified_date: null, method: "", reference: null });
    return {
      date: r.date,
      event_type: "serious_injury",
      child_id: null,
      summary: `Accident / injury — ${r.person_name || "unnamed"}${r.category ? ` (${CAT_LABEL[r.category]})` : ""}`,
      detail: `${detail}\n\nCreated from the accident book (${r.date}).`,
      immediate_action: (r.first_aid_details || "").trim(),
      reported_by: currentUserId(),
      ofsted_status: "pending",
      ofsted: blank(),
      local_authority: blank(),
      placing: blank(),
      follow_up: "",
      lesson_learned: "",
    };
  };
  const createReg40 = (r: AccidentRecord) => {
    createNotifiable.mutate(buildReg40Payload(r), {
      onSuccess: () => { setCreatedReg40((s) => new Set(s).add(r.id)); toast.success("Reg 40 notification created — complete it in Notifiable Events."); },
      onError: () => toast.error("Could not create the notification"),
    });
  };
  const data = useMemo(() => result?.data ?? [], [result]);

  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPersonType, setFilterPersonType] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  // The dialog's fields were previously unbound, so Save posted hardcoded
  // blanks and asserted a severity and category nobody chose. The form is the
  // record now: what the accident book holds is what was typed here.
  const EMPTY_FORM = {
    date: todayStr(),
    time: new Date().toTimeString().slice(0, 5),
    person_name: "",
    person_type: "child" as AccidentPersonType,
    category: "" as AccidentCategory | "",
    severity: "" as AccidentSeverity | "",
    location: "",
    description: "",
    injury_details: "",
    first_aid_details: "",
    root_cause: "",
    preventive_measures: "",
    // safeguarding & notification additions
    child_account: "",
    injury_consistent: "" as "" | "yes" | "no" | "unsure",
    medical_outcome: "",
    notifiable_event: false,
    happened_before: false,
    previously_reported_to: "",
    care_plan_updated: false,
    notifications: [] as AccidentNotification[],
  };
  const [form, setForm] = useState(EMPTY_FORM);
  const [injuryMarks, setInjuryMarks] = useState<BodyMark[]>([]);
  const setF = <K extends keyof typeof EMPTY_FORM>(k: K, v: (typeof EMPTY_FORM)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Severity and category drive RIDDOR routing and the whole-home safety
  // picture, so neither may be defaulted on the user's behalf.
  const canSaveAccident =
    form.person_name.trim() !== "" &&
    form.description.trim() !== "" &&
    form.category !== "" &&
    form.severity !== "";

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
    { header: "Child's Account", accessor: (r: AccidentRecord) => r.child_account ?? "" },
    { header: "Injury Consistent", accessor: (r: AccidentRecord) => r.injury_consistent === true ? "Yes" : r.injury_consistent === false ? "No" : "" },
    { header: "Medical Outcome", accessor: (r: AccidentRecord) => r.medical_outcome ?? "" },
    { header: "Notified", accessor: (r: AccidentRecord) => (r.notifications ?? []).map((n) => NOTIFICATION_LABEL[n] ?? n).join("; ") },
    { header: "Reg 40 Notifiable", accessor: (r: AccidentRecord) => r.notifiable_event ? "Yes" : "No" },
    { header: "Happened Before", accessor: (r: AccidentRecord) => r.happened_before ? (r.previously_reported_to ? `Yes (${r.previously_reported_to})` : "Yes") : "No" },
    { header: "Care Plan Updated", accessor: (r: AccidentRecord) => r.care_plan_updated ? "Yes" : "No" },
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
      caraContext={{ pageTitle: "Accident Book", sourceType: "incident" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Accident Book" />
          <ExportButton data={filtered} columns={exportCols} filename="accident-book" />
          <CaraStudioQuickActionButton context={{ record_type: "incident" }} />
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

                    {/* safeguarding & notifications */}
                    {(r.child_account || r.medical_outcome || r.injury_consistent === true || r.injury_consistent === false || (r.notifications && r.notifications.length > 0) || r.notifiable_event || r.happened_before || r.care_plan_updated) && (
                      <div className="rounded-lg border bg-muted/20 p-3 space-y-2 text-xs">
                        {r.child_account && (
                          <div><p className="font-medium">Child&apos;s account</p><p className="text-muted-foreground italic">{r.child_account}</p></div>
                        )}
                        {(r.injury_consistent === true || r.injury_consistent === false) && (
                          <p>Account {r.injury_consistent ? <span className="font-medium text-[--cs-success]">consistent</span> : <span className="font-medium text-rose-600">inconsistent</span>} with the injury</p>
                        )}
                        {r.medical_outcome && (
                          <div><p className="font-medium">Medical advice / outcome</p><p className="text-muted-foreground">{r.medical_outcome}</p></div>
                        )}
                        {r.notifications && r.notifications.length > 0 && (
                          <div>
                            <p className="font-medium">Notified</p>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {r.notifications.map((n) => <span key={n} className="rounded-full bg-muted px-2 py-0.5">{NOTIFICATION_LABEL[n] ?? n}</span>)}
                            </div>
                          </div>
                        )}
                        {(r.notifiable_event || r.happened_before || r.care_plan_updated) && (
                          <div className="flex flex-wrap gap-2 pt-0.5">
                            {r.notifiable_event && <Badge variant="outline" className="bg-amber-50 text-amber-800">Reg 40 notifiable</Badge>}
                            {r.notifiable_event && (createdReg40.has(r.id)
                              ? <Badge variant="outline" className="bg-green-50 text-green-800">Reg 40 notification created</Badge>
                              : <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" disabled={createNotifiable.isPending} onClick={() => createReg40(r)}>Create Reg 40 notification</Button>
                            )}
                            {r.happened_before && <Badge variant="outline">Happened before{r.previously_reported_to ? ` — ${r.previously_reported_to}` : ""}</Badge>}
                            {r.care_plan_updated && <Badge variant="outline">Care plan / RA updated</Badge>}
                          </div>
                        )}
                      </div>
                    )}

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

                    {/* body map marks */}
                    {r.injury_marks && r.injury_marks.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Body Map — {r.injury_marks.length} {r.injury_marks.length === 1 ? "injury" : "injuries"} marked</p>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4 rounded-lg border bg-muted/20 p-3">
                          <BodyMapDiagram marks={r.injury_marks} initialView={r.injury_marks[0].view} className="sm:w-1/2 max-w-[200px]" />
                          <BodyMarkList marks={r.injury_marks} className="sm:w-1/2" />
                        </div>
                      </div>
                    )}

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
      <Dialog open={showNew} onOpenChange={(o) => { setShowNew(o); if (!o) setInjuryMarks([]); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Accident / Injury</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="4f1d-date">Date</Label><Input id="4f1d-date" type="date" max={todayStr()} value={form.date} onChange={(e) => setF("date", e.target.value)} /></div>
            <div><Label htmlFor="4f1d-time">Time</Label><Input id="4f1d-time" type="time" value={form.time} onChange={(e) => setF("time", e.target.value)} /></div>
            <div><Label htmlFor="4f1d-person-injured">Person Injured *</Label><Input id="4f1d-person-injured" placeholder="Name" value={form.person_name} onChange={(e) => setF("person_name", e.target.value)} /></div>
            <div><Label htmlFor="4f1d-person-type">Person Type</Label><Select value={form.person_type} onValueChange={(v) => setF("person_type", v as AccidentPersonType)}><SelectTrigger id="4f1d-person-type"><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(PERSON_TYPE_LABEL) as AccidentPersonType[]).map((k) => (<SelectItem key={k} value={k}>{PERSON_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label htmlFor="4f1d-category">Category *</Label><Select value={form.category} onValueChange={(v) => setF("category", v as AccidentCategory)}><SelectTrigger id="4f1d-category"><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(CAT_LABEL) as AccidentCategory[]).map((k) => (<SelectItem key={k} value={k}>{CAT_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label htmlFor="4f1d-severity">Severity *</Label><Select value={form.severity} onValueChange={(v) => setF("severity", v as AccidentSeverity)}><SelectTrigger id="4f1d-severity"><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(SEVERITY_LABEL) as AccidentSeverity[]).map((k) => (<SelectItem key={k} value={k}>{SEVERITY_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div className="col-span-2"><Label htmlFor="4f1d-location">Location</Label><Input id="4f1d-location" placeholder="Where the accident happened" value={form.location} onChange={(e) => setF("location", e.target.value)} /></div>
            <div className="col-span-2"><Label htmlFor="4f1d-description">Description *</Label><Textarea id="4f1d-description" placeholder="What happened…" rows={3} value={form.description} onChange={(e) => setF("description", e.target.value)} /></div>
            <div className="col-span-2"><Label htmlFor="4f1d-injury-details">Injury Details</Label><Textarea id="4f1d-injury-details" placeholder="Describe the injury…" rows={2} value={form.injury_details} onChange={(e) => setF("injury_details", e.target.value)} /></div>
            <div className="col-span-2">
              <Label>Body Map — mark where the injuries are</Label>
              <div className="rounded-lg border bg-muted/30 p-3 mt-1 flex flex-col sm:flex-row sm:items-start gap-4">
                <BodyMapDiagram mode="multi" marks={injuryMarks} onChange={setInjuryMarks} className="sm:w-1/2" />
                <div className="sm:w-1/2">
                  {injuryMarks.length > 0 ? (
                    <BodyMarkList marks={injuryMarks} />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Click the outline to mark each injury. Each mark is numbered and recorded with the body region. Leave blank if there was no bodily injury.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="col-span-2"><Label htmlFor="4f1d-first-aid-given">First Aid Given</Label><Textarea id="4f1d-first-aid-given" placeholder="First aid details…" rows={2} value={form.first_aid_details} onChange={(e) => setF("first_aid_details", e.target.value)} /></div>
            <div className="col-span-2"><Label htmlFor="4f1d-root-cause">Root Cause</Label><Textarea id="4f1d-root-cause" placeholder="What caused the accident?" rows={2} value={form.root_cause} onChange={(e) => setF("root_cause", e.target.value)} /></div>
            <div className="col-span-2"><Label htmlFor="4f1d-preventive-measures">Preventive Measures</Label><Textarea id="4f1d-preventive-measures" placeholder="Actions to prevent recurrence…" rows={2} value={form.preventive_measures} onChange={(e) => setF("preventive_measures", e.target.value)} /></div>

            {/* safeguarding & notifications */}
            <div className="col-span-2 rounded-lg border bg-muted/20 p-3 space-y-3">
              <p className="text-sm font-semibold">Safeguarding &amp; notifications</p>

              {form.person_type === "child" && (
                <ChildAccountField id="4f1d-child-account" value={form.child_account} onChange={(v) => setF("child_account", v)} />
              )}

              <ConsistencyToggle
                value={form.injury_consistent}
                onChange={(v) => setF("injury_consistent", v)}
                label="Is the injury consistent with the account?"
              />

              <div>
                <Label htmlFor="4f1d-medical-outcome">Medical advice / outcome</Label>
                <Input id="4f1d-medical-outcome" placeholder="e.g. GP / 111 / A&amp;E — advice given, treatment, follow-up" value={form.medical_outcome} onChange={(e) => setF("medical_outcome", e.target.value)} />
              </div>

              <div>
                <Label className="mb-1 block">Who was notified?</Label>
                <ChipMultiSelect options={NOTIFICATION_OPTIONS} value={form.notifications} onChange={(v) => setF("notifications", v)} ariaLabel="Who was notified" />
              </div>

              <div className="flex flex-wrap items-start gap-2">
                <button type="button" onClick={() => setF("notifiable_event", !form.notifiable_event)} aria-pressed={form.notifiable_event}
                  className={cn("rounded-md px-3 py-1 text-xs font-medium border transition-colors",
                    form.notifiable_event ? "bg-amber-600 text-white border-transparent" : "bg-background text-muted-foreground border-border hover:bg-muted")}>
                  Reg 40 notifiable event
                </button>
                {form.notifiable_event && (
                  <p className="text-[11px] text-amber-700 flex-1 min-w-[180px]">Notify Ofsted and the placing authority without undue delay (within 24h), and record the notification.</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setF("happened_before", !form.happened_before)} aria-pressed={form.happened_before}
                  className={cn("rounded-md px-3 py-1 text-xs font-medium border transition-colors",
                    form.happened_before ? "bg-[var(--cs-navy,#1e293b)] text-white border-transparent" : "bg-background text-muted-foreground border-border hover:bg-muted")}>
                  Happened before
                </button>
                {form.happened_before && (
                  <Input placeholder="Previously reported to…" aria-label="Previously reported to" value={form.previously_reported_to} onChange={(e) => setF("previously_reported_to", e.target.value)} className="h-8 w-auto flex-1 min-w-[160px]" />
                )}
                <button type="button" onClick={() => setF("care_plan_updated", !form.care_plan_updated)} aria-pressed={form.care_plan_updated}
                  className={cn("rounded-md px-3 py-1 text-xs font-medium border transition-colors",
                    form.care_plan_updated ? "bg-[var(--cs-navy,#1e293b)] text-white border-transparent" : "bg-background text-muted-foreground border-border hover:bg-muted")}>
                  Care plan / RA updated
                </button>
              </div>
            </div>
          </div>
          {!canSaveAccident && (
            <p className="text-xs text-[var(--cs-text-muted)]">Person injured, category, severity and description are needed before this can be saved — an accident record that asserts a severity nobody chose is worse than no record.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNew(false); setInjuryMarks([]); }}>Cancel</Button>
            <Button disabled={createAccident.isPending || !canSaveAccident} onClick={() => { createAccident.mutate({ date: form.date, time: form.time, reported_by: currentUserId(), person_type: form.person_type, person_id: null, person_name: form.person_name.trim(), category: form.category as AccidentCategory, severity: form.severity as AccidentSeverity, status: "open", location: form.location.trim(), description: form.description.trim(), injury_details: form.injury_details.trim(), first_aid_given: form.first_aid_details.trim() !== "", first_aid_by: null, first_aid_details: form.first_aid_details.trim(), medical_attention: form.medical_outcome.trim() !== "", medical_outcome: form.medical_outcome.trim(), hospital_attendance: false, hospital_name: null, parent_carer_notified: form.notifications.includes("parent_carer"), parent_notified_time: null, social_worker_notified: form.notifications.includes("social_worker"), notifications: form.notifications, notifiable_event: form.notifiable_event, riddor_reported: false, riddor_ref: null, witnesses: [], root_cause: form.root_cause.trim(), preventive_measures: form.preventive_measures.trim(), happened_before: form.happened_before, previously_reported_to: form.happened_before ? form.previously_reported_to.trim() : "", care_plan_updated: form.care_plan_updated, child_account: form.child_account.trim(), injury_consistent: form.injury_consistent === "" ? null : form.injury_consistent === "yes", follow_up_date: null, photographs_taken: false, injury_marks: injuryMarks, body_map_completed: injuryMarks.length > 0, signed_off_by: null }, { onSuccess: () => { toast.success("Accident record created"); setShowNew(false); setForm(EMPTY_FORM); setInjuryMarks([]); }, onError: () => toast.error("Failed to create accident record") }); }}>{createAccident.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Creating...</> : "Save Record"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Health"
        category="health"
        days={28}
        defaultCollapsed
      />      <CaraPanel
        mode="assist"
        pageContext="Accident Book — RIDDOR reporting, accidents to children and staff, first aid given, near misses, HSWA compliance, environmental hazards, Reg 40 notification triggers"
        recordType="incident"
        className="mt-6"
      />    </PageShell>
  );
}
