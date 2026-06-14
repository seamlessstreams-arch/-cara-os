"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — REPORT REVIEW PAGE
//
// The core report review interface. Two-column layout with the full report
// on the left (sections, evidence status, confidence bar, rewrite controls)
// and a sidebar on the right with status actions, challenge mode results,
// suggested actions, and the evidence panel.
//
// All workflow actions call the appropriate API endpoints and update local
// state to reflect changes immediately.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  ChildReport,
  ChildReportSection,
  ChildReportEvidence,
  ChildReportAction,
  ChallengeItem,
  ReportAudience,
} from "@/types/cara-reports";
import {
  REPORT_TYPE_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_AUDIENCE_LABELS,
  REPORT_AUDIENCES,
  EVIDENCE_STATUS_LABELS,
} from "@/types/cara-reports";
import {
  Sparkles,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Lock,
  Send,
  Scale,
  FileText,
  Eye,
  EyeOff,
  RotateCw,
  AlertTriangle,
  Info,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Shield,
  Zap,
  ClipboardCheck,
} from "lucide-react";

// ── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_USER_ID = "demo-user";

// ── Child name lookup (demo) ────────────────────────────────────────────────

const CHILD_NAMES: Record<string, string> = {
  "demo-child-1": "Jayden Mitchell",
  "demo-child-2": "Amara Osei",
  "demo-child-3": "Reuben Walsh",
  "demo-child": "Jayden Mitchell",
};

// ── Badge helpers ───────────────────────────────────────────────────────────

