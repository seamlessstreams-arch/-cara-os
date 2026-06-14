"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara AUDIT TRAIL
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCaraAuditTrail } from "@/hooks/use-intelligence";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useAuthContext } from "@/contexts/auth-context";
import { getYPName } from "@/lib/seed-data";
import { cn, formatDate } from "@/lib/utils";
import type { CaraAuditEntry, AuditActionType } from "@/types/extended";
import {
  Layers, Brain, CheckCircle2, Shield, FileText, Users,
  ClipboardList, BookOpen, ChevronDown, ChevronUp, Lightbulb,
} from "lucide-react";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTION_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Actions" },
  { value: "cara_assessment_created", label: "Assessment Created" },
  { value: "cara_assessment_reviewed", label: "Assessment Reviewed" },
  { value: "cara_assessment_approved", label: "Assessment Approved" },
  { value: "cara_oversight_generated", label: "Oversight Generated" },
  { value: "cara_oversight_approved", label: "Oversight Approved" },
  { value: "keywork_session_created", label: "Key Work Created" },
  { value: "keywork_session_completed", label: "Key Work Completed" },
  { value: "keywork_session_reviewed", label: "Key Work Reviewed" },
  { value: "child_resource_created", label: "Resource Created" },
  { value: "child_resource_approved", label: "Resource Approved" },
  { value: "interactive_session_completed", label: "Interactive Session" },
  { value: "safeguarding_flag_raised", label: "Safeguarding Flag Raised" },
  { value: "safeguarding_flag_reviewed", label: "Safeguarding Flag Reviewed" },
  { value: "recommendation_created", label: "Recommendation Created" },
  { value: "recommendation_actioned", label: "Recommendation Actioned" },
  { value: "ai_prompt_sent", label: "AI Prompt Sent" },
  { value: "ai_response_received", label: "AI Response Received" },
  { value: "human_edit_made", label: "Human Edit Made" },
  { value: "record_approved", label: "Record Approved" },
];

const DATE_FILTERS = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

// ── Icon map ──────────────────────────────────────────────────────────────────

function ActionIcon({ actionType }: { actionType: AuditActionType }) {
  const iconClass = "h-4 w-4";
  if (actionType.startsWith("cara_assessment")) return <Brain className={cn(iconClass, "text-[var(--cs-cara-gold)]")} />;
  if (actionType.startsWith("cara_oversight")) return <ClipboardList className={cn(iconClass, "text-emerald-500")} />;
  if (actionType.startsWith("keywork")) return <BookOpen className={cn(iconClass, "text-amber-500")} />;
  if (actionType.startsWith("child_resource")) return <FileText className={cn(iconClass, "text-pink-500")} />;
  if (actionType.startsWith("interactive_session")) return <Users className={cn(iconClass, "text-teal-500")} />;
  if (actionType.startsWith("safeguarding_flag")) return <Shield className={cn(iconClass, "text-red-500")} />;
  if (actionType.startsWith("recommendation")) return <Lightbulb className={cn(iconClass, "text-orange-500")} />;
  if (actionType === "record_approved" || actionType.includes("approved") || actionType.includes("reviewed")) {
    return <CheckCircle2 className={cn(iconClass, "text-emerald-500")} />;
  }
  return <Brain className={cn(iconClass, "text-[var(--cs-text-muted)]")} />;
}

