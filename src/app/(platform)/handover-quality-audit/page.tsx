"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HANDOVER QUALITY AUDIT
// Observation-based audits of shift handovers. Scoring across information,
// safeguarding coverage, child voice, action handovers and professionalism.
// Required by Quality Standard 13 (Leadership & Management) and Reg 33.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Star,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Eye,
  EyeOff,
  Megaphone,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import type { HandoverAudit, HandoverDomainScore, RagRating } from "@/types/extended";
import { RAG_RATING_LABEL } from "@/types/extended";
import { useHandoverAudits } from "@/hooks/use-handover-audits";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// ── RAG colour helpers ───────────────────────────────────────────────────────
const ragColour = (rag: RagRating): string => {
  if (rag === "green") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (rag === "amber") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-rose-100 text-rose-800 border-rose-200";
};

const scoreColour = (score: number): string => {
  if (score >= 4.5) return "text-emerald-700";
  if (score >= 3.5) return "text-emerald-600";
  if (score >= 2.5) return "text-amber-600";
  return "text-rose-600";
};

const formatPretty = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ── Sort options ─────────────────────────────────────────────────────────────
type SortKey =
  | "date_desc"
  | "date_asc"
  | "score_desc"
  | "score_asc"
  | "rag";

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HandoverQualityAuditPage() {
  const { data: res, isLoading } = useHandoverAudits();
  const audits = res?.data ?? [];

  const [sortKey, setSortKey] = useState<SortKey>("date_desc");
  const [filterRag, setFilterRag] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const ninety = new Date();
    ninety.setDate(ninety.getDate() - 90);
    const thisQuarter = audits.filter((a) => new Date(a.audit_date) >= ninety);
    const avg =
      audits.reduce((s, a) => s + a.overall_score, 0) / Math.max(audits.length, 1);
    const green = audits.filter((a) => a.overall_rag_rating === "green").length;
    const recOpen = audits.reduce(
      (s, a) => s + a.recommendations_to_handover.length,
      0,
    );
    return {
      thisQuarter: thisQuarter.length,
      avg: Math.round(avg * 10) / 10,
      green,
      recOpen,
    };
  }, [audits]);

  // ── Filtered + sorted ──────────────────────────────────────────────────────
  const visible = useMemo(() => {
    let list = [...audits];
    if (filterRag !== "all") {
      list = list.filter((a) => a.overall_rag_rating === filterRag);
    }
    switch (sortKey) {
      case "date_desc":
        list.sort((a, b) => b.audit_date.localeCompare(a.audit_date));
        break;
      case "date_asc":
        list.sort((a, b) => a.audit_date.localeCompare(b.audit_date));
        break;
      case "score_desc":
        list.sort((a, b) => b.overall_score - a.overall_score);
        break;
      case "score_asc":
        list.sort((a, b) => a.overall_score - b.overall_score);
        break;
      case "rag": {
        const order: Record<RagRating, number> = { red: 0, amber: 1, green: 2 };
        list.sort(
          (a, b) => order[a.overall_rag_rating] - order[b.overall_rag_rating],
        );
        break;
      }
    }
    return list;
  }, [audits, sortKey, filterRag]);

  // ── Export columns ─────────────────────────────────────────────────────────
  const exportColumns: ExportColumn<HandoverAudit>[] = [
    { header: "Audit ID", accessor: (r: HandoverAudit) => r.id },
    { header: "Date", accessor: (r: HandoverAudit) => r.audit_date },
    { header: "Period", accessor: (r: HandoverAudit) => r.audit_period },
    {
      header: "Handover observed",
      accessor: (r: HandoverAudit) => r.handover_observed,
    },
    {
      header: "Auditor",
      accessor: (r: HandoverAudit) => getStaffName(r.auditor),
    },
    {
      header: "Staff on duty",
      accessor: (r: HandoverAudit) =>
        r.staff_on_duty.map((id: string) => getStaffName(id)).join("; "),
    },
    {
      header: "Duration (min)",
      accessor: (r: HandoverAudit) => String(r.duration_minutes),
    },
    {
      header: "Overall score",
      accessor: (r: HandoverAudit) => String(r.overall_score),
    },
    {
      header: "RAG",
      accessor: (r: HandoverAudit) => RAG_RATING_LABEL[r.overall_rag_rating],
    },
    {
      header: "Safety info covered",
      accessor: (r: HandoverAudit) =>
        r.childrens_safety_info_covered ? "Yes" : "No",
    },
    {
      header: "Risk info covered",
      accessor: (r: HandoverAudit) => (r.risk_info_covered ? "Yes" : "No"),
    },
    {
      header: "Child voice reflected",
      accessor: (r: HandoverAudit) => (r.child_voice_reflected ? "Yes" : "No"),
    },
    {
      header: "Strengths",
      accessor: (r: HandoverAudit) => r.strengths_observed.join(" | "),
    },
    {
      header: "Gaps",
      accessor: (r: HandoverAudit) => r.gaps_identified.join(" | "),
    },
    {
      header: "Recommendations",
      accessor: (r: HandoverAudit) =>
        r.recommendations_to_handover.join(" | "),
    },
    {
      header: "Training arising",
      accessor: (r: HandoverAudit) => r.training_arising.join(" | "),
    },
    {
      header: "Policy arising",
      accessor: (r: HandoverAudit) => r.policy_arising.join(" | "),
    },
    {
      header: "Next audit",
      accessor: (r: HandoverAudit) => r.next_audit_date,
    },
  ];

  if (isLoading) return <PageShell title="Handover Quality Audit" subtitle="Observation-based scoring of shift handovers — required by Quality Standard 13 and Reg 33."><div className="p-8 text-center text-muted-foreground">Loading handover audits…</div></PageShell>;

  return (
    <PageShell
      title="Handover Quality Audit"
      subtitle="Observation-based scoring of shift handovers — required by Quality Standard 13 and Reg 33."
      ariaContext={{ pageTitle: "Handover Quality Audits", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            data={visible}
            columns={exportColumns}
            filename="handover-quality-audits"
          />
          <PrintButton title="Handover Quality Audits" />
          <AriaStudioQuickActionButton context={{ record_type: "handover", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* Banner — handover as safeguarding moment */}
      <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 text-indigo-700 mt-0.5" />
          <div className="text-sm text-indigo-900">
            <p className="font-semibold">
              Handover is a safeguarding moment.
            </p>
            <p className="mt-1">
              Every handover protects a child's safety, voice and continuity of
              care. Auditing handover quality is one of the clearest ways a
              Registered Manager can evidence Quality Standard 13 (Leadership &
              Management) and inform the Independent Person under Reg 33. Each
              gap captured here becomes learning, training, or policy — never
              just a note.
            </p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-[var(--cs-text-secondary)] uppercase tracking-wide">
            <CalendarClock className="h-4 w-4" /> Audits this quarter
          </div>
          <div className="mt-2 text-3xl font-semibold text-[var(--cs-navy)]">
            {summary.thisQuarter}
          </div>
          <div className="mt-1 text-xs text-[var(--cs-text-muted)]">last 90 days</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-[var(--cs-text-secondary)] uppercase tracking-wide">
            <Star className="h-4 w-4" /> Average score
          </div>
          <div
            className={cn(
              "mt-2 text-3xl font-semibold",
              scoreColour(summary.avg),
            )}
          >
            {summary.avg.toFixed(1)}
          </div>
          <div className="mt-1 text-xs text-[var(--cs-text-muted)]">out of 5.0</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-[var(--cs-text-secondary)] uppercase tracking-wide">
            <CheckCircle2 className="h-4 w-4" /> Green-rated handovers
          </div>
          <div className="mt-2 text-3xl font-semibold text-emerald-700">
            {summary.green}
            <span className="text-base font-normal text-[var(--cs-text-muted)]">
              {" "}
              / {audits.length}
            </span>
          </div>
          <div className="mt-1 text-xs text-[var(--cs-text-muted)]">overall RAG</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-[var(--cs-text-secondary)] uppercase tracking-wide">
            <Lightbulb className="h-4 w-4" /> Recommendations open
          </div>
          <div className="mt-2 text-3xl font-semibold text-[var(--cs-navy)]">
            {summary.recOpen}
          </div>
          <div className="mt-1 text-xs text-[var(--cs-text-muted)]">across all audits</div>
        </div>
      </div>

      {/* Filters / sort */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--cs-border)] bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--cs-text-secondary)]">RAG</span>
          <Select value={filterRag} onValueChange={setFilterRag}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="green">{RAG_RATING_LABEL.green}</SelectItem>
              <SelectItem value="amber">{RAG_RATING_LABEL.amber}</SelectItem>
              <SelectItem value="red">{RAG_RATING_LABEL.red}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-[var(--cs-text-muted)]" />
          <span className="text-xs font-medium text-[var(--cs-text-secondary)]">Sort by</span>
          <Select
            value={sortKey}
            onValueChange={(v: string) => setSortKey(v as SortKey)}
          >
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Date (newest first)</SelectItem>
              <SelectItem value="date_asc">Date (oldest first)</SelectItem>
              <SelectItem value="score_desc">Score (highest)</SelectItem>
              <SelectItem value="score_asc">Score (lowest)</SelectItem>
              <SelectItem value="rag">RAG (red first)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-xs text-[var(--cs-text-muted)]">
          Showing {visible.length} of {audits.length}
        </div>
      </div>

      {/* Audit list */}
      <div className="space-y-3">
        {visible.map((a) => {
          const isOpen = expandedId === a.id;
          return (
            <div
              key={a.id}
              className="rounded-lg border border-[var(--cs-border)] bg-white shadow-sm"
            >
              {/* Card header */}
              <button
                type="button"
                onClick={() =>
                  setExpandedId((current) => (current === a.id ? null : a.id))
                }
                className="flex w-full items-start justify-between gap-4 p-4 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[var(--cs-navy)]">
                      {a.handover_observed}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-medium",
                        ragColour(a.overall_rag_rating),
                      )}
                    >
                      {RAG_RATING_LABEL[a.overall_rag_rating]}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        scoreColour(a.overall_score),
                      )}
                    >
                      {a.overall_score.toFixed(1)} / 5.0
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--cs-text-secondary)]">
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatPretty(a.audit_date)} · {a.audit_period}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      Auditor: {getStaffName(a.auditor)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {a.duration_minutes} min observed
                    </span>
                    <span className="flex items-center gap-1">
                      {a.child_voice_reflected ? (
                        <>
                          <Eye className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">
                            Child voice reflected
                          </span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-amber-700">
                            Child voice gap
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 pt-1">
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-[var(--cs-text-muted)]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[var(--cs-text-muted)]" />
                  )}
                </div>
              </button>

              {/* Expanded body */}
              {isOpen && (
                <div className="border-t border-[var(--cs-border)] p-4 space-y-5">
                  {/* Headline blocks */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-md bg-slate-50 p-3">
                      <div className="text-xs font-medium text-[var(--cs-text-secondary)]">
                        Staff on duty
                      </div>
                      <div className="mt-1 text-sm text-[var(--cs-navy)]">
                        {a.staff_on_duty.map((id) => getStaffName(id)).join(", ")}
                      </div>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <div className="text-xs font-medium text-[var(--cs-text-secondary)]">
                        Safety information covered
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-sm font-medium",
                          a.childrens_safety_info_covered
                            ? "text-emerald-700"
                            : "text-rose-700",
                        )}
                      >
                        {a.childrens_safety_info_covered ? "Yes" : "No"}
                      </div>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <div className="text-xs font-medium text-[var(--cs-text-secondary)]">
                        Risk information covered
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-sm font-medium",
                          a.risk_info_covered
                            ? "text-emerald-700"
                            : "text-rose-700",
                        )}
                      >
                        {a.risk_info_covered ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>

                  {/* Domain scores */}
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--cs-navy)] flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4" /> Domain scores
                    </h3>
                    <div className="overflow-hidden rounded-md border border-[var(--cs-border)]">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-[var(--cs-text-secondary)]">
                          <tr>
                            <th className="px-3 py-2 text-left">Domain</th>
                            <th className="px-3 py-2 text-left w-16">Score</th>
                            <th className="px-3 py-2 text-left">Observation</th>
                            <th className="px-3 py-2 text-left">Evidence</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(a.scoring_domains ?? []).map((dom: HandoverDomainScore) => (
                            <tr key={dom.domain}>
                              <td className="px-3 py-2 align-top font-medium text-[var(--cs-navy)]">
                                {dom.domain}
                              </td>
                              <td className="px-3 py-2 align-top">
                                <span
                                  className={cn(
                                    "font-semibold",
                                    scoreColour(dom.score),
                                  )}
                                >
                                  {dom.score} / 5
                                </span>
                              </td>
                              <td className="px-3 py-2 align-top text-[var(--cs-text-secondary)]">
                                {dom.observation}
                              </td>
                              <td className="px-3 py-2 align-top text-[var(--cs-text-muted)] italic">
                                {dom.evidence}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Strengths / Gaps */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                      <h4 className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Strengths observed
                      </h4>
                      {a.strengths_observed.length > 0 ? (
                        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-emerald-900">
                          {a.strengths_observed.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-emerald-800 italic">
                          None recorded.
                        </p>
                      )}
                    </div>
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                      <h4 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Gaps identified
                      </h4>
                      {a.gaps_identified.length > 0 ? (
                        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-amber-900">
                          {a.gaps_identified.map((g, i) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-amber-800 italic">
                          No gaps recorded.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Documentation quality */}
                  <div className="rounded-md border border-[var(--cs-border)] p-3">
                    <h4 className="text-sm font-semibold text-[var(--cs-navy)] flex items-center gap-2">
                      <BookOpen className="h-4 w-4" /> Handover documentation
                      quality
                    </h4>
                    <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">
                      {a.handover_documentation_quality}
                    </p>
                  </div>

                  {/* Recommendations / Training / Policy */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3">
                      <h4 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" /> Recommendations
                      </h4>
                      {a.recommendations_to_handover.length > 0 ? (
                        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-indigo-900">
                          {a.recommendations_to_handover.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-indigo-800 italic">
                          None.
                        </p>
                      )}
                    </div>
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                      <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" /> Training arising
                      </h4>
                      {a.training_arising.length > 0 ? (
                        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-blue-900">
                          {a.training_arising.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-blue-800 italic">
                          None.
                        </p>
                      )}
                    </div>
                    <div className="rounded-md border border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)] p-3">
                      <h4 className="text-sm font-semibold text-[var(--cs-navy)] flex items-center gap-2">
                        <BookOpen className="h-4 w-4" /> Policy arising
                      </h4>
                      {a.policy_arising.length > 0 ? (
                        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-[var(--cs-navy)]">
                          {a.policy_arising.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-[var(--cs-navy)] italic">
                          None.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Shareable team observations */}
                  <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3">
                    <h4 className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                      <Megaphone className="h-4 w-4" /> Shared with the team
                    </h4>
                    {a.shareable_observations.length > 0 ? (
                      <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-emerald-900">
                        {a.shareable_observations.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-emerald-800 italic">
                        Nothing published from this audit yet.
                      </p>
                    )}
                  </div>

                  {/* Confidential notes (RM only) */}
                  {a.confidential_notes && (
                    <div className="rounded-md border border-slate-300 bg-slate-50 p-3">
                      <h4 className="text-sm font-semibold text-[var(--cs-navy)] flex items-center gap-2">
                        <EyeOff className="h-4 w-4" /> Confidential note
                        (Registered Manager only)
                      </h4>
                      <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">
                        {a.confidential_notes}
                      </p>
                    </div>
                  )}

                  {/* Footer line */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-[var(--cs-text-muted)] border-t border-[var(--cs-border-subtle)] pt-3">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Audit ID: {a.id}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Next audit due: {formatPretty(a.next_audit_date)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-[var(--cs-text-muted)]">
            No audits match the current filters.
          </div>
        )}
      </div>

      {/* Regulatory note */}
      <div className="mt-8 rounded-lg border border-[var(--cs-border)] bg-slate-50 p-4 text-sm text-[var(--cs-text-secondary)]">
        <h3 className="font-semibold text-[var(--cs-navy)] mb-1 flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> Regulatory basis
        </h3>
        <p>
          The Children's Homes (England) Regulations 2015 — Quality Standard 13
          (Leadership and Management Standard) requires the Registered Manager
          to lead a culture of continuous improvement and to use evidence to
          improve quality of care. Reg 33 visits ask the Independent Person to
          consider whether children are effectively safeguarded and whether
          systems for sharing information between staff are robust. Auditing
          handovers — the moment a child's safety, voice, and continuity of care
          travel from one shift to the next — is one of the strongest direct
          evidence sources for both. Findings here feed Reg 45 quality of care
          reviews and the SCCIF self-evaluation.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Daily Log"
        category="general"
        days={14}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Handover Quality Audits — shift handover quality, information completeness, safeguarding alerts, medication records, incident follow-up, audit scores, Reg 45 evidence"
        recordType="handover"
        className="mt-6"
      />
    </PageShell>
  );
}
