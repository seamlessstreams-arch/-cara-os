"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useAriaRecommendations,
  useUpdateAriaRecommendation,
} from "@/hooks/use-intelligence";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useAuthContext } from "@/contexts/auth-context";
import { cn, formatDate } from "@/lib/utils";
import type { AriaRecommendation } from "@/types/extended";
import {
  Lightbulb, CheckCircle2, X, AlertTriangle, Loader2, ClipboardList,
} from "lucide-react";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "task_created", label: "Task Created" },
  { value: "actioned", label: "Actioned" },
  { value: "dismissed", label: "Dismissed" },
];

const PRIORITY_COLOURS: Record<string, string> = {
  urgent: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-slate-100 text-slate-700 border-slate-200",
};

function formatType(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Recommendation card ───────────────────────────────────────────────────────

function RecommendationCard({
  rec,
  ypNameMap,
}: {
  rec: AriaRecommendation;
  ypNameMap: Record<string, string>;
}) {
  const [confirmDismiss, setConfirmDismiss] = useState(false);
  const [updating, setUpdating] = useState(false);
  const updateRec = useUpdateAriaRecommendation();

  const childName = rec.child_id ? (ypNameMap[rec.child_id] ?? rec.child_id) : null;

  const isOverdue = rec.deadline && new Date(rec.deadline) < new Date() && rec.status === "pending";

  async function handleUpdate(data: Partial<AriaRecommendation>) {
    setUpdating(true);
    try {
      await updateRec.mutateAsync({ id: rec.id, ...data });
    } finally {
      setUpdating(false);
      setConfirmDismiss(false);
    }
  }

  const statusColours: Record<string, string> = {
    pending: "bg-slate-100 text-slate-700",
    task_created: "bg-blue-100 text-blue-800",
    actioned: "bg-emerald-100 text-emerald-800",
    dismissed: "bg-slate-50 text-slate-400",
  };

  return (
    <div className={cn(
      "rounded-xl border border-slate-100 bg-white p-4 space-y-3 transition-opacity",
      rec.status === "dismissed" && "opacity-50",
      rec.status === "actioned" && "opacity-70"
    )}>
      <div className="space-y-2">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase", PRIORITY_COLOURS[rec.priority])}>
            {rec.priority}
          </span>
          <span className="rounded-full bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 text-[10px] font-medium">
            {formatType(rec.recommendation_type)}
          </span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusColours[rec.status])}>
            {formatType(rec.status)}
          </span>
        </div>

        {/* Title */}
        <p className="text-sm font-bold text-slate-900">{rec.title}</p>

        {/* Reason */}
        <p className="text-xs text-slate-600 leading-relaxed">{rec.reason}</p>

        {/* Metadata */}
        <div className="flex items-center gap-3 flex-wrap text-[10px] text-slate-400">
          {childName && <span>{childName}</span>}
          {rec.assigned_role && <span>→ {rec.assigned_role}</span>}
          {rec.deadline && (
            <span className={cn("font-medium", isOverdue ? "text-red-600" : "text-slate-500")}>
              {isOverdue ? "OVERDUE — " : "Due "}
              {formatDate(rec.deadline)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {rec.status === "pending" && (
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => handleUpdate({ status: "task_created", task_created: true })}
            disabled={updating}
          >
            {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <ClipboardList className="h-3 w-3" />}
            Create Task
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            onClick={() => handleUpdate({ status: "actioned" })}
            disabled={updating}
          >
            {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            Mark Actioned
          </Button>
          {!confirmDismiss ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-xs gap-1 text-slate-400"
              onClick={() => setConfirmDismiss(true)}
            >
              <X className="h-3 w-3" />Dismiss
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Confirm dismiss?</span>
              <Button
                size="sm"
                className="h-7 px-2.5 text-xs bg-slate-700 hover:bg-slate-900 text-white"
                onClick={() => handleUpdate({ status: "dismissed" })}
                disabled={updating}
              >
                {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConfirmDismiss(false)}>
                No
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RecommendationsPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [statusFilter, setStatusFilter] = useState("all");
  const [childFilter, setChildFilter] = useState("all");

  const { data, isLoading } = useAriaRecommendations({ homeId });
  const { data: ypData, isLoading: ypLoading } = useYoungPeople("current");

  const youngPeople = useMemo(() => ypData?.data ?? [], [ypData]);

  // Live YP list for the filter dropdown — "all" sentinel + current placements
  const ypFilterOptions = useMemo(() => [
    { id: "all", name: "All Children" },
    ...youngPeople.map((yp) => ({
      id: yp.id,
      name: yp.preferred_name ?? yp.first_name,
    })),
  ], [youngPeople]);

  // Map id → display name for card use
  const ypNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    youngPeople.forEach((yp) => {
      map[yp.id] = yp.preferred_name ?? yp.first_name;
    });
    return map;
  }, [youngPeople]);
  const recs: AriaRecommendation[] = useMemo(() => data?.data ?? [], [data]);

  const pending = useMemo(() => recs.filter((r) => r.status === "pending"), [recs]);
  const urgent = useMemo(() => pending.filter((r) => r.priority === "urgent"), [pending]);
  const actioned = useMemo(() => recs.filter((r) => r.status === "actioned"), [recs]);

  const filtered = useMemo(() => {
    let list = recs;
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (childFilter !== "all") list = list.filter((r) => r.child_id === childFilter);
    return list;
  }, [recs, statusFilter, childFilter]);

  return (
    <PageShell
      title="Recommendations"
      subtitle="Suggested next actions from ARIA"
      showQuickCreate={false}
      actions={<SmartUploadButton variant="inline" label="Upload Supporting Document" uploadContext="ARIA Intelligence — recommendations supporting document upload" />}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Summary stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Pending", value: pending.length, colour: "text-amber-600" },
            { label: "Urgent", value: urgent.length, colour: "text-red-600" },
            { label: "Actioned", value: actioned.length, colour: "text-emerald-600" },
          ].map(({ label, value, colour }) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-white p-3">
              <div className={cn("text-2xl font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  statusFilter === tab.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <select
            value={childFilter}
            onChange={(e) => setChildFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
            disabled={ypLoading}
          >
            {ypFilterOptions.map((yp) => (
              <option key={yp.id} value={yp.id}>{yp.name}</option>
            ))}
          </select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <Lightbulb className="h-12 w-12 text-slate-200" />
            <p className="text-sm font-semibold text-slate-700">No pending recommendations</p>
            <p className="text-xs text-slate-400">ARIA is up to date — all recommendations have been actioned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} ypNameMap={ypNameMap} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
