"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Shirt,
  WashingMachine,
  Wind,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Award,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  LaundrySelfCareRecord,
  LaundryStage,
  LaundrySkillLevel,
} from "@/types/extended";
import {
  LAUNDRY_STAGE_LABEL,
  LAUNDRY_SKILL_LEVEL_LABEL,
} from "@/types/extended";
import { useLaundrySelfCareRecords } from "@/hooks/use-laundry-self-care-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";

// ── helpers ─────────────────────────────────────────────────────────────────
function stageColour(stage: LaundryStage): string {
  switch (stage) {
    case "stage_5_manages_own_routine": return "bg-emerald-100 text-emerald-800";
    case "stage_4_did_independently": return "bg-teal-100 text-teal-800";
    case "stage_3_did_with_prompts": return "bg-sky-100 text-sky-800";
    case "stage_2_did_with_staff": return "bg-blue-100 text-blue-800";
    default: return "bg-slate-100 text-slate-800";
  }
}

function levelColour(level: LaundrySkillLevel): string {
  switch (level) {
    case "independent": return "bg-emerald-100 text-emerald-800";
    case "confident": return "bg-teal-100 text-teal-800";
    case "learning": return "bg-sky-100 text-sky-800";
    default: return "bg-slate-100 text-slate-700";
  }
}

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<LaundrySelfCareRecord>[] = [
  { header: "Young Person", accessor: (r: LaundrySelfCareRecord) => getYPName(r.child_id) },
  { header: "Recorded", accessor: (r: LaundrySelfCareRecord) => r.recorded_date },
  { header: "Stage", accessor: (r: LaundrySelfCareRecord) => LAUNDRY_STAGE_LABEL[r.overall_stage] },
  { header: "Routine", accessor: (r: LaundrySelfCareRecord) => r.routine_frequency },
  { header: "Owns Basket", accessor: (r: LaundrySelfCareRecord) => (r.owns_basket ? "Yes" : "No") },
  { header: "Knows Care Symbols", accessor: (r: LaundrySelfCareRecord) => (r.knows_care_symbols ? "Yes" : "No") },
  { header: "Iron Competent", accessor: (r: LaundrySelfCareRecord) => (r.iron_competent ? "Yes" : "No") },
  { header: "Next Skill", accessor: (r: LaundrySelfCareRecord) => r.next_skill },
  { header: "Review Date", accessor: (r: LaundrySelfCareRecord) => r.review_date },
  { header: "Key Worker", accessor: (r: LaundrySelfCareRecord) => getStaffName(r.key_worker) },
];

