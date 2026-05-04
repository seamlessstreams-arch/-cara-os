"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type {
  ChildExperienceSnapshot,
  PatternAlert,
  Intervention,
  RelationalRecord,
  PracticeBankEntry,
  VoiceRecord,
  HomeClimateSnapshot,
  ActionOutcome,
  DocumentIntelligenceJob,
  AriaAssessment,
  AriaOversight,
  KeyWorkSession,
  ChildResource,
  InteractiveSession,
  AriaAuditEntry,
  AriaRecommendation,
  AriaSafeguardingFlag,
} from "@/types/extended";


// ── Response envelope helpers ─────────────────────────────────────────────────

type ListResponse<T> = { data: T[]; meta: Record<string, unknown> };
type SingleResponse<T> = { data: T };

// ── Read hooks ────────────────────────────────────────────────────────────────

/**
 * All child experience snapshots for a child, sorted most-recent first.
 */
export function useChildExperience(childId: string) {
  return useQuery({
    queryKey: ["intelligence", "child-experience", childId],
    queryFn: () =>
      api.get<ListResponse<ChildExperienceSnapshot>>(
        `/intelligence/child-experience?child_id=${childId}`
      ),
    enabled: !!childId,
  });
}

/**
 * Most recent child experience snapshot for a child.
 */
export function useChildExperienceLatest(childId: string) {
  return useQuery({
    queryKey: ["intelligence", "child-experience", childId, "latest"],
    queryFn: () =>
      api.get<SingleResponse<ChildExperienceSnapshot>>(
        `/intelligence/child-experience?child_id=${childId}&latest=true`
      ),
    enabled: !!childId,
  });
}

/**
 * Pattern alerts filtered by child, home, and/or status.
 */
export function usePatternAlerts(params?: {
  childId?: string;
  homeId?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params?.childId) query.set("child_id", params.childId);
  if (params?.homeId) query.set("home_id", params.homeId);
  if (params?.status) query.set("status", params.status);

  return useQuery({
    queryKey: ["intelligence", "patterns", params],
    queryFn: () =>
      api.get<ListResponse<PatternAlert>>(`/intelligence/patterns?${query}`),
  });
}

/**
 * All interventions for a child.
 */
export function useInterventions(childId: string) {
  return useQuery({
    queryKey: ["intelligence", "interventions", childId],
    queryFn: () =>
      api.get<ListResponse<Intervention>>(
        `/intelligence/interventions?child_id=${childId}`
      ),
    enabled: !!childId,
  });
}

/**
 * All interventions across the home (no child filter).
 */
export function useAllInterventions(homeId = "home_oak") {
  return useQuery({
    queryKey: ["intelligence", "interventions", "home", homeId],
    queryFn: () =>
      api.get<ListResponse<Intervention>>(
        `/intelligence/interventions?home_id=${homeId}`
      ),
  });
}

/**
 * Practice bank entries for a child (active only by default).
 */
export function usePracticeBank(childId: string, activeOnly = true) {
  const query = new URLSearchParams({ child_id: childId });
  if (!activeOnly) query.set("active", "false");

  return useQuery({
    queryKey: ["intelligence", "practice-bank", childId, activeOnly],
    queryFn: () =>
      api.get<ListResponse<PracticeBankEntry>>(`/intelligence/practice-bank?${query}`),
    enabled: !!childId,
  });
}

/**
 * Voice records for a child, optionally filtered by theme.
 */
export function useVoiceRecords(childId: string, theme?: string) {
  const query = new URLSearchParams({ child_id: childId });
  if (theme) query.set("theme", theme);

  return useQuery({
    queryKey: ["intelligence", "voice", childId, theme],
    queryFn: () =>
      api.get<ListResponse<VoiceRecord>>(`/intelligence/voice?${query}`),
    enabled: !!childId,
  });
}

/**
 * Relational records for a child, optionally filtered by record type.
 */
export function useRelationalRecords(childId: string, type?: string) {
  const query = new URLSearchParams({ child_id: childId });
  if (type) query.set("type", type);

  return useQuery({
    queryKey: ["intelligence", "relational", childId, type],
    queryFn: () =>
      api.get<ListResponse<RelationalRecord>>(`/intelligence/relational?${query}`),
    enabled: !!childId,
  });
}

/**
 * Latest home climate snapshot plus last 8 weeks of history.
 */
export function useHomeClimate(homeId = "home_oak") {
  return useQuery({
    queryKey: ["intelligence", "home-climate", homeId],
    queryFn: () =>
      api.get<{
        data: { latest: HomeClimateSnapshot | null; history: HomeClimateSnapshot[] };
        meta: { weeks_of_history: number; trend: string };
      }>(`/intelligence/home-climate?home_id=${homeId}`),
    refetchInterval: 60_000,
  });
}

