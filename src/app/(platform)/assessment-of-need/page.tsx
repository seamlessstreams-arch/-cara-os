"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — ASSESSMENT OF NEED
// Care Planning, Placement and Case Review (England) Regulations 2010, Reg 14
// (28-day report) — Children's Homes Quality Standard 4 (Education /
// Care, in conjunction with Standard 1)
// Comprehensive baseline assessment on or shortly after admission that informs
// the care plan.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  ClipboardList, Clock, AlertTriangle, CheckCircle2, Layers,
  Users, Heart, GraduationCap, Sparkles, Home, Sun, Compass,
  Shield, Stethoscope, MessageSquare, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useNeedsAssessments } from "@/hooks/use-needs-assessments";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { NeedsAssessment, NeedsDomain, NeedsComplexity, NeedsDomainAssessment } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── label maps ───────────────────────────────────────────────────────────── */

const NEEDS_DOMAIN_LABEL: Record<NeedsDomain, string> = {
  health:                 "Health",
  education:              "Education",
  identity:               "Identity",
  family_social:          "Family & Social",
  behavioural_emotional:  "Behavioural & Emotional",
  self_care_practical:    "Self-Care & Practical",
  spiritual_cultural:     "Spiritual & Cultural",
};

const NEEDS_COMPLEXITY_LABEL: Record<NeedsComplexity, string> = {
  low:            "Low",
  moderate:       "Moderate",
  complex:        "Complex",
  highly_complex: "Highly complex",
};

/* ── style maps ───────────────────────────────────────────────────────────── */

const COMPLEXITY_CLR: Record<NeedsComplexity, string> = {
  low:            "bg-green-100 text-green-800",
  moderate:       "bg-yellow-100 text-yellow-800",
  complex:        "bg-orange-100 text-orange-800",
  highly_complex: "bg-red-100 text-red-800",
};

const COMPLEXITY_BORDER: Record<NeedsComplexity, string> = {
  low:            "border-l-green-400",
  moderate:       "border-l-yellow-400",
  complex:        "border-l-orange-500",
  highly_complex: "border-l-red-600",
};

const DOMAIN_ICON: Record<NeedsDomain, React.ElementType> = {
  health:                 Stethoscope,
  education:              GraduationCap,
  identity:               Sparkles,
  family_social:          Users,
  behavioural_emotional:  Heart,
  self_care_practical:    Home,
  spiritual_cultural:     Sun,
};

const DOMAIN_CLR: Record<NeedsDomain, string> = {
  health:                 "bg-rose-50 text-rose-700 border-rose-200",
  education:              "bg-blue-50 text-blue-700 border-blue-200",
  identity:               "bg-amber-50 text-amber-700 border-amber-200",
  family_social:          "bg-emerald-50 text-emerald-700 border-emerald-200",
  behavioural_emotional:  "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)] border-[var(--cs-cara-gold-soft)]",
  self_care_practical:    "bg-sky-50 text-sky-700 border-sky-200",
  spiritual_cultural:     "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
};

