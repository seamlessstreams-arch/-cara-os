import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NightCheck } from "@/types/extended";

const BASE = "/api/v1/night-checks";

async function fetchAll(childId?: string) {
  const url = childId ? `${BASE}?child_id=${childId}` : BASE;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch night checks");
  return res.json() as Promise<{ data: NightCheck[] }>;
}

export function useNightChecks(childId?: string) {
  return useQuery({ queryKey: ["night-checks", childId], queryFn: () => fetchAll(childId) });
}

export function useCreateNightCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NightCheck>) => {
      const res = await fetch(BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create night check");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["night-checks"] }),
  });
}

export function useUpdateNightCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NightCheck> & { id: string }) => {
      const res = await fetch(BASE, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update night check");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["night-checks"] }),
  });
}
