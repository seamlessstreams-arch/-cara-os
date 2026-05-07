"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BedroomProfile } from "@/types/extended";

const KEY = "bedroom-profiles";

export function useBedroomProfiles(childId?: string) {
  const qs = childId ? `?child_id=${childId}` : "";
  return useQuery<{ data: BedroomProfile[] }>({
    queryKey: [KEY, childId],
    queryFn: () => fetch(`/api/v1/bedroom-profiles${qs}`).then((r) => r.json()),
  });
}

export function useCreateBedroomProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BedroomProfile>) =>
      fetch("/api/v1/bedroom-profiles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
