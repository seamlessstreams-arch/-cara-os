"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA SITUATION REVIEW
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DictationButton } from "@/components/common/dictation-button";
import {
  useAriaAssessments,
  useCreateAriaAssessment,
} from "@/hooks/use-intelligence";
import { cn, formatDate } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { useYoungPeople } from "@/hooks/use-young-people";
import type { AriaAssessment, AriaRiskLevel, AriaConfidenceLevel, AriaRecommendedAction } from "@/types/extended";
import {
  Sparkles, Loader2, AlertTriangle, CheckCircle2, Shield,
  Brain, User, Info, Clock, MessageSquare, Heart,
  Zap, Target, ArrowUpCircle, BookOpen, Wrench,
} from "lucide-react";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";

// ── Constants ─────────────────────────────────────────────────────────────────

const SOURCE_TYPES = [
  { value: "daily_log", label: "Daily Log" },
  { value: "incident", label: "Incident Report" },
  { value: "missing_episode", label: "Missing Episode" },
  { value: "behaviour", label: "Behaviour Note" },
  { value: "family_contact", label: "Family Contact" },
  { value: "medication", label: "Medication Note" },
  { value: "uploaded_document", label: "Uploaded Document" },
  { value: "staff_summary", label: "Staff Summary" },
  { value: "voice_note", label: "Voice Note" },
  { value: "manager_observation", label: "Manager Observation" },
  { value: "free_text", label: "Free Text" },
];

// ── Risk / confidence helpers ─────────────────────────────────────────────────

const RISK_COLOURS: Record<AriaRiskLevel, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-slate-100 text-slate-700 border-slate-200",
  not_identified: "bg-green-100 text-green-700 border-green-200",
};

const CONFIDENCE_LABELS: Record<AriaConfidenceLevel, string> = {
  high: "High Confidence",
  possible: "Possible",
  needs_human_review: "Needs Human Review",
  insufficient_information: "Insufficient Information",
};

