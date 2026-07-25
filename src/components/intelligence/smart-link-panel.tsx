"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Link2,
  Sparkles,
  Check,
  Plus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ilFetch } from "@/lib/intelligence/il-fetch";

// ── inlined intelligence layer hooks ──────────────────────────────────────────

function useSmartLinks(params?: {
  sourceType?: string;
  sourceId?: string;
}) {
  const query = new URLSearchParams();
  if (params?.sourceType) query.set("sourceType", params.sourceType);
  if (params?.sourceId) query.set("sourceId", params.sourceId);

  return useQuery({
    queryKey: ["il", "smart-links", params],
    queryFn: () => ilFetch<{ ok: boolean; links: unknown[]; persisted: boolean }>(`/smart-links?${query}`),
    enabled: !!params?.sourceId,
  });
}

function useSmartLinkSuggestions() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch<{ ok: boolean; suggestions: unknown[] }>("/smart-links", {
        method: "POST",
        body: JSON.stringify({ ...data, action: "suggest" }),
      }),
  });
}

function useCreateSmartLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch("/smart-links", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["il", "smart-links"] });
    },
  });
}

// ── Types ────────────────────────────────────────────────────────────────────

interface SmartLinkPanelProps {
  sourceType: string;
  sourceId: string;
  homeId?: string;
  childId?: string;
  staffId?: string;
  severity?: string;
  category?: string;
  compact?: boolean;
}

interface DisplayLink {
  id: string;
  sourceType: string;
  targetType: string;
  relationship: string;
  createdAt?: string;
  suggestedBy?: string;
}

interface DisplaySuggestion {
  targetType: string;
  relationship: string;
  reason: string;
  autoLink: boolean;
}

// ── Label Maps ───────────────────────────────────────────────────────────────

const TARGET_TYPE_LABELS: Record<string, string> = {
  child_profile: "Child Profile",
  child_voice: "Voice of the Child",
  child_progress: "Progress Record",
  risk_assessment: "Risk Assessment",
  placement_plan: "Placement Plan",
  daily_log: "Daily Log",
  inspection_evidence: "Ofsted Evidence Room",
  reg44_evidence: "Reg 44 Report",
  reg45_evidence: "Reg 45 Review",
  manager_oversight: "Manager Oversight",
  manager_dashboard: "Manager Dashboard",
  ri_notification: "RI Notification",
  ri_oversight: "RI Oversight",
  staff_passport: "Staff Competence Passport",
  rota_warning: "Rota / Shift Restriction",
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  involves_child: "Involves child",
  may_require_update: "May need updating",
  evidence_of_progress: "Evidence of progress",
  recorded_same_day: "Same day record",
  evidence_item: "Inspection evidence",
  evidence_for_reg44: "Reg 44 evidence",
  evidence_for_reg45: "Reg 45 evidence",
  requires_oversight: "Requires oversight",
  requires_notification: "Notify RI",
  captures_voice: "Captures child voice",
  informs_planning: "Informs planning",
  competence_gap: "Competence gap",
  restricts_duties: "Restricts duties",
  requires_attention: "Needs attention",
  supervision_completed: "Supervision done",
  relates_to_child: "Relates to child",
  relates_to_staff: "Relates to staff",
  requires_response: "Needs response",
  requires_ri_review: "RI review needed",
};

// ── Component ────────────────────────────────────────────────────────────────

