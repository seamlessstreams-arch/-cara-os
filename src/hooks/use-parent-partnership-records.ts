import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ParentPartnershipRecord } from "@/types/extended";

const KEY = "parent-partnership-records";

async function fetchRecords(childId?: string): Promise<{ data: ParentPartnershipRecord[] }> {
  const url = childId ? `/api/v1/parent-partnership-records?child_id=${childId}` : "/api/v1/parent-partnership-records";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useParentPartnershipRecords(childId?: string) {
  return useQuery({ queryKey: childId ? [KEY, childId] : [KEY], queryFn: () => fetchRecords(childId) });
}

export function useCreateParentPartnershipRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ParentPartnershipRecord>) => {
      const res = await fetch("/api/v1/parent-partnership-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateParentPartnershipRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ParentPartnershipRecord> & { id: string }) => {
      const res = await fetch("/api/v1/parent-partnership-records", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
