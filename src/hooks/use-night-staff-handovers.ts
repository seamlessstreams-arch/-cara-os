import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NightStaffHandover } from "@/types/extended";

const KEY = "night-staff-handovers";

async function fetchRecords(): Promise<{ data: NightStaffHandover[] }> {
  const res = await fetch("/api/v1/night-staff-handovers");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useNightStaffHandovers() {
  return useQuery({ queryKey: [KEY], queryFn: fetchRecords });
}

export function useCreateNightStaffHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NightStaffHandover>) => {
      const res = await fetch("/api/v1/night-staff-handovers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateNightStaffHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NightStaffHandover> & { id: string }) => {
      const res = await fetch("/api/v1/night-staff-handovers", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
