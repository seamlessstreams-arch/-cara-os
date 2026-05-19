"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WelcomeTour } from "@/types/extended";

const KEY = "welcome-tours";

export function useWelcomeTours(childId?: string, homeId?: string) {
  const qs = childId ? `?child_id=${childId}` : homeId ? `?home_id=${homeId}` : "";
  return useQuery<{ data: WelcomeTour[] }>({
    queryKey: [KEY, childId, homeId],
    queryFn: () => fetch(`/api/v1/welcome-tours${qs}`).then((r) => r.json()),
  });
}

export function useCreateWelcomeTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<WelcomeTour>) =>
      fetch("/api/v1/welcome-tours", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
