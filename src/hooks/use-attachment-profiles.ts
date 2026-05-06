import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AttachmentProfile } from "@/types/extended";

const KEY = "attachment-profiles";
const API = "/api/v1/attachment-profiles";

export function useAttachmentProfiles(childId?: string) {
  return useQuery<{ data: AttachmentProfile[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateAttachmentProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AttachmentProfile>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateAttachmentProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AttachmentProfile> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
