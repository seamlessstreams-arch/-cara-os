"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION 45 EVIDENCE BANK + REPORT BUILDER
// Live-updating evidence queue from Care Event routing
// Managers review, edit and approve suggested evidence for Reg 45 reports
// Report Builder groups approved evidence by theme for narrative drafting
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Eye,
  Pencil,
  BookOpen,
  LayoutList,
  Download,
  Info,
  TrendingUp,
  AlertTriangle,
  Users,
  Copy,
  Lightbulb,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
  useReg45Evidence,
  useDecideReg45Evidence,
  type Reg45EvidenceEnriched,
} from "@/hooks/use-compliance-evidence";
import { useAuthContext } from "@/contexts/auth-context";
import { toast } from "sonner";
import Link from "next/link";
import type { ManagerDecision } from "@/types/care-events";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Decision colours ──────────────────────────────────────────────────────────

const DECISION_CLR: Record<ManagerDecision, string> = {
  pending: "bg-[--cs-warning-bg] text-[--cs-warning] border-[--cs-warning-soft]",
  approved: "bg-[--cs-success-bg] text-[--cs-success] border-[--cs-success-soft]",
  accepted: "bg-[--cs-success-bg] text-[--cs-success] border-[--cs-success-soft]",
  rejected: "bg-[--cs-risk-bg] text-[--cs-risk] border-[--cs-risk-soft]",
  deferred: "bg-slate-100 text-slate-600 border-slate-200",
};

const DECISION_LABEL: Record<ManagerDecision, string> = {
  pending: "Pending review",
  approved: "Approved",
  accepted: "Accepted",
  rejected: "Rejected",
  deferred: "Deferred",
};

const CATEGORY_CLR: Record<string, string> = {
  behaviour: "bg-amber-100 text-amber-800",
  safeguarding: "bg-red-100 text-red-800",
  health: "bg-blue-100 text-blue-800",
  missing_episode: "bg-purple-100 text-purple-800",
  physical_intervention: "bg-orange-100 text-orange-800",
  restraint: "bg-orange-100 text-orange-800",
  complaint: "bg-yellow-100 text-yellow-800",
  general: "bg-slate-100 text-slate-700",
};

// ── Evidence item card ────────────────────────────────────────────────────────

