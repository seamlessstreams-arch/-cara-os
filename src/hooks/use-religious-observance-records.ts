import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReligiousObservanceRecord } from "@/types/extended";

async function fetchAll(childId?: string): Promise<ReligiousObservanceRecord[]> {
  const url = childId
    ? `/api/v1/religious-observance-records?child_id=${childId}`
    : "/api/v1/religious-observance-records";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch religious observance records");
  const __j = await res.json(); return Array.isArray(__j) ? __j : (__j?.data ?? []);
}

export function useReligiousObservanceRecords(childId?: string) {
  return useQuery<ReligiousObservanceRecord[]>({
    queryKey: ["religious-observance-records", childId ?? "all"],
    queryFn: () => fetchAll(childId),
  });
}

export function useCreateReligiousObservanceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ReligiousObservanceRecord>) => {
      const res = await fetch("/api/v1/religious-observance-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create religious observance record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["religious-observance-records"] }),
  });
}
