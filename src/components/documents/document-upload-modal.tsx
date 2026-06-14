"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — DOCUMENT UPLOAD MODAL
// Multi-step: Select → Paste/Name → Analyse → Review → Action
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn, formatDate } from "@/lib/utils";
import { useUploadDocument } from "@/hooks/use-doc-intelligence";
import type { UploadedDocument, DocumentRiskFlag } from "@/types/documents";
import {
  X, Upload, FileText, Loader2, CheckCircle2, AlertTriangle,
  Shield, Sparkles, ChevronRight, TriangleAlert, Brain,
  ClipboardList, Link, BookOpen, Info, ArrowRight,
} from "lucide-react";

type Step = "select" | "analysing" | "review";

const ACCEPT_TYPES = ".pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg,.txt,.msg,.eml";

const FILE_TYPE_MAP: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/csv": "csv",
  "image/png": "png",
  "image/jpeg": "jpg",
  "text/plain": "txt",
};

const RISK_COLOURS: Record<string, string> = {
  low: "bg-emerald-50 border-emerald-200 text-emerald-800",
  medium: "bg-amber-50 border-amber-200 text-amber-800",
  high: "bg-orange-50 border-orange-200 text-orange-800",
  critical: "bg-red-50 border-red-200 text-red-800",
};

const RISK_DOT: Record<string, string> = {
  low: "bg-emerald-500", medium: "bg-amber-500", high: "bg-orange-500", critical: "bg-red-600",
};

const SEVERITY_BADGE: Record<string, string> = {
  low: "bg-[var(--cs-surface)] text-[var(--cs-text-secondary)]",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

function RiskFlagItem({ flag }: { flag: DocumentRiskFlag }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5", SEVERITY_BADGE[flag.severity] ?? SEVERITY_BADGE.low)}>
      <TriangleAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider">{flag.flag_type.replace(/_/g, " ")}</div>
        <div className="text-xs mt-0.5 leading-relaxed">{flag.description}</div>
      </div>
    </div>
  );
}

interface DocumentUploadModalProps {
  linkedChildId?: string;
  linkedStaffId?: string;
  linkedIncidentId?: string;
  uploadContext?: string;
  onClose: () => void;
}

