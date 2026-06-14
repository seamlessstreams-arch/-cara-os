"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — DOCUMENT INTELLIGENCE WIZARD
// Upload · Classify · Review · Place — powered by Cara
// ══════════════════════════════════════════════════════════════════════════════

import React, { useRef, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Upload, FileText, ClipboardList, FolderInput,
  CheckCircle2, AlertTriangle, AlertCircle, Users,
  CalendarDays, Tag, Lock, Sparkles, RotateCcw,
  ChevronRight, Loader2, FileUp, Info, X,
} from "lucide-react";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";

// ── Types ─────────────────────────────────────────────────────────────────────

type WizardStage = "upload" | "classifying" | "classified" | "form_created" | "saved";

interface ClassificationResult {
  document_type?: string;
  confidence_score?: number;
  suggested_module?: string;
  suggested_tags?: string[];
  confidentiality_level?: string;
  key_facts?: string[];
  key_dates?: string[];
  key_people?: string[];
  risks_identified?: string[];
  actions_identified?: string[];
  child_voice_present?: boolean;
  safeguarding_indicators?: string[];
  recommended_placement?: string;
  summary?: string;
}

interface FormResult {
  form_type?: string;
  title?: string;
  fields?: Record<string, string>;
  missing_fields?: string[];
  cara_notes?: string;
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = [
  { id: "upload",     label: "Upload",   icon: Upload },
  { id: "classifying", label: "Classify", icon: Sparkles },
  { id: "classified", label: "Review",   icon: ClipboardList },
  { id: "form_created", label: "Place",  icon: FolderInput },
] as const;

const STAGE_INDEX: Record<WizardStage, number> = {
  upload:      0,
  classifying: 1,
  classified:  2,
  form_created: 3,
  saved:       3,
};

function WizardStepBar({ stage }: { stage: WizardStage }) {
  const current = STAGE_INDEX[stage];
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map(({ id, label, icon: Icon }, idx) => {
        const done    = idx < current;
        const active  = idx === current;
        const last    = idx === STEPS.length - 1;
        return (
          <React.Fragment key={id}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all",
                  done   && "bg-[var(--cs-navy)] border-[var(--cs-navy)] text-white",
                  active && "bg-white border-[var(--cs-navy)] text-[var(--cs-cara-gold)]",
                  !done && !active && "bg-white border-[var(--cs-border)] text-[var(--cs-text-muted)]"
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-4.5 w-4.5" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold",
                  active ? "text-[var(--cs-cara-gold)]" : done ? "text-[var(--cs-cara-gold)]" : "text-[var(--cs-text-muted)]"
                )}
              >
                {idx + 1}. {label}
              </span>
            </div>
            {!last && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 mb-5 transition-all",
                  idx < current ? "bg-[var(--cs-cara-gold-bg)]0" : "bg-slate-200"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Pill / Badge helpers ──────────────────────────────────────────────────────

function TagPill({ label, color = "slate" }: { label: string; color?: string }) {
  const colors: Record<string, string> = {
    slate:  "bg-slate-100 text-[var(--cs-text-secondary)]",
    violet: "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)]",
    red:    "bg-red-100 text-red-700",
    amber:  "bg-amber-100 text-amber-700",
    emerald:"bg-emerald-100 text-emerald-700",
    blue:   "bg-blue-100 text-blue-700",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium", colors[color] ?? colors.slate)}>
      {label}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-1.5">
      {children}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DocumentWizardPage() {
  const [stage, setStage]               = useState<WizardStage>("upload");
  const [file, setFile]                 = useState<File | null>(null);
  const [pasteMode, setPasteMode]       = useState(false);
  const [pastedText, setPastedText]     = useState("");
  const [documentText, setDocumentText] = useState("");
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [formResult, setFormResult]     = useState<FormResult | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [saving, setSaving]             = useState(false);
  const [isDragOver, setIsDragOver]     = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const resetWizard = () => {
    setStage("upload");
    setFile(null);
    setPasteMode(false);
    setPastedText("");
    setDocumentText("");
    setClassification(null);
    setFormResult(null);
    setError(null);
  };

  const extractText = async (f: File): Promise<string> => {
    if (f.type === "text/plain") {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = (e) => resolve(e.target?.result as string ?? "");
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsText(f);
      });
    }
    // For PDF / DOCX / images — instruct user to paste text
    return "";
  };

  // ── Stage 1 → Stage 2/3 ───────────────────────────────────────────────────

  const handleAnalyse = async () => {
    setError(null);

    let text = pasteMode ? pastedText : documentText;

    // If a .txt file was selected and text wasn't extracted yet, do so now
    if (!pasteMode && file && !text) {
      text = await extractText(file);
      setDocumentText(text);
    }

    if (!text.trim()) {
      setError("Please provide the document text to analyse.");
      return;
    }

    setStage("classifying");

    try {
      const res = await fetch("/api/v1/cara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "document_classify", document_text: text, stream: false }),
      });

      if (!res.ok) throw new Error(`Cara returned ${res.status}`);

      const json = await res.json();
      // Cara route pre-parses JSON for document_classify — use parsed directly
      const parsed: ClassificationResult = json?.data?.parsed ?? { summary: json?.data?.response ?? "" };

      setClassification(parsed);
      setStage("classified");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cara could not classify the document.");
      setStage("upload");
    }
  };

  // ── Stage 3 → Stage 4 ─────────────────────────────────────────────────────

  const handleCreateForm = async () => {
    setError(null);
    const text = pasteMode ? pastedText : documentText;

    try {
      const res = await fetch("/api/v1/cara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "document_to_form", document_text: text, stream: false }),
      });

      if (!res.ok) throw new Error(`Cara returned ${res.status}`);

      const json = await res.json();
      // Cara route pre-parses JSON for document_to_form — use parsed directly
      const parsed: FormResult = json?.data?.parsed ?? { cara_notes: json?.data?.response ?? "" };

      setFormResult(parsed);
      setStage("form_created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cara could not create a form from this document.");
    }
  };

  // ── Save to queue ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await fetch("/api/v1/intelligence/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_filename: file?.name ?? "pasted-text",
          file_size_bytes: file?.size ?? null,
          extracted_text: pasteMode ? pastedText : documentText,
          classification,
          suggested_module: classification?.suggested_module ?? null,
          suggested_tags: classification?.suggested_tags ?? [],
          confidence_score: classification?.confidence_score ?? null,
        }),
      });
      setStage("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save document.");
    } finally {
      setSaving(false);
    }
  };

  // ── File drag/drop ────────────────────────────────────────────────────────

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;
    setFile(dropped);
    if (dropped.type === "text/plain") {
      const text = await extractText(dropped);
      setDocumentText(text);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    if (selected.type === "text/plain") {
      const text = await extractText(selected);
      setDocumentText(text);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Document Intelligence"
      subtitle="Upload · Classify · Place · Create"
      showQuickCreate={false}
      actions={<SmartUploadButton variant="inline" label="Upload Document" uploadContext="Document Intelligence — document for classification and placement" />}
    >
      <div className="max-w-2xl mx-auto">
        <WizardStepBar stage={stage} />

        {/* ── Stage 1: Upload ─────────────────────────────────────────────── */}
        {stage === "upload" && (
          <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-6 space-y-5 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Upload a document</h2>
              <p className="text-sm text-[var(--cs-text-muted)] mt-0.5">
                Cara will read, classify, and extract key information automatically.
              </p>
            </div>

            {!pasteMode ? (
              <>
                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-all",
                    isDragOver
                      ? "border-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)]"
                      : "border-[var(--cs-border)] bg-slate-50 hover:border-[var(--cs-cara-gold-soft)] hover:bg-[var(--cs-cara-gold-bg)]"
                  )}
                >
                  <div className="h-12 w-12 rounded-2xl bg-[var(--cs-cara-gold-bg)] flex items-center justify-center">
                    <FileUp className="h-6 w-6 text-[var(--cs-cara-gold)]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[var(--cs-text-secondary)]">
                      Drop a file here, or click to browse
                    </p>
                    <p className="text-xs text-[var(--cs-text-muted)] mt-0.5">
                      PDF, DOCX, TXT, JPG, PNG — up to 20 MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Selected file display */}
                {file && (
                  <div className="flex items-center justify-between rounded-xl border border-[var(--cs-border)] bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[var(--cs-cara-gold)] shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-[var(--cs-navy)]">{file.name}</p>
                        <p className="text-xs text-[var(--cs-text-muted)]">
                          {(file.size / 1024).toFixed(1)} KB · {file.type || "unknown type"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); setDocumentText(""); }}
                      className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* PDF / DOCX note */}
                {file && file.type !== "text/plain" && (
                  <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
                    <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800">
                      <span className="font-semibold">Text extraction note:</span> Server-side PDF/DOCX parsing isn&apos;t configured yet.
                      Please paste the text from your document below, or use the "Paste text instead" option.
                      <textarea
                        className="mt-2 w-full rounded-lg border border-amber-200 bg-white p-2.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-[var(--cs-text-muted)]"
                        rows={4}
                        placeholder="Paste the document text here..."
                        value={documentText}
                        onChange={(e) => setDocumentText(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setPasteMode(true)}
                  className="text-xs font-medium text-[var(--cs-cara-gold)] hover:text-[var(--cs-navy)] underline underline-offset-2 transition-colors"
                >
                  Paste text instead
                </button>
              </>
            ) : (
              <>
                {/* Paste mode */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block">
                    Paste document text
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-[var(--cs-border)] bg-slate-50 px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)] placeholder:text-[var(--cs-text-muted)] min-h-[180px]"
                    placeholder="Paste the text from your document here..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => { setPasteMode(false); setPastedText(""); }}
                  className="text-xs font-medium text-[var(--cs-cara-gold)] hover:text-[var(--cs-navy)] underline underline-offset-2 transition-colors"
                >
                  Upload a file instead
                </button>
              </>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              onClick={handleAnalyse}
              className="w-full bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white"
              disabled={
                (!pasteMode && !file && !documentText.trim()) ||
                (pasteMode && !pastedText.trim())
              }
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Analyse with Cara
            </Button>
          </div>
        )}

        {/* ── Stage 2: Classifying ─────────────────────────────────────────── */}
        {stage === "classifying" && (
          <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-white p-12 flex flex-col items-center justify-center gap-5 shadow-sm">
            <div className="h-16 w-16 rounded-2xl bg-[var(--cs-cara-gold-bg)] flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-[var(--cs-cara-gold)] animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-[var(--cs-navy)]">Cara is reading your document...</p>
              <p className="text-sm text-[var(--cs-text-muted)] mt-1">
                Classifying type · Extracting facts · Identifying risks
              </p>
            </div>
            <div className="flex gap-1.5">
              {["Classifying", "Extracting", "Analysing"].map((step, i) => (
                <Badge
                  key={step}
                  className={cn(
                    "text-[10px] rounded-full border-0 animate-pulse",
                    i === 0 && "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)]",
                    i === 1 && "bg-blue-100 text-blue-700",
                    i === 2 && "bg-emerald-100 text-emerald-700",
                  )}
                  style={{ animationDelay: `${i * 300}ms` }}
                >
                  {step}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* ── Stage 3: Classification result ──────────────────────────────── */}
        {stage === "classified" && classification && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-6 space-y-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--cs-navy)]">Classification result</h2>
                  <p className="text-sm text-[var(--cs-text-muted)] mt-0.5">Cara has read your document</p>
                </div>
                <Badge className="bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)] border-0 text-xs rounded-full">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Cara
                </Badge>
              </div>

              {/* Document type + confidence */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 border border-[var(--cs-border)] px-4 py-3">
                  <SectionLabel>Document type</SectionLabel>
                  <p className="text-sm font-bold text-[var(--cs-navy)]">
                    {classification.document_type ?? "Unknown"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-[var(--cs-border)] px-4 py-3">
                  <SectionLabel>Confidence</SectionLabel>
                  <p className="text-sm font-bold text-[var(--cs-navy)]">
                    {classification.confidence_score != null
                      ? `${Math.round(classification.confidence_score * 100)}%`
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Module + confidentiality */}
              <div className="grid grid-cols-2 gap-4">
                {classification.suggested_module && (
                  <div className="rounded-xl bg-slate-50 border border-[var(--cs-border)] px-4 py-3">
                    <SectionLabel>Suggested module</SectionLabel>
                    <TagPill label={classification.suggested_module} color="violet" />
                  </div>
                )}
                {classification.confidentiality_level && (
                  <div className="rounded-xl bg-slate-50 border border-[var(--cs-border)] px-4 py-3">
                    <SectionLabel>Confidentiality</SectionLabel>
                    <div className="flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
                      <span className="text-sm font-medium text-[var(--cs-text-secondary)]">
                        {classification.confidentiality_level}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {classification.suggested_tags && classification.suggested_tags.length > 0 && (
                <div>
                  <SectionLabel><Tag className="h-3 w-3 inline mr-1" />Suggested tags</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {classification.suggested_tags.map((tag) => (
                      <TagPill key={tag} label={tag} color="blue" />
                    ))}
                  </div>
                </div>
              )}

              {/* Key facts */}
              {classification.key_facts && classification.key_facts.length > 0 && (
                <div>
                  <SectionLabel>Key facts</SectionLabel>
                  <ul className="space-y-1.5">
                    {classification.key_facts.map((fact, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--cs-text-secondary)]">
                        <ChevronRight className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key dates */}
              {classification.key_dates && classification.key_dates.length > 0 && (
                <div>
                  <SectionLabel><CalendarDays className="h-3 w-3 inline mr-1" />Key dates</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {classification.key_dates.map((date) => (
                      <TagPill key={date} label={date} color="slate" />
                    ))}
                  </div>
                </div>
              )}

              {/* Key people */}
              {classification.key_people && classification.key_people.length > 0 && (
                <div>
                  <SectionLabel><Users className="h-3 w-3 inline mr-1" />Key people</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {classification.key_people.map((person) => (
                      <TagPill key={person} label={person} color="emerald" />
                    ))}
                  </div>
                </div>
              )}

              {/* Risks */}
              {classification.risks_identified && classification.risks_identified.length > 0 && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 space-y-2">
                  <SectionLabel><AlertTriangle className="h-3 w-3 inline mr-1 text-red-600" />Risks identified</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {classification.risks_identified.map((risk) => (
                      <TagPill key={risk} label={risk} color="red" />
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {classification.actions_identified && classification.actions_identified.length > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 space-y-2">
                  <SectionLabel>Actions identified</SectionLabel>
                  <ul className="space-y-1">
                    {classification.actions_identified.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Child voice + safeguarding */}
              <div className="grid grid-cols-2 gap-4">
                {classification.child_voice_present != null && (
                  <div className="rounded-xl bg-slate-50 border border-[var(--cs-border)] px-4 py-3">
                    <SectionLabel>Child voice present</SectionLabel>
                    <p className={cn("text-sm font-semibold", classification.child_voice_present ? "text-emerald-600" : "text-[var(--cs-text-muted)]")}>
                      {classification.child_voice_present ? "Yes" : "No"}
                    </p>
                  </div>
                )}
              </div>

              {classification.safeguarding_indicators && classification.safeguarding_indicators.length > 0 && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 space-y-2">
                  <SectionLabel><AlertTriangle className="h-3 w-3 inline mr-1 text-red-600" />Safeguarding indicators</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {classification.safeguarding_indicators.map((s) => (
                      <TagPill key={s} label={s} color="red" />
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended placement */}
              {classification.recommended_placement && (
                <div className="rounded-xl bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)] px-4 py-3">
                  <SectionLabel>Recommended placement</SectionLabel>
                  <p className="text-sm text-[var(--cs-text-secondary)]">{classification.recommended_placement}</p>
                </div>
              )}

              {/* Summary fallback */}
              {classification.summary && !classification.document_type && (
                <div className="rounded-xl bg-slate-50 border border-[var(--cs-border)] px-4 py-3">
                  <SectionLabel>Cara analysis</SectionLabel>
                  <p className="text-sm text-[var(--cs-text-secondary)] whitespace-pre-wrap">{classification.summary}</p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleCreateForm}
                  className="flex-1 bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Form from this document
                </Button>
                <button
                  onClick={resetWizard}
                  className="flex items-center gap-1.5 text-sm font-medium text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Start again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Stage 4: Form created ────────────────────────────────────────── */}
        {(stage === "form_created" || stage === "saved") && formResult && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-6 space-y-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--cs-navy)]">Extracted form</h2>
                  <p className="text-sm text-[var(--cs-text-muted)] mt-0.5">Review before saving to the queue</p>
                </div>
                {stage === "saved" && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-full">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Saved to queue
                  </Badge>
                )}
              </div>

              {/* Form type + title */}
              {(formResult.form_type || formResult.title) && (
                <div className="rounded-xl bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)] px-4 py-3">
                  <SectionLabel>Form type</SectionLabel>
                  <p className="text-sm font-bold text-[var(--cs-navy)]">{formResult.form_type ?? "—"}</p>
                  {formResult.title && (
                    <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">{formResult.title}</p>
                  )}
                </div>
              )}

              {/* Extracted fields */}
              {formResult.fields && Object.keys(formResult.fields).length > 0 && (
                <div>
                  <SectionLabel>Extracted fields</SectionLabel>
                  <div className="rounded-xl border border-[var(--cs-border)] divide-y divide-slate-100 overflow-hidden">
                    {Object.entries(formResult.fields).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-[160px_1fr] text-sm">
                        <div className="bg-slate-50 px-3 py-2.5 font-medium text-[var(--cs-text-secondary)] text-xs capitalize">
                          {key.replace(/_/g, " ")}
                        </div>
                        <div className="px-3 py-2.5 text-[var(--cs-navy)] text-xs">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing fields */}
              {formResult.missing_fields && formResult.missing_fields.length > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 space-y-2">
                  <SectionLabel>Missing fields</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {formResult.missing_fields.map((f) => (
                      <TagPill key={f} label={f} color="amber" />
                    ))}
                  </div>
                </div>
              )}

              {/* Cara notes */}
              {formResult.cara_notes && (
                <div className="rounded-xl bg-slate-50 border border-[var(--cs-border)] px-4 py-3">
                  <SectionLabel>Cara notes</SectionLabel>
                  <p className="text-xs text-[var(--cs-text-secondary)] whitespace-pre-wrap">{formResult.cara_notes}</p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {stage === "form_created" && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {saving ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                    ) : (
                      <><CheckCircle2 className="h-4 w-4 mr-2" />Save to queue</>
                    )}
                  </Button>
                  <button
                    onClick={resetWizard}
                    className="flex items-center gap-1.5 text-sm font-medium text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Start again
                  </button>
                </div>
              )}

              {stage === "saved" && (
                <button
                  onClick={resetWizard}
                  className="flex items-center gap-1.5 text-sm font-medium text-[var(--cs-cara-gold)] hover:text-[var(--cs-navy)] transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Process another document
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
