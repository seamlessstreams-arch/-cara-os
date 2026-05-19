"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { AriaHomeDynamicsSnapshot } from "@/types/aria-studio";

interface ListResponse {
  data: AriaHomeDynamicsSnapshot[];
  meta: { total: number };
}

interface LatestResponse {
  data: AriaHomeDynamicsSnapshot | null;
}

interface SingleResponse {
  data: AriaHomeDynamicsSnapshot;
}

export function useHomeDynamicsSnapshots(homeId?: string) {
  const search = new URLSearchParams();
  if (homeId) search.set("home_id", homeId);
  const qs = search.toString();
  return useQuery({
    queryKey: ["aria-home-dynamics", "list", homeId ?? null],
    queryFn: () =>
      api.get<ListResponse>(
        `/api/v1/aria-studio/home-dynamics${qs ? `?${qs}` : ""}`,
      ),
    refetchInterval: 60000,
  });
}

export function useLatestHomeDynamicsSnapshot(homeId?: string) {
  const search = new URLSearchParams({ latest: "1" });
  if (homeId) search.set("home_id", homeId);
  return useQuery({
    queryKey: ["aria-home-dynamics", "latest", homeId ?? null],
    queryFn: () =>
      api.get<LatestResponse>(
        `/api/v1/aria-studio/home-dynamics?${search.toString()}`,
      ),
    refetchInterval: 60000,
  });
}

interface GenerateInput {
  home_id?: string;
  window_days?: number;
  as_of?: string;
  actor_id?: string;
  actor_role?: string;
}

export function useGenerateHomeDynamicsSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateInput) =>
      api.post<SingleResponse>("/api/v1/aria-studio/home-dynamics", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-home-dynamics"] });
    },
  });
}
