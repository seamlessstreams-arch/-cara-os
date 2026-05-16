"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — Child Profile Panel
//
// Displays the compiled child intelligence profile used for generation.
// Shows strengths, needs, risk flags, and objectives.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Star, AlertTriangle, Target, User,
} from "lucide-react";

interface ChildProfileData {
  childName: string;
  age: number;
  strengths: string[];
  needs: string[];
  riskFlags: string[];
  interests?: string[];
  triggers?: string[];
  copingStrategies?: string[];
  communicationPreferences?: string;
  carePlanObjectives?: Array<{ title: string; status: string }>;
}

interface ChildProfilePanelProps {
  profile: ChildProfileData;
  expanded?: boolean;
}

export function ChildProfilePanel({ profile, expanded = false }: ChildProfilePanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(expanded);

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-[var(--cs-navy)]">
            {profile.childName}
          </span>
          <Badge className="text-[10px] bg-blue-100 text-blue-700 border-blue-200">
            Age {profile.age}
          </Badge>
        </div>
        <span className="text-xs text-blue-600">
          {isExpanded ? "Collapse" : "View profile"}
        </span>
      </button>

      {/* Summary (always visible) */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {profile.riskFlags.length > 0 && (
          <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-0.5" />
            {profile.riskFlags.length} risk flag{profile.riskFlags.length > 1 ? "s" : ""}
          </Badge>
        )}
        <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">
          <Star className="h-3 w-3 mr-0.5" />
          {profile.strengths.length} strength{profile.strengths.length > 1 ? "s" : ""}
        </Badge>
        <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">
          <Target className="h-3 w-3 mr-0.5" />
          {profile.needs.length} need{profile.needs.length > 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-4 space-y-3 border-t border-blue-200 pt-3">
          {/* Strengths */}
          {profile.strengths.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 mb-1">Strengths</h4>
              <div className="flex flex-wrap gap-1">
                {profile.strengths.map((s, i) => (
                  <Badge key={i} className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100 font-normal">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Needs */}
          {profile.needs.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 mb-1">Needs</h4>
              <div className="flex flex-wrap gap-1">
                {profile.needs.map((n, i) => (
                  <Badge key={i} className="text-[10px] bg-amber-50 text-amber-700 border-amber-100 font-normal">
                    {n}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Risk Flags */}
          {profile.riskFlags.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-red-700 mb-1">Risk Flags</h4>
              <ul className="space-y-0.5">
                {profile.riskFlags.map((r, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 mb-1">Interests</h4>
              <p className="text-xs text-[var(--cs-text-secondary)]">{profile.interests.join(", ")}</p>
            </div>
          )}

          {/* Triggers */}
          {profile.triggers && profile.triggers.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-orange-700 mb-1">Known Triggers</h4>
              <p className="text-xs text-[var(--cs-text-secondary)]">{profile.triggers.join(", ")}</p>
            </div>
          )}

          {/* Communication */}
          {profile.communicationPreferences && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-purple-700 mb-1">Communication</h4>
              <p className="text-xs text-[var(--cs-text-secondary)]">{profile.communicationPreferences}</p>
            </div>
          )}

          {/* Care Plan Objectives */}
          {profile.carePlanObjectives && profile.carePlanObjectives.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-navy)] mb-1">Care Plan Objectives</h4>
              <ul className="space-y-0.5">
                {profile.carePlanObjectives.map((obj, i) => (
                  <li key={i} className="text-xs text-[var(--cs-text-secondary)] flex items-center gap-1.5">
                    <Target className="h-3 w-3 shrink-0 text-[var(--cs-text-muted)]" />
                    {obj.title}
                    <Badge className="text-[9px] bg-[var(--cs-surface)] text-[var(--cs-text-muted)] border-[var(--cs-border)]">
                      {obj.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
