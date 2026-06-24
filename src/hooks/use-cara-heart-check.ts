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

  // Key the debounce off a serialization of the WHOLE record. The request POSTs
  // the entire record, but a hand-curated dep list silently omitted ~19 of its
  // fields (childVoice, weaponConcern, repairRecorded, managerConsulted, …) — so a
  // form wiring any of those to an editable input would show stale analysis until
  // some *other* tracked field changed. recordKey re-fires on ANY field change and
  // is content-stable (no re-fire when an unmemoised record keeps the same values).
  const recordKey = record ? JSON.stringify(record) : null;

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
  }, [recordKey, runCheck]);

  return { data, isLoading, error };
}
