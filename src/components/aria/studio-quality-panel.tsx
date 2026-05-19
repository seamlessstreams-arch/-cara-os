"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { AriaQualityCheck } from "@/types/aria-studio";

interface AriaStudioQualityPanelProps {
  qualityCheck: AriaQualityCheck;
  score: number | null;
}

const CHECKS: Array<{
  key: keyof AriaQualityCheck;
  label: string;
  critical?: boolean;
}> = [
  { key: "evidence_cited", label: "Evidence cited in content", critical: true },
  { key: "child_voice_considered", label: "Child voice considered" },
  { key: "risk_considered", label: "Risk considerations addressed" },
  { key: "safeguarding_considered", label: "Safeguarding addressed" },
  { key: "regulation_considered", label: "Regulatory context addressed" },
  { key: "actions_clear", label: "Actions are clear and specific" },
  { key: "owner_assigned", label: "Actions have owners assigned" },
  { key: "review_date_set", label: "Review date specified" },
  { key: "human_approval_complete", label: "Human approval completed", critical: true },
  { key: "sensitive_language_reviewed", label: "Sensitive language reviewed" },
  { key: "no_unsupported_claims", label: "No unsupported absolute claims", critical: true },
  { key: "no_ai_style_filler", label: "No AI-style filler language", critical: true },
  { key: "dignity_language_passed", label: "Dignity language standards met", critical: true },
];

export function AriaStudioQualityPanel({ qualityCheck, score }: AriaStudioQualityPanelProps) {
  const passedCount = CHECKS.filter((c) => qualityCheck[c.key] === true).length;
  const totalCount = CHECKS.length;

  return (
    <div className="space-y-4">
      {/* Overall score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Quality score</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{score ?? 0}/100</span>
            <Badge
              variant={qualityCheck.overall_passed ? "default" : "destructive"}
              className={qualityCheck.overall_passed ? "bg-green-600" : ""}
            >
              {qualityCheck.overall_passed ? "Passed" : "Failed"}
            </Badge>
          </div>
        </div>
        <Progress
          value={score ?? 0}
          className={`h-2 ${
            (score ?? 0) >= 80
              ? "[&>div]:bg-green-500"
              : (score ?? 0) >= 60
                ? "[&>div]:bg-yellow-500"
                : "[&>div]:bg-red-500"
          }`}
        />
        <p className="text-xs text-muted-foreground">{passedCount} of {totalCount} checks passed</p>
      </div>

      {/* Individual checks */}
      <div className="space-y-1.5">
        {CHECKS.map((check) => {
          const passed = qualityCheck[check.key] === true;
          return (
            <div key={check.key} className="flex items-center gap-2 text-xs">
              {passed ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
              ) : check.critical ? (
                <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
              )}
              <span className={passed ? "text-foreground" : check.critical ? "text-red-600 font-medium" : "text-muted-foreground"}>
                {check.label}
                {check.critical && !passed && " *"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Issues */}
      {qualityCheck.issues.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-red-600">Issues to resolve:</p>
          <ul className="space-y-1">
            {qualityCheck.issues.map((issue, i) => (
              <li key={i} className="text-xs text-red-600 flex gap-1">
                <span>•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {qualityCheck.overall_passed && (
        <div className="text-xs text-green-700 bg-green-50 rounded-md px-3 py-2">
          ✓ All critical checks passed. This artifact is ready to commit to the official record.
        </div>
      )}

      {!qualityCheck.overall_passed && (
        <div className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2">
          Resolve the issues above before this artifact can be committed to the official record.
          Critical checks (marked *) must pass.
        </div>
      )}
    </div>
  );
}
