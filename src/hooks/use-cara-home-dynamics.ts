"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { CaraHomeDynamicsSnapshot } from "@/types/cara-studio";

interface ListResponse {
  data: CaraHomeDynamicsSnapshot[];
  meta: { total: number };
}

interface LatestResponse {
  data: CaraHomeDynamicsSnapshot | null;
}

interface SingleResponse {
  data: CaraHomeDynamicsSnapshot;
}

export function useHomeDynamicsSnapshots(homeId?: string) {
  const search = new URLSearchParams();
  if (homeId) search.set("home_id", homeId);
  const qs = search.toString();
  return useQuery({
    queryKey: ["cara-home-dynamics", "list", homeId ?? null],
    queryFn: () =>
      api.get<ListResponse>(
        `/cara-studio/home-dynamics${qs ? `?${qs}` : ""}`,
      ),
    refetchInterval: 60000,
  });
}

export function useLatestHomeDynamicsSnapshot(homeId?: string) {
  const search = new URLSearchParams({ latest: "1" });
  if (homeId) search.set("home_id", homeId);
  return useQuery({
    queryKey: ["cara-home-dynamics", "latest", homeId ?? null],
    queryFn: () =>
      api.get<LatestResponse>(
        `/cara-studio/home-dynamics?${search.toString()}`,
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
      api.post<SingleResponse>("/cara-studio/home-dynamics", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-home-dynamics"] });
    },
  });
}
