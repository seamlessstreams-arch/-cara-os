// ══════════════════════════════════════════════════════════════════════════════
// CaraStudioGenerator — UI for generating child-centred therapeutic resources
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import type { CaraRole, CaraTaskResult } from "@/lib/cara/core/types";
import { CaraModelDecisionBadge } from "./CaraModelDecisionBadge";
import { CaraHumanApprovalBanner } from "./CaraHumanApprovalBanner";

interface Props {
  userRole: CaraRole;
  organisationId: string;
  homeId: string;
  childId: string;
  childName?: string;
  childAge?: number;
  onGenerated?: (result: CaraTaskResult) => void;
}

type SessionType =
  | "keywork_plan"
  | "direct_work"
  | "emotional_regulation"
  | "missing_return"
  | "exploitation_awareness"
  | "restorative_conversation";

const SESSION_TYPES: { value: SessionType; label: string; description: string }[] = [
  { value: "keywork_plan", label: "Keywork Session Plan", description: "Structured plan for regular keywork sessions" },
  { value: "direct_work", label: "Direct Work Resource", description: "Therapeutic activities tailored to the child" },
  { value: "emotional_regulation", label: "Emotional Regulation", description: "Coping strategies and regulation tools" },
  { value: "missing_return", label: "Missing Return Discussion", description: "Sensitive return interview framework" },
  { value: "exploitation_awareness", label: "Exploitation Awareness", description: "Age-appropriate safety education" },
  { value: "restorative_conversation", label: "Restorative Conversation", description: "Repair-focused dialogue framework" },
];

export function CaraStudioGenerator({
  userRole,
  organisationId,
  homeId,
  childId,
  childName,
  childAge,
  onGenerated,
}: Props) {
  const [sessionType, setSessionType] = useState<SessionType>("keywork_plan");
  const [context, setContext] = useState("");
  const [goals, setGoals] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<CaraTaskResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/cara/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionType,
          userId: "current-user",
          userRole,
          organisationId,
          homeId,
          childId,
          context: context.trim() || undefined,
          goals: goals.trim() ? goals.split("\n").filter(Boolean) : undefined,
          childAge,
          childName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Generation failed");
      } else {
        setResult(data.result);
        onGenerated?.(data.result);
      }
    } catch (err) {
      setError("Network error — could not reach Cara Studio");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Cara Studio</h3>
            <p className="text-xs text-muted-foreground">
              Generate child-centred therapeutic resources
              {childName && ` for ${childName}`}
              {childAge && ` (age ${childAge})`}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-4 space-y-4">
        {/* Session type selection */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Resource Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SESSION_TYPES.map(st => (
              <button
                key={st.value}
                onClick={() => setSessionType(st.value)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  sessionType === st.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <p className="text-xs font-medium">{st.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{st.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Context */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Additional Context (optional)
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Recent events, mood, triggers, or anything relevant to this session..."
            className="w-full rounded-md border border-border bg-background p-2.5 text-sm resize-none"
            rows={3}
          />
        </div>

        {/* Goals */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Session Goals (one per line, optional)
          </label>
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="Build trust around difficult conversations&#10;Explore feelings about contact with family&#10;Develop coping strategies for school anxiety"
            className="w-full rounded-md border border-border bg-background p-2.5 text-sm resize-none"
            rows={3}
          />
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {isGenerating ? "Generating resource..." : "Generate Resource"}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          Generated resources are drafts requiring professional review before use with young people.
        </p>
      </div>

      {/* Result */}
      {error && (
        <div className="mx-4 mb-4 p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="border-t border-border p-4 space-y-3">
          <CaraModelDecisionBadge
            provider={result.provider}
            model={result.model}
            riskLevel={result.riskLevel}
            approvalStatus={result.approvalStatus}
            redactionApplied={result.redactionApplied}
            requiresApproval={result.requiresApproval}
            generatedAt={result.generatedAt}
          />

          <div className="rounded-lg border border-border bg-background p-4">
            <pre className="text-sm whitespace-pre-wrap font-sans">{result.output}</pre>
          </div>

          {result.requiresApproval && (
            <CaraHumanApprovalBanner
              approvalId={result.id}
              taskType={result.taskType}
              riskLevel={result.riskLevel}
              status={result.approvalStatus}
              generatedAt={result.generatedAt}
            />
          )}
        </div>
      )}
    </div>
  );
}