const COMPLEXITIES: NeedsComplexity[] = ["low", "moderate", "complex", "highly_complex"];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function AssessmentOfNeedPage() {
  const { data: naData, isLoading } = useNeedsAssessments();
  const data = naData?.data ?? [];
  const [search, setSearch] = useState("");
  const [filterYP, setFilterYP] = useState("all");
  const [filterComplexity, setFilterComplexity] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((p) => (p === id ? null : id));

  /* ── derived ─────────────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterYP !== "all" && r.child_id !== filterYP) return false;
      if (filterComplexity !== "all" && r.overall_need_complexity !== filterComplexity) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.child_input.toLowerCase().includes(q) ||
          r.pedagogical_approach_identified.toLowerCase().includes(q) ||
          r.key_risks.some((k) => k.toLowerCase().includes(q)) ||
          r.recommended_interventions.some((k) => k.toLowerCase().includes(q))
        );
      }
      return true;
    });

    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.assessment_date.localeCompare(a.assessment_date);
        case "date-asc":  return a.assessment_date.localeCompare(b.assessment_date);
        case "complexity": {
          const order: NeedsComplexity[] = ["low", "moderate", "complex", "highly_complex"];
          return order.indexOf(b.overall_need_complexity) - order.indexOf(a.overall_need_complexity);
        }
        case "yp": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterYP, filterComplexity, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────────────── */

  const activeAssessments = data.length;
  const withinDeadlinePct = data.length === 0
    ? 0
    : Math.round((data.filter((r) => r.completed_within_deadline).length / data.length) * 100);
  const complexCount = data.filter(
    (r) => r.overall_need_complexity === "complex" || r.overall_need_complexity === "highly_complex",
  ).length;

  // "Reviews due" — assessment is older than 21 days OR not yet signed off
  const reviewsDue = useMemo(() => {
    const today = new Date();
    return data.filter((r) => {
      if (!r.signed_off_by_rm) return true;
      const ad = new Date(r.assessment_date);
      const days = Math.round((today.getTime() - ad.getTime()) / (1000 * 60 * 60 * 24));
      return days >= 21;
    }).length;
  }, [data]);

  const yps = Array.from(new Set(data.map((r) => r.child_id)));

  /* ── export ──────────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<NeedsAssessment>[] = [
    { header: "Young Person", accessor: (r: NeedsAssessment) => getYPName(r.child_id) },
    { header: "Assessment Date", accessor: (r: NeedsAssessment) => r.assessment_date },
    { header: "Completed By", accessor: (r: NeedsAssessment) => getStaffName(r.completed_by) },
    { header: "Version", accessor: (r: NeedsAssessment) => String(r.assessment_version) },
    { header: "Arrival Date", accessor: (r: NeedsAssessment) => r.arrival_date },
    { header: "Statutory Deadline", accessor: (r: NeedsAssessment) => r.statutory_deadline },
    { header: "Within Deadline", accessor: (r: NeedsAssessment) => r.completed_within_deadline ? "Yes" : "No" },
    { header: "Complexity", accessor: (r: NeedsAssessment) => NEEDS_COMPLEXITY_LABEL[r.overall_need_complexity] },
    { header: "Domains Assessed", accessor: (r: NeedsAssessment) => r.domain_assessments.map((da) => NEEDS_DOMAIN_LABEL[da.domain]).join("; ") },
    { header: "Child Input Method", accessor: (r: NeedsAssessment) => r.child_input_method },
    { header: "Child Input", accessor: (r: NeedsAssessment) => r.child_input },
    { header: "Family Input", accessor: (r: NeedsAssessment) => r.family_input },
    { header: "Professionals Consulted", accessor: (r: NeedsAssessment) => r.professionals_consulted.join("; ") },
    { header: "Key Risks", accessor: (r: NeedsAssessment) => r.key_risks.join("; ") },
    { header: "Protective Factors", accessor: (r: NeedsAssessment) => r.key_protective_factors.join("; ") },
    { header: "Recommended Interventions", accessor: (r: NeedsAssessment) => r.recommended_interventions.join("; ") },
    { header: "Accommodations", accessor: (r: NeedsAssessment) => r.accommodations_recommended.join("; ") },
    { header: "Pedagogical Approach", accessor: (r: NeedsAssessment) => r.pedagogical_approach_identified },
    { header: "Review Schedule", accessor: (r: NeedsAssessment) => r.review_schedule },
    { header: "Shared With LA", accessor: (r: NeedsAssessment) => r.shared_with_la ? `Yes (${r.shared_date})` : "No" },
    { header: "Signed Off By RM", accessor: (r: NeedsAssessment) => r.signed_off_by_rm ? "Yes" : "No" },
  ];

  /* ── render ──────────────────────────────────────────────────────────────── */

  return (
    <PageShell
      title="Assessment of Need"
      subtitle="Care Planning Regulations 2010, Reg 14 (28-day report) · Quality Standard 4 — comprehensive baseline assessment on admission"
      caraContext={{ pageTitle: "Assessment of Need", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Assessment of Need" />
          <ExportButton data={filtered} columns={exportCols} filename="assessment-of-need" />
          <CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <div id="print-area">
        {/* ── stat strip ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Active Assessments", value: activeAssessments, icon: ClipboardList, clr: "text-indigo-600" },
            { label: "Within Deadline", value: `${withinDeadlinePct}%`, icon: CheckCircle2, clr: withinDeadlinePct === 100 ? "text-green-600" : "text-amber-600" },
            { label: "Complex / Highly Complex", value: complexCount, icon: Layers, clr: complexCount > 0 ? "text-orange-600" : "text-[var(--cs-text-secondary)]" },
            { label: "Reviews Due", value: reviewsDue, icon: Clock, clr: reviewsDue > 0 ? "text-amber-600" : "text-green-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── overdue / unsigned alert ──────────────────────────────────────── */}
        {data.some((r) => !r.signed_off_by_rm) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">
                {data.filter((r) => !r.signed_off_by_rm).length} assessment(s) awaiting RM sign-off
              </p>
              <p className="text-amber-700">
                Reg 14 requires that the registered manager review and approve each assessment of need before it
                informs the care plan. Unshared assessments must be sent to the placing authority.
              </p>
            </div>
          </div>
        )}

        {/* ── filters ───────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search child, voice, risks, interventions…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {yps.map((y) => (<SelectItem key={y} value={y}>{getYPName(y)}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterComplexity} onValueChange={setFilterComplexity}>
            <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Complexity</SelectItem>
              {COMPLEXITIES.map((c) => (<SelectItem key={c} value={c}>{NEEDS_COMPLEXITY_LABEL[c]}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="complexity">By Complexity</SelectItem>
              <SelectItem value="yp">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── records ───────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expandedId === r.id;
            return (
              <Card
                key={r.id}
                className={cn(
                  "border-l-4",
                  COMPLEXITY_BORDER[r.overall_need_complexity],
                  !r.signed_off_by_rm && "ring-1 ring-amber-300",
                )}
              >
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.child_id)}
                        <Badge variant="outline" className={COMPLEXITY_CLR[r.overall_need_complexity]}>
                          {NEEDS_COMPLEXITY_LABEL[r.overall_need_complexity]}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50">
                          v{r.assessment_version} · {r.assessment_version === 1 ? "Initial" : "Updated"}
                        </Badge>
                        {r.completed_within_deadline ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> On Time
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Late
                          </Badge>
                        )}
                        {!r.signed_off_by_rm && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                            Awaiting RM Sign-off
                          </Badge>
                        )}
                        {!r.shared_with_la && (
                          <Badge variant="outline" className="bg-orange-100 text-orange-800">
                            Not Shared with LA
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Assessed {r.assessment_date} · arrival {r.arrival_date} · deadline {r.statutory_deadline} · by {getStaffName(r.completed_by)}
                      </p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>

                {open && (
                  <CardContent className="pt-0 space-y-5 text-sm">
                    {/* domains */}
                    <div>
                      <p className="font-medium mb-2 flex items-center gap-1">
                        <Layers className="h-4 w-4" /> Domain Assessments
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {r.domain_assessments.map((da) => {
                          const Icon = DOMAIN_ICON[da.domain];
                          return (
                            <div
                              key={da.domain}
                              className={cn("rounded-lg border p-3", DOMAIN_CLR[da.domain])}
                            >
                              <p className="font-semibold flex items-center gap-1.5 mb-2 text-sm">
                                <Icon className="h-4 w-4" /> {NEEDS_DOMAIN_LABEL[da.domain]}
                              </p>
                              <div className="space-y-2 text-xs">
                                <div>
                                  <p className="font-semibold uppercase tracking-wide text-[10px] opacity-80 mb-0.5">Presenting Needs</p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {da.presenting_needs.map((n, i) => (<li key={i}>{n}</li>))}
                                  </ul>
                                </div>
                                <div>
                                  <p className="font-semibold uppercase tracking-wide text-[10px] opacity-80 mb-0.5">Strengths</p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {(da.strengths ?? []).map((n, i) => (<li key={i}>{n}</li>))}
                                  </ul>
                                </div>
                                <div>
                                  <p className="font-semibold uppercase tracking-wide text-[10px] opacity-80 mb-0.5">Priorities</p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {da.priorities.map((n, i) => (<li key={i}>{n}</li>))}
                                  </ul>
                                </div>
                                <div>
                                  <p className="font-semibold uppercase tracking-wide text-[10px] opacity-80 mb-0.5">Immediate Actions</p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {(da.immediate_actions ?? []).map((n, i) => (<li key={i}>{n}</li>))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* voice */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
                        <p className="font-semibold text-indigo-800 flex items-center gap-1 mb-1">
                          <MessageSquare className="h-4 w-4" /> Child&apos;s Voice
                        </p>
                        <p className="text-xs text-[var(--cs-text-secondary)] mb-1"><span className="font-medium">Method:</span> {r.child_input_method}</p>
                        <p className="text-xs text-[var(--cs-text-secondary)]">{r.child_input}</p>
                      </div>
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
                        <p className="font-semibold text-emerald-800 flex items-center gap-1 mb-1">
                          <Users className="h-4 w-4" /> Family Input
                        </p>
                        <p className="text-xs text-[var(--cs-text-secondary)]">{r.family_input}</p>
                      </div>
                    </div>

                    {/* professionals */}
                    <div>
                      <p className="font-medium mb-1">Professionals Consulted</p>
                      <div className="flex flex-wrap gap-1.5">
                        {r.professionals_consulted.map((p, i) => (
                          <Badge key={i} variant="outline" className="bg-slate-50 text-xs">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* risks / protective */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg border border-red-200 bg-red-50/40 p-3">
                        <p className="font-semibold text-red-800 flex items-center gap-1 mb-1">
                          <AlertTriangle className="h-4 w-4" /> Key Risks
                        </p>
                        <ul className="list-disc list-inside text-xs text-[var(--cs-text-secondary)] space-y-0.5">
                          {r.key_risks.map((k, i) => (<li key={i}>{k}</li>))}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-green-200 bg-green-50/40 p-3">
                        <p className="font-semibold text-green-800 flex items-center gap-1 mb-1">
                          <Shield className="h-4 w-4" /> Protective Factors
                        </p>
                        <ul className="list-disc list-inside text-xs text-[var(--cs-text-secondary)] space-y-0.5">
                          {r.key_protective_factors.map((k, i) => (<li key={i}>{k}</li>))}
                        </ul>
                      </div>
                    </div>

                    {/* interventions / accommodations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="font-medium mb-1">Recommended Interventions</p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                          {r.recommended_interventions.map((k, i) => (<li key={i}>{k}</li>))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Accommodations Recommended</p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                          {r.accommodations_recommended.map((k, i) => (<li key={i}>{k}</li>))}
                        </ul>
                      </div>
                    </div>

                    {/* pedagogical approach */}
                    <div className="rounded-lg border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)]/40 p-3">
                      <p className="font-semibold text-[var(--cs-navy)] flex items-center gap-1 mb-1">
                        <Compass className="h-4 w-4" /> Pedagogical Approach Identified
                      </p>
                      <p className="text-xs text-[var(--cs-text-secondary)]">{r.pedagogical_approach_identified}</p>
                    </div>

                    {/* review schedule */}
                    <div>
                      <p className="font-medium mb-1">Review Schedule</p>
                      <p className="text-xs text-muted-foreground">{r.review_schedule}</p>
                    </div>

                    {/* footer */}
                    <div className="flex flex-wrap justify-between items-center pt-2 border-t text-xs text-muted-foreground gap-2">
                      <span>Completed by: {getStaffName(r.completed_by)}</span>
                      <span>
                        {r.shared_with_la
                          ? `Shared with LA: ${r.shared_date}`
                          : "Not yet shared with LA"}
                      </span>
                      <span>{r.signed_off_by_rm ? "RM signed off" : "Awaiting RM sign-off"}</span>
                    </div>

                    {/* smart link panel */}
                    <SmartLinkPanel sourceType="assessment_of_need" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── regulatory note ───────────────────────────────────────────────── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>
            Care Planning, Placement and Case Review (England) Regulations 2010, Reg 14 — within 28 days of
            placement the responsible authority must prepare a written assessment of need that informs and is
            consistent with the child&apos;s care plan. Children&apos;s Homes (England) Regulations 2015 and the
            Quality Standards (in particular Standard 1 — Care and Support, and Standard 4 — Education) require
            that the registered manager satisfies themselves the assessment is comprehensive, child-centred and
            up-to-date. Assessments must capture the child&apos;s wishes and feelings (Children Act 1989, s.22(4)),
            family input where appropriate, and consultation with relevant professionals (health, education,
            CAMHS, Virtual School). Each assessment must identify the therapeutic / pedagogical approach to be
            applied across the home and feed directly into the Care Plan, Behaviour Support Plan and Risk
            Assessment. Records retained until the child&apos;s 75th birthday (Reg 37, looked-after children).
          </p>
        </div>
      </div>
      )}
      <CareEventsPanel
        title="Care Events — Care Planning"
        category="general"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Assessment of Need — Section 47, CIN assessment, LAC assessment, needs analysis, developmental domains, strengths and risks, placement matching, care planning"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
