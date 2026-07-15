"use client";

// ══════════════════════════════════════════════════════════════════════════════
// useCaraCommand
//
// Client hook for the universal Cara command system. Talks to
// POST /api/cara/generate (invoke) and PATCH /api/cara/generate (decision).
//
// Usage:
//   const cara = useCaraCommand();
//   cara.invoke({ commandId: "improve_writing", inputText: "...", ... });
//   cara.decide({ outputId: "...", decision: "approve" });
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from "react";
import type { CaraCommandId } from "@/lib/cara/cara-types";
import type { CaraRole } from "@/lib/cara/cara-permissions";
import { currentUserId } from "@/lib/auth/current-user";

// ── Types ──────────────────────────────────────────────────────────────────

export type CaraDecision = "approve" | "reject" | "request_changes" | "commit" | "withdraw";

export interface CaraInvokeParams {
  commandId: CaraCommandId;
  inputText: string;
  actorUserId?: string;
  actorRole?: CaraRole;
  organisationId?: string;
  homeId?: string;
  childId?: string;
  staffId?: string;
  sourceModule?: string;
  sourceRecordType?: string;
  sourceRecordId?: string;
  inputMetadata?: Record<string, unknown>;
}

export interface CaraDecisionParams {
  outputId: string;
  decision: CaraDecision;
  decisionText?: string;
  editedText?: string;
  committedRecordType?: string;
  committedRecordId?: string;
  actorUserId?: string;
  actorRole?: CaraRole;
}

export interface CaraCommandResult {
  requestId: string;
  outputId?: string;
  generatedText: string;
  structuredOutput: Record<string, unknown>;
  confidence: "low" | "medium" | "high";
  redactedContextSummary: string;
  contextRecordIds: string[];
  caraLabel: string;
  llmUsed: boolean;
  providerId?: string;
  modelId?: string;
  approvalRequired: boolean;
  persisted: boolean;
  /** Safeguarding guardrail scan results */
  guardrails?: {
    flagged: boolean;
    mandatoryReview: boolean;
    flags: Array<{
      id: string;
      severity: "critical" | "warning" | "info";
      category: string;
      message: string;
      matchedSnippet?: string;
    }>;
    summary: string;
  };
}

export interface UseCaraCommandReturn {
  // State
  loading: boolean;
  deciding: boolean;
  result: CaraCommandResult | null;
  error: string | null;
  providerConfigured: boolean | null;

  // Actions
  invoke: (params: CaraInvokeParams) => Promise<CaraCommandResult | null>;
  decide: (params: CaraDecisionParams) => Promise<boolean>;
  clear: () => void;
}

// ── Default actor from auth context ────────────────────────────────────────

function getDefaultActor(): { userId: string; role: CaraRole } {
  if (typeof window === "undefined") {
    return { userId: "unknown", role: "none" as CaraRole };
  }
  const userId = currentUserId();
  return { userId, role: "registered_manager" as CaraRole };
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useCaraCommand(): UseCaraCommandReturn {
  const [loading, setLoading] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [result, setResult] = useState<CaraCommandResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providerConfigured, setProviderConfigured] = useState<boolean | null>(null);

  const invoke = useCallback(async (params: CaraInvokeParams): Promise<CaraCommandResult | null> => {
    setLoading(true);
    setError(null);
    setResult(null);

    const defaults = getDefaultActor();

    try {
      const res = await fetch("/api/cara/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandId: params.commandId,
          inputText: params.inputText,
          actorUserId: params.actorUserId || defaults.userId,
          actorRole: params.actorRole || defaults.role,
          organisationId: params.organisationId,
          homeId: params.homeId,
          childId: params.childId,
          staffId: params.staffId,
          sourceModule: params.sourceModule,
          sourceRecordType: params.sourceRecordType,
          sourceRecordId: params.sourceRecordId,
          inputMetadata: params.inputMetadata,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Cara request failed");
        setProviderConfigured(data.providerConfigured ?? null);
        setLoading(false);
        return null;
      }

      const commandResult = data.data as CaraCommandResult;
      setResult(commandResult);
      setProviderConfigured(true);
      setLoading(false);
      return commandResult;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setLoading(false);
      return null;
    }
  }, []);

  const decide = useCallback(async (params: CaraDecisionParams): Promise<boolean> => {
    setDeciding(true);
    setError(null);

    const defaults = getDefaultActor();

    try {
      const res = await fetch("/api/cara/generate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outputId: params.outputId,
          decision: params.decision,
          decisionText: params.decisionText,
          editedText: params.editedText,
          committedRecordType: params.committedRecordType,
          committedRecordId: params.committedRecordId,
          actorUserId: params.actorUserId || defaults.userId,
          actorRole: params.actorRole || defaults.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Decision failed");
        setDeciding(false);
        return false;
      }

      // Update result status locally
      if (result && params.decision === "approve") {
        setResult({ ...result });
      }

      setDeciding(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setDeciding(false);
      return false;
    }
  }, [result]);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
    setProviderConfigured(null);
  }, []);

  return {
    loading,
    deciding,
    result,
    error,
    providerConfigured,
    invoke,
    decide,
    clear,
  };
}
