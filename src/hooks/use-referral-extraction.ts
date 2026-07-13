"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "./use-api";
import type { ReferralExtraction } from "@/lib/referral-extraction/referral-extraction-engine";

export type { ReferralExtraction };

export interface ReferralExtractionResponse {
  data: ReferralExtraction;
  /** Provenance: whether the governed AI layer filled any gap, and how it resolved. */
  ai?: { used: boolean; method: string; filled: string[] };
}

/**
 * Paste referral text → structured extraction (no persistence). Opts into the
 * governed AI-enhance layer, which fills only non-PII gaps and falls back to the
 * deterministic result on refusal / no-credits (today's prod always falls back).
 */
export function useReferralExtraction() {
  return useMutation({
    mutationFn: (text: string) =>
      api.post<ReferralExtractionResponse>("/referral-extraction", { text, enhance: true }),
  });
}
