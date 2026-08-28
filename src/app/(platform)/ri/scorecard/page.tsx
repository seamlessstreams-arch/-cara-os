"use client";

// ── useHomeName (inlined from use-home-profile) ─────────────────────────────

interface HomeProfile {
  id: string;
  name: string;
  address: string;
  ofsted_urn: string | null;
}

interface HomeProfileResult {
  provisioned: boolean;
  home: HomeProfile | null;
}

function useHomeProfile() {
  return useQuery({
    queryKey: ["home-profile"],
    // apiFetch returns the route's envelope verbatim — {data: {...}} — so the
    // payload must be unwrapped here. Shipped without this, the hook read
    // undefined and served the fallback in BOTH modes: live looked correct by
    // coincidence (fallback is right there pre-provisioning), and the demo
    // sidebar quietly said "This home" instead of the seeded name.
    queryFn: () =>
      api.get<{ data: HomeProfileResult }>("/home-profile").then((r) => r.data),
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  });
}

function useHomeName(fallback = "This home"): string {
  const { data } = useHomeProfile();
  return data?.home?.name?.trim() || fallback;
}
import React, { useState, useMemo } from "react";
import type { CareForm, DailyLogEntry } from "@/types";
import type { Audit } from "@/types/extended";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RiChallengeLog, RiAlert, RiReg45Evidence, TrainingNeed } from "@/types/extended";

type ListResponse<T> = { data: T[]; meta: Record<string, unknown> };

function useRiChallengeLogs(params: { homeId: string }) {
  return useQuery({
    queryKey: ["ri", "challenge-logs", params.homeId],
    queryFn: () =>
      api.get<ListResponse<RiChallengeLog>>(
        `/ri/challenge-logs?home_id=${params.homeId}`
      ),
  });
}

function useRiAlerts(params: { homeId: string }) {
  return useQuery({
    queryKey: ["ri", "alerts", params.homeId],
    queryFn: () =>
      api.get<ListResponse<RiAlert> & { meta: { critical: number; unresolved: number } }>(
        `/ri/alerts?home_id=${params.homeId}`
      ),
  });
}

function useRiReg45Evidence(params: { homeId: string }) {
  return useQuery({
    queryKey: ["ri", "reg45", params.homeId],
    queryFn: () =>
      api.get<ListResponse<RiReg45Evidence>>(
        `/ri/reg45?home_id=${params.homeId}`
      ),
  });
}

function useTrainingNeeds(params: { homeId: string }) {
  return useQuery({
    queryKey: ["learning", "training-needs", params.homeId],
    queryFn: () =>
      api.get<ListResponse<TrainingNeed> & { meta: { urgent: number; total: number } }>(
        `/learning/training-needs?home_id=${params.homeId}`
      ),
  });
}

// ── Inlined from the former use-training hook ─────────────────────────────────
interface TrainingMeta {
  total: number;
  compliant: number;
  expiring: number;
  expired: number;
  not_started: number;
  rate: number;
}

function useTraining(params?: { staff_id?: string; status?: string; category?: string }) {
  const query = new URLSearchParams();
  if (params?.staff_id) query.set("staff_id", params.staff_id);
  if (params?.status) query.set("status", params.status);
  if (params?.category) query.set("category", params.category);

  return useQuery({
    queryKey: ["training", params],
    queryFn: () =>
      api.get<{ data: TrainingRecord[]; meta: TrainingMeta }>(`/training?${query}`),
  });
}

// Types from use-audits
export interface AuditsResponse {
  data: Audit[];
  meta: { total: number; completed: number; scheduled: number; in_progress: number; overdue: number };
}

interface FormsListResponse {
  data: CareForm[];
  meta: {
    total: number;
    draft: number;
    pending_review: number;
    approved: number;
    overdue: number;
    urgent: number;
  };
}

const FORM_KEYS = {
  all:   ["forms"] as const,
  list:  (params?: Record<string, string>) => ["forms", "list", params] as const,
  detail: (id: string) => ["forms", "detail", id] as const,
};

function authHeaders() {
  return { "Content-Type": "application/json", "X-User-Id": currentUserId() };
}

import { currentUserId } from "@/lib/auth/current-user";

// ── Inlined from use-recruitment ─────────────────────────────────────────────

type CheckStatus =
  | "not_started"
  | "requested"
  | "in_progress"
  | "received"
  | "verified"
  | "concern_flagged"
  | "override_approved"
  | "not_required";

