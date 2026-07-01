"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Bus,
  Train,
  MapPin,
  Phone,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Shield,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIndependentTravelRecords } from "@/hooks/use-independent-travel-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { IndependentTravelRecord, TravelTrainingStage, TravelConfidence } from "@/types/extended";
import { TRAVEL_TRAINING_STAGE_LABEL, TRAVEL_CONFIDENCE_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── helpers ─────────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const stageOrder: Record<TravelTrainingStage, number> = {
  stage_1_accompanied: 1,
  stage_2_staff_shadowing: 2,
  stage_3_solo_familiar: 3,
  stage_4_solo_new: 4,
  independent_traveller: 5,
};

const stageChip = (s: TravelTrainingStage) => {
  switch (s) {
    case "stage_1_accompanied":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "stage_2_staff_shadowing":
      return "bg-amber-100 text-amber-900 border-amber-300";
    case "stage_3_solo_familiar":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "stage_4_solo_new":
      return "bg-sky-100 text-sky-800 border-sky-300";
    case "independent_traveller":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
  }
};

const confidenceChip = (c: TravelConfidence) => {
  switch (c) {
    case "anxious":
      return "bg-[--cs-risk-bg] text-[--cs-risk] border-[--cs-risk-soft]";
    case "cautious":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case "building":
      return "bg-[--cs-warning-bg] text-[--cs-warning] border-[--cs-warning-soft]";
    case "confident":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "highly_confident":
      return "bg-[--cs-success-bg] text-[--cs-success] border-[--cs-success-soft]";
  }
};

/* ── page ────────────────────────────────────────────────────────────────────── */

export default function IndependentTravelTrainingPage() {
  const { data: res, isLoading } = useIndependentTravelRecords();
  const records: IndependentTravelRecord[] = res?.data ?? [];
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"stage" | "name" | "review">("stage");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = records.filter((r) => {
      if (stageFilter !== "all" && r.current_stage !== stageFilter) return false;
      if (!q) return true;
      const hay = [
        getYPName(r.child_id),
        TRAVEL_TRAINING_STAGE_LABEL[r.current_stage],
        r.child_voice,
        r.staff_observation,
        r.routes_mastered.map((x) => `${x.from} ${x.to} ${x.mode}`).join(" "),
        r.routes_learning.map((x) => `${x.from} ${x.to} ${x.mode}`).join(" "),
        r.travel_cards_held.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "stage")
        return stageOrder[b.current_stage] - stageOrder[a.current_stage];
      if (sortBy === "name")
        return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      return a.review_date.localeCompare(b.review_date);
    });
    return list;
  }, [records, search, stageFilter, sortBy]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const stats = {
    inTraining: records.filter((r) => r.current_stage !== "independent_traveller").length,
    independent: records.filter((r) => r.current_stage === "independent_traveller").length,
    routesMastered: records.reduce((sum, r) => sum + r.routes_mastered.length, 0),
    reviewsDue: records.filter((r) => r.review_date <= d(60)).length,
  };

  // ── export ────────────────────────────────────────────────────────────────
  const exportColumns: ExportColumn<IndependentTravelRecord>[] = [
    { header: "Young person", accessor: (r: IndependentTravelRecord) => getYPName(r.child_id) },
    { header: "Last updated", accessor: (r: IndependentTravelRecord) => r.last_updated },
    { header: "Current stage", accessor: (r: IndependentTravelRecord) => TRAVEL_TRAINING_STAGE_LABEL[r.current_stage] },
    { header: "Confidence", accessor: (r: IndependentTravelRecord) => TRAVEL_CONFIDENCE_LABEL[r.child_confidence] },
    { header: "Routes mastered (count)", accessor: (r: IndependentTravelRecord) => r.routes_mastered.length },
    { header: "Routes mastered", accessor: (r: IndependentTravelRecord) => r.routes_mastered.map((x) => `${x.from} → ${x.to} (${x.mode})`).join("; ") },
    { header: "Routes learning", accessor: (r: IndependentTravelRecord) => r.routes_learning.map((x) => `${x.from} → ${x.to} (${x.mode}) — next: ${x.next_step}`).join("; ") },
    { header: "Travel cards", accessor: (r: IndependentTravelRecord) => r.travel_cards_held.join("; ") },
    { header: "Monthly budget (£)", accessor: (r: IndependentTravelRecord) => r.monthly_travel_budget },
    { header: "Phone + charger check", accessor: (r: IndependentTravelRecord) => (r.phone_and_charger_check ? "Yes" : "No") },
    { header: "What-if-lost plan", accessor: (r: IndependentTravelRecord) => r.what_if_lost_plan },
    { header: "Check-in protocol", accessor: (r: IndependentTravelRecord) => r.check_in_protocol },
    { header: "Risk factors", accessor: (r: IndependentTravelRecord) => r.risk_factors.join("; ") },
    { header: "Protective factors", accessor: (r: IndependentTravelRecord) => r.protective_factors.join("; ") },
    { header: "Child voice", accessor: (r: IndependentTravelRecord) => r.child_voice },
    { header: "Staff observation", accessor: (r: IndependentTravelRecord) => r.staff_observation },
    { header: "Review date", accessor: (r: IndependentTravelRecord) => r.review_date },
    { header: "Key worker", accessor: (r: IndependentTravelRecord) => getStaffName(r.key_worker) },
  ];

  if (isLoading) return <PageShell title="Independent Travel Training" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Independent Travel Training"
      subtitle="Stage-based plans preparing young people (especially 14–18) for confident independent travel on public transport. Tracks routes mastered, routes in learning, travel cards, monthly budget, what-if-lost protocols, safety check-ins, and the child's own voice on readiness."
      caraContext={{ pageTitle: "Independent Travel Training", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            data={filtered}
            columns={exportColumns}
            filename="independent-travel-training"
          />
          <PrintButton title="Independent Travel Training" />
          <CaraStudioQuickActionButton context={{ record_type: "education", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-sky-700">
              YPs in training
            </span>
            <Bus className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-sky-900">
            {stats.inTraining}
          </div>
          <div className="text-xs text-sky-700/70">
            young people on a staged training pathway
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Independent travellers
            </span>
            <Train className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-emerald-900">
            {stats.independent}
          </div>
          <div className="text-xs text-emerald-700/70">
            achieved full independent travel
          </div>
        </div>

        <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-blue-700">
              Routes mastered
            </span>
            <MapPin className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-blue-900">
            {stats.routesMastered}
          </div>
          <div className="text-xs text-blue-700/70">total across all YPs</div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-amber-700">
              Reviews due
            </span>
            <Shield className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-amber-900">
            {stats.reviewsDue}
          </div>
          <div className="text-xs text-amber-700/70">within next 60 days</div>
        </div>
      </div>

      {/* ── filters ───────────────────────────────────────────────────────── */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cs-text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by child, route, mode, or note…"
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-[var(--cs-text-muted)] focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="All stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {Object.entries(TRAVEL_TRAINING_STAGE_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as "stage" | "name" | "review")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <ArrowUpDown className="mr-1 h-4 w-4 text-[var(--cs-text-muted)]" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stage">Sort: stage</SelectItem>
            <SelectItem value="name">Sort: child name</SelectItem>
            <SelectItem value="review">Sort: review date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── cards ─────────────────────────────────────────────────────────── */}
      <div className="mt-4 space-y-3">
        {filtered.map((r) => {
          const open = expandedId === r.id;
          return (
            <div
              key={r.id}
              className="rounded-lg border border-sky-200 bg-white shadow-sm transition hover:border-sky-300"
            >
              <button
                onClick={() => setExpandedId(open ? null : r.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-blue-100">
                    <Bus className="h-5 w-5 text-sky-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-[var(--cs-navy)]">
                        {getYPName(r.child_id)}
                      </span>
                      <span className="text-xs text-[var(--cs-text-muted)]">
                        · key worker {getStaffName(r.key_worker)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          stageChip(r.current_stage)
                        )}
                      >
                        {TRAVEL_TRAINING_STAGE_LABEL[r.current_stage]}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          confidenceChip(r.child_confidence)
                        )}
                      >
                        Confidence: {TRAVEL_CONFIDENCE_LABEL[r.child_confidence]}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-[var(--cs-border)] bg-slate-50 px-2 py-0.5 text-xs text-[var(--cs-text-secondary)]">
                        £{r.monthly_travel_budget}/month
                      </span>
                      {r.phone_and_charger_check && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[--cs-success-soft] bg-[--cs-success-bg] px-2 py-0.5 text-xs text-[--cs-success]">
                          <Phone className="h-3 w-3" /> phone + charger
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-[var(--cs-text-muted)]">
                  <span>Review {r.review_date}</span>
                  {open ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {open && (
                <div className="border-t border-sky-100 bg-sky-50/30 px-4 py-4 space-y-4">
                  {/* Child voice */}
                  <div className="rounded-md border border-sky-200 bg-white p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                      Child voice
                    </div>
                    <p className="mt-1 text-sm italic text-[var(--cs-navy)]">
                      &ldquo;{r.child_voice}&rdquo;
                    </p>
                  </div>

                  {/* Staff observation */}
                  <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-secondary)]">
                      Staff observation
                    </div>
                    <p className="mt-1 text-sm text-[var(--cs-navy)]">
                      {r.staff_observation}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* Routes mastered */}
                    <div className="rounded-md border border-[--cs-success-soft] bg-[--cs-success-bg] p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[--cs-success]">
                        Routes mastered ({r.routes_mastered.length})
                      </div>
                      {r.routes_mastered.length === 0 ? (
                        <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">
                          No routes mastered yet — early in pathway.
                        </p>
                      ) : (
                        <ul className="mt-1 space-y-2 text-sm text-[var(--cs-navy)]">
                          {r.routes_mastered.map((x, i) => (
                            <li
                              key={i}
                              className="rounded border border-[--cs-success-soft] bg-white p-2"
                            >
                              <div className="font-medium text-[var(--cs-navy)]">
                                {x.from} → {x.to}
                              </div>
                              <div className="text-xs text-[var(--cs-text-secondary)]">
                                {x.mode} · achieved {x.achieved_date}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Routes learning */}
                    <div className="rounded-md border border-[--cs-warning-soft] bg-[--cs-warning-bg] p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[--cs-warning]">
                        Routes in learning ({r.routes_learning.length})
                      </div>
                      {r.routes_learning.length === 0 ? (
                        <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">
                          No active learning routes.
                        </p>
                      ) : (
                        <ul className="mt-1 space-y-2 text-sm text-[var(--cs-navy)]">
                          {r.routes_learning.map((x, i) => (
                            <li
                              key={i}
                              className="rounded border border-[--cs-warning-soft] bg-white p-2"
                            >
                              <div className="font-medium text-[var(--cs-navy)]">
                                {x.from} → {x.to}
                              </div>
                              <div className="text-xs text-[var(--cs-text-secondary)]">
                                {x.mode}
                              </div>
                              <div className="mt-1 text-xs text-[--cs-warning]">
                                Next step: {x.next_step}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* What-if-lost plan */}
                    <div className="rounded-md border border-blue-200 bg-blue-50/40 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                        What-if-lost plan
                      </div>
                      <p className="mt-1 text-sm text-[var(--cs-navy)]">
                        {r.what_if_lost_plan}
                      </p>
                    </div>

                    {/* Check-in protocol */}
                    <div className="rounded-md border border-sky-200 bg-white p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                        Check-in protocol
                      </div>
                      <p className="mt-1 text-sm text-[var(--cs-navy)]">
                        {r.check_in_protocol}
                      </p>
                    </div>

                    {/* Risk factors */}
                    <div className="rounded-md border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[--cs-risk]">
                        Risk factors
                      </div>
                      {r.risk_factors.length === 0 ? (
                        <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">
                          None recorded.
                        </p>
                      ) : (
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[--cs-risk]">
                          {r.risk_factors.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Protective factors */}
                    <div className="rounded-md border border-[--cs-success-soft] bg-[--cs-success-bg] p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[--cs-success]">
                        Protective factors
                      </div>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[--cs-success]">
                        {r.protective_factors.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Travel cards */}
                  <div className="rounded-md border border-blue-200 bg-white p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                      Travel cards held
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.travel_cards_held.map((c, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-800"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer meta */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--cs-text-muted)]">
                    <span>Last updated {r.last_updated}</span>
                    <span>·</span>
                    <span>Next review {r.review_date}</span>
                    <span>·</span>
                    <span>Key worker: {getStaffName(r.key_worker)}</span>
                  </div>

                  <SmartLinkPanel sourceType="independent-travel-records" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-[var(--cs-text-muted)]">
            No travel training records match the current filters.
          </div>
        )}
      </div>

      {/* ── regulatory footer ─────────────────────────────────────────────── */}
      <div className="mt-6 rounded-lg border border-sky-200 bg-sky-50/40 p-4 text-xs text-sky-900/80">
        <div className="font-semibold text-sky-900">Regulatory framework</div>
        <p className="mt-1">
          This record supports the Children&apos;s Homes (England) Regulations 2015
          Quality Standard 6 (enjoyment and achievement — supporting young people to
          access community, leisure and education through real-world skills) and
          Quality Standard 7 (positive relationships — staged, attuned scaffolding
          from a trusted key worker). Travel training forms part of the young
          person&apos;s pathway plan under the Care Leavers (England) Regulations 2010
          and contributes to readiness for adulthood. Routes are subject to lone-working
          and individual risk-assessment principles, balanced against the child&apos;s
          right to community participation and rest/leisure under UNCRC Article 31.
          The child&apos;s voice and pace of readiness are weighted alongside staff
          observation in line with UNCRC Article 12.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Activities"
        category="activity"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Independent Travel Training — public transport, bus pass, rail card, travel risk assessment, route planning, supervised travel, unsupervised travel, life skills, care plan"
        recordType="education"
        className="mt-6"
      />
    </PageShell>
  );
}
