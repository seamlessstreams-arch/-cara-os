"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — QUICK DAILY LOG FORM
// Demonstrates the "Record Once" pattern. Auto-fills child name, date, home,
// and recording staff. Progressive disclosure: essential fields first, with
// "Add more detail" expanding additional fields. Autosaves to localStorage.
// Estimated completion: under 60 seconds.
// CHR 2015 Reg 36 — Adequate records of the child's daily life.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EnterOnceIndicator } from "@/components/forms/enter-once-indicator";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Loader2,
  PartyPopper,
  Plus,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useRecordOnce } from "@/contexts/record-once-context";
import { SmartFormField } from "@/components/forms/smart-form-field";
import { ChildContextCard } from "@/components/forms/child-context-card";
import { InlineRelationalPanel } from "@/components/relational-timeline/inline-relational-panel";

// ── Types ────────────────────────────────────────────────────────────────────

interface DailyLogFormData {
  childName: string;
  date: string;
  time: string;
  home: string;
  staffName: string;
  mood: string;
  engagement: string;
  keyEvents: string;
  concerns: string;
  followUpNeeded: boolean;
  // Expanded fields
  sleepQuality: string;
  appetite: string;
  socialInteractions: string;
  educationNotes: string;
  positiveAchievement: string;
}

const INITIAL_FORM: DailyLogFormData = {
  childName: "",
  date: "",
  time: "",
  home: "",
  staffName: "",
  mood: "",
  engagement: "",
  keyEvents: "",
  concerns: "",
  followUpNeeded: false,
  sleepQuality: "",
  appetite: "",
  socialInteractions: "",
  educationNotes: "",
  positiveAchievement: "",
};

const DRAFT_KEY_PREFIX = "cs_daily_log_draft_";

// ── Mood picker ──────────────────────────────────────────────────────────────

const MOODS = [
  { value: "very_happy", emoji: "\u{1F60A}", label: "Very Happy" },
  { value: "happy", emoji: "\u{1F642}", label: "Happy" },
  { value: "neutral", emoji: "\u{1F610}", label: "Neutral" },
  { value: "low", emoji: "\u{1F614}", label: "Low" },
  { value: "upset", emoji: "\u{1F622}", label: "Upset" },
  { value: "angry", emoji: "\u{1F621}", label: "Angry" },
  { value: "anxious", emoji: "\u{1F630}", label: "Anxious" },
] as const;

// ── Engagement levels ────────────────────────────────────────────────────────

const ENGAGEMENT_LEVELS = [
  { value: "1", label: "1 - Disengaged" },
  { value: "2", label: "2 - Reluctant" },
  { value: "3", label: "3 - Moderate" },
  { value: "4", label: "4 - Engaged" },
  { value: "5", label: "5 - Fully Engaged" },
] as const;

// ── Component ────────────────────────────────────────────────────────────────

interface QuickDailyLogProps {
  childId: string;
  onSubmit?: (data: DailyLogFormData) => void;
  onCancel?: () => void;
  className?: string;
}