/**
 * Action outcomes for a child or home.
 */
export function useActionOutcomes(params?: {
  childId?: string;
  homeId?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params?.childId) query.set("child_id", params.childId);
  if (params?.homeId) query.set("home_id", params.homeId);
  if (params?.status) query.set("status", params.status);

  return useQuery({
    queryKey: ["intelligence", "action-outcomes", params],
    queryFn: () =>
      api.get<ListResponse<ActionOutcome>>(`/intelligence/action-outcomes?${query}`),
  });
}

// ── Write hooks ───────────────────────────────────────────────────────────────

/**
 * Create a new intervention for a child.
 */
export function useCreateIntervention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Intervention>) =>
      api.post<SingleResponse<Intervention>>("/intelligence/interventions", data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["intelligence", "interventions", vars.child_id] });
      qc.invalidateQueries({ queryKey: ["intelligence", "interventions"] });
    },
  });
}

/**
 * Update an intervention's status, outcome, or notes.
 */
export function useUpdateIntervention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      status?: Intervention["status"];
      outcome?: Intervention["outcome"];
      outcome_notes?: string;
      ended_at?: string;
      review_date?: string;
    }) => api.patch<SingleResponse<Intervention>>(`/intelligence/interventions/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intelligence", "interventions"] });
    },
  });
}

/**
 * Acknowledge or resolve a pattern alert.
 */
export function useAcknowledgePattern() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      status: PatternAlert["status"];
      acknowledged_by?: string;
      resolved_by?: string;
    }) => api.patch<SingleResponse<PatternAlert>>(`/intelligence/patterns/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intelligence", "patterns"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/**
 * Add an entry to the practice bank for a child.
 */
export function useCreatePracticeBankEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PracticeBankEntry>) =>
      api.post<SingleResponse<PracticeBankEntry>>("/intelligence/practice-bank", data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["intelligence", "practice-bank", vars.child_id] });
    },
  });
}

/**
 * Update a practice bank entry (e.g. toggle active, update description, add review).
 */
export function useUpdatePracticeBankEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      childId,
      ...data
    }: {
      id: string;
      childId: string;
      title?: string;
      description?: string;
      evidence?: string;
      is_active?: boolean;
      reviewed_by?: string;
    }) => api.patch<SingleResponse<PracticeBankEntry>>(`/intelligence/practice-bank/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["intelligence", "practice-bank", vars.childId] });
    },
  });
}

/**
 * Create a voice record for a child.
 */
export function useCreateVoiceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<VoiceRecord>) =>
      api.post<SingleResponse<VoiceRecord>>("/intelligence/voice", data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["intelligence", "voice", vars.child_id] });
    },
  });
}

/**
 * Create a new action outcome.
 */
export function useCreateActionOutcome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ActionOutcome>) =>
      api.post<SingleResponse<ActionOutcome>>("/intelligence/action-outcomes", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intelligence", "action-outcomes"] });
    },
  });
}

/**
 * Update an action outcome's status, effectiveness, what was done, etc.
 */
export function useUpdateActionOutcome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      status?: ActionOutcome["status"];
      what_was_done?: string;
      what_changed?: string;
      effectiveness?: ActionOutcome["effectiveness"];
      effectiveness_notes?: string;
      should_continue?: boolean;
      completed_at?: string;
      due_date?: string;
      owner_id?: string;
    }) => api.patch<SingleResponse<ActionOutcome>>(`/intelligence/action-outcomes/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intelligence", "action-outcomes"] });
    },
  });
}

/**
 * All document intelligence jobs for a home, sorted most-recent first.
 */
export function useDocumentJobs(homeId = "home_oak") {
  return useQuery({
    queryKey: ["intelligence", "document-jobs", homeId],
    queryFn: () =>
      api.get<{
        data: DocumentIntelligenceJob[];
        meta: { total: number; pending: number; classified: number; placed: number };
      }>(`/intelligence/document?home_id=${homeId}`),
  });
}

/**
 * PATCH a document intelligence job's status, classification, or placement fields.
 */
