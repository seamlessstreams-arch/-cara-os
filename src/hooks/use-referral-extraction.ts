"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "./use-api";
import type { ReferralExtraction } from "@/lib/referral-extraction/referral-extraction-engine";

export type { ReferralExtraction };

/** Paste referral text → deterministic structured extraction (no persistence). */
export function useReferralExtraction() {
  return useMutation({
    mutationFn: (text: string) => api.post<{ data: ReferralExtraction }>("/referral-extraction", { text }),
  });
}
