"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, ChevronDown, ChevronUp, ArrowUpDown, AlertTriangle, CheckCircle2,
  Clock, Search, ShieldAlert, Thermometer, Bug, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName, YOUNG_PEOPLE, STAFF } from "@/lib/seed-data";
import { useInfectionRecords, useCreateInfectionRecord } from "@/hooks/use-infection-records";
import { toast } from "sonner";
import type { InfectionRecord, InfectionType, InfectionSeverity, InfectionStatus } from "@/types/extended";
import { INFECTION_TYPE_LABEL, INFECTION_SEVERITY_LABEL, INFECTION_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── colour maps ─────────────────────────────────────────────────────────── */

const SEV_CLR: Record<InfectionSeverity, string> = { low: "bg-green-100 text-green-800", medium: "bg-amber-100 text-amber-800", high: "bg-red-100 text-red-800", outbreak: "bg-red-200 text-red-900" };
const SEV_BORDER: Record<InfectionSeverity, string> = { low: "border-l-green-400", medium: "border-l-amber-400", high: "border-l-red-500", outbreak: "border-l-red-700" };
const STATUS_CLR: Record<InfectionStatus, string> = { active: "bg-red-100 text-red-800", monitoring: "bg-amber-100 text-amber-800", resolved: "bg-green-100 text-green-800", notified: "bg-purple-100 text-purple-800" };

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function InfectionControlPage() {
  const { data: res, isLoading } = useInfectionRecords();
  const createInfection = useCreateInfectionRecord();
  const data: InfectionRecord[] = res?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showNew, setShowNew] = useState(false);

  const [infForm, setInfForm] = useState({
    affected_person_type: "child" as "child" | "staff",
    affected_person_id: "",
    infection_type: "" as InfectionType | "",
    severity: "" as InfectionSeverity | "",
    symptoms: "",
    notes: "",
    date_reported: new Date().toISOString().slice(0, 10),
    reported_by_id: "staff_darren",
  });
  const setIF = (k: keyof typeof infForm, v: string) => setInfForm((p) => ({ ...p, [k]: v }));

  const handleCreateInfection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infForm.infection_type || !infForm.severity || !infForm.affected_person_id) {
      toast.error("Affected person, infection type and severity are required.");
      return;
    }
    await createInfection.mutateAsync({
      date_reported: infForm.date_reported,
      reported_by_id: infForm.reported_by_id,
      affected_person_id: infForm.affected_person_id,
      affected_person_type: infForm.affected_person_type,
      infection_type: infForm.infection_type as InfectionType,
      symptoms: infForm.symptoms.split("\n").map((s) => s.trim()).filter(Boolean),
      severity: infForm.severity as InfectionSeverity,
      status: "active" as InfectionStatus,
      gp_consulted: false,
      gp_advice: "",
      exclusion_required: false,
      exclusion_details: "",
      control_measures: [],
      other_cases_in_home: 0,
      notified_bodies: [],
      date_resolved: null,
      cleaning_actions: [],
      notes: infForm.notes,
      created_at: new Date().toISOString(),
    });
    toast.success("Infection record logged.");
    setInfForm({ affected_person_type: "child", affected_person_id: "", infection_type: "", severity: "", symptoms: "", notes: "", date_reported: new Date().toISOString().slice(0, 10), reported_by_id: "staff_darren" });
    setShowNew(false);
  };

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        INFECTION_TYPE_LABEL[r.infection_type].toLowerCase().includes(q) ||
        (r.affected_person_type === "child" ? getYPName(r.affected_person_id) : getStaffName(r.affected_person_id)).toLowerCase().includes(q) ||
        r.notes.toLowerCase().includes(q)
      );
    }
    if (filterSeverity !== "all") rows = rows.filter((r) => r.severity === filterSeverity);
    if (filterStatus !== "all") rows = rows.filter((r) => r.status === filterStatus);
    rows.sort((a, b) => sortBy === "newest" ? b.date_reported.localeCompare(a.date_reported) : a.date_reported.localeCompare(b.date_reported));
    return rows;
  }, [data, search, filterSeverity, filterStatus, sortBy]);

  const total = data.length;
  const active = data.filter((r) => r.status === "active" || r.status === "monitoring").length;
  const resolved = data.filter((r) => r.status === "resolved").length;
  const exclusions = data.filter((r) => r.exclusion_required).length;

  const exportCols: ExportColumn<InfectionRecord>[] = [
    { header: "Date", accessor: (r: InfectionRecord) => r.date_reported },
    { header: "Affected Person", accessor: (r: InfectionRecord) => r.affected_person_type === "child" ? getYPName(r.affected_person_id) : getStaffName(r.affected_person_id) },
    { header: "Type", accessor: (r: InfectionRecord) => r.affected_person_type },
    { header: "Infection", accessor: (r: InfectionRecord) => INFECTION_TYPE_LABEL[r.infection_type] },
    { header: "Severity", accessor: (r: InfectionRecord) => INFECTION_SEVERITY_LABEL[r.severity] },
    { header: "Status", accessor: (r: InfectionRecord) => INFECTION_STATUS_LABEL[r.status] },
    { header: "GP Consulted", accessor: (r: InfectionRecord) => r.gp_consulted ? "Yes" : "No" },
    { header: "Exclusion", accessor: (r: InfectionRecord) => r.exclusion_required ? "Yes" : "No" },
    { header: "Other Cases", accessor: (r: InfectionRecord) => String(r.other_cases_in_home) },
    { header: "Resolved", accessor: (r: InfectionRecord) => r.date_resolved || "Ongoing" },
  ];

  if (isLoading) return <PageShell title="Infection Prevention & Control" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Infection Prevention & Control"
      subtitle="Health Protection · IPC Policy · Public Health England Guidance"
      ariaContext={{ pageTitle: "Infection Control Log", sourceType: "home_check" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Infection Control Log" />
          <ExportButton data={data} columns={exportCols} filename="infection-control" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Log Infection</Button>
          <AriaStudioQuickActionButton context={{ record_type: "health", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        {/* stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Records", value: total, icon: Bug, clr: "text-blue-600" },
            { label: "Active / Monitoring", value: active, icon: Thermometer, clr: "text-amber-600" },
            { label: "Resolved", value: resolved, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Exclusions Required", value: exclusions, icon: ShieldAlert, clr: "text-red-600" },
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

        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search infections..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              {(Object.entries(INFECTION_SEVERITY_LABEL) as [InfectionSeverity, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {(Object.entries(INFECTION_STATUS_LABEL) as [InfectionStatus, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}>
            <ArrowUpDown className="h-4 w-4 mr-1" />{sortBy === "newest" ? "Newest" : "Oldest"}
          </Button>
        </div>

        {/* active alert */}
        {active > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{active} active or monitoring infection(s)</p>
              <p className="text-amber-700">Active infections require daily monitoring, control measures in place, and GP advice followed. If 2+ cases of the same illness within 48 hours, this constitutes a potential outbreak — notify Public Health England and Ofsted immediately.</p>
            </div>
          </div>
        )}

        {/* record cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            const personName = r.affected_person_type === "child" ? getYPName(r.affected_person_id) : getStaffName(r.affected_person_id);
            return (
              <Card key={r.id} className={cn("border-l-4", SEV_BORDER[r.severity])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {personName} — {INFECTION_TYPE_LABEL[r.infection_type]}
                        <Badge variant="outline" className={SEV_CLR[r.severity]}>{INFECTION_SEVERITY_LABEL[r.severity]}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{INFECTION_STATUS_LABEL[r.status]}</Badge>
                        {r.exclusion_required && <Badge variant="outline" className="bg-orange-100 text-orange-800">Exclusion</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.affected_person_type === "child" ? "Young Person" : "Staff"} · Reported: {r.date_reported} · By: {getStaffName(r.reported_by_id)}
                        {r.gp_consulted && " · GP Consulted"} · Other cases: {r.other_cases_in_home}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* symptoms */}
                    <div>
                      <p className="font-medium mb-1">Symptoms</p>
                      <div className="flex flex-wrap gap-1">
                        {r.symptoms.map((s, i) => (
                          <Badge key={i} variant="outline" className="bg-red-50 text-red-700 text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* GP advice */}
                    {r.gp_consulted && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="font-medium text-xs text-blue-800 mb-1">GP Advice</p>
                        <p className="text-xs text-blue-700">{r.gp_advice}</p>
                      </div>
                    )}

                    {/* exclusion */}
                    {r.exclusion_required && (
                      <div className="bg-orange-50 border border-orange-200 rounded p-2">
                        <p className="font-medium text-xs text-orange-800 mb-1">Exclusion Details</p>
                        <p className="text-xs text-orange-700">{r.exclusion_details}</p>
                      </div>
                    )}

                    {/* control measures */}
                    <div>
                      <p className="font-medium mb-1">Control Measures</p>
                      <ul className="space-y-1">
                        {r.control_measures.map((m, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* cleaning */}
                    <div>
                      <p className="font-medium mb-1">Cleaning Actions</p>
                      <ul className="space-y-1">
                        {r.cleaning_actions.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* notifications */}
                    {r.notified_bodies.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">External Notifications</p>
                        <div className="flex flex-wrap gap-1">
                          {r.notified_bodies.map((b, i) => (
                            <Badge key={i} variant="outline" className="bg-purple-50 text-purple-700 text-xs">{b}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* timeline */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Reported</p>
                        <p className="text-xs font-bold">{r.date_reported}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Resolved</p>
                        <p className="text-xs font-bold">{r.date_resolved || "Ongoing"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Other Cases in Home</p>
                        <p className={cn("text-xs font-bold", r.other_cases_in_home > 0 ? "text-red-700" : "text-green-700")}>{r.other_cases_in_home}</p>
                      </div>
                    </div>

                    {/* notes */}
                    <div><p className="font-medium mb-1">Notes</p><p className="text-muted-foreground text-xs">{r.notes}</p></div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Infection Prevention & Control Framework</p>
          <p>Children&apos;s homes must follow Public Health England guidance on infection prevention and control. All infectious illness must be recorded, with GP advice sought where appropriate. The 48-hour rule applies to D&amp;V (return to school/work 48 hours after last episode). Outbreaks (2+ linked cases within 48 hours) must be reported to the local Health Protection Team and Ofsted. Control measures must be proportionate and documented. Staff must be trained in basic IPC including hand hygiene, PPE use, and cleaning protocols. Records are subject to Reg 44 and Ofsted inspection.</p>
        </div>
      </div>

      {/* new record dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Infection / Illness</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateInfection} className="space-y-3">
            <div>
              <Label>Date Reported</Label>
              <Input type="date" value={infForm.date_reported} onChange={(e) => setIF("date_reported", e.target.value)} />
            </div>
            <div>
              <Label>Reported By</Label>
              <Select value={infForm.reported_by_id} onValueChange={(v) => setIF("reported_by_id", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STAFF.filter((s) => s.employment_status === "active").map((s) => (<SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Affected Person Type</Label>
              <Select value={infForm.affected_person_type} onValueChange={(v) => { setIF("affected_person_type", v); setIF("affected_person_id", ""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="child">Young Person</SelectItem>
                  <SelectItem value="staff">Staff Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Affected Person *</Label>
              <Select value={infForm.affected_person_id} onValueChange={(v) => setIF("affected_person_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
                <SelectContent>
                  {infForm.affected_person_type === "child"
                    ? YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => (<SelectItem key={y.id} value={y.id}>{y.first_name} {y.last_name}</SelectItem>))
                    : STAFF.filter((s) => s.employment_status === "active").map((s) => (<SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>))
                  }
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Infection Type *</Label>
              <Select value={infForm.infection_type} onValueChange={(v) => setIF("infection_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(INFECTION_TYPE_LABEL) as [InfectionType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severity *</Label>
              <Select value={infForm.severity} onValueChange={(v) => setIF("severity", v)}>
                <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(INFECTION_SEVERITY_LABEL) as [InfectionSeverity, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Symptoms (one per line)</Label><Textarea placeholder="List symptoms observed..." value={infForm.symptoms} onChange={(e) => setIF("symptoms", e.target.value)} /></div>
            <div><Label>Notes</Label><Textarea placeholder="Additional notes..." value={infForm.notes} onChange={(e) => setIF("notes", e.target.value)} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createInfection.isPending}>
                {createInfection.isPending ? "Logging…" : "Log Record"}
              </Button>
            </DialogFooter>
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
        pageContext="Infection Control Log — illness outbreak, infection risk, cleaning protocols, PPE, quarantine, UKHSA notification, food hygiene, hand hygiene, Reg 31, Annex A evidence"
        recordType="health"
        className="mt-6"
      />
    </PageShell>
  );
}
