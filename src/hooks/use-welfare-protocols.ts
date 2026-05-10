"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WelfareProtocol } from "@/types/extended";

const KEY = "welfare-protocols";

export function useWelfareProtocols(childId?: string, homeId?: string) {
  const qs = childId ? `?child_id=${childId}` : homeId ? `?home_id=${homeId}` : "";
  return useQuery<{ data: WelfareProtocol[] }>({
    queryKey: [KEY, childId, homeId],
    queryFn: () => fetch(`/api/v1/welfare-protocols${qs}`).then((r) => r.json()),
  });
}

export function useCreateWelfareProtocol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<WelfareProtocol>) =>
      fetch("/api/v1/welfare-protocols", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
