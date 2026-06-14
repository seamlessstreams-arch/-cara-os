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
  CaraAssessment,
  CaraOversight,
  KeyWorkSession,
  ChildResource,
  InteractiveSession,
  CaraAuditEntry,
  CaraRecommendation,
  CaraSafeguardingFlag,
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
      cara_notes?: string;
    }) => api.patch<SingleResponse<DocumentIntelligenceJob>>(`/intelligence/document/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intelligence", "document-jobs"] });
    },
  });
}

/**
 * POST a new home climate snapshot (computed by Cara).
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
 * Create a new pattern alert (e.g. from an Cara pattern scan).
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
 * POST a new child experience snapshot (typically computed by Cara).
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

// ── Cara Intelligence hooks ───────────────────────────────────────────────────

// ── Assessments ───────────────────────────────────────────────────────────────

export function useCaraAssessments(params?: { childId?: string; homeId?: string }) {
  const query = new URLSearchParams();
  if (params?.childId) query.set("child_id", params.childId);
  if (params?.homeId) query.set("home_id", params.homeId);
  return useQuery({
    queryKey: ["cara-intelligence", "assessments", params],
    queryFn: () =>
      api.get<ListResponse<CaraAssessment>>(`/cara-intelligence/assessments?${query}`),
  });
}

export function useCreateCaraAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CaraAssessment>) =>
      api.post<SingleResponse<CaraAssessment>>("/cara-intelligence/assessments", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "assessments"] });
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "audit"] });
    },
  });
}

export function useUpdateCaraAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CaraAssessment>) =>
      api.patch<SingleResponse<CaraAssessment>>(`/cara-intelligence/assessments/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "assessments"] });
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "audit"] });
    },
  });
}

// ── Oversight ─────────────────────────────────────────────────────────────────

export function useCaraOversight(params?: { childId?: string; homeId?: string }) {
  const query = new URLSearchParams();
  if (params?.childId) query.set("child_id", params.childId);
  if (params?.homeId) query.set("home_id", params.homeId);
  return useQuery({
    queryKey: ["cara-intelligence", "oversight", params],
    queryFn: () =>
      api.get<ListResponse<CaraOversight>>(`/cara-intelligence/oversight?${query}`),
  });
}

export function useCreateCaraOversight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CaraOversight>) =>
      api.post<SingleResponse<CaraOversight>>("/cara-intelligence/oversight", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "oversight"] });
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "audit"] });
    },
  });
}

export function useUpdateCaraOversight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CaraOversight>) =>
      api.patch<SingleResponse<CaraOversight>>(`/cara-intelligence/oversight/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "oversight"] });
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
    queryKey: ["cara-intelligence", "keywork", params],
    queryFn: () =>
      api.get<ListResponse<KeyWorkSession>>(`/cara-intelligence/keywork?${query}`),
  });
}

export function useCreateKeyWorkSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<KeyWorkSession>) =>
      api.post<SingleResponse<KeyWorkSession>>("/cara-intelligence/keywork", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "keywork"] });
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "audit"] });
    },
  });
}

export function useUpdateKeyWorkSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<KeyWorkSession>) =>
      api.patch<SingleResponse<KeyWorkSession>>(`/cara-intelligence/keywork/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "keywork"] });
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
    queryKey: ["cara-intelligence", "resources", params],
    queryFn: () =>
      api.get<ListResponse<ChildResource>>(`/cara-intelligence/resources?${query}`),
  });
}

export function useCreateChildResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildResource>) =>
      api.post<SingleResponse<ChildResource>>("/cara-intelligence/resources", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "resources"] });
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "audit"] });
    },
  });
}

export function useUpdateChildResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<ChildResource>) =>
      api.patch<SingleResponse<ChildResource>>(`/cara-intelligence/resources/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "resources"] });
    },
  });
}

// ── Interactive Sessions ──────────────────────────────────────────────────────

export function useInteractiveSessions(childId: string) {
  return useQuery({
    queryKey: ["cara-intelligence", "interactive", childId],
    queryFn: () =>
      api.get<ListResponse<InteractiveSession>>(
        `/cara-intelligence/interactive?child_id=${childId}`
      ),
    enabled: !!childId,
  });
}

export function useCreateInteractiveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InteractiveSession>) =>
      api.post<SingleResponse<InteractiveSession>>("/cara-intelligence/interactive", data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "interactive", vars.child_id] });
    },
  });
}

export function useUpdateInteractiveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, childId, ...data }: { id: string; childId: string } & Partial<InteractiveSession>) =>
      api.patch<SingleResponse<InteractiveSession>>(`/cara-intelligence/interactive/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "interactive", vars.childId] });
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "audit"] });
    },
  });
}

// ── Audit Trail ───────────────────────────────────────────────────────────────

export function useCaraAuditTrail(params?: { childId?: string; homeId?: string }) {
  const query = new URLSearchParams();
  if (params?.childId) query.set("child_id", params.childId);
  if (params?.homeId) query.set("home_id", params.homeId);
  return useQuery({
    queryKey: ["cara-intelligence", "audit", params],
    queryFn: () =>
      api.get<ListResponse<CaraAuditEntry>>(`/cara-intelligence/audit?${query}`),
  });
}

export function useCreateCaraAuditEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CaraAuditEntry>) =>
      api.post<SingleResponse<CaraAuditEntry>>("/cara-intelligence/audit", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "audit"] });
    },
  });
}

// ── Recommendations ───────────────────────────────────────────────────────────

export function useCaraRecommendations(params?: { childId?: string; homeId?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.childId) query.set("child_id", params.childId);
  if (params?.homeId) query.set("home_id", params.homeId);
  if (params?.status) query.set("status", params.status);
  return useQuery({
    queryKey: ["cara-intelligence", "recommendations", params],
    queryFn: () =>
      api.get<ListResponse<CaraRecommendation>>(`/cara-intelligence/recommendations?${query}`),
  });
}

export function useCreateCaraRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CaraRecommendation>) =>
      api.post<SingleResponse<CaraRecommendation>>("/cara-intelligence/recommendations", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "recommendations"] });
    },
  });
}

export function useUpdateCaraRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CaraRecommendation>) =>
      api.patch<SingleResponse<CaraRecommendation>>(`/cara-intelligence/recommendations/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "recommendations"] });
    },
  });
}

// ── Safeguarding Flags ────────────────────────────────────────────────────────

export function useCaraSafeguardingFlags(params?: { childId?: string; homeId?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.childId) query.set("child_id", params.childId);
  if (params?.homeId) query.set("home_id", params.homeId);
  if (params?.status) query.set("status", params.status);
  return useQuery({
    queryKey: ["cara-intelligence", "safeguarding-flags", params],
    queryFn: () =>
      api.get<ListResponse<CaraSafeguardingFlag> & { meta: { open: number; critical: number } }>(
        `/cara-intelligence/safeguarding-flags?${query}`
      ),
  });
}

export function useCreateCaraSafeguardingFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CaraSafeguardingFlag>) =>
      api.post<SingleResponse<CaraSafeguardingFlag>>("/cara-intelligence/safeguarding-flags", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "safeguarding-flags"] });
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "recommendations"] });
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "audit"] });
    },
  });
}

export function useUpdateCaraSafeguardingFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CaraSafeguardingFlag>) =>
      api.patch<SingleResponse<CaraSafeguardingFlag>>(`/cara-intelligence/safeguarding-flags/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "safeguarding-flags"] });
      qc.invalidateQueries({ queryKey: ["cara-intelligence", "audit"] });
    },
  });
}
