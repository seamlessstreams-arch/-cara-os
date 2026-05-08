import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CulturalVisit } from "@/types/extended";

const BASE = "/api/v1/cultural-visits";

async function fetchAll(childId?: string) {
  const url = childId ? `${BASE}?child_id=${childId}` : BASE;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch cultural visits");
  return res.json() as Promise<{ data: CulturalVisit[] }>;
}

export function useCulturalVisits(childId?: string) {
  return useQuery({ queryKey: ["cultural-visits", childId], queryFn: () => fetchAll(childId) });
}

export function useCreateCulturalVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CulturalVisit>) => {
      const res = await fetch(BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create cultural visit");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cultural-visits"] }),
  });
}

export function useUpdateCulturalVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CulturalVisit> & { id: string }) => {
      const res = await fetch(BASE, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update cultural visit");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cultural-visits"] }),
  });
}
