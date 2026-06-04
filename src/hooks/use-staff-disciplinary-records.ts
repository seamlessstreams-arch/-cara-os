import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StaffDisciplinaryRecord } from "@/types/extended";

export function useStaffDisciplinaryRecords() {
  return useQuery<StaffDisciplinaryRecord[]>({
    queryKey: ["staff-disciplinary-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-disciplinary-records");
      if (!res.ok) throw new Error("Failed to fetch staff disciplinary records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateStaffDisciplinaryRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StaffDisciplinaryRecord, "id">) => {
      const res = await fetch("/api/v1/staff-disciplinary-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create staff disciplinary record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-disciplinary-records"] }),
  });
}
