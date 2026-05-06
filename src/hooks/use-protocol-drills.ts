import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProtocolDrill } from "@/types/extended";

const KEY = "protocol-drills";
const API = "/api/v1/protocol-drills";

export function useProtocolDrills() {
  return useQuery<{ data: ProtocolDrill[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateProtocolDrill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProtocolDrill>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateProtocolDrill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProtocolDrill> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
