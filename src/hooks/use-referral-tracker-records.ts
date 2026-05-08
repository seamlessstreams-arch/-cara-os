import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReferralTrackerRecord } from "@/types/extended";

export function useReferralTrackerRecords() {
  return useQuery<ReferralTrackerRecord[]>({
    queryKey: ["referral-tracker-records"],
    queryFn: () => fetch("/api/v1/referral-tracker-records").then((r) => r.json()),
  });
}

export function useCreateReferralTrackerRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ReferralTrackerRecord>) =>
      fetch("/api/v1/referral-tracker-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["referral-tracker-records"] }),
  });
}
