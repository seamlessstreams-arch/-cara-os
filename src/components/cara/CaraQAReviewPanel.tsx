// ══════════════════════════════════════════════════════════════════════════════
// CaraQAReviewPanel — Quality assurance review panel for records
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import type { CaraRole } from "@/lib/cara/core/types";

interface QAIssue {
  criterion: string;
  severity: "info" | "warning" | "critical";
  message: string;
  suggestion?: string;
  lineRef?: string;
}

interface QAResult {
  overallScore: number;
  grade: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate";
  issues: QAIssue[];
  strengths: string[];
  summary: string;
  reviewType: "quick_check" | "full_review";
}

interface Props {
  recordId: string;
  recordType: string;
  recordContent: string;
  userRole: CaraRole;
  organisationId: string;
  childId?: string;
  onReviewComplete?: (result: QAResult) => void;
}

const GRADE_STYLES: Record<string, string> = {
  excellent: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  good: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  adequate: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  requires_improvement: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  inadequate: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const SEVERITY_STYLES: Record<string, string> = {
  info: "border-l-blue-500 bg-blue-50 dark:bg-blue-900/10",
  warning: "border-l-amber-500 bg-amber-50 dark:bg-amber-900/10",
  critical: "border-l-red-500 bg-red-50 dark:bg-red-900/10",
};

export function CaraQAReviewPanel({
  recordId,
  recordType,
  recordContent,
  userRole,
  organisationId,
  childId,
  onReviewComplete,
}: Props) {
  const [reviewType, setReviewType] = useState<"quick" | "full">("quick");
  const [isReviewing, setIsReviewing] = useState(false);
  const [result, setResult] = useState<QAResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReview = async () => {
    setIsReviewing(true);
    setError(null);

    try {
      const response = await fetch("/api/cara/qa/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId,
          recordType,
          content: recordContent,
          reviewType,
          userId: "current-user",
          userRole,
          organisationId,
          childId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Review failed");
      } else {
        setResult(data.result);
        onReviewComplete?.(data.result);
      }
    } catch (err) {
      setError("Network error — could not reach QA service");
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold">Quality Assurance Review</h3>
              <p className="text-xs text-muted-foreground">
                {recordType.replace(/_/g, " ")} • Record {recordId.slice(0, 8)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      {!result && (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-muted-foreground">Review depth:</label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setReviewType("quick")}
                className={`px-3 py-1.5 text-xs rounded-md font-medium ${
                  reviewType === "quick"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                Quick Check (local)
              </button>
              <button
                onClick={() => setReviewType("full")}
                className={`px-3 py-1.5 text-xs rounded-md font-medium ${
                  reviewType === "full"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                Full AI Review
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {reviewType === "quick"
              ? "Rule-based checks run locally — no data leaves the system. Checks length, voice of child, analytical language, follow-up actions."
              : "AI-powered deep review using governed model. Checks regulatory alignment, professional curiosity, evidence quality, and more."
            }
          </p>

          <button
            onClick={handleReview}
            disabled={isReviewing}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {isReviewing ? "Reviewing..." : `Run ${reviewType === "quick" ? "Quick" : "Full"} Review`}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mb-4 p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="p-4 space-y-4">
          {/* Score header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold">{result.overallScore}%</div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${GRADE_STYLES[result.grade]}`}>
                {result.grade.replace(/_/g, " ")}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {result.reviewType === "quick_check" ? "Quick check" : "Full AI review"}
            </span>
          </div>

          {/* Summary */}
          <p className="text-sm text-muted-foreground">{result.summary}</p>

          {/* Strengths */}
          {result.strengths.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Strengths</h4>
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <svg className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Issues */}
          {result.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">
                Issues ({result.issues.length})
              </h4>
              <div className="space-y-2">
                {result.issues.map((issue, i) => (
                  <div
                    key={i}
                    className={`border-l-2 rounded-r-md p-2.5 ${SEVERITY_STYLES[issue.severity]}`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium">{issue.criterion}</span>
                      <span className={`text-xs px-1 py-0.5 rounded ${
                        issue.severity === "critical" ? "bg-red-200 text-red-800" :
                        issue.severity === "warning" ? "bg-amber-200 text-amber-800" :
                        "bg-blue-200 text-blue-800"
                      }`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{issue.message}</p>
                    {issue.suggestion && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Suggestion: {issue.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset */}
          <button
            onClick={() => { setResult(null); setError(null); }}
            className="w-full py-1.5 text-xs text-muted-foreground border border-border rounded-md hover:bg-muted"
          >
            Run another review
          </button>
        </div>
      )}
    </div>
  );
}
