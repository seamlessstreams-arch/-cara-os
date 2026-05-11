"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA REFLECTIVE PRACTICE
// Staff-facing structured debrief tool. ARIA generates PACE-informed, trauma-
// informed reflective prompts across 8 headings. All output is for individual
// or team learning — not a child's formal record.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DictationButton } from "@/components/common/dictation-button";
import {
  useAriaAssessments,
  useCreateAriaAssessment,
} from "@/hooks/use-intelligence";
import { cn, formatDate } from "@/lib/utils";
import type { AriaAssessment } from "@/types/extended";
import {
  Brain, Sparkles, Loader2, AlertTriangle, CheckCircle2,
  Heart, Users, Lightbulb, HelpCircle, Star, Info,
  MessageSquare, Shield, User,
} from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import { useYoungPeople } from "@/hooks/use-young-people";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";

// ── Constants ─────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  { value: "incident",          label: "Incident / Physical Intervention" },
  { value: "missing_episode",   label: "Missing Episode" },
  { value: "difficult_session", label: "Difficult Key Work Session" },
  { value: "behaviour",         label: "Challenging Behaviour" },
  { value: "safeguarding",      label: "Safeguarding Concern" },
  { value: "family_contact",    label: "Difficult Family Contact" },
  { value: "near_miss",         label: "Near Miss" },
  { value: "positive_moment",   label: "Positive Moment (Celebratory Debrief)" },
  { value: "general",           label: "General Reflection" },
];

// ── Section colour config ─────────────────────────────────────────────────────

const SECTION_STYLES: Record<string, { border: string; bg: string; label: string; icon: React.ElementType }> = {
  "What happened":                      { border: "border-[var(--cs-border)]",   bg: "bg-slate-50",    label: "What happened",                      icon: MessageSquare },
  "What the child was communicating":   { border: "border-blue-200",    bg: "bg-blue-50/40",  label: "What the child was communicating",   icon: Heart },
  "How I responded":                    { border: "border-[var(--cs-aria-gold-soft)]",  bg: "bg-[var(--cs-aria-gold-bg)]/40",label: "How I responded",                    icon: User },
  "Was I regulated":                    { border: "border-amber-200",   bg: "bg-amber-50/40", label: "Was I regulated?",                   icon: Brain },
  "What went well":                     { border: "border-emerald-200", bg: "bg-emerald-50/40",label: "What went well",                    icon: Star },
  "What could I do differently":        { border: "border-orange-200",  bg: "bg-orange-50/40",label: "What could I do differently?",       icon: Lightbulb },
  "What support do I need":             { border: "border-pink-200",    bg: "bg-pink-50/40",  label: "What support do I need?",            icon: HelpCircle },
  "Learning to share with the team":    { border: "border-teal-200",    bg: "bg-teal-50/40",  label: "Learning to share with the team",    icon: Users },
};

// ── Text parser ───────────────────────────────────────────────────────────────
// Parses ARIA plain-text output (with **Heading** markers) into sections

function parseDebriefText(text: string): { heading: string; content: string }[] {
  const sections: { heading: string; content: string }[] = [];
  const parts = text.split(/\*\*([^*]+)\*\*/);
  // parts: [preamble, heading1, content1, heading2, content2, ...]
  for (let i = 1; i < parts.length; i += 2) {
    const heading = parts[i].trim();
    const content = (parts[i + 1] ?? "").trim();
    if (heading && content) sections.push({ heading, content });
  }
  return sections;
}

// ── Previous reflections list ─────────────────────────────────────────────────

function PreviousReflections({ childId }: { childId: string }) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const { data, isLoading } = useAriaAssessments({ childId: childId || undefined, homeId });
  const reflections: AriaAssessment[] = useMemo(
    () => (data?.data ?? []).filter((a) => a.assessment_type === "reflective_debrief"),
    [data]
  );

  if (isLoading) {
    return <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>;
  }
  if (reflections.length === 0) {
    return <p className="text-xs text-[var(--cs-text-muted)] text-center py-6">No previous reflections{childId ? " for this young person" : ""}</p>;
  }
  return (
    <div className="space-y-2">
      {reflections.map((r) => (
        <div key={r.id} className="rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50 p-3 space-y-1">
          <p className="text-[10px] text-[var(--cs-text-muted)]">{formatDate(r.created_at)}</p>
          <p className="text-xs text-[var(--cs-text-secondary)] line-clamp-3 leading-relaxed">{r.situation_summary}</p>
        </div>
      ))}
    </div>
  );
}

