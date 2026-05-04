"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import { careToast } from "@/lib/toast";
import type { Medication, MedicationAdministration } from "@/types";

export function useMedication(childId?: string) {
  const query = childId ? `?child_id=${childId}` : "";
  return useQuery({
    queryKey: ["medication", childId],
    queryFn: () => api.get<{
      data: {
        medications: Medication[];
        mar: { medication: Medication; administrations: MedicationAdministration[] }[];
        today_schedule: MedicationAdministration[];
        exceptions: MedicationAdministration[];
        scheduled: MedicationAdministration[];
        stock_alerts: Medication[];
      };
      meta: Record<string, number>;
    }>(`/medication${query}`),
  });
}

export function useAdminister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<MedicationAdministration>) =>
      api.post(`/medication/${id}/administer`, data),
    onSuccess: () => {
      careToast.medicationRecorded();
      qc.invalidateQueries({ queryKey: ["medication"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["health-check"] });
    },
    onError: () => careToast.actionFailed("Record medication"),
  });
}
