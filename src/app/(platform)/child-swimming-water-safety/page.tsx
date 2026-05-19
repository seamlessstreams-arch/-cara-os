"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useSwimRecords } from "@/hooks/use-swim-records";
import type { SwimRecord, SwimmingLevel } from "@/types/extended";
import { SWIMMING_LEVEL_LABEL } from "@/types/extended";
import {
  Waves,
  LifeBuoy,
  Award,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const exportCols: ExportColumn<SwimRecord>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Recorded", accessor: (r) => r.recorded_date },
  { header: "Level", accessor: (r) => SWIMMING_LEVEL_LABEL[r.swimming_level] },
  { header: "Can swim 25m", accessor: (r) => r.can_swim_25m ? "Yes" : "No" },
  { header: "Treads water", accessor: (r) => r.can_tread_water ? "Yes" : "No" },
  { header: "Floats on back", accessor: (r) => r.can_float_back ? "Yes" : "No" },
  { header: "Comfortable underwater", accessor: (r) => r.comfortable_underwater ? "Yes" : "No" },
  { header: "Lessons active", accessor: (r) => r.lessons_booked_active ? "Yes" : "No" },
  { header: "Provider", accessor: (r) => r.lesson_provider ?? "—" },
  { header: "Frequency", accessor: (r) => r.lesson_frequency ?? "—" },
  { header: "Cost", accessor: (r) => r.lessons_cost != null ? `£${r.lessons_cost}` : "—" },
  { header: "Funding", accessor: (r) => r.home_funding_source ?? "—" },
  { header: "School swimming", accessor: (r) => r.school_swimming_done ? "Yes" : "No" },
  { header: "School outcome", accessor: (r) => r.school_swimming_outcome ?? "—" },
  { header: "Beach safety", accessor: (r) => r.beach_safety_aware.join("; ") },
  { header: "Open water", accessor: (r) => r.open_water_awareness.join("; ") },
  { header: "Life jacket", accessor: (r) => r.life_jacket_usage.join("; ") },
  { header: "Triggers", accessor: (r) => r.triggers_to_water_shy.join("; ") },
  { header: "Child Voice", accessor: (r) => r.child_voice },
  { header: "Staff Observation", accessor: (r) => r.staff_observation },
  { header: "Next Step", accessor: (r) => r.next_step },
  { header: "Review", accessor: (r) => r.review_date },
  { header: "Key Worker", accessor: (r) => getStaffName(r.key_worker) },
];

const levelColour: Record<SwimmingLevel, string> = {
  pre_stage_1: "bg-rose-100 text-rose-800 border-rose-200",
  stage_1: "bg-amber-100 text-amber-800 border-amber-200",
  stage_2: "bg-amber-100 text-amber-800 border-amber-200",
  stage_3: "bg-yellow-100 text-yellow-800 border-yellow-200",
  stage_4: "bg-sky-100 text-sky-800 border-sky-200",
  stage_5: "bg-cyan-100 text-cyan-800 border-cyan-200",
  stage_6: "bg-blue-100 text-blue-800 border-blue-200",
  stage_7: "bg-indigo-100 text-indigo-800 border-indigo-200",
  beyond_stages: "bg-emerald-100 text-emerald-800 border-emerald-200",
  not_currently_swimming: "bg-slate-100 text-[var(--cs-navy)] border-[var(--cs-border)]",
};

const dFromNow = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

