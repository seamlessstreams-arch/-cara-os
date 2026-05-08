import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SocialWorkerContactRecord } from "@/types/extended";

export function useSocialWorkerContactRecords(childId?: string) {
  return useQuery<SocialWorkerContactRecord[]>({
    queryKey: ["social-worker-contact-records", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/social-worker-contact-records?child_id=${childId}`
        : "/api/v1/social-worker-contact-records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch social worker contact records");
      return res.json();
    },
  });
}

export function useCreateSocialWorkerContactRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<SocialWorkerContactRecord, "id">) => {
      const res = await fetch("/api/v1/social-worker-contact-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create social worker contact record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-worker-contact-records"] }),
  });
}
