"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  TrendingUp,
  CheckCircle,
  Clock,
  Star,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIndependenceLivingAssessments } from "@/hooks/use-independence-living-assessments";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { IndependenceLivingAssessment, LivingSkillLevel, LivingSkillsReadiness } from "@/types/extended";
import { LIVING_SKILL_LEVEL_LABEL, LIVING_SKILLS_READINESS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── constants ───────────────────────────────────────────────────────── */

const levelColour: Record<LivingSkillLevel, string> = {
  not_yet_started: "bg-slate-100 text-[var(--cs-text-secondary)]",
  emerging: "bg-amber-100 text-amber-800",
  developing: "bg-blue-100 text-blue-800",
  established: "bg-emerald-100 text-emerald-800",
  mastered: "bg-green-200 text-green-900",
};

const readinessColour: Record<LivingSkillsReadiness, string> = {
  early_stage: "bg-slate-100 text-[var(--cs-navy)]",
  building_foundations: "bg-blue-100 text-blue-800",
  developing_strongly: "bg-emerald-100 text-emerald-800",
  approaching_ready: "bg-green-200 text-green-900",
  ready_for_next_step: "bg-purple-200 text-purple-900",
};

const exportCols: ExportColumn<IndependenceLivingAssessment>[] = [
  { header: "Young Person", accessor: (r: IndependenceLivingAssessment) => getYPName(r.child_id) },
  { header: "Age", accessor: (r: IndependenceLivingAssessment) => String(r.age) },
  { header: "Years to Transition", accessor: (r: IndependenceLivingAssessment) => String(r.years_to_transition) },
  { header: "Overall Readiness", accessor: (r: IndependenceLivingAssessment) => LIVING_SKILLS_READINESS_LABEL[r.overall_readiness] },
  { header: "Domains Assessed", accessor: (r: IndependenceLivingAssessment) => String(r.domain_assessments.length) },
  { header: "Total Skills", accessor: (r: IndependenceLivingAssessment) => String(r.domain_assessments.reduce((sum, d) => sum + d.skills.length, 0)) },
  { header: "Assessor", accessor: (r: IndependenceLivingAssessment) => getStaffName(r.assessor) },
  { header: "Last Assessed", accessor: (r: IndependenceLivingAssessment) => r.assessment_date },
];

/* ── helpers ─────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

/* ── component ───────────────────────────────────────────────────────── */

export default function IndependentLivingSkillsAssessmentPage() {
  const { data: res, isLoading } = useIndependenceLivingAssessments();
  const data: IndependenceLivingAssessment[] = res?.data ?? [];
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((a) => a.child_id === filterYP);
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "review":
          return a.next_assessment_due.localeCompare(b.next_assessment_due);
        case "age":
          return b.age - a.age;
        default:
          return 0;
      }
    });
    return items;
  }, [data, filterYP, sortBy]);

  const total = data.length;
  const totalSkills = data.reduce((sum, a) => sum + a.domain_assessments.reduce((s, d) => s + d.skills.length, 0), 0);
  const childAgreed = data.filter((a) => a.child_agreed).length;
  const dueAssessment = data.filter((a) => a.next_assessment_due <= d(60)).length;

  if (isLoading) return <PageShell title="Independent Living Skills Assessment" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Independent Living Skills Assessment"
      subtitle="Skills assessment across life domains — preparing each child for adulthood at their pace"
      ariaContext={{ pageTitle: "Independent Living Skills Assessment", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="independent-living-skills-assessment" />
          <PrintButton title="Independent Living Skills Assessment" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Assessments</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalSkills}</p>
          <p className="text-xs text-muted-foreground">Skills Tracked</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{childAgreed}/{total}</p>
          <p className="text-xs text-muted-foreground">Child Co-Authored</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", dueAssessment > 0 ? "text-amber-600" : "text-green-600")}>{dueAssessment}</p>
          <p className="text-xs text-muted-foreground">Reassess Next 60d</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Independence is built one skill at a time, at the pace each child can manage. We assess against
          life domains — personal care, cooking, money, health, education, community — with both child and
          staff perspectives. The goal isn&apos;t a checklist; it&apos;s a confident adult.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {data.map((a) => <SelectItem key={a.child_id} value={a.child_id}>{getYPName(a.child_id)}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="age">By Age</SelectItem>
              <SelectItem value="review">Earliest Reassessment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((a) => {
          const isExpanded = expandedId === a.id;
          const skillCount = a.domain_assessments.reduce((sum, d) => sum + d.skills.length, 0);
          const masteredCount = a.domain_assessments.reduce((sum, d) => sum + d.skills.filter((s) => s.level === "mastered" || s.level === "established").length, 0);

          return (
            <div key={a.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : a.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <TrendingUp className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(a.child_id)} (age {a.age})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.domain_assessments.length} domains &middot; {skillCount} skills &middot; {masteredCount} established/mastered &middot; {a.years_to_transition} years to transition
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", readinessColour[a.overall_readiness])}>
                    {LIVING_SKILLS_READINESS_LABEL[a.overall_readiness]}
                  </span>
                  {a.child_agreed && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Child&apos;s Aspirations</p>
                    <p className="text-sm">{a.child_aspirations}</p>
                  </div>

                  {a.child_worries.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Child&apos;s Worries</p>
                      <ul className="space-y-1">
                        {a.child_worries.map((w, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <AlertCircle className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* domain assessments */}
                  {a.domain_assessments.map((da, i) => (
                    <div key={i} className="bg-white rounded-lg p-3 border">
                      <p className="text-sm font-semibold mb-2">{da.domain}</p>
                      <p className="text-xs text-muted-foreground italic mb-2">{da.domain_summary}</p>
                      <div className="space-y-2">
                        {da.skills.map((s, j) => (
                          <div key={j} className="bg-slate-50 rounded-lg p-2 border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{s.skill}</span>
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", levelColour[s.level])}>{LIVING_SKILL_LEVEL_LABEL[s.level]}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{s.evidence}</p>
                            {!s.agreement_between_child_and_staff && (
                              <p className="text-xs text-amber-700">
                                <em>Note: Child rates &lsquo;{LIVING_SKILL_LEVEL_LABEL[s.child_self_assessment]}&rsquo; vs staff &lsquo;{LIVING_SKILL_LEVEL_LABEL[s.staff_assessment]}&rsquo;. {s.next_steps}</em>
                              </p>
                            )}
                            {s.agreement_between_child_and_staff && s.next_steps && (
                              <p className="text-xs text-blue-700"><strong>Next:</strong> {s.next_steps}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                      <Star className="h-3 w-3 inline mr-1" />Priority Skills — Next 6 Months
                    </p>
                    <ul className="space-y-1">
                      {a.priority_skills_next_six_months.map((p, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Star className="h-3 w-3 text-emerald-500 mt-1 shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Resources Allocated</p>
                    <ul className="space-y-1">
                      {a.resources_allocated.map((r, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <CheckCircle className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Pathway Links</p>
                    <div className="flex flex-wrap gap-1">
                      {a.pathway_links.map((p, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{p}</span>
                      ))}
                    </div>
                  </div>

                  {a.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Assessor Notes</p>
                      <p className="text-sm">{a.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Assessor: {getStaffName(a.assessor)}</span>
                    <span><Clock className="h-3 w-3 inline mr-1" />Reassess: {a.next_assessment_due}</span>
                    {a.child_agreed && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Child Co-Authored</span>}
                  </div>

                  <SmartLinkPanel sourceType="independence-living-assessments" sourceId={a.id} childId={a.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Independent living skills assessments support Quality Standard 12
          (preparation for adulthood), Quality Standard 1 (child-centred care), Care Leavers Regulations 2010,
          and link to the Pathway Plan from age 16. Reassessed every 6 months. Linked to Independence
          Pathway, Independence Skills, and Pathway Plan (16+).
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Education"
        category="education"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Independent Living Skills Assessment — ILSA tool, life skills assessment, self-care, cooking, finances, housing, employment, relationships, pathway plan, leaving care"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
