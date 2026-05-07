import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PhotoConsentRecord } from "@/types/extended";

const KEY = "photo-consent-records";
const API = "/api/v1/photo-consent-records";

export function usePhotoConsentRecords(childId?: string) {
  return useQuery<{ data: PhotoConsentRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreatePhotoConsentRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PhotoConsentRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePhotoConsentRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PhotoConsentRecord> & { id: string }) =>
      fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
