"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — AUDIT TRAIL
// Tamper-evident log of all Care Event actions — complete chronological record
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Clock,
  User,
  Zap,
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Lock,
  List,
} from "lucide-react";
import { useCareEventAuditLog, type AuditLogEntryEnriched } from "@/hooks/use-daily-summaries";
import type { AuditAction } from "@/types/care-events";
import { formatDate } from "@/lib/utils";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Action metadata ───────────────────────────────────────────────────────────

const ACTION_META: Record<
  AuditAction,
  { label: string; colour: string; icon: React.ReactNode }
> = {
  care_event_created:          { label: "Created",          colour: "bg-blue-100 text-blue-800",   icon: <Zap className="h-3 w-3" /> },
  care_event_submitted:        { label: "Submitted",        colour: "bg-indigo-100 text-indigo-800", icon: <FileText className="h-3 w-3" /> },
  care_event_routed:           { label: "Routed",           colour: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-3 w-3" /> },
  care_event_route_failed:     { label: "Route Failed",     colour: "bg-red-100 text-red-800",     icon: <XCircle className="h-3 w-3" /> },
  care_event_route_retried:    { label: "Route Retried",    colour: "bg-amber-100 text-amber-800", icon: <RotateCcw className="h-3 w-3" /> },
  care_event_verified:         { label: "Verified",         colour: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-3 w-3" /> },
  care_event_returned:         { label: "Returned",         colour: "bg-orange-100 text-orange-800", icon: <RotateCcw className="h-3 w-3" /> },
  care_event_amended:          { label: "Amended",          colour: "bg-amber-100 text-amber-800", icon: <FileText className="h-3 w-3" /> },
  care_event_locked:           { label: "Locked",           colour: "bg-slate-100 text-slate-700", icon: <Lock className="h-3 w-3" /> },
  evidence_prompt_completed:   { label: "Evidence Prompt",  colour: "bg-teal-100 text-teal-800",   icon: <CheckCircle2 className="h-3 w-3" /> },
  manager_review_completed:    { label: "Manager Review",   colour: "bg-indigo-100 text-indigo-800", icon: <User className="h-3 w-3" /> },
  reg45_evidence_suggested:    { label: "Reg 45 Suggested", colour: "bg-purple-100 text-purple-800", icon: <ShieldCheck className="h-3 w-3" /> },
  reg45_evidence_accepted:     { label: "Reg 45 Accepted",  colour: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-3 w-3" /> },
  reg45_evidence_rejected:     { label: "Reg 45 Rejected",  colour: "bg-red-100 text-red-800",     icon: <XCircle className="h-3 w-3" /> },
  annex_a_evidence_suggested:  { label: "Annex A Suggested",colour: "bg-cyan-100 text-cyan-800",   icon: <ShieldCheck className="h-3 w-3" /> },
  annex_a_snapshot_generated:  { label: "Annex A Snapshot", colour: "bg-cyan-100 text-cyan-800",   icon: <FileText className="h-3 w-3" /> },
  export_generated:            { label: "Export",           colour: "bg-slate-100 text-slate-700", icon: <FileText className="h-3 w-3" /> },
  permission_denied:           { label: "Permission Denied",colour: "bg-red-100 text-red-800",     icon: <AlertTriangle className="h-3 w-3" /> },
  validation_failed:           { label: "Validation Failed",colour: "bg-red-100 text-red-800",     icon: <AlertTriangle className="h-3 w-3" /> },
};

const ACTION_FILTER_GROUPS = [
  { label: "All", value: "all" },
  { label: "Created", value: "care_event_created" },
  { label: "Submitted", value: "care_event_submitted" },
  { label: "Routed", value: "care_event_routed" },
  { label: "Verified", value: "care_event_verified" },
  { label: "Returned", value: "care_event_returned" },
  { label: "Amended", value: "care_event_amended" },
  { label: "Locked", value: "care_event_locked" },
  { label: "Route Failed", value: "care_event_route_failed" },
  { label: "Reg 45", value: "reg45_evidence_suggested" },
  { label: "Errors", value: "permission_denied" },
];

// ── Audit entry row ───────────────────────────────────────────────────────────

function AuditEntryRow({ entry }: { entry: AuditLogEntryEnriched }) {
  const meta = ACTION_META[entry.action] ?? {
    label: entry.action,
    colour: "bg-gray-100 text-gray-700",
    icon: <List className="h-3 w-3" />,
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="mt-0.5 shrink-0">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.colour}`}>
          {meta.icon}
          {meta.label}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        {entry.care_event && (
          <Link
            href={`/care-events/${entry.care_event.id}`}
            className="text-sm text-slate-700 font-medium hover:text-indigo-600 hover:underline truncate block"
          >
            {entry.care_event.title}
          </Link>
        )}
        {Object.keys(entry.detail).length > 0 && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {Object.entries(entry.detail)
              .slice(0, 3)
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join(" · ")}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right text-xs text-slate-400 space-y-0.5">
        <p className="flex items-center gap-1 justify-end">
          <Clock className="h-3 w-3" />
          {formatDate(entry.created_at)}
        </p>
        {(entry.actor_staff_name ?? entry.actor_staff_id) && (
          <p className="flex items-center gap-1 justify-end">
            <User className="h-3 w-3" />
            {entry.actor_staff_name ?? entry.actor_staff_id}
          </p>
        )}
        {entry.care_event && (
          <Badge variant="outline" className="text-xs py-0">
            {entry.care_event.status}
          </Badge>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuditTrailPage() {
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");

  const { data, isLoading } = useCareEventAuditLog({
    action: actionFilter !== "all" ? actionFilter : undefined,
    limit: 200,
  });

  const entries = data?.entries ?? [];
  const meta = data?.meta;

  return (
    <PageShell
      title="Audit Trail"
      subtitle="Tamper-evident log of all Care Event actions — complete chronological record"
    >
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-slate-500" />
              <div>
                <div className="text-2xl font-bold text-slate-900">{meta?.total ?? 0}</div>
                <div className="text-xs text-slate-500">Total Entries</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-700">{meta?.unique_events ?? 0}</div>
                <div className="text-xs text-slate-500">Care Events</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-500" />
              <div>
                <div className="text-2xl font-bold text-indigo-700">{meta?.unique_actors ?? 0}</div>
                <div className="text-xs text-slate-500">Actors</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-700">
                  {(meta?.action_counts["permission_denied"] ?? 0) +
                    (meta?.action_counts["validation_failed"] ?? 0) +
                    (meta?.action_counts["care_event_route_failed"] ?? 0)}
                </div>
                <div className="text-xs text-slate-500">Errors/Failures</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action filter */}
      <div className="flex gap-1 flex-wrap mb-4 border-b border-slate-200 pb-2">
        {ACTION_FILTER_GROUPS.map((f) => (
          <button
            key={f.value}
            onClick={() => setActionFilter(f.value as AuditAction | "all")}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              actionFilter === f.value
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {f.label}
            {f.value !== "all" && meta?.action_counts[f.value] ? (
              <span className="ml-1 opacity-70">({meta.action_counts[f.value]})</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Entries */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Clock className="h-5 w-5 animate-pulse mr-2" /> Loading audit trail...
        </div>
      ) : entries.length === 0 ? (
        <Card className="border-dashed border-slate-200">
          <CardContent className="py-12 text-center text-slate-400">
            <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No audit entries yet.</p>
            <p className="text-xs mt-1">Every Care Event action is recorded here automatically.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200">
          <CardContent className="pt-4 pb-2">
            {entries.map((entry) => (
              <AuditEntryRow key={entry.id} entry={entry} />
            ))}
          </CardContent>
        </Card>
      )}
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
