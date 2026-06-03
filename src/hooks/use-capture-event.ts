"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CAPTURE EVENT HOOK (the write path, client side)
// POST /api/v1/event-capture — capture a single canonical event once. On success
// it invalidates every spine-derived view so the new event surfaces everywhere.
// ══════════════════════════════════════════════════════════════════════════════

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { CaptureDraft, CaptureOutcome } from "@/lib/event-capture/capture-event-service";

interface CaptureResponse {
  data: CaptureOutcome;
}

// Every query key that reads the spine — invalidated so the captured event shows up.
const SPINE_VIEWS = [
  "event-stream", "event-intelligence", "event-capture",
  "duplicate-detection", "conflict-detection", "evidence-bank", "manager-inbox",
];

export function useCaptureEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { draft: CaptureDraft; force?: boolean }) =>
      api.post<CaptureResponse>("/event-capture", { draft: vars.draft, force: vars.force }),
    onSuccess: () => {
      for (const key of SPINE_VIEWS) qc.invalidateQueries({ queryKey: [key] });
    },
  });
}
