import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OccupationalTherapyRecord } from "@/types/extended";

const KEY = "occupational-therapy-records";

async function fetchRecords(childId?: string): Promise<{ data: OccupationalTherapyRecord[] }> {
  const url = childId ? `/api/v1/occupational-therapy-records?child_id=${childId}` : "/api/v1/occupational-therapy-records";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useOccupationalTherapyRecords(childId?: string) {
  return useQuery({ queryKey: childId ? [KEY, childId] : [KEY], queryFn: () => fetchRecords(childId) });
}

export function useCreateOccupationalTherapyRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OccupationalTherapyRecord>) => {
      const res = await fetch("/api/v1/occupational-therapy-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateOccupationalTherapyRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OccupationalTherapyRecord> & { id: string }) => {
      const res = await fetch("/api/v1/occupational-therapy-records", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