function EvidenceItemCard({
  item,
  onDecide,
}: {
  item: Reg45EvidenceEnriched;
  onDecide: (item: Reg45EvidenceEnriched) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className={cn(
        "border transition-all",
        item.manager_decision === "pending" && "border-[--cs-warning-soft] bg-amber-50/10",
        item.manager_decision === "approved" || item.manager_decision === "accepted"
          ? "border-[--cs-success-soft] bg-emerald-50/10"
          : "",
        item.manager_decision === "rejected" && "opacity-60 border-slate-200",
        item.manager_decision === "deferred" && "border-slate-200 opacity-70"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <Badge
                className={cn(
                  "text-xs border",
                  DECISION_CLR[item.manager_decision] ?? DECISION_CLR.pending
                )}
              >
                {DECISION_LABEL[item.manager_decision]}
              </Badge>
              {item.suggested_theme && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs capitalize",
                    CATEGORY_CLR[item.care_event?.category ?? "general"] ?? "bg-slate-100 text-slate-700"
                  )}
                >
                  {item.suggested_theme}
                </Badge>
              )}
            </div>

            {/* Suggested text (truncated) */}
            <p className="text-sm text-slate-800 line-clamp-2">{item.suggested_text}</p>

            {item.care_event && (
              <p className="text-xs text-slate-500 mt-1.5">
                Source:{" "}
                <Link href={`/care-events/${item.care_event.id}`} className="text-indigo-600 hover:underline">
                  {item.care_event.title}
                </Link>{" "}
                — {formatDate(item.care_event.event_date)}
              </p>
            )}

            {item.reviewed_at && (
              <p className="text-xs text-slate-400 mt-0.5">
                Reviewed {formatDate(item.reviewed_at)} by {item.reviewed_by}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
            {item.manager_decision === "pending" && (
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => onDecide(item)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Review
              </Button>
            )}
            {(item.manager_decision === "approved" || item.manager_decision === "accepted") && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onDecide(item)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">AI-suggested text</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded p-2">{item.suggested_text}</p>
            </div>
            {item.manager_approved_text && (
              <div>
                <p className="text-xs font-medium text-[--cs-success] mb-1">Manager-approved text</p>
                <p className="text-sm text-slate-700 bg-[--cs-success-bg] rounded p-2">{item.manager_approved_text}</p>
              </div>
            )}
            {item.review_notes && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Review notes</p>
                <p className="text-sm text-slate-700">{item.review_notes}</p>
              </div>
            )}
            {item.care_event && (
              <div className="bg-blue-50 rounded p-2">
                <p className="text-xs font-medium text-blue-700 mb-0.5">Source care event</p>
                <p className="text-sm text-slate-900">{item.care_event.title}</p>
                <p className="text-xs text-slate-500">
                  {item.care_event.category.replace(/_/g, " ")} — Status: {item.care_event.status.replace(/_/g, " ")}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Review dialog ─────────────────────────────────────────────────────────────

function ReviewDialog({
  item,
  onClose,
}: {
  item: Reg45EvidenceEnriched;
  onClose: () => void;
}) {
  const { currentUser } = useAuthContext();
  const decideMutation = useDecideReg45Evidence();
  const [approvedText, setApprovedText] = useState(
    item.manager_approved_text ?? item.suggested_text
  );
  const [reviewNotes, setReviewNotes] = useState(item.review_notes ?? "");
  const [decision, setDecision] = useState<ManagerDecision>(
    item.manager_decision === "pending" ? "approved" : item.manager_decision
  );

  const handleSubmit = () => {
    decideMutation.mutate(
      {
        id: item.id,
        manager_decision: decision,
        manager_approved_text: decision === "approved" || decision === "accepted" ? approvedText : undefined,
        review_notes: reviewNotes || undefined,
        reviewed_by: currentUser?.id ?? "manager_default",
      },
      {
        onSuccess: () => {
          const messages: Record<string, string> = {
            approved: "Evidence approved for Regulation 45 report",
            accepted: "Evidence accepted for Regulation 45 report",
            rejected: "Evidence rejected",
            deferred: "Evidence deferred — will remain in queue",
          };
          toast.success(messages[decision] ?? "Decision saved");
          onClose();
        },
        onError: () => {
          toast.error("Failed to save decision");
        },
      }
    );
  };

  const DECISION_OPTIONS: Array<{
    value: ManagerDecision;
    label: string;
    description: string;
    colour: string;
  }> = [
    {
      value: "approved",
      label: "Approve",
      description: "Include in Regulation 45 report",
      colour: "border-[--cs-success] bg-[--cs-success-bg]",
    },
    {
      value: "rejected",
      label: "Reject",
      description: "Do not include in report",
      colour: "border-[--cs-risk] bg-[--cs-risk-bg]",
    },
    {
      value: "deferred",
      label: "Defer",
      description: "Review later",
      colour: "border-slate-300 bg-slate-50",
    },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Regulation 45 Evidence</DialogTitle>
          <DialogDescription>
            Review the AI-suggested evidence below. Edit the approved text if needed, then make your decision.
            Only approved evidence will appear in the Regulation 45 report builder.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Source care event */}
          {item.care_event && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Source Care Event
              </p>
              <p className="text-sm font-medium text-slate-900">{item.care_event.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {item.care_event.category.replace(/_/g, " ")} —{" "}
                {formatDate(item.care_event.event_date)} — Status:{" "}
                {item.care_event.status.replace(/_/g, " ")}
              </p>
            </div>
          )}

          {/* AI suggested text (read-only reference) */}
          <div>
            <Label className="text-sm text-slate-500">AI-suggested text (for reference)</Label>
            <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded p-2 mt-1">
              {item.suggested_text}
            </p>
          </div>

          {/* Manager-approved text (editable) */}
          <div>
            <Label htmlFor="approved_text" className="text-sm font-medium">
              Approved text for Regulation 45 report{" "}
              <span className="text-slate-400 font-normal">(edit as required)</span>
            </Label>
            <Textarea
              id="approved_text"
              value={approvedText}
              onChange={(e) => setApprovedText(e.target.value)}
              rows={4}
              className="mt-1 text-sm"
            />
          </div>

          {/* Decision buttons */}
          <div>
            <Label className="text-sm font-medium">Decision</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {DECISION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDecision(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 text-sm transition-all",
                    decision === opt.value ? opt.colour + " border-opacity-100" : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {opt.value === "approved" && (
                    <CheckCircle2 className={cn("h-4 w-4", decision === "approved" ? "text-[--cs-success]" : "text-slate-400")} />
                  )}
                  {opt.value === "rejected" && (
                    <XCircle className={cn("h-4 w-4", decision === "rejected" ? "text-[--cs-risk]" : "text-slate-400")} />
                  )}
                  {opt.value === "deferred" && (
                    <Pause className={cn("h-4 w-4", decision === "deferred" ? "text-slate-600" : "text-slate-400")} />
                  )}
                  <span className="font-medium text-xs">{opt.label}</span>
                  <span className="text-xs text-slate-500 text-center">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Review notes */}
          <div>
            <Label htmlFor="review_notes" className="text-sm">
              Review notes <span className="text-slate-400">(optional)</span>
            </Label>
            <Textarea
              id="review_notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Optional notes about this decision..."
              rows={2}
              className="mt-1 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={decideMutation.isPending}
            className={cn(
              decision === "approved" && "bg-emerald-600 hover:bg-emerald-700",
              decision === "rejected" && "bg-red-600 hover:bg-red-700"
            )}
          >
            {decideMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save Decision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Report Builder ────────────────────────────────────────────────────────────

const REPORT_THEMES = [
  "behaviour",
  "safeguarding",
  "health",
  "missing_episode",
  "physical_intervention",
  "restraint",
  "complaint",
  "general",
] as const;

const THEME_LABELS: Record<string, string> = {
  behaviour: "Behaviour",
  safeguarding: "Safeguarding",
  health: "Health & Wellbeing",
  missing_episode: "Missing Episodes",
  physical_intervention: "Physical Interventions",
  restraint: "Restraints",
  complaint: "Complaints",
  general: "General",
};

function ReportBuilderTab({
  onDecide,
}: {
  onDecide: (item: Reg45EvidenceEnriched) => void;
}) {
  const { data: approvedData, isLoading } = useReg45Evidence({ decision: "approved" });
  const { data: allData } = useReg45Evidence({});
  const [narratives, setNarratives] = useState<Record<string, string>>({});
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);

  const approvedItems: Reg45EvidenceEnriched[] = approvedData?.data ?? [];
  const allItems: Reg45EvidenceEnriched[] = allData?.data ?? [];
  const counts = allData?.meta?.counts;

  // Group approved items by theme
  const byTheme: Record<string, Reg45EvidenceEnriched[]> = {};
  for (const item of approvedItems) {
    const theme = item.suggested_theme ?? "general";
    if (!byTheme[theme]) byTheme[theme] = [];
    byTheme[theme].push(item);
  }

  const pendingItems = allItems.filter((i) => i.manager_decision === "pending");
  const deferredItems = allItems.filter((i) => i.manager_decision === "deferred");

  return (
    <div className="space-y-6">
      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-[--cs-success-soft] bg-[--cs-success-bg]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-[--cs-success]">{counts?.approved ?? 0}</p>
            <p className="text-xs text-[--cs-success] mt-0.5">Approved evidence</p>
          </CardContent>
        </Card>
        <Card className="border-[--cs-warning-soft] bg-[--cs-warning-bg]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-[--cs-warning]">{counts?.pending ?? 0}</p>
            <p className="text-xs text-[--cs-warning] mt-0.5">Awaiting review</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 bg-slate-50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-slate-700">{counts?.deferred ?? 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">Deferred</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending banner */}
      {pendingItems.length > 0 && (
        <div className="rounded-lg border border-[--cs-warning-soft] bg-[--cs-warning-bg] px-4 py-3 flex items-start gap-2 text-sm text-[--cs-warning]">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">{pendingItems.length} item{pendingItems.length !== 1 ? "s" : ""} still awaiting manager review.</span>{" "}
            Switch to the Evidence Queue tab to review pending items before they can appear in the report.
          </div>
        </div>
      )}

      {/* Report sections */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading report builder...
        </div>
      ) : approvedItems.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-600">No approved evidence yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Approve evidence items from the Evidence Queue tab to start building your Regulation 45 report.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Report Sections</h3>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <Download className="w-3.5 h-3.5" />
              Export draft report
            </Button>
          </div>

          {REPORT_THEMES.filter((t) => byTheme[t]?.length > 0).map((theme) => {
            const themeItems = byTheme[theme] ?? [];
            const isOpen = expandedTheme === theme;
            return (
              <Card key={theme} className="border-slate-200">
                <CardContent className="p-0">
                  {/* Theme header */}
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors rounded-t-lg"
                    onClick={() => setExpandedTheme(isOpen ? null : theme)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs capitalize",
                          CATEGORY_CLR[theme] ?? "bg-slate-100 text-slate-700"
                        )}
                      >
                        {THEME_LABELS[theme] ?? theme}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {themeItems.length} evidence item{themeItems.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
                      {/* Evidence items for this theme */}
                      <div className="space-y-2 pt-3">
                        {themeItems.map((item) => (
                          <div
                            key={item.id}
                            className="bg-slate-50 rounded-lg p-3 border border-slate-100"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm text-slate-800">
                                  {item.manager_approved_text ?? item.suggested_text}
                                </p>
                                {item.care_event && (
                                  <p className="text-xs text-slate-400 mt-1">
                                    Source:{" "}
                                    <Link href={`/care-events/${item.care_event.id}`} className="text-indigo-500 hover:underline">
                                      {item.care_event.title}
                                    </Link>{" "}
                                    —{" "}
                                    {formatDate(item.care_event.event_date)}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 shrink-0"
                                onClick={() => onDecide(item)}
                                title="Edit approved text"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Narrative draft area */}
                      <div>
                        <Label className="text-xs font-medium text-slate-600 mb-1 block">
                          Report narrative for this section{" "}
                          <span className="text-slate-400 font-normal">(draft — not saved to report until exported)</span>
                        </Label>
                        <Textarea
                          rows={4}
                          placeholder={`Draft your Regulation 45 narrative for the ${THEME_LABELS[theme] ?? theme} section here, drawing on the evidence items above…`}
                          value={narratives[theme] ?? ""}
                          onChange={(e) =>
                            setNarratives((prev) => ({ ...prev, [theme]: e.target.value }))
                          }
                          className="text-sm"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Deferred items reminder */}
          {deferredItems.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              {deferredItems.length} deferred item{deferredItems.length !== 1 ? "s" : ""} not shown above.
              Return to the Evidence Queue to revisit deferred evidence.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Patterns & Themes Tab ─────────────────────────────────────────────────────

const MANAGEMENT_SUGGESTIONS: Array<{
  condition: (freq: Record<string, number>, childCount: number, totalItems: number, recentItems: number) => boolean;
  text: string;
  priority: "high" | "medium" | "low";
}> = [
  {
    condition: (f) => (f["safeguarding"] ?? 0) >= 2,
    text: "Safeguarding strategy meeting recommended — multiple safeguarding concerns recorded in this period.",
    priority: "high",
  },
  {
    condition: (f) => (f["missing_episode"] ?? 0) >= 3,
    text: "Missing episode protocol review — pattern of repeated absences identified. Review risk assessment.",
    priority: "high",
  },
  {
    condition: (f) => ((f["restraint"] ?? 0) + (f["physical_intervention"] ?? 0)) >= 2,
    text: "Physical intervention debrief required — multiple restraint/PI events recorded. Review de-escalation practices.",
    priority: "high",
  },
  {
    condition: (f) => (f["behaviour"] ?? 0) >= 4,
    text: "Behaviour support plan review — high frequency of behaviour incidents suggests current strategies need updating.",
    priority: "medium",
  },
  {
    condition: (f) => (f["complaint"] ?? 0) >= 2,
    text: "Complaints review required — escalation pathway and response timeliness should be audited.",
    priority: "medium",
  },
  {
    condition: (f, childCount, totalItems) => childCount === 1 && totalItems >= 4,
    text: "Child-specific action plan review — significant pattern of concerns concentrated on one child.",
    priority: "high",
  },
  {
    condition: (f, _c, _t, recentItems) => recentItems >= 4,
    text: "Cluster of concerns in the last 14 days — consider management review or unannounced check.",
    priority: "medium",
  },
  {
    condition: (f) => (f["health"] ?? 0) >= 3,
    text: "Health and wellbeing review — multiple health-related records suggest a pattern requiring clinical review.",
    priority: "medium",
  },
];

function PatternsTab() {
  const { data, isLoading } = useReg45Evidence({});
  const [copied, setCopied] = useState(false);

  const allItems: Reg45EvidenceEnriched[] = data?.data ?? [];

  // ── Compute theme frequencies ─────────────────────────────────────────────
  const themeFreq: Record<string, number> = {};
  const themeRecent: Record<string, number> = {}; // last 14 days
  const childIdSet = new Set<string>();
  const weeklyBuckets: Record<string, number> = {}; // ISO week key → count

  const now = new Date();
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  for (const item of allItems) {
    const theme = item.suggested_theme ?? item.care_event?.category ?? "general";
    themeFreq[theme] = (themeFreq[theme] ?? 0) + 1;

    if (item.care_event?.event_date) {
      const d = new Date(item.care_event.event_date);

      if (d >= fourteenDaysAgo) {
        themeRecent[theme] = (themeRecent[theme] ?? 0) + 1;
      }

      // Weekly bucket (8-week lookback)
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const weeksAgo = Math.floor((now.getTime() - d.getTime()) / msPerWeek);
      if (weeksAgo >= 0 && weeksAgo < 8) {
        const key = String(7 - weeksAgo); // 0 = oldest bucket shown left
        weeklyBuckets[key] = (weeklyBuckets[key] ?? 0) + 1;
      }
    }

    if (item.care_event?.child_id) {
      childIdSet.add(item.care_event.child_id);
    }
  }

  const sortedThemes = Object.entries(themeFreq).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...sortedThemes.map(([, c]) => c), 1);
  const emergingConcerns = Object.entries(themeRecent)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]);
  const recentTotal = Object.values(themeRecent).reduce((a, b) => a + b, 0);
  const childCount = childIdSet.size;

  // ── Build weekly distribution (8 buckets, oldest left) ───────────────────
  const weeklyData = Array.from({ length: 8 }, (_, i) => ({
    label: i === 7 ? "This wk" : i === 6 ? "Last wk" : `-${7 - i}w`,
    count: weeklyBuckets[String(i + 1)] ?? 0,
  }));
  const maxWeekly = Math.max(...weeklyData.map((w) => w.count), 1);

  // ── Management action suggestions ────────────────────────────────────────
  const suggestions = MANAGEMENT_SUGGESTIONS.filter((s) =>
    s.condition(themeFreq, childCount, allItems.length, recentTotal)
  );

  // ── Auto-generated narrative starter ─────────────────────────────────────
  const periodLabel = "the current reporting period";
  const narrativeLines: string[] = [];

  if (allItems.length > 0) {
    narrativeLines.push(
      `During ${periodLabel}, ${allItems.length} evidence item${allItems.length !== 1 ? "s" : ""} were recorded across ${sortedThemes.length} theme${sortedThemes.length !== 1 ? "s" : ""}, involving ${childCount} child${childCount !== 1 ? "ren" : ""}.`
    );
  }
  if (sortedThemes[0]) {
    const [topTheme, topCount] = sortedThemes[0];
    narrativeLines.push(
      `The most frequently recorded theme was ${(THEME_LABELS[topTheme] ?? topTheme).toLowerCase()} (${topCount} item${topCount !== 1 ? "s" : ""}).`
    );
  }
  if (emergingConcerns.length > 0) {
    narrativeLines.push(
      `In the last 14 days, ${recentTotal} item${recentTotal !== 1 ? "s" : ""} were recorded, with ${emergingConcerns.map(([t]) => (THEME_LABELS[t] ?? t).toLowerCase()).join(" and ")} presenting as emerging areas of concern.`
    );
  }
  const highSuggestions = suggestions.filter((s) => s.priority === "high");
  if (highSuggestions.length > 0) {
    narrativeLines.push(
      `Management actions identified: ${highSuggestions.map((s) => s.text.split("—")[0].trim()).join("; ")}.`
    );
  }

  const narrativeText = narrativeLines.join(" ");

  const handleCopy = () => {
    void navigator.clipboard.writeText(narrativeText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Analysing evidence patterns...
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <TrendingUp className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-slate-600">No evidence to analyse</p>
          <p className="text-sm text-slate-400 mt-1">
            Submit and review Care Events to start building the pattern analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Emerging concerns banner ─────────────────────────────────────── */}
      {emergingConcerns.length > 0 && (
        <div className="rounded-lg border border-[--cs-risk-soft] bg-[--cs-risk-bg] px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-[--cs-risk] mt-0.5 shrink-0" />
          <div className="text-sm text-[--cs-risk]">
            <span className="font-semibold">Emerging concerns (last 14 days): </span>
            {emergingConcerns.map(([theme, count], idx) => (
              <span key={theme}>
                {idx > 0 && " · "}
                <span className="font-medium">{THEME_LABELS[theme] ?? theme}</span>
                {" "}({count} item{count !== 1 ? "s" : ""})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ── Theme frequency chart ─────────────────────────────────────── */}
        <Card className="border-slate-200 md:col-span-2">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Theme frequency (all evidence)
            </p>
            <div className="space-y-2.5">
              {sortedThemes.map(([theme, count]) => (
                <div key={theme} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-xs text-slate-700 truncate">
                    {THEME_LABELS[theme] ?? theme}
                  </span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        theme === "safeguarding" ? "bg-red-500" :
                        theme === "behaviour" ? "bg-amber-500" :
                        theme === "missing_episode" ? "bg-purple-500" :
                        theme === "restraint" || theme === "physical_intervention" ? "bg-orange-500" :
                        theme === "health" ? "bg-blue-500" :
                        theme === "complaint" ? "bg-yellow-500" :
                        "bg-slate-400"
                      )}
                      style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 w-14 shrink-0">
                    <span className="text-sm font-semibold text-slate-900">{count}</span>
                    {(themeRecent[theme] ?? 0) > 0 && (
                      <span className="text-[10px] text-[--cs-risk] font-medium">
                        +{themeRecent[theme]} new
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Quick stats ───────────────────────────────────────────────── */}
        <div className="space-y-3">
          <Card className="border-slate-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-3.5 w-3.5 text-slate-500" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Children affected</p>
              </div>
              <p className="text-3xl font-bold text-slate-900">{childCount}</p>
              <p className="text-xs text-slate-400 mt-0.5">across {allItems.length} evidence items</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Last 14 days</p>
              </div>
              <p className="text-3xl font-bold text-slate-900">{recentTotal}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {emergingConcerns.length} theme{emergingConcerns.length !== 1 ? "s" : ""} emerging
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Weekly distribution (8-week lookback) ───────────────────────── */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Evidence volume — 8-week trend
          </p>
          <div className="flex items-end gap-2 h-20">
            {weeklyData.map((w) => (
              <div key={w.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-600 font-medium">
                  {w.count > 0 ? w.count : ""}
                </span>
                <div className="w-full bg-slate-100 rounded-sm overflow-hidden" style={{ height: "48px" }}>
                  <div
                    className={cn(
                      "w-full rounded-sm transition-all",
                      w.label === "This wk" ? "bg-indigo-500" : "bg-indigo-300"
                    )}
                    style={{
                      height: `${Math.round((w.count / maxWeekly) * 100)}%`,
                      marginTop: `${100 - Math.round((w.count / maxWeekly) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">{w.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Management action suggestions ────────────────────────────────── */}
      {suggestions.length > 0 && (
        <Card className="border-[--cs-warning-soft] bg-[--cs-warning-bg]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-[--cs-warning]" />
              <p className="text-sm font-semibold text-[--cs-warning]">
                Management actions identified ({suggestions.length})
              </p>
            </div>
            <div className="space-y-2">
              {suggestions.map((s, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-start gap-2 rounded-lg px-3 py-2 text-sm border",
                    s.priority === "high"
                      ? "bg-[--cs-risk-bg] border-[--cs-risk-soft] text-[--cs-risk]"
                      : "bg-[--cs-warning-bg] border-[--cs-warning-soft] text-[--cs-warning]"
                  )}
                >
                  <AlertTriangle className={cn(
                    "h-3.5 w-3.5 mt-0.5 shrink-0",
                    s.priority === "high" ? "text-[--cs-risk]" : "text-[--cs-warning]"
                  )} />
                  {s.text}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Auto-generated narrative starter ─────────────────────────────── */}
      {narrativeText && (
        <Card className="border-indigo-100 bg-indigo-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-indigo-600" />
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                  Narrative starter for Regulation 45 report
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                onClick={handleCopy}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed bg-white rounded border border-indigo-100 p-3">
              {narrativeText}
            </p>
            <p className="text-[10px] text-slate-400 mt-1.5">
              AI-generated from evidence patterns. Manager must review and edit before including in the final report.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Regulation45EvidencePage() {
  const [filter, setFilter] = useState<ManagerDecision | "all">("pending");
  const [reviewingItem, setReviewingItem] = useState<Reg45EvidenceEnriched | null>(null);

  const decisionParam = filter === "all" ? undefined : filter;
  const { data, isLoading } = useReg45Evidence({ decision: decisionParam });

  const items = data?.data ?? [];
  const counts = data?.meta?.counts;

  const FILTERS: Array<{ key: ManagerDecision | "all"; label: string; count?: number }> = [
    { key: "pending", label: "Pending", count: counts?.pending },
    { key: "approved", label: "Approved", count: counts?.approved },
    { key: "rejected", label: "Rejected", count: counts?.rejected },
    { key: "deferred", label: "Deferred", count: counts?.deferred },
    { key: "all", label: "All", count: counts?.total },
  ];

  return (
    <PageShell
      title="Regulation 45 Evidence Bank"
      subtitle="AI-suggested evidence from Care Events — review, approve and draft your report"
      caraContext={{ pageTitle: "Regulation 45 Evidence Bank", sourceType: "reg45" }}
      actions={<CaraStudioQuickActionButton context={{ record_type: "reg45", record_id: "home_oak", home_id: "home_oak" }} />}
    >
      <CaraPanel
        mode="assist"
        pageContext="Regulation 45 Evidence Bank — statutory quality of care reports, evidence bank, suggested updates, approved evidence, RI briefings, inspection readiness, Children's Homes Regulations 2015"
        recordType="regulation_45"
        userRole="registered_manager"
        className="mb-6"
      />
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Pending review",
            value: counts?.pending ?? 0,
            icon: <Clock className="h-4 w-4 text-[--cs-warning]" />,
            colour: "bg-[--cs-warning-bg] border-[--cs-warning-soft]",
          },
          {
            label: "Approved",
            value: counts?.approved ?? 0,
            icon: <CheckCircle2 className="h-4 w-4 text-[--cs-success]" />,
            colour: "bg-[--cs-success-bg] border-[--cs-success-soft]",
          },
          {
            label: "Rejected",
            value: counts?.rejected ?? 0,
            icon: <XCircle className="h-4 w-4 text-[--cs-risk]" />,
            colour: "bg-[--cs-risk-bg] border-[--cs-risk-soft]",
          },
          {
            label: "Total evidence",
            value: counts?.total ?? 0,
            icon: <FileText className="h-4 w-4 text-slate-500" />,
            colour: "bg-slate-50 border-slate-100",
          },
        ].map((stat) => (
          <Card key={stat.label} className={cn("border", stat.colour)}>
            <CardContent className="p-3 flex items-center gap-2">
              {stat.icon}
              <div>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Safety note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5 text-sm text-blue-800">
        <span className="font-semibold">AI safety notice:</span> All evidence below was suggested by Cara
        based on submitted Care Events. It must not enter the Regulation 45 report without manager approval.
        Review each item and approve, edit, or reject.
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="queue">
        <TabsList className="mb-4">
          <TabsTrigger value="queue" className="gap-1.5">
            <LayoutList className="w-3.5 h-3.5" />
            Evidence Queue
            {(counts?.pending ?? 0) > 0 && (
              <span className="ml-1 bg-[--cs-warning-bg] text-[--cs-warning] text-xs rounded-full px-1.5 py-0.5">
                {counts?.pending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="builder" className="gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Report Builder
            {(counts?.approved ?? 0) > 0 && (
              <span className="ml-1 bg-[--cs-success-bg] text-[--cs-success] text-xs rounded-full px-1.5 py-0.5">
                {counts?.approved}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="patterns" className="gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Patterns &amp; Themes
          </TabsTrigger>
        </TabsList>

        {/* Evidence Queue tab */}
        <TabsContent value="queue" className="mt-0">
          {/* Filter buttons */}
          <div className="flex flex-wrap gap-1 mb-4 border-b border-slate-100 pb-3">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                  filter === f.key
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {f.label}
                {f.count !== undefined && f.count > 0 && (
                  <span
                    className={cn(
                      "text-xs rounded-full px-1.5 py-0.5",
                      filter === f.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading evidence bank...
            </div>
          ) : items.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <ShieldCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="font-medium text-slate-600">No evidence items</p>
                <p className="text-sm text-slate-400 mt-1">
                  {filter === "pending"
                    ? "No pending evidence — submit Care Events flagged for Regulation 45 to populate this bank."
                    : "No items for the selected filter."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <EvidenceItemCard key={item.id} item={item} onDecide={setReviewingItem} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Report Builder tab */}
        <TabsContent value="builder" className="mt-0">
          <ReportBuilderTab onDecide={setReviewingItem} />
        </TabsContent>

        {/* Patterns & Themes tab */}
        <TabsContent value="patterns" className="mt-0">
          <PatternsTab />
        </TabsContent>
      </Tabs>

      {reviewingItem && (
        <ReviewDialog item={reviewingItem} onClose={() => setReviewingItem(null)} />
      )}
      <CareEventsPanel
        title="Care Events — Regulation 45 Evidence"
        category={["safeguarding", "behaviour", "health", "education", "complaint"]}
        days={90}
        defaultCollapsed
      />
    </PageShell>
  );
}
