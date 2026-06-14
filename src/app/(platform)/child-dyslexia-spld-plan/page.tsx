"use client";

import { useState, useMemo } from "react";
import {
  BookOpen,
  Sparkles,
  Lightbulb,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Award,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  SpldCondition,
  SpldDiagnosisStatus,
  SpldTechOutcome,
} from "@/types/extended";
import {
  SPLD_CONDITION_LABEL,
  SPLD_DIAGNOSIS_STATUS_LABEL,
  SPLD_TECH_OUTCOME_LABEL,
} from "@/types/extended";
import { useSpldSupportPlans } from "@/hooks/use-spld-support-plans";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────── */

const dayOffset = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const STATUS_COLOURS: Record<SpldDiagnosisStatus, string> = {
  diagnosed: "bg-sky-100 text-sky-800 border-sky-200",
  awaiting_assessment: "bg-amber-100 text-amber-800 border-amber-200",
  suspected: "bg-violet-100 text-violet-800 border-violet-200",
  self_identified: "bg-teal-100 text-teal-800 border-teal-200",
};

const CONDITION_COLOURS: Record<SpldCondition, string> = {
  dyslexia: "bg-sky-50 text-sky-700 border-sky-200",
  dyscalculia: "bg-indigo-50 text-indigo-700 border-indigo-200",
  dysgraphia: "bg-violet-50 text-violet-700 border-violet-200",
  dcd_dyspraxia: "bg-teal-50 text-teal-700 border-teal-200",
  auditory_processing_difficulty: "bg-amber-50 text-amber-700 border-amber-200",
  visual_processing_difficulty: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
};

const TECH_OUTCOME_COLOURS: Record<SpldTechOutcome, string> = {
  loves_it: "bg-emerald-100 text-emerald-800",
  useful: "bg-teal-100 text-teal-800",
  tried_not_useful: "bg-amber-100 text-amber-800",
  resists: "bg-rose-100 text-rose-800",
};

/* ── flat row for export ───────────────────────────────────────────────── */

interface FlatRow {
  child: string;
  plan_date: string;
  conditions: string;
  diagnosis_status: string;
  diagnosing_professional: string;
  diagnosis_date: string;
  strengths: string;
  challenges: string;
  technology_in_use: string;
  technology_tried: string;
  school_access_arrangements: string;
  exam_concessions_agreed: string;
  home_study_support: string;
  staff_strategies: string;
  external_support: string;
  identity_work: string;
  child_voice: string;
  staff_observation: string;
  next_step: string;
  review_date: string;
  key_worker: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person", accessor: (r: FlatRow) => r.child },
  { header: "Plan Date", accessor: (r: FlatRow) => r.plan_date },
  { header: "Conditions", accessor: (r: FlatRow) => r.conditions },
  { header: "Diagnosis Status", accessor: (r: FlatRow) => r.diagnosis_status },
  { header: "Diagnosing Professional", accessor: (r: FlatRow) => r.diagnosing_professional },
  { header: "Diagnosis Date", accessor: (r: FlatRow) => r.diagnosis_date },
  { header: "Strengths", accessor: (r: FlatRow) => r.strengths },
  { header: "Challenges", accessor: (r: FlatRow) => r.challenges },
  { header: "Technology In Use", accessor: (r: FlatRow) => r.technology_in_use },
  { header: "Technology Tried", accessor: (r: FlatRow) => r.technology_tried },
  { header: "School Access Arrangements", accessor: (r: FlatRow) => r.school_access_arrangements },
  { header: "Exam Concessions", accessor: (r: FlatRow) => r.exam_concessions_agreed },
  { header: "Home Study Support", accessor: (r: FlatRow) => r.home_study_support },
  { header: "Staff Strategies", accessor: (r: FlatRow) => r.staff_strategies },
  { header: "External Support", accessor: (r: FlatRow) => r.external_support },
  { header: "Identity Work", accessor: (r: FlatRow) => r.identity_work },
  { header: "Child Voice", accessor: (r: FlatRow) => r.child_voice },
  { header: "Staff Observation", accessor: (r: FlatRow) => r.staff_observation },
  { header: "Next Step", accessor: (r: FlatRow) => r.next_step },
  { header: "Review Date", accessor: (r: FlatRow) => r.review_date },
  { header: "Key Worker", accessor: (r: FlatRow) => r.key_worker },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildDyslexiaSpLDPlanPage() {
  const { data: response, isLoading } = useSpldSupportPlans();
  const data = response?.data ?? [];

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterCondition, setFilterCondition] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* stats */
  const stats = useMemo(() => {
    const active = data.length;
    const diagnosed = data.filter((r) => r.diagnosis_status === "diagnosed").length;
    const examAccess = data.filter((r) => r.exam_concessions_agreed.length > 0).length;
    const reviewSoon = data.filter((r) => r.review_date <= dayOffset(90)).length;
    return { active, diagnosed, examAccess, reviewSoon };
  }, [data]);

