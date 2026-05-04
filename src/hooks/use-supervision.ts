// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SUPERVISION HOOKS
// React Query wrappers for /api/v1/supervision
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Supervision } from "@/types";

const API = "/api/v1/supervision";

function currentUserId(): string {
  if (typeof window === "undefined") return "staff_darren";
  try { return localStorage.getItem("cs_user_id") ?? "staff_darren"; } catch { return "staff_darren"; }
}

function authHeaders() {
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

export const SUPERVISION_KEYS = {
  all:    ["supervisions"] as const,
  list:   (params?: Record<string, string>) => ["supervisions", "list", params] as const,
  detail: (id: string) => ["supervisions", "detail", id] as const,
};

export function useSupervisions(params?: Record<string, string>) {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  return useQuery<SupervisionListResponse>({
    queryKey: SUPERVISION_KEYS.list(params),
    queryFn: async () => {
      const res = await fetch(`${API}${query}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch supervisions");
      return res.json();
    },
  });
}

export function useSupervision(id: string) {
  return useQuery<Supervision>({
    queryKey: SUPERVISION_KEYS.detail(id),
    queryFn: async () => {
      const res = await fetch(`${API}/${id}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Supervision not found");
      const json: { data: Supervision } = await res.json();
      return json.data;
    },
    enabled: !!id,
  });
}

export function useCreateSupervision() {
  const qc = useQueryClient();
  return useMutation<Supervision, Error, Partial<Supervision>>({
    mutationFn: async (data) => {
      const res = await fetch(API, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create supervision");
      const json: { data: Supervision } = await res.json();
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SUPERVISION_KEYS.all }),
  });
}

export function useUpdateSupervision() {
  const qc = useQueryClient();
  return useMutation<Supervision, Error, { id: string } & Partial<Supervision> & { action?: string }>({
    mutationFn: async ({ id, ...data }) => {
      const res = await fetch(`${API}/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update supervision");
      const json: { data: Supervision } = await res.json();
      return json.data;
    },
    onSuccess: (sup) => {
      qc.invalidateQueries({ queryKey: SUPERVISION_KEYS.all });
      qc.setQueryData(SUPERVISION_KEYS.detail(sup.id), sup);
    },
  });
}
