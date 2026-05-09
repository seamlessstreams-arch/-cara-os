"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ANNEX A READINESS DASHBOARD
// Continuously inspection-ready, evidence-backed, live-updating
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Pencil,
  Camera,
  BarChart3,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
  useAnnexAReadiness,
  useDecideAnnexAEvidence,
  type AnnexAEvidenceEnriched,
} from "@/hooks/use-compliance-evidence";
import { useAuthContext } from "@/contexts/auth-context";
import { toast } from "sonner";
import type { ManagerDecision } from "@/types/care-events";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Readiness score ring ──────────────────────────────────────────────────────

function ReadinessRing({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const colour =
    score >= 80
      ? "#10b981" // emerald
      : score >= 60
      ? "#f59e0b" // amber
      : "#ef4444"; // red

  const label =
    score >= 80
      ? "Inspection ready"
      : score >= 60
      ? "Needs attention"
      : "Not ready";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} stroke="#e2e8f0" strokeWidth="12" fill="none" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={colour}
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{score}%</span>
        </div>
      </div>
      <p className="text-sm font-medium" style={{ color: colour }}>
        {label}
      </p>
    </div>
  );
}

// ── Section progress bar ───────────────────────────────────────────────────────

function SectionBar({
  label,
  evidenceCount,
  approvedCount,
  pendingCount,
  staleCount,
  hasGap,
  isSelected,
  onClick,
}: {
  label: string;
  evidenceCount: number;
  approvedCount: number;
  pendingCount: number;
  staleCount: number;
  hasGap: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const pct = evidenceCount > 0 ? Math.round((approvedCount / evidenceCount) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg border transition-all",
        isSelected ? "border-slate-400 bg-slate-50 shadow-sm" : "border-slate-100 hover:border-slate-200",
        hasGap && "border-red-200 bg-red-50/20"
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-800 truncate flex-1">{label}</span>
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {hasGap && <Badge className="text-xs bg-red-100 text-red-700">No evidence</Badge>}
          {staleCount > 0 && <Badge className="text-xs bg-amber-100 text-amber-700">Stale</Badge>}
          {pendingCount > 0 && (
            <Badge className="text-xs bg-amber-100 text-amber-800">{pendingCount} pending</Badge>
          )}
          <span className="text-xs text-slate-500 min-w-[2.5rem] text-right">
            {approvedCount}/{evidenceCount}
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-400"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}

// ── Evidence item row ─────────────────────────────────────────────────────────

function EvidenceRow({
  item,
  onDecide,
}: {
  item: AnnexAEvidenceEnriched;
  onDecide: (item: AnnexAEvidenceEnriched) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const DECISION_CLR: Record<ManagerDecision, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    accepted: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
    deferred: "bg-slate-100 text-slate-600",
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-3",
        item.manager_decision === "pending" && "border-amber-100 bg-amber-50/10",
        (item.manager_decision === "approved" || item.manager_decision === "accepted") && "border-emerald-100",
        item.manager_decision === "rejected" && "opacity-50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            <Badge
              className={cn("text-xs", DECISION_CLR[item.manager_decision] ?? DECISION_CLR.pending)}
            >
              {item.manager_decision === "accepted" ? "approved" : item.manager_decision}
            </Badge>
          </div>
          <p className="text-sm text-slate-800 line-clamp-2">{item.suggested_text}</p>
          {item.care_event && (
            <p className="text-xs text-slate-400 mt-0.5">
              <Link
                href={`/care-events/${item.care_event.id}`}
                className="text-indigo-500 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {item.care_event.title}
              </Link>{" "}
              — {formatDate(item.care_event.event_date)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          {item.manager_decision === "pending" && (
            <Button size="sm" className="h-6 text-xs" onClick={() => onDecide(item)}>
              Review
            </Button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-sm text-slate-700">{item.suggested_text}</p>
          {item.manager_approved_text && (
            <div className="mt-1.5 bg-emerald-50 rounded p-2">
              <p className="text-xs text-emerald-700 font-medium mb-0.5">Approved text</p>
              <p className="text-xs text-slate-700">{item.manager_approved_text}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Review dialog ─────────────────────────────────────────────────────────────

function ReviewDialog({
  item,
  onClose,
}: {
  item: AnnexAEvidenceEnriched;
  onClose: () => void;
}) {
  const { currentUser } = useAuthContext();
  const decideMutation = useDecideAnnexAEvidence();
  const [approvedText, setApprovedText] = useState(item.manager_approved_text ?? item.suggested_text);
  const [decision, setDecision] = useState<ManagerDecision>(
    item.manager_decision === "pending" ? "approved" : item.manager_decision
  );

  const handleSubmit = () => {
    decideMutation.mutate(
      {
        id: item.id,
        manager_decision: decision,
        manager_approved_text: decision === "approved" || decision === "accepted" ? approvedText : undefined,
        reviewed_by: currentUser?.id ?? "manager_default",
      },
      {
        onSuccess: () => {
          toast.success(
            decision === "approved" ? "Evidence approved for Annex A" : "Decision saved"
          );
          onClose();
        },
        onError: () => toast.error("Failed to save decision"),
      }
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Annex A Evidence</DialogTitle>
          <DialogDescription>
            Approve, reject or defer this evidence item. Approved items contribute to the Annex A
            readiness score and inspection snapshot.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {item.care_event && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Source</p>
              <p className="text-sm font-medium">{item.care_event.title}</p>
              <p className="text-xs text-slate-500">
                {item.care_event.category.replace(/_/g, " ")} — {formatDate(item.care_event.event_date)}
              </p>
            </div>
          )}

          <div>
            <Label className="text-sm">AI-suggested text</Label>
            <p className="text-sm text-slate-700 bg-slate-50 border rounded p-2 mt-1">
              {item.suggested_text}
            </p>
          </div>

          <div>
            <Label htmlFor="approved_text" className="text-sm font-medium">
              Approved text{" "}
              <span className="text-slate-400 font-normal">(edit if needed)</span>
            </Label>
            <Textarea
              id="approved_text"
              value={approvedText}
              onChange={(e) => setApprovedText(e.target.value)}
              rows={3}
              className="mt-1 text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { value: "approved", label: "Approve", icon: CheckCircle2, colour: "border-emerald-400 bg-emerald-50" },
                { value: "rejected", label: "Reject", icon: XCircle, colour: "border-red-400 bg-red-50" },
                { value: "deferred", label: "Defer", icon: Clock, colour: "border-slate-300 bg-slate-50" },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setDecision(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-sm transition-all",
                    decision === opt.value ? opt.colour : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium text-xs">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={decideMutation.isPending}
            className={cn(decision === "approved" && "bg-emerald-600 hover:bg-emerald-700")}
          >
            {decideMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnnexAReadinessPage() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [reviewingItem, setReviewingItem] = useState<AnnexAEvidenceEnriched | null>(null);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const snapshotDate = new Date().toISOString();

  const { data, isLoading } = useAnnexAReadiness({
    section: selectedSection ?? undefined,
  });

  const items = data?.data ?? [];
  const meta = data?.meta;
  const sections = meta?.sections ?? [];

  return (
    <PageShell
      title="Annex A Readiness Dashboard"
      subtitle="Continuously inspection-ready — evidence from verified Care Events builds Annex A automatically"
      actions={
        <Button size="sm" variant="outline" onClick={() => setSnapshotOpen(true)}>
          <Camera className="h-3.5 w-3.5 mr-1.5" />
          Generate snapshot
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading readiness dashboard...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top stats row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Readiness score */}
            <Card className="border-slate-200 flex items-center justify-center p-4">
              <CardContent className="p-0 flex flex-col items-center gap-3">
                <ReadinessRing score={meta?.readiness_score ?? 0} />
                <p className="text-xs text-slate-500 text-center">
                  Overall Annex A readiness score
                </p>
              </CardContent>
            </Card>

            {/* Evidence stats */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-600">Evidence Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Total evidence items", value: meta?.total_evidence ?? 0, icon: <FileText className="h-3.5 w-3.5 text-slate-500" /> },
                  { label: "Pending manager review", value: meta?.pending_decisions ?? 0, icon: <Clock className="h-3.5 w-3.5 text-amber-500" /> },
                  { label: "Approved items", value: meta?.approved_count ?? 0, icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> },
                  { label: "Stale items (90+ days)", value: meta?.stale_count ?? 0, icon: <AlertTriangle className="h-3.5 w-3.5 text-orange-500" /> },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-slate-600">
                      {stat.icon}
                      {stat.label}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{stat.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Gaps */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-600">Gaps & Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {(meta?.gaps?.length ?? 0) === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                    <p className="text-sm text-emerald-700 font-medium">No section gaps</p>
                    <p className="text-xs text-slate-400 text-center">All sections have evidence</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-500 font-medium mb-2">
                      {meta?.gaps?.length} section{(meta?.gaps?.length ?? 0) !== 1 ? "s" : ""} without evidence:
                    </p>
                    {meta?.gaps?.slice(0, 4).map((gap) => {
                      const section = sections.find((s) => s.key === gap);
                      return (
                        <button
                          key={gap}
                          onClick={() => setSelectedSection(gap)}
                          className="w-full text-left flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded p-1.5 hover:bg-red-100 transition-colors"
                        >
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          {section?.label ?? gap}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Section breakdown */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-slate-500" />
                  Annex A Sections
                </CardTitle>
                {selectedSection && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSelectedSection(null)}
                  >
                    Clear filter
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sections.map((section) => (
                  <SectionBar
                    key={section.key}
                    label={section.label}
                    evidenceCount={section.evidence_count}
                    approvedCount={section.approved_count}
                    pendingCount={section.pending_count}
                    staleCount={section.stale_count}
                    hasGap={section.has_gap}
                    isSelected={selectedSection === section.key}
                    onClick={() =>
                      setSelectedSection(
                        selectedSection === section.key ? null : section.key
                      )
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Evidence items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-800">
                {selectedSection
                  ? `Evidence — ${sections.find((s) => s.key === selectedSection)?.label ?? selectedSection}`
                  : "All evidence items"}
              </h2>
              <span className="text-xs text-slate-400">{items.length} items</span>
            </div>

            {items.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">No evidence items</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedSection
                      ? "No evidence for this section. Submit Care Events flagged for Annex A."
                      : "Submit verified Care Events to start building Annex A evidence."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <EvidenceRow key={item.id} item={item} onDecide={setReviewingItem} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {reviewingItem && (
        <ReviewDialog item={reviewingItem} onClose={() => setReviewingItem(null)} />
      )}

      {/* ── Inspection Snapshot Dialog ─────────────────────────────────── */}
      <Dialog open={snapshotOpen} onOpenChange={setSnapshotOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-slate-600" />
              Annex A Inspection Snapshot
            </DialogTitle>
            <DialogDescription>
              Point-in-time readiness snapshot generated {new Date(snapshotDate).toLocaleString("en-GB")}.
              Print this page for inspectors or archive in the filing cabinet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Overall score */}
            <div className="rounded-lg border bg-slate-50 p-4 flex items-center gap-4">
              <ReadinessRing score={meta?.readiness_score ?? 0} />
              <div>
                <p className="text-sm font-semibold text-slate-800">Overall Annex A readiness</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {meta?.approved_count ?? 0} approved evidence items across{" "}
                  {sections.filter((s) => s.approved_count > 0).length} of {sections.length} sections
                </p>
                {(meta?.gaps?.length ?? 0) > 0 && (
                  <p className="text-xs text-red-600 mt-0.5">
                    {meta?.gaps?.length} section{(meta?.gaps?.length ?? 0) !== 1 ? "s" : ""} without evidence
                  </p>
                )}
              </div>
            </div>

            {/* Evidence stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total evidence", value: meta?.total_evidence ?? 0 },
                { label: "Approved", value: meta?.approved_count ?? 0 },
                { label: "Pending review", value: meta?.pending_decisions ?? 0 },
                { label: "Stale (90+ days)", value: meta?.stale_count ?? 0 },
              ].map((s) => (
                <div key={s.label} className="rounded border p-3">
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-lg font-bold text-slate-900">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Section summary */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Section readiness
              </p>
              <div className="space-y-1.5">
                {sections.map((s) => {
                  const pct = s.evidence_count > 0 ? Math.round((s.approved_count / s.evidence_count) * 100) : 0;
                  return (
                    <div key={s.key} className="flex items-center gap-3 text-xs">
                      <span className="flex-1 text-slate-700 truncate">{s.label}</span>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : s.has_gap ? "bg-red-400" : "bg-slate-300"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={cn(
                        "w-12 text-right font-medium",
                        s.has_gap ? "text-red-600" : "text-slate-600"
                      )}>
                        {s.approved_count}/{s.evidence_count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 border-t pt-3">
              Cornerstone \u00b7 Annex A Snapshot \u00b7 Generated {new Date(snapshotDate).toLocaleString("en-GB")} \u00b7 Home: Oak House
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSnapshotOpen(false)}>Close</Button>
            <Button onClick={() => window.print()}>
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Print snapshot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