  /* filtered / sorted */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.conditions.some((c) => SPLD_CONDITION_LABEL[c].toLowerCase().includes(q)) ||
          SPLD_DIAGNOSIS_STATUS_LABEL[r.diagnosis_status].toLowerCase().includes(q) ||
          r.strengths.some((s) => s.toLowerCase().includes(q)),
      );
    }
    if (filterCondition !== "all") {
      list = list.filter((r) => r.conditions.includes(filterCondition as SpldCondition));
    }
    const out = [...list];
    switch (sortBy) {
      case "name":
        out.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id)));
        break;
      case "review":
        out.sort((a, b) => a.review_date.localeCompare(b.review_date));
        break;
      case "strengths":
        out.sort((a, b) => (b.strengths?.length ?? 0) - (a.strengths?.length ?? 0));
        break;
    }
    return out;
  }, [data, search, filterCondition, sortBy]);

  /* export */
  const exportData = useMemo<FlatRow[]>(
    () =>
      data.map((r) => ({
        child: getYPName(r.child_id),
        plan_date: r.plan_date,
        conditions: r.conditions.map((c) => SPLD_CONDITION_LABEL[c]).join("; "),
        diagnosis_status: SPLD_DIAGNOSIS_STATUS_LABEL[r.diagnosis_status],
        diagnosing_professional: r.diagnosing_professional ?? "",
        diagnosis_date: r.diagnosis_date ?? "",
        strengths: r.strengths.join("; "),
        challenges: r.challenges.join("; "),
        technology_in_use: r.technology_in_use.join("; "),
        technology_tried: r.technology_tried
          .map((t) => `${t.name} (${SPLD_TECH_OUTCOME_LABEL[t.outcome]})`)
          .join(" | "),
        school_access_arrangements: r.school_access_arrangements.join("; "),
        exam_concessions_agreed: r.exam_concessions_agreed.join("; "),
        home_study_support: r.home_study_support.join("; "),
        staff_strategies: r.staff_strategies.join("; "),
        external_support: r.external_support
          .map((e) => `${e.agency} — ${e.role} (${e.frequency})`)
          .join(" | "),
        identity_work: r.identity_work.join("; "),
        child_voice: r.child_voice,
        staff_observation: r.staff_observation,
        next_step: r.next_step,
        review_date: r.review_date,
        key_worker: getStaffName(r.key_worker),
      })),
    [data],
  );

  if (isLoading) {
    return (
      <PageShell title="SpLD Support Plans" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-300 border-t-sky-600" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="SpLD Support Plans"
      subtitle="Per-child Specific Learning Difficulty plan — dyslexia, dyscalculia, dysgraphia, DCD/dyspraxia. Strength-based, neurodiversity-affirming, technology-led."
      caraContext={{ pageTitle: "SpLD Support Plans", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="SpLD Support Plans" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="spld-support-plans" />
          <CaraStudioQuickActionButton context={{ record_type: "education", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Plans", value: stats.active, icon: BookOpen, colour: "text-sky-600" },
          { label: "Diagnosed", value: stats.diagnosed, icon: Award, colour: "text-teal-600" },
          { label: "Exam Access In Place", value: stats.examAccess, icon: Lightbulb, colour: "text-indigo-600" },
          { label: "Reviews Due 90d", value: stats.reviewSoon, icon: Sparkles, colour: "text-amber-600" },
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
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search children, conditions, strengths…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterCondition} onValueChange={setFilterCondition}>
          <SelectTrigger className="w-[240px] h-9 text-sm">
            <SelectValue placeholder="All Conditions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            {(Object.keys(SPLD_CONDITION_LABEL) as SpldCondition[]).map((key) => (
              <SelectItem key={key} value={key}>
                {SPLD_CONDITION_LABEL[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="review">Review Date</SelectItem>
              <SelectItem value="strengths">Most Strengths</SelectItem>
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
              <button
                onClick={() => toggle(r.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <BookOpen className="h-4 w-4 text-sky-500" />
                    <h3 className="font-semibold">{getYPName(r.child_id)}</h3>
                    {r.conditions.map((c) => (
                      <span
                        key={c}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium border",
                          CONDITION_COLOURS[c],
                        )}
                      >
                        {SPLD_CONDITION_LABEL[c]}
                      </span>
                    ))}
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium border",
                        STATUS_COLOURS[r.diagnosis_status],
                      )}
                    >
                      {SPLD_DIAGNOSIS_STATUS_LABEL[r.diagnosis_status]}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Lightbulb className="h-3 w-3 inline mr-1" />
                      {r.exam_concessions_agreed.length} exam access
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Plan {r.plan_date} · Key worker {getStaffName(r.key_worker)} · Review{" "}
                    <span className={cn(r.review_date <= dayOffset(0) ? "text-red-600 font-medium" : "")}>
                      {r.review_date}
                    </span>
                  </p>
                </div>
                {open ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-5">
                  {/* diagnosis info */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm rounded-md bg-sky-50 border border-sky-200 p-3">
                    <div>
                      <span className="text-gray-500">Status:</span>{" "}
                      <span className="font-medium">{SPLD_DIAGNOSIS_STATUS_LABEL[r.diagnosis_status]}</span>
                    </div>
                    {r.diagnosis_date && (
                      <div>
                        <span className="text-gray-500">Diagnosed:</span>{" "}
                        <span className="font-medium">{r.diagnosis_date}</span>
                      </div>
                    )}
                    {r.diagnosing_professional && (
                      <div className="md:col-span-3">
                        <span className="text-gray-500">Professional:</span>{" "}
                        <span className="font-medium">{r.diagnosing_professional}</span>
                      </div>
                    )}
                  </div>

                  {/* strengths + challenges */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
                      <h4 className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Strengths
                      </h4>
                      <ul className="list-disc list-inside text-sm text-emerald-900 space-y-0.5">
                        {r.strengths.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1">
                        Challenges
                      </h4>
                      <ul className="list-disc list-inside text-sm text-amber-900 space-y-0.5">
                        {r.challenges.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* technology in use */}
                  <div className="rounded-md bg-teal-50 border border-teal-200 p-3">
                    <h4 className="text-xs font-semibold text-teal-700 mb-1">
                      Technology In Use
                    </h4>
                    <ul className="list-disc list-inside text-sm text-teal-900 space-y-0.5">
                      {r.technology_in_use.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  {/* technology tried */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">
                      Technology Tried — Outcomes
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {r.technology_tried.map((t, idx) => (
                        <span
                          key={idx}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium",
                            TECH_OUTCOME_COLOURS[t.outcome],
                          )}
                        >
                          {t.name} — {SPLD_TECH_OUTCOME_LABEL[t.outcome]}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* school access + exam concessions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-sky-50 border border-sky-200 p-3">
                      <h4 className="text-xs font-semibold text-sky-700 mb-1">
                        School Access Arrangements
                      </h4>
                      <ul className="list-disc list-inside text-sm text-sky-900 space-y-0.5">
                        {r.school_access_arrangements.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md bg-indigo-50 border border-indigo-200 p-3">
                      <h4 className="text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" /> Exam Access (JCQ)
                      </h4>
                      {r.exam_concessions_agreed.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-indigo-900 space-y-0.5">
                          {r.exam_concessions_agreed.map((e, idx) => (
                            <li key={idx}>{e}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-indigo-900 italic">None agreed yet.</p>
                      )}
                    </div>
                  </div>

                  {/* home study + staff strategies */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-teal-50 border border-teal-200 p-3">
                      <h4 className="text-xs font-semibold text-teal-700 mb-1">
                        Home Study Support
                      </h4>
                      <ul className="list-disc list-inside text-sm text-teal-900 space-y-0.5">
                        {r.home_study_support.map((h, idx) => (
                          <li key={idx}>{h}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md bg-violet-50 border border-violet-200 p-3">
                      <h4 className="text-xs font-semibold text-violet-700 mb-1">
                        Staff Strategies
                      </h4>
                      <ul className="list-disc list-inside text-sm text-violet-900 space-y-0.5">
                        {r.staff_strategies.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* external support */}
                  {r.external_support.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-2">External Support</h4>
                      <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                              <th className="text-left px-3 py-2">Agency</th>
                              <th className="text-left px-3 py-2">Role</th>
                              <th className="text-left px-3 py-2">Frequency</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.external_support.map((e, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-3 py-2 font-medium">{e.agency}</td>
                                <td className="px-3 py-2 text-gray-700">{e.role}</td>
                                <td className="px-3 py-2 text-gray-700">{e.frequency}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* identity work — highlighted rose */}
                  <div className="rounded-md bg-rose-50 border-l-4 border-rose-400 p-3">
                    <h4 className="text-xs font-semibold text-rose-700 mb-1 flex items-center gap-1">
                      <Award className="h-3 w-3" /> Identity Work — Reframing
                    </h4>
                    <ul className="list-disc list-inside text-sm text-rose-900 space-y-0.5">
                      {r.identity_work.map((i, idx) => (
                        <li key={idx}>{i}</li>
                      ))}
                    </ul>
                  </div>

                  {/* child voice */}
                  <div className="rounded-md bg-sky-50 border-l-4 border-sky-400 p-3">
                    <h4 className="text-xs font-semibold text-sky-700 mb-1">
                      Child&apos;s Voice
                    </h4>
                    <p className="text-sm text-sky-900 italic">&ldquo;{r.child_voice}&rdquo;</p>
                  </div>

                  {/* staff observation */}
                  <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Staff Observation</h4>
                    <p className="text-sm text-gray-800">{r.staff_observation}</p>
                  </div>

                  {/* next step */}
                  <div className="rounded-md bg-teal-50 border border-teal-200 p-3">
                    <h4 className="text-xs font-semibold text-teal-700 mb-1">Next Step</h4>
                    <p className="text-sm text-teal-900">{r.next_step}</p>
                  </div>

                  {/* smart link panel */}
                  <SmartLinkPanel sourceType="dyslexia-spld-plan" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 mb-6 space-y-2">
        <p>
          <strong>Regulatory and clinical framework:</strong> Plans aligned with the NICE / NHS
          neurodevelopmental pathway for SpLD, the British Dyslexia Association code of practice
          (BDA Quality Mark standards), JCQ Access Arrangements and Reasonable Adjustments
          (annual guidance — Form 8 evidence held by school SENCo), the Equality Act 2010
          (SpLD as a protected disability requiring reasonable adjustments in education) and
          the SEND Code of Practice 2015. Children&apos;s Homes Regulations Quality Standard 5
          (health and wellbeing) and Quality Standard 6 (education) apply.
        </p>
        <p>
          <strong>Theoretical framing:</strong> Strength-based, neurodiversity-affirming practice
          drawn from the British Dyslexia Association, the Dyspraxia Foundation and Made By
          Dyslexia. SpLDs are differences in cognitive processing, not deficits in intelligence
          or effort. Identity reframing — moving from internalised &ldquo;lazy / stupid&rdquo;
          labels to a positive cognitive identity — is the foundation that makes every other
          accommodation effective. UNCRC Article 12 (right to be heard), Article 23 (rights of
          disabled children), Article 28 (right to education) and Article 29 (education aims to
          develop the child&apos;s talents and abilities to their fullest potential) centre
          this plan in the child&apos;s own voice and chosen identity.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Health & Education"
        category={["health", "education"]}
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="SpLD Support Plans — dyslexia, dyspraxia, dyscalculia, ADHD learning impact, EHCP, educational psychology, reading support, phonics, assistive technology, PEP targets"
        recordType="education"
        className="mt-6"
      />
    </PageShell>
  );
}
