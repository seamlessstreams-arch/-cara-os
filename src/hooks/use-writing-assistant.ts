"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA WRITING ASSISTANT — client hook
//
// Debounced, abortable, cached checking that surfaces issues ONLY when there's
// something to flag during data entry. No API call per keystroke; previous
// in-flight checks are aborted; identical text is served from cache; stale
// responses (text moved on) are discarded.
// ══════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MIN_CHECK_LENGTH,
  type WritingCheckResult,
  type WritingIssue,
  type WritingMode,
} from "@/lib/writing-assistant/types";
import { currentUserId } from "@/lib/auth/current-user";

const ENDPOINT = "/api/writing-assistant/check";

function userHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    h["x-user-id"] = currentUserId();
  }
  return h;
}

export interface UseWritingAssistantOptions {
  text: string;
  recordType?: string;
  fieldName?: string;
  childId?: string;
  workflowId?: string;
  mode?: WritingMode;
  knownNames?: string[];
  enabled?: boolean;
  debounceMs?: number;
}

export interface UseWritingAssistantReturn {
  issues: WritingIssue[];
  result: WritingCheckResult | null;
  loading: boolean;
  error: string | null;
  ignore: (id: string) => void;
  ignoredCount: number;
  recheck: () => void;
}

export function useWritingAssistant(opts: UseWritingAssistantOptions): UseWritingAssistantReturn {
  const { text, recordType, fieldName, childId, workflowId, mode = "standard", knownNames, enabled = true } = opts;
  const debounceMs = opts.debounceMs ?? 900;

  const [result, setResult] = useState<WritingCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ignored, setIgnored] = useState<Set<string>>(new Set());

  const cache = useRef<Map<string, WritingCheckResult>>(new Map());
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  const run = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!enabled || trimmed.length < MIN_CHECK_LENGTH) {
        setResult(null);
        setLoading(false);
        setError(null);
        return;
      }
      const cached = cache.current.get(value);
      if (cached) {
        setResult(cached);
        setLoading(false);
        setError(null);
        return;
      }
      // Cancel any in-flight check.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const mySeq = ++seq.current;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: userHeaders(),
          body: JSON.stringify({ text: value, recordType, fieldName, childId, workflowId, mode, knownNames }),
          signal: controller.signal,
        });
        if (!res.ok) {
          if (mySeq === seq.current) {
            setError("unavailable");
            setLoading(false);
          }
          return;
        }
        const json = (await res.json()) as { data: WritingCheckResult };
        cache.current.set(value, json.data);
        // Discard if the text has moved on since this request started.
        if (mySeq === seq.current) {
          setResult(json.data);
          setLoading(false);
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return; // superseded — ignore
        if (mySeq === seq.current) {
          setError("unavailable");
          setLoading(false);
        }
      }
    },
    [enabled, recordType, fieldName, childId, workflowId, mode, knownNames],
  );

  // Debounced trigger on text change.
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void run(text), debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, debounceMs, run]);

  // Cleanup on unmount.
  useEffect(() => () => abortRef.current?.abort(), []);

  const ignore = useCallback((id: string) => {
    setIgnored((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const recheck = useCallback(() => {
    cache.current.delete(text);
    void run(text);
  }, [text, run]);

  const issues = useMemo(() => (result?.issues ?? []).filter((i) => !ignored.has(i.id)), [result, ignored]);

  return { issues, result, loading, error, ignore, ignoredCount: ignored.size, recheck };
}
