"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  Plus,
  ArrowUpDown,
  Search,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { PageShell }    from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { useTherapeuticInputRecords, useCreateTherapeuticInputRecord } from "@/hooks/use-therapeutic-input-records";
import { toast } from "sonner";
import { YOUNG_PEOPLE } from "@/lib/seed-data";
import type {
  TherapeuticInputRecord,
  TherapeuticInputTherapyType,
  TherapeuticInputReferralStatus,
  TherapeuticInputEngagement,
} from "@/types/extended";
import { THERAPEUTIC_INPUT_THERAPY_TYPE_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local config ─────────────────────────────────────────────────────── */

const STATUS_META: Record<TherapeuticInputReferralStatus, { label: string; colour: string }> = {
  pending:    { label: "Pending",     colour: "bg-amber-100 text-amber-700" },
  accepted:   { label: "Accepted",    colour: "bg-blue-100 text-blue-700" },
  active:     { label: "Active",      colour: "bg-green-100 text-green-700" },
  on_hold:    { label: "On Hold",     colour: "bg-gray-100 text-gray-700" },
  completed:  { label: "Completed",   colour: "bg-purple-100 text-purple-700" },
  discharged: { label: "Discharged",  colour: "bg-gray-100 text-gray-500" },
  declined:   { label: "Declined",    colour: "bg-red-100 text-red-700" },
};

const ENG_META: Record<TherapeuticInputEngagement, { label: string; colour: string }> = {
  excellent:  { label: "Excellent",  colour: "bg-green-100 text-green-700" },
  good:       { label: "Good",      colour: "bg-blue-100 text-blue-700" },
  variable:   { label: "Variable",  colour: "bg-amber-100 text-amber-700" },
  reluctant:  { label: "Reluctant", colour: "bg-orange-100 text-orange-700" },
  disengaged: { label: "Disengaged",colour: "bg-red-100 text-red-700" },
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function TherapeuticInputPage() {
  const { data: records = [], isLoading } = useTherapeuticInputRecords();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  const createReferral = useCreateTherapeuticInputRecord();
  const [tiForm, setTiForm] = useState({ child_id: "", therapy_type: "camhs" as TherapeuticInputTherapyType, provider: "", therapist: "", referral_reason: "", goals: "" });
  const setTI = (k: keyof typeof tiForm, v: string) => setTiForm((p) => ({ ...p, [k]: v }));

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tiForm.child_id) { toast.error("Please select a young person."); return; }
    if (!tiForm.referral_reason.trim()) { toast.error("Referral reason is required."); return; }
    await createReferral.mutateAsync({ child_id: tiForm.child_id, therapy_type: tiForm.therapy_type, provider: tiForm.provider.trim(), therapist: tiForm.therapist.trim(), referral_date: new Date().toISOString().slice(0, 10), start_date: null, frequency: "", status: "pending", referral_reason: tiForm.referral_reason.trim(), goals: tiForm.goals ? tiForm.goals.split("\n").map((s) => s.trim()).filter(Boolean) : [], recent_sessions: [], waiting_weeks: null, home_key_worker: "staff_darren", consent: "obtained", next_appointment: null, review_date: null, progress_notes: "" });
    toast.success("Therapy referral submitted.");
    setTiForm({ child_id: "", therapy_type: "camhs", provider: "", therapist: "", referral_reason: "", goals: "" });
    setShowDialog(false);
  };

  const stats = useMemo(() => ({
    total: records.length,
    active: records.filter((r) => r.status === "active").length,
    pending: records.filter((r) => r.status === "pending").length,
    totalSessions: records.reduce((s, r) => s + r.recent_sessions.length, 0),
    attendanceRate: (() => {
      const sessions = records.flatMap((r) => r.recent_sessions);
      if (!sessions.length) return 0;
      return Math.round((sessions.filter((s) => s.attended).length / sessions.length) * 100);
    })(),
  }), [records]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterType !== "all") list = list.filter((r) => r.therapy_type === filterType);
    if (filterYP !== "all") list = list.filter((r) => r.child_id === filterYP);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.therapist.toLowerCase().includes(q) || r.provider.toLowerCase().includes(q) || THERAPEUTIC_INPUT_THERAPY_TYPE_LABEL[r.therapy_type].toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "type": return THERAPEUTIC_INPUT_THERAPY_TYPE_LABEL[a.therapy_type].localeCompare(THERAPEUTIC_INPUT_THERAPY_TYPE_LABEL[b.therapy_type]);
        case "yp":   return a.child_id.localeCompare(b.child_id);
        default:     return b.referral_date.localeCompare(a.referral_date);
      }
    });
    return list;
  }, [records, filterType, filterYP, search, sortBy]);

  const exportData = useMemo(() => records.map((r) => ({
    youngPerson: getYPName(r.child_id),
    therapyType: THERAPEUTIC_INPUT_THERAPY_TYPE_LABEL[r.therapy_type],
    provider: r.provider,
    therapist: r.therapist,
    status: STATUS_META[r.status].label,
    referralDate: r.referral_date,
    startDate: r.start_date || "Pending",
    frequency: r.frequency,
    referralReason: r.referral_reason,
    goals: r.goals.join("; "),
    sessionsAttended: r.recent_sessions.filter((s) => s.attended).length,
    nextAppointment: r.next_appointment || "TBC",
    homeKeyWorker: getStaffName(r.home_key_worker),
    progressNotes: r.progress_notes,
  })), [records]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Young Person",    accessor: (r: typeof exportData[number]) => r.youngPerson },
    { header: "Therapy Type",    accessor: (r: typeof exportData[number]) => r.therapyType },
    { header: "Provider",        accessor: (r: typeof exportData[number]) => r.provider },
    { header: "Therapist",       accessor: (r: typeof exportData[number]) => r.therapist },
    { header: "Status",          accessor: (r: typeof exportData[number]) => r.status },
    { header: "Referral Date",   accessor: (r: typeof exportData[number]) => r.referralDate },
    { header: "Start Date",      accessor: (r: typeof exportData[number]) => r.startDate },
    { header: "Frequency",       accessor: (r: typeof exportData[number]) => r.frequency },
    { header: "Referral Reason", accessor: (r: typeof exportData[number]) => r.referralReason },
    { header: "Goals",           accessor: (r: typeof exportData[number]) => r.goals },
    { header: "Sessions Attended",accessor: (r: typeof exportData[number]) => String(r.sessionsAttended) },
    { header: "Next Appointment",accessor: (r: typeof exportData[number]) => r.nextAppointment },
    { header: "Home Key Worker", accessor: (r: typeof exportData[number]) => r.homeKeyWorker },
    { header: "Progress Notes",  accessor: (r: typeof exportData[number]) => r.progressNotes },
  ];

  const ypIds = [...new Set(records.map((r) => r.child_id))];

  if (isLoading) {
    return (
      <PageShell title="Therapeutic Input" subtitle="Therapy referrals, sessions and progress tracking — CAMHS, play therapy, counselling and specialist input">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Therapeutic Input"
      subtitle="Therapy referrals, sessions and progress tracking — CAMHS, play therapy, counselling and specialist input"
      ariaContext={{ pageTitle: "Therapeutic Input", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="therapeutic-input" />
          <PrintButton title="Therapeutic Input" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> New Referral
          </button>
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total Referrals", v: stats.total, icon: Heart, c: "text-pink-600" },
            { l: "Active",          v: stats.active, icon: CheckCircle2, c: "text-green-600" },
            { l: "Pending",         v: stats.pending, icon: Clock, c: "text-amber-600" },
            { l: "Sessions Logged", v: stats.totalSessions, icon: Calendar, c: "text-blue-600" },
            { l: "Attendance",      v: `${stats.attendanceRate}%`, icon: CheckCircle2, c: "text-purple-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {stats.pending > 0 && (
          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800"><strong>{stats.pending} referral{stats.pending > 1 ? "s" : ""}</strong> awaiting allocation or assessment.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search therapists, providers…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Therapy Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(THERAPEUTIC_INPUT_THERAPY_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Young Person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {ypIds.map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="date">Referral Date</option>
              <option value="type">Therapy Type</option>
              <option value="yp">Young Person</option>
            </select>
          </div>
        </div>

        {filtered.map((rec) => (
          <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
            <button onClick={() => setExpanded(expanded === rec.id ? null : rec.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-pink-500" />
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{THERAPEUTIC_INPUT_THERAPY_TYPE_LABEL[rec.therapy_type]}</h3>
                    <span className="text-sm text-muted-foreground">— {getYPName(rec.child_id)}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[rec.status].colour)}>{STATUS_META[rec.status].label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.therapist} · {rec.provider} · {rec.frequency}</p>
                </div>
              </div>
              {expanded === rec.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === rec.id && (
              <div className="border-t p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Referred:</span> {rec.referral_date}</div>
                  <div><span className="text-muted-foreground">Started:</span> {rec.start_date || "Awaiting"}</div>
                  <div><span className="text-muted-foreground">Key Worker:</span> {getStaffName(rec.home_key_worker)}</div>
                  <div><span className="text-muted-foreground">Next:</span> {rec.next_appointment || "TBC"}</div>
                </div>

                {rec.waiting_weeks !== null && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-sm text-amber-800"><Clock className="inline h-4 w-4 mr-1" />On waiting list — <strong>{rec.waiting_weeks} weeks</strong> since referral.</p>
                  </div>
                )}

                <div className="rounded-lg bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold mb-1">Referral Reason</h4>
                  <p className="text-sm text-muted-foreground">{rec.referral_reason}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-1">Therapeutic Goals</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">{rec.goals.map((g, i) => <li key={i}>{g}</li>)}</ol>
                </div>

                <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Consent:</span> {rec.consent}</div>

                {rec.recent_sessions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Recent Sessions</h4>
                    <div className="space-y-3">
                      {rec.recent_sessions.map((s, i) => (
                        <div key={i} className={cn("rounded border p-3", s.attended ? "" : "bg-red-50")}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{s.date}</span>
                              {s.attended ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <span className="text-xs text-red-600 font-medium">Did Not Attend</span>}
                            </div>
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ENG_META[s.engagement].colour)}>{ENG_META[s.engagement].label}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{s.summary}</p>
                          {s.home_actions.length > 0 && (
                            <div className="rounded bg-blue-50 p-2">
                              <p className="text-xs font-semibold text-blue-800 mb-1">Home Actions:</p>
                              <ul className="list-disc list-inside text-xs text-blue-900">{s.home_actions.map((a, j) => <li key={j}>{a}</li>)}</ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-green-50 p-3">
                  <h4 className="text-sm font-semibold text-green-800 mb-1">Progress Notes</h4>
                  <p className="text-sm text-green-900">{rec.progress_notes}</p>
                </div>

                <SmartLinkPanel sourceType="therapeutic-input-record" sourceId={rec.id} childId={rec.child_id} compact />
              </div>
            )}
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Reg 5 / Reg 10 / NICE CG158</strong> — The home must ensure children receive appropriate therapeutic support to address their emotional and mental health needs. Progress and engagement must be monitored and the home team should actively support therapeutic goals between sessions.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Therapy Referral</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitReferral} className="grid gap-3 py-2">
            <select className="rounded border px-3 py-2 text-sm" value={tiForm.child_id} onChange={(e) => setTI("child_id", e.target.value)}><option value="">Young Person… *</option>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => <option key={y.id} value={y.id}>{y.preferred_name ?? y.first_name}</option>)}</select>
            <select className="rounded border px-3 py-2 text-sm" value={tiForm.therapy_type} onChange={(e) => setTI("therapy_type", e.target.value)}>{Object.entries(THERAPEUTIC_INPUT_THERAPY_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <input placeholder="Provider organisation" className="rounded border px-3 py-2 text-sm" value={tiForm.provider} onChange={(e) => setTI("provider", e.target.value)} />
            <input placeholder="Therapist name" className="rounded border px-3 py-2 text-sm" value={tiForm.therapist} onChange={(e) => setTI("therapist", e.target.value)} />
            <textarea placeholder="Referral reason *" rows={3} className="rounded border px-3 py-2 text-sm" value={tiForm.referral_reason} onChange={(e) => setTI("referral_reason", e.target.value)} />
            <textarea placeholder="Goals (one per line)" rows={2} className="rounded border px-3 py-2 text-sm" value={tiForm.goals} onChange={(e) => setTI("goals", e.target.value)} />
            <DialogFooter>
              <button type="button" onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={createReferral.isPending} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">{createReferral.isPending ? "Submitting…" : "Submit Referral"}</button>
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
        pageContext="Therapeutic Input — CAMHS referrals, therapy sessions, therapeutic interventions, counselling records, external agency input, care plan therapeutic evidence, Reg 45 quality evidence"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