export function SmartLinkPanel({
  sourceType,
  sourceId,
  homeId = "oak-house",
  childId,
  staffId,
  severity,
  category,
  compact = false,
}: SmartLinkPanelProps) {
  const [suggestions, setSuggestions] = useState<DisplaySuggestion[]>([]);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());

  const { data: linksData } = useSmartLinks({ sourceType, sourceId });
  const suggestMutation = useSmartLinkSuggestions();
  const createLink = useCreateSmartLink();

  // Fetch suggestions on mount
  useEffect(() => {
    if (sourceId) {
      suggestMutation.mutate(
        { sourceType, sourceId, childId, staffId, homeId, severity, category },
        {
          onSuccess: (data) => {
            if (data?.suggestions) {
              setSuggestions(data.suggestions as DisplaySuggestion[]);
            }
          },
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceType, sourceId]);

  const existingLinks: DisplayLink[] = (linksData?.links as DisplayLink[]) ?? [];

  const handleCreateLink = (suggestion: DisplaySuggestion) => {
    createLink.mutate(
      {
        homeId,
        sourceType,
        sourceId,
        targetType: suggestion.targetType,
        targetId: `auto-${suggestion.targetType}`,
        relationship: suggestion.relationship,
        suggestedBy: "system",
      },
      {
        onSuccess: () => {
          setLinkedIds((prev) => new Set(prev).add(suggestion.targetType + suggestion.relationship));
        },
      },
    );
  };

  const pendingSuggestions = suggestions.filter(
    (s) =>
      !linkedIds.has(s.targetType + s.relationship) &&
      !existingLinks.some((l) => l.targetType === s.targetType && l.relationship === s.relationship),
  );

  const autoLinkSuggestions = pendingSuggestions.filter((s) => s.autoLink);
  const manualSuggestions = pendingSuggestions.filter((s) => !s.autoLink);

  // Auto-link items that are marked autoLink: true
  useEffect(() => {
    if (autoLinkSuggestions.length > 0 && linksData?.persisted) {
      autoLinkSuggestions.forEach((s) => {
        handleCreateLink(s);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLinkSuggestions.length, linksData?.persisted]);

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {existingLinks.length > 0 && (
          <Badge variant="outline" className="gap-1 text-xs">
            <Link2 className="h-3 w-3" />
            {existingLinks.length} linked
          </Badge>
        )}
        {manualSuggestions.length > 0 && (
          <Badge variant="outline" className="gap-1 text-xs border-amber-200 text-amber-700 bg-amber-50">
            <Sparkles className="h-3 w-3" />
            {manualSuggestions.length} suggestions
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="border-blue-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Link2 className="h-4 w-4 text-blue-600" />
          Smart Links
          {existingLinks.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {existingLinks.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Existing Links */}
        {existingLinks.length > 0 && (
          <div className="space-y-1.5">
            {existingLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-2 text-xs p-1.5 rounded bg-blue-50/50"
              >
                <Check className="h-3 w-3 text-green-600 shrink-0" />
                <span className="font-medium">
                  {TARGET_TYPE_LABELS[link.targetType] ?? link.targetType}
                </span>
                <span className="text-muted-foreground">
                  {RELATIONSHIP_LABELS[link.relationship] ?? link.relationship}
                </span>
                {link.suggestedBy === "system" && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1 ml-auto">
                    auto
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {manualSuggestions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Suggested Links
            </p>
            {manualSuggestions.map((suggestion) => {
              const isCreating = createLink.isPending;
              return (
                <div
                  key={suggestion.targetType + suggestion.relationship}
                  className="flex items-center gap-2 text-xs p-1.5 rounded border border-dashed border-amber-200 bg-amber-50/30"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">
                      {TARGET_TYPE_LABELS[suggestion.targetType] ?? suggestion.targetType}
                    </span>
                    <span className="text-muted-foreground ml-1.5">
                      — {suggestion.reason}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("h-6 px-2 text-xs gap-1 shrink-0")}
                    disabled={isCreating}
                    onClick={() => handleCreateLink(suggestion)}
                  >
                    {isCreating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    Link
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {existingLinks.length === 0 && manualSuggestions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No links yet. Links will appear as related records are created.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Inline Badge (for use in list views) ─────────────────────────────────────

export function SmartLinkBadge({
  sourceType,
  sourceId,
}: {
  sourceType: string;
  sourceId: string;
}) {
  const { data } = useSmartLinks({ sourceType, sourceId });
  const count = (data?.links as unknown[])?.length ?? 0;

  if (count === 0) return null;

  return (
    <Badge variant="outline" className="gap-1 text-[10px] h-5">
      <Link2 className="h-2.5 w-2.5" />
      {count}
    </Badge>
  );
}