// ── component ───────────────────────────────────────────────────────────────
export default function ChildLaundrySelfCarePage() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: queryData, isLoading } = useLaundrySelfCareRecords();
  const items = queryData?.data ?? [];

  const filtered = useMemo(() => {
    let list = [...items];
    if (stageFilter !== "all") list = list.filter((r) => r.overall_stage === stageFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          LAUNDRY_STAGE_LABEL[r.overall_stage].toLowerCase().includes(q) ||
          r.next_skill.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "stage":
          return a.overall_stage.localeCompare(b.overall_stage);
        case "review":
          return a.review_date.localeCompare(b.review_date);
        default:
          return 0;
      }
    });
    return list;
  }, [items, search, stageFilter, sortBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // ── stats ─────────────────────────────────────────────────────────────────
  const childrenWithRoutine = items.filter(
    (r) => r.overall_stage !== "stage_1_observed",
  ).length;
  const fullyIndependent = items.filter(
    (r) => r.overall_stage === "stage_4_did_independently" || r.overall_stage === "stage_5_manages_own_routine",
  ).length;
  const promptsNeeded = items.filter(
    (r) => r.overall_stage === "stage_2_did_with_staff" || r.overall_stage === "stage_3_did_with_prompts",
  ).length;
  const fourteenDaysOut = (() => { const dt = new Date(); dt.setDate(dt.getDate() + 14); return dt.toISOString().slice(0, 10); })();
  const reviewsDue = items.filter((r) => r.review_date <= fourteenDaysOut).length;

  return (
    <PageShell
      title="Laundry Self-Care"
      subtitle="Per-child laundry independence — sorting, machine use, drying, ironing, folding. Co-produced with each young person; linked to Pathway Plans for over-16s."
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={items} columns={exportCols} filename="laundry-self-care" />
          <PrintButton title="Laundry Self-Care" />
        </div>
      }
    >
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-sky-600">{childrenWithRoutine}</p>
          <p className="text-xs text-muted-foreground">Children With Routines</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{fullyIndependent}</p>
          <p className="text-xs text-muted-foreground">Fully Independent</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{promptsNeeded}</p>
          <p className="text-xs text-muted-foreground">Prompts Needed</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{reviewsDue}</p>
          <p className="text-xs text-muted-foreground">Reviews Due (14d)</p>
        </div>
      </div>

      {/* ── ethos banner ──────────────────────────────────────────── */}
      <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 mb-6 flex items-start gap-2">
        <Shirt className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
        <p className="text-sm text-sky-900">
          Independence skills are taught at each child&apos;s pace — never forced. Progress is celebrated,
          and ironing in particular is approached with sensitivity to past trauma. Every step builds
          confidence, dignity, and readiness for adult life.
        </p>
      </div>

      {/* ── filters/sort ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search child, stage, or skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {Object.entries(LAUNDRY_STAGE_LABEL).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="stage">By Stage</SelectItem>
              <SelectItem value="review">By Review Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── records ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No records match your filters.
          </div>
        )}
        {filtered.map((rec) => {
          const isExpanded = expandedId === rec.id;

          return (
            <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : rec.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Shirt className="h-5 w-5 text-sky-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(rec.child_id)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Routine: {rec.routine_frequency} &middot; Recorded {rec.recorded_date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3 flex-wrap justify-end">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      stageColour(rec.overall_stage),
                    )}
                  >
                    {LAUNDRY_STAGE_LABEL[rec.overall_stage]}
                  </span>
                  {rec.owns_basket && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal-100 text-teal-800">
                      Own Basket
                    </span>
                  )}
                  {rec.knows_care_symbols && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-sky-100 text-sky-800">
                      Knows Symbols
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* skills checklist */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Award className="h-3 w-3 inline mr-1" />
                      Skills Checklist
                    </p>
                    <div className="space-y-1.5">
                      {rec.skills.map((s, i) => (
                        <div
                          key={i}
                          className="bg-white rounded-lg p-2 border flex items-center justify-between text-sm"
                        >
                          <span className="flex-1">{s.name}</span>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                              levelColour(s.level),
                            )}
                          >
                            {LAUNDRY_SKILL_LEVEL_LABEL[s.level]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* equipment / capability chips */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <div className="bg-white rounded-lg p-2 border flex items-center gap-2">
                      <WashingMachine className="h-4 w-4 text-sky-600" />
                      <div>
                        <p className="text-xs font-medium">Routine</p>
                        <p className="text-xs text-muted-foreground">{rec.routine_frequency}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border flex items-center gap-2">
                      <Wind className="h-4 w-4 text-teal-600" />
                      <div>
                        <p className="text-xs font-medium">Iron Competent</p>
                        <p className="text-xs text-muted-foreground">
                          {rec.iron_competent ? "Yes" : "Not yet"}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border flex items-center gap-2">
                      <Shirt className="h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-medium">Care Symbols</p>
                        <p className="text-xs text-muted-foreground">
                          {rec.knows_care_symbols ? "Confident" : "Learning"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* child voice */}
                  <div className="bg-sky-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-sky-800 uppercase tracking-wide mb-1">
                      Child&apos;s Voice
                    </p>
                    <p className="text-sm italic text-sky-900">&ldquo;{rec.child_voice}&rdquo;</p>
                  </div>

                  {/* staff observation */}
                  <div className="bg-teal-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-1">
                      Staff Observation
                    </p>
                    <p className="text-sm text-teal-900">{rec.staff_observation}</p>
                  </div>

                  {/* challenges */}
                  {rec.challenges_noted.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Challenges &amp; Notes
                      </p>
                      <ul className="space-y-1">
                        {rec.challenges_noted.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* next skill */}
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                      Next Skill
                    </p>
                    <p className="text-sm text-emerald-900">{rec.next_skill}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Recorded: {rec.recorded_date}</span>
                    <span>Review: {rec.review_date}</span>
                    <span>Key Worker: {getStaffName(rec.key_worker)}</span>
                  </div>

                  <SmartLinkPanel sourceType="laundry_self_care" sourceId={rec.id} childId={rec.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Laundry self-care evidences Quality Standard 6
          (enjoyment and achievement) and the Pathway Plan independence outcomes for over-16s.
          Each child&apos;s voice and pace is upheld per UNCRC Article 12. Records link to
          Independence Skills Tracker and Daily Routines.
        </p>
      </div>
    </PageShell>
  );
}
