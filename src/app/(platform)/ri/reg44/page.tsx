"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — REG 44 INDEPENDENT VISIT TRACKER
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn, formatDate } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { useReg44Visits, useUpdateReg44Visit } from "@/hooks/use-ri-learning";
import type {
  Reg44Visit,
  Reg44VisitStatus,
  Reg44FindingType,
  Reg44FindingSeverity,
} from "@/types/extended";
import {
  Eye, CheckCircle2, Clock, AlertTriangle, Calendar, ChevronDown, ChevronUp,
  Sparkles, FileText, MessageSquare, Flag, Gavel, Plus, X,
  Search, ArrowUpDown, BarChart3, Star,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/hooks/use-api";

const REG44_EXPORT_COLS: ExportColumn<Reg44Visit>[] = [
  { header: "Visit #", accessor: (v) => String(v.visit_number) },
  { header: "Visit Date", accessor: (v) => v.visit_date ?? v.scheduled_date },
  { header: "Visitor", accessor: (v) => v.visitor_name },
  { header: "Status", accessor: (v) => v.status.replace(/_/g, " ") },
  { header: "Overall Finding", accessor: (v) => v.overall_finding?.replace(/_/g, " ") ?? "" },
  { header: "Findings Count", accessor: (v) => String(v.findings?.length ?? 0) },
  { header: "Manager Response", accessor: (v) => v.manager_response ?? "" },
  { header: "RI Reviewed", accessor: (v) => v.ri_review_date ?? "" },
  { header: "Created", accessor: (v) => v.created_at },
];

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<Reg44VisitStatus, string> = {
  scheduled:                   "Scheduled",
  completed:                   "Completed",
  report_received:             "Report Received",
  manager_response_submitted:  "Response Submitted",
  ri_reviewed:                 "RI Reviewed",
};

const STATUS_COLOUR: Record<Reg44VisitStatus, string> = {
  scheduled:                   "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
  completed:                   "bg-blue-50 text-blue-700 border-blue-200",
  report_received:             "bg-amber-50 text-amber-700 border-amber-200",
  manager_response_submitted:  "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)] border-[var(--cs-aria-gold-soft)]",
  ri_reviewed:                 "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const FINDING_TYPE_COLOUR: Record<Reg44FindingType, string> = {
  strength:       "bg-emerald-50 text-emerald-700 border-emerald-200",
  concern:        "bg-red-50 text-red-700 border-red-200",
  recommendation: "bg-amber-50 text-amber-700 border-amber-200",
  requirement:    "bg-rose-100 text-rose-800 border-rose-300",
};

const FINDING_TYPE_LABELS: Record<Reg44FindingType, string> = {
  strength:       "Strength",
  concern:        "Concern",
  recommendation: "Recommendation",
  requirement:    "Requirement",
};

const SEVERITY_COLOUR: Record<Reg44FindingSeverity, string> = {
  minor:       "text-amber-600",
  moderate:    "text-orange-600",
  significant: "text-red-600",
  critical:    "text-red-700 font-bold",
};

const OVERALL_COLOUR: Record<string, string> = {
  satisfactory:     "text-emerald-700 bg-emerald-50 border-emerald-200",
  concerns_identified: "text-amber-700 bg-amber-50 border-amber-200",
  serious_concerns:  "text-red-700 bg-red-50 border-red-200",
};

const OVERALL_LABELS: Record<string, string> = {
  satisfactory:     "Satisfactory",
  concerns_identified: "Concerns Identified",
  serious_concerns:  "Serious Concerns",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function countOpenActions(visit: Reg44Visit) {
  return visit.findings.filter((f) => f.action_required && !f.action_completed).length;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FindingRow({ finding }: { finding: Reg44Visit["findings"][0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn(
      "rounded-xl border p-3 transition-all",
      finding.type === "strength" ? "bg-emerald-50/60 border-emerald-100" :
      finding.type === "concern"  ? "bg-red-50/60 border-red-100" :
      finding.type === "requirement" ? "bg-rose-50/60 border-rose-200" :
      "bg-amber-50/60 border-amber-100",
    )}>
      <div className="flex items-start gap-2">
        <Badge
          variant="outline"
          className={cn("text-[10px] px-1.5 py-0 shrink-0 mt-0.5", FINDING_TYPE_COLOUR[finding.type])}
        >
          {FINDING_TYPE_LABELS[finding.type]}
        </Badge>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[var(--cs-navy)]">{finding.area}</span>
            {finding.severity && (
              <span className={cn("text-[10px] font-medium capitalize", SEVERITY_COLOUR[finding.severity])}>
                {finding.severity}
              </span>
            )}
            {finding.action_required && (
              <span className={cn(
                "text-[10px] font-medium",
                finding.action_completed ? "text-emerald-600" : "text-red-600",
              )}>
                {finding.action_completed ? "✓ Action complete" : "⚠ Action pending"}
              </span>
            )}
          </div>
          <p className={cn(
            "text-xs text-[var(--cs-text-secondary)] mt-0.5",
            !open && "line-clamp-2",
          )}>{finding.description}</p>

          {finding.action_required && (
            <button
              onClick={() => setOpen(!open)}
              className="text-[10px] text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] mt-1 flex items-center gap-1"
            >
              {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {open ? "Hide action" : "Show action"}
            </button>
          )}

          {open && finding.action_required && (
            <div className="mt-2 rounded-lg border border-[var(--cs-border)] bg-white p-2 space-y-1.5">
              <div>
                <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Required Action</p>
                <p className="text-xs text-[var(--cs-text-secondary)]">{finding.action_required}</p>
              </div>
              {finding.action_completed && finding.action_completed_at && (
                <div>
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Completed</p>
                  <p className="text-xs text-[var(--cs-text-secondary)]">{formatDate(finding.action_completed_at)}</p>
                  {finding.action_evidence && (
                    <p className="text-xs text-[var(--cs-text-muted)] mt-0.5">{finding.action_evidence}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VisitCard({
  visit,
  onRespondClick,
}: {
  visit: Reg44Visit;
  onRespondClick: (visit: Reg44Visit) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const openActions = countOpenActions(visit);
  const strengths = visit.findings.filter((f) => f.type === "strength");
  const concerns  = visit.findings.filter((f) => f.type === "concern" || f.type === "requirement");
  const recommendations = visit.findings.filter((f) => f.type === "recommendation");

  const isScheduled = visit.status === "scheduled";

  return (
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden transition-shadow",
      isScheduled ? "border-dashed border-slate-300" : "border-[var(--cs-border)] hover:shadow-sm",
    )}>
      {/* Header */}
      <div className="flex items-start gap-4 p-4">
        {/* Visit number badge */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm",
          isScheduled ? "bg-slate-100 text-[var(--cs-text-muted)]" : "bg-indigo-100 text-indigo-700",
        )}>
          {visit.visit_number}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-[var(--cs-navy)]">Visit {visit.visit_number}</span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", STATUS_COLOUR[visit.status])}>
              {STATUS_LABELS[visit.status]}
            </Badge>
            {visit.overall_finding && (
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", OVERALL_COLOUR[visit.overall_finding])}>
                {OVERALL_LABELS[visit.overall_finding]}
              </Badge>
            )}
            {openActions > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-200">
                {openActions} open {openActions === 1 ? "action" : "actions"}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap text-xs text-[var(--cs-text-muted)]">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {isScheduled
                ? `Scheduled: ${formatDate(visit.scheduled_date)}`
                : `Visited: ${formatDate(visit.visit_date ?? visit.scheduled_date)}`
              }
            </span>
            <span>·</span>
            <span>{visit.visitor_name}{visit.visitor_organisation ? ` · ${visit.visitor_organisation}` : ""}</span>
          </div>

          {/* Quick finding counts */}
          {!isScheduled && visit.findings.length > 0 && (
            <div className="flex items-center gap-3 mt-2 text-[10px]">
              {strengths.length > 0 && (
                <span className="text-emerald-600 font-medium">{strengths.length} strength{strengths.length > 1 ? "s" : ""}</span>
              )}
              {concerns.length > 0 && (
                <span className="text-red-600 font-medium">{concerns.length} concern{concerns.length > 1 ? "s" : ""}</span>
              )}
              {recommendations.length > 0 && (
                <span className="text-amber-600 font-medium">{recommendations.length} recommendation{recommendations.length > 1 ? "s" : ""}</span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Manager respond button */}
          {(visit.status === "report_received") && (
            <Button
              size="sm"
              onClick={() => onRespondClick(visit)}
              className="bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white gap-1.5 h-8 text-xs"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Respond
            </Button>
          )}
          {/* Expand/collapse for completed visits */}
          {!isScheduled && visit.findings.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] transition-colors"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Scheduled visit — countdown */}
      {isScheduled && (
        <div className="px-4 pb-4">
          {(() => {
            const days = daysUntil(visit.scheduled_date);
            const overdue = days < 0;
            return (
              <div className={cn(
                "rounded-xl border p-3 flex items-center gap-3",
                overdue ? "bg-red-50 border-red-200" : days <= 7 ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-[var(--cs-border)]",
              )}>
                <Calendar className={cn("h-4 w-4 shrink-0", overdue ? "text-red-500" : days <= 7 ? "text-amber-500" : "text-[var(--cs-text-muted)]")} />
                <div>
                  <p className={cn("text-xs font-semibold", overdue ? "text-red-700" : days <= 7 ? "text-amber-700" : "text-[var(--cs-text-secondary)]")}>
                    {overdue
                      ? `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue`
                      : days === 0
                      ? "Visit due today"
                      : `${days} day${days !== 1 ? "s" : ""} until next visit`}
                  </p>
                  <p className="text-[10px] text-[var(--cs-text-muted)]">Reg 44 requires an independent visit at least every 4 weeks</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Expanded: findings + response */}
      {expanded && !isScheduled && (
        <div className="border-t border-[var(--cs-border-subtle)] px-4 pb-4 pt-3 space-y-4">
          {/* Findings */}
          {visit.findings.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-2">Findings</p>
              <div className="space-y-2">
                {visit.findings.map((f) => (
                  <FindingRow key={f.id} finding={f} />
                ))}
              </div>
            </div>
          )}

          {/* Manager response */}
          {visit.manager_response && (
            <div className="rounded-xl border border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)]/40 p-3">
              <p className="text-[10px] font-semibold text-[var(--cs-aria-gold)] uppercase tracking-widest mb-1.5">
                Manager Response · {visit.manager_response_date ? formatDate(visit.manager_response_date) : ""}
              </p>
              <p className="text-xs text-[var(--cs-text-secondary)]">{visit.manager_response}</p>
            </div>
          )}

          {/* RI comments */}
          {visit.ri_comments && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
              <p className="text-[10px] font-semibold text-indigo-700 uppercase tracking-widest mb-1.5">
                RI Review · {visit.ri_review_date ? formatDate(visit.ri_review_date) : ""}
              </p>
              <p className="text-xs text-[var(--cs-text-secondary)]">{visit.ri_comments}</p>
            </div>
          )}

          {/* ARIA summary */}
          {visit.aria_summary && (
            <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                <p className="text-[10px] font-semibold text-teal-700 uppercase tracking-widest">ARIA Analysis</p>
              </div>
              <p className="text-xs text-[var(--cs-text-secondary)]">{visit.aria_summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type StatusFilter = "all" | Reg44VisitStatus;
type OverallFilter = "all" | "satisfactory" | "concerns_identified" | "serious_concerns";
type SortKey = "newest" | "oldest";

export default function Reg44Page() {
  const { currentUser } = useAuthContext();
  const visitsQuery = useReg44Visits({ homeId: "home_oak" });
  const updateVisit = useUpdateReg44Visit();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [overallFilter, setOverallFilter] = useState<OverallFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  const visits = visitsQuery.data?.data ?? [];
  const meta   = visitsQuery.data?.meta;

  const nextScheduled = visits.find((v) => v.status === "scheduled");
  const allCompletedVisits = useMemo(
    () => visits.filter((v) => v.status !== "scheduled"),
    [visits],
  );

  // Stats
  const stats = useMemo(() => {
    const totalOpenActions = visits.reduce((n, v) => n + countOpenActions(v), 0);
    const totalConcerns = allCompletedVisits.reduce(
      (n, v) => n + v.findings.filter((f) => f.type === "concern" || f.type === "requirement").length, 0,
    );
    const resolvedConcerns = allCompletedVisits.reduce(
      (n, v) => n + v.findings.filter(
        (f) => (f.type === "concern" || f.type === "requirement") && f.action_completed,
      ).length, 0,
    );
    const totalStrengths = allCompletedVisits.reduce(
      (n, v) => n + v.findings.filter((f) => f.type === "strength").length, 0,
    );
    const totalFindings = allCompletedVisits.reduce(
      (n, v) => n + v.findings.length, 0,
    );
    const avgFindings = allCompletedVisits.length > 0
      ? Math.round((totalFindings / allCompletedVisits.length) * 10) / 10 : 0;

    return {
      totalOpenActions, totalConcerns, resolvedConcerns,
      totalStrengths, totalFindings, avgFindings,
    };
  }, [visits, allCompletedVisits]);

  // Filtered visits
  const filteredVisits = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = [...allCompletedVisits];

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter((v) => v.status === statusFilter);
    }

    // Overall finding filter
    if (overallFilter !== "all") {
      list = list.filter((v) => v.overall_finding === overallFilter);
    }

    // Search
    if (q) {
      list = list.filter((v) => {
        const visitor = `${v.visitor_name} ${v.visitor_organisation ?? ""}`;
        const findings = v.findings.map((f) => `${f.area} ${f.description} ${f.action_required ?? ""}`).join(" ");
        const response = v.manager_response ?? "";
        const date = v.visit_date ?? v.scheduled_date;
        const haystack = `${visitor} ${findings} ${response} ${date} ${v.ri_comments ?? ""}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    // Sort
    if (sortKey === "oldest") {
      list.sort((a, b) => (a.visit_date ?? a.scheduled_date).localeCompare(b.visit_date ?? b.scheduled_date));
    } else {
      list.sort((a, b) => (b.visit_date ?? b.scheduled_date).localeCompare(a.visit_date ?? a.scheduled_date));
    }

    return list;
  }, [allCompletedVisits, search, statusFilter, overallFilter, sortKey]);

  const isFiltered = search.trim() !== "" || statusFilter !== "all" || overallFilter !== "all";

  // Response modal
  const [respondingTo, setRespondingTo] = useState<Reg44Visit | null>(null);
  const [responseText, setResponseText]  = useState("");
  const [saving, setSaving]             = useState(false);

  // ARIA analysis
  const [ariaBusy, setAriaBusy]   = useState<string | null>(null);
  const [ariaError, setAriaError] = useState<string | null>(null);

  const handleSaveResponse = async () => {
    if (!respondingTo || !responseText.trim()) return;
    setSaving(true);
    try {
      await updateVisit.mutateAsync({
        id: respondingTo.id,
        data: {
          manager_response: responseText.trim(),
          manager_response_date: new Date().toISOString(),
          manager_response_by: currentUser?.id ?? "staff_darren",
          status: "manager_response_submitted",
        },
      });
      setRespondingTo(null);
      setResponseText("");
    } finally {
      setSaving(false);
    }
  };

  const handleAriaAnalysis = async (visit: Reg44Visit) => {
    setAriaBusy(visit.id);
    setAriaError(null);
    try {
      const findingSummary = visit.findings.map((f) =>
        `[${f.type.toUpperCase()}] ${f.area}: ${f.description}${f.action_required ? ` (Action: ${f.action_required}${f.action_completed ? " — COMPLETED" : " — PENDING"})` : ""}`,
      ).join("\n");

      const prompt = `You are ARIA, an expert regulatory compliance AI for a children's residential home. Analyse this Reg 44 independent visit report and provide a concise 2–3 sentence summary covering: overall finding, key concerns or strengths, and outstanding actions requiring immediate attention. Be precise and regulatory-focused.

Visit ${visit.visit_number} — ${visit.visit_date ?? visit.scheduled_date}
Visitor: ${visit.visitor_name}
Overall finding: ${visit.overall_finding ?? "not recorded"}

Findings:
${findingSummary}

Manager response: ${visit.manager_response ?? "None submitted yet"}`;

      const response = await api.post<{ choices: { message: { content: string } }[] }>(
        "/aria/chat",
        { messages: [{ role: "user", content: prompt }], context: "reg44_analysis" },
      );

      const summary =
        response?.choices?.[0]?.message?.content ??
        `Visit ${visit.visit_number} (${formatDate(visit.visit_date ?? visit.scheduled_date)}): Overall finding was ${visit.overall_finding ? OVERALL_LABELS[visit.overall_finding] : "not recorded"}. ${visit.findings.filter(f => f.type === "concern").length} concern(s) and ${visit.findings.filter(f => f.type === "strength").length} strength(s) identified. ${countOpenActions(visit)} action(s) remain open.`;

      await updateVisit.mutateAsync({ id: visit.id, data: { aria_summary: summary } });
    } catch {
      setAriaError("ARIA analysis failed — please try again");
    } finally {
      setAriaBusy(null);
    }
  };

  return (
    <PageShell
      title="Reg 44 Independent Visits"
      subtitle="Independent person visits — tracking, findings, actions and RI review"
      ariaContext={{ pageTitle: "Reg 44 Independent Visits", sourceType: "general" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filteredVisits} columns={REG44_EXPORT_COLS} filename="reg44-visits" />
          <PrintButton
            title="Reg 44 Visits"
            subtitle="Oak House — Independent Visitor Reports"
            targetId="reg44-content"
          />
          <SmartUploadButton
            variant="inline"
            label="Upload Visit Report"
            uploadContext="Reg 44 Independent Visit — visit report or evidence document upload"
          />
          <Link href="/ri">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cs-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)] transition-colors">
              <Gavel className="h-3.5 w-3.5" />
              RI Hub
            </button>
          </Link>
          <AriaStudioQuickActionButton context={{ record_type: "reg45", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="reg44-content" className="space-y-4">
      {/* ── Summary banner ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Total Visits",
            value: allCompletedVisits.length,
            icon: Eye,
            colour: "text-indigo-600",
            bg: "bg-indigo-50 border-indigo-100",
          },
          {
            label: "Open Actions",
            value: stats.totalOpenActions,
            icon: AlertTriangle,
            colour: stats.totalOpenActions > 0 ? "text-red-600" : "text-emerald-600",
            bg: stats.totalOpenActions > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100",
          },
          {
            label: "Concerns Resolved",
            value: `${stats.resolvedConcerns}/${stats.totalConcerns}`,
            icon: CheckCircle2,
            colour: stats.resolvedConcerns === stats.totalConcerns && stats.totalConcerns > 0 ? "text-emerald-600" : "text-amber-600",
            bg: stats.resolvedConcerns === stats.totalConcerns && stats.totalConcerns > 0 ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100",
          },
          {
            label: "Strengths",
            value: stats.totalStrengths,
            icon: Star,
            colour: "text-emerald-600",
            bg: "bg-emerald-50 border-emerald-100",
          },
          {
            label: "Avg Findings",
            value: stats.avgFindings,
            icon: BarChart3,
            colour: "text-blue-600",
            bg: "bg-blue-50 border-blue-100",
          },
          {
            label: "Next Visit",
            value: nextScheduled ? formatDate(nextScheduled.scheduled_date) : "Not scheduled",
            icon: Calendar,
            colour: "text-[var(--cs-text-secondary)]",
            bg: "bg-slate-50 border-[var(--cs-border-subtle)]",
          },
        ].map(({ label, value, icon: Icon, colour, bg }) => (
          <div key={label} className={cn("rounded-xl border p-3", bg)}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn("h-4 w-4 shrink-0", colour)} />
              <span className="text-[10px] text-[var(--cs-text-muted)] font-medium">{label}</span>
            </div>
            <p className={cn("text-lg font-bold", colour)}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Next scheduled visit ── */}
      {nextScheduled && (
        <div>
          <p className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-2">Next Scheduled Visit</p>
          <VisitCard visit={nextScheduled} onRespondClick={setRespondingTo} />
        </div>
      )}

      {/* ── Search & Filters ── */}
      {allCompletedVisits.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search visits by visitor, findings, response…"
                className="pl-9 h-9 text-sm rounded-xl"
              />
            </div>

            {/* Status filter */}
            <div className="flex gap-1.5 flex-wrap">
              {([
                ["all", "All"],
                ["completed", "Completed"],
                ["report_received", "Report Received"],
                ["manager_response_submitted", "Responded"],
                ["ri_reviewed", "RI Reviewed"],
              ] as [StatusFilter, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors",
                    statusFilter === key
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-[var(--cs-text-secondary)] border-[var(--cs-border)] hover:bg-[var(--cs-surface)]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Overall finding filter */}
            <select
              value={overallFilter}
              onChange={(e) => setOverallFilter(e.target.value as OverallFilter)}
              className="rounded-xl border border-[var(--cs-border)] bg-white px-3 py-1.5 text-[11px] text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All findings</option>
              <option value="satisfactory">Satisfactory</option>
              <option value="concerns_identified">Concerns Identified</option>
              <option value="serious_concerns">Serious Concerns</option>
            </select>

            {/* Sort */}
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-xl border border-[var(--cs-border)] bg-white px-3 py-1.5 text-[11px] text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          {/* Results count */}
          {isFiltered && (
            <div className="text-xs text-[var(--cs-text-muted)]">
              Showing {filteredVisits.length} of {allCompletedVisits.length} visit{allCompletedVisits.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      {/* ── Completed visits ── */}
      {allCompletedVisits.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest">Visit History</p>
          {filteredVisits.length === 0 && isFiltered ? (
            <div className="rounded-2xl border-2 border-dashed border-[var(--cs-border)] p-10 text-center text-[var(--cs-text-muted)]">
              <Search className="h-8 w-8 mx-auto mb-2 text-slate-200" />
              <div className="text-sm font-medium">No visits match your filters</div>
              <div className="text-xs mt-1">Try adjusting your search, status, or finding filter</div>
            </div>
          ) : (
            filteredVisits.map((visit) => (
              <div key={visit.id}>
                <VisitCard visit={visit} onRespondClick={setRespondingTo} />
                {/* ARIA analysis button for visits with findings but no aria_summary */}
                {!visit.aria_summary && visit.findings.length > 0 && (
                  <div className="mt-1.5 flex justify-end">
                    <button
                      onClick={() => handleAriaAnalysis(visit)}
                      disabled={ariaBusy === visit.id}
                      className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-800 disabled:opacity-50"
                    >
                      {ariaBusy === visit.id ? (
                        <>
                          <Sparkles className="h-3.5 w-3.5 animate-spin" />
                          ARIA analysing…
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Generate ARIA analysis
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
          {ariaError && (
            <p className="text-xs text-red-600 text-right">{ariaError}</p>
          )}
        </div>
      )}

      {/* ── Regulatory note ── */}
      <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50 px-4 py-3 text-xs text-[var(--cs-text-muted)]">
        <span className="font-semibold text-[var(--cs-text-secondary)]">Regulatory Basis — </span>
        Children&apos;s Homes (England) Regulations 2015, Regulation 44: an independent person must visit
        the home at least once every 4 weeks, and the registered person must submit a report within
        5 working days of the visit. The manager must respond formally and the RI must review all
        reports. Reg 44 reports and manager responses are primary evidence for Ofsted ILACS inspections.
      </div>
      </div>

      {/* ── Manager Response Modal ── */}
      <Dialog open={!!respondingTo} onOpenChange={(o) => { if (!o) { setRespondingTo(null); setResponseText(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4 text-[var(--cs-aria-gold)]" />
              Manager Response — Visit {respondingTo?.visit_number}
            </DialogTitle>
          </DialogHeader>

          {respondingTo && (
            <div className="space-y-4">
              {/* Visit summary */}
              <div className="rounded-xl border border-[var(--cs-border)] bg-slate-50 p-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="font-semibold text-[var(--cs-text-secondary)]">
                    {formatDate(respondingTo.visit_date ?? respondingTo.scheduled_date)}
                  </span>
                  {respondingTo.overall_finding && (
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", OVERALL_COLOUR[respondingTo.overall_finding])}>
                      {OVERALL_LABELS[respondingTo.overall_finding]}
                    </Badge>
                  )}
                </div>
                {/* Open actions to address */}
                {respondingTo.findings.filter((f) => f.action_required && !f.action_completed).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-red-600 mb-1">Open actions to address in response:</p>
                    <ul className="space-y-1">
                      {respondingTo.findings
                        .filter((f) => f.action_required && !f.action_completed)
                        .map((f) => (
                          <li key={f.id} className="flex items-start gap-1.5 text-[var(--cs-text-secondary)]">
                            <Flag className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                            <span>{f.area}: {f.action_required}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>

              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Describe how you are addressing each finding, what actions have been taken or are planned, and any systemic changes being made to prevent recurrence…"
                rows={6}
                className="text-sm"
              />

              <p className="text-[10px] text-[var(--cs-text-muted)]">
                This response will be recorded against Visit {respondingTo.visit_number} and forwarded to the RI for review. It becomes part of the Reg 45 evidence base.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setRespondingTo(null); setResponseText(""); }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveResponse}
              disabled={saving || !responseText.trim()}
              className="bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white"
            >
              {saving ? "Saving…" : "Submit Response"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AriaPanel
        mode="assist"
        pageContext="Reg 44 Independent Visits — RI view of independent visitor reports, visit findings, children's views, action tracking, management responses, statutory compliance, Ofsted evidence"
        recordType="reg45"
        className="mt-6"
      />
    </PageShell>
  );
}