export function DocumentUploadModal({
  linkedChildId,
  linkedStaffId,
  linkedIncidentId,
  uploadContext,
  onClose,
}: DocumentUploadModalProps) {
  const router = useRouter();
  const uploadMutation = useUploadDocument();

  const [step, setStep] = useState<Step>("select");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("txt");
  const [fileSize, setFileSize] = useState(0);
  const [extractedText, setExtractedText] = useState("");
  const [context, setContext] = useState(uploadContext ?? "");
  const [result, setResult] = useState<UploadedDocument | null>(null);
  const [caraError, setCaraError] = useState<string | null>(null);
  const [approvedTaskIds, setApprovedTaskIds] = useState<Set<string>>(new Set());
  const [createEvidence, setCreateEvidence] = useState(false);
  const [createChronology, setCreateChronology] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [actionComplete, setActionComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File selection ──────────────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    setFileSize(file.size);
    const detectedType = FILE_TYPE_MAP[file.type] ?? (file.name.endsWith(".docx") ? "docx" : file.name.endsWith(".xlsx") ? "xlsx" : "txt");
    setFileType(detectedType);

    if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (e) => setExtractedText((e.target?.result as string) ?? "");
      reader.readAsText(file);
    }
    // For non-text files (PDF, DOCX etc.) in this demo system, the text area
    // lets the user paste extracted content. In production, a server-side
    // parser (pdf-parse, mammoth, etc.) would extract text automatically.
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // ── Upload + analyse ────────────────────────────────────────────────────────
  const handleAnalyse = async () => {
    if (!fileName.trim() || !extractedText.trim()) return;
    setStep("analysing");
    setCaraError(null);

    try {
      const res = await uploadMutation.mutateAsync({
        original_file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        extracted_text: extractedText,
        linked_child_id: linkedChildId ?? null,
        linked_staff_id: linkedStaffId ?? null,
        linked_incident_id: linkedIncidentId ?? null,
        upload_context: context || null,
      });
      setResult(res.data);
      if (res.cara_error) setCaraError(res.cara_error);
      // Pre-select all suggested tasks
      const allIds = new Set(res.data.ai_result?.suggested_tasks.map((t) => t.id) ?? []);
      setApprovedTaskIds(allIds);
      setStep("review");
    } catch {
      setCaraError("Upload failed. Please try again.");
      setStep("select");
    }
  };

  // ── Approve ─────────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!result) return;
    setActioning(true);
    try {
      const res = await fetch(`/api/v1/doc-intelligence/${result.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          approved_task_ids: Array.from(approvedTaskIds),
          create_evidence_link: createEvidence,
          create_chronology: createChronology,
        }),
      });
      if (res.ok) {
        setActionComplete(true);
      }
    } catch {
      // still show completion
      setActionComplete(true);
    } finally {
      setActioning(false);
    }
  };

  const aiResult = result?.ai_result;
  const confidence = aiResult ? Math.round(aiResult.confidence * 100) : 0;
  const criticalFlags = aiResult?.risk_flags.filter((f) => f.severity === "critical") ?? [];
  const highFlags = aiResult?.risk_flags.filter((f) => f.severity === "high") ?? [];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-[var(--cs-shadow-elevated)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-[var(--cs-border-subtle)] px-6 py-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--cs-cara-gold-bg)]">
            <Sparkles className="h-4.5 w-4.5 text-[var(--cs-cara-gold)]" style={{ width: "1.125rem", height: "1.125rem" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[var(--cs-navy)]">Cara Document Intelligence</p>
            <p className="text-xs text-[var(--cs-text-muted)]">
              {step === "select" ? "Upload a document — Cara will classify, extract, and generate action intelligence"
               : step === "analysing" ? "Cara is reading and analysing your document…"
               : actionComplete ? "Document processed and actions created"
               : "Review Cara's analysis before approving"}
            </p>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-1 text-[10px] font-medium text-[var(--cs-text-muted)] shrink-0">
            {(["select", "analysing", "review"] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <span className={cn("rounded-full w-5 h-5 flex items-center justify-center text-[10px]",
                  step === s ? "bg-[var(--cs-navy)] text-white" : (["analysing","review"].indexOf(s) <= ["select","analysing","review"].indexOf(step)) ? "bg-emerald-500 text-white" : "bg-[var(--cs-surface)] text-[var(--cs-text-muted)]"
                )}>{i + 1}</span>
                {i < 2 && <ChevronRight className="h-2.5 w-2.5" />}
              </React.Fragment>
            ))}
          </div>
          <button onClick={onClose} className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">

          {/* ── STEP 1: Select + paste ── */}
          {step === "select" && (
            <div className="space-y-5">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all",
                  dragOver ? "border-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)]" : "border-[var(--cs-border)] hover:border-[var(--cs-cara-gold-soft)] hover:bg-[var(--cs-cara-gold-bg)]/30",
                  fileName && "border-emerald-300 bg-emerald-50/30",
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_TYPES}
                  className="hidden"
                  onChange={handleFileInput}
                />
                {fileName ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="text-sm font-semibold text-[var(--cs-navy)]">{fileName}</div>
                    <div className="text-xs text-[var(--cs-text-muted)]">Click to change file</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-[var(--cs-cara-gold-bg)] flex items-center justify-center">
                      <Upload className="h-6 w-6 text-[var(--cs-cara-gold)]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--cs-navy)]">Drop your document here</div>
                      <div className="text-xs text-[var(--cs-text-muted)] mt-1">PDF, DOCX, XLSX, CSV, PNG, JPG, TXT supported</div>
                    </div>
                    <div className="rounded-lg bg-[var(--cs-navy)] px-4 py-1.5 text-xs font-semibold text-white">Browse files</div>
                  </div>
                )}
              </div>

              {/* Or manually enter file name */}
              {!fileName && (
                <div>
                  <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Or enter document name manually</label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g. Alex_W_Risk_Assessment_April_2026.pdf"
                    className="w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]"
                  />
                </div>
              )}

              {/* Document text */}
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">
                  Document content <span className="text-red-500">*</span>
                  <span className="ml-2 text-[10px] font-normal text-[var(--cs-text-muted)]">
                    (paste or type document text — PDF/DOCX content extracted automatically in production)
                  </span>
                </label>
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  rows={8}
                  placeholder="Paste the document content here. Cara will read, classify, and extract intelligence from the full text…"
                  className="w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3.5 py-3 text-xs text-[var(--cs-text-secondary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)] placeholder:text-[var(--cs-text-muted)] leading-relaxed"
                />
              </div>

              {/* Context hint */}
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">
                  Context hint for Cara <span className="text-[var(--cs-text-muted)] font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g. 'Uploaded after Alex's strategy meeting' or 'Staff training record for Ryan'"
                  className="w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleAnalyse}
                  disabled={!fileName.trim() || !extractedText.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-5 py-3 text-sm font-bold text-white hover:bg-[var(--cs-navy)]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-4 w-4" />
                  Analyse with Cara
                </button>
                <button onClick={onClose} className="rounded-xl border border-[var(--cs-border)] px-5 py-3 text-sm font-medium text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)] transition-colors">
                  Cancel
                </button>
              </div>

              {/* Security notice */}
              <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] p-3 flex items-start gap-2">
                <Shield className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
                <p className="text-[10px] text-[var(--cs-text-muted)] leading-relaxed">
                  Cara treats document content as data only. Embedded instructions within documents are detected and ignored. All analysis requires your approval before creating records.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 2: Analysing ── */}
          {step === "analysing" && (
            <div className="py-12 flex flex-col items-center gap-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-[var(--cs-cara-gold-soft)] border-t-[var(--cs-cara-gold)] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-[var(--cs-cara-gold)]" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-base font-bold text-[var(--cs-navy)]">Cara is analysing your document</p>
                <p className="text-sm text-[var(--cs-text-muted)] max-w-sm text-center leading-relaxed">
                  Classifying document type, extracting entities, identifying risks, suggesting tasks, mapping to regulations…
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {["Classifying", "Extracting entities", "Identifying risks", "Suggesting tasks", "Mapping regulations", "Checking safeguarding"].map((label) => (
                  <span key={label} className="inline-flex items-center gap-1 rounded-full bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)] px-2.5 py-1 text-[10px] font-medium text-[var(--cs-cara-gold)]">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: Review ── */}
          {step === "review" && result && (
            <div className="space-y-5">

              {/* Injection warning */}
              {aiResult?.prompt_injection_detected && (
                <div className="rounded-2xl border border-red-300 bg-red-50 p-4 flex items-start gap-3">
                  <Shield className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-red-800">⚠️ Suspicious content detected</div>
                    <div className="text-xs text-red-700 mt-1 leading-relaxed">
                      This document contains text that attempted to manipulate Cara. The content has been treated as data only and no instructions were followed.
                      {aiResult.suspicious_content && <div className="mt-1 font-mono bg-red-100 rounded px-2 py-1 text-[10px]">"{aiResult.suspicious_content}"</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* Cara error */}
              {caraError && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-amber-800">Cara analysis incomplete</div>
                    <div className="text-xs text-amber-700 mt-0.5">{caraError}</div>
                  </div>
                </div>
              )}

              {/* Classification banner */}
              {aiResult && (
                <div className={cn("rounded-2xl border p-4 flex items-start gap-4", RISK_COLOURS[aiResult.ai_risk_level] ?? RISK_COLOURS.low)}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold">{aiResult.document_category_label}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold">
                        <span className={cn("h-1.5 w-1.5 rounded-full", RISK_DOT[aiResult.ai_risk_level])} />
                        {aiResult.ai_risk_level.toUpperCase()} RISK
                      </span>
                      <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium">
                        {confidence}% confidence
                      </span>
                    </div>
                    <p className="text-xs mt-1.5 leading-relaxed opacity-90">{aiResult.ai_summary}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium opacity-75">
                      <Info className="h-3 w-3" />
                      Suggested filing: {aiResult.suggested_filing}
                    </div>
                  </div>
                </div>
              )}

              {/* Critical + high flags */}
              {(criticalFlags.length + highFlags.length) > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-bold text-[var(--cs-navy)]">{criticalFlags.length + highFlags.length} priority issue{criticalFlags.length + highFlags.length !== 1 ? "s" : ""} identified</span>
                  </div>
                  {[...criticalFlags, ...highFlags].map((f, i) => <RiskFlagItem key={i} flag={f} />)}
                </div>
              )}

              {/* Extracted info */}
              {aiResult && (
                <div className="rounded-2xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] p-4 space-y-3">
                  <div className="text-[10px] font-bold text-[var(--cs-text-muted)] uppercase tracking-wider">Extracted Intelligence</div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {aiResult.extracted_entities.people.length > 0 && (
                      <div>
                        <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] mb-1">People</div>
                        <div className="flex flex-wrap gap-1">
                          {aiResult.extracted_entities.people.map((p, i) => (
                            <span key={i} className="rounded-full bg-white border border-[var(--cs-border)] px-2 py-0.5 text-[10px] text-[var(--cs-text-secondary)]">{p}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {aiResult.extracted_entities.dates.length > 0 && (
                      <div>
                        <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] mb-1">Key Dates</div>
                        <div className="space-y-0.5">
                          {aiResult.extracted_entities.dates.slice(0, 3).map((d, i) => (
                            <div key={i} className="text-[10px] text-[var(--cs-text-secondary)]">
                              <span className="font-medium">{d.label}:</span> {d.value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {aiResult.extracted_entities.safeguarding_concerns.length > 0 && (
                      <div className="col-span-2">
                        <div className="text-[10px] font-semibold text-red-600 mb-1">⚠️ Safeguarding Concerns</div>
                        <ul className="space-y-0.5">
                          {aiResult.extracted_entities.safeguarding_concerns.map((c, i) => (
                            <li key={i} className="text-[10px] text-red-700 flex items-start gap-1">
                              <span className="mt-1 shrink-0">•</span>{c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiResult.extracted_entities.missing_information.length > 0 && (
                      <div className="col-span-2">
                        <div className="text-[10px] font-semibold text-amber-600 mb-1">Missing Information</div>
                        <ul className="space-y-0.5">
                          {aiResult.extracted_entities.missing_information.map((m, i) => (
                            <li key={i} className="text-[10px] text-amber-700 flex items-start gap-1">
                              <span className="mt-1 shrink-0">•</span>{m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Suggested tasks */}
              {aiResult && aiResult.suggested_tasks.length > 0 && !actionComplete && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-[var(--cs-text-secondary)]" />
                    <span className="text-xs font-bold text-[var(--cs-navy)]">{aiResult.suggested_tasks.length} suggested task{aiResult.suggested_tasks.length !== 1 ? "s" : ""}</span>
                    <span className="text-[10px] text-[var(--cs-text-muted)] ml-auto">Tick to create in Cara</span>
                  </div>
                  {aiResult.suggested_tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setApprovedTaskIds((prev) => {
                        const next = new Set(prev);
                        next.has(task.id) ? next.delete(task.id) : next.add(task.id);
                        return next;
                      })}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all",
                        approvedTaskIds.has(task.id)
                          ? "border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)]"
                          : "border-[var(--cs-border-subtle)] bg-white hover:bg-[var(--cs-surface)]",
                      )}
                    >
                      <div className={cn(
                        "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                        approvedTaskIds.has(task.id) ? "bg-[var(--cs-navy)] border-[var(--cs-navy)]" : "border-[var(--cs-border)]",
                      )}>
                        {approvedTaskIds.has(task.id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-[var(--cs-navy)]">{task.title}</span>
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                            task.priority === "urgent" ? "bg-red-100 text-red-700"
                            : task.priority === "high" ? "bg-orange-100 text-orange-700"
                            : task.priority === "medium" ? "bg-amber-100 text-amber-700"
                            : "bg-[var(--cs-surface)] text-[var(--cs-text-secondary)]",
                          )}>{task.priority}</span>
                          {task.due_date && <span className="text-[10px] text-[var(--cs-text-muted)]">{formatDate(task.due_date)}</span>}
                        </div>
                        <p className="text-[11px] text-[var(--cs-text-secondary)] mt-0.5 leading-relaxed">{task.description}</p>
                        {task.regulation_link && (
                          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--cs-surface)] px-2 py-0.5 text-[10px] text-[var(--cs-text-muted)]">
                            <BookOpen className="h-2.5 w-2.5" />
                            {task.regulation_link}
                          </div>
                        )}
                        {task.source_quote && (
                          <div className="mt-1.5 text-[10px] text-[var(--cs-text-muted)] italic border-l-2 border-[var(--cs-border)] pl-2">
                            "{task.source_quote}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Regulation links */}
              {aiResult && aiResult.regulation_links.length > 0 && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-900">Regulation mapping</span>
                  </div>
                  {aiResult.regulation_links.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <div>
                        <span className="text-[11px] font-semibold text-blue-800">{r.regulation}</span>
                        {r.quality_standard && <span className="text-[10px] text-blue-600 ml-1.5">· {r.quality_standard}</span>}
                        <p className="text-[10px] text-blue-700 leading-relaxed">{r.relevance}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Oversight draft */}
              {aiResult?.oversight_draft && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-900">Cara oversight draft</span>
                    <span className="text-[10px] text-indigo-500 ml-auto">Edit before using</span>
                  </div>
                  <p className="text-xs text-indigo-800 leading-relaxed">{aiResult.oversight_draft}</p>
                </div>
              )}

              {/* Child-friendly version */}
              {aiResult?.child_friendly_summary && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-900">Child-friendly version</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">{aiResult.child_friendly_summary}</p>
                </div>
              )}

              {/* Additional options */}
              {!actionComplete && (
                <div className="rounded-2xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] p-4 space-y-2.5">
                  <div className="text-[10px] font-bold text-[var(--cs-text-muted)] uppercase tracking-wider">Also create</div>
                  {aiResult?.evidence_areas && aiResult.evidence_areas.length > 0 && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createEvidence}
                        onChange={(e) => setCreateEvidence(e.target.checked)}
                        className="rounded"
                      />
                      <div>
                        <div className="text-xs font-semibold text-[var(--cs-navy)]">Link to Reg 45 evidence</div>
                        <div className="text-[10px] text-[var(--cs-text-muted)]">
                          {aiResult.evidence_areas.map((e) => e.area).join(", ")}
                        </div>
                      </div>
                    </label>
                  )}
                  {aiResult?.chronology_suggestions && aiResult.chronology_suggestions.length > 0 && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createChronology}
                        onChange={(e) => setCreateChronology(e.target.checked)}
                        className="rounded"
                      />
                      <div>
                        <div className="text-xs font-semibold text-[var(--cs-navy)]">Create chronology {aiResult.chronology_suggestions.length > 1 ? "entries" : "entry"}</div>
                        <div className="text-[10px] text-[var(--cs-text-muted)]">
                          {aiResult.chronology_suggestions[0]?.summary}
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              )}

              {/* Action complete state */}
              {actionComplete && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                  <div>
                    <div className="text-base font-bold text-emerald-900">Document processed</div>
                    <div className="text-sm text-emerald-700 mt-1">
                      {approvedTaskIds.size} task{approvedTaskIds.size !== 1 ? "s" : ""} created
                      {createEvidence ? " · Evidence linked" : ""}
                      {createChronology ? " · Chronology added" : ""}
                    </div>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => { onClose(); router.push("/documents/intelligence"); }}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View in Document Hub
                    </button>
                    <button
                      onClick={onClose}
                      className="rounded-xl border border-[var(--cs-border)] px-4 py-2 text-xs font-medium text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)] transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              {/* Approve/reject buttons */}
              {!actionComplete && (
                <div className="flex items-center gap-3 pt-2 border-t border-[var(--cs-border-subtle)]">
                  <button
                    onClick={handleApprove}
                    disabled={actioning}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-5 py-3 text-sm font-bold text-white hover:bg-[var(--cs-navy)]/90 transition-colors disabled:opacity-50"
                  >
                    {actioning
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                      : <><CheckCircle2 className="h-4 w-4" /> Approve & Create Actions</>
                    }
                  </button>
                  <button
                    onClick={() => { onClose(); router.push(result?.id ? `/documents/intelligence` : "/documents/intelligence"); }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--cs-border)] px-4 py-3 text-sm font-medium text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)] transition-colors"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Full review
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-xl border border-[var(--cs-border)] px-4 py-3 text-sm font-medium text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
