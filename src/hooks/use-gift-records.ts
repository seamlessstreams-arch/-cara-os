import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GiftRecord } from "@/types/extended";

const KEY = "gift-records";
const API = "/api/v1/gift-records";

export function useGiftRecords() {
  return useQuery<{ data: GiftRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateGiftRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<GiftRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateGiftRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<GiftRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
