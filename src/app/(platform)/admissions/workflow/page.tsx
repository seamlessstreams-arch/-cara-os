"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ClipboardList, CheckCircle2, Clock, AlertTriangle,
  Users, FileText, Shield, Home, GraduationCap,
  Heart, Stethoscope, Scale, ChevronRight,
  Plus, ArrowRight, XCircle, UserPlus,
  Brain, Target, TrendingUp, Search,
  ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import {
  ADMISSION_PHASES, PHASE_LABELS, PHASE_DESCRIPTIONS,
  DEFAULT_CHECKLIST_ITEMS,
  type AdmissionPhase, type ChecklistCategory,
} from "@/lib/services/yp-admission-service";

// ── Phase icons ────────────────────────────────────────────────────────────

const PHASE_ICONS: Record<AdmissionPhase, React.ElementType> = {
  referral_intake: FileText,
  initial_screening: Search,
  impact_assessment: Target,
  matching_panel: Users,
  pre_admission: ClipboardList,
  admission_planning: Home,
  placement_start: UserPlus,
  completed: CheckCircle2,
  withdrawn: XCircle,
};

const PHASE_COLORS: Record<AdmissionPhase, string> = {
  referral_intake: "text-blue-600 bg-blue-50 border-blue-200",
  initial_screening: "text-purple-600 bg-purple-50 border-purple-200",
  impact_assessment: "text-indigo-600 bg-indigo-50 border-indigo-200",
  matching_panel: "text-amber-600 bg-amber-50 border-amber-200",
  pre_admission: "text-teal-600 bg-teal-50 border-teal-200",
  admission_planning: "text-orange-600 bg-orange-50 border-orange-200",
  placement_start: "text-green-600 bg-green-50 border-green-200",
  completed: "text-emerald-600 bg-emerald-50 border-emerald-200",
  withdrawn: "text-gray-500 bg-gray-50 border-gray-200",
};

const CATEGORY_ICONS: Record<ChecklistCategory, React.ElementType> = {
  documentation: FileText,
  health: Stethoscope,
  education: GraduationCap,
  safeguarding: Shield,
  environment: Home,
  staffing: Users,
  legal: Scale,
  family: Heart,
  other: ClipboardList,
};

const CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  documentation: "Documentation",
  health: "Health",
  education: "Education",
  safeguarding: "Safeguarding",
  environment: "Environment",
  staffing: "Staffing",
  legal: "Legal",
  family: "Family & Contact",
  other: "Other",
};

// ── Demo workflows ─────────────────────────────────────────────────────────

