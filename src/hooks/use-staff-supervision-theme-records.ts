import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StaffSupervisionThemeRecord } from "@/types/extended";

export function useStaffSupervisionThemeRecords() {
  return useQuery<StaffSupervisionThemeRecord[]>({
    queryKey: ["staff-supervision-theme-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-supervision-theme-records");
      if (!res.ok) throw new Error("Failed to fetch staff supervision theme records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateStaffSupervisionThemeRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StaffSupervisionThemeRecord, "id">) => {
      const res = await fetch("/api/v1/staff-supervision-theme-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create staff supervision theme record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-supervision-theme-records"] }),
  });
}
