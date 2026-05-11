"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA MANAGEMENT OVERSIGHT GENERATOR
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DictationButton } from "@/components/common/dictation-button";
import {
  useCreateAriaOversight,
  useUpdateAriaOversight,
} from "@/hooks/use-intelligence";
import { useAuthContext } from "@/contexts/auth-context";
import { useYoungPeople } from "@/hooks/use-young-people";
import { cn } from "@/lib/utils";
import type { AriaOversightStyle } from "@/types/extended";
import {
  Sparkles, Loader2, AlertTriangle, CheckCircle2,
  ClipboardList, Edit3, Brain, Shield, Eye, FileText,
  TrendingUp, Target, BookOpen, Scale, ScanSearch,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import {
  generateManagementOversight,
  type RecordType as OversightRecordType,
  type ManagementOversightOutput,
} from "@/lib/intelligence/management-oversight";

// ── Constants ─────────────────────────────────────────────────────────────────

const RECORD_TYPES = [
  { value: "incident", label: "Incident Report" },
  { value: "physical_intervention", label: "Physical Intervention" },
  { value: "missing_from_care", label: "Missing from Care" },
  { value: "daily_log", label: "Daily Log" },
  { value: "medication_check", label: "Medication Check" },
  { value: "device_check", label: "Device Check" },
  { value: "room_check", label: "Room Check" },
  { value: "education_update", label: "Education Update" },
  { value: "complaint", label: "Complaint" },
  { value: "family_contact", label: "Family Contact" },
  { value: "safeguarding", label: "Safeguarding" },
  { value: "key_work", label: "Key Work Session" },
  { value: "staff_debrief", label: "Staff Debrief" },
  { value: "health_appointment", label: "Health Appointment" },
  { value: "behaviour", label: "Behaviour Note" },
];

const WRITING_STYLES: { value: AriaOversightStyle; label: string; description: string }[] = [
  { value: "professional_management", label: "Professional Management", description: "Formal management oversight language" },
  { value: "reflective_supervision", label: "Reflective Supervision", description: "Reflective, supervisory tone for staff development" },
  { value: "reg_45_evidence", label: "Reg 45 Evidence", description: "Structured for Regulation 45 visit reporting" },
  { value: "ofsted_ready", label: "Ofsted Ready", description: "Language and tone aligned with Ofsted inspection" },
  { value: "trauma_informed", label: "Trauma-Informed", description: "Trauma-informed perspective and language" },
  { value: "writing_to_child", label: "Writing to Child", description: "Accessible language, written to the child" },
  { value: "social_worker_update", label: "Social Worker Update", description: "Professional update for the child's social worker" },
  { value: "team_learning", label: "Team Learning", description: "Framed as a learning point for the whole staff team" },
];

// ── Parsed oversight structure ────────────────────────────────────────────────

interface ParsedOversight {
  summary?: string;
  quality_of_staff_response?: string;
  childs_emotional_presentation?: string;
  childs_voice?: string;
  risk_analysis?: string;
  safeguarding_consideration?: string;
  what_went_well?: string;
  what_could_improve?: string;
  follow_up_actions?: string[];
  learning_for_staff?: string;
  management_decision?: string;
}

// ── Status bar ────────────────────────────────────────────────────────────────

function StatusBar({ status }: { status: "draft" | "edit" | "approved" }) {
  const steps = ["Draft", "Edit", "Approve"];
  const idx = status === "draft" ? 0 : status === "edit" ? 1 : 2;
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <div className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
            i <= idx ? "bg-slate-900 text-white" : "bg-slate-100 text-[var(--cs-text-muted)]"
          )}>
            {i < idx && <CheckCircle2 className="h-3 w-3" />}
            {step}
          </div>
          {i < steps.length - 1 && (
            <div className={cn("h-px w-6 rounded", i < idx ? "bg-slate-900" : "bg-slate-200")} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Structured section ────────────────────────────────────────────────────────

function OversightSection({ title, content }: { title: string; content: string | undefined | null }) {
  if (!content) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">{title}</p>
      <p className="text-sm text-[var(--cs-navy)] leading-relaxed">{content}</p>
    </div>
  );
}

// ── Record type mapping (page types → engine types) ─────────────────────────

const RECORD_TYPE_MAP: Record<string, OversightRecordType> = {
  incident: "incident",
  physical_intervention: "incident",
  missing_from_care: "missing_from_care",
  daily_log: "daily_log",
  medication_check: "medication",
  device_check: "other",
  room_check: "room_search",
  education_update: "education",
  complaint: "complaint",
  family_contact: "family_time",
  safeguarding: "safeguarding",
  key_work: "key_work",
  staff_debrief: "shift_debrief",
  health_appointment: "health",
  behaviour: "other",
};

// ── Risk & judgement colours ────────────────────────────────────────────────

const RISK_CONFIG: Record<string, { label: string; colour: string; bg: string }> = {
  low:      { label: "Low",      colour: "text-emerald-700", bg: "bg-emerald-100" },
  medium:   { label: "Medium",   colour: "text-amber-700",   bg: "bg-amber-100" },
  high:     { label: "High",     colour: "text-orange-700",  bg: "bg-orange-100" },
  critical: { label: "Critical", colour: "text-red-700",     bg: "bg-red-100" },
};

const JUDGEMENT_CONFIG: Record<string, { label: string; colour: string; bg: string }> = {
  strong:               { label: "Strong",               colour: "text-emerald-700", bg: "bg-emerald-100" },
  adequate:             { label: "Adequate",             colour: "text-blue-700",    bg: "bg-blue-100" },
  unclear:              { label: "Unclear",              colour: "text-amber-700",   bg: "bg-amber-100" },
  requires_improvement: { label: "Requires Improvement", colour: "text-red-700",     bg: "bg-red-100" },
};

// ── Live Analysis Panel ─────────────────────────────────────────────────────

function LiveAnalysisPanel({ analysis }: { analysis: ManagementOversightOutput }) {
  const riskCfg = RISK_CONFIG[analysis.riskLevel] ?? RISK_CONFIG.low;
  const judgeCfg = JUDGEMENT_CONFIG[analysis.practiceJudgement] ?? JUDGEMENT_CONFIG.unclear;
  const scoreColour = analysis.qualityScore >= 80 ? "text-emerald-600" : analysis.qualityScore >= 60 ? "text-blue-600" : analysis.qualityScore >= 40 ? "text-amber-600" : "text-red-600";
  const progressColour = analysis.qualityScore >= 80 ? "[&>div]:bg-emerald-500" : analysis.qualityScore >= 60 ? "[&>div]:bg-blue-500" : analysis.qualityScore >= 40 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500";

  return (
    <Card className="border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)]/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold text-[var(--cs-aria-gold)] uppercase tracking-wider flex items-center gap-1.5">
          <ScanSearch className="h-3.5 w-3.5" />
          Live Record Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {/* Quality Score */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[var(--cs-text-secondary)] font-medium">Quality Score</span>
            <span className={cn("font-bold text-sm tabular-nums", scoreColour)}>{analysis.qualityScore}/100</span>
          </div>
          <Progress value={analysis.qualityScore} className={cn("h-2", progressColour)} />
        </div>

        {/* Risk & Judgement */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[var(--cs-border)] bg-white p-2 text-center">
            <div className="text-[10px] text-[var(--cs-text-muted)] mb-0.5">Risk Level</div>
            <Badge className={cn("text-[10px] rounded-full", riskCfg.bg, riskCfg.colour)}>{riskCfg.label}</Badge>
          </div>
          <div className="rounded-lg border border-[var(--cs-border)] bg-white p-2 text-center">
            <div className="text-[10px] text-[var(--cs-text-muted)] mb-0.5">Practice</div>
            <Badge className={cn("text-[10px] rounded-full", judgeCfg.bg, judgeCfg.colour)}>{judgeCfg.label}</Badge>
          </div>
        </div>

        {/* Evidence Indicators */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            {analysis.childVoiceVisible ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span className={analysis.childVoiceVisible ? "text-emerald-700" : "text-amber-700"}>
              Child&apos;s voice {analysis.childVoiceVisible ? "detected" : "not detected"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {analysis.planLinksVisible ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span className={analysis.planLinksVisible ? "text-emerald-700" : "text-amber-700"}>
              Plan links {analysis.planLinksVisible ? "detected" : "not detected"}
            </span>
          </div>
        </div>

        {/* Manager escalation */}
        {analysis.requiresManagerEscalation && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 flex items-start gap-2">
            <Shield className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
            <span className="text-red-700 font-medium">Manager escalation required</span>
          </div>
        )}

        {/* Strengths */}
        {analysis.strengths.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-1">Strengths</p>
            <ul className="space-y-1">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-emerald-700">
                  <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />{s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Evidence */}
        {analysis.missingEvidence.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-1">Recording Gaps</p>
            <ul className="space-y-1">
              {analysis.missingEvidence.map((m, i) => (
                <li key={i} className="flex items-start gap-1.5 text-amber-700">
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />{m}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested Actions */}
        {analysis.suggestedActions.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-1">Suggested Actions</p>
            <ul className="space-y-1.5">
              {analysis.suggestedActions.map((a, i) => (
                <li key={i} className="rounded-lg border border-[var(--cs-border)] bg-white p-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Target className="h-3 w-3 text-[var(--cs-aria-gold)]" />
                    <span className="font-semibold text-[var(--cs-navy)]">{a.title}</span>
                    <Badge className={cn("text-[9px] rounded-full ml-auto",
                      a.priority === "high" ? "bg-red-100 text-red-700" : a.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-[var(--cs-text-secondary)]"
                    )}>
                      {a.priority} · {a.dueInDays}d
                    </Badge>
                  </div>
                  <p className="text-[var(--cs-text-secondary)] leading-relaxed">{a.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Regulatory Links */}
        {analysis.regulatoryLinks.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-1">Regulatory Framework</p>
            <ul className="space-y-0.5">
              {analysis.regulatoryLinks.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[var(--cs-text-secondary)]">
                  <Scale className="h-3 w-3 shrink-0 mt-0.5 text-indigo-400" />{r}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-[10px] text-[var(--cs-text-muted)] italic border-t border-[var(--cs-aria-gold-soft)] pt-2">
          ARIA confidence: {Math.round(analysis.ariaConfidence * 100)}% · Analysis updates in real-time as you type
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

// Map short style slugs from query params to full AriaOversightStyle values
const STYLE_PARAM_MAP: Record<string, AriaOversightStyle> = {
  social_worker: "social_worker_update",
  regulation_45: "reg_45_evidence",
  reflective:    "reflective_supervision",
};

export default function OversightGeneratorPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const ypQuery = useYoungPeople("current");
  const youngPeople = (ypQuery.data?.data ?? []).map(yp => ({ id: yp.id, name: yp.preferred_name ?? yp.first_name }));
  const [childId, setChildId] = useState("");
  const [recordType, setRecordType] = useState("incident");
  const [writingStyle, setWritingStyle] = useState<AriaOversightStyle>("professional_management");

  const [recordContent, setRecordContent] = useState("");
  const [prefilling, setPrefilling] = useState(false);

  // Pre-fill from query params when navigated from a record's ARIA quick-actions
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const c = p.get("child_id");
    const t = p.get("source_type");
    const s = p.get("style");
    const sid = p.get("source_id");
    if (c) setChildId(c);
    if (t) setRecordType(t);
    if (s) setWritingStyle(STYLE_PARAM_MAP[s] ?? (s as AriaOversightStyle));

    // Fetch source record content
    if (!sid || !t) return;
    async function fetchContent() {
      setPrefilling(true);
      try {
        let url = "";
        if (t === "incident") url = `/api/v1/incidents/${sid}`;
        else if (t === "daily_log" || t === "behaviour") url = `/api/v1/daily-log/${sid}`;
        if (!url) return;
        const res = await fetch(url);
        if (!res.ok) return;
        const json = await res.json();
        const record = json?.data as Record<string, unknown> | undefined;
        if (!record) return;
        if (t === "incident") {
          setRecordContent(
            [
              `${String(record.reference ?? "")} — ${String(record.type ?? "").replace(/_/g, " ")}`,
              `Date: ${record.date ?? ""} at ${record.time ?? ""}`,
              "",
              String(record.description ?? ""),
              record.immediate_action ? `\nImmediate action: ${record.immediate_action}` : "",
            ].filter(Boolean).join("\n").trim()
          );
        } else {
          setRecordContent(
            [`${String(record.entry_type ?? "")} — ${record.date ?? ""}`, "", String(record.content ?? "")].join("\n").trim()
          );
        }
      } catch {
        // silent
      } finally {
        setPrefilling(false);
      }
    }
    void fetchContent();
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draftText, setDraftText] = useState("");
  const [editedText, setEditedText] = useState("");
  const [parsedResult, setParsedResult] = useState<ParsedOversight | null>(null);
  const [status, setStatus] = useState<"draft" | "edit" | "approved">("draft");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Live analysis (re-computes as user types) ───────────────────────────
  const liveAnalysis = useMemo<ManagementOversightOutput | null>(() => {
    const text = recordContent.trim();
    if (text.length < 20) return null;            // wait for meaningful content
    const childName =
      youngPeople.find((y) => y.id === childId)?.name ?? "the child";
    return generateManagementOversight({
      recordId: "live-preview",
      recordType: RECORD_TYPE_MAP[recordType] ?? "other",
      childName,
      recordText: text,
    });
  }, [recordContent, recordType, childId, youngPeople]);

  const createOversight = useCreateAriaOversight();
  const updateOversight = useUpdateAriaOversight();

  const handleDictation = useCallback((text: string) => {
    setRecordContent((prev) => prev ? `${prev} ${text}` : text);
  }, []);

  // Validate required fields
  function validate(): string | null {
    if (!childId) return "Please select a young person.";
    if (!recordContent.trim()) return "Please paste the record content.";
    return null;
  }

  async function handleGenerate() {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError(null);
    setParsedResult(null);
    setDraftText("");
    setEditedText("");
    setStatus("draft");
    setSavedId(null);

    try {
      const childName = youngPeople.find((y) => y.id === childId)?.name ?? "Unknown";
      const res = await fetch("/api/v1/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate_oversight",
          stream: false,
          source_content: recordContent,
          prompt: `Generate management oversight for this ${recordType} record for ${childName}. Style: ${writingStyle}. Structure the response as professional oversight commentary.`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `ARIA returned ${res.status}`);
      }

      const json = await res.json();
      const parsed = json?.data?.parsed;
      const responseText = json?.data?.response ?? "";

      if (parsed && typeof parsed === "object") {
        setParsedResult(parsed as ParsedOversight);
        const combined = Object.entries(parsed as ParsedOversight)
          .filter(([, v]) => v && typeof v === "string")
          .map(([k, v]) => `${k.replace(/_/g, " ").toUpperCase()}\n${v}`)
          .join("\n\n");
        setDraftText(combined);
        setEditedText(combined);
      } else {
        setDraftText(responseText);
        setEditedText(responseText);
      }
      setStatus("edit");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDraft() {
    setSaving(true);
    try {
      const res = await createOversight.mutateAsync({
        home_id: homeId,
        child_id: childId || undefined,
        record_type: recordType,
        oversight_style: writingStyle,
        ai_draft: draftText,
        edited_version: editedText !== draftText ? editedText : undefined,
        approval_status: "draft",
        manager_id: currentUser?.id ?? "staff_darren",
      });
      setSavedId((res as { data: { id: string } }).data?.id ?? null);
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    if (!savedId) {
      await handleSaveDraft();
      return;
    }
    setSaving(true);
    try {
      await updateOversight.mutateAsync({
        id: savedId,
        approval_status: "approved",
        final_version: editedText,
        approved_at: new Date().toISOString(),
        manager_id: currentUser?.id ?? "staff_darren",
      });
      setStatus("approved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      title="Management Oversight"
      subtitle="Generate professional oversight comments for any record"
      showQuickCreate={false}
      actions={<SmartUploadButton variant="inline" label="Upload Oversight Document" uploadContext="ARIA Intelligence — management oversight supporting document upload" />}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: form */}
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-emerald-500" />
                  Oversight Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Child selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Young Person</label>
                  <select
                    value={childId}
                    onChange={(e) => setChildId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  >
                    <option value="">Select young person (optional for home-level)</option>
                    {youngPeople.map((yp) => (
                      <option key={yp.id} value={yp.id}>{yp.name}</option>
                    ))}
                  </select>
                </div>

                {/* Record type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Record Type</label>
                  <select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value)}
                    className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  >
                    {RECORD_TYPES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {/* Writing style */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Writing Style</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {WRITING_STYLES.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setWritingStyle(style.value)}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-all",
                          writingStyle === style.value
                            ? "border-emerald-400 bg-emerald-50"
                            : "border-[var(--cs-border)] bg-white hover:border-slate-300"
                        )}
                      >
                        <div className="text-xs font-semibold text-[var(--cs-navy)]">{style.label}</div>
                        <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">{style.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Record content */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Record Content</label>
                    <div className="flex items-center gap-2">
                      {prefilling && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                          <Loader2 className="h-3 w-3 animate-spin" />Loading record…
                        </span>
                      )}
                      <DictationButton onTranscript={handleDictation} size="sm" />
                    </div>
                  </div>
                  <textarea
                    value={recordContent}
                    onChange={(e) => setRecordContent(e.target.value)}
                    rows={8}
                    placeholder="Paste the record content here — the incident, daily log entry, or other record you want oversight generated for."
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none leading-relaxed",
                      prefilling ? "border-emerald-200 bg-emerald-50/30" : "border-[var(--cs-border)] bg-white"
                    )}
                  />
                  {recordContent.length > 0 && !prefilling && (
                    <p className="text-[10px] text-emerald-600">
                      ✓ Record content loaded — review and add any additional context before generating
                    </p>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                    <AlertTriangle className="h-4 w-4 shrink-0" />{error}
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Generating Oversight…</>
                  ) : (
                    <><Sparkles className="h-4 w-4" />Generate Oversight</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {draftText && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Brain className="h-4 w-4 text-emerald-500" />
                      Generated Oversight
                    </CardTitle>
                    <StatusBar status={status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Labels */}
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)] px-2 py-0.5 text-[10px] font-medium">AI-generated</span>
                    {editedText !== draftText && (
                      <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-medium">Human-edited</span>
                    )}
                  </div>

                  {/* Structured sections */}
                  {parsedResult && (
                    <div className="space-y-4 border-b border-[var(--cs-border-subtle)] pb-5">
                      <OversightSection title="Summary" content={parsedResult.summary} />
                      <OversightSection title="Quality of Staff Response" content={parsedResult.quality_of_staff_response} />
                      <OversightSection title="Child's Emotional Presentation" content={parsedResult.childs_emotional_presentation} />
                      <OversightSection title="Child's Voice" content={parsedResult.childs_voice} />
                      <OversightSection title="Risk Analysis" content={parsedResult.risk_analysis} />
                      {parsedResult.safeguarding_consideration && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                          <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider mb-1">Safeguarding Consideration</p>
                          <p className="text-sm text-red-800">{parsedResult.safeguarding_consideration}</p>
                        </div>
                      )}
                      <OversightSection title="What Went Well" content={parsedResult.what_went_well} />
                      <OversightSection title="What Could Be Improved" content={parsedResult.what_could_improve} />
                      {parsedResult.follow_up_actions && parsedResult.follow_up_actions.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">Follow-up Actions</p>
                          <ul className="space-y-1">
                            {parsedResult.follow_up_actions.map((a, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-[var(--cs-navy)]">
                                <span className="text-[var(--cs-text-muted)] shrink-0 mt-0.5">{i + 1}.</span>{a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <OversightSection title="Learning for Staff" content={parsedResult.learning_for_staff} />
                      <OversightSection title="Management Decision" content={parsedResult.management_decision} />
                    </div>
                  )}

                  {/* Editable textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Edit3 className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
                      <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Edit Oversight Draft</label>
                    </div>
                    <textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      rows={12}
                      disabled={status === "approved"}
                      className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none leading-relaxed disabled:bg-slate-50 disabled:text-[var(--cs-text-muted)]"
                    />
                  </div>

                  {/* Action buttons */}
                  {status !== "approved" && (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={saving}
                        className="gap-2"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Save as Draft
                      </Button>
                      <Button
                        onClick={handleApprove}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Approve Oversight
                      </Button>
                    </div>
                  )}

                  {status === "approved" && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                      <CheckCircle2 className="h-4 w-4" />Oversight approved and saved
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: live analysis or guidance */}
          <div className="space-y-4">
            {liveAnalysis ? (
              <LiveAnalysisPanel analysis={liveAnalysis} />
            ) : (
              <Card className="border-emerald-100 bg-emerald-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">How it works</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-[var(--cs-text-secondary)] space-y-3 leading-relaxed">
                  <p>ARIA will generate structured management oversight commentary covering:</p>
                  <ul className="space-y-1 list-disc list-inside text-[var(--cs-text-secondary)]">
                    <li>Quality of staff response</li>
                    <li>Child&apos;s emotional presentation</li>
                    <li>Child&apos;s voice and views</li>
                    <li>Risk analysis</li>
                    <li>Safeguarding considerations</li>
                    <li>What went well / areas to improve</li>
                    <li>Follow-up actions</li>
                    <li>Learning for the team</li>
                  </ul>
                  <p className="text-[10px] text-[var(--cs-text-muted)] italic border-t border-emerald-200 pt-2">
                    Start typing or pasting a record to see live analysis. All oversight must be reviewed by a manager before approval.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
