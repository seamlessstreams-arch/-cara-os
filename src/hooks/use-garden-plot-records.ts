import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GardenPlotRecord } from "@/types/extended";

const KEY = "garden-plot-records";
const API = "/api/v1/garden-plot-records";

export function useGardenPlotRecords() {
  return useQuery<{ data: GardenPlotRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateGardenPlotRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<GardenPlotRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateGardenPlotRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<GardenPlotRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
