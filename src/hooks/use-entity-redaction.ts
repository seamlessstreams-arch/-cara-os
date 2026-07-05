"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Entity-stable Redaction hook (client)
// GET  /api/v1/entity-redaction        → the home codebook
// POST /api/v1/entity-redaction        → redact / rehydrate a document set
// ══════════════════════════════════════════════════════════════════════════════

import { useMutation, useQuery } from "@tanstack/react-query";
import type { Codebook, RedactionOutcome } from "@/lib/entity-redaction/types";

const URL = "/api/v1/entity-redaction";

export function useHomeCodebook() {
  return useQuery<{ data: { codebook: Codebook } }>({
    queryKey: ["entity-redaction", "codebook"],
    queryFn: () => fetch(URL).then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRedactDocuments() {
  return useMutation<
    { data: RedactionOutcome | { codebook: Codebook; documents: { id: string; text: string }[] } },
    Error,
    { documents: { id: string; text: string }[]; mode?: "redact" | "rehydrate" }
  >({
    mutationFn: (payload) =>
      fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, useHomeEntities: true }),
      }).then((r) => r.json()),
  });
}
