"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Strategy Discussion hook (client)
// GET/POST /api/v1/strategy-discussion — assemble-from-records, edit, answer
// the Seven Questions, and the manager's threshold judgement.
// ══════════════════════════════════════════════════════════════════════════════

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  StrategyDiscussionRequest,
  StrategyDraftStatus,
} from "@/lib/strategy-discussion/types";

const KEY = "strategy-discussion";
const URL = "/api/v1/strategy-discussion";

export interface StrategyRequestWithStatus {
  request: StrategyDiscussionRequest;
  status: StrategyDraftStatus;
}
interface ListResponse {
  data: StrategyRequestWithStatus[];
  meta: { total: number };
  sections: Record<string, string>;
  questions: string[];
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

export function useStrategyRequests(filter?: { childId?: string; status?: string }) {
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

export function useStrategyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => postJson<{ data: StrategyRequestWithStatus }>(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