// ── Debrief section card ──────────────────────────────────────────────────────

function DebriefSection({ heading, content }: { heading: string; content: string }) {
  const style = SECTION_STYLES[heading] ?? { border: "border-[var(--cs-border)]", bg: "bg-slate-50", label: heading, icon: MessageSquare };
  const Icon = style.icon;
  return (
    <div className={cn("rounded-xl border p-4 space-y-2", style.border, style.bg)}>
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-secondary)]">
        <Icon className="h-3 w-3" />{style.label}
      </p>
      <p className="text-sm text-[var(--cs-navy)] leading-relaxed whitespace-pre-line">{content}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReflectivePracticePage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const ypQuery = useYoungPeople("current");
  const youngPeople = (ypQuery.data?.data ?? []).map(yp => ({ id: yp.id, name: yp.preferred_name ?? yp.first_name }));
  const [childId, setChildId]     = useState("");
  const [eventType, setEventType] = useState("incident");
  const [description, setDescription] = useState("");
  const [loading, setLoading]     = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [sections, setSections]   = useState<{ heading: string; content: string }[] | null>(null);
  const [rawText, setRawText]     = useState("");
  const [saving, setSaving]       = useState(false);
  const [savedOk, setSavedOk]     = useState(false);

  const createAssessment = useCreateAriaAssessment();

  const handleDictation = useCallback((text: string) => {
    setDescription((prev) => prev ? `${prev} ${text}` : text);
  }, []);

  // Pre-fill from query params (source_id passed by ARIAQuickActions "Reflective Debrief" button)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const c = p.get("child_id");
    const t = p.get("source_type");
    const sid = p.get("source_id");
    if (c) setChildId(c);
    if (t) setEventType(t === "incident" ? "incident" : t === "behaviour" ? "behaviour" : "general");

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
          setDescription([
            `Incident: ${String(record.type ?? "").replace(/_/g, " ")}`,
            `Date: ${record.date ?? ""} at ${record.time ?? ""}`,
            "",
            String(record.description ?? ""),
            record.immediate_action ? `Immediate action: ${record.immediate_action}` : "",
          ].filter(Boolean).join("\n").trim());
        } else {
          setDescription(String(record.content ?? ""));
        }
      } catch {
        // silent
      } finally {
        setPrefilling(false);
      }
    }
    void fetchContent();
  }, []);

  async function handleRun() {
    if (!description.trim()) {
      setError("Please describe the event or situation you want to reflect on.");
      return;
    }
    setLoading(true);
    setError(null);
    setSections(null);
    setRawText("");
    setSavedOk(false);

    try {
      const childName = youngPeople.find((y) => y.id === childId)?.name ?? "the young person";
      const res = await fetch("/api/v1/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "reflective_debrief",
          stream: false,
          source_content: description,
          prompt: `Generate a structured reflective practice debrief for a staff member. Event type: ${eventType}. Young person involved: ${childName}. Description: ${description}`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `ARIA returned ${res.status}`);
      }
      const json = await res.json();
      // reflective_debrief returns plain text (not JSON)
      const text: string = json?.data?.text ?? json?.data?.content ?? "";
      if (!text) throw new Error("ARIA did not return a response. Please try again.");
      setRawText(text);
      setSections(parseDebriefText(text));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!rawText) return;
    setSaving(true);
    try {
      const childName = youngPeople.find((y) => y.id === childId)?.name ?? "";
      const firstSection = sections?.[0]?.content ?? rawText.slice(0, 200);
      await createAssessment.mutateAsync({
        home_id: homeId,
        child_id: childId,
        source_record_type: eventType,
        assessment_type: "reflective_debrief",
        situation_summary: `Reflective debrief — ${EVENT_TYPES.find(e => e.value === eventType)?.label ?? eventType}${childName ? ` · ${childName}` : ""}. ${firstSection}`,
        risk_level: "not_identified",
        safeguarding_flags: [],
        protective_factors: [],
        emotional_needs: [],
        suggested_actions: [],
        confidence_level: "high",
        ai_generated_text: rawText,
        status: "draft",
        created_by: currentUser?.id ?? "staff_darren",
      });
      setSavedOk(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      title="Reflective Practice"
      subtitle="PACE-informed staff debrief — structured reflection to develop practice"
      showQuickCreate={false}
      actions={<SmartUploadButton variant="inline" label="Upload Reflection Notes" uploadContext="ARIA Intelligence — reflective practice notes or supervision document upload" />}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="grid gap-6 lg:grid-cols-3">

          {/* ── Left: form + results ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Form card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-teal-500" />
                  What are you reflecting on?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                  {/* Young person */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Young Person (optional)</label>
                    <select
                      value={childId}
                      onChange={(e) => setChildId(e.target.value)}
                      className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-teal-300"
                    >
                      <option value="">No specific young person</option>
                      {youngPeople.map((yp) => (
                        <option key={yp.id} value={yp.id}>{yp.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Event type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Type of Event</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-teal-300"
                    >
                      {EVENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[var(--cs-text-secondary)]">What happened — in your own words</label>
                    <div className="flex items-center gap-2">
                      {prefilling && (
                        <span className="flex items-center gap-1 text-[10px] text-teal-600">
                          <Loader2 className="h-3 w-3 animate-spin" />Loading record…
                        </span>
                      )}
                      <DictationButton onTranscript={handleDictation} size="sm" />
                    </div>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={9}
                    placeholder="Describe what happened in your own words. Include what the young person did, what you did, how you felt in the moment, and anything that surprised or challenged you. There is no right or wrong here — this is a safe space to reflect honestly."
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none leading-relaxed",
                      prefilling ? "border-teal-200 bg-teal-50/30" : "border-[var(--cs-border)] bg-white"
                    )}
                  />
                  <p className="text-[10px] text-[var(--cs-text-muted)]">{description.length} characters</p>
                </div>

                {/* Wellbeing notice */}
                <div className="rounded-xl border border-teal-100 bg-teal-50/40 px-3 py-2.5 flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-teal-700 leading-relaxed">
                    This reflection is for your professional development and team learning — not a performance review.
                    Be as honest as feels safe. If you are distressed, speak with your manager or use the supervision process.
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
                  disabled={loading || !description.trim()}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2 h-10"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Generating Reflective Debrief…</>
                  ) : (
                    <><Sparkles className="h-4 w-4" />Generate Reflective Debrief</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {sections && sections.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-teal-500" />
                    ARIA Reflective Debrief
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">

                  {sections.map((section, i) => (
                    <DebriefSection key={i} heading={section.heading} content={section.content} />
                  ))}

                  {/* Save / disclaimer */}
                  <div className="flex items-center gap-3 pt-2 border-t border-[var(--cs-border-subtle)]">
                    {savedOk ? (
                      <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                        <CheckCircle2 className="h-4 w-4" />Reflection saved to your record
                      </div>
                    ) : (
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Save Reflection
                      </Button>
                    )}
                    <p className="text-[10px] text-[var(--cs-text-muted)] italic">
                      ARIA-generated prompts. This does not become part of a child&apos;s record.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Right: guidance + previous ──────────────────────────────────── */}
          <div className="space-y-4">

            {/* Guidance */}
            <Card className="border-teal-100 bg-teal-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-teal-700 uppercase tracking-wider flex items-center gap-2">
                  <Info className="h-3.5 w-3.5" />About Reflective Practice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-[var(--cs-text-secondary)] leading-relaxed">
                <p>
                  Reflective practice is how skilled practitioners learn from experience —
                  especially the difficult, complex or unexpected moments.
                </p>
                <p>ARIA will structure your reflection across 8 headings:</p>
                <ul className="space-y-1">
                  {[
                    "What happened",
                    "What the child was communicating",
                    "How you responded",
                    "Were you regulated?",
                    "What went well",
                    "What could be different",
                    "What support you need",
                    "Team learning to share",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-[var(--cs-text-muted)] italic border-t border-teal-200 pt-2">
                  Using PACE principles: Playfulness, Acceptance, Curiosity, Empathy
                </p>
              </CardContent>
            </Card>

            {/* Previous reflections */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-[var(--cs-text-muted)]" />
                  Previous Reflections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PreviousReflections childId={childId} />
              </CardContent>
            </Card>

            {/* Wellbeing reminder */}
            <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4 space-y-2">
              <p className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" />Your Wellbeing Matters
              </p>
              <p className="text-[11px] text-rose-600 leading-relaxed">
                Working with children who have experienced trauma takes a toll.
                If you are struggling, please talk to your manager, use clinical supervision,
                or access your organisation&apos;s staff wellbeing support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
