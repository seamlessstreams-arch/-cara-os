"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — LEARNING STUDIO: KNOWLEDGE GAPS
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useKnowledgeGaps, useCreateKnowledgeGap,
} from "@/hooks/use-ri-learning";
import type { KnowledgeGap, KnowledgeGapSeverity, KnowledgeGapStatus } from "@/types/extended";
import { cn, formatDate } from "@/lib/utils";
import {
  Plus, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Clock, TrendingDown, Search, ArrowUpDown,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";

const GAP_EXPORT_COLS: ExportColumn<KnowledgeGap>[] = [
  { header: "Gap Area", accessor: (g) => g.gap_area },
  { header: "Severity", accessor: (g) => g.severity },
  { header: "Status", accessor: (g) => g.status },
  { header: "Identified From", accessor: (g) => g.identified_from },
  { header: "Staff Role", accessor: (g) => g.staff_role ?? "" },
  { header: "Evidence Notes", accessor: (g) => g.evidence_notes ?? "" },
  { header: "Resolved At", accessor: (g) => g.resolved_at ?? "" },
  { header: "Created", accessor: (g) => g.created_at },
];


const SEVERITY_COLOURS: Record<KnowledgeGapSeverity, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  significant: "bg-orange-100 text-orange-700 border-orange-200",
  moderate: "bg-amber-100 text-amber-700 border-amber-200",
  minor: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
};

const SEVERITY_BORDER: Record<KnowledgeGapSeverity, string> = {
  critical: "border-red-200",
  significant: "border-orange-200",
  moderate: "border-amber-200",
  minor: "border-[var(--cs-border-subtle)]",
};

const STATUS_COLOURS: Record<KnowledgeGapStatus, string> = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  addressed: "bg-emerald-100 text-emerald-700",
  monitoring: "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)]",
};

const IDENTIFIED_FROM_OPTIONS = [
  { value: "supervision", label: "Supervision" },
  { value: "incident", label: "Incident" },
  { value: "training_assessment", label: "Training Assessment" },
  { value: "observation", label: "Observation" },
  { value: "audit", label: "Audit" },
  { value: "self_reported", label: "Self Reported" },
];

