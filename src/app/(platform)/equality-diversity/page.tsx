"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Globe,
  Plus,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Users,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getStaffName, STAFF } from "@/lib/seed-data";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useEqualityInitiatives, useCreateEqualityInitiative } from "@/hooks/use-equality-initiatives";
import { useEqualityTraining } from "@/hooks/use-equality-training";
import type {
  EqualityInitiative,
  EqualityTrainingRecord,
  EqualityMonitoringData,
  EqualityInitiativeStatus,
  ProtectedCharacteristic,
} from "@/types/extended";
import {
  EQUALITY_INITIATIVE_STATUS_LABEL,
  PROTECTED_CHARACTERISTIC_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── constants ─────────────────────────────────────────────────────────── */

const STATUS_COLOURS: Record<EqualityInitiativeStatus, string> = {
  planned: "bg-blue-100 text-blue-800", active: "bg-green-100 text-green-800",
  completed: "bg-emerald-100 text-emerald-800", ongoing: "bg-purple-100 text-purple-800",
};

/* ── hardcoded monitoring (no store collection) ─────────────────────────── */

const MONITORING: EqualityMonitoringData = {
  staff_diversity: [
    { characteristic: "Ethnicity", breakdown: { "White British": 5, "Black British": 1, "Romanian": 1, "Mixed Heritage": 1 } },
    { characteristic: "Gender", breakdown: { "Female": 5, "Male": 3 } },
    { characteristic: "Age Range", breakdown: { "18-25": 1, "26-35": 3, "36-45": 2, "46-55": 2 } },
    { characteristic: "Disability", breakdown: { "No disability disclosed": 7, "Disability disclosed": 1 } },
  ],
  yp_diversity: [
    { characteristic: "Ethnicity", breakdown: { "White British": 2, "Mixed Heritage": 1 } },
    { characteristic: "Gender", breakdown: { "Male": 2, "Non-binary": 1 } },
    { characteristic: "Disability/SEND", breakdown: { "ADHD": 1, "ASD": 1, "None disclosed": 1 } },
    { characteristic: "Religion", breakdown: { "No religion": 2, "Christian": 1 } },
  ],
  last_audit_date: "2026-04-07",
  next_audit_due: "2026-07-06",
  audited_by: "staff_darren",
};

/* ── flat row for export ─────────────────────────────────────────────── */

interface FlatRow {
  initiative: string; status: string; lead: string; characteristics: string;
  actionsTotal: string; actionsComplete: string; outcomes: string;
  startDate: string; targetDate: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Initiative",        accessor: (r: FlatRow) => r.initiative },
  { header: "Status",            accessor: (r: FlatRow) => r.status },
  { header: "Lead",              accessor: (r: FlatRow) => r.lead },
  { header: "Characteristics",   accessor: (r: FlatRow) => r.characteristics },
  { header: "Actions (Total)",   accessor: (r: FlatRow) => r.actionsTotal },
  { header: "Actions (Complete)",accessor: (r: FlatRow) => r.actionsComplete },
  { header: "Outcomes",          accessor: (r: FlatRow) => r.outcomes },
  { header: "Start Date",        accessor: (r: FlatRow) => r.startDate },
  { header: "Target Date",       accessor: (r: FlatRow) => r.targetDate },
  { header: "Notes",             accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function EqualityDiversityPage() {
  const { data: initRes, isLoading: initLoading } = useEqualityInitiatives();
  const { data: trainRes, isLoading: trainLoading } = useEqualityTraining();
  const initiatives: EqualityInitiative[] = initRes?.data ?? [];
  const training: EqualityTrainingRecord[] = trainRes?.data ?? [];
  const monitoring = MONITORING;

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("status");
  const [dialogOpen, setDialogOpen] = useState(false);

  const createInitiative = useCreateEqualityInitiative();
  const [eqForm, setEqForm] = useState({ title: "", description: "", lead_by: "staff_darren" });
  const setEQ = (k: keyof typeof eqForm, v: string) => setEqForm((p) => ({ ...p, [k]: v }));

  const handleCreateInitiative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqForm.title.trim()) { toast.error("Title is required."); return; }
    const today = new Date().toISOString().slice(0, 10);
    const target = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
    await createInitiative.mutateAsync({ title: eqForm.title.trim(), description: eqForm.description.trim(), status: "planned", lead_by: eqForm.lead_by, start_date: today, target_date: target, characteristics: [], objectives: [], actions: [], outcomes: [], evidence: [], notes: "", created_at: new Date().toISOString() });
    toast.success("Initiative created.");
    setEqForm({ title: "", description: "", lead_by: "staff_darren" });
    setDialogOpen(false);
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const isLoading = initLoading || trainLoading;

  const stats = useMemo(() => {
    const active = initiatives.filter((i) => ["active", "ongoing"].includes(i.status)).length;
    const completed = initiatives.filter((i) => i.status === "completed").length;
    const totalActions = initiatives.reduce((s, i) => s + i.actions.length, 0);
    const completedActions = initiatives.reduce((s, i) => s + i.actions.filter((a) => a.status === "completed").length, 0);
    return { active, completed, totalActions, completedActions };
  }, [initiatives]);

  const filtered = useMemo(() => {
    let list = [...initiatives];
    if (search) { const q = search.toLowerCase(); list = list.filter((i) => i.title.toLowerCase().includes(q)); }
    if (filterStatus !== "all") list = list.filter((i) => i.status === filterStatus);
    const out = [...list];
    switch (sortBy) {
      case "status": out.sort((a, b) => a.status.localeCompare(b.status)); break;
      case "date": out.sort((a, b) => b.start_date.localeCompare(a.start_date)); break;
    }
    return out;
  }, [initiatives, search, filterStatus, sortBy]);

  const exportData = useMemo<FlatRow[]>(() =>
    initiatives.map((i) => ({
      initiative: i.title, status: EQUALITY_INITIATIVE_STATUS_LABEL[i.status], lead: getStaffName(i.lead_by),
      characteristics: i.characteristics.map((c) => PROTECTED_CHARACTERISTIC_LABEL[c]).join(", "),
      actionsTotal: `${i.actions.length}`,
      actionsComplete: `${i.actions.filter((a) => a.status === "completed").length}`,
      outcomes: i.outcomes.join("; "), startDate: i.start_date, targetDate: i.target_date, notes: i.notes,
    })), [initiatives]);

  if (isLoading) return <PageShell title="Equality & Diversity" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Equality & Diversity"
      subtitle="Promoting equality, celebrating diversity and monitoring protected characteristics"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Equality & Diversity" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="equality-diversity" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Initiative
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Initiatives", value: stats.active, icon: Globe, colour: "text-blue-600" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, colour: "text-green-600" },
          { label: "Total Actions", value: stats.totalActions, icon: Users, colour: "text-purple-600" },
          { label: "Actions Complete", value: stats.completedActions, icon: TrendingUp, colour: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* monitoring overview */}
      <div className="rounded-lg border bg-white p-4 mb-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-gray-400" /> Diversity Monitoring</h3>
        <p className="text-xs text-gray-500 mb-3">Last audit: {monitoring.last_audit_date} by {getStaffName(monitoring.audited_by)} · Next: {monitoring.next_audit_due}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2">Staff Diversity</h4>
            {monitoring.staff_diversity.map((d) => (
              <div key={d.characteristic} className="mb-2">
                <p className="text-xs font-medium text-gray-600">{d.characteristic}</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {Object.entries(d.breakdown).map(([k, v]) => (
                    <span key={k} className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded text-xs">{k}: {v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2">Young People Diversity</h4>
            {monitoring.yp_diversity.map((d) => (
              <div key={d.characteristic} className="mb-2">
                <p className="text-xs font-medium text-gray-600">{d.characteristic}</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {Object.entries(d.breakdown).map(([k, v]) => (
                    <span key={k} className="px-2 py-0.5 bg-pink-50 text-pink-800 rounded text-xs">{k}: {v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* training */}
      <div className="rounded-lg border bg-white p-4 mb-6">
        <h3 className="font-semibold mb-3">Equality & Diversity Training</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500 border-b">
              <th className="py-2 pr-3">Course</th><th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Provider</th><th className="py-2 pr-3">Attendees</th><th className="py-2 pr-3">Type</th><th className="py-2">Next Due</th>
            </tr></thead>
            <tbody>
              {training.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{t.title}</td>
                  <td className="py-2 pr-3">{t.date}</td>
                  <td className="py-2 pr-3">{t.provider}</td>
                  <td className="py-2 pr-3">{t.attendees.length} staff</td>
                  <td className="py-2 pr-3"><span className={cn("px-2 py-0.5 rounded text-xs font-medium", t.mandatory ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800")}>{t.mandatory ? "Mandatory" : "Optional"}</span></td>
                  <td className="py-2">{t.next_due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* filters */}
      <div id="initiatives-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search initiatives…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(EQUALITY_INITIATIVE_STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="date">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* initiative cards */}
      <div className="space-y-4 mb-8">
        {filtered.map((init) => {
          const open = expanded[init.id] ?? false;
          const done = init.actions.filter((a) => a.status === "completed").length;
          const pct = init.actions.length ? Math.round((done / init.actions.length) * 100) : 0;
          return (
            <div key={init.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(init.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{init.title}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[init.status])}>{EQUALITY_INITIATIVE_STATUS_LABEL[init.status]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Lead: {getStaffName(init.lead_by)} · Actions: {done}/{init.actions.length} ({pct}%)</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  <p className="mt-3 text-sm">{init.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {init.characteristics.map((c) => <span key={c} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">{PROTECTED_CHARACTERISTIC_LABEL[c]}</span>)}
                  </div>

                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Objectives</h4>
                    <ul className="list-disc list-inside text-sm space-y-0.5">
                      {init.objectives.map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Actions — {done}/{init.actions.length}</h4>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                      <div className={cn("h-2 rounded-full", pct === 100 ? "bg-green-500" : "bg-blue-500")} style={{ width: `${pct}%` }} />
                    </div>
                    {init.actions.map((a) => (
                      <div key={a.id} className="flex items-start gap-2 mb-2">
                        {a.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300 mt-0.5 shrink-0" />}
                        <div>
                          <p className={cn("text-sm", a.status === "completed" ? "text-gray-500" : "")}>{a.action}</p>
                          <p className="text-xs text-gray-400">{getStaffName(a.owner)} · Due {a.due_date}{a.completed_date ? ` · Done ${a.completed_date}` : ""}</p>
                          {a.impact && <p className="text-xs text-green-700 italic">{a.impact}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {init.outcomes.length > 0 && (
                    <div className="rounded-md bg-green-50 border border-green-200 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Outcomes Achieved</h4>
                      <ul className="list-disc list-inside text-sm text-green-800 space-y-0.5">
                        {init.outcomes.map((o, i) => <li key={i}>{o}</li>)}
                      </ul>
                    </div>
                  )}

                  {init.notes && <div><h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4><p className="text-sm text-gray-700">{init.notes}</p></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Equality Act 2010 &amp; Reg 11:</strong> The home must actively promote equality and diversity, protect all nine protected characteristics, and monitor outcomes for children and staff from diverse backgrounds. Regular training, diversity monitoring, and proactive initiatives demonstrate commitment to anti-discriminatory practice. All staff must complete mandatory equality training annually.
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Equality Initiative</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateInitiative} className="space-y-3 py-2">
            <div><label className="text-sm font-medium">Initiative Title *</label><input required className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. LGBTQ+ Inclusion Programme" value={eqForm.title} onChange={(e) => setEQ("title", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Description</label><textarea rows={2} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="What this initiative aims to achieve…" value={eqForm.description} onChange={(e) => setEQ("description", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Lead</label>
              <Select value={eqForm.lead_by} onValueChange={(v) => setEQ("lead_by", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{STAFF.filter((s) => s.employment_status === "active").map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
              <button type="submit" disabled={createInitiative.isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">{createInitiative.isPending ? "Creating…" : "Create Initiative"}</button>
            </DialogFooter>
          </form>
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
