import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReligiousFestivalRecord } from "@/types/extended";

async function fetchAll(childId?: string): Promise<ReligiousFestivalRecord[]> {
  const url = childId
    ? `/api/v1/religious-festival-records?child_id=${childId}`
    : "/api/v1/religious-festival-records";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch religious festival records");
  const __j = await res.json(); return Array.isArray(__j) ? __j : (__j?.data ?? []);
}

export function useReligiousFestivalRecords(childId?: string) {
  return useQuery<ReligiousFestivalRecord[]>({
    queryKey: ["religious-festival-records", childId ?? "all"],
    queryFn: () => fetchAll(childId),
  });
}

export function useCreateReligiousFestivalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ReligiousFestivalRecord>) => {
      const res = await fetch("/api/v1/religious-festival-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create religious festival record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["religious-festival-records"] }),
  });
}
