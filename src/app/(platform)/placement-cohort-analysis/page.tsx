"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Users,
  ArrowUpDown,
  Search,
  TrendingUp,
  Heart,
  AlertTriangle,
  CalendarRange,
  UserPlus,
  Activity,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { CohortAnalysis, CohortPairDynamic } from "@/types/extended";
import { COHORT_PAIR_DYNAMIC_LABEL } from "@/types/extended";
import { useCohortAnalyses } from "@/hooks/use-cohort-analyses";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────── */

const DYNAMIC_COLOURS: Record<CohortPairDynamic, string> = {
  strong_friendship: "bg-green-100 text-green-800",
  neutral:           "bg-gray-100 text-gray-700",
  some_friction:     "bg-amber-100 text-amber-800",
  active_conflict:   "bg-red-100 text-red-800",
};

/* ── flat row for export ─────────────────────────────────────────────── */

const EXPORT_COLS: ExportColumn<CohortAnalysis>[] = [
  { header: "Period",                accessor: (r: CohortAnalysis) => r.period },
  { header: "Analysis Date",         accessor: (r: CohortAnalysis) => r.analysis_date },
  { header: "Authored By",           accessor: (r: CohortAnalysis) => getStaffName(r.authored_by) },
  { header: "Cohort Members",        accessor: (r: CohortAnalysis) => r.cohort_members.map(getYPName).join(", ") },
  { header: "Demographic Profile",   accessor: (r: CohortAnalysis) => r.demographic_profile },
  { header: "Strengths",             accessor: (r: CohortAnalysis) => r.strengths_of_cohort.join("; ") },
  { header: "Tensions/Dynamics",     accessor: (r: CohortAnalysis) => r.tensions_or_dynamics.join("; ") },
  { header: "Peer Map",              accessor: (r: CohortAnalysis) => r.peer_relationship_map.map((p) => `${p.pair}: ${COHORT_PAIR_DYNAMIC_LABEL[p.dynamic]}`).join("; ") },
  { header: "Group Activities",      accessor: (r: CohortAnalysis) => r.group_activities.join("; ") },
  { header: "Conflict Resolutions",  accessor: (r: CohortAnalysis) => String(r.conflict_resolution_instances) },
  { header: "Positive Dynamics",     accessor: (r: CohortAnalysis) => String(r.positive_dynamics_instances) },
  { header: "Staffing Challenges",   accessor: (r: CohortAnalysis) => r.staffing_challenges_arising },
  { header: "Admission Considerations", accessor: (r: CohortAnalysis) => r.proposed_admission_considerations },
  { header: "Recommended Actions",   accessor: (r: CohortAnalysis) => r.recommended_actions.join("; ") },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function PlacementCohortAnalysisPage() {
  const { data: res, isLoading } = useCohortAnalyses();
  const records = res?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const toggle = (id: string) => setExpandedId((p) => (p === id ? null : id));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const latest = [...records].sort((a, b) => b.analysis_date.localeCompare(a.analysis_date))[0];
    const cohortSize = latest?.cohort_members.length ?? 0;
    const quartersAnalysed = records.length;

    const sortedAsc = [...records].sort((a, b) => a.analysis_date.localeCompare(b.analysis_date));
    let trend: "up" | "down" | "flat" = "flat";
    if (sortedAsc.length >= 2) {
      const first = sortedAsc[0].positive_dynamics_instances;
      const last = sortedAsc[sortedAsc.length - 1].positive_dynamics_instances;
      if (last > first) trend = "up";
      else if (last < first) trend = "down";
    }
    const totalTensions = records.reduce((s, a) => s + a.tensions_or_dynamics.length, 0);
    return { cohortSize, quartersAnalysed, trend, totalTensions };
  }, [records]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = records;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        a.period.toLowerCase().includes(q) ||
        a.cohort_members.some((m) => getYPName(m).toLowerCase().includes(q)) ||
        a.demographic_profile.toLowerCase().includes(q)
      );
    }
    if (filterPeriod !== "all") list = list.filter((a) => a.period === filterPeriod);
    const out = [...list];
    switch (sortBy) {
      case "recent":   out.sort((a, b) => b.analysis_date.localeCompare(a.analysis_date)); break;
      case "oldest":   out.sort((a, b) => a.analysis_date.localeCompare(b.analysis_date)); break;
      case "positive": out.sort((a, b) => b.positive_dynamics_instances - a.positive_dynamics_instances); break;
      case "tensions": out.sort((a, b) => b.conflict_resolution_instances - a.conflict_resolution_instances); break;
    }
    return out;
  }, [records, search, filterPeriod, sortBy]);

  const periodOptions = useMemo(
    () => Array.from(new Set(records.map((a) => a.period))),
    [records]
  );

  const trendLabel = stats.trend === "up" ? "Improving" : stats.trend === "down" ? "Declining" : "Stable";
  const trendColour = stats.trend === "up" ? "text-green-600" : stats.trend === "down" ? "text-red-600" : "text-gray-500";

  return (
    <PageShell
      title="Placement Cohort Analysis"
      subtitle="Quarterly analysis of group dynamics, peer relationships and the developmental impact of group living"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Placement Cohort Analysis" />
          <ExportButton data={records} columns={EXPORT_COLS} filename="placement-cohort-analysis" />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <>
      {/* ── banner ─────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 mb-6 text-sm text-purple-900">
        <div className="flex items-start gap-2">
          <Users className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold mb-0.5">Group living is its own developmental experience.</p>
            <p>
              Children in our care don't just receive support as individuals — they shape and are shaped by the cohort they live with.
              How peers interact, what dynamics emerge, what supports cohesion and what destabilises it are themselves a form of care.
              This analysis is reviewed quarterly and informs every admission decision.
            </p>
          </div>
        </div>
      </div>

      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Children in Cohort",     value: stats.cohortSize,        icon: Users,        colour: "text-blue-600" },
          { label: "Quarters Analysed",      value: stats.quartersAnalysed,  icon: CalendarRange, colour: "text-gray-600" },
          { label: `Positive Dynamics: ${trendLabel}`, value: trendLabel,    icon: TrendingUp,   colour: trendColour },
          { label: "Tensions Tracked",       value: stats.totalTensions,     icon: AlertTriangle, colour: stats.totalTensions > 0 ? "text-amber-600" : "text-gray-400" },
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

      {/* ── filters ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search period, child or profile…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Periods</SelectItem>
            {periodOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="positive">Most Positive</SelectItem>
              <SelectItem value="tensions">Most Conflict</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── analyses list ──────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((a) => {
          const open = expandedId === a.id;
          return (
            <div key={a.id} className="rounded-lg border bg-white">
              <button
                onClick={() => toggle(a.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{a.period}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {a.cohort_members.length} children
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Heart className="inline h-3 w-3 mr-0.5" />
                      {a.positive_dynamics_instances} positive
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      a.conflict_resolution_instances > 5 ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"
                    )}>
                      {a.conflict_resolution_instances} resolutions
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {a.analysis_date} — Authored by {getStaffName(a.authored_by)} · Cohort: {a.cohort_members.map(getYPName).join(", ")}
                  </p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* demographic profile */}
                  <div className="mt-3 rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-700 mb-1">Demographic Profile</h4>
                    <p className="text-sm text-gray-800">{a.demographic_profile}</p>
                  </div>

                  {/* strengths / tensions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-green-50 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Strengths of Cohort</h4>
                      <ul className="list-disc list-inside text-sm text-green-800 space-y-0.5">
                        {a.strengths_of_cohort.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-amber-50 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1">Tensions &amp; Dynamics</h4>
                      <ul className="list-disc list-inside text-sm text-amber-800 space-y-0.5">
                        {a.tensions_or_dynamics.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* peer map */}
                  <div className="rounded-md border p-3">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Peer Relationship Map</h4>
                    <div className="space-y-2">
                      {a.peer_relationship_map.map((p, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="min-w-[140px]">
                            <span className="text-sm font-medium">{p.pair}</span>
                          </div>
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium shrink-0", DYNAMIC_COLOURS[p.dynamic])}>
                            {COHORT_PAIR_DYNAMIC_LABEL[p.dynamic]}
                          </span>
                          <p className="text-sm text-gray-700 flex-1">{p.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* impacts: individual on group / group on individual */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-blue-50 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-2">Individual → Group Impact</h4>
                      <div className="space-y-2">
                        {a.cohort_members.map((m) => (
                          <div key={m}>
                            <p className="text-xs font-semibold text-blue-900">{getYPName(m)}</p>
                            <p className="text-sm text-blue-800">{a.individual_impacts_on_group[m] ?? "—"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-md bg-indigo-50 p-3">
                      <h4 className="text-xs font-semibold text-indigo-700 mb-2">Group → Individual Impact</h4>
                      <div className="space-y-2">
                        {a.cohort_members.map((m) => (
                          <div key={m}>
                            <p className="text-xs font-semibold text-indigo-900">{getYPName(m)}</p>
                            <p className="text-sm text-indigo-800">{a.group_impacts_on_individual[m] ?? "—"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* group activities */}
                  <div className="rounded-md bg-emerald-50 p-3">
                    <h4 className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                      <Activity className="h-3 w-3" /> Group Activities
                    </h4>
                    <ul className="list-disc list-inside text-sm text-emerald-800 space-y-0.5">
                      {a.group_activities.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  </div>

                  {/* individualised support in group context */}
                  <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                    <h4 className="text-xs font-semibold text-pink-700 mb-2">Individualised Support in Group Context</h4>
                    <div className="space-y-2">
                      {a.cohort_members.map((m) => (
                        <div key={m}>
                          <p className="text-xs font-semibold text-pink-900">{getYPName(m)}</p>
                          <p className="text-sm text-pink-800">{a.individualised_support_in_group_context[m] ?? "—"}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* counts */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md border p-3 flex items-center gap-3">
                      <Heart className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-lg font-bold">{a.positive_dynamics_instances}</p>
                        <p className="text-xs text-gray-500">Positive Dynamics Recorded</p>
                      </div>
                    </div>
                    <div className="rounded-md border p-3 flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-lg font-bold">{a.conflict_resolution_instances}</p>
                        <p className="text-xs text-gray-500">Conflict Resolutions</p>
                      </div>
                    </div>
                  </div>

                  {/* staffing challenges */}
                  <div className="rounded-md bg-orange-50 border border-orange-200 p-3">
                    <h4 className="text-xs font-semibold text-orange-700 mb-1">Staffing Challenges Arising</h4>
                    <p className="text-sm text-orange-800">{a.staffing_challenges_arising}</p>
                  </div>

                  {/* admission considerations */}
                  <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
                    <h4 className="text-xs font-semibold text-yellow-700 mb-1 flex items-center gap-1">
                      <UserPlus className="h-3 w-3" /> Proposed Admission Considerations
                    </h4>
                    <p className="text-sm text-yellow-900">{a.proposed_admission_considerations}</p>
                  </div>

                  {/* recommended actions */}
                  <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                    <h4 className="text-xs font-semibold text-blue-700 mb-1">Recommended Actions</h4>
                    <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                      {a.recommended_actions.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Regulation 14 &amp; Quality Standard 6:</strong> Reg 14 requires the registered person to assess, before any admission,
        the impact of that admission on existing children and the suitability of the home for the child's needs alongside the existing cohort.
        Quality Standard 6 (positive relationships) requires that children are helped to develop, and benefit from, relationships with peers
        and adults that support their welfare and development. Quarterly cohort analysis evidences how the home actively manages group living
        as a developmental experience and provides the structured basis for every admission impact assessment.
      </div>
      </>
      )}
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