function formatActionType(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Timeline item ─────────────────────────────────────────────────────────────

function AuditTimelineItem({ entry }: { entry: CaraAuditEntry }) {
  const [expanded, setExpanded] = useState(false);
  const childName = entry.child_id
    ? getYPName(entry.child_id) || entry.child_id
    : null;

  const hasDetail = entry.ai_prompt || entry.ai_response || entry.human_edit;

  const formatTime = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex gap-3">
      {/* Icon + line */}
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--cs-border)] bg-white shadow-sm shrink-0">
          <ActionIcon actionType={entry.action_type} />
        </div>
        <div className="w-px flex-1 bg-slate-100 mt-1" />
      </div>

      {/* Content */}
      <div className="pb-5 flex-1 min-w-0">
        <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-white p-3 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5 flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--cs-navy)]">
                {formatActionType(entry.action_type)}
              </p>
              <div className="flex items-center gap-2 flex-wrap text-[10px] text-[var(--cs-text-muted)]">
                <span>{entry.user_id.replace("staff_", "").replace(/_/g, " ")}</span>
                {childName && (
                  <>
                    <span className="text-[var(--cs-text-gentle)]">·</span>
                    <span className="text-[var(--cs-cara-gold)] font-medium">{childName}</span>
                  </>
                )}
                {entry.source_table && (
                  <>
                    <span className="text-[var(--cs-text-gentle)]">·</span>
                    <span>{formatActionType(entry.source_table)}</span>
                  </>
                )}
                {entry.approval_status && (
                  <>
                    <span className="text-[var(--cs-text-gentle)]">·</span>
                    <span className="capitalize font-medium">{entry.approval_status}</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] text-[var(--cs-text-muted)]">{formatDate(entry.created_at)}</div>
              <div className="text-[10px] text-[var(--cs-text-muted)]">{formatTime(entry.created_at)}</div>
            </div>
          </div>

          {/* Expandable detail */}
          {hasDetail && (
            <>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-[10px] text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] transition-colors"
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {expanded ? "Hide details" : "Show details"}
              </button>

              {expanded && (
                <div className="space-y-2 border-t border-[var(--cs-border-subtle)] pt-2">
                  {entry.ai_prompt && (
                    <div>
                      <p className="text-[9px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-0.5">AI Prompt</p>
                      <p className="text-[11px] text-[var(--cs-text-secondary)] leading-relaxed line-clamp-3 font-mono bg-slate-50 rounded-lg px-2 py-1.5">
                        {entry.ai_prompt.slice(0, 200)}{entry.ai_prompt.length > 200 ? "…" : ""}
                      </p>
                    </div>
                  )}
                  {entry.ai_response && (
                    <div>
                      <p className="text-[9px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-0.5">AI Response</p>
                      <p className="text-[11px] text-[var(--cs-text-secondary)] leading-relaxed line-clamp-3 bg-[var(--cs-cara-gold-bg)] rounded-lg px-2 py-1.5">
                        {entry.ai_response.slice(0, 200)}{entry.ai_response.length > 200 ? "…" : ""}
                      </p>
                    </div>
                  )}
                  {entry.human_edit && (
                    <div>
                      <p className="text-[9px] font-semibold text-blue-500 uppercase tracking-wider mb-0.5">Human Edit</p>
                      <p className="text-[11px] text-[var(--cs-text-secondary)] leading-relaxed bg-blue-50 rounded-lg px-2 py-1.5">
                        {entry.human_edit.slice(0, 200)}{entry.human_edit.length > 200 ? "…" : ""}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuditTrailPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const ypQuery = useYoungPeople("current");
  const youngPeople = [{ id: "all", name: "All Children" }, ...(ypQuery.data?.data ?? []).map(yp => ({ id: yp.id, name: yp.preferred_name ?? yp.first_name }))];
  const [childFilter, setChildFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("week");

  const childParam = childFilter === "all" ? undefined : childFilter;
  const { data, isLoading } = useCaraAuditTrail({ childId: childParam, homeId });
  const entries: CaraAuditEntry[] = useMemo(() => data?.data ?? [], [data]);

  const filtered = useMemo(() => {
    let list = entries;

    if (actionFilter !== "all") {
      list = list.filter((e) => e.action_type === actionFilter);
    }

    if (dateFilter !== "all") {
      const cutoff = new Date();
      if (dateFilter === "week") cutoff.setDate(cutoff.getDate() - 7);
      if (dateFilter === "month") cutoff.setMonth(cutoff.getMonth() - 1);
      list = list.filter((e) => new Date(e.created_at) >= cutoff);
    }

    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [entries, actionFilter, dateFilter]);

  return (
    <PageShell
      title="Audit Trail"
      subtitle="Full evidence trail of all AI-assisted actions"
      showQuickCreate={false}
      actions={<SmartUploadButton variant="inline" label="Upload Evidence Document" uploadContext="Cara Intelligence — audit trail supporting evidence document upload" />}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Notice */}
        <div className="flex items-start gap-3 rounded-2xl border border-[var(--cs-border)] bg-slate-50 p-4">
          <Layers className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
            This audit trail is a full record of all AI-assisted actions taken in Cara Intelligence.
            It cannot be edited or deleted and forms part of the evidence base for the child&apos;s record.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Child</label>
                <select
                  value={childFilter}
                  onChange={(e) => setChildFilter(e.target.value)}
                  className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {youngPeople.map((yp) => (
                    <option key={yp.id} value={yp.id}>{yp.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Action Type</label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {ACTION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Date Range</label>
                <div className="flex gap-1.5">
                  {DATE_FILTERS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setDateFilter(f.value)}
                      className={cn(
                        "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                        dateFilter === f.value ? "border-slate-700 bg-slate-900 text-white" : "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Count */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--cs-text-secondary)]">
            {filtered.length} audit {filtered.length === 1 ? "entry" : "entries"}
          </span>
          {!isLoading && (
            <span className="text-xs text-[var(--cs-text-muted)]">· {entries.length} total across all time</span>
          )}
        </div>

        {/* Timeline */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <Layers className="h-12 w-12 text-slate-200" />
            <p className="text-sm font-semibold text-[var(--cs-text-secondary)]">No audit entries found</p>
            <p className="text-xs text-[var(--cs-text-muted)]">Adjust the filters or try a different date range</p>
          </div>
        ) : (
          <div className="relative">
            {filtered.map((entry) => (
              <AuditTimelineItem key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
