"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ClubRecord } from "@/types/extended";

const KEY = "club-records";

export function useClubRecords(childId?: string) {
  const qs = childId ? `?child_id=${childId}` : "";
  return useQuery<{ data: ClubRecord[] }>({
    queryKey: [KEY, childId],
    queryFn: () => fetch(`/api/v1/club-records${qs}`).then((r) => r.json()),
  });
}

export function useCreateClubRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ClubRecord>) =>
      fetch("/api/v1/club-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
