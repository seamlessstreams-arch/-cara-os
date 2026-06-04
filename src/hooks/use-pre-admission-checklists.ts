import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PreAdmissionChecklist } from "@/types/extended";

export function usePreAdmissionChecklists(childId?: string) {
  return useQuery<PreAdmissionChecklist[]>({
    queryKey: ["pre-admission-checklists", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/pre-admission-checklists?child_id=${childId}`
        : "/api/v1/pre-admission-checklists";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch pre-admission checklists");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreatePreAdmissionChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PreAdmissionChecklist>) => {
      const res = await fetch("/api/v1/pre-admission-checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create pre-admission checklist");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pre-admission-checklists"] }),
  });
}
