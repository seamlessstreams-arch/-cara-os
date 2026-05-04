"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA DOCUMENT INTELLIGENCE HUB
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { DocumentUploadModal } from "@/components/documents/document-upload-modal";
import { useDocumentIntelligence, useApproveDocument } from "@/hooks/use-doc-intelligence";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import type { UploadedDocument } from "@/types/documents";
import { DOCUMENT_CATEGORY_LABELS } from "@/types/documents";
import {
  FileText, Sparkles, AlertTriangle, CheckCircle2,
  Shield, Brain, ClipboardList, Search, X, ChevronDown, ChevronUp,
  Loader2, BookOpen, TriangleAlert, Eye,
  Upload, Filter,
} from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  pending: { label: "Pending", badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  analysing: { label: "Analysing", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
  review: { label: "Awaiting Review", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  approved: { label: "Approved", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  actioned: { label: "Actioned", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", badge: "bg-red-100 text-red-700", dot: "bg-red-500" },
  archived: { label: "Archived", badge: "bg-slate-100 text-slate-500", dot: "bg-slate-300" },
};

const RISK_CONFIG: Record<string, { badge: string; border: string }> = {
  low: { badge: "bg-emerald-100 text-emerald-700", border: "border-l-emerald-400" },
  medium: { badge: "bg-amber-100 text-amber-700", border: "border-l-amber-400" },
  high: { badge: "bg-orange-100 text-orange-700", border: "border-l-orange-500" },
  critical: { badge: "bg-red-100 text-red-700", border: "border-l-red-600" },
};

const PRIORITY_COLOURS: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

// ── Document card ─────────────────────────────────────────────────────────────

function DocumentCard({ doc }: { doc: UploadedDocument }) {
  const [expanded, setExpanded] = useState(doc.document_status === "review");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(doc.ai_result?.suggested_tasks.map((t) => t.id) ?? []),
  );
  const [approving, setApproving] = useState(false);
  const approve = useApproveDocument();

  const status = STATUS_CONFIG[doc.document_status] ?? STATUS_CONFIG.pending;
  const risk = doc.ai_risk_level ? RISK_CONFIG[doc.ai_risk_level] : null;
  const aiResult = doc.ai_result;
  const priorityFlags = aiResult?.risk_flags.filter((f) => f.severity === "critical" || f.severity === "high") ?? [];
  const pendingTasks = aiResult?.suggested_tasks.filter((t) => !t.approved) ?? [];

  const handleApprove = async () => {
    setApproving(true);
    try {
      await approve.mutateAsync({
        docId: doc.id,
        action: "approve",
        approved_task_ids: Array.from(selectedTaskIds),
      });
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden transition-shadow hover:shadow-sm border-l-4",
      risk?.border ?? "border-l-slate-200",
      doc.ai_result?.prompt_injection_detected && "ring-2 ring-red-400",
    )}>
      {/* Header */}
      <div className="flex items-start gap-4 p-5">
        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900 truncate max-w-[280px]">{doc.original_file_name}</span>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", status.badge)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", status.dot, doc.document_status === "analysing" && "animate-pulse")} />
                  {status.label}
                </span>
                {risk && (
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", risk.badge)}>
                    {doc.ai_risk_level} risk
                  </span>
                )}
                {doc.ai_result?.prompt_injection_detected && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                    ⚠️ INJECTION DETECTED
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                {doc.document_category && DOCUMENT_CATEGORY_LABELS[doc.document_category] && (
                  <span className="font-medium text-slate-700">{DOCUMENT_CATEGORY_LABELS[doc.document_category]}</span>
                )}
                {doc.classification_confidence !== null && (
                  <span>{Math.round((doc.classification_confidence ?? 0) * 100)}% confidence</span>
                )}
                <span>Uploaded {formatRelative(doc.uploaded_at)}</span>
              </div>
            </div>
            <button
              onClick={() => setExpanded((p) => !p)}
              className="text-slate-400 hover:text-slate-600 shrink-0"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* Summary */}
          {doc.ai_summary && (
            <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-2">{doc.ai_summary}</p>
          )}

          {/* Quick chips */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {priorityFlags.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-medium text-red-700">
                <TriangleAlert className="h-2.5 w-2.5" />
                {priorityFlags.length} priority issue{priorityFlags.length !== 1 ? "s" : ""}
              </span>
            )}
            {pendingTasks.length > 0 && doc.document_status === "review" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                <ClipboardList className="h-2.5 w-2.5" />
                {pendingTasks.length} task{pendingTasks.length !== 1 ? "s" : ""} to approve
              </span>
            )}
            {doc.tasks_created.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                <CheckCircle2 className="h-2.5 w-2.5" />
                {doc.tasks_created.length} task{doc.tasks_created.length !== 1 ? "s" : ""} created
              </span>
            )}
            {aiResult?.regulation_links.slice(0, 2).map((r, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] text-blue-700">
                <BookOpen className="h-2.5 w-2.5" />
                {r.regulation.split("—")[0].trim()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Expanded detail panel ── */}
      {expanded && aiResult && (
        <div className="border-t border-slate-100 divide-y divide-slate-100">

          {/* Injection warning */}
          {aiResult.prompt_injection_detected && (
            <div className="px-5 py-4 bg-red-50">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-red-800">⚠️ Prompt injection attempt detected</div>
                  <div className="text-xs text-red-700 mt-1 leading-relaxed">
                    This document contained instructions attempting to manipulate ARIA. All instructions were ignored — analysis treats document content as data only.
                    {aiResult.suspicious_content && (
                      <div className="mt-1.5 font-mono bg-red-100 rounded px-2 py-1 text-[10px]">
                        Detected: &ldquo;{aiResult.suspicious_content}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Extracted intelligence */}
          <div className="px-5 py-4 bg-slate-50/30">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Extracted Intelligence</div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[11px]">
              {aiResult.extracted_entities.people.length > 0 && (
                <div>
                  <div className="font-semibold text-slate-600 mb-1">People mentioned</div>
                  <div className="flex flex-wrap gap-1">
                    {aiResult.extracted_entities.people.map((p, i) => (
                      <span key={i} className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-700">{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {aiResult.extracted_entities.dates.length > 0 && (
                <div>
                  <div className="font-semibold text-slate-600 mb-1">Key dates</div>
                  {aiResult.extracted_entities.dates.slice(0, 4).map((d, i) => (
                    <div key={i} className="text-slate-600">
                      <span className="font-medium">{d.label}:</span> {d.value}
                    </div>
                  ))}
                </div>
              )}
              {aiResult.extracted_entities.actions.length > 0 && (
                <div className="col-span-2">
                  <div className="font-semibold text-slate-600 mb-1">Action points</div>
                  <ul className="space-y-1">
                    {aiResult.extracted_entities.actions.slice(0, 6).map((a, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-slate-400 mt-0.5">•</span>
                        <span className="text-slate-700">
                          <span className="font-medium">{a.action}</span>
                          {a.responsible_person && <span className="text-slate-500 ml-1">— {a.responsible_person}</span>}
                          {a.due_date && <span className="text-slate-400 ml-1">({a.due_date})</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiResult.extracted_entities.safeguarding_concerns.length > 0 && (
                <div className="col-span-2 rounded-xl bg-red-50 border border-red-100 p-3">
                  <div className="font-semibold text-red-700 mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Safeguarding concerns identified
                  </div>
                  <ul className="space-y-1">
                    {aiResult.extracted_entities.safeguarding_concerns.map((c, i) => (
                      <li key={i} className="text-red-700">• {c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {aiResult.extracted_entities.missing_information.length > 0 && (
                <div className="col-span-2">
                  <div className="font-semibold text-amber-700 mb-1">Missing information</div>
                  <ul className="space-y-0.5">
                    {aiResult.extracted_entities.missing_information.map((m, i) => (
                      <li key={i} className="text-amber-700">• {m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Risk flags */}
          {aiResult.risk_flags.length > 0 && (
            <div className="px-5 py-4">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Risk & Gap Flags</div>
              <div className="space-y-2">
                {aiResult.risk_flags.map((f, i) => (
                  <div key={i} className={cn(
                    "flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-[11px]",
                    f.severity === "critical" ? "border-red-200 bg-red-50 text-red-800"
                    : f.severity === "high" ? "border-orange-200 bg-orange-50 text-orange-800"
                    : f.severity === "medium" ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-slate-200 bg-slate-50 text-slate-700",
                  )}>
                    <TriangleAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase text-[10px] tracking-wide">{f.flag_type.replace(/_/g, " ")} — </span>
                      <span className="leading-relaxed">{f.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regulation mapping */}
          {aiResult.regulation_links.length > 0 && (
            <div className="px-5 py-4 bg-blue-50/30">
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2.5">Regulation Mapping</div>
              <div className="space-y-2">
                {aiResult.regulation_links.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <BookOpen className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-blue-800">{r.regulation}</span>
                      {r.quality_standard && <span className="text-blue-600 ml-1.5">· {r.quality_standard}</span>}
                      <div className="text-blue-700 mt-0.5 leading-relaxed">{r.relevance}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence areas */}
          {aiResult.evidence_areas.length > 0 && (
            <div className="px-5 py-4">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Reg 45 Evidence Areas</div>
              <div className="flex flex-wrap gap-2">
                {aiResult.evidence_areas.map((e, i) => (
                  <div key={i} className={cn(
                    "rounded-xl border px-3 py-1.5 text-[11px] font-medium",
                    e.strength === "strong" ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : e.strength === "moderate" ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-slate-200 bg-slate-50 text-slate-600",
                  )}>
                    {e.area}
                    {e.reg45_section && <span className="ml-1 opacity-60">· {e.reg45_section}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ARIA oversight draft */}
          {aiResult.oversight_draft && (
            <div className="px-5 py-4 bg-indigo-50/30">
              <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2">ARIA Management Oversight Draft</div>
              <div className="rounded-xl bg-white border border-indigo-100 p-3">
                <p className="text-xs text-indigo-800 leading-relaxed">{aiResult.oversight_draft}</p>
              </div>
              <p className="text-[10px] text-indigo-500 mt-1.5">Edit and personalise before using as management oversight.</p>
            </div>
          )}

          {/* Child-friendly version */}
          {aiResult.child_friendly_summary && (
            <div className="px-5 py-4 bg-emerald-50/30">
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Child-Friendly Version</div>
              <div className="rounded-xl bg-white border border-emerald-100 p-3">
                <p className="text-xs text-emerald-800 leading-relaxed">{aiResult.child_friendly_summary}</p>
              </div>
            </div>
          )}

          {/* Task approval panel */}
          {doc.document_status === "review" && pendingTasks.length > 0 && (
            <div className="px-5 py-4">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                Approve tasks to create — {selectedTaskIds.size} selected
              </div>
              <div className="space-y-2 mb-4">
                {pendingTasks.map((task) => (
                  <label
                    key={task.id}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                      selectedTaskIds.has(task.id) ? "border-violet-300 bg-violet-50" : "border-slate-100 bg-white hover:bg-slate-50",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.has(task.id)}
                      onChange={() => setSelectedTaskIds((prev) => {
                        const next = new Set(prev);
                        next.has(task.id) ? next.delete(task.id) : next.add(task.id);
                        return next;
                      })}
                      className="rounded mt-0.5 shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900">{task.title}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", PRIORITY_COLOURS[task.priority] ?? PRIORITY_COLOURS.low)}>
                          {task.priority}
                        </span>
                        {task.due_date && <span className="text-[10px] text-slate-400">{formatDate(task.due_date)}</span>}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{task.description}</p>
                      {task.regulation_link && (
                        <div className="mt-1 text-[10px] text-blue-600">📋 {task.regulation_link}</div>
                      )}
                      {task.source_quote && (
                        <div className="mt-1 text-[10px] text-slate-400 italic border-l-2 border-slate-200 pl-2 line-clamp-2">
                          &ldquo;{task.source_quote}&rdquo;
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={approving || selectedTaskIds.size === 0}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-40 transition-colors"
                >
                  {approving
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating tasks…</>
                    : <><CheckCircle2 className="h-3.5 w-3.5" /> Approve & Create {selectedTaskIds.size} Task{selectedTaskIds.size !== 1 ? "s" : ""}</>
                  }
                </button>
                <button
                  onClick={() => approve.mutate({ docId: doc.id, action: "reject" })}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => approve.mutate({ docId: doc.id, action: "request_review" })}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Send for review
                </button>
              </div>
            </div>
          )}

          {/* Actioned / Approved state */}
          {(doc.document_status === "actioned" || doc.document_status === "approved") && (
            <div className="px-5 py-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="text-sm">
                <span className="font-semibold text-emerald-800">
                  {doc.tasks_created.length > 0
                    ? `${doc.tasks_created.length} task${doc.tasks_created.length !== 1 ? "s" : ""} created`
                    : "Approved — no tasks created"}
                </span>
                {doc.approved_at && (
                  <span className="text-xs text-slate-500 ml-2">· Approved {formatDate(doc.approved_at)}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DocumentIntelligencePage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [showUpload, setShowUpload] = useState(false);

  const query = useDocumentIntelligence();
  const allDocs: UploadedDocument[] = query.data?.data ?? [];
  const meta = query.data?.meta;

  const filtered = useMemo(() => {
    let list = [...allDocs];
    if (filterStatus !== "all") list = list.filter((d) => d.document_status === filterStatus);
    if (filterRisk !== "all") list = list.filter((d) => d.ai_risk_level === filterRisk);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        d.original_file_name.toLowerCase().includes(q) ||
        d.ai_summary?.toLowerCase().includes(q) ||
        (d.document_category ? DOCUMENT_CATEGORY_LABELS[d.document_category]?.toLowerCase().includes(q) : false),
      );
    }
    return list;
  }, [allDocs, filterStatus, filterRisk, search]);

  const awaitingReview = meta?.awaiting_review ?? 0;
  const highRisk = meta?.high_risk ?? 0;
  const tasksCreated = meta?.tasks_created ?? 0;

  return (
    <>
      <PageShell
        title="Document Intelligence"
        subtitle="Upload any document — ARIA classifies, extracts, and converts it into tasks, evidence, and oversight"
        showQuickCreate={false}
        actions={
          <div className="flex items-center gap-2">
            <PrintButton title="Document Intelligence" subtitle="Oak House — AI Document Processing" targetId="doc-intelligence-content" />
            <SmartUploadButton label="Upload Document" />
          </div>
        }
      >
        <div id="doc-intelligence-content" className="space-y-6 animate-fade-in">

          {/* Hero */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
            <div className="flex items-start gap-5">
              <div className="h-14 w-14 rounded-2xl bg-violet-600 flex items-center justify-center shrink-0">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold">ARIA Document Intelligence Engine</h2>
                <p className="text-sm text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
                  Upload any operational document. ARIA reads, classifies, extracts entities, detects risks, maps to regulations, suggests tasks, generates management oversight, and creates Reg 45 evidence — all requiring your approval before any record is changed.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowUpload(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-sm font-bold transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Upload a document
                  </button>
                  <div className="flex flex-wrap gap-1.5">
                    {["Care Plan", "Risk Assessment", "DBS", "Reg 44", "Incident", "PEP", "Training Cert", "Strategy Meeting", "Medication Audit", "+more"].map((t) => (
                      <span key={t} className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-slate-300">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Awaiting Review", value: awaitingReview,
                icon: Eye, color: awaitingReview > 0 ? "text-amber-600" : "text-emerald-600",
                bg: awaitingReview > 0 ? "bg-amber-50" : "bg-emerald-50",
                action: () => setFilterStatus("review"),
              },
              {
                label: "High/Critical Risk", value: highRisk,
                icon: AlertTriangle, color: highRisk > 0 ? "text-red-600" : "text-emerald-600",
                bg: highRisk > 0 ? "bg-red-50" : "bg-emerald-50",
                action: () => setFilterRisk("high"),
              },
              {
                label: "Tasks Created", value: tasksCreated,
                icon: ClipboardList, color: "text-violet-600", bg: "bg-violet-50",
                action: () => {},
              },
              {
                label: "Total Documents", value: meta?.total ?? 0,
                icon: FileText, color: "text-slate-700", bg: "bg-slate-50",
                action: () => setFilterStatus("all"),
              },
            ].map(({ label, value, icon: Icon, color, bg, action }) => (
              <button
                key={label}
                onClick={action}
                className="rounded-2xl border bg-white p-4 text-left hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className={cn("rounded-xl p-2.5 shrink-0", bg)}>
                    <Icon className={cn("h-4 w-4", color)} />
                  </div>
                  <div>
                    <div className={cn("text-2xl font-bold", color)}>{value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="rounded-2xl border bg-white p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents, summaries, categories…"
                className="w-full pl-9 pr-3 h-8 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="all">All statuses</option>
              <option value="review">Awaiting review</option>
              <option value="actioned">Actioned</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="all">All risk levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            {(filterStatus !== "all" || filterRisk !== "all" || search) && (
              <button
                onClick={() => { setFilterStatus("all"); setFilterRisk("all"); setSearch(""); }}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
            <span className="ml-auto text-xs text-slate-400">
              {filtered.length} document{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Documents list */}
          {query.isPending ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border bg-white p-16 text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-violet-400" />
              </div>
              <div>
                <div className="text-base font-bold text-slate-900">
                  {allDocs.length === 0 ? "No documents yet" : "No documents match your filters"}
                </div>
                <div className="text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  {allDocs.length === 0
                    ? "Upload your first document and ARIA will classify, extract intelligence, and suggest actions."
                    : "Try clearing your filters to see all documents."
                  }
                </div>
              </div>
              {allDocs.length === 0 && (
                <button
                  onClick={() => setShowUpload(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Upload your first document
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}

          {/* What ARIA supports */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-4">
            <div className="text-xs font-bold text-slate-700">Supported document types</div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 text-[11px] text-slate-500">
              {[
                "Care plans & placement plans", "Risk & safety assessments", "Missing from care reports",
                "Incident & accident reports", "Strategy meeting minutes", "CLA / LAC review records",
                "PEP meeting minutes", "Health assessments", "Therapy reports", "Education reports",
                "Family time agreements", "Court & legal documents", "DBS & right-to-work documents",
                "Training certificates & matrices", "Supervision records", "Probation reviews",
                "Reg 44 independent reports", "Reg 45 reviews", "Ofsted correspondence",
                "Fire risk assessments", "Vehicle check records", "Medication audits",
                "Safer recruitment evidence", "Policies & procedures", "Insurance certificates",
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <div className="h-1 w-1 rounded-full bg-violet-300 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3">
              <Shield className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-relaxed">
                <strong>Security:</strong> ARIA treats all uploaded document content as data. If a document contains instructions attempting to manipulate ARIA (e.g. &ldquo;ignore previous instructions&rdquo;), they are automatically detected, flagged, and ignored. All AI suggestions require explicit human approval before creating any records. Full audit trail is maintained for every action.
              </p>
            </div>
          </div>
        </div>
      </PageShell>

      {showUpload && <DocumentUploadModal onClose={() => setShowUpload(false)} />}
    </>
  );
}
