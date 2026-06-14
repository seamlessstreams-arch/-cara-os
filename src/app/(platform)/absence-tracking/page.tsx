"use client";

import { useState, useMemo } from "react";
import {
  CalendarX, Plus, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, Clock, TrendingDown,
  ChevronDown, ChevronUp, GraduationCap, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName, YOUNG_PEOPLE } from "@/lib/seed-data";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { useAbsenceTracking, useCreateAbsence } from "@/hooks/use-absence-tracking";
import type { AbsenceType, AbsenceSetting, AbsenceRecord } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── local label / colour maps ──────────────────────────────────────── */
const ABSENCE_TYPES: AbsenceType[] = [
  "authorised", "unauthorised", "medical", "exclusion",
  "part_time_timetable", "late_arrival", "internal_truancy",
];
const ABSENCE_LABELS: Record<AbsenceType, string> = {
  authorised: "Authorised", unauthorised: "Unauthorised",
  medical: "Medical", exclusion: "Exclusion",
  part_time_timetable: "Part-Time Timetable", late_arrival: "Late Arrival",
  internal_truancy: "Internal Truancy",
};
const ABSENCE_COLORS: Record<AbsenceType, string> = {
  authorised: "bg-blue-100 text-blue-800", unauthorised: "bg-red-100 text-red-800",
  medical: "bg-yellow-100 text-yellow-800", exclusion: "bg-red-100 text-red-800",
  part_time_timetable: "bg-purple-100 text-purple-800", late_arrival: "bg-orange-100 text-orange-800",
  internal_truancy: "bg-red-100 text-red-800",
};

const SETTINGS: AbsenceSetting[] = ["school", "college", "pru", "tuition", "activity", "appointment"];
const SETTING_LABELS: Record<AbsenceSetting, string> = {
  school: "School", college: "College", pru: "PRU",
  tuition: "Home Tuition", activity: "Activity", appointment: "Appointment",
};

