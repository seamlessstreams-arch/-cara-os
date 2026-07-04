"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — TAP Thinking hook (client)
// GET/POST /api/v1/tap-thinking — the five-stage thinking scaffold.
// ══════════════════════════════════════════════════════════════════════════════

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  TapContext,
  TapSession,
  TapSessionStatus,
  TapStage,
  TapStageDefinition,
} from "@/lib/tap-thinking/types";

const KEY = "tap-thinking";
const URL = "/api/v1/tap-thinking";

export interface TapSessionWithStatus {
  session: TapSession;
  status: TapSessionStatus;
}
interface ListResponse {
  data: TapSessionWithStatus[];
  meta: { total: number };
  stages: Record<TapStage, TapStageDefinition>;
  contexts: Record<TapContext, string>;
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

export function useTapSessions(filter?: { childId?: string; context?: string; status?: string }) {
  const params = new URLSearchParams();
  if (filter?.childId) params.set("childId", filter.childId);
  if (filter?.context) params.set("context", filter.context);
  if (filter?.status) params.set("status", filter.status);
  const qs = params.toString();
  return useQuery<ListResponse>({
    queryKey: [KEY, filter?.childId ?? "", filter?.context ?? "", filter?.status ?? ""],
    queryFn: () => fetch(`${URL}${qs ? `?${qs}` : ""}`).then((r) => r.json()),
    staleTime: 15 * 1000,
  });
}

export function useTapMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => postJson<{ data: TapSessionWithStatus }>(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