function statusBadgeVariant(status: string) {
  switch (status) {
    case "draft":
      return "warning" as const;
    case "pending_review":
      return "info" as const;
    case "approved":
      return "success" as const;
    case "rejected":
      return "destructive" as const;
    case "locked":
      return "purple" as const;
    case "archived":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function evidenceStatusColour(status: string) {
  switch (status) {
    case "evidence_supported":
      return "bg-emerald-100 text-emerald-800";
    case "partial_evidence":
      return "bg-blue-100 text-blue-800";
    case "manager_input_required":
      return "bg-amber-100 text-amber-800";
    case "not_enough_evidence":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-[var(--cs-text-secondary)]";
  }
}

function confidenceBarColour(score: number) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function priorityBadgeVariant(priority: string) {
  switch (priority) {
    case "urgent":
      return "destructive" as const;
    case "high":
      return "warning" as const;
    case "medium":
      return "info" as const;
    case "low":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export default function CaraReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = use(params);
  const router = useRouter();

  const [report, setReport] = useState<ChildReport | null>(null);
  const [sections, setSections] = useState<ChildReportSection[]>([]);
  const [evidence, setEvidence] = useState<ChildReportEvidence[]>([]);
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [actions, setActions] = useState<ChildReportAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Section-level UI state
  const [expandedEvidence, setExpandedEvidence] = useState<Set<string>>(
    new Set(),
  );
  const [rewritingSection, setRewritingSection] = useState<string | null>(null);

  // Sidebar collapsible state
  const [challengeExpanded, setChallengeExpanded] = useState(true);
  const [actionsExpanded, setActionsExpanded] = useState(true);
  const [evidencePanelExpanded, setEvidencePanelExpanded] = useState(false);

  // Status action state
  const [statusLoading, setStatusLoading] = useState(false);

  // ── Fetch report data ─────────────────────────────────────────────────

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/cara/reports/${reportId}`);
        const json = await res.json();
        if (json.ok) {
          setReport(json.data.report);
          setSections(json.data.sections);
          setEvidence(json.data.evidence);
        } else {
          setError(json.error ?? "Failed to load report.");
        }
      } catch (err) {
        console.error("[cara/reports/[id]] Fetch error:", err);
        setError("Failed to load report.");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [reportId]);

  useEffect(() => {
    async function fetchChallenges() {
      try {
        const res = await fetch(`/api/cara/reports/${reportId}/challenge`);
        const json = await res.json();
        if (json.ok) setChallenges(json.data);
      } catch (err) {
        console.error("[cara/reports/[id]] Challenge fetch error:", err);
      }
    }
    fetchChallenges();
  }, [reportId]);

  useEffect(() => {
    async function fetchActions() {
      try {
        const res = await fetch(`/api/cara/reports/${reportId}/actions`);
        const json = await res.json();
        if (json.ok) setActions(json.data);
      } catch (err) {
        console.error("[cara/reports/[id]] Actions fetch error:", err);
      }
    }
    fetchActions();
  }, [reportId]);

  // ── Status workflow handlers ──────────────────────────────────────────

  async function handleSubmitForReview() {
    if (!report) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/cara/reports/${reportId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: "approve",
          approvedBy: DEFAULT_USER_ID,
          reviewNote: "Submitted for review",
        }),
      });
      const json = await res.json();
      if (json.ok && json.data) {
        setReport({ ...report, status: "pending_review" });
      }
    } catch (err) {
      console.error("[cara/reports] Submit for review error:", err);
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleApprove() {
    if (!report) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/cara/reports/${reportId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: "approve",
          approvedBy: DEFAULT_USER_ID,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setReport({ ...report, status: "approved" });
      }
    } catch (err) {
      console.error("[cara/reports] Approve error:", err);
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleReject() {
    if (!report) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/cara/reports/${reportId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: "reject",
          rejectedBy: DEFAULT_USER_ID,
          reason: "Requires further editing",
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setReport({ ...report, status: "rejected" });
      }
    } catch (err) {
      console.error("[cara/reports] Reject error:", err);
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleLock() {
    if (!report) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/cara/reports/${reportId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockedBy: DEFAULT_USER_ID }),
      });
      const json = await res.json();
      if (json.ok) {
        setReport({ ...report, status: "locked" });
      }
    } catch (err) {
      console.error("[cara/reports] Lock error:", err);
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleAddToReg45() {
    if (!report) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/cara/reports/${reportId}/reg45`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createdBy: DEFAULT_USER_ID }),
      });
      const json = await res.json();
      if (json.ok) {
        router.push("/cara/reg45");
      }
    } catch (err) {
      console.error("[cara/reports] Reg45 link error:", err);
    } finally {
      setStatusLoading(false);
    }
  }

  // ── Rewrite handler ───────────────────────────────────────────────────

  async function handleRewrite(sectionId: string, audience: ReportAudience) {
    setRewritingSection(sectionId);
    try {
      const res = await fetch(`/api/cara/reports/${reportId}/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, audience }),
      });
      const json = await res.json();
      if (json.ok && json.data?.content) {
        setSections((prev) =>
          prev.map((s) =>
            s.id === sectionId ? { ...s, content: json.data.content } : s,
          ),
        );
      }
    } catch (err) {
      console.error("[cara/reports] Rewrite error:", err);
    } finally {
      setRewritingSection(null);
    }
  }

  // ── Action accept/reject handler ──────────────────────────────────────

  async function handleActionDecision(
    actionId: string,
    decision: "accept" | "reject",
  ) {
    try {
      const res = await fetch(`/api/cara/reports/${reportId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, decision }),
      });
      const json = await res.json();
      if (json.ok) {
        setActions((prev) =>
          prev.map((a) =>
            a.id === actionId
              ? {
                  ...a,
                  status: decision === "accept" ? "accepted" : "dismissed",
                }
              : a,
          ),
        );
      }
    } catch (err) {
      console.error("[cara/reports] Action decision error:", err);
    }
  }

  // ── Evidence toggle ───────────────────────────────────────────────────

  function toggleEvidence(sectionId: string) {
    setExpandedEvidence((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  // ── Loading / error states ────────────────────────────────────────────

  if (loading) {
    return (
      <PageShell title="Loading Report..." subtitle="">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-[var(--cs-cara-gold)] animate-spin" />
        </div>
      </PageShell>
    );
  }

  if (error || !report) {
    return (
      <PageShell title="Report Not Found" subtitle="">
        <Link
          href="/cara/reports"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)] hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Reports
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-[var(--cs-text-muted)] font-medium">
              {error ?? "This report could not be found."}
            </p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const overallConfidence = report.overall_confidence_score ?? 0;
  const childName = CHILD_NAMES[report.child_id] ?? report.child_id;

  return (
    <PageShell
      title={report.title}
      subtitle="Report review and approval"
    >
      {/* Back link */}
      <Link
        href="/cara/reports"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)] hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Reports
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ═══ LEFT COLUMN (2/3) ════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── Report header card ───────────────────────────────────────── */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="cara" className="text-xs">
                    {REPORT_TYPE_LABELS[report.report_type]}
                  </Badge>
                  <Badge
                    variant={statusBadgeVariant(report.status)}
                    className="text-xs"
                  >
                    {REPORT_STATUS_LABELS[report.status]}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {REPORT_AUDIENCE_LABELS[report.audience]}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-[var(--cs-text-muted)]">Child:</span>{" "}
                  <span className="font-medium">{childName}</span>
                </div>
                <div>
                  <span className="text-[var(--cs-text-muted)]">Date range:</span>{" "}
                  <span className="font-medium flex items-center gap-1 inline-flex">
                    <Calendar className="h-3 w-3" />
                    {report.date_range_start} — {report.date_range_end}
                  </span>
                </div>
              </div>

              {/* Confidence indicator */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[var(--cs-text-muted)] font-medium">
                    Overall Confidence
                  </span>
                  <span
                    className={cn(
                      "font-bold tabular-nums",
                      overallConfidence >= 75
                        ? "text-emerald-700"
                        : overallConfidence >= 50
                          ? "text-amber-700"
                          : "text-red-700",
                    )}
                  >
                    {overallConfidence}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      confidenceBarColour(overallConfidence),
                    )}
                    style={{ width: `${overallConfidence}%` }}
                  />
                </div>
              </div>

              {report.overall_summary && (
                <div className="p-3 bg-slate-50 rounded-lg text-sm">
                  <p className="font-medium text-[var(--cs-text-secondary)] mb-1">
                    Summary
                  </p>
                  <p className="text-[var(--cs-text-secondary)]">
                    {report.overall_summary}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Report sections ──────────────────────────────────────────── */}
          {sections.map((section) => {
            const sectionEvidence = evidence.filter(
              (e) => e.section_id === section.id,
            );
            const isEvidenceExpanded = expandedEvidence.has(section.id);
            const needsManagerReview =
              section.evidence_status === "manager_input_required";

            return (
              <Card key={section.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-sm">{section.title}</CardTitle>
                    <Badge
                      className={cn(
                        "text-[10px] shrink-0",
                        evidenceStatusColour(section.evidence_status),
                      )}
                    >
                      {EVIDENCE_STATUS_LABELS[section.evidence_status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Section content */}
                  <div className="prose prose-sm max-w-none text-[var(--cs-text-secondary)] whitespace-pre-wrap">
                    {section.content}
                  </div>

                  {/* Manager review notice */}
                  {needsManagerReview && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-amber-800">
                          Manager Review Required
                        </p>
                        <p className="text-[10px] text-amber-700 mt-0.5">
                          This section requires manager input before the report
                          can be approved.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Manager note */}
                  {section.manager_note && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs font-medium text-blue-800 mb-0.5">
                        Manager Note
                      </p>
                      <p className="text-xs text-blue-700">
                        {section.manager_note}
                      </p>
                    </div>
                  )}

                  {/* Section confidence */}
                  {section.confidence_score !== null && (
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            confidenceBarColour(section.confidence_score),
                          )}
                          style={{
                            width: `${section.confidence_score}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--cs-text-muted)] tabular-nums">
                        {section.confidence_score}% confidence
                      </span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <RewriteDropdown
                      sectionId={section.id}
                      isRewriting={rewritingSection === section.id}
                      onRewrite={(audience) =>
                        handleRewrite(section.id, audience)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleEvidence(section.id)}
                      className="text-xs gap-1.5"
                    >
                      {isEvidenceExpanded ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      {isEvidenceExpanded ? "Hide Evidence" : "Show Evidence"}
                      {sectionEvidence.length > 0 && (
                        <span className="text-[10px] text-[var(--cs-text-muted)]">
                          ({sectionEvidence.length})
                        </span>
                      )}
                    </Button>
                  </div>

                  {/* Evidence panel */}
                  {isEvidenceExpanded && (
                    <div className="rounded-lg border border-[var(--cs-border)] bg-slate-50 p-3 space-y-2">
                      {sectionEvidence.length === 0 ? (
                        <p className="text-xs text-[var(--cs-text-muted)]">
                          No evidence items linked to this section.
                        </p>
                      ) : (
                        sectionEvidence.map((ev) => (
                          <div
                            key={ev.id}
                            className="rounded-lg border border-[var(--cs-border)] bg-white p-3"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <SourceIcon sourceTable={ev.source_table} />
                              <span className="text-xs font-medium text-[var(--cs-navy)]">
                                {formatSourceTable(ev.source_table)}
                              </span>
                              <span className="text-[10px] text-[var(--cs-text-muted)]">
                                {ev.source_date}
                              </span>
                              {ev.is_child_voice && (
                                <Badge variant="cara" className="text-[10px]">
                                  Child voice
                                </Badge>
                              )}
                            </div>
                            {ev.excerpt && (
                              <p className="text-xs text-[var(--cs-text-secondary)] mt-1">
                                {ev.excerpt}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ═══ RIGHT COLUMN (1/3) ═══════════════════════════════════════════ */}
        <div className="space-y-6">
          {/* ── Status & Actions panel ────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-[var(--cs-text-muted)]" />
                Status & Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-[var(--cs-text-muted)]">
                  Current status:
                </span>
                <Badge
                  variant={statusBadgeVariant(report.status)}
                  className="text-xs"
                >
                  {REPORT_STATUS_LABELS[report.status]}
                </Badge>
              </div>

              {report.status === "draft" && (
                <Button
                  size="sm"
                  onClick={handleSubmitForReview}
                  disabled={statusLoading}
                  className="w-full gap-1.5"
                >
                  {statusLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Submit for Review
                </Button>
              )}

              {report.status === "pending_review" && (
                <div className="space-y-2">
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={statusLoading}
                    className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {statusLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleReject}
                    disabled={statusLoading}
                    className="w-full gap-1.5"
                  >
                    {statusLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    Reject
                  </Button>
                </div>
              )}

              {report.status === "approved" && (
                <Button
                  size="sm"
                  onClick={handleLock}
                  disabled={statusLoading}
                  className="w-full gap-1.5 bg-violet-600 hover:bg-violet-700"
                >
                  {statusLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  Lock Report
                </Button>
              )}

              {report.status === "locked" && (
                <div className="space-y-2">
                  <Button
                    size="sm"
                    onClick={handleAddToReg45}
                    disabled={statusLoading}
                    className="w-full gap-1.5"
                  >
                    {statusLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Scale className="h-3.5 w-3.5" />
                    )}
                    Add to Reg 45
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={statusLoading}
                    className="w-full gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    File Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Challenge Mode panel ─────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <button
                onClick={() => setChallengeExpanded(!challengeExpanded)}
                className="flex items-center justify-between w-full"
              >
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Challenge Mode
                  {challenges.length > 0 && (
                    <span className="text-[10px] font-normal text-[var(--cs-text-muted)]">
                      ({challenges.length})
                    </span>
                  )}
                </CardTitle>
                {challengeExpanded ? (
                  <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" />
                )}
              </button>
            </CardHeader>
            {challengeExpanded && (
              <CardContent className="space-y-2">
                {challenges.length === 0 ? (
                  <p className="text-xs text-[var(--cs-text-muted)]">
                    No challenges raised for this report.
                  </p>
                ) : (
                  challenges.map((ch, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-[var(--cs-border)] p-3"
                    >
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 mt-0.5">
                          {ch.severity === "critical" && (
                            <span title="Critical">&#128308;</span>
                          )}
                          {ch.severity === "warning" && (
                            <span title="Warning">&#128993;</span>
                          )}
                          {ch.severity === "info" && (
                            <span title="Info">&#8505;&#65039;</span>
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[var(--cs-navy)]">
                            {ch.message}
                          </p>
                          {ch.suggestion && (
                            <p className="text-[10px] text-[var(--cs-text-muted)] mt-1">
                              {ch.suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            )}
          </Card>

          {/* ── Suggested Actions panel ──────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <button
                onClick={() => setActionsExpanded(!actionsExpanded)}
                className="flex items-center justify-between w-full"
              >
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ClipboardCheck className="h-4 w-4 text-[var(--cs-text-muted)]" />
                  Suggested Actions
                  {actions.length > 0 && (
                    <span className="text-[10px] font-normal text-[var(--cs-text-muted)]">
                      ({actions.length})
                    </span>
                  )}
                </CardTitle>
                {actionsExpanded ? (
                  <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" />
                )}
              </button>
            </CardHeader>
            {actionsExpanded && (
              <CardContent className="space-y-2">
                {actions.length === 0 ? (
                  <p className="text-xs text-[var(--cs-text-muted)]">
                    No suggested actions for this report.
                  </p>
                ) : (
                  actions.map((action) => (
                    <div
                      key={action.id}
                      className="rounded-lg border border-[var(--cs-border)] p-3"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-medium text-[var(--cs-navy)]">
                          {action.action_title}
                        </p>
                        <Badge
                          variant={priorityBadgeVariant(action.priority)}
                          className="text-[10px] shrink-0"
                        >
                          {action.priority}
                        </Badge>
                      </div>
                      {action.action_description && (
                        <p className="text-[10px] text-[var(--cs-text-muted)] mb-2">
                          {action.action_description}
                        </p>
                      )}
                      {action.status === "suggested" && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleActionDecision(action.id, "accept")
                            }
                            className="text-[10px] h-6 px-2 gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleActionDecision(action.id, "reject")
                            }
                            className="text-[10px] h-6 px-2 gap-1"
                          >
                            <XCircle className="h-3 w-3 text-red-500" />
                            Dismiss
                          </Button>
                        </div>
                      )}
                      {action.status === "accepted" && (
                        <Badge variant="success" className="text-[10px]">
                          Accepted
                        </Badge>
                      )}
                      {action.status === "dismissed" && (
                        <Badge variant="secondary" className="text-[10px]">
                          Dismissed
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            )}
          </Card>

          {/* ── Evidence Panel (collapsible) ─────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <button
                onClick={() =>
                  setEvidencePanelExpanded(!evidencePanelExpanded)
                }
                className="flex items-center justify-between w-full"
              >
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-[var(--cs-text-muted)]" />
                  All Evidence
                  <span className="text-[10px] font-normal text-[var(--cs-text-muted)]">
                    ({evidence.length})
                  </span>
                </CardTitle>
                {evidencePanelExpanded ? (
                  <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" />
                )}
              </button>
            </CardHeader>
            {evidencePanelExpanded && (
              <CardContent className="space-y-2">
                {evidence.length === 0 ? (
                  <p className="text-xs text-[var(--cs-text-muted)]">
                    No evidence items linked to this report.
                  </p>
                ) : (
                  evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-lg border border-[var(--cs-border)] bg-slate-50 p-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <SourceIcon sourceTable={ev.source_table} />
                        <span className="text-xs font-medium text-[var(--cs-navy)]">
                          {formatSourceTable(ev.source_table)}
                        </span>
                        <span className="text-[10px] text-[var(--cs-text-muted)]">
                          {ev.source_date}
                        </span>
                        {ev.is_child_voice && (
                          <Badge variant="cara" className="text-[10px]">
                            Child voice
                          </Badge>
                        )}
                      </div>
                      {ev.excerpt && (
                        <p className="text-xs text-[var(--cs-text-secondary)] mt-1">
                          {ev.excerpt}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Rewrite dropdown ────────────────────────────────────────────────────────

function RewriteDropdown({
  sectionId,
  isRewriting,
  onRewrite,
}: {
  sectionId: string;
  isRewriting: boolean;
  onRewrite: (audience: ReportAudience) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        disabled={isRewriting}
        className="text-xs gap-1.5"
      >
        {isRewriting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RotateCw className="h-3.5 w-3.5" />
        )}
        {isRewriting ? "Rewriting..." : "Rewrite"}
        <ChevronDown className="h-3 w-3" />
      </Button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-10 w-56 rounded-lg border border-[var(--cs-border)] bg-white shadow-lg py-1">
          {REPORT_AUDIENCES.map((a) => (
            <button
              key={a}
              onClick={() => {
                setOpen(false);
                onRewrite(a);
              }}
              className="w-full text-left px-3 py-2 text-xs text-[var(--cs-text-secondary)] hover:bg-slate-50 transition-colors"
            >
              Rewrite for {REPORT_AUDIENCE_LABELS[a]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Source table helpers ─────────────────────────────────────────────────────

function formatSourceTable(table: string): string {
  return table
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function SourceIcon({ sourceTable }: { sourceTable: string }) {
  if (sourceTable.includes("incident"))
    return <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />;
  if (sourceTable.includes("keywork"))
    return <Sparkles className="h-3 w-3 text-violet-500 shrink-0" />;
  if (sourceTable.includes("daily_log"))
    return <FileText className="h-3 w-3 text-blue-500 shrink-0" />;
  return <FileText className="h-3 w-3 text-[var(--cs-text-muted)] shrink-0" />;
}