export function useUpdateDocumentJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      status?: DocumentIntelligenceJob["status"];
      classification?: DocumentIntelligenceJob["classification"];
      suggested_module?: string;
      suggested_child_id?: string;
      suggested_form_type?: string;
      suggested_tags?: string[];
      confidence_score?: number;
      reviewed_by?: string;
      reviewed_at?: string;
      placed_at?: string;
      placement_ref_type?: string;
      placement_ref_id?: string;
      aria_notes?: string;
    }) => api.patch<SingleResponse<DocumentIntelligenceJob>>(`/intelligence/document/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intelligence", "document-jobs"] });
    },
  });
}

/**
 * POST a new home climate snapshot (computed by ARIA).
 */
export function useCreateHomeClimate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HomeClimateSnapshot>) =>
      api.post<SingleResponse<HomeClimateSnapshot>>("/intelligence/home-climate", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intelligence", "home-climate"] });
    },
  });
}

/**
 * Create a new pattern alert (e.g. from an ARIA pattern scan).
 */
export function useCreatePatternAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PatternAlert>) =>
      api.post<SingleResponse<PatternAlert>>("/intelligence/patterns", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intelligence", "patterns"] });
    },
  });
}

/**
 * Create a new relational record (trusted adult, regulation strategy, etc.).
 */
export function useCreateRelationalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RelationalRecord>) =>
      api.post<SingleResponse<RelationalRecord>>("/intelligence/relational", data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["intelligence", "relational", vars.child_id] });
    },
  });
}

/**
 * POST a new child experience snapshot (typically computed by ARIA).
 * Invalidates the child's experience query so the UI refreshes.
 */
export function useCreateChildExperienceSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildExperienceSnapshot>) =>
      api.post<SingleResponse<ChildExperienceSnapshot>>("/intelligence/child-experience", data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["intelligence", "child-experience", vars.child_id] });
    },
  });
}

// ── ARIA Intelligence hooks ───────────────────────────────────────────────────

// ── Assessments ───────────────────────────────────────────────────────────────

export function useAriaAssessments(params?: { childId?: string; homeId?: string }) {
  const query = new URLSearchParams();
  if (params?.childId) query.set("child_id", params.childId);
  if (params?.homeId) query.set("home_id", params.homeId);
  return useQuery({
    queryKey: ["aria-intelligence", "assessments", params],
    queryFn: () =>
      api.get<ListResponse<AriaAssessment>>(`/aria-intelligence/assessments?${query}`),
  });
}

export function useCreateAriaAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AriaAssessment>) =>
      api.post<SingleResponse<AriaAssessment>>("/aria-intelligence/assessments", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "assessments"] });
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "audit"] });
    },
  });
}

export function useUpdateAriaAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<AriaAssessment>) =>
      api.patch<SingleResponse<AriaAssessment>>(`/aria-intelligence/assessments/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "assessments"] });
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "audit"] });
    },
  });
}

// ── Oversight ─────────────────────────────────────────────────────────────────

export function useAriaOversight(params?: { childId?: string; homeId?: string }) {
  const query = new URLSearchParams();
  if (params?.childId) query.set("child_id", params.childId);
  if (params?.homeId) query.set("home_id", params.homeId);
  return useQuery({
    queryKey: ["aria-intelligence", "oversight", params],
    queryFn: () =>
      api.get<ListResponse<AriaOversight>>(`/aria-intelligence/oversight?${query}`),
  });
}

export function useCreateAriaOversight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AriaOversight>) =>
      api.post<SingleResponse<AriaOversight>>("/aria-intelligence/oversight", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "oversight"] });
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "audit"] });
    },
  });
}

export function useUpdateAriaOversight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<AriaOversight>) =>
      api.patch<SingleResponse<AriaOversight>>(`/aria-intelligence/oversight/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "oversight"] });
    },
  });
}

// ── Key Work Sessions ─────────────────────────────────────────────────────────

export function useKeyWorkSessions(params?: { childId?: string; homeId?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.childId) query.set("child_id", params.childId);
  if (params?.homeId) query.set("home_id", params.homeId);
  if (params?.status) query.set("status", params.status);
  return useQuery({
    queryKey: ["aria-intelligence", "keywork", params],
    queryFn: () =>
      api.get<ListResponse<KeyWorkSession>>(`/aria-intelligence/keywork?${query}`),
  });
}

export function useCreateKeyWorkSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<KeyWorkSession>) =>
      api.post<SingleResponse<KeyWorkSession>>("/aria-intelligence/keywork", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "keywork"] });
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "audit"] });
    },
  });
}

export function useUpdateKeyWorkSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<KeyWorkSession>) =>
      api.patch<SingleResponse<KeyWorkSession>>(`/aria-intelligence/keywork/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "keywork"] });
    },
  });
}

// ── Child Resources ───────────────────────────────────────────────────────────