export default function ChildSwimmingWaterSafetyPage() {
  const { data: res, isLoading } = useSwimRecords();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "level">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.child_id).toLowerCase().includes(search.toLowerCase()) ||
        SWIMMING_LEVEL_LABEL[rec.swimming_level].toLowerCase().includes(search.toLowerCase()) ||
        (rec.lesson_provider ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesLevel = levelFilter === "all" || rec.swimming_level === levelFilter;
      return matchesSearch && matchesLevel;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      if (sortBy === "level") return a.swimming_level.localeCompare(b.swimming_level);
      return b.recorded_date.localeCompare(a.recorded_date);
    });
    return r;
  }, [records, search, levelFilter, sortBy]);

  const stats = useMemo(() => {
    const activeLearners = records.filter((r) => r.swimming_level !== "not_currently_swimming").length;
    const canSwim25m = records.filter((r) => r.can_swim_25m).length;
    const lessonsRunning = records.filter((r) => r.lessons_booked_active).length;
    const reviewsDue90 = records.filter((r) => {
      const today = new Date().toISOString().slice(0, 10);
      const ninety = dFromNow(90);
      return r.review_date >= today && r.review_date <= ninety;
    }).length;
    return { activeLearners, canSwim25m, lessonsRunning, reviewsDue90 };
  }, [records]);

  if (isLoading) {
    return (
      <PageShell title="Swimming & Water Safety" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Swimming & Water Safety"
      subtitle="Per-child swimming competence and water safety — RLSS National Curriculum stages, school swimming, current lessons, open water awareness, beach safety, life jacket use. Critical life skill especially for care leavers — anti-drowning evidence base."
      ariaContext={{ pageTitle: "Swimming & Water Safety", sourceType: "child_record" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-swimming-water-safety" />
          <PrintButton title="Swimming & Water Safety" />
          <AriaStudioQuickActionButton context={{ record_type: "risk_assessment", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-center gap-2 text-sky-700 text-sm mb-1">
            <Waves className="h-4 w-4" />
            <span>Active learners</span>
          </div>
          <div className="text-2xl font-semibold text-sky-900">{stats.activeLearners}</div>
        </div>
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4">
          <div className="flex items-center gap-2 text-cyan-700 text-sm mb-1">
            <Award className="h-4 w-4" />
            <span>Can swim 25m</span>
          </div>
          <div className="text-2xl font-semibold text-cyan-900">{stats.canSwim25m}</div>
        </div>
        <div className="rounded-lg border border-sky-200 bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <LifeBuoy className="h-4 w-4" />
            <span>Lessons running</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.lessonsRunning}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Calendar className="h-4 w-4" />
            <span>Reviews due (90d)</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.reviewsDue90}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cs-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search young person, level, provider..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--cs-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Swimming level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {Object.entries(SWIMMING_LEVEL_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Most recent</SelectItem>
            <SelectItem value="name">Young person A→Z</SelectItem>
            <SelectItem value="level">Swimming level</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isOpen = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-lg border border-sky-200 bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                className="w-full p-4 flex items-start justify-between gap-3 hover:bg-sky-50/50 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-[var(--cs-navy)]">{getYPName(r.child_id)}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", levelColour[r.swimming_level])}>{SWIMMING_LEVEL_LABEL[r.swimming_level]}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", r.can_swim_25m ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]")}>
                      {r.can_swim_25m ? "Can swim 25m" : "Not yet 25m"}
                    </span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", r.lessons_booked_active ? "bg-cyan-100 text-cyan-800 border-cyan-200" : "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]")}>
                      {r.lessons_booked_active ? "Lessons active" : "No active lessons"}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--cs-text-secondary)]">
                    Recorded {r.recorded_date} · Review {r.review_date} · {getStaffName(r.key_worker)}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-[var(--cs-text-muted)]" /> : <ChevronDown className="h-5 w-5 text-[var(--cs-text-muted)]" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-sky-100 bg-sky-50/30">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Child Voice</div>
                      <p className="text-sm text-[var(--cs-text-secondary)] italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-[var(--cs-text-secondary)]">{r.staff_observation}</p>
                    </div>
                    <div className="rounded-md border border-cyan-200 bg-white p-3">
                      <div className="text-xs font-semibold text-cyan-700 uppercase mb-2">Lessons</div>
                      <div className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                        <div><span className="text-[var(--cs-text-muted)]">Active:</span> {r.lessons_booked_active ? "Yes" : "No"}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Provider:</span> {r.lesson_provider ?? "—"}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Frequency:</span> {r.lesson_frequency ?? "—"}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Cost:</span> {r.lessons_cost != null ? `£${r.lessons_cost}/session` : "—"}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Funding:</span> {r.home_funding_source ?? "—"}</div>
                      </div>
                    </div>
                    <div className="rounded-md border border-sky-200 bg-white p-3">
                      <div className="text-xs font-semibold text-sky-700 uppercase mb-2">School Swimming</div>
                      <div className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                        <div><span className="text-[var(--cs-text-muted)]">Done:</span> {r.school_swimming_done ? "Yes" : "No"}</div>
                        <div className="text-[var(--cs-text-secondary)]">{r.school_swimming_outcome ?? "—"}</div>
                      </div>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Competence (KS2 standard: 25m + tread water + safe self-rescue)</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                        <div className={cn("rounded-md border px-2 py-1.5", r.can_swim_25m ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-50 border-[var(--cs-border)] text-[var(--cs-text-secondary)]")}>
                          {r.can_swim_25m ? "✓" : "○"} 25m unaided
                        </div>
                        <div className={cn("rounded-md border px-2 py-1.5", r.can_tread_water ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-50 border-[var(--cs-border)] text-[var(--cs-text-secondary)]")}>
                          {r.can_tread_water ? "✓" : "○"} Tread water
                        </div>
                        <div className={cn("rounded-md border px-2 py-1.5", r.can_float_back ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-50 border-[var(--cs-border)] text-[var(--cs-text-secondary)]")}>
                          {r.can_float_back ? "✓" : "○"} Float on back
                        </div>
                        <div className={cn("rounded-md border px-2 py-1.5", r.comfortable_underwater ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-50 border-[var(--cs-border)] text-[var(--cs-text-secondary)]")}>
                          {r.comfortable_underwater ? "✓" : "○"} Underwater
                        </div>
                      </div>
                    </div>
                    {r.beach_safety_aware.length ? (
                      <div className="rounded-md border border-sky-200 bg-white p-3">
                        <div className="text-xs font-semibold text-sky-700 uppercase mb-2">Beach safety</div>
                        <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                          {r.beach_safety_aware.map((b, i) => (
                            <li key={i} className="flex gap-2"><span className="text-sky-500">•</span><span>{b}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.open_water_awareness.length ? (
                      <div className="rounded-md border border-cyan-200 bg-white p-3">
                        <div className="text-xs font-semibold text-cyan-700 uppercase mb-2">Open water awareness</div>
                        <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                          {r.open_water_awareness.map((o, i) => (
                            <li key={i} className="flex gap-2"><span className="text-cyan-500">•</span><span>{o}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.life_jacket_usage.length ? (
                      <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Life jacket / buoyancy aid</div>
                        <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                          {r.life_jacket_usage.map((l, i) => (
                            <li key={i} className="flex gap-2">
                              <LifeBuoy className="h-3.5 w-3.5 text-[var(--cs-text-muted)] mt-0.5 shrink-0" />
                              <span>{l}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.triggers_to_water_shy.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 uppercase mb-2">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Triggers / water-shy factors
                        </div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.triggers_to_water_shy.map((t, i) => (
                            <li key={i} className="flex gap-2"><span>!</span><span>{t}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-sky-200 bg-sky-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-sky-800 uppercase mb-2">Next step</div>
                      <p className="text-sm text-sky-900">{r.next_step}</p>
                    </div>
                    <div className="lg:col-span-2">
                      <SmartLinkPanel sourceType="swim-records" sourceId={r.id} childId={r.child_id} compact />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Swimming and water safety is a critical life skill — especially for care leavers who lose universal access on
          leaving care. Practice is grounded in the National Curriculum PE programme of study (KS2 swimming standard:
          25m unaided, tread water, perform safe self-rescue), Royal Life Saving Society UK National Curriculum stages
          1&ndash;7, and the RLSS UK National Drowning Prevention Strategy. Children&rsquo;s Homes Regulations Quality
          Standard 6 (Enjoyment & Achievement) and Quality Standard 8 (Health & Wellbeing) frame the duty. UNCRC Article
          31 (right to play, leisure, recreation) and RoSPA water safety guidance inform open water, beach, holiday and
          life jacket practice.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Activities"
        category="activity"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Swimming & Water Safety — pool sessions, lessons, open water, water safety, ability level, risk assessment, supervision ratio, consent, life skills, positive activities"
        recordType="risk_assessment"
        className="mt-6"
      />
    </PageShell>
  );
}
