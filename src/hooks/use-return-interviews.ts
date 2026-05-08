import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReturnInterview } from "@/types/extended";

const BASE = "/api/v1/return-interviews";

async function fetchAll(childId?: string) {
  const url = childId ? `${BASE}?child_id=${childId}` : BASE;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch return interviews");
  return res.json() as Promise<{ data: ReturnInterview[] }>;
}

export function useReturnInterviews(childId?: string) {
  return useQuery({ queryKey: ["return-interviews", childId], queryFn: () => fetchAll(childId) });
}

export function useCreateReturnInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ReturnInterview>) => {
      const res = await fetch(BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create return interview");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["return-interviews"] }),
  });
}

export function useUpdateReturnInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ReturnInterview> & { id: string }) => {
      const res = await fetch(BASE, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update return interview");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["return-interviews"] }),
  });
}
