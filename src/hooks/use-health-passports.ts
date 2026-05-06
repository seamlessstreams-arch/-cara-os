import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HealthPassport } from "@/types/extended";

const KEY = "health-passports";
const API = "/api/v1/health-passports";

export function useHealthPassports(childId?: string) {
  return useQuery<{ data: HealthPassport[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateHealthPassport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HealthPassport>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateHealthPassport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HealthPassport> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
