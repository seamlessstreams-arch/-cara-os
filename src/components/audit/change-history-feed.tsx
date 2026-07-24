"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CHANGE HISTORY FEED
//
// Field-level before→after history of edits to records (incidents, supervision,
// care forms, …), read from the audit recorder via GET /api/v1/audit-trail.
// Complements RecordActivityFeed (which shows record CREATIONS) by showing what
// CHANGED — from what, to what, by whom — the tamper-evidence Ofsted looks for.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { AuditTrailEntry } from "@/lib/audit/audit-recorder";
import { History, Loader2 } from "lucide-react";

// ── Query Config ────────────────────────────────────────────────────────────
const AUDIT_TRAIL_API = "/api/v1/audit-trail";

interface AuditTrailData {
  entries: AuditTrailEntry[];
  count: number;
  durable_persistence: boolean;
}

const ACTION_LABEL: Record<string, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  sign_off: "Signed off",
  approve: "Approved",
  reject: "Rejected",
  escalate: "Escalated",
  view: "Viewed",
  export: "Exported",
};

function fmtValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 60 ? `${s.slice(0, 60)}…` : s;
}

export function ChangeHistoryFeed({
  limit = 50,
  entityType,
  entityId,
  className,
}: {
  limit?: number;
  entityType?: string;
  entityId?: string;
  className?: string;
}) {
  const params = new URLSearchParams();
  if (entityType) params.set("entityType", entityType);
  if (entityId) params.set("entityId", entityId);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();

  const { data, isLoading } = useQuery<AuditTrailData>({
    queryKey: ["audit-trail", { entityType, entityId, limit }],
    queryFn: async () => {
      const res = await fetch(`${AUDIT_TRAIL_API}${qs ? `?${qs}` : ""}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
      return json.data as AuditTrailData;
    },
  });
  const entries = data?.entries ?? [];

  return (
    <div className={cn("rounded-2xl border border-[var(--cs-border)] bg-white", className)}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--cs-border)]">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[var(--cs-cara-gold-bg)] flex items-center justify-center">
            <History className="h-4 w-4 text-[var(--cs-cara-gold)]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--cs-navy)]">Change History</p>
            <p className="text-[11px] text-[var(--cs-text-muted)]">
              Field-level before→after on every edit
            </p>
          </div>
        </div>
        <span
          className={cn(
            "text-[10px] font-semibold rounded-full px-2 py-0.5",
            data?.durable_persistence
              ? "bg-[var(--cs-teal)]/10 text-[var(--cs-teal)]"
              : "bg-[var(--cs-bg)] text-[var(--cs-text-muted)]",
          )}
        >
          {data?.durable_persistence ? "persisted" : "in-memory"}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-[var(--cs-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading change history…
        </div>
      ) : entries.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <History className="h-8 w-8 text-[var(--cs-text-gentle)] mx-auto mb-2" />
          <p className="text-sm text-[var(--cs-text-muted)]">No record changes captured yet.</p>
          <p className="text-[11px] text-[var(--cs-text-gentle)] mt-1">
            Unlike most views this isn&apos;t seeded — edit an incident, supervision record or care
            form and its before→after will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--cs-border-subtle)] max-h-[480px] overflow-y-auto">
          {entries.map((e) => (
            <li key={e.id} className="px-5 py-3 hover:bg-[var(--cs-bg)] transition-colors">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-[var(--cs-text)]">
                  <span className="font-semibold text-[var(--cs-navy)]">{ACTION_LABEL[e.action] ?? e.action}</span>{" "}
                  <span className="capitalize text-[var(--cs-text-secondary)]">{e.entityType.replace(/_/g, " ")}</span>{" "}
                  <span className="font-mono text-[10px] text-[var(--cs-text-gentle)]">{e.entityId}</span>
                </p>
                <span className="text-[10px] text-[var(--cs-text-muted)] shrink-0">
                  {new Date(e.at).toLocaleString("en-GB")} · {e.performedBy}
                </span>
              </div>
              {e.changeCount > 0 && (
                <ul className="mt-1.5 space-y-0.5">
                  {Object.entries(e.changes).map(([field, c]) => (
                    <li key={field} className="flex flex-wrap items-baseline gap-x-1.5 text-[11px]">
                      <span className="font-medium text-[var(--cs-text-secondary)]">{field.replace(/_/g, " ")}</span>
                      <span className="text-[var(--cs-text-muted)] line-through">{fmtValue(c.old)}</span>
                      <span className="text-[var(--cs-text-gentle)]">→</span>
                      <span className="font-medium text-[var(--cs-navy)]">{fmtValue(c.new)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
