"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CheckStatus =
  | "not_started"
  | "requested"
  | "in_progress"
  | "received"
  | "verified"
  | "concern_flagged"
  | "override_approved"
  | "not_required";

export type CheckType =
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

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface RecruitmentCheck {
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

export interface RecruitmentReference {
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

export interface EmploymentHistoryEntry {
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

export interface EmploymentGap {
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

export interface Interview {
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

export interface Offer {
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

export interface RecruitmentAuditEntry {
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

export interface Vacancy {
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

export interface CandidateDetail {
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

export interface ComplianceAlert {
  candidate_id: string;
  candidate_name: string;
  issue: string;
  severity: "warning" | "critical";
  check_type: CheckType | null;
}

export interface RecruitmentOverview {
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

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface CreateCandidatePayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role_applied: string;
  source?: string;
}

export interface UpdateCandidatePayload {
  candidateId: string;
  data: Partial<{
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role_applied: string;
    stage: string;
    source: string;
    interview_date: string;
    interview_notes: string;
    offer_date: string;
    start_date: string;
    notes: string;
    manager_assigned: string;
  }>;
}

export interface UpdateCheckPayload {
  checkId: string;
  candidateId: string;
  data: Partial<{
    status: CheckStatus;
    owner: string;
    requested_date: string;
    received_date: string;
    verified_by: string;
    verified_at: string;
    certificate_number: string;
    document_type: string;
    expiry_date: string;
    concern_flag: boolean;
    concern_notes: string;
    override_reason: string;
    risk_mitigation: string;
    notes: string;
  }>;
}

export interface CreateReferencePayload {
  candidate_id: string;
  referee_name: string;
  referee_org?: string;
  referee_role?: string;
  referee_email?: string;
  referee_phone?: string;
  relationship: string;
  is_most_recent_employer?: boolean;
}

export interface UpdateReferencePayload {
  referenceId: string;
  candidateId: string;
  data: Partial<{
    status: RecruitmentReference["status"];
    received_date: string;
    employment_dates_confirmed: boolean;
    role_confirmed: boolean;
    performance_rating: string;
    safeguarding_concerns: boolean;
    safeguarding_detail: string;
    would_re_employ: boolean;
    would_re_employ_reason: string;
    discrepancy_flag: boolean;
    discrepancy_notes: string;
  }>;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useRecruitment() {
  return useQuery({
    queryKey: ["recruitment"],
    queryFn: () => api.get<RecruitmentOverview>("/recruitment"),
  });
}

export function useCandidate(candidateId: string) {
  return useQuery({
    queryKey: ["recruitment", candidateId],
    queryFn: () => api.get<{ data: CandidateDetail }>(`/recruitment/${candidateId}`),
    enabled: Boolean(candidateId),
  });
}

export function useCreateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCandidatePayload) =>
      api.post<{ data: CandidateDetail }>("/recruitment", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recruitment"] });
    },
  });
}

export function useUpdateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ candidateId, data }: UpdateCandidatePayload) =>
      api.patch<{ data: CandidateDetail }>(`/recruitment/${candidateId}`, data),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ["recruitment"] });
      qc.invalidateQueries({ queryKey: ["recruitment", variables.candidateId] });
    },
  });
}

export function useRecruitmentChecks(candidateId: string) {
  return useQuery({
    queryKey: ["recruitment-checks", candidateId],
    queryFn: () =>
      api.get<{ data: RecruitmentCheck[] }>(
        `/recruitment/checks?candidate_id=${candidateId}`
      ),
    enabled: Boolean(candidateId),
  });
}

export function useUpdateCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checkId, data }: UpdateCheckPayload) =>
      api.patch<{ data: RecruitmentCheck }>(`/recruitment/checks`, { id: checkId, ...data }),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ["recruitment"] });
      qc.invalidateQueries({ queryKey: ["recruitment", variables.candidateId] });
      qc.invalidateQueries({ queryKey: ["recruitment-checks", variables.candidateId] });
    },
  });
}

export function useRecruitmentReferences(candidateId: string) {
  return useQuery({
    queryKey: ["recruitment-references", candidateId],
    queryFn: () =>
      api.get<{ data: RecruitmentReference[] }>(
        `/recruitment/references?candidate_id=${candidateId}`
      ),
    enabled: Boolean(candidateId),
  });
}

export function useCreateReference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReferencePayload) =>
      api.post<{ data: RecruitmentReference }>("/recruitment/references", payload),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ["recruitment"] });
      qc.invalidateQueries({ queryKey: ["recruitment", variables.candidate_id] });
      qc.invalidateQueries({ queryKey: ["recruitment-references", variables.candidate_id] });
    },
  });
}

export function useUpdateReference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ referenceId, data }: UpdateReferencePayload) =>
      api.patch<{ data: RecruitmentReference }>("/recruitment/references", { id: referenceId, ...data }),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ["recruitment"] });
      qc.invalidateQueries({ queryKey: ["recruitment", variables.candidateId] });
      qc.invalidateQueries({ queryKey: ["recruitment-references", variables.candidateId] });
    },
  });
}

export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ candidateId, action, by }: { candidateId: string; action: string; by?: string }) =>
      api.patch<{ data: unknown }>("/recruitment/offers", { candidate_id: candidateId, action, by }),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ["recruitment"] });
      qc.invalidateQueries({ queryKey: ["recruitment", variables.candidateId] });
    },
  });
}

// ── Vacancy detail ────────────────────────────────────────────────────────────

export interface VacancyCandidate {
  id: string;
  name: string;
  email: string;
  stage: string;
  risk_level: string;
  days_total: number;
  compliance_score: number;
}

export interface VacancyDetail {
  id: string;
  home_id: string;
  title: string;
  role_code: string;
  employment_type: string;
  contract_type: string;
  salary_min: number | null;
  salary_max: number | null;
  hours: number | null;
  shift_pattern: string | null;
  safeguarding_statement: string;
  status: string;
  approval_status: string;
  reports_to: string | null;
  posted_date: string;
  days_open: number;
  applications_count: number;
  by_stage: Record<string, number>;
  candidates: VacancyCandidate[];
  created_at: string;
  updated_at: string;
}

export function useVacancy(vacancyId: string) {
  return useQuery({
    queryKey: ["vacancy", vacancyId],
    queryFn: () => api.get<{ data: VacancyDetail }>(`/recruitment/vacancies/${vacancyId}`),
    enabled: Boolean(vacancyId),
  });
}
