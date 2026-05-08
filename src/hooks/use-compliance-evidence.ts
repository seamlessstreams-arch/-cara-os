import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { Reg45EvidenceItem, AnnexAEvidenceItem, ManagerDecision } from "@/types/care-events";

// ── Reg 45 Evidence Queue ─────────────────────────────────────────────────────

interface Reg45EvidenceParams {
  decision?: ManagerDecision;
  theme?: string;
}

interface Reg45EvidenceMeta {
  counts: {
    pending: number;
    approved: number;
    rejected: number;
    deferred: number;
    total: number;
  };
}

export interface Reg45EvidenceEnriched extends Reg45EvidenceItem {
  care_event: {
    id: string;
    title: string;
    category: string;
    event_date: string;
    status: string;
    staff_id: string;
    child_id: string | null;
  } | null;
}

export function useReg45Evidence(params?: Reg45EvidenceParams) {
  const searchParams = new URLSearchParams();
  if (params?.decision) searchParams.set("decision", params.decision);
  if (params?.theme) searchParams.set("theme", params.theme);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["reg45-evidence", params],
    queryFn: () =>
      api.get<{ data: Reg45EvidenceEnriched[]; meta: Reg45EvidenceMeta }>(
        `reg45-evidence${qs ? `?${qs}` : ""}`
      ),
  });
}

export function useDecideReg45Evidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      id: string;
      manager_decision: ManagerDecision;
      manager_approved_text?: string;
      review_notes?: string;
      reviewed_by: string;
    }) => api.patch<{ data: Reg45EvidenceItem }>("reg45-evidence", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reg45-evidence"] });
    },
  });
}

// ── Annex A Readiness ─────────────────────────────────────────────────────────

interface AnnexASection {
  key: string;
  label: string;
  evidence_count: number;
  approved_count: number;
  pending_count: number;
  stale_count: number;
  has_gap: boolean;
}

interface AnnexAMeta {
  readiness_score: number;
  total_evidence: number;
  pending_decisions: number;
  approved_count: number;
  rejected_count: number;
  sections: AnnexASection[];
  gaps: string[];
  stale_count: number;
}

export interface AnnexAEvidenceEnriched extends AnnexAEvidenceItem {
  care_event: {
    id: string;
    title: string;
    category: string;
    event_date: string;
    status: string;
  } | null;
}

export function useAnnexAReadiness(params?: { section?: string; decision?: ManagerDecision }) {
  const searchParams = new URLSearchParams();
  if (params?.section) searchParams.set("section", params.section);
  if (params?.decision) searchParams.set("decision", params.decision);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["annex-a-readiness", params],
    queryFn: () =>
      api.get<{ data: AnnexAEvidenceEnriched[]; meta: AnnexAMeta }>(
        `annex-a-readiness${qs ? `?${qs}` : ""}`
      ),
  });
}

export function useDecideAnnexAEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      id: string;
      manager_decision: ManagerDecision;
      manager_approved_text?: string;
      reviewed_by: string;
    }) => api.patch<{ data: AnnexAEvidenceItem }>("annex-a-readiness", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annex-a-readiness"] });
    },
  });
}
