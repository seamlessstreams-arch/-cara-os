"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Ear,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Hand,
  Volume2,
  Loader2,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
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
import { useSensoryProfileRecords } from "@/hooks/use-sensory-profile-records";
import type { SensoryProfileRecord, SensoryDomain, SensoryResponsePattern, SensoryProfileStatus } from "@/types/extended";
import { SENSORY_DOMAIN_LABEL, SENSORY_RESPONSE_PATTERN_LABEL, SENSORY_PROFILE_STATUS_LABEL } from "@/types/extended";

/* ── local config ─────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const DOMAIN_ICONS: Record<SensoryDomain, string> = {
  visual: "👁", auditory: "👂", tactile: "✋",
  gustatory: "👅", olfactory: "👃",
  proprioceptive: "🏋️", vestibular: "🔄",
  interoceptive: "❤️",
};

const RESPONSE_COLOURS: Record<SensoryResponsePattern, string> = {
  hyper_responsive: "bg-red-100 text-red-800",
  hypo_responsive: "bg-blue-100 text-blue-800",
  seeking: "bg-amber-100 text-amber-800",
  typical: "bg-green-100 text-green-800",
};

const STATUS_COLOURS: Record<SensoryProfileStatus, string> = {
  active: "bg-green-100 text-green-800",
  under_review: "bg-amber-100 text-amber-800",
  archived: "bg-gray-100 text-gray-700",
};

/* ── flat row for export ─────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string; domain: string; responsePattern: string;
  intensity: string; triggers: string; calming: string;
  diagnosis: string; status: string; assessedBy: string;
  assessmentDate: string; reviewDate: string;
  strategies: string; environmentalAdaptations: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person",   accessor: (r) => r.youngPerson },
  { header: "Domain",         accessor: (r) => r.domain },
  { header: "Response Pattern",accessor: (r) => r.responsePattern },
  { header: "Intensity (1-5)",accessor: (r) => r.intensity },
  { header: "Triggers",       accessor: (r) => r.triggers },
  { header: "Calming",        accessor: (r) => r.calming },
  { header: "Diagnosis",      accessor: (r) => r.diagnosis },
  { header: "Status",         accessor: (r) => r.status },
  { header: "Assessed By",    accessor: (r) => r.assessedBy },
  { header: "Assessment Date",accessor: (r) => r.assessmentDate },
  { header: "Review Date",    accessor: (r) => r.reviewDate },
  { header: "Strategies",     accessor: (r) => r.strategies },
  { header: "Env. Adaptations",accessor: (r) => r.environmentalAdaptations },
  { header: "Notes",          accessor: (r) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function SensoryProfilesPage() {
  const { data: records = [], isLoading } = useSensoryProfileRecords();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const active = records.filter((r) => r.status === "active").length;
    const underReview = records.filter((r) => r.status === "under_review").length;
    const hyperDomains = records.reduce((s, r) => s + r.entries.filter((e) => e.response_pattern === "hyper_responsive").length, 0);
    const totalStrategies = records.reduce((s, r) => s + r.strategies.length, 0);
    return { active, underReview, hyperDomains, totalStrategies };
  }, [records]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        getYPName(r.child_id).toLowerCase().includes(q) ||
        r.diagnosis.some((dx) => dx.toLowerCase().includes(q))
      );
    }
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    const out = [...list];
    switch (sortBy) {
      case "name":   out.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id))); break;
      case "review": out.sort((a, b) => a.review_date.localeCompare(b.review_date)); break;
      case "domains": out.sort((a, b) => b.entries.length - a.entries.length); break;
    }
    return out;
  }, [records, search, filterStatus, sortBy]);

  /* ── export data ──────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(() =>
    records.flatMap((r) =>
      r.entries.map((e) => ({
        youngPerson: getYPName(r.child_id),
        domain: SENSORY_DOMAIN_LABEL[e.domain],
        responsePattern: SENSORY_RESPONSE_PATTERN_LABEL[e.response_pattern],
        intensity: `${e.intensity}/5`,
        triggers: e.triggers.join("; "),
        calming: e.calming.join("; "),
        diagnosis: r.diagnosis.join(", "),
        status: SENSORY_PROFILE_STATUS_LABEL[r.status],
        assessedBy: getStaffName(r.assessed_by),
        assessmentDate: r.assessment_date,
        reviewDate: r.review_date,
        strategies: r.strategies.map((s) => `${s.context}: ${s.strategy}`).join(" | "),
        environmentalAdaptations: r.environmental_adaptations.join("; "),
        notes: e.notes,
      }))
    ), [records]);

  /* intensity bar colour */
  const intensityColour = (n: number) => n >= 4 ? "bg-red-500" : n >= 3 ? "bg-amber-500" : "bg-green-500";

  const childIds = useMemo(() => Array.from(new Set(records.map((r) => r.child_id))), [records]);

  if (isLoading) {
    return (
      <PageShell title="Sensory Profiles" subtitle="Individual sensory assessments, triggers, calming strategies and environmental adaptations">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Sensory Profiles"
      subtitle="Individual sensory assessments, triggers, calming strategies and environmental adaptations"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Sensory Profiles" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="sensory-profiles" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Profile
          </button>
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Profiles", value: stats.active, icon: Ear, colour: "text-blue-600" },
          { label: "Under Review", value: stats.underReview, icon: AlertTriangle, colour: stats.underReview > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Hyper-responsive Areas", value: stats.hyperDomains, icon: Volume2, colour: "text-red-600" },
          { label: "Total Strategies", value: stats.totalStrategies, icon: Hand, colour: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── per-child summary ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {records.map((r) => {
          const hyper = r.entries.filter((e) => e.response_pattern === "hyper_responsive").length;
          const seeking = r.entries.filter((e) => e.response_pattern === "seeking").length;
          return (
            <div key={r.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{getYPName(r.child_id)}</h3>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[r.status])}>{SENSORY_PROFILE_STATUS_LABEL[r.status]}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{r.diagnosis.join(", ")}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {r.entries.map((e) => (
                  <span key={e.domain} className={cn("px-2 py-0.5 rounded text-xs font-medium", RESPONSE_COLOURS[e.response_pattern])} title={SENSORY_RESPONSE_PATTERN_LABEL[e.response_pattern]}>
                    {DOMAIN_ICONS[e.domain]} {SENSORY_DOMAIN_LABEL[e.domain].slice(0, 5)}
                  </span>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-500">
                <div>Hyper: <span className="font-medium text-red-600">{hyper}</span></div>
                <div>Seeking: <span className="font-medium text-amber-600">{seeking}</span></div>
                <div>Strategies: <span className="font-medium text-green-600">{r.strategies.length}</span></div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Review: {r.review_date <= d(0) ? <span className="text-red-600 font-medium">Overdue</span> : r.review_date}</p>
            </div>
          );
        })}
      </div>

      {/* ── alert for overdue reviews ──────────────────────────────── */}
      {records.some((r) => r.review_date <= d(0) && r.status !== "archived") && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Sensory Profile Review Overdue</p>
            <p className="text-sm text-amber-700">One or more profiles are past their review date. Please review and update to ensure strategies remain effective.</p>
          </div>
        </div>
      )}

      {/* ── filters ────────────────────────────────────────────────── */}
      <div id="profiles-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search children or diagnoses…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.keys(SENSORY_PROFILE_STATUS_LABEL) as SensoryProfileStatus[]).map((k) => (
              <SelectItem key={k} value={k}>{SENSORY_PROFILE_STATUS_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="review">Review Due</SelectItem>
              <SelectItem value="domains">Most Domains</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expanded[r.id] ?? false;
          return (
            <div key={r.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(r.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Ear className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{getYPName(r.child_id)}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[r.status])}>{SENSORY_PROFILE_STATUS_LABEL[r.status]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{r.diagnosis.join(", ")} · {r.entries.length} domains assessed · {r.strategies.length} strategies</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* assessment info */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Assessed by:</span> <span className="font-medium">{getStaffName(r.assessed_by)}</span></div>
                    <div><span className="text-gray-500">Date:</span> <span className="font-medium">{r.assessment_date}</span></div>
                    <div><span className="text-gray-500">Review:</span> <span className={cn("font-medium", r.review_date <= d(0) ? "text-red-600" : "")}>{r.review_date}</span></div>
                    <div><span className="text-gray-500">Diagnosis:</span> <span className="font-medium">{r.diagnosis.join(", ")}</span></div>
                  </div>

                  {/* sensory domain cards */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Sensory Domains</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {r.entries.map((e) => (
                        <div key={e.domain} className="rounded-md border p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{DOMAIN_ICONS[e.domain]}</span>
                              <span className="font-medium text-sm">{SENSORY_DOMAIN_LABEL[e.domain]}</span>
                            </div>
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", RESPONSE_COLOURS[e.response_pattern])}>{SENSORY_RESPONSE_PATTERN_LABEL[e.response_pattern]}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-500">Intensity:</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div className={cn("h-2 rounded-full", intensityColour(e.intensity))} style={{ width: `${(e.intensity / 5) * 100}%` }} />
                            </div>
                            <span className="text-xs font-medium">{e.intensity}/5</span>
                          </div>
                          {e.triggers.length > 0 && (
                            <div className="mb-1">
                              <span className="text-xs font-medium text-red-700">Triggers:</span>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {e.triggers.map((t, i) => <span key={i} className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-xs">{t}</span>)}
                              </div>
                            </div>
                          )}
                          {e.calming.length > 0 && (
                            <div className="mb-1">
                              <span className="text-xs font-medium text-green-700">Calming:</span>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {e.calming.map((c, i) => <span key={i} className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-xs">{c}</span>)}
                              </div>
                            </div>
                          )}
                          {e.notes && <p className="text-xs text-gray-600 mt-1 italic">{e.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* strategies */}
                  {r.strategies.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-2">Strategies by Context</h4>
                      <div className="space-y-2">
                        {r.strategies.map((s) => (
                          <div key={s.id} className="rounded-md bg-gray-50 p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{s.context}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Effectiveness:</span>
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map((n) => (
                                    <div key={n} className={cn("h-2 w-4 rounded-sm", n <= s.effectiveness_rating ? "bg-green-500" : "bg-gray-200")} />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">{s.strategy}</p>
                            <p className="text-xs text-gray-400 mt-1">{getStaffName(s.added_by)} · {s.added_date}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* environmental adaptations */}
                  {r.environmental_adaptations.length > 0 && (
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Environmental Adaptations</h4>
                      <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                        {r.environmental_adaptations.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* communication preferences */}
                  {r.communication_preferences.length > 0 && (
                    <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                      <h4 className="text-xs font-semibold text-purple-700 mb-1">Communication Preferences</h4>
                      <ul className="list-disc list-inside text-sm text-purple-800 space-y-0.5">
                        {r.communication_preferences.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* child's view */}
                  {r.child_views && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Child&apos;s Views</h4>
                      <p className="text-sm text-pink-800">{r.child_views}</p>
                    </div>
                  )}

                  {/* parent/carer views */}
                  {r.parent_carer_views && (
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Parent / Carer Views</h4>
                      <p className="text-sm">{r.parent_carer_views}</p>
                    </div>
                  )}

                  {/* professional input */}
                  {r.professional_input && (
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Professional Input</h4>
                      <p className="text-sm">{r.professional_input}</p>
                    </div>
                  )}

                  {/* notes */}
                  {r.notes && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4>
                      <p className="text-sm text-gray-700">{r.notes}</p>
                    </div>
                  )}

                  <SmartLinkPanel sourceType="sensory-profile" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>SEND &amp; Sensory Needs:</strong> Children with sensory processing differences must have individualised profiles that inform daily care. Strategies should be developed collaboratively with the child, regularly reviewed, and shared with all staff. Environmental adaptations must be implemented promptly. Sensory needs should never be treated as behavioural challenges.
      </div>

      {/* ── dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Sensory Profile</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Young Person</label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{childIds.map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Diagnosis / Conditions</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. ASD, ADHD, SPD" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Assessment Date</label>
                <input type="date" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Review Date</label>
                <input type="date" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Initial Notes</label>
              <textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Key observations and initial sensory presentation…" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={() => setDialogOpen(false)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Create Profile</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
