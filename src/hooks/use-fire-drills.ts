import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FireDrill } from "@/types/extended";

const KEY = "fire-drills";
const API = "/api/v1/fire-drills";

export function useFireDrills() {
  return useQuery<{ data: FireDrill[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateFireDrill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FireDrill>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateFireDrill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FireDrill> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
