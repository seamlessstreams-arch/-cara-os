import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Reg40StaffEntry } from "@/types/extended";

export function useReg40StaffEntries() {
  return useQuery<Reg40StaffEntry[]>({
    queryKey: ["reg40-staff-entries"],
    queryFn: () => fetch("/api/v1/reg40-staff-entries").then((r) => r.json()),
  });
}

export function useCreateReg40StaffEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Reg40StaffEntry>) =>
      fetch("/api/v1/reg40-staff-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reg40-staff-entries"] }),
  });
}