const PRIORITY_COLOURS: Record<string, string> = {
  urgent: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

// ── Parsed result shape (from ARIA JSON) ─────────────────────────────────────

interface ParsedSituationResult {
  // Core narrative headings
  situation_summary?: string;
  what_happened?: string;
  immediate_concern?: string;
  child_communication_through_behaviour?: string;
  known_triggers?: string;
  current_risks?: string;
  emotional_need_underneath?: string;
  child_voice_tells_us?: string;
  team_understanding?: string;
  // Action timeframes
  action_now?: string;
  action_24h?: string;
  action_72h?: string;
  // Escalation flags
  management_oversight_needed?: boolean;
  escalation_needed?: boolean;
  // Follow-up fields
  follow_up_key_work?: string;
  resources_needed?: string;
  // Risk / confidence
  risk_level?: AriaRiskLevel;
  confidence_level?: AriaConfidenceLevel;
  safeguarding_concern?: string;
  // Array outputs
  safeguarding_flags?: string[];
  protective_factors?: string[];
  protective_factors_list?: string[];
  emotional_needs?: string[];
  emotional_needs_list?: string[];
  suggested_actions?: AriaRecommendedAction[];
  ai_generated_text?: string;
}

// ── Reusable section card ─────────────────────────────────────────────────────

function SectionCard({
  label,
  icon: Icon,
  children,
  className,
}: {
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-slate-100 bg-white p-4 space-y-2", className)}>
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      {children}
    </div>
  );
}

// ── Previous assessments list ─────────────────────────────────────────────────

function PreviousAssessments({ childId }: { childId: string }) {
  const { data, isLoading } = useAriaAssessments({ childId });
  const assessments: AriaAssessment[] = useMemo(() => data?.data ?? [], [data]);

  if (!childId) {
    return (
      <div className="text-center py-8 text-xs text-slate-400">
        Select a young person to see previous assessments
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-slate-400">
        No previous assessments for this young person
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {assessments.map((a) => (
        <div key={a.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold border capitalize", RISK_COLOURS[a.risk_level])}>
              {a.risk_level.replace("_", " ")}
            </span>
            <span className="text-[10px] text-slate-500">{formatDate(a.created_at)}</span>
          </div>
          <p className="text-xs text-slate-700 line-clamp-2">{a.situation_summary}</p>
        </div>
      ))}
    </div>
  );
}

// ── Results panel ─────────────────────────────────────────────────────────────

function ResultsPanel({
  result,
  childId,
  sourceType,
  sourceContent,
  onSaved,
}: {
  result: ParsedSituationResult;
  childId: string;
  sourceType: string;
  sourceContent: string;
  onSaved: () => void;
}) {
  const createAssessment = useCreateAriaAssessment();
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const hasSafeguarding =
    (result.safeguarding_concern && result.safeguarding_concern.trim().length > 0) ||
    (result.safeguarding_flags && result.safeguarding_flags.length > 0);

  const protectiveFactors = result.protective_factors_list ?? result.protective_factors ?? [];
  const emotionalNeeds = result.emotional_needs_list ?? result.emotional_needs ?? [];

  async function handleSave() {
    setSaving(true);
    try {
      await createAssessment.mutateAsync({
        home_id: homeId,
        child_id: childId,
        source_record_type: sourceType,
        assessment_type: "situation_review",
        situation_summary: result.situation_summary ?? "",
        risk_level: result.risk_level ?? "not_identified",
        safeguarding_flags: result.safeguarding_flags ?? [],
        protective_factors: protectiveFactors,
        emotional_needs: emotionalNeeds,
        suggested_actions: result.suggested_actions ?? [],
        confidence_level: result.confidence_level ?? "needs_human_review",
        ai_generated_text: result.ai_generated_text ?? sourceContent,
        status: "draft",
        created_by: currentUser?.id ?? "staff_darren",
      });
      setSavedOk(true);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">

      {/* ── Escalation alert badges ───────────────────────────────────────────── */}
      {(result.escalation_needed || result.management_oversight_needed) && (
        <div className="flex flex-wrap gap-2">
          {result.escalation_needed && (
            <div className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 flex-1 min-w-0">
              <ArrowUpCircle className="h-4 w-4 text-red-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-red-800">Escalation Required</p>
                <p className="text-[10px] text-red-700">This situation requires immediate escalation. Contact your manager now.</p>
              </div>
            </div>
          )}
          {result.management_oversight_needed && (
            <div className="flex items-center gap-2 rounded-xl border border-orange-300 bg-orange-50 px-4 py-2.5 flex-1 min-w-0">
              <Zap className="h-4 w-4 text-orange-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-orange-800">Management Oversight Needed</p>
                <p className="text-[10px] text-orange-700">A manager should review this situation and provide oversight.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Safeguarding warning ──────────────────────────────────────────────── */}
      {hasSafeguarding && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Safeguarding consideration identified</p>
            <p className="text-xs text-red-700 mt-1">
              Please review immediately and follow your safeguarding procedure. This flag requires
              attention from your Designated Safeguarding Lead.
            </p>
            {result.safeguarding_concern && (
              <p className="text-xs text-red-700 mt-1 italic">{result.safeguarding_concern}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Risk + confidence badges ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {result.risk_level && (
          <span className={cn("rounded-full px-3 py-1 text-xs font-bold border capitalize", RISK_COLOURS[result.risk_level])}>
            {result.risk_level.replace(/_/g, " ")} Risk
          </span>
        )}
        {result.confidence_level && (
          <span className="rounded-full bg-violet-100 border border-violet-200 px-3 py-1 text-xs font-medium text-violet-700">
            {CONFIDENCE_LABELS[result.confidence_level]}
          </span>
        )}
      </div>

      {/* ── Situation summary ─────────────────────────────────────────────────── */}
      {result.situation_summary && (
        <SectionCard label="Situation Summary" icon={BookOpen} className="bg-slate-50 border-slate-200">
          <p className="text-sm text-slate-800 leading-relaxed">{result.situation_summary}</p>
        </SectionCard>
      )}

      {/* ── What happened ─────────────────────────────────────────────────────── */}
      {result.what_happened && (
        <SectionCard label="What Happened">
          <p className="text-sm text-slate-800 leading-relaxed">{result.what_happened}</p>
        </SectionCard>
      )}

      {/* ── Immediate concern ─────────────────────────────────────────────────── */}
      {result.immediate_concern && (
        <SectionCard label="Immediate Concern" icon={AlertTriangle} className="border-orange-100 bg-orange-50/40">
          <p className="text-sm text-orange-900 leading-relaxed">{result.immediate_concern}</p>
        </SectionCard>
      )}

      {/* ── Child's communication through behaviour ───────────────────────────── */}
      {result.child_communication_through_behaviour && (
        <SectionCard label="Child's Communication Through Behaviour" icon={MessageSquare} className="border-blue-100 bg-blue-50/30">
          <p className="text-sm text-slate-800 leading-relaxed">{result.child_communication_through_behaviour}</p>
          <p className="text-[10px] text-blue-600 italic">
            Behaviours are communication. This section explores what the young person may be expressing.
          </p>
        </SectionCard>
      )}

      {/* ── Known triggers ────────────────────────────────────────────────────── */}
      {result.known_triggers && (
        <SectionCard label="Known Triggers" icon={Target}>
          <p className="text-sm text-slate-800 leading-relaxed">{result.known_triggers}</p>
        </SectionCard>
      )}

      {/* ── Current risks ─────────────────────────────────────────────────────── */}
      {result.current_risks && (
        <SectionCard label="Current Risks" icon={Shield} className="border-amber-100 bg-amber-50/30">
          <p className="text-sm text-amber-900 leading-relaxed">{result.current_risks}</p>
        </SectionCard>
      )}

      {/* ── Emotional need underneath ─────────────────────────────────────────── */}
      {result.emotional_need_underneath && (
        <SectionCard label="Emotional Need Underneath" icon={Heart} className="border-violet-100 bg-violet-50/30">
          <p className="text-sm text-violet-900 leading-relaxed">{result.emotional_need_underneath}</p>
          <p className="text-[10px] text-violet-600 italic">
            The unmet emotional need that may be driving this situation.
          </p>
        </SectionCard>
      )}

      {/* ── Child voice ──────────────────────────────────────────────────────── */}
      {result.child_voice_tells_us && (
        <SectionCard label="What the Child's Voice Tells Us" icon={MessageSquare} className="border-blue-200 bg-blue-50/50">
          <blockquote className="border-l-4 border-blue-400 pl-4">
            <p className="text-sm text-blue-900 italic leading-relaxed">{result.child_voice_tells_us}</p>
          </blockquote>
        </SectionCard>
      )}

      {/* ── Team understanding ───────────────────────────────────────────────── */}
      {result.team_understanding && (
        <SectionCard label="Team Understanding">
          <p className="text-sm text-slate-800 leading-relaxed">{result.team_understanding}</p>
        </SectionCard>
      )}

      {/* ── Safeguarding flags (pills) ────────────────────────────────────────── */}
      {result.safeguarding_flags && result.safeguarding_flags.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <Shield className="h-3 w-3" />Safeguarding Flags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.safeguarding_flags.map((flag, i) => (
              <span key={i} className="flex items-center gap-1 rounded-full bg-red-100 border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700">
                <Shield className="h-3 w-3" />{flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Protective factors (pills) ────────────────────────────────────────── */}
      {protectiveFactors.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Protective Factors
          </p>
          <div className="flex flex-wrap gap-1.5">
            {protectiveFactors.map((f, i) => (
              <span key={i} className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Emotional needs (pills) ───────────────────────────────────────────── */}
      {emotionalNeeds.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Emotional Needs Identified
          </p>
          <div className="flex flex-wrap gap-1.5">
            {emotionalNeeds.map((n, i) => (
              <span key={i} className="rounded-full bg-violet-100 border border-violet-200 px-2.5 py-1 text-xs font-medium text-violet-700">
                {n}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── 3-column action timeline ──────────────────────────────────────────── */}
      {(result.action_now || result.action_24h || result.action_72h) && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <Clock className="h-3 w-3" />Action Timeline
          </p>
          <div className="grid grid-cols-3 gap-3">
            {result.action_now && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Now</p>
                <p className="text-xs text-red-900 leading-relaxed">{result.action_now}</p>
              </div>
            )}
            {result.action_24h && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">Within 24 Hours</p>
                <p className="text-xs text-orange-900 leading-relaxed">{result.action_24h}</p>
              </div>
            )}
            {result.action_72h && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Within 72 Hours</p>
                <p className="text-xs text-amber-900 leading-relaxed">{result.action_72h}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Follow-up key work ────────────────────────────────────────────────── */}
      {result.follow_up_key_work && (
        <SectionCard label="Follow-Up Key Work Suggested" icon={BookOpen}>
          <p className="text-sm text-slate-800 leading-relaxed">{result.follow_up_key_work}</p>
        </SectionCard>
      )}

      {/* ── Resources needed ─────────────────────────────────────────────────── */}
      {result.resources_needed && (
        <SectionCard label="Resources or Support Needed" icon={Wrench}>
          <p className="text-sm text-slate-800 leading-relaxed">{result.resources_needed}</p>
        </SectionCard>
      )}

      {/* ── Suggested actions ─────────────────────────────────────────────────── */}
      {result.suggested_actions && result.suggested_actions.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <Target className="h-3 w-3" />Suggested Actions
          </p>
          <div className="space-y-2">
            {result.suggested_actions.map((action, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold capitalize", PRIORITY_COLOURS[action.priority])}>
                    {action.priority}
                  </span>
                  <span className="text-xs font-semibold text-slate-900">{action.title}</span>
                </div>
                {action.why_this_matters && (
                  <p className="text-xs text-slate-600 leading-relaxed">{action.why_this_matters}</p>
                )}
                {action.assigned_role && (
                  <p className="text-[10px] text-slate-400">Assigned to: {action.assigned_role}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Save button ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
        {savedOk ? (
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
            <CheckCircle2 className="h-4 w-4" />Assessment saved successfully
          </div>
        ) : (
          <Button
            onClick={handleSave}
            disabled={saving || !childId}
            className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Save Assessment
          </Button>
        )}
        <p className="text-[10px] text-slate-400 italic">
          AI-generated analysis. Always subject to professional judgement.
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

// ── Record content formatter ───────────────────────────────────────────────────

function formatIncidentForAria(incident: Record<string, unknown>): string {
  const lines: string[] = [
    `INCIDENT REPORT — ${String(incident.type ?? "").replace(/_/g, " ").toUpperCase()}`,
    `Reference: ${incident.reference ?? ""}`,
    `Date: ${incident.date ?? ""} at ${incident.time ?? ""}`,
    incident.location ? `Location: ${incident.location}` : "",
    `Severity: ${incident.severity ?? ""}`,
    "",
    "DESCRIPTION:",
    String(incident.description ?? ""),
    "",
  ];
  if (incident.immediate_action) {
    lines.push("IMMEDIATE ACTION TAKEN:", String(incident.immediate_action), "");
  }
  if (incident.oversight_note) {
    lines.push("MANAGER OVERSIGHT NOTE:", String(incident.oversight_note), "");
  }
  return lines.filter((l) => l !== null).join("\n").trim();
}

function formatDailyLogForAria(entry: Record<string, unknown>): string {
  const lines: string[] = [
    `DAILY LOG ENTRY — ${String(entry.entry_type ?? "").toUpperCase()}`,
    `Date: ${entry.date ?? ""} at ${entry.time ?? ""}`,
    entry.mood_score !== null && entry.mood_score !== undefined
      ? `Mood score: ${entry.mood_score}/10`
      : "",
    entry.is_significant ? "⚠️ Marked as significant" : "",
    "",
    "OBSERVATION:",
    String(entry.content ?? ""),
  ];
  return lines.filter(Boolean).join("\n").trim();
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SituationReviewPage() {
  const ypQuery = useYoungPeople("current");
  const youngPeople = (ypQuery.data?.data ?? []).map(yp => ({ id: yp.id, name: yp.preferred_name ?? yp.first_name }));
  const [childId, setChildId] = useState("");
  const [sourceType, setSourceType] = useState("free_text");
  const [content, setContent] = useState("");
  const [prefilling, setPrefilling] = useState(false);

  // Pre-fill from query params when navigated from a record's ARIA quick-actions
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const c = p.get("child_id");
    const s = p.get("source_type");
    const sid = p.get("source_id");

    if (c) setChildId(c);
    if (s) setSourceType(s);

    // Fetch the linked record and pre-fill the textarea
    if (!sid || !s) return;

    async function fetchSourceContent() {
      setPrefilling(true);
      try {
        let url = "";
        if (s === "incident") url = `/api/v1/incidents/${sid}`;
        else if (s === "daily_log" || s === "behaviour") url = `/api/v1/daily-log/${sid}`;

        if (!url) return;

        const res = await fetch(url);
        if (!res.ok) return;
        const json = await res.json();
        const record = json?.data as Record<string, unknown> | undefined;
        if (!record) return;

        if (s === "incident") setContent(formatIncidentForAria(record));
        else if (s === "daily_log" || s === "behaviour") setContent(formatDailyLogForAria(record));
      } catch {
        // Silently fail — user can type manually
      } finally {
        setPrefilling(false);
      }
    }

    void fetchSourceContent();
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedSituationResult | null>(null);

  const handleDictation = useCallback((text: string) => {
    setContent((prev) => prev ? `${prev} ${text}` : text);
  }, []);

  async function handleRun() {
    if (!content.trim()) {
      setError("Please enter some situation information before running the review.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/v1/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "situation_review",
          stream: false,
          source_content: content,
          prompt: `Run a structured situation review for this information. Child: ${youngPeople.find((y) => y.id === childId)?.name ?? "Unknown"}. Source type: ${sourceType}.`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `ARIA returned ${res.status}`);
      }
      const json = await res.json();
      const parsed = json?.data?.parsed;
      if (!parsed || typeof parsed !== "object") {
        throw new Error("ARIA did not return a valid response. Please try again.");
      }
      setResult(parsed as ParsedSituationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      title="Situation Review"
      subtitle="AI-powered structured analysis of any situation"
      showQuickCreate={false}
      actions={<SmartUploadButton variant="inline" label="Upload Situation Evidence" uploadContext="ARIA Intelligence — situation review supporting evidence upload" />}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: form */}
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-violet-500" />
                  Situation Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Child selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Young Person</label>
                  <select
                    value={childId}
                    onChange={(e) => setChildId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
                  >
                    <option value="">Select young person</option>
                    {youngPeople.map((yp) => (
                      <option key={yp.id} value={yp.id}>{yp.name}</option>
                    ))}
                  </select>
                </div>

                {/* Source type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Source Type</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
                  >
                    {SOURCE_TYPES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Situation textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-600">Situation Information</label>
                    <div className="flex items-center gap-2">
                      {prefilling && (
                        <span className="flex items-center gap-1 text-[10px] text-violet-600">
                          <Loader2 className="h-3 w-3 animate-spin" />Loading record…
                        </span>
                      )}
                      <DictationButton onTranscript={handleDictation} size="sm" />
                    </div>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    placeholder="Enter or paste the situation information here. Include as much detail as possible — what happened, when, who was involved, context, staff observations, and any immediate actions taken."
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none leading-relaxed",
                      prefilling ? "border-violet-200 bg-violet-50/30" : "border-slate-200 bg-white"
                    )}
                  />
                  <p className="text-[10px] text-slate-400">
                    {content.length} characters
                    {content.length > 0 && !prefilling && (
                      <span className="text-violet-500 ml-2">· Record content loaded — add any additional context below</span>
                    )}
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                    <AlertTriangle className="h-4 w-4 shrink-0" />{error}
                  </div>
                )}

                {/* Run button */}
                <Button
                  onClick={handleRun}
                  disabled={loading || !content.trim()}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2 h-10"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Running Situation Review…</>
                  ) : (
                    <><Sparkles className="h-4 w-4" />Run Situation Review</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {result && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    ARIA Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResultsPanel
                    result={result}
                    childId={childId}
                    sourceType={sourceType}
                    sourceContent={content}
                    onSaved={() => {}}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: guidance + previous */}
          <div className="space-y-4">
            <Card className="border-violet-100 bg-violet-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-violet-700 uppercase tracking-wider flex items-center gap-2">
                  <Info className="h-3.5 w-3.5" />ARIA Guidance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p>ARIA produces a structured analysis across 18 headings:</p>
                <ul className="space-y-1 text-slate-600 text-[11px]">
                  {[
                    "Situation summary",
                    "What happened",
                    "Immediate concern",
                    "Communication through behaviour",
                    "Known triggers",
                    "Current risks",
                    "Emotional need underneath",
                    "What the child's voice tells us",
                    "Team understanding",
                    "Safeguarding flags",
                    "Protective factors",
                    "Emotional needs",
                    "Action now",
                    "Action within 24 hours",
                    "Action within 72 hours",
                    "Management oversight needed",
                    "Follow-up key work",
                    "Resources needed",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-slate-500 italic border-t border-violet-200 pt-2">
                  Provide as much detail as possible for the most accurate analysis.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  Previous Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PreviousAssessments childId={childId} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