export function useChildResources(params?: { childId?: string; homeId?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.childId) query.set("child_id", params.childId);
  if (params?.homeId) query.set("home_id", params.homeId);
  if (params?.status) query.set("status", params.status);
  return useQuery({
    queryKey: ["aria-intelligence", "resources", params],
    queryFn: () =>
      api.get<ListResponse<ChildResource>>(`/aria-intelligence/resources?${query}`),
  });
}

export function useCreateChildResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildResource>) =>
      api.post<SingleResponse<ChildResource>>("/aria-intelligence/resources", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "resources"] });
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "audit"] });
    },
  });
}

export function useUpdateChildResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<ChildResource>) =>
      api.patch<SingleResponse<ChildResource>>(`/aria-intelligence/resources/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "resources"] });
    },
  });
}

// ── Interactive Sessions ──────────────────────────────────────────────────────

export function useInteractiveSessions(childId: string) {
  return useQuery({
    queryKey: ["aria-intelligence", "interactive", childId],
    queryFn: () =>
      api.get<ListResponse<InteractiveSession>>(
        `/aria-intelligence/interactive?child_id=${childId}`
      ),
    enabled: !!childId,
  });
}

export function useCreateInteractiveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InteractiveSession>) =>
      api.post<SingleResponse<InteractiveSession>>("/aria-intelligence/interactive", data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "interactive", vars.child_id] });
    },
  });
}

export function useUpdateInteractiveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, childId, ...data }: { id: string; childId: string } & Partial<InteractiveSession>) =>
      api.patch<SingleResponse<InteractiveSession>>(`/aria-intelligence/interactive/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "interactive", vars.childId] });
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "audit"] });
    },
  });
}

// ── Audit Trail ───────────────────────────────────────────────────────────────

export function useAriaAuditTrail(params?: { childId?: string; homeId?: string }) {
  const query = new URLSearchParams();
  if (params?.childId) query.set("child_id", params.childId);
  if (params?.homeId) query.set("home_id", params.homeId);
  return useQuery({
    queryKey: ["aria-intelligence", "audit", params],
    queryFn: () =>
      api.get<ListResponse<AriaAuditEntry>>(`/aria-intelligence/audit?${query}`),
  });
}

export function useCreateAriaAuditEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AriaAuditEntry>) =>
      api.post<SingleResponse<AriaAuditEntry>>("/aria-intelligence/audit", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "audit"] });
    },
  });
}

// ── Recommendations ───────────────────────────────────────────────────────────

export function useAriaRecommendations(params?: { childId?: string; homeId?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.childId) query.set("child_id", params.childId);
  if (params?.homeId) query.set("home_id", params.homeId);
  if (params?.status) query.set("status", params.status);
  return useQuery({
    queryKey: ["aria-intelligence", "recommendations", params],
    queryFn: () =>
      api.get<ListResponse<AriaRecommendation>>(`/aria-intelligence/recommendations?${query}`),
  });
}

export function useCreateAriaRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AriaRecommendation>) =>
      api.post<SingleResponse<AriaRecommendation>>("/aria-intelligence/recommendations", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "recommendations"] });
    },
  });
}

export function useUpdateAriaRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<AriaRecommendation>) =>
      api.patch<SingleResponse<AriaRecommendation>>(`/aria-intelligence/recommendations/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "recommendations"] });
    },
  });
}

// ── Safeguarding Flags ────────────────────────────────────────────────────────

export function useAriaSafeguardingFlags(params?: { childId?: string; homeId?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.childId) query.set("child_id", params.childId);
  if (params?.homeId) query.set("home_id", params.homeId);
  if (params?.status) query.set("status", params.status);
  return useQuery({
    queryKey: ["aria-intelligence", "safeguarding-flags", params],
    queryFn: () =>
      api.get<ListResponse<AriaSafeguardingFlag> & { meta: { open: number; critical: number } }>(
        `/aria-intelligence/safeguarding-flags?${query}`
      ),
  });
}

export function useCreateAriaSafeguardingFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AriaSafeguardingFlag>) =>
      api.post<SingleResponse<AriaSafeguardingFlag>>("/aria-intelligence/safeguarding-flags", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "safeguarding-flags"] });
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "recommendations"] });
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "audit"] });
    },
  });
}

export function useUpdateAriaSafeguardingFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<AriaSafeguardingFlag>) =>
      api.patch<SingleResponse<AriaSafeguardingFlag>>(`/aria-intelligence/safeguarding-flags/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "safeguarding-flags"] });
      qc.invalidateQueries({ queryKey: ["aria-intelligence", "audit"] });
    },
  });
}
