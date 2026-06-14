// ══════════════════════════════════════════════════════════════════════════════
// CaraRedactionNotice — Shows redaction details on AI-generated output
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import type { CaraRedactionEntry, CaraDataSensitivity } from "@/lib/cara/core/types";

interface Props {
  redactionEntries: CaraRedactionEntry[];
  sensitivityLevel: CaraDataSensitivity;
  provider: string;
  compact?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  child_name: "Child name",
  staff_name: "Staff name",
  dob: "Date of birth",
  address: "Address",
  home_name: "Home name",
  school_name: "School name",
  local_authority: "Local authority",
  nhs_info: "NHS information",
  child_identifier: "Child ID",
  phone_number: "Phone number",
  email: "Email address",
  placement_name: "Placement name",
};

export function CaraRedactionNotice({
  redactionEntries,
  sensitivityLevel,
  provider,
  compact = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const categoryCounts = redactionEntries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + 1;
    return acc;
  }, {});

  const totalRedactions = redactionEntries.length;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 text-xs font-medium">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        {totalRedactions} redacted
      </span>
    );
  }

  return (
    <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-sm font-medium text-violet-800 dark:text-violet-300">
            Data Protection Applied
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-200"
        >
          {expanded ? "Hide details" : "Show details"}
        </button>
      </div>

      <p className="text-xs text-violet-700 dark:text-violet-400">
        {totalRedactions} personal data element{totalRedactions !== 1 ? "s" : ""} redacted before
        being sent to {provider}. Sensitivity level: {sensitivityLevel.replace(/_/g, " ")}.
      </p>

      {expanded && (
        <div className="space-y-2 pt-2 border-t border-violet-200 dark:border-violet-700">
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(categoryCounts).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between px-2 py-1 rounded bg-violet-100/50 dark:bg-violet-800/30">
                <span className="text-violet-700 dark:text-violet-300">
                  {CATEGORY_LABELS[category] ?? category}
                </span>
                <span className="font-medium text-violet-800 dark:text-violet-200">
                  {count}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-violet-600 dark:text-violet-400 italic">
            Original data is never sent to external AI providers. Placeholder tokens
            (e.g. [CHILD_1]) are used during processing and restored locally.
          </p>
        </div>
      )}
    </div>
  );
}
