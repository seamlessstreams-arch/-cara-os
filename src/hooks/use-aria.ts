"use client";

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