const DEMO_WORKFLOWS = [
  {
    id: "wf-1",
    child_first_name: "Jayden",
    child_last_name: "Williams",
    child_date_of_birth: "2011-03-15",
    child_gender: "Male",
    current_phase: "impact_assessment" as AdmissionPhase,
    referral_source: "local_authority",
    referring_la: "Manchester City Council",
    referral_date: "2026-04-28",
    presenting_needs: ["Emotional regulation", "Attachment difficulties", "School refusal"],
    risk_factors: ["Self-harm history", "Absconding"],
    previous_placements_count: 3,
    created_at: "2026-04-28",
    aria_risk_summary: "Medium risk — previous placement disruptions and self-harm history require enhanced support plan. Age-appropriate matching with current cohort.",
  },
  {
    id: "wf-2",
    child_first_name: "Amara",
    child_last_name: "Okafor",
    child_date_of_birth: "2012-09-22",
    child_gender: "Female",
    current_phase: "pre_admission" as AdmissionPhase,
    referral_source: "local_authority",
    referring_la: "Birmingham City Council",
    referral_date: "2026-04-15",
    presenting_needs: ["PTSD", "Cultural identity support", "Language support"],
    risk_factors: ["CSE vulnerability indicator"],
    previous_placements_count: 1,
    created_at: "2026-04-15",
    aria_risk_summary: "Elevated safeguarding attention needed — CSE vulnerability identified. Strong protective factors including family engagement and educational motivation.",
  },
  {
    id: "wf-3",
    child_first_name: "Tyler",
    child_last_name: "Robinson",
    child_date_of_birth: "2010-07-01",
    child_gender: "Male",
    current_phase: "referral_intake" as AdmissionPhase,
    referral_source: "emergency",
    referring_la: "Leeds City Council",
    referral_date: "2026-05-10",
    presenting_needs: ["Emergency placement", "Physical aggression", "Substance experimentation"],
    risk_factors: ["Physical aggression to peers", "Substance use", "CCE indicators"],
    previous_placements_count: 5,
    created_at: "2026-05-10",
    aria_risk_summary: "High risk referral — multiple placement breakdowns and significant risk factors. Full impact assessment critical before progression. Not recommended for current cohort without enhanced staffing.",
  },
  {
    id: "wf-4",
    child_first_name: "Sophia",
    child_last_name: "Chen",
    child_date_of_birth: "2013-12-05",
    child_gender: "Female",
    current_phase: "completed" as AdmissionPhase,
    referral_source: "local_authority",
    referring_la: "Salford City Council",
    referral_date: "2026-02-01",
    presenting_needs: ["Anxiety disorder", "Social withdrawal"],
    risk_factors: [],
    previous_placements_count: 0,
    created_at: "2026-02-01",
    aria_risk_summary: "Low risk — first placement, strong family support, good educational engagement. Standard monitoring recommended.",
  },
];

// ── Demo matching factors ──────────────────────────────────────────────────

const DEMO_MATCHING = [
  { factor_type: "age_compatibility", score: 8, rationale: "Close age match with current cohort (11-14 range)", risk_level: "low" },
  { factor_type: "environmental_capacity", score: 7, rationale: "Home has 1 vacancy — placement would bring to capacity", risk_level: "medium" },
  { factor_type: "risk_compatibility", score: 5, rationale: "Self-harm history requires enhanced monitoring alongside current YP with similar needs", risk_level: "medium" },
  { factor_type: "needs_compatibility", score: 6, rationale: "Attachment difficulties align with home's therapeutic approach", risk_level: "medium" },
  { factor_type: "relationship_dynamics", score: 4, rationale: "3 previous placements indicate potential relationship challenges", risk_level: "high" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function getAge(dob: string): number {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 86400000));
}

function getPhaseIndex(phase: AdmissionPhase): number {
  return ADMISSION_PHASES.indexOf(phase);
}

