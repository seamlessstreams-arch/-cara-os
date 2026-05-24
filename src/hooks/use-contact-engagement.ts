"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CONTACT & FAMILY ENGAGEMENT HOOK
// React Query wrapper for /api/v1/contact-engagement
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { ContactEngagementResult } from "@/lib/engines/contact-engagement-engine";

interface ContactEngagementResponse {
  data: ContactEngagementResult;
}

export function useContactEngagement() {
  return useQuery({
    queryKey: ["contact-engagement"],
    queryFn: () => api.get<ContactEngagementResponse>("/contact-engagement"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