/* ── component ───────────────────────────────────────────────────────── */
export default function AbsenceTrackingPage() {
  const { data: result, isLoading } = useAbsenceTracking();
  const createAbsence = useCreateAbsence();
  const records = result?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterYP, setFilterYP] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const [abForm, setAbForm] = useState({ child_id: "", date: new Date().toISOString().slice(0, 10), absence_type: "unauthorised" as AbsenceType, setting: "school" as AbsenceSetting, setting_name: "", sessions: "1", reason: "", action_taken: "" });
  const setAB = (k: string, v: unknown) => setAbForm((p) => ({ ...p, [k]: v }));

  const handleRecordAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!abForm.child_id) { toast.error("Please select a young person."); return; }
    if (!abForm.reason.trim()) { toast.error("Reason is required."); return; }
    await createAbsence.mutateAsync({ child_id: abForm.child_id, date: abForm.date, absence_type: abForm.absence_type, setting: abForm.setting, setting_name: abForm.setting_name.trim(), sessions: parseInt(abForm.sessions) || 1, reason: abForm.reason.trim(), action_taken: abForm.action_taken.trim(), school_notified: false, sw_notified: false, recorded_by: "staff_darren", follow_up: "", created_at: new Date().toISOString() });
    toast.success("Absence recorded.");
    setAbForm({ child_id: "", date: new Date().toISOString().slice(0, 10), absence_type: "unauthorised", setting: "school", setting_name: "", sessions: "1", reason: "", action_taken: "" });
    setShowNew(false);
  };

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.reason.toLowerCase().includes(q) ||
          r.setting_name.toLowerCase().includes(q) ||
          r.action_taken.toLowerCase().includes(q)
      );
    }
    if (filterYP !== "all") list = list.filter((r) => r.child_id === filterYP);
    if (filterType !== "all") list = list.filter((r) => r.absence_type === filterType);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "yp": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "type": return a.absence_type.localeCompare(b.absence_type);
        case "sessions": return b.sessions - a.sessions;
        default: return 0;
      }
    });
    return list;
  }, [records, search, filterYP, filterType, sortBy]);

  /* per-child stats */
  const ypIds = [...new Set(records.map((r) => r.child_id))];
  const ypStats = ypIds.map((id) => {
    const yps = records.filter((r) => r.child_id === id);
    const totalSessions = yps.reduce((s, r) => s + r.sessions, 0);
    const unauthorised = yps.filter((r) => r.absence_type === "unauthorised" || r.absence_type === "internal_truancy").reduce((s, r) => s + r.sessions, 0);
    return { id, name: getYPName(id), total: totalSessions, unauthorised };
  });

  const totalAbsences = records.length;
  const totalSessionsLost = records.reduce((s, r) => s + r.sessions, 0);
  const unauthorisedCount = records.filter((r) => r.absence_type === "unauthorised" || r.absence_type === "internal_truancy").length;
  const exclusions = records.filter((r) => r.absence_type === "exclusion").length;

  const exportCols: ExportColumn<AbsenceRecord>[] = [
    { header: "ID", accessor: (r: AbsenceRecord) => r.id },
    { header: "Young Person", accessor: (r: AbsenceRecord) => getYPName(r.child_id) },
    { header: "Date", accessor: (r: AbsenceRecord) => r.date },
    { header: "Type", accessor: (r: AbsenceRecord) => ABSENCE_LABELS[r.absence_type] },
    { header: "Setting", accessor: (r: AbsenceRecord) => SETTING_LABELS[r.setting] },
    { header: "Setting Name", accessor: (r: AbsenceRecord) => r.setting_name },
    { header: "Sessions Lost", accessor: (r: AbsenceRecord) => r.sessions },
    { header: "Reason", accessor: (r: AbsenceRecord) => r.reason },
    { header: "Action Taken", accessor: (r: AbsenceRecord) => r.action_taken },
    { header: "School Notified", accessor: (r: AbsenceRecord) => r.school_notified ? "Yes" : "No" },
    { header: "SW Notified", accessor: (r: AbsenceRecord) => r.sw_notified ? "Yes" : "No" },
    { header: "Recorded By", accessor: (r: AbsenceRecord) => getStaffName(r.recorded_by) },
    { header: "Follow-Up", accessor: (r: AbsenceRecord) => r.follow_up ?? "" },
  ];

  if (isLoading) {
    return (
      <PageShell title="Absence Tracking" subtitle="Monitor school and education attendance for all young people">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Absence Tracking"
      subtitle="Monitor school and education attendance for all young people"
      caraContext={{ pageTitle: "Absence Tracking", sourceType: "staff" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Absence Tracking" />
          <ExportButton data={filtered} columns={exportCols} filename="absence-tracking" />
          <CaraStudioQuickActionButton context={{ record_type: "rota", record_id: "home_oak", home_id: "home_oak" }} />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> Record Absence
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Absences", value: totalAbsences, icon: CalendarX, colour: "text-blue-600" },
            { label: "Sessions Lost", value: totalSessionsLost, icon: Clock, colour: "text-orange-600" },
            { label: "Unauthorised", value: unauthorisedCount, icon: AlertTriangle, colour: unauthorisedCount > 0 ? "text-red-600" : "text-[var(--cs-text-muted)]" },
            { label: "Exclusions", value: exclusions, icon: TrendingDown, colour: exclusions > 0 ? "text-red-600" : "text-[var(--cs-text-muted)]" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── per-child summary ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ypStats.map((yp) => (
            <div key={yp.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                <p className="font-medium text-sm">{yp.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Sessions Lost</p>
                  <p className="font-bold">{yp.total}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Unauthorised</p>
                  <p className={cn("font-bold", yp.unauthorised > 0 && "text-red-600")}>{yp.unauthorised}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── alerts ────────────────────────────────────────────── */}
        {unauthorisedCount > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>{unauthorisedCount}</strong> unauthorised absence(s) recorded. Review patterns and
                implement attendance action plans where attendance falls below 90%.
              </p>
            </div>
          </div>
        )}

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reasons, settings, actions…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterYP} onValueChange={setFilterYP}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Children</SelectItem>
                {ypIds.map((id) => (
                  <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {ABSENCE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{ABSENCE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="yp">Young Person</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="sessions">Sessions Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No absences match your filters.</div>
          )}
          {filtered.map((rec) => {
            const isExpanded = expanded === rec.id;
            return (
              <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : rec.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <CalendarX className={cn("h-5 w-5 shrink-0",
                      rec.absence_type === "unauthorised" || rec.absence_type === "exclusion" ? "text-red-600" :
                      rec.absence_type === "medical" ? "text-yellow-600" : "text-blue-600"
                    )} />
                    <div className="min-w-0">
                      <p className="font-medium">{getYPName(rec.child_id)} — {rec.date}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rec.setting_name} · {rec.sessions === 1 ? "½ day" : rec.sessions === 2 ? "Full day" : `${rec.sessions / 2} days`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", ABSENCE_COLORS[rec.absence_type])}>
                      {ABSENCE_LABELS[rec.absence_type]}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Setting:</span> <span className="font-medium">{SETTING_LABELS[rec.setting]}</span></div>
                      <div><span className="text-muted-foreground">Sessions:</span> <span className="font-medium">{rec.sessions}</span></div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className={cn("h-3 w-3", rec.school_notified ? "text-green-600" : "text-[var(--cs-text-gentle)]")} />
                        <span className="text-sm">School Notified</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className={cn("h-3 w-3", rec.sw_notified ? "text-green-600" : "text-[var(--cs-text-gentle)]")} />
                        <span className="text-sm">SW Notified</span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Reason</p>
                      <p className="text-sm">{rec.reason}</p>
                    </div>

                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-medium text-blue-700 mb-1">Action Taken</p>
                      <p className="text-sm">{rec.action_taken}</p>
                    </div>

                    {rec.follow_up && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-medium text-amber-700 mb-1">Follow-Up Required</p>
                        <p className="text-sm">{rec.follow_up}</p>
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      Recorded by {getStaffName(rec.recorded_by)}
                    </div>

                    <SmartLinkPanel
                      sourceType="absence_tracking"
                      sourceId={rec.id}
                      childId={rec.child_id}
                      compact
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Education & Attendance:</strong> Children&apos;s homes must promote education attendance (Reg 8).
          All absences must be recorded with reasons and actions taken. Persistent absence (below 90%)
          triggers a PEP review. Exclusions must be reported to the placing authority and recorded on the
          child&apos;s file. The Virtual School Head should be consulted where attendance is a concern.
        </div>
      </div>

      {/* ── placeholder dialog ──────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Absence</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRecordAbsence} className="space-y-3 py-2">
            <div><label className="text-sm font-medium">Young Person *</label>
              <Select value={abForm.child_id} onValueChange={(v) => setAB("child_id", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => <SelectItem key={y.id} value={y.id}>{y.preferred_name ?? y.first_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Date</label><Input type="date" value={abForm.date} onChange={(e) => setAB("date", e.target.value)} className="mt-1" /></div>
              <div><label className="text-sm font-medium">Sessions</label><Input type="number" value={abForm.sessions} onChange={(e) => setAB("sessions", e.target.value)} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Type</label>
                <Select value={abForm.absence_type} onValueChange={(v) => setAB("absence_type", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ABSENCE_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Setting</label>
                <Select value={abForm.setting} onValueChange={(v) => setAB("setting", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="school">School</SelectItem><SelectItem value="college">College</SelectItem><SelectItem value="pru">PRU</SelectItem><SelectItem value="tuition">Tuition</SelectItem><SelectItem value="activity">Activity</SelectItem><SelectItem value="appointment">Appointment</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Setting Name</label><Input className="mt-1" placeholder="Name of school / provider" value={abForm.setting_name} onChange={(e) => setAB("setting_name", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Reason *</label><Textarea className="mt-1" rows={2} placeholder="Why was the child absent?" value={abForm.reason} onChange={(e) => setAB("reason", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Action Taken</label><Textarea className="mt-1" rows={2} placeholder="What action was taken?" value={abForm.action_taken} onChange={(e) => setAB("action_taken", e.target.value)} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createAbsence.isPending}>{createAbsence.isPending ? "Saving…" : "Record Absence"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Health & Behaviour"
        category={["health", "behaviour", "education"]}
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Absence Tracking — staff sickness, annual leave, TOIL, emergency leave, Bradford factor, fit notes, return to work, cover arrangements, safe staffing, Reg 44 evidence"
        recordType="rota"
        className="mt-6"
      />
    </PageShell>
  );
}
