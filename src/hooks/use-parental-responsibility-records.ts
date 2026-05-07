import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ParentalResponsibilityRecord } from "@/types/extended";

const KEY = "parental-responsibility-records";

async function fetchRecords(childId?: string): Promise<{ data: ParentalResponsibilityRecord[] }> {
  const url = childId ? `/api/v1/parental-responsibility-records?child_id=${childId}` : "/api/v1/parental-responsibility-records";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useParentalResponsibilityRecords(childId?: string) {
  return useQuery({ queryKey: childId ? [KEY, childId] : [KEY], queryFn: () => fetchRecords(childId) });
}

export function useCreateParentalResponsibilityRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ParentalResponsibilityRecord>) => {
      const res = await fetch("/api/v1/parental-responsibility-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateParentalResponsibilityRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ParentalResponsibilityRecord> & { id: string }) => {
      const res = await fetch("/api/v1/parental-responsibility-records", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
