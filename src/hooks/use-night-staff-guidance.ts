import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NightStaffGuidanceSection } from "@/types/extended";

const BASE = "/api/v1/night-staff-guidance-sections";

async function fetchAll() {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error("Failed to fetch night staff guidance");
  return res.json() as Promise<{ data: NightStaffGuidanceSection[] }>;
}

export function useNightStaffGuidance() {
  return useQuery({ queryKey: ["night-staff-guidance"], queryFn: fetchAll });
}

export function useCreateNightStaffGuidanceSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NightStaffGuidanceSection>) => {
      const res = await fetch(BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create guidance section");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["night-staff-guidance"] }),
  });
}

export function useUpdateNightStaffGuidanceSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NightStaffGuidanceSection> & { id: string }) => {
      const res = await fetch(BASE, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update guidance section");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["night-staff-guidance"] }),
  });
}