type CheckType =
  | "enhanced_dbs"
  | "right_to_work"
  | "identity"
  | "references"
  | "overseas_criminal_record"
  | "qualifications"
  | "employment_history"
  | "medical_fitness"
  | "prohibition_from_teaching"
  | "disqualification_by_association"
  | "section_128"
  | "childcare_disqualification";

type RiskLevel = "low" | "medium" | "high" | "critical";

interface RecruitmentCheck {
  id: string;
  candidate_id: string;
  check_type: CheckType;
  status: CheckStatus;
  owner: string | null;
  requested_date: string | null;
  received_date: string | null;
  verified_by: string | null;
  verified_at: string | null;
  expiry_date: string | null;
  certificate_number: string | null;
  document_type: string | null;
  concern_flag: boolean;
  concern_notes: string | null;
  override_reason: string | null;
  override_by: string | null;
  override_at: string | null;
  risk_mitigation: string | null;
  notes: string | null;
  home_id: string;
  created_at: string;
  updated_at: string;
}

interface RecruitmentReference {
  id: string;
  candidate_id: string;
  referee_name: string;
  referee_org: string | null;
  referee_role: string | null;
  referee_email: string | null;
  referee_phone: string | null;
  relationship: string;
  is_most_recent_employer: boolean;
  status: "not_requested" | "requested" | "received" | "satisfactory" | "unsatisfactory" | "uncontactable";
  requested_date: string | null;
  received_date: string | null;
  employment_dates_confirmed: boolean | null;
  role_confirmed: boolean | null;
  performance_rating: string | null;
  safeguarding_concerns: boolean | null;
  safeguarding_detail: string | null;
  would_re_employ: boolean | null;
  would_re_employ_reason: string | null;
  discrepancy_flag: boolean;
  discrepancy_notes: string | null;
  home_id: string;
  created_at: string;
  updated_at: string;
}

interface EmploymentHistoryEntry {
  id: string;
  candidate_id: string;
  employer: string;
  role_title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  reason_for_leaving: string | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  home_id: string;
  created_at: string;
}

interface EmploymentGap {
  id: string;
  candidate_id: string;
  gap_start: string;
  gap_end: string;
  gap_days: number;
  explanation: string | null;
  review_status: "unreviewed" | "satisfactory" | "concern" | "override";
  reviewed_by: string | null;
  reviewed_at: string | null;
  home_id: string;
}

interface Interview {
  id: string;
  candidate_id: string;
  scheduled_at: string;
  mode: "in_person" | "video" | "phone";
  location: string | null;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  panel_members: string[];
  safer_recruitment_trained: boolean;
  recommendation: "proceed" | "decline" | "hold" | null;
  overall_score: number | null;
  scores_by_category: Record<string, number> | null;
  notes: string | null;
  home_id: string;
  created_at: string;
}

interface Offer {
  id: string;
  candidate_id: string;
  status: "not_made" | "conditional" | "unconditional" | "accepted" | "declined" | "withdrawn";
  offer_date: string | null;
  proposed_start_date: string | null;
  role_title: string;
  salary: number | null;
  hours_per_week: number | null;
  exceptional_start: boolean;
  exceptional_start_risk_mitigation: string | null;
  final_clearance_given: boolean;
  final_clearance_date: string | null;
  final_clearance_by: string | null;
  contract_generated: boolean;
  contract_generated_at: string | null;
  home_id: string;
  created_at: string;
}

interface RecruitmentAuditEntry {
  id: string;
  candidate_id: string;
  event_type: string;
  actor: string;
  actor_role: string;
  summary: string;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  performed_at: string;
  home_id: string;
}

interface Vacancy {
  id: string;
  home_id: string;
  role_title: string;
  employment_type: "permanent" | "fixed_term" | "bank" | "agency";
  salary_min: number | null;
  salary_max: number | null;
  hours_per_week: number | null;
  status: "draft" | "active" | "filled" | "closed";
  posted_date: string | null;
  applications_count: number;
  days_open: number;
  created_at: string;
}

interface CandidateDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role_applied: string;
  stage: string;
  source: string | null;
  cv_url: string | null;
  compliance_score: number;
  risk_level: RiskLevel;
  days_in_stage: number;
  days_total: number;
  manager_assigned: string | null;
  interview_date: string | null;
  interview_notes: string | null;
  offer_date: string | null;
  start_date: string | null;
  notes: string | null;
  blocker_summary: string[];
  next_actions: string[];
  checks: RecruitmentCheck[];
  references: RecruitmentReference[];
  employment_history: EmploymentHistoryEntry[];
  employment_gaps: EmploymentGap[];
  interviews: Interview[];
  offer: Offer | null;
  audit: RecruitmentAuditEntry[];
  home_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

