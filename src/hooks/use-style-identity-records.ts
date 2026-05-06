import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StyleIdentityRecord } from "@/types/extended";

const KEY = "style-identity-records";
const API = "/api/v1/style-identity-records";

export function useStyleIdentityRecords(childId?: string) {
  return useQuery<{ data: StyleIdentityRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateStyleIdentityRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StyleIdentityRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateStyleIdentityRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StyleIdentityRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
