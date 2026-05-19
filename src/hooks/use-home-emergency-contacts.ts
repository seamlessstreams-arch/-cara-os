"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HomeEmergencyContact } from "@/types/extended";

const KEY = "home-emergency-contacts";

export function useHomeEmergencyContacts(homeId?: string) {
  const qs = homeId ? `?home_id=${homeId}` : "";
  return useQuery<{ data: HomeEmergencyContact[] }>({
    queryKey: [KEY, homeId],
    queryFn: () => fetch(`/api/v1/home-emergency-contacts${qs}`).then((r) => r.json()),
  });
}

export function useCreateHomeEmergencyContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HomeEmergencyContact>) =>
      fetch("/api/v1/home-emergency-contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
