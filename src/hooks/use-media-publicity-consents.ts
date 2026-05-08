import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MediaPublicityConsent } from "@/types/extended";

const KEY = "media-publicity-consents";
const API = "/api/v1/media-publicity-consents";

export function useMediaPublicityConsents(childId?: string) {
  return useQuery<{ data: MediaPublicityConsent[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateMediaPublicityConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MediaPublicityConsent>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateMediaPublicityConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MediaPublicityConsent> & { id: string }) =>
      fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
