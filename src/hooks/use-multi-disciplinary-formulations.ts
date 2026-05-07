import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MultiDisciplinaryFormulation } from "@/types/extended";

const BASE = "/api/v1/multi-disciplinary-formulations";

async function fetchAll(childId?: string) {
  const url = childId ? `${BASE}?child_id=${childId}` : BASE;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch formulations");
  return res.json() as Promise<{ data: MultiDisciplinaryFormulation[] }>;
}

export function useMultiDisciplinaryFormulations(childId?: string) {
  return useQuery({ queryKey: ["multi-disciplinary-formulations", childId], queryFn: () => fetchAll(childId) });
}

export function useCreateMultiDisciplinaryFormulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<MultiDisciplinaryFormulation>) => {
      const res = await fetch(BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create formulation");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["multi-disciplinary-formulations"] }),
  });
}

export function useUpdateMultiDisciplinaryFormulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<MultiDisciplinaryFormulation> & { id: string }) => {
      const res = await fetch(BASE, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update formulation");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["multi-disciplinary-formulations"] }),
  });
}