interface ComplianceAlert {
  candidate_id: string;
  candidate_name: string;
  issue: string;
  severity: "warning" | "critical";
  check_type: CheckType | null;
}

interface RecruitmentOverview {
  candidates: CandidateDetail[];
  vacancies: Vacancy[];
  alerts: ComplianceAlert[];
  stats: {
    total_active: number;
    blocked: number;
    exceptional_starts: number;
    avg_days_to_appoint: number;
  };
}

function useRecruitment() {
  return useQuery({
    queryKey: ["recruitment"],
    queryFn: () => api.get<RecruitmentOverview>("/recruitment"),
  });
}

interface YPEnriched extends YoungPerson {
  age: number;
  key_worker: StaffMember | null;
  secondary_worker: StaffMember | null;
  open_incidents: number;
  active_tasks: number;
  missing_episodes_total: number;
  last_log_date: string | null;
  active_medications: number;
  risk_flags_count: number;
}

function useYoungPeople(status = "current") {
  return useQuery({
    queryKey: ["young-people", status],
    queryFn: () =>
      api.get<{ data: YPEnriched[]; meta: Record<string, number> }>(
        `/young-people?status=${status}`
      ),
  });
}
import { computeRiScores } from "@/lib/ri/compute-scores";
import { below, meanOf, meets } from "@/lib/metrics/rate";
import { Sparkles, TrendingUp, TrendingDown, Minus, BarChart3, Zap, Shield, Users, Heart, FileCheck } from "lucide-react";
import { api } from "@/hooks/use-api";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import type { Incident, Supervision, TrainingRecord, YoungPerson, StaffMember } from "@/types";

// ── Incidents query (inlined from use-incidents) ──────────────────────────────

function useIncidents(params?: { status?: string; child_id?: string; needs_oversight?: boolean }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.child_id) query.set("child_id", params.child_id);
  if (params?.needs_oversight) query.set("needs_oversight", "true");

  return useQuery({
    queryKey: ["incidents", params],
    queryFn: () => api.get<{ data: Incident[]; meta: Record<string, number> }>(`/incidents?${query}`),
  });
}

// ── Inlined from use-supervision ────────────────────────────────────────────────
const SUPERVISION_API = "/api/v1/supervision";

function supervisionAuthHeaders() {
  return { "Content-Type": "application/json", "X-User-Id": currentUserId() };
}

interface SupervisionListResponse {
  data: Supervision[];
  meta: {
    total: number;
    overdue: number;
    due_soon: number;
    scheduled: number;
    completed: number;
    today: string;
  };
}

const SUPERVISION_KEYS = {
  all:    ["supervisions"] as const,
  list:   (params?: Record<string, string>) => ["supervisions", "list", params] as const,
  detail: (id: string) => ["supervisions", "detail", id] as const,
};