function getDaysSince(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

// ══════════════════════════════════════════════════════════════════════════════

type ViewMode = "list" | "detail";

export default function AdmissionWorkflowPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phaseFilter, setPhaseFilter] = useState<"all" | "active" | "completed">("all");
  const [expandedChecklist, setExpandedChecklist] = useState<Set<string>>(new Set(["documentation", "safeguarding"]));

  const filtered = useMemo(() => {
    if (phaseFilter === "all") return DEMO_WORKFLOWS;
    if (phaseFilter === "active") return DEMO_WORKFLOWS.filter((w) => !["completed", "withdrawn"].includes(w.current_phase));
    return DEMO_WORKFLOWS.filter((w) => ["completed", "withdrawn"].includes(w.current_phase));
  }, [phaseFilter]);

  const selected = selectedId ? DEMO_WORKFLOWS.find((w) => w.id === selectedId) : null;

  // Count active
  const activeCount = DEMO_WORKFLOWS.filter((w) => !["completed", "withdrawn"].includes(w.current_phase)).length;

  return (
    <PageShell title="Admission Workflow" subtitle="Full referral-to-placement journey with ARIA intelligence">
      {viewMode === "list" ? (
        <div className="space-y-6">
          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryCard label="Active Workflows" value={activeCount} icon={Clock} color="text-blue-600 bg-blue-50" />
            <SummaryCard label="In Assessment" value={DEMO_WORKFLOWS.filter((w) => ["initial_screening", "impact_assessment"].includes(w.current_phase)).length} icon={Target} color="text-purple-600 bg-purple-50" />
            <SummaryCard label="Pre-Admission" value={DEMO_WORKFLOWS.filter((w) => ["pre_admission", "admission_planning"].includes(w.current_phase)).length} icon={ClipboardList} color="text-teal-600 bg-teal-50" />
            <SummaryCard label="Placed This Year" value={DEMO_WORKFLOWS.filter((w) => w.current_phase === "completed").length} icon={CheckCircle2} color="text-emerald-600 bg-emerald-50" />
          </div>

          {/* Phase filter */}
          <div className="flex items-center gap-2">
            {(["all", "active", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setPhaseFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                  phaseFilter === f ? "bg-[var(--cs-primary)] text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200",
                )}
              >
                {f === "all" ? "All" : f === "active" ? "Active" : "Completed"}
              </button>
            ))}
            <div className="flex-1" />
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> New Referral
            </Button>
          </div>

          {/* Workflow cards */}
          <div className="space-y-3">
            {filtered.map((wf) => {
              const phaseIdx = getPhaseIndex(wf.current_phase);
              const age = getAge(wf.child_date_of_birth);
              const days = getDaysSince(wf.referral_date);
              const PhaseIcon = PHASE_ICONS[wf.current_phase];

              return (
                <Card
                  key={wf.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
                  style={{ borderLeftColor: wf.current_phase === "completed" ? "#10b981" : (wf.risk_factors?.length ?? 0) > 2 ? "#ef4444" : "#6366f1" }}
                  onClick={() => { setSelectedId(wf.id); setViewMode("detail"); }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Phase icon */}
                      <div className={cn("flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center", PHASE_COLORS[wf.current_phase])}>
                        <PhaseIcon className="h-6 w-6" />
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {wf.child_first_name} {wf.child_last_name}
                          </h3>
                          <Badge className={cn("text-xs shrink-0", PHASE_COLORS[wf.current_phase])}>
                            {PHASE_LABELS[wf.current_phase]}
                          </Badge>
                          {wf.referral_source === "emergency" && (
                            <Badge className="bg-red-100 text-red-700 text-xs shrink-0">Emergency</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          <span>Age {age}</span>
                          <span className="text-gray-300">|</span>
                          <span>{wf.child_gender}</span>
                          <span className="text-gray-300">|</span>
                          <span>{wf.referring_la}</span>
                          <span className="text-gray-300">|</span>
                          <span>{days} days in workflow</span>
                        </div>

                        {/* Progress bar */}
                        <div className="flex items-center gap-2 mb-2">
                          {ADMISSION_PHASES.map((phase, idx) => (
                            <div
                              key={phase}
                              className={cn(
                                "h-1.5 flex-1 rounded-full transition-colors",
                                idx < phaseIdx ? "bg-emerald-400" : idx === phaseIdx ? "bg-blue-500" : "bg-gray-200",
                                wf.current_phase === "completed" && "bg-emerald-400",
                              )}
                            />
                          ))}
                        </div>

                        {/* Needs & risk tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {wf.presenting_needs.slice(0, 3).map((n) => (
                            <span key={n} className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">{n}</span>
                          ))}
                          {(wf.risk_factors ?? []).slice(0, 2).map((r) => (
                            <span key={r} className="px-2 py-0.5 text-xs rounded-full bg-red-50 text-red-600">{r}</span>
                          ))}
                          {wf.presenting_needs.length + (wf.risk_factors?.length ?? 0) > 5 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">
                              +{wf.presenting_needs.length + (wf.risk_factors?.length ?? 0) - 5} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="h-5 w-5 text-gray-400 shrink-0 mt-1" />
                    </div>

                    {/* ARIA insight */}
                    {wf.aria_risk_summary && (
                      <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-violet-50 border border-violet-100">
                        <Sparkles className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-violet-700 leading-relaxed">{wf.aria_risk_summary}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : selected ? (
        <WorkflowDetail
          workflow={selected}
          matchingFactors={DEMO_MATCHING}
          expandedChecklist={expandedChecklist}
          setExpandedChecklist={setExpandedChecklist}
          onBack={() => { setViewMode("list"); setSelectedId(null); }}
        />
      ) : null}
    </PageShell>
  );
}

// ── Summary card ───────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Workflow detail view ───────────────────────────────────────────────────

function WorkflowDetail({
  workflow,
  matchingFactors,
  expandedChecklist,
  setExpandedChecklist,
  onBack,
}: {
  workflow: (typeof DEMO_WORKFLOWS)[0];
  matchingFactors: typeof DEMO_MATCHING;
  expandedChecklist: Set<string>;
  setExpandedChecklist: React.Dispatch<React.SetStateAction<Set<string>>>;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "matching" | "checklist" | "aria">("overview");
  const age = getAge(workflow.child_date_of_birth);
  const phaseIdx = getPhaseIndex(workflow.current_phase);
  const nextPhase = phaseIdx < ADMISSION_PHASES.length - 1 ? ADMISSION_PHASES[phaseIdx + 1] : null;

  return (
    <div className="space-y-6">
      {/* Back button & header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to list
        </button>
      </div>

      {/* Child header */}
      <div className="flex items-start gap-4">
        <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-bold", PHASE_COLORS[workflow.current_phase])}>
          {workflow.child_first_name[0]}{workflow.child_last_name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">{workflow.child_first_name} {workflow.child_last_name}</h2>
            <Badge className={cn(PHASE_COLORS[workflow.current_phase])}>{PHASE_LABELS[workflow.current_phase]}</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
            <span>Age {age}</span>
            <span>{workflow.child_gender}</span>
            <span>{workflow.referring_la}</span>
            <span>Referred {new Date(workflow.referral_date).toLocaleDateString("en-GB")}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {nextPhase && workflow.current_phase !== "completed" && workflow.current_phase !== "withdrawn" && (
            <Button size="sm" className="gap-1.5">
              <ArrowRight className="h-4 w-4" /> Advance to {PHASE_LABELS[nextPhase]}
            </Button>
          )}
        </div>
      </div>

      {/* Phase timeline */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Workflow Progress</h3>
          <div className="flex items-center gap-0">
            {ADMISSION_PHASES.map((phase, idx) => {
              const PhIcon = PHASE_ICONS[phase];
              const isCurrent = phase === workflow.current_phase;
              const isPast = idx < phaseIdx || workflow.current_phase === "completed";
              const isFuture = idx > phaseIdx && workflow.current_phase !== "completed";

              return (
                <React.Fragment key={phase}>
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors",
                      isPast ? "bg-emerald-500 border-emerald-500 text-white" :
                      isCurrent ? "bg-blue-500 border-blue-500 text-white" :
                      "bg-white border-gray-200 text-gray-400",
                    )}>
                      {isPast && !isCurrent ? <CheckCircle2 className="h-5 w-5" /> : <PhIcon className="h-5 w-5" />}
                    </div>
                    <span className={cn(
                      "text-[10px] text-center leading-tight font-medium",
                      isPast ? "text-emerald-600" : isCurrent ? "text-blue-600" : "text-gray-400",
                    )}>
                      {PHASE_LABELS[phase]}
                    </span>
                  </div>
                  {idx < ADMISSION_PHASES.length - 1 && (
                    <div className={cn(
                      "h-0.5 flex-1 -mt-6",
                      idx < phaseIdx || workflow.current_phase === "completed" ? "bg-emerald-400" : "bg-gray-200",
                    )} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {(["overview", "matching", "checklist", "aria"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-[1px] transition-colors",
              activeTab === tab ? "border-[var(--cs-primary)] text-[var(--cs-primary)]" : "border-transparent text-gray-500 hover:text-gray-700",
            )}
          >
            {tab === "overview" ? "Overview" : tab === "matching" ? "Matching Analysis" : tab === "checklist" ? "Pre-Admission Checklist" : "ARIA Insights"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab workflow={workflow} />}
      {activeTab === "matching" && <MatchingTab factors={matchingFactors} />}
      {activeTab === "checklist" && (
        <ChecklistTab expanded={expandedChecklist} setExpanded={setExpandedChecklist} />
      )}
      {activeTab === "aria" && <AriaTab workflow={workflow} />}
    </div>
  );
}

// ── Overview tab ───────────────────────────────────────────────────────────

function OverviewTab({ workflow }: { workflow: (typeof DEMO_WORKFLOWS)[0] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Presenting needs */}
      <Card>
        <CardContent className="p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-indigo-500" /> Presenting Needs
          </h4>
          <div className="flex flex-wrap gap-2">
            {workflow.presenting_needs.map((n) => (
              <Badge key={n} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">{n}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk factors */}
      <Card>
        <CardContent className="p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" /> Risk Factors
          </h4>
          {workflow.risk_factors.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {workflow.risk_factors.map((r) => (
                <Badge key={r} variant="outline" className="bg-red-50 text-red-700 border-red-200">{r}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No identified risk factors</p>
          )}
        </CardContent>
      </Card>

      {/* Referral details */}
      <Card>
        <CardContent className="p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" /> Referral Details
          </h4>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Source</dt>
              <dd className="font-medium text-gray-900 capitalize">{workflow.referral_source.replace(/_/g, " ")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Local Authority</dt>
              <dd className="font-medium text-gray-900">{workflow.referring_la}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Referral Date</dt>
              <dd className="font-medium text-gray-900">{new Date(workflow.referral_date).toLocaleDateString("en-GB")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Previous Placements</dt>
              <dd className="font-medium text-gray-900">{workflow.previous_placements_count}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Placement history */}
      <Card>
        <CardContent className="p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-500" /> Placement History
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold",
                workflow.previous_placements_count > 3 ? "bg-red-100 text-red-700" :
                workflow.previous_placements_count > 1 ? "bg-amber-100 text-amber-700" :
                "bg-green-100 text-green-700",
              )}>
                {workflow.previous_placements_count}
              </div>
              <span className="text-sm text-gray-600">
                Previous placement{workflow.previous_placements_count !== 1 ? "s" : ""}
              </span>
            </div>
            {workflow.previous_placements_count > 3 && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                Multiple placement breakdowns may indicate complex needs requiring enhanced support planning
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Matching tab ───────────────────────────────────────────────────────────

function MatchingTab({ factors }: { factors: typeof DEMO_MATCHING }) {
  const avgScore = factors.reduce((s, f) => s + f.score, 0) / factors.length;
  const highRisk = factors.filter((f) => f.risk_level === "high").length;

  const FACTOR_LABELS: Record<string, string> = {
    age_compatibility: "Age Compatibility",
    environmental_capacity: "Environmental Capacity",
    risk_compatibility: "Risk Compatibility",
    needs_compatibility: "Needs Compatibility",
    relationship_dynamics: "Relationship Dynamics",
    gender_dynamics: "Gender Dynamics",
    cultural_needs: "Cultural Needs",
    staff_skills: "Staff Skills",
    therapeutic_approach: "Therapeutic Approach",
    education_alignment: "Education Alignment",
    family_contact_logistics: "Family Contact Logistics",
    peer_group_dynamics: "Peer Group Dynamics",
  };

  return (
    <div className="space-y-4">
      {/* Overall score */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" /> ARIA Matching Analysis
            </h4>
            <Badge className={cn(
              "text-sm",
              avgScore >= 7 ? "bg-green-100 text-green-700" :
              avgScore >= 5 ? "bg-amber-100 text-amber-700" :
              "bg-red-100 text-red-700",
            )}>
              Overall: {avgScore.toFixed(1)}/10
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-900">{avgScore.toFixed(1)}</p>
              <p className="text-xs text-gray-500">Average Score</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-900">{factors.length}</p>
              <p className="text-xs text-gray-500">Factors Assessed</p>
            </div>
            <div className={cn("rounded-lg p-3", highRisk > 0 ? "bg-red-50" : "bg-green-50")}>
              <p className={cn("text-2xl font-bold", highRisk > 0 ? "text-red-700" : "text-green-700")}>{highRisk}</p>
              <p className="text-xs text-gray-500">High-Risk Factors</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual factors */}
      <div className="space-y-3">
        {factors.map((f) => (
          <Card key={f.factor_type}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold",
                  f.score >= 7 ? "bg-green-100 text-green-700" :
                  f.score >= 5 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700",
                )}>
                  {f.score}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-semibold text-gray-900">{FACTOR_LABELS[f.factor_type] ?? f.factor_type}</h5>
                    <Badge className={cn(
                      "text-[10px]",
                      f.risk_level === "high" ? "bg-red-100 text-red-700" :
                      f.risk_level === "medium" ? "bg-amber-100 text-amber-700" :
                      "bg-green-100 text-green-700",
                    )}>
                      {f.risk_level} risk
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{f.rationale}</p>
                </div>
                {/* Score bar */}
                <div className="w-24 shrink-0">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        f.score >= 7 ? "bg-green-500" : f.score >= 5 ? "bg-amber-500" : "bg-red-500",
                      )}
                      style={{ width: `${f.score * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Checklist tab ──────────────────────────────────────────────────────────

function ChecklistTab({
  expanded,
  setExpanded,
}: {
  expanded: Set<string>;
  setExpanded: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  // Group checklist items by category
  const grouped = useMemo(() => {
    const map: Record<string, typeof DEFAULT_CHECKLIST_ITEMS> = {};
    for (const item of DEFAULT_CHECKLIST_ITEMS) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, []);

  // Demo completion state (first few items completed)
  const [completed, setCompleted] = useState<Set<number>>(new Set([0, 1, 7, 8, 17, 24]));

  const totalItems = DEFAULT_CHECKLIST_ITEMS.length;
  const completedCount = completed.size;
  const mandatoryItems = DEFAULT_CHECKLIST_ITEMS.filter((i) => i.is_mandatory);
  const mandatoryComplete = mandatoryItems.filter((_, idx) => completed.has(DEFAULT_CHECKLIST_ITEMS.indexOf(mandatoryItems[idx]))).length;

  const toggleCategory = (cat: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Progress overview */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Checklist Progress</h4>
            <span className="text-sm font-mono text-gray-600">{completedCount}/{totalItems}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.round((completedCount / totalItems) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{mandatoryComplete}/{mandatoryItems.length} mandatory items complete</span>
            <span>{Math.round((completedCount / totalItems) * 100)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Category sections */}
      {Object.entries(grouped).map(([cat, items]) => {
        const CatIcon = CATEGORY_ICONS[cat as ChecklistCategory] ?? ClipboardList;
        const isExpanded = expanded.has(cat);
        const catCompleted = items.filter((_, i) => {
          const globalIdx = DEFAULT_CHECKLIST_ITEMS.indexOf(items[i]);
          return completed.has(globalIdx);
        }).length;

        return (
          <Card key={cat}>
            <button
              onClick={() => toggleCategory(cat)}
              className="w-full text-left p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors rounded-t-xl"
            >
              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <CatIcon className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-semibold text-gray-900">{CATEGORY_LABELS[cat as ChecklistCategory] ?? cat}</h5>
                  <span className="text-xs text-gray-500">{catCompleted}/{items.length}</span>
                </div>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>

            {isExpanded && (
              <CardContent className="px-4 pb-4 pt-0 space-y-2">
                {items.map((item, i) => {
                  const globalIdx = DEFAULT_CHECKLIST_ITEMS.indexOf(items[i]);
                  const isDone = completed.has(globalIdx);

                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                        isDone ? "bg-emerald-50" : "hover:bg-gray-50",
                      )}
                      onClick={() => {
                        setCompleted((prev) => {
                          const next = new Set(prev);
                          if (next.has(globalIdx)) next.delete(globalIdx); else next.add(globalIdx);
                          return next;
                        });
                      }}
                    >
                      <div className={cn(
                        "h-5 w-5 rounded flex items-center justify-center border-2 shrink-0",
                        isDone ? "bg-emerald-500 border-emerald-500" : "border-gray-300",
                      )}>
                        {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <span className={cn("text-sm flex-1", isDone ? "text-gray-500 line-through" : "text-gray-700")}>
                        {item.item_text}
                      </span>
                      {item.is_mandatory && (
                        <Badge className="text-[10px] bg-amber-50 text-amber-600 border-amber-200 shrink-0">Required</Badge>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ── ARIA insights tab ──────────────────────────────────────────────────────

function AriaTab({ workflow }: { workflow: (typeof DEMO_WORKFLOWS)[0] }) {
  const insights = [
    {
      type: "risk_assessment",
      title: "ARIA Risk Summary",
      content: workflow.aria_risk_summary ?? "No risk summary available",
      severity: workflow.risk_factors.length > 2 ? "high" : workflow.risk_factors.length > 0 ? "medium" : "low",
    },
    {
      type: "placement_stability",
      title: "Placement Stability Prediction",
      content: workflow.previous_placements_count > 3
        ? "This young person has experienced multiple placement breakdowns. ARIA recommends an enhanced transition plan with daily key work sessions for the first two weeks, therapeutic life story work, and a stepped approach to boundaries."
        : workflow.previous_placements_count > 1
          ? "Some placement history suggests moderate disruption risk. Standard transition plan with enhanced monitoring for the first month recommended."
          : "First or second placement — standard transition plan appropriate. Monitor settling-in closely for the first two weeks.",
      severity: workflow.previous_placements_count > 3 ? "high" : "medium",
    },
    {
      type: "therapeutic_approach",
      title: "Suggested Therapeutic Framework",
      content: workflow.presenting_needs.some((n) => n.toLowerCase().includes("attachment"))
        ? "PACE (Playfulness, Acceptance, Curiosity, Empathy) approach recommended based on identified attachment difficulties. Consider DDP-informed practice and ensure key worker has Level 3 attachment training."
        : workflow.presenting_needs.some((n) => n.toLowerCase().includes("ptsd") || n.toLowerCase().includes("trauma"))
          ? "ARC (Attachment, Regulation, Competency) framework recommended based on trauma presentation. Staff may benefit from TF-CBT awareness training."
          : "Standard relational safeguarding approach appropriate. Review therapeutic framework after the initial assessment period.",
      severity: "info",
    },
    {
      type: "transition_planning",
      title: "Transition Recommendations",
      content: "ARIA suggests: 1) Pre-admission visit to include the child's favourite meal, 2) Photo book of their bedroom and communal areas shared before admission, 3) Introductions to each young person individually rather than as a group, 4) First 48 hours focus on comfort and routine — avoid formal meetings.",
      severity: "info",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 border border-violet-100 mb-2">
        <Sparkles className="h-4 w-4 text-violet-500" />
        <p className="text-xs text-violet-700">ARIA analyses referral data, risk factors, and the current young people in the home to generate placement intelligence. All suggestions require professional judgement.</p>
      </div>

      {insights.map((insight, idx) => (
        <Card key={idx}>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                insight.severity === "high" ? "bg-red-100" :
                insight.severity === "medium" ? "bg-amber-100" :
                "bg-violet-100",
              )}>
                {insight.severity === "high" ? <AlertTriangle className="h-4 w-4 text-red-600" /> :
                 insight.severity === "medium" ? <AlertTriangle className="h-4 w-4 text-amber-600" /> :
                 <Sparkles className="h-4 w-4 text-violet-600" />}
              </div>
              <div>
                <h5 className="text-sm font-semibold text-gray-900 mb-1">{insight.title}</h5>
                <p className="text-sm text-gray-600 leading-relaxed">{insight.content}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
