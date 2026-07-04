"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Risk Escalation Decisions hook (client)
// GET/POST /api/v1/escalations/decisions — the 4-level suggest→confirm/amend/
// reject workflow. Cara suggests; a named manager decides.
// ══════════════════════════════════════════════════════════════════════════════

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  EscalationDecision,
  EscalationLevel,
  EscalationLevelDefinition,
} from "@/lib/risk-escalation/types";

const KEY = "escalation-decisions";
const URL = "/api/v1/escalations/decisions";

interface ListResponse {
  data: EscalationDecision[];
  meta: { total: number };
  levels: Record<EscalationLevel, EscalationLevelDefinition>;
}

async function postJson<T>(body: unknown): Promise<T> {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json;
}

export function useEscalationDecisions(filter?: { childId?: string; status?: string }) {
  const params = new URLSearchParams();
  if (filter?.childId) params.set("childId", filter.childId);
  if (filter?.status) params.set("status", filter.status);
  const qs = params.toString();
  return useQuery<ListResponse>({
    queryKey: [KEY, filter?.childId ?? "", filter?.status ?? ""],
    queryFn: () => fetch(`${URL}${qs ? `?${qs}` : ""}`).then((r) => r.json()),
    staleTime: 15 * 1000,
  });
}

export function useSuggestEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => postJson<{ data: EscalationDecision }>({ kind: "suggest", ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDecideEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => postJson<{ data: EscalationDecision }>({ kind: "decide", ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
