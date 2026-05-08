import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FireEquipmentCheck } from "@/types/extended";

const KEY = "fire-equipment-checks";
const API = "/api/v1/fire-equipment-checks";

export function useFireEquipmentChecks() {
  return useQuery<{ data: FireEquipmentCheck[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateFireEquipmentCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FireEquipmentCheck>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateFireEquipmentCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FireEquipmentCheck> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