export function QuickDailyLog({
  childId,
  onSubmit,
  onCancel,
  className,
}: QuickDailyLogProps) {
  const { child, staff, today, currentTime, isLoading: contextLoading } = useRecordOnce();

  const [form, setForm] = useState<DailyLogFormData>(INITIAL_FORM);
  const [expanded, setExpanded] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const draftKey = `${DRAFT_KEY_PREFIX}${childId}`;
  const autosaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load draft from localStorage ──────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved) as DailyLogFormData;
        setForm(parsed);
        setIsDraft(true);
      }
    } catch {
      // Ignore parse errors
    }
  }, [draftKey]);

  // ── Auto-fill from context ────────────────────────────────────────
  useEffect(() => {
    if (!contextLoading) {
      setForm((prev) => ({
        ...prev,
        childName: prev.childName || child?.childName || "",
        date: prev.date || today,
        time: prev.time || currentTime,
        home: prev.home || child?.homeName || "",
        staffName: prev.staffName || staff?.staffName || "",
      }));
    }
  }, [contextLoading, child, staff, today, currentTime]);

  // ── Autosave every 5 seconds ──────────────────────────────────────
  useEffect(() => {
    autosaveRef.current = setInterval(() => {
      // Only save if user has entered something beyond auto-fill
      const hasContent = form.mood || form.keyEvents || form.concerns || form.engagement;
      if (hasContent && !submitted) {
        try {
          localStorage.setItem(draftKey, JSON.stringify(form));
          setIsDraft(true);
          setLastSaved(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
        } catch {
          // Storage full or unavailable
        }
      }
    }, 5000);
    return () => {
      if (autosaveRef.current) clearInterval(autosaveRef.current);
    };
  }, [form, draftKey, submitted]);

  // ── Update helpers ────────────────────────────────────────────────
  const updateField = useCallback(
    <K extends keyof DailyLogFormData>(key: K, value: DailyLogFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        onSubmit?.(form);
        // Clear draft
        localStorage.removeItem(draftKey);
        setSubmitted(true);
      } finally {
        setSubmitting(false);
      }
    },
    [form, onSubmit, draftKey],
  );

  // ── Reset for "Record another" ────────────────────────────────────
  const handleRecordAnother = useCallback(() => {
    setForm({
      ...INITIAL_FORM,
      childName: child?.childName || "",
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      home: child?.homeName || "",
      staffName: staff?.staffName || "",
    });
    setExpanded(false);
    setSubmitted(false);
    setIsDraft(false);
    setLastSaved(null);
  }, [child, staff]);

  // ── Validity check ────────────────────────────────────────────────
  const isValid = useMemo(
    () => !!form.mood && !!form.keyEvents.trim(),
    [form.mood, form.keyEvents],
  );

  // ── Success state ─────────────────────────────────────────────────
  if (submitted) {
    return (
      <Card className={cn("overflow-hidden border-emerald-200", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <PartyPopper className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--cs-navy)] mb-1">
            Daily Log Saved
          </h3>
          <p className="text-sm text-[var(--cs-text-muted)] mb-6">
            Entry recorded for {form.childName} on {form.date}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              Done
            </Button>
            <Button onClick={handleRecordAnother}>
              <Plus className="h-4 w-4" />
              Record Another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-4", className)}>
      {/* Child context card */}
      <ChildContextCard defaultExpanded={false} />

      {/* Point-of-work: this child's relationships, kept in view as the day is recorded */}
      <InlineRelationalPanel childId={childId} />

      <Card className="overflow-hidden border-[var(--cs-border)]">
        <CardHeader className="pb-3 bg-[var(--cs-surface)]/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-[var(--cs-text-secondary)]" />
              <span className="text-[var(--cs-navy)]">Quick Daily Log</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              {isDraft && (
                <Badge variant="warning" className="text-[10px]">
                  <Save className="h-2.5 w-2.5 mr-0.5" />
                  Draft{lastSaved ? ` (${lastSaved})` : ""}
                </Badge>
              )}
              <span className="text-[10px] text-[var(--cs-text-muted)] flex items-center gap-1">
                <Clock className="h-3 w-3" />
                ~60 seconds
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── Auto-filled header fields ──────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SmartFormField
                name="childName"
                label="Child"
                type="text"
                autoFillKey="childName"
                value={form.childName}
                onChange={(v) => updateField("childName", v)}
                disabled
                required
              />
              <SmartFormField
                name="date"
                label="Date"
                type="date"
                autoFillKey="date"
                value={form.date}
                onChange={(v) => updateField("date", v)}
                required
              />
              <SmartFormField
                name="home"
                label="Home"
                type="text"
                autoFillKey="homeName"
                value={form.home}
                onChange={(v) => updateField("home", v)}
                disabled
              />
              <SmartFormField
                name="staffName"
                label="Staff Member"
                type="text"
                autoFillKey="staffName"
                value={form.staffName}
                onChange={(v) => updateField("staffName", v)}
                disabled
              />
            </div>

            {/* ── Essential fields ────────────────────────────────────── */}

            {/* Mood picker */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--cs-navy)]">
                Mood <span className="text-[var(--cs-risk)]">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => updateField("mood", m.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-2 min-w-[56px] min-h-[48px] transition-all",
                      form.mood === m.value
                        ? "border-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)] shadow-sm"
                        : "border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] hover:border-[var(--cs-border-subtle)]",
                    )}
                  >
                    <span className="text-xl leading-none">{m.emoji}</span>
                    <span className="text-[10px] text-[var(--cs-text-muted)]">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Engagement */}
            <SmartFormField
              name="engagement"
              label="Engagement Level"
              type="select"
              value={form.engagement}
              onChange={(v) => updateField("engagement", v)}
              options={[...ENGAGEMENT_LEVELS]}
              placeholder="Select engagement level"
            />

            {/* Key events */}
            <div className="space-y-1.5">
              <label
                htmlFor="keyEvents"
                className="text-sm font-medium text-[var(--cs-navy)]"
              >
                Key Events <span className="text-[var(--cs-risk)]">*</span>
              </label>
              <Textarea
                id="keyEvents"
                value={form.keyEvents}
                onChange={(e) => updateField("keyEvents", e.target.value)}
                placeholder="What happened today? Key activities, interactions, notable moments..."
                rows={3}
                required
                className="min-h-[48px]"
              />
            </div>

            {/* Concerns */}
            <div className="space-y-1.5">
              <label
                htmlFor="concerns"
                className="text-sm font-medium text-[var(--cs-navy)]"
              >
                Concerns
              </label>
              <Textarea
                id="concerns"
                value={form.concerns}
                onChange={(e) => updateField("concerns", e.target.value)}
                placeholder="Any concerns or things to watch? Leave blank if none."
                rows={2}
                className="min-h-[48px]"
              />
            </div>

            {/* Follow-up toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={form.followUpNeeded}
                onClick={() => updateField("followUpNeeded", !form.followUpNeeded)}
                className={cn(
                  "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors min-h-[48px] min-w-[48px] items-center",
                  form.followUpNeeded
                    ? "bg-[var(--cs-warning)]"
                    : "bg-[var(--cs-border)]",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                    form.followUpNeeded ? "translate-x-6" : "translate-x-0.5",
                  )}
                />
              </button>
              <label className="text-sm text-[var(--cs-navy)]">
                Follow-up needed
              </label>
            </div>

            {/* ── Expanded fields ────────────────────────────────────── */}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-2 text-sm text-[var(--cs-info)] hover:underline"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4" /> Less detail
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" /> Add more detail
                </>
              )}
            </button>

            {expanded && (
              <div className="space-y-4 animate-[gentleFadeUp_0.2s_ease-out]">
                <SmartFormField
                  name="sleepQuality"
                  label="Sleep Quality"
                  type="select"
                  value={form.sleepQuality}
                  onChange={(v) => updateField("sleepQuality", v)}
                  options={[
                    { value: "good", label: "Good - Settled night" },
                    { value: "fair", label: "Fair - Some disturbance" },
                    { value: "poor", label: "Poor - Significant disturbance" },
                    { value: "not_observed", label: "Not observed" },
                  ]}
                  placeholder="Select sleep quality"
                />

                <SmartFormField
                  name="appetite"
                  label="Appetite"
                  type="select"
                  value={form.appetite}
                  onChange={(v) => updateField("appetite", v)}
                  options={[
                    { value: "good", label: "Good - Ate well" },
                    { value: "fair", label: "Fair - Picked at food" },
                    { value: "poor", label: "Poor - Refused / very little" },
                  ]}
                  placeholder="Select appetite"
                />

                <div className="space-y-1.5">
                  <label
                    htmlFor="socialInteractions"
                    className="text-sm font-medium text-[var(--cs-navy)]"
                  >
                    Social Interactions
                  </label>
                  <Textarea
                    id="socialInteractions"
                    value={form.socialInteractions}
                    onChange={(e) => updateField("socialInteractions", e.target.value)}
                    placeholder="How did they interact with peers and staff today?"
                    rows={2}
                    className="min-h-[48px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="educationNotes"
                    className="text-sm font-medium text-[var(--cs-navy)]"
                  >
                    Education Notes
                  </label>
                  <Textarea
                    id="educationNotes"
                    value={form.educationNotes}
                    onChange={(e) => updateField("educationNotes", e.target.value)}
                    placeholder="School attendance, homework, progress..."
                    rows={2}
                    className="min-h-[48px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="positiveAchievement"
                    className="text-sm font-medium text-[var(--cs-navy)]"
                  >
                    Positive Achievement
                  </label>
                  <Textarea
                    id="positiveAchievement"
                    value={form.positiveAchievement}
                    onChange={(e) => updateField("positiveAchievement", e.target.value)}
                    placeholder="Something positive to celebrate today..."
                    rows={2}
                    className="min-h-[48px]"
                  />
                </div>
              </div>
            )}

            {/* ── Enter Once indicator ──────────────────────────────── */}
            <EnterOnceIndicator recordType="daily_log" compact />

            {/* ── Sticky submit bar ──────────────────────────────────── */}
            <div className="sticky bottom-0 bg-[var(--cs-surface-elevated)] pt-3 pb-1 border-t border-[var(--cs-border-subtle)] -mx-6 px-6 flex items-center justify-between gap-3">
              {onCancel && (
                <Button type="button" variant="ghost" onClick={onCancel} className="min-h-[48px]">
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={!isValid || submitting}
                className="min-h-[48px] flex-1 max-w-xs ml-auto"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save Daily Log"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
