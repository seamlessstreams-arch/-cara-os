"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import {
  Microscope, Sparkles, CheckCircle2, Star, Clock, Plus,
  ThumbsUp, AlertTriangle, ChevronRight, Search, Users, Eye, ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { usePracticeObservations } from "@/hooks/use-workforce";
import { useStaff } from "@/hooks/use-staff";
import { getStaffName as seedGetStaffName } from "@/lib/seed-data";
import { COMPETENCY_DOMAIN_LABELS, type ObservationOutcome, type PracticeObservation } from "@/types/extended";

const OUTCOME_CONFIG: Record<ObservationOutcome, { label: string; colour: string; icon: React.ElementType }> = {
  outstanding:      { label: "Outstanding",      colour: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: Star },
  meets_standard:   { label: "Meets Standard",   colour: "text-blue-700 bg-blue-50 border-blue-200",          icon: CheckCircle2 },
  developing:       { label: "Developing",       colour: "text-amber-700 bg-amber-50 border-amber-200",       icon: Clock },
  requires_support: { label: "Requires Support", colour: "text-red-700 bg-red-50 border-red-200",             icon: AlertTriangle },
};

const OBS_EXPORT_COLS: ExportColumn<PracticeObservation>[] = [
  { header: "Date", accessor: (o) => o.observation_date },
  { header: "Staff", accessor: (o) => seedGetStaffName(o.staff_id) },
  { header: "Observer", accessor: (o) => seedGetStaffName(o.observer_id) },
  { header: "Outcome", accessor: (o) => o.outcome.replace(/_/g, " ") },
  { header: "Domains", accessor: (o) => o.domains_observed.map((d) => COMPETENCY_DOMAIN_LABELS[d] ?? d).join(", ") },
  { header: "Strengths", accessor: (o) => o.strengths_noted.join("; ") },
  { header: "Development Areas", accessor: (o) => o.areas_for_development.join("; ") },
  { header: "Signed Off", accessor: (o) => o.signed_off_by_staff ? "Yes" : "No" },
  { header: "Context", accessor: (o) => o.context ?? "" },
];

type OutcomeFilter = "all" | ObservationOutcome;

