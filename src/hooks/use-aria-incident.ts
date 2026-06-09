"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  IncidentSession, IncidentTimelineEntry, LivePrompts, QualityGate, WorkflowStep,
} from "@/lib/aria-incident/aria-incident-engine";

export interface SessionListItem extends IncidentSession { child_name: string; entry_count: number; type_label: string }
export interface IncidentListResponse {
  sessions: SessionListItem[];
  children: { id: string; name: string }[];
  incident_types: { key: string; label: string }[];
  active: SessionListItem | null;
  disclaimer: string;
}
export interface SessionBundle {
  session: IncidentSession;
  child_name: string;
  started_by_name: string;
  timeline: IncidentTimelineEntry[];
  checklist: (WorkflowStep & { completed: boolean })[];
  prompts: LivePrompts;
  gate: QualityGate;
  child_voice_prompts: string[];
  child_declined_prompts: string[];
  incident_types: { key: string; label: string }[];
  entry_types: { key: string; label: string }[];
  disclaimer: string;
}

const json = async (res: Response) => {
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || "Request failed");
  return j.data;
};

export function useAriaIncidentList() {
  return useQuery<IncidentListResponse>({
    queryKey: ["aria-incident-list"],
    queryFn: () => fetch("/api/v1/aria-incident").then(json),
    refetchInterval: 60_000,
  });
}

export function useAriaIncidentSession(sessionId: string | null) {
  return useQuery<SessionBundle>({
    queryKey: ["aria-incident", sessionId ?? ""],
    queryFn: () => fetch(`/api/v1/aria-incident/${sessionId}`).then(json),
    enabled: !!sessionId,
    refetchInterval: 30_000,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return (sessionId?: string) => {
    qc.invalidateQueries({ queryKey: ["aria-incident-list"] });
    if (sessionId) qc.invalidateQueries({ queryKey: ["aria-incident", sessionId] });
  };
}

export function useStartIncident() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: { child_id: string; incident_type: string; immediate_risk_level: string }) =>
      fetch("/api/v1/aria-incident", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(json),
    onSuccess: () => invalidate(),
  });
}

export function usePatchIncident(sessionId: string | null) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: { action: "end" | "notify_manager" | "set_risk" | "toggle_step"; risk?: string; step?: string; note?: string }) =>
      fetch(`/api/v1/aria-incident/${sessionId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(json),
    onSuccess: () => invalidate(sessionId ?? undefined),
  });
}

export function useAddTimelineEntry(sessionId: string | null) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: { entry_type: string; raw_text: string }) =>
      fetch(`/api/v1/aria-incident/${sessionId}/timeline`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(json),
    onSuccess: () => invalidate(sessionId ?? undefined),
  });
}

export interface DraftResponse {
  deterministic_draft: string;
  ai_draft: string | null;
  llmUsed: boolean;
  llm_message: string | null;
  gate: QualityGate;
  disclaimer: string;
}

export function useGenerateDraft(sessionId: string | null) {
  return useMutation<DraftResponse>({
    mutationFn: () => fetch(`/api/v1/aria-incident/${sessionId}/draft`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).then(json),
  });
}

export function useAcceptDraft(sessionId: string | null) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: { final_text: string; ai_suggested_text?: string | null }) =>
      fetch(`/api/v1/aria-incident/${sessionId}/draft`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept: true, confirm: true, ...payload }),
      }).then(json),
    onSuccess: () => invalidate(sessionId ?? undefined),
  });
}
