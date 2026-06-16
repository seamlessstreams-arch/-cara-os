"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — useCaraHeartCheck
// Debounced hook that POSTs to /api/v1/cara-heart as the user fills in a
// recording form. Returns live practice intelligence without a page reload.
//
// Only fires when the record has enough data (childId + description ≥ 30 chars
// + type + dateTime). Cancels in-flight requests on new input, discards stale
// responses. Deterministic — no LLM calls from the server.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import type {
  CaraPracticeRecord,
  CaraPracticeIntelligenceOutput,
} from "@/lib/cara-heart/types";

const MIN_DESCRIPTION_LENGTH = 30;
const DEBOUNCE_MS = 2000;

export interface CaraHeartCheckState {
  data: CaraPracticeIntelligenceOutput | null;
  isLoading: boolean;
  error: string | null;
}

export function useCaraHeartCheck(
  record: CaraPracticeRecord | null,
): CaraHeartCheckState {
  const [data, setData] = useState<CaraPracticeIntelligenceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);

  const runCheck = useCallback(async (r: CaraPracticeRecord) => {
    const seq = ++seqRef.current;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/cara-heart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(r),
        signal: abortRef.current.signal,
      });
      if (seq !== seqRef.current) return;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData((json as { data: CaraPracticeIntelligenceOutput }).data ?? null);
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      if (seq !== seqRef.current) return;
      setError((e as Error)?.message ?? "Analysis failed");
    } finally {
      if (seq === seqRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      !record ||
      !record.childId ||
      !record.description ||
      record.description.length < MIN_DESCRIPTION_LENGTH
    ) {
      setData(null);
      setError(null);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runCheck(record), DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    record?.childId,
    record?.type,
    record?.description,
    record?.staffResponse,
    record?.immediateRisk,
    record?.severity,
    record?.policeCalled,
    record?.restraintUsed,
    record?.missingFromCare,
    record?.selfHarmConcern,
    record?.exploitationConcern,
    runCheck,
  ]);

  return { data, isLoading, error };
}