export default function PracticeObservationsPage() {
  const [showAria, setShowAria] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "staff" | "outcome" | "domain">("date");

  const obsQuery   = usePracticeObservations();
  const staffQuery = useStaff();

  const allObs = obsQuery.data?.data ?? [];
  const staff  = staffQuery.data?.data ?? [];

  const getStaffName = (id: string) => staff.find((s) => s.id === id)?.full_name ?? id;

  const staffObserved = [...new Set(allObs.map((o) => o.staff_id))];

  // Outcome counts
  const outcomeCounts = useMemo(() => {
    const counts: Partial<Record<ObservationOutcome, number>> = {};
    allObs.forEach((o) => { counts[o.outcome] = (counts[o.outcome] ?? 0) + 1; });
    return counts;
  }, [allObs]);

  const outstanding = outcomeCounts.outstanding ?? 0;
  const meetsStandard = outcomeCounts.meets_standard ?? 0;
  const developing = outcomeCounts.developing ?? 0;
  const needsSupport = outcomeCounts.requires_support ?? 0;

  // Filtered observations
  const filtered = useMemo(() => {
    let result = allObs;

    if (selectedStaff !== "all") {
      result = result.filter((o) => o.staff_id === selectedStaff);
    }

    if (outcomeFilter !== "all") {
      result = result.filter((o) => o.outcome === outcomeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((o) => {
        const staffName = getStaffName(o.staff_id).toLowerCase();
        const observerName = getStaffName(o.observer_id).toLowerCase();
        const narrative = o.narrative?.toLowerCase() ?? "";
        const context = o.context?.toLowerCase() ?? "";
        return staffName.includes(q) || observerName.includes(q) || narrative.includes(q) || context.includes(q);
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "staff":
          return getStaffName(a.staff_id).localeCompare(getStaffName(b.staff_id));
        case "outcome": {
          const oo: Record<string, number> = { outstanding: 0, meets_standard: 1, developing: 2, requires_support: 3 };
          return (oo[a.outcome] ?? 9) - (oo[b.outcome] ?? 9);
        }
        case "domain":
          return (a.domains_observed[0] ?? "").localeCompare(b.domains_observed[0] ?? "");
        case "date":
        default:
          return new Date(b.observation_date).getTime() - new Date(a.observation_date).getTime();
      }
    });

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allObs, staff, selectedStaff, outcomeFilter, search, sortBy]);

  // Staff observation stats
  const staffStats = useMemo(() =>
    staffObserved.map((id) => {
      const obs = allObs.filter((o) => o.staff_id === id);
      const awaitingSignOff = obs.filter((o) => !o.signed_off_by_staff).length;
      return { id, count: obs.length, awaitingSignOff };
    }).sort((a, b) => b.count - a.count),
  [allObs, staffObserved]);

  return (
    <PageShell
      title="Practice Observations"
      subtitle="Direct observation of staff practice — quality assurance and development evidence"
      ariaContext={{ pageTitle: "Practice Observations", sourceType: "staff" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={OBS_EXPORT_COLS} filename="practice-observations" />
          <PrintButton title="Practice Observations" subtitle="Oak House — Staff Practice Evidence" targetId="observations-content" />
          <SmartUploadButton variant="inline" label="Upload" uploadContext="Practice Observations — observation notes or evidence upload" />
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setShowAria((p) => !p)}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            ARIA Summary
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Observation
          </Button>
          <AriaStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="observations-content" className="space-y-0">
      {showAria && (
        <div className="relative">
          <button onClick={() => setShowAria(false)} className="absolute top-3 right-3 z-10 text-slate-400 hover:text-slate-600 text-xs">✕ Close</button>
          <AriaPanel
            mode="staff_development_summary"
            pageContext={`Practice observations: ${allObs.length} total. Outstanding: ${outstanding}. Requires support: ${needsSupport}. Staff observed: ${staffObserved.map(getStaffName).join(", ")}.`}
          />
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <Eye className="h-4 w-4 text-indigo-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-slate-800 tabular-nums">{allObs.length}</div>
          <div className="text-[10px] text-slate-500">Total</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
          <Star className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-emerald-700 tabular-nums">{outstanding}</div>
          <div className="text-[10px] text-slate-500">Outstanding</div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
          <CheckCircle2 className="h-4 w-4 text-blue-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-blue-700 tabular-nums">{meetsStandard}</div>
          <div className="text-[10px] text-slate-500">Meets Standard</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
          <Clock className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-amber-700 tabular-nums">{developing}</div>
          <div className="text-[10px] text-slate-500">Developing</div>
        </div>
        <div className={cn("rounded-xl border p-3 text-center", needsSupport > 0 ? "border-red-200 bg-red-50" : "border-slate-200 bg-white")}>
          <AlertTriangle className={cn("h-4 w-4 mx-auto mb-1", needsSupport > 0 ? "text-red-500" : "text-slate-300")} />
          <div className={cn("text-lg font-bold tabular-nums", needsSupport > 0 ? "text-red-700" : "text-slate-400")}>{needsSupport}</div>
          <div className="text-[10px] text-slate-500">Needs Support</div>
        </div>
      </div>

      {/* Staff observation coverage */}
      {staff.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-medium text-slate-500 shrink-0">Staff Observed</span>
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                staffObserved.length >= staff.length ? "bg-emerald-500"
                : staffObserved.length >= staff.length * 0.5 ? "bg-amber-400"
                : "bg-red-400",
              )}
              style={{ width: `${staff.length > 0 ? (staffObserved.length / staff.length) * 100 : 0}%` }}
            />
          </div>
          <span className={cn(
            "text-[10px] font-bold tabular-nums",
            staffObserved.length >= staff.length ? "text-emerald-600" : "text-amber-600",
          )}>
            {staffObserved.length}/{staff.length}
          </span>
        </div>
      )}

      {/* Search + Outcome filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by staff, observer or context..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
          <ArrowUpDown className="h-3.5 w-3.5" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-white border rounded-md px-2 py-1.5 text-xs">
            <option value="date">Newest first</option>
            <option value="staff">Staff A–Z</option>
            <option value="outcome">Outcome (best → weakest)</option>
            <option value="domain">Domain A–Z</option>
          </select>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {([
            { key: "all" as OutcomeFilter, label: "All", count: allObs.length },
            { key: "outstanding" as OutcomeFilter, label: "Outstanding", count: outstanding },
            { key: "meets_standard" as OutcomeFilter, label: "Meets Std", count: meetsStandard },
            { key: "developing" as OutcomeFilter, label: "Developing", count: developing },
            { key: "requires_support" as OutcomeFilter, label: "Needs Support", count: needsSupport },
          ]).filter((t) => t.key === "all" || t.count > 0).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setOutcomeFilter(tab.key)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                outcomeFilter === tab.key
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300",
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Staff filter */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setSelectedStaff("all")}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium border transition-all",
            selectedStaff === "all"
              ? "bg-slate-800 text-white border-slate-800"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-400",
          )}
        >
          All Staff ({allObs.length})
        </button>
        {staffStats.map(({ id, count, awaitingSignOff }) => (
          <button
            key={id}
            onClick={() => setSelectedStaff(id)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-all",
              selectedStaff === id
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400",
            )}
          >
            {getStaffName(id).split(" ")[0]} ({count})
            {awaitingSignOff > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-amber-400 text-[8px] text-white font-bold">
                !
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Observation cards */}
      {filtered.length === 0 && allObs.length > 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Search className="h-6 w-6 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No observations match your filters</p>
          <p className="text-xs mt-1">Try adjusting the search, outcome or staff filter</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Microscope className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No observations recorded yet</p>
          <p className="text-xs mt-1">Direct practice observations are required by Reg 34</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((obs) => {
            const outcomeCfg = OUTCOME_CONFIG[obs.outcome];
            const OutcomeIcon = outcomeCfg.icon;

            return (
              <div key={obs.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold text-slate-800">{getStaffName(obs.staff_id)}</p>
                      <Badge variant="outline" className={cn("text-[10px] border", outcomeCfg.colour)}>
                        <OutcomeIcon className="h-2.5 w-2.5 mr-1" />
                        {outcomeCfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {obs.observation_date} · {obs.context} · Observer: {getStaffName(obs.observer_id)}
                    </p>
                  </div>
                  <Link href={`/workforce/staff/${obs.staff_id}`}>
                    <ChevronRight className="h-4 w-4 text-slate-300 hover:text-slate-500 transition-colors" />
                  </Link>
                </div>

                <div className="p-4 space-y-3">
                  {/* Narrative */}
                  <p className="text-xs text-slate-700 leading-relaxed">{obs.narrative}</p>

                  {/* Domains observed */}
                  <div className="flex flex-wrap gap-1.5">
                    {obs.domains_observed.map((d) => (
                      <Badge key={d} variant="outline" className="text-[10px] border-indigo-200 text-indigo-700 bg-indigo-50">
                        {COMPETENCY_DOMAIN_LABELS[d].split(" ").slice(0, 2).join(" ")}
                      </Badge>
                    ))}
                  </div>

                  {/* Strengths & development */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {obs.strengths_noted.length > 0 && (
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2.5">
                        <p className="text-[10px] font-semibold text-emerald-700 mb-1.5 flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" /> Strengths Noted
                        </p>
                        <ul className="space-y-1">
                          {obs.strengths_noted.map((s) => (
                            <li key={s} className="text-xs text-emerald-800">· {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {obs.areas_for_development.length > 0 && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2.5">
                        <p className="text-[10px] font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Development Areas
                        </p>
                        <ul className="space-y-1">
                          {obs.areas_for_development.map((a) => (
                            <li key={a} className="text-xs text-amber-800">· {a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* ARIA summary */}
                  {obs.aria_summary && (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5">
                      <p className="text-[10px] font-semibold text-indigo-600 mb-1">ARIA Observation Intelligence</p>
                      <p className="text-xs text-indigo-800 leading-relaxed">{obs.aria_summary}</p>
                    </div>
                  )}

                  {/* Sign-off */}
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
                    {obs.signed_off_by_staff ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Signed off by staff {obs.signed_off_at ? `· ${obs.signed_off_at.slice(0, 10)}` : ""}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600">Awaiting staff sign-off</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Regulatory Basis — </span>
        Children&apos;s Homes Regulations 2015: Reg 34 (staff must receive regular supervision, including direct
        observation of practice). ILACS — Quality of Care: inspectors look for evidence that managers observe and
        assess staff practice directly.
      </div>
      </div>{/* close #observations-content */}
    </PageShell>
  );
}
