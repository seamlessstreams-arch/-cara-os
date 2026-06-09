"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA OVERSIGHT RADAR
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useEffect } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useAriaAssessments,
  useKeyWorkSessions,
  useAriaSafeguardingFlags,
  useAriaRecommendations,
} from "@/hooks/use-intelligence";
import { cn } from "@/lib/utils";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useAuthContext } from "@/contexts/auth-context";
import { useCreateTask } from "@/hooks/use-tasks";
import type { OversightRadarItem, OversightRadarSeverity } from "@/types/extended";
import type { TaskCategory, TaskPriority } from "@/lib/constants";
import {
  ScanSearch, Loader2, AlertTriangle, CheckCircle2,
  User, BookOpen, ClipboardList, Lightbulb, Info,
} from "lucide-react";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";

// ── Constants ─────────────────────────────────────────────────────────────────

const SEVERITY_FILTER_TABS = [
  { value: "all", label: "All" },
  { value: "red", label: "Red" },
  { value: "amber", label: "Amber" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
];

const SEVERITY_COLOURS: Record<OversightRadarSeverity, {
  border: string; bg: string; badge: string; dot: string;
}> = {
  red: {
    border: "border-l-red-400",
    bg: "bg-red-50",
    badge: "bg-red-100 text-red-800",
    dot: "bg-red-500",
  },
  amber: {
    border: "border-l-amber-400",
    bg: "bg-amber-50",
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
  blue: {
    border: "border-l-blue-400",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-800",
    dot: "bg-blue-500",
  },
  green: {
    border: "border-l-emerald-400",
    bg: "bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
  },
};

// ── Radar Item Card ───────────────────────────────────────────────────────────

function RadarItemCard({
  item,
  onMarkReviewed,
  onCreateTask,
}: {
  item: OversightRadarItem;
  onMarkReviewed: (id: string) => void;
  onCreateTask: (item: OversightRadarItem) => void;
}) {
  const colours = SEVERITY_COLOURS[item.severity];
  const [reviewed, setReviewed] = useState(item.is_reviewed);
  const [taskCreated, setTaskCreated] = useState(false);

  function handleReview() {
    setReviewed(true);
    onMarkReviewed(item.id);
  }

  return (
    <div
      className={cn(
        "rounded-xl border-l-4 border border-[var(--cs-border-subtle)] p-4 space-y-2 transition-opacity",
        colours.border,
        colours.bg,
        reviewed && "opacity-50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", colours.badge)}>
              {item.category}
            </span>
            {item.regulation && (
              <span className="rounded-full bg-slate-100 text-[var(--cs-text-muted)] border border-[var(--cs-border)] px-2 py-0.5 text-[10px]">
                {item.regulation}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-[var(--cs-navy)]">{item.issue}</p>
          <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{item.why_it_matters}</p>
          {item.suggested_action && (
            <p className="text-xs text-[var(--cs-text-muted)] italic border-l-2 border-slate-300 pl-2">{item.suggested_action}</p>
          )}
        </div>
        {reviewed && (
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
        )}
      </div>
      {!reviewed && (
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "h-7 px-2.5 text-xs gap-1 bg-white/80",
              taskCreated && "border-emerald-300 text-emerald-700 bg-emerald-50"
            )}
            disabled={taskCreated}
            onClick={() => { onCreateTask(item); setTaskCreated(true); }}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            {taskCreated ? "Task Created" : "Create Task"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs gap-1 bg-white/80"
            onClick={() => {
              window.location.href = "/intelligence/aria/oversight";
            }}
          >
            <BookOpen className="h-3.5 w-3.5" />Generate Oversight
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs gap-1 bg-white/80 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            onClick={handleReview}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />Mark as Reviewed
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OversightRadarPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const createTask = useCreateTask();
  const ypQuery = useYoungPeople("current");
  const youngPeople = [{ id: "all", name: "Whole Home" }, ...(ypQuery.data?.data ?? []).map(yp => ({ id: yp.id, name: yp.preferred_name ?? yp.first_name }))];
  const [selectedChild, setSelectedChild] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radarItems, setRadarItems] = useState<OversightRadarItem[] | null>(null);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [autoRunPending, setAutoRunPending] = useState(false);

  // Pre-select a child and flag auto-run if navigated from a quick-action link
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const c = p.get("child_id");
    if (c) {
      setSelectedChild(c);
      setAutoRunPending(true);
    }
  }, []);

  // Data hooks to build source context
  const childId = selectedChild === "all" ? undefined : selectedChild;
  const { data: assessData } = useAriaAssessments({ childId, homeId });
  const { data: kwData } = useKeyWorkSessions({ childId, homeId });
  const { data: flagData } = useAriaSafeguardingFlags({ childId, homeId });
  const { data: recData } = useAriaRecommendations({ childId, homeId });

  const filteredItems = useMemo(() => {
    if (!radarItems) return [];
    const items = radarItems.map((item) => ({
      ...item,
      is_reviewed: reviewedIds.has(item.id) || item.is_reviewed,
    }));
    if (severityFilter === "all") return items;
    return items.filter((item) => item.severity === severityFilter);
  }, [radarItems, severityFilter, reviewedIds]);

  const counts = useMemo(() => {
    if (!radarItems) return { red: 0, amber: 0, blue: 0, green: 0 };
    return {
      red: radarItems.filter((i) => i.severity === "red").length,
      amber: radarItems.filter((i) => i.severity === "amber").length,
      blue: radarItems.filter((i) => i.severity === "blue").length,
      green: radarItems.filter((i) => i.severity === "green").length,
    };
  }, [radarItems]);

  async function handleScan() {
    setLoading(true);
    setError(null);
    setRadarItems(null);
    setReviewedIds(new Set());

    try {
      const assessments = assessData?.data ?? [];
      const sessions = kwData?.data ?? [];
      const flags = flagData?.data ?? [];
      const recs = recData?.data ?? [];

      const childLabel = youngPeople.find((y) => y.id === selectedChild)?.name ?? "Whole Home";
      const lines: string[] = [
        `## Chamberlain House Oversight Radar Scan`,
        `Scope: ${childLabel}`,
        `Date: ${new Date().toISOString()}`,
        "",
      ];

      if (assessments.length > 0) {
        lines.push(`## ARIA Assessments (${assessments.length})`);
        assessments.slice(0, 10).forEach((a) => {
          lines.push(`- [${a.risk_level}] ${a.situation_summary?.slice(0, 100) ?? "Assessment"} — status: ${a.status}`);
        });
        lines.push("");
      }

      if (sessions.length > 0) {
        lines.push(`## Key Work Sessions (${sessions.length})`);
        sessions.slice(0, 10).forEach((s) => {
          lines.push(`- [${s.status}] ${s.title} — theme: ${s.theme}, child: ${s.child_id}`);
        });
        const noReview = sessions.filter((s) => s.status === "completed" && !s.reviewed_by);
        if (noReview.length > 0) {
          lines.push(`WARNING: ${noReview.length} completed sessions have no review`);
        }
        lines.push("");
      } else {
        lines.push("## Key Work Sessions: None recorded");
        lines.push("");
      }

      if (flags.length > 0) {
        const open = flags.filter((f) => f.status === "open");
        lines.push(`## Safeguarding Flags: ${flags.length} total, ${open.length} open`);
        open.forEach((f) => {
          lines.push(`- [${f.severity}] ${f.flag_type} — ${f.status}`);
        });
        lines.push("");
      }

      if (recs.length > 0) {
        const pending = recs.filter((r) => r.status === "pending");
        lines.push(`## Recommendations: ${pending.length} pending`);
        pending.slice(0, 5).forEach((r) => {
          lines.push(`- [${r.priority}] ${r.title}`);
        });
        lines.push("");
      }

      const context = lines.join("\n");

      const res = await fetch("/api/v1/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "check_missing_evidence",
          stream: false,
          source_content: context,
          prompt: `Scan the provided home data and identify missing evidence, oversight gaps, compliance issues, and areas requiring management attention. Return items as an array with severity ratings (red=urgent/compliance, amber=needs_follow_up, blue=reflective_practice, green=positive_evidence).`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `ARIA returned ${res.status}`);
      }

      const json = await res.json();
      const parsed = json?.data?.parsed;

      if (!Array.isArray(parsed)) {
        throw new Error("ARIA returned unexpected data format");
      }

      const items: OversightRadarItem[] = parsed.map((p: Record<string, unknown>, idx: number) => ({
        id: `radar_${idx}`,
        category: String(p.category ?? "General"),
        issue: String(p.issue ?? ""),
        why_it_matters: String(p.why_it_matters ?? ""),
        suggested_action: String(p.suggested_action ?? ""),
        regulation: p.regulation ? String(p.regulation) : undefined,
        severity: (p.severity ?? "amber") as OversightRadarSeverity,
        is_reviewed: false,
      }));

      setRadarItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }

  function handleMarkReviewed(id: string) {
    setReviewedIds((prev) => new Set([...prev, id]));
  }

  function handleCreateTask(item: OversightRadarItem) {
    const severityToPriority: Record<OversightRadarSeverity, TaskPriority> = {
      red: "urgent",
      amber: "high",
      blue: "medium",
      green: "low",
    };
    const categoryMap: Record<string, TaskCategory> = {
      safeguarding: "safeguarding",
      compliance: "compliance",
      staffing: "staffing",
      training: "training",
      health: "health_and_safety",
      maintenance: "maintenance",
      medication: "medication",
      finance: "finance",
      inspection: "inspection",
    };
    const cat = Object.keys(categoryMap).find((k) =>
      item.category.toLowerCase().includes(k)
    );
    createTask.mutate({
      title: item.issue,
      description: item.why_it_matters +
        (item.suggested_action ? `\n\nSuggested action: ${item.suggested_action}` : ""),
      priority: severityToPriority[item.severity],
      category: cat ? categoryMap[cat] : "compliance",
      status: "not_started",
      home_id: homeId,
      assigned_to: currentUser?.id ?? null,
      due_date: null,
    });
  }

  // Auto-run the scan once hook data has loaded after a quick-action navigation
  useEffect(() => {
    if (!autoRunPending) return;
    if (assessData === undefined && kwData === undefined && flagData === undefined && recData === undefined) return;
    setAutoRunPending(false);
    void handleScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRunPending, assessData, kwData, flagData, recData]);

  return (
    <PageShell
      title="Oversight Radar"
      subtitle="Scan for missing evidence and oversight gaps"
      showQuickCreate={false}
      actions={<SmartUploadButton variant="inline" label="Upload Evidence Document" uploadContext="ARIA Intelligence — oversight radar gap evidence document upload" />}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-end gap-4 flex-wrap">
              <div className="space-y-1.5 flex-1 min-w-48">
                <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Scope</label>
                <select
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  {youngPeople.map((yp) => (
                    <option key={yp.id} value={yp.id}>{yp.name}</option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleScan}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Scanning…</>
                ) : (
                  <><ScanSearch className="h-4 w-4" />{radarItems !== null ? "Re-scan" : "Run Oversight Radar"}</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Colour legend */}
        <div className="flex items-center gap-4 flex-wrap text-xs text-[var(--cs-text-secondary)]">
          <span className="font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider text-[10px]">Colour guide:</span>
          {[
            { colour: "bg-red-500", label: "Red — Urgent / Compliance" },
            { colour: "bg-amber-500", label: "Amber — Needs Follow-up" },
            { colour: "bg-blue-500", label: "Blue — Reflective Practice" },
            { colour: "bg-emerald-500", label: "Green — Positive Evidence" },
          ].map(({ colour, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={cn("h-2.5 w-2.5 rounded-full", colour)} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {/* Empty / loading state */}
        {!radarItems && !loading && !error && (
          <Card className="border-blue-100 bg-blue-50/30">
            <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
              <ScanSearch className="h-12 w-12 text-blue-300" />
              <div>
                <p className="text-sm font-semibold text-[var(--cs-text-secondary)]">Ready to scan</p>
                <p className="text-xs text-[var(--cs-text-muted)] mt-1 max-w-sm">
                  Select a scope above and click &quot;Run Oversight Radar&quot; to identify missing evidence,
                  compliance gaps, and areas requiring management attention.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="flex items-center gap-3 py-8 justify-center text-sm text-[var(--cs-text-muted)]">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            ARIA is scanning for oversight gaps and missing evidence…
          </div>
        )}

        {/* Results */}
        {radarItems && !loading && (
          <div className="space-y-4">
            {/* Summary + filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm font-semibold text-[var(--cs-text-secondary)]">
                  {radarItems.length} item{radarItems.length !== 1 ? "s" : ""} identified
                </span>
                {counts.red > 0 && (
                  <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold">{counts.red} urgent</span>
                )}
                {counts.amber > 0 && (
                  <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-bold">{counts.amber} amber</span>
                )}
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {SEVERITY_FILTER_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setSeverityFilter(tab.value)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      severityFilter === tab.value
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-300" />
                <p className="text-sm text-[var(--cs-text-muted)]">No items match this filter</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <RadarItemCard
                    key={item.id}
                    item={item}
                    onMarkReviewed={handleMarkReviewed}
                    onCreateTask={handleCreateTask}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
