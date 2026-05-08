import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SelfEvaluationArea } from "@/types/extended";

const KEY = "self-evaluation-areas";

async function fetchRecords(): Promise<{ data: SelfEvaluationArea[] }> {
  const res = await fetch("/api/v1/self-evaluation-areas");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useSelfEvaluationAreas() {
  return useQuery({ queryKey: [KEY], queryFn: fetchRecords });
}

export function useCreateSelfEvaluationArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SelfEvaluationArea>) => {
      const res = await fetch("/api/v1/self-evaluation-areas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateSelfEvaluationArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SelfEvaluationArea> & { id: string }) => {
      const res = await fetch("/api/v1/self-evaluation-areas", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