// ── Gap card ──────────────────────────────────────────────────────────────────
function GapCard({ gap }: { gap: KnowledgeGap }) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  const markAddressed = async () => {
    await api.patch(`/learning/knowledge-gaps/${gap.id}`, {
      status: "addressed",
      resolved_at: new Date().toISOString(),
    });
    qc.invalidateQueries({ queryKey: ["learning", "knowledge-gaps"] });
  };

  return (
    <Card className={cn("border", SEVERITY_BORDER[gap.severity])}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            gap.severity === "critical" ? "bg-red-100"
            : gap.severity === "significant" ? "bg-orange-100"
            : gap.severity === "moderate" ? "bg-amber-100"
            : "bg-slate-100"
          )}>
            <TrendingDown className={cn("h-4 w-4",
              gap.severity === "critical" ? "text-red-600"
              : gap.severity === "significant" ? "text-orange-600"
              : gap.severity === "moderate" ? "text-amber-600"
              : "text-[var(--cs-text-muted)]"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--cs-navy)]">{gap.gap_area}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge className={cn("text-[10px] h-4 px-1.5 border", SEVERITY_COLOURS[gap.severity])}>
                  {gap.severity}
                </Badge>
                <Badge className={cn("text-[10px] h-4 px-1.5", STATUS_COLOURS[gap.status])}>
                  {gap.status.replace("_", " ")}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                {IDENTIFIED_FROM_OPTIONS.find((o) => o.value === gap.identified_from)?.label ?? gap.identified_from}
              </Badge>
              <span className="text-[10px] text-[var(--cs-text-muted)] flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {formatDate(gap.created_at)}
              </span>
            </div>
          </div>
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] shrink-0 mt-1"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {expanded && (
          <div className="space-y-3 pt-2 border-t border-[var(--cs-border-subtle)]">
            {gap.staff_role && (
              <div>
                <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Staff Role</p>
                <p className="text-sm text-[var(--cs-text-secondary)]">{gap.staff_role}</p>
              </div>
            )}
            {gap.evidence_notes && (
              <div>
                <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Evidence Notes</p>
                <div className="rounded-lg bg-slate-50 border border-[var(--cs-border)] p-3">
                  <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-wrap">{gap.evidence_notes}</p>
                </div>
              </div>
            )}
            {gap.status !== "addressed" && (
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 gap-1 text-emerald-700 border-emerald-200"
                  onClick={markAddressed}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Mark Addressed
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── New gap dialog ─────────────────────────────────────────────────────────────
function NewGapDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [gapArea, setGapArea] = useState("");
  const [severity, setSeverity] = useState<KnowledgeGapSeverity>("moderate");
  const [identifiedFrom, setIdentifiedFrom] = useState("supervision");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const createMutation = useCreateKnowledgeGap();

  const handleSubmit = () => {
    if (!gapArea.trim()) return;
    createMutation.mutate(
      {
        home_id: homeId,
        gap_area: gapArea,
        severity,
        identified_from: identifiedFrom,
        evidence_notes: evidenceNotes || undefined,
        staff_role: staffRole || undefined,
        status: "open",
        created_by: currentUser?.id ?? "staff_darren",
      },
      {
        onSuccess: () => {
          onClose();
          setGapArea("");
          setSeverity("moderate");
          setIdentifiedFrom("supervision");
          setEvidenceNotes("");
          setStaffRole("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-amber-600" />
            Record Knowledge Gap
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Gap Area</label>
            <Input
              className="mt-1"
              placeholder="e.g. Understanding of de-escalation techniques"
              value={gapArea}
              onChange={(e) => setGapArea(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Severity</label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as KnowledgeGapSeverity)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="significant">Significant</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Identified From</label>
              <Select value={identifiedFrom} onValueChange={setIdentifiedFrom}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IDENTIFIED_FROM_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Staff Role (optional)</label>
            <Input
              className="mt-1"
              placeholder="e.g. Senior Residential Worker"
              value={staffRole}
              onChange={(e) => setStaffRole(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Evidence Notes</label>
            <Textarea
              className="mt-1 text-sm"
              rows={4}
              placeholder="Describe the evidence that identified this gap…"
              value={evidenceNotes}
              onChange={(e) => setEvidenceNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!gapArea.trim() || createMutation.isPending}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            {createMutation.isPending ? "Saving…" : "Record Gap"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function KnowledgeGapsPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [showNew, setShowNew] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "addressed">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"severity" | "date" | "area" | "status">("severity");

  const { data, isLoading } = useKnowledgeGaps({ homeId: homeId });
  const gaps = data?.data ?? [];

  const filtered = (() => {
    let list = statusFilter === "open"
      ? gaps.filter((g) => g.status === "open" || g.status === "in_progress")
      : statusFilter === "addressed"
      ? gaps.filter((g) => g.status === "addressed" || g.status === "monitoring")
      : gaps;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((g) => {
        const hay = [g.gap_area, g.severity, g.status, g.identified_from, g.evidence_notes || "", g.staff_role || ""].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "area":
          return a.gap_area.localeCompare(b.gap_area);
        case "status": {
          const so: Record<string, number> = { open: 0, in_progress: 1, monitoring: 2, addressed: 3 };
          return (so[a.status] ?? 9) - (so[b.status] ?? 9);
        }
        case "severity":
        default: {
          const sev: Record<string, number> = { critical: 0, significant: 1, moderate: 2, minor: 3 };
          return (sev[a.severity] ?? 9) - (sev[b.severity] ?? 9);
        }
      }
    });
    return list;
  })();

  const criticalCount = gaps.filter((g) => g.severity === "critical" && g.status !== "addressed").length;
  const openCount = gaps.filter((g) => g.status === "open" || g.status === "in_progress").length;

  return (
    <PageShell
      title="Knowledge Gaps"
      subtitle="Track and address knowledge gaps across the team"
      caraContext={{ pageTitle: "Knowledge Gap Analysis", sourceType: "staff" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={GAP_EXPORT_COLS} filename="knowledge-gaps" />
          <PrintButton title="Knowledge Gaps" subtitle="Knowledge Gap Analysis" targetId="knowledge-gaps-content" />
          <SmartUploadButton variant="inline" label="Upload Evidence" uploadContext="Learning — Knowledge Gaps evidence upload" />
          <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Gap
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="knowledge-gaps-content" className="space-y-4 animate-fade-in">

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "Critical (Open)",
              value: criticalCount,
              colour: criticalCount > 0 ? "text-red-700" : "text-emerald-700",
              bg: criticalCount > 0 ? "bg-red-50" : "bg-emerald-50",
            },
            {
              label: "Open / In Progress",
              value: openCount,
              colour: openCount > 0 ? "text-amber-700" : "text-emerald-700",
              bg: openCount > 0 ? "bg-amber-50" : "bg-emerald-50",
            },
            {
              label: "Total Gaps",
              value: gaps.length,
              colour: "text-[var(--cs-text-secondary)]",
              bg: "bg-slate-50",
            },
          ].map(({ label, value, colour, bg }) => (
            <div key={label} className={cn("rounded-xl border border-[var(--cs-border-subtle)] p-4 text-center", bg)}>
              <div className={cn("text-2xl font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Critical alert */}
        {criticalCount > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 p-4">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm font-semibold text-red-700">
              {criticalCount} critical knowledge gap{criticalCount !== 1 ? "s" : ""} require{criticalCount === 1 ? "s" : ""} immediate attention.
            </p>
          </div>
        )}

        {/* Search + Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <Input
              placeholder="Search gaps by title, area, severity…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs rounded-lg"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)] shrink-0">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-white border rounded-md px-2 py-1.5 text-xs">
              <option value="severity">Severity (critical first)</option>
              <option value="date">Newest first</option>
              <option value="area">Area A–Z</option>
              <option value="status">Status (open → addressed)</option>
            </select>
          </div>
          <div className="flex gap-2">
            {(["all", "open", "addressed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  statusFilter === f
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"
                )}
              >
                {f === "all" ? "All" : f === "open" ? "Open / Active" : "Addressed"}
              </button>
            ))}
          </div>
          {(search || statusFilter !== "all") && (
            <span className="text-xs text-[var(--cs-text-muted)]">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <p className="text-center text-sm text-[var(--cs-text-muted)] py-12">Loading knowledge gaps…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[var(--cs-text-muted)]">
            <TrendingDown className="h-10 w-10 text-[var(--cs-text-gentle)] mx-auto mb-3" />
            <p className="text-sm font-medium">
              {statusFilter === "all" ? "No knowledge gaps recorded yet" : `No ${statusFilter} knowledge gaps`}
            </p>
            <p className="text-xs mt-1">Recording gaps helps identify training priorities</p>
            <Button size="sm" className="mt-4 gap-1" onClick={() => setShowNew(true)}>
              <Plus className="h-3.5 w-3.5" />
              Record First Gap
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((gap) => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </div>
        )}
      </div>

      {showNew && <NewGapDialog open onClose={() => setShowNew(false)} />}
      <CaraPanel
        mode="assist"
        pageContext="Knowledge Gap Analysis — staff knowledge gaps, mandatory training gaps, competency assessments, training needs analysis, individual development plans, Reg 45 workforce evidence"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