function useSupervisions(params?: Record<string, string>) {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  return useQuery<SupervisionListResponse>({
    queryKey: SUPERVISION_KEYS.list(params),
    queryFn: async () => {
      const res = await fetch(`${SUPERVISION_API}${query}`, { headers: supervisionAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch supervisions");
      return res.json();
    },
  });
}

type StrategicResult = {
  overall_governance_narrative: string;
  safeguarding_analysis: string;
  outcome_evidence: string;
  management_effectiveness: string;
  compliance_position: string;
  key_strengths: string[];
  areas_requiring_attention: string[];
  immediate_ri_actions: string[];
  challenge_questions_for_manager: string[];
  ofsted_readiness_summary: string;
  risk_level: string;
};

function ScoreBar({ label, score, prev }: { label: string; score: number | null; prev?: number }) {
  const colour = meets(score, 80) ? "bg-emerald-500" : meets(score, 65) ? "bg-amber-400" : meets(score, 50) ? "bg-orange-400" : below(score, 50) ? "bg-red-500" : "bg-slate-200";
  const textColour = meets(score, 80) ? "text-emerald-700" : meets(score, 65) ? "text-amber-700" : meets(score, 50) ? "text-orange-700" : below(score, 50) ? "text-red-700" : "text-[var(--cs-text-muted)]";
  const delta = prev !== undefined && score !== null ? score - prev : undefined;

  return (
    <div className="group space-y-1.5 p-3 rounded-xl hover:bg-[var(--cs-surface)] transition-colors">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--cs-text-secondary)] font-medium">{label}</span>
        <div className="flex items-center gap-1.5">
          {delta !== undefined && (
            <span className={cn("text-[10px]", delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-600" : "text-[var(--cs-text-muted)]")}>
              {delta > 0 ? <TrendingUp className="h-3 w-3 inline" /> : delta < 0 ? <TrendingDown className="h-3 w-3 inline" /> : <Minus className="h-3 w-3 inline" />}
              {delta !== 0 && ` ${Math.abs(delta)}`}
            </span>
          )}
          <span className={cn("font-bold tabular-nums", textColour)}>{score ?? "—"}</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={cn("h-2 rounded-full transition-all", colour)} style={{ width: `${score ?? 0}%` }} />
      </div>
    </div>
  );
}

interface MetricDef { key: string; label: string; live: boolean }
interface MetricGroup { label: string; icon: React.ElementType; colour: string; metrics: MetricDef[] }

const METRIC_GROUPS: MetricGroup[] = [
  {
    label: "Safeguarding & Children", icon: Shield, colour: "text-red-600",
    metrics: [
      { key: "safeguarding_oversight_score", label: "Safeguarding Oversight", live: true },
      { key: "incident_management_score",    label: "Incident Management",    live: true },
      { key: "missing_episodes_score",       label: "Missing Episodes",       live: true },
      { key: "child_voice_score",            label: "Child Voice",            live: true },
      { key: "outcome_evidence_score",       label: "Outcome Evidence",       live: true },
    ],
  },
  {
    label: "Workforce & Supervision", icon: Users, colour: "text-blue-600",
    metrics: [
      { key: "staff_supervision_score",     label: "Staff Supervision",     live: true },
      { key: "training_compliance_score",   label: "Training Compliance",   live: true },
      { key: "recruitment_compliance_score", label: "Recruitment Compliance", live: true },
    ],
  },
  {
    label: "Care Quality", icon: Heart, colour: "text-[var(--cs-cara-gold)]",
    metrics: [
      { key: "medication_governance_score", label: "Medication Governance", live: true },
      { key: "care_planning_score",         label: "Care Planning",         live: true },
      { key: "complaint_management_score",  label: "Complaint Management",  live: true },
    ],
  },
  {
    label: "Governance & Compliance", icon: FileCheck, colour: "text-emerald-600",
    metrics: [
      { key: "reg45_compliance_score",  label: "Reg 45 Compliance",  live: true },
      { key: "oversight_quality_score", label: "Oversight Quality",  live: true },
      { key: "challenge_log_score",     label: "Challenge Log",      live: true },
      { key: "building_safety_score",   label: "Building Safety",    live: true },
    ],
  },
];

const ALL_METRICS = METRIC_GROUPS.flatMap((g) => g.metrics);

export default function ScorecardPage() {
  const homeName = useHomeName();
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [cara, setCara] = useState<StrategicResult | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: trainingNeedsData } = useTrainingNeeds({ homeId: homeId });
  const { data: challengeData } = useRiChallengeLogs({ homeId: homeId });
  const { data: alertData } = useRiAlerts({ homeId: homeId });
  const { data: reg45Data } = useRiReg45Evidence({ homeId: homeId });
  const { data: incidentsData } = useIncidents();
  const { data: supervisionData } = useSupervisions();
  const { data: trainingRecordsData } = useTraining();
  // Inlined: useAudits (2x with different params)
  const { data: auditsData } = useQuery({
    queryKey: ["audits", undefined],
    queryFn: () => {
      const query = new URLSearchParams();
      return api.get<AuditsResponse>(`/audits?${query}`);
    },
  });
  const { data: medicationAuditsData } = useQuery({
    queryKey: ["audits", { category: "medication" }],
    queryFn: () => {
      const query = new URLSearchParams();
      query.set("category", "medication");
      return api.get<AuditsResponse>(`/audits?${query}`);
    },
  });
  const { data: formsData } = useQuery<FormsListResponse>({
    queryKey: FORM_KEYS.list(),
    queryFn: async () => {
      const res = await fetch("/api/v1/forms", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch forms");
      return res.json();
    },
  });
  const { data: dailyLogData } = useQuery({
    queryKey: ["daily-log", { days: 30 }],
    queryFn: () => api.get<{ data: DailyLogEntry[]; meta: { total: number; by_type: Record<string, number> } }>(`/daily-log?days=30`),
  });
  const { data: recruitmentData } = useRecruitment();
  const { data: ypData } = useYoungPeople("current");

  const scores = useMemo(() => computeRiScores({
    trainingNeeds: trainingNeedsData?.data ?? [],
    trainingRecords: trainingRecordsData?.data ?? [],
    alerts: alertData?.data ?? [],
    incidents: incidentsData?.data ?? [],
    supervisionsMeta: supervisionData?.meta as { overdue?: number } | undefined,
    auditsMeta: auditsData?.meta as { overdue?: number } | undefined,
    audits: auditsData?.data ?? [],
    medicationAudits: medicationAuditsData?.data ?? [],
    reg45Items: reg45Data?.data ?? [],
    challenges: challengeData?.data ?? [],
    careForms: formsData?.data ?? [],
    dailyLogs: dailyLogData?.data ?? [],
    activeCandidates: recruitmentData?.candidates ?? [],
    ypCount: (ypData?.data ?? []).length,
  }), [trainingNeedsData, trainingRecordsData, alertData, incidentsData, supervisionData, auditsData, medicationAuditsData, reg45Data, challengeData, formsData, dailyLogData, recruitmentData, ypData]);

  const urgentNeeds = (trainingNeedsData?.data ?? []).filter((n) => n.priority === "urgent" && !["completed", "no_action"].includes(n.status)).length;
  const overallScore = scores.overall_governance_score;
  const riskLevel = meets(overallScore, 80) ? "low" : meets(overallScore, 65) ? "medium" : meets(overallScore, 50) ? "high" : below(overallScore, 50) ? "critical" : "not yet measured";
  const riskColour = riskLevel === "low" ? "text-emerald-700 bg-emerald-100" : riskLevel === "medium" ? "text-amber-700 bg-amber-100" : riskLevel === "high" ? "text-orange-700 bg-orange-100" : riskLevel === "critical" ? "text-red-700 bg-red-100" : "text-slate-600 bg-slate-100";
  const scoreByKey = scores as unknown as Record<string, number | null>;
  const liveMetricCount = ALL_METRICS.filter((m) => m.live).length;

  const generateStrategic = async () => {
    setLoading(true);
    try {
      const res = await api.post<{ data: { parsed?: StrategicResult } }>(
        "/cara",
        {
          mode: "ri_strategic_analysis",
          style: "provider_summary",
          source_content: `${homeName} governance scorecard (live data). Overall: ${overallScore === null ? "not yet measured" : `${overallScore}/100`}. Risk level: ${riskLevel}. ${urgentNeeds} urgent training needs. Metrics: ${ALL_METRICS.map((m) => `${m.label}: ${scoreByKey[m.key] ?? "no records yet"}`).join(", ")}.`,
          page_context: "RI Governance Scorecard",
          record_type: "governance_analysis",
          user_role: "responsible_individual",
        }
      );
      const parsed = res.data?.parsed;
      if (parsed) setCara(parsed);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Governance Scorecard"
      subtitle={`15 live governance metrics — ${homeName}`}
      caraContext={{ pageTitle: "RI Governance Scorecard", sourceType: "general" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Governance Scorecard" subtitle="RI Report" targetId="scorecard-content" />
          <SmartUploadButton variant="inline" label="Upload Evidence" uploadContext="RI Scorecard — governance evidence upload" />
          <Button size="sm" className="gap-1.5 bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white" onClick={generateStrategic} disabled={loading}>
            <Sparkles className="h-3.5 w-3.5" />
            {loading ? "Analysing…" : "Cara Strategic Analysis"}
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="scorecard-content" className="space-y-6 animate-fade-in">
        {/* Overall */}
        <div className="rounded-2xl bg-slate-900 p-6 text-white flex items-center gap-6">
          <div className="text-center shrink-0">
            <div className="text-6xl font-bold tabular-nums">{overallScore ?? "—"}</div>
            <div className="text-xs text-[var(--cs-text-muted)] mt-1">Overall Score</div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-400 shrink-0" />
              <span className="text-sm font-semibold text-white">{`${homeName} Governance`}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold ml-auto", riskColour)}>
                {riskLevel === "not yet measured" ? "NOT YET MEASURED" : `${riskLevel.toUpperCase()} RISK`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] text-[var(--cs-text-muted)]">{liveMetricCount} of {ALL_METRICS.length} metrics computed from live data</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div
                className={cn("h-2 rounded-full transition-all", meets(overallScore, 80) ? "bg-emerald-400" : meets(overallScore, 65) ? "bg-amber-400" : below(overallScore, 65) ? "bg-red-500" : "bg-white/20")}
                style={{ width: `${overallScore ?? 0}%` }}
              />
            </div>
            <p className="text-xs text-[var(--cs-text-muted)]">Composite of 15 governance indicators. Safeguarding weighted 2×.</p>
          </div>
        </div>

        {/* Traffic light summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Green (80+)", count: ALL_METRICS.filter((m) => meets(scoreByKey[m.key], 80)).length, colour: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-400" },
            { label: "Amber (65-79)", count: ALL_METRICS.filter((m) => meets(scoreByKey[m.key], 65) && below(scoreByKey[m.key], 80)).length, colour: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-400" },
            { label: "Red (<65)", count: ALL_METRICS.filter((m) => below(scoreByKey[m.key], 65)).length, colour: "text-red-700", bg: "bg-red-50 border-red-200", dot: "bg-red-400" },
            { label: "No records yet", count: ALL_METRICS.filter((m) => scoreByKey[m.key] == null).length, colour: "text-slate-600", bg: "bg-slate-50 border-slate-200", dot: "bg-slate-300" },
          ].map((t) => (
            <div key={t.label} className={cn("rounded-xl border p-3 text-center", t.bg)}>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <div className={cn("w-3 h-3 rounded-full", t.dot)} />
              </div>
              <div className={cn("text-xl font-bold tabular-nums", t.colour)}>{t.count}</div>
              <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">{t.label}</div>
            </div>
          ))}
        </div>

        {/* Grouped metrics */}
        <div className="grid gap-4 md:grid-cols-2">
          {METRIC_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            const avgScore = meanOf(group.metrics.map((m) => scoreByKey[m.key]));
            return (
              <Card key={group.label}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[13px] flex items-center gap-2">
                      <GroupIcon className={cn("h-4 w-4", group.colour)} />
                      {group.label}
                    </CardTitle>
                    <span className={cn(
                      "text-sm font-bold tabular-nums",
                      meets(avgScore, 80) ? "text-emerald-700" : meets(avgScore, 65) ? "text-amber-700" : below(avgScore, 65) ? "text-red-700" : "text-[var(--cs-text-muted)]",
                    )}>
                      {avgScore ?? "—"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 divide-y divide-slate-50">
                  {group.metrics.map((m) => (
                    <div key={m.key} className="flex items-center gap-2">
                      <div className="flex-1">
                        <ScoreBar label={m.label} score={scoreByKey[m.key] ?? null} />
                      </div>
                      <span className={cn("shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border",
                        m.live
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : "text-[var(--cs-text-muted)] bg-slate-50 border-[var(--cs-border)]"
                      )}>
                        {m.live ? "LIVE" : "EST"}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Cara strategic analysis */}
        {cara && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <p className="text-sm font-semibold text-indigo-900">Cara Strategic Analysis</p>
              </div>
              <p className="text-sm text-indigo-800 leading-relaxed">{cara.overall_governance_narrative}</p>
            </div>
            {[
              { label: "Safeguarding", content: cara.safeguarding_analysis },
              { label: "Outcome Evidence", content: cara.outcome_evidence },
              { label: "Management Effectiveness", content: cara.management_effectiveness },
              { label: "Compliance Position", content: cara.compliance_position },
            ].map(({ label, content }) => content && (
              <div key={label}>
                <p className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-2">{label}</p>
                <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-white p-4">
                  <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed">{content}</p>
                </div>
              </div>
            ))}
            {cara.challenge_questions_for_manager?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-2">Challenge Questions for Manager</p>
                <div className="space-y-2">
                  {cara.challenge_questions_for_manager.map((q, i) => (
                    <div key={i} className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                      <p className="text-sm text-amber-900 leading-relaxed">
                        <span className="font-bold mr-2">{i + 1}.</span>{q}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <CaraPanel
        mode="assist"
        pageContext="RI Governance Scorecard — responsible individual governance score, quality standards compliance, safeguarding performance, regulatory evidence, board reporting, Ofsted readiness, strategic analysis"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}
