import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OnlineSafetyAgreement } from "@/types/extended";

const KEY = "online-safety-agreements";

async function fetchRecords(childId?: string): Promise<{ data: OnlineSafetyAgreement[] }> {
  const url = childId ? `/api/v1/online-safety-agreements?child_id=${childId}` : "/api/v1/online-safety-agreements";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useOnlineSafetyAgreements(childId?: string) {
  return useQuery({ queryKey: childId ? [KEY, childId] : [KEY], queryFn: () => fetchRecords(childId) });
}

export function useCreateOnlineSafetyAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OnlineSafetyAgreement>) => {
      const res = await fetch("/api/v1/online-safety-agreements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateOnlineSafetyAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OnlineSafetyAgreement> & { id: string }) => {
      const res = await fetch("/api/v1/online-safety-agreements", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
