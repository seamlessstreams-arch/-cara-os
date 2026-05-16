"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — Library Component
//
// Displays all generated content with:
//   - Filtering by type, status, child
//   - Status badges (draft, approved, committed, rejected)
//   - Quick actions (view, approve, commit)
//   - Pagination
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FileText, Search, Filter, ChevronLeft, ChevronRight,
  Loader2, Eye, CheckCircle2, Archive, Clock,
} from "lucide-react";
import { GENERATION_TYPES, STATUSES } from "@/lib/aria-studio/types";
import type { GenerationType, GenerationStatus } from "@/lib/aria-studio/types";

// ── Type labels ─────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<GenerationType, string> = {
  KEYWORK_SESSION: "Key Work Session",
  DIRECT_WORK_SESSION: "Direct Work Session",
  LIFE_STORY_SESSION: "Life Story Work",
  MISSING_RETURN_HOME_SUPPORT: "Missing Return Home",
  STAFF_BRIEFING: "Staff Briefing",
  FLASHCARDS: "Flashcards",
  YOUNG_PERSON_EXPLAINER: "Young Person Explainer",
  BEHAVIOUR_SUPPORT_IDEAS: "Behaviour Support",
  PLACEMENT_PLAN_DRAFT: "Placement Plan Draft",
  RISK_ASSESSMENT_DRAFT: "Risk Assessment Draft",
  CARE_PLAN_DRAFT: "Care Plan Draft",
  STAFF_MICRO_TRAINING: "Staff Micro-Training",
  TEAM_MEETING_PACK: "Team Meeting Pack",
  REG44_EVIDENCE_PREP: "Reg 44 Evidence",
  REG45_EVIDENCE_PREP: "Reg 45 Evidence",
  EDUCATION_SUPPORT_SESSION: "Education Support",
  INDEPENDENCE_SESSION: "Independence Session",
  FAMILY_TIME_PREPARATION: "Family Time Prep",
  EMOTIONAL_REGULATION_SESSION: "Emotional Regulation",
  RELATIONSHIP_REPAIR_SESSION: "Relationship Repair",
  MANAGER_OVERSIGHT_PROMPTS: "Manager Oversight",
};

// ── Status styles ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<GenerationStatus, { bg: string; text: string; border: string; label: string }> = {
  DRAFT: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", label: "Draft" },
  PENDING_APPROVAL: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Pending Approval" },
  APPROVED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Approved" },
  REJECTED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Rejected" },
  COMMITTED: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Committed" },
  ARCHIVED: { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200", label: "Archived" },
};

// ── Props ───────────────────────────────────────────────────────────────────

interface StudioLibraryProps {
  childId?: string;
  onSelectGeneration?: (generationId: string) => void;
}

interface LibraryItem {
  id: string;
  generation_type: GenerationType;
  title: string;
  brief: string;
  tone: string;
  audience: string;
  status: GenerationStatus;
  child_id: string | null;
  model: string;
  created_by: string;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export function StudioLibrary({ childId, onSelectGeneration }: StudioLibraryProps) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Filters
  const [filterType, setFilterType] = useState<GenerationType | "">("");
  const [filterStatus, setFilterStatus] = useState<GenerationStatus | "">("");

  // ── Fetch library ─────────────────────────────────────────────────────────
  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (childId) params.set("childId", childId);
      if (filterType) params.set("generationType", filterType);
      if (filterStatus) params.set("status", filterStatus);
      params.set("limit", String(limit));
      params.set("offset", String(offset));

      const res = await fetch(`/api/aria-studio/library?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setItems(data.data ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (err) {
      console.error("Library fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [childId, filterType, filterStatus, offset]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-[var(--cs-text-muted)]">
          <Filter className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Filters:</span>
        </div>

        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value as GenerationType | ""); setOffset(0); }}
          className="rounded-md border border-[var(--cs-border)] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--cs-aria-gold)]"
        >
          <option value="">All Types</option>
          {GENERATION_TYPES.map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as GenerationStatus | ""); setOffset(0); }}
          className="rounded-md border border-[var(--cs-border)] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--cs-aria-gold)]"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_STYLES[s].label}</option>
          ))}
        </select>

        <span className="text-[10px] text-[var(--cs-text-muted)] ml-auto">
          {total} generation{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Archive className="h-10 w-10 text-[var(--cs-text-muted)] mb-3" />
          <p className="text-sm text-[var(--cs-text-secondary)]">No generations found</p>
          <p className="text-xs text-[var(--cs-text-muted)] mt-1">Generate your first piece of content to see it here.</p>
        </div>
      )}

      {/* Items */}
      {!loading && items.length > 0 && (
        <div className="divide-y divide-[var(--cs-border)] rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
          {items.map((item) => {
            const statusStyle = STATUS_STYLES[item.status] ?? STATUS_STYLES.DRAFT;
            return (
              <div
                key={item.id}
                onClick={() => onSelectGeneration?.(item.id)}
                className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--cs-surface)] transition-colors cursor-pointer"
              >
                <FileText className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--cs-navy)] truncate">{item.title}</p>
                    <Badge className={cn("text-[9px] shrink-0", statusStyle.bg, statusStyle.text, statusStyle.border)}>
                      {statusStyle.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-[var(--cs-text-muted)]">
                      {TYPE_LABELS[item.generation_type] ?? item.generation_type}
                    </span>
                    <span className="text-[10px] text-[var(--cs-text-muted)]">
                      <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <Eye className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Previous
          </Button>
          <span className="text-xs text-[var(--cs-text-muted)]">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
