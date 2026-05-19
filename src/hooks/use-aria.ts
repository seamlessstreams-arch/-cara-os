"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "./use-api";
import type { AriaMode, AriaStyle } from "@/types/extended";

export interface AriaRequestPayload {
  mode: AriaMode;
  style: AriaStyle;
  page_context: string;
  record_type?: string;
  source_content?: string;
  linked_records?: string;
  audience?: string;
  question?: string;
  user_role?: string;
  aria_assisted?: boolean;
  /** Document text — used for document_classify and document_to_form modes */
  document_text?: string;
}

export function useAria() {
  return useMutation({
    mutationFn: (payload: AriaRequestPayload) =>
      api.post<{ data: { response: string; mode: AriaMode; style: AriaStyle } }>(
        "/aria",
        { ...payload, user_role: payload.user_role || "registered_manager" }
      ),
  });
}

/**
 * Streaming variant of useAria.
 *
 * Sends the request with `stream: true` and processes the SSE response from
 * POST /api/v1/aria. Calls onChunk with the accumulated text as each delta
 * arrives, then calls onDone when the stream closes.
 *
 * Supports abort so callers can cancel mid-stream (e.g. component unmount).
 */
export function useAriaStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(
    async (
      payload: AriaRequestPayload,
      onChunk: (accumulatedText: string) => void,
      onError?: (error: Error) => void,
      onDone?: (fullText: string) => void,
    ): Promise<void> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      try {
        const res = await fetch("/api/v1/aria", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            user_role: payload.user_role || "registered_manager",
            stream: true,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const errBody = await res.json().catch(() => ({ error: "Request failed" }));
          throw new Error(
            (errBody as { error?: string }).error ?? `API error ${res.status}`,
          );
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;

            try {
              const event = JSON.parse(data) as { type: string; text?: string };
              if (event.type === "text_delta" && event.text) {
                fullText += event.text;
                onChunk(fullText);
              }
            } catch {
              // Ignore unparseable SSE lines
            }
          }
        }

        onDone?.(fullText);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          onError?.(error);
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { stream, isStreaming, abort };
}
