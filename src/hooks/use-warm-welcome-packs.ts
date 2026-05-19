"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WarmWelcomePack } from "@/types/extended";

const KEY = "warm-welcome-packs";

export function useWarmWelcomePacks(childId?: string, homeId?: string) {
  const qs = childId ? `?child_id=${childId}` : homeId ? `?home_id=${homeId}` : "";
  return useQuery<{ data: WarmWelcomePack[] }>({
    queryKey: [KEY, childId, homeId],
    queryFn: () => fetch(`/api/v1/warm-welcome-packs${qs}`).then((r) => r.json()),
  });
}

export function useCreateWarmWelcomePack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<WarmWelcomePack>) =>
      fetch("/api/v1/warm-welcome-packs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
