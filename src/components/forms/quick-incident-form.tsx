"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — QUICK INCIDENT FORM
// Calm, progressive incident recording for stressful situations.
// Auto-fills child name, date/time, location, recording staff.
// 5-step progressive flow. Large text, simple choices.
// Estimated completion: ~90 seconds.
// CHR 2015 Reg 40 — Notifiable events must be recorded and reported.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EnterOnceIndicator } from "@/components/forms/enter-once-indicator";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Loader2,
  Save,
  Shield,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useRecordOnce } from "@/contexts/record-once-context";
import { SmartFormField } from "@/components/forms/smart-form-field";
import { ChildContextCard } from "@/components/forms/child-context-card";

// ── Types ────────────────────────────────────────────────────────────────────

interface IncidentFormData {
  childName: string;
  date: string;
  time: string;
  location: string;
  recordingStaff: string;
  // Step 1
  description: string;
  // Step 2
  severity: string;
  // Step 3
  involvedPersons: string[];
  // Step 4
  immediateActions: string;
  // Step 5
  reviewNeeded: boolean;
  notifySafeguarding: boolean;
  additionalNotes: string;
}

const INITIAL_FORM: IncidentFormData = {
  childName: "",
  date: "",
  time: "",
  location: "",
  recordingStaff: "",
  description: "",
  severity: "",
  involvedPersons: [],
  immediateActions: "",
  reviewNeeded: false,
  notifySafeguarding: false,
  additionalNotes: "",
};

const DRAFT_KEY_PREFIX = "cs_incident_draft_";

// ── Severity options ─────────────────────────────────────────────────────────

const SEVERITIES = [
  {
    value: "low",
    label: "Low",
    description: "Minor event, no injury or risk",
    color: "border-green-300 bg-green-50 text-green-800",
    activeColor: "border-green-500 bg-green-100 ring-2 ring-green-300",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Some concern, needs monitoring",
    color: "border-amber-300 bg-amber-50 text-amber-800",
    activeColor: "border-amber-500 bg-amber-100 ring-2 ring-amber-300",
  },
  {
    value: "high",
    label: "High",
    description: "Significant concern, action required",
    color: "border-red-300 bg-red-50 text-red-800",
    activeColor: "border-red-500 bg-red-100 ring-2 ring-red-300",
  },
  {
    value: "critical",
    label: "Critical",
    description: "Immediate safeguarding action",
    color: "border-red-400 bg-red-100 text-red-900",
    activeColor: "border-red-600 bg-red-200 ring-2 ring-red-400",
  },
] as const;

// ── Involved persons presets ─────────────────────────────────────────────────

const INVOLVED_PRESETS = [
  "Other young person in home",
  "Staff member",
  "Family member",
  "Member of public",
  "Police",
  "Ambulance / medical",
  "School staff",
  "Other professional",
] as const;

// ── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { title: "What happened?", icon: "description" },
  { title: "Severity", icon: "severity" },
  { title: "Who was involved?", icon: "people" },
  { title: "Immediate actions", icon: "actions" },
  { title: "Review needed?", icon: "review" },
] as const;

// ── Component ────────────────────────────────────────────────────────────────

interface QuickIncidentFormProps {
  childId: string;
  onSubmit?: (data: IncidentFormData) => void;
  onCancel?: () => void;
  className?: string;
}

export function QuickIncidentForm({
  childId,
  onSubmit,
  onCancel,
  className,
}: QuickIncidentFormProps) {
  const { child, staff, today, currentTime, isLoading: contextLoading } = useRecordOnce();

  const [form, setForm] = useState<IncidentFormData>(INITIAL_FORM);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDraft, setIsDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const draftKey = `${DRAFT_KEY_PREFIX}${childId}`;
  const autosaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load draft ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved) as IncidentFormData;
        setForm(parsed);
        setIsDraft(true);
      }
    } catch {
      // Ignore
    }
  }, [draftKey]);

  // ── Auto-fill ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!contextLoading) {
      setForm((prev) => ({
        ...prev,
        childName: prev.childName || child?.childName || "",
        date: prev.date || today,
        time: prev.time || currentTime,
        location: prev.location || child?.homeName || "",
        recordingStaff: prev.recordingStaff || staff?.staffName || "",
      }));
    }
  }, [contextLoading, child, staff, today, currentTime]);

  // ── Autosave every 5 seconds ──────────────────────────────────────
  useEffect(() => {
    autosaveRef.current = setInterval(() => {
      const hasContent = form.description || form.severity || form.immediateActions;
      if (hasContent && !submitted) {
        try {
          localStorage.setItem(draftKey, JSON.stringify(form));
          setIsDraft(true);
          setLastSaved(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
        } catch {
          // Storage unavailable
        }
      }
    }, 5000);
    return () => {
      if (autosaveRef.current) clearInterval(autosaveRef.current);
    };
  }, [form, draftKey, submitted]);

  // ── Update helper ─────────────────────────────────────────────────
  const updateField = useCallback(
    <K extends keyof IncidentFormData>(key: K, value: IncidentFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const toggleInvolvedPerson = useCallback((person: string) => {
    setForm((prev) => ({
      ...prev,
      involvedPersons: prev.involvedPersons.includes(person)
        ? prev.involvedPersons.filter((p) => p !== person)
        : [...prev.involvedPersons, person],
    }));
  }, []);

  // ── Step navigation ───────────────────────────────────────────────
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: return !!form.description.trim();
      case 1: return !!form.severity;
      case 2: return true; // Involved persons optional
      case 3: return !!form.immediateActions.trim();
      case 4: return true;
      default: return false;
    }
  }, [currentStep, form]);

  const goNext = useCallback(() => {
    if (currentStep < STEPS.length - 1 && canProceed) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, canProceed]);

  const goBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      onSubmit?.(form);
      localStorage.removeItem(draftKey);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }, [form, onSubmit, draftKey]);

  // ── Reset ─────────────────────────────────────────────────────────
  const handleRecordAnother = useCallback(() => {
    setForm({
      ...INITIAL_FORM,
      childName: child?.childName || "",
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      location: child?.homeName || "",
      recordingStaff: staff?.staffName || "",
    });
    setCurrentStep(0);
    setSubmitted(false);
    setIsDraft(false);
    setLastSaved(null);
  }, [child, staff]);

  // Is this high/critical severity?
  const isHighSeverity = form.severity === "high" || form.severity === "critical";

  // ── Success state ─────────────────────────────────────────────────
  if (submitted) {
    return (
      <Card className={cn("overflow-hidden", isHighSeverity ? "border-red-200" : "border-emerald-200", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className={cn(
            "h-16 w-16 rounded-full flex items-center justify-center mb-4",
            isHighSeverity ? "bg-red-100" : "bg-emerald-100",
          )}>
            <Check className={cn("h-8 w-8", isHighSeverity ? "text-red-600" : "text-emerald-600")} />
          </div>
          <h3 className="text-lg font-semibold text-[var(--cs-navy)] mb-1">
            Incident Recorded
          </h3>
          <p className="text-sm text-[var(--cs-text-muted)] mb-2">
            {form.severity === "critical" || form.severity === "high"
              ? "This incident has been flagged for immediate review."
              : `Incident recorded for ${form.childName}.`}
          </p>

          {/* Safeguarding escalation path */}
          {isHighSeverity && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 mb-6 max-w-sm">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-red-800">Safeguarding Escalation</p>
                  <ul className="text-xs text-red-700 mt-1 space-y-1">
                    <li>Notify Registered Manager immediately</li>
                    <li>Contact local authority designated officer if needed</li>
                    <li>Complete Ofsted notification within required timeframe</li>
                    {form.severity === "critical" && (
                      <li className="font-semibold">Contact emergency services if not already done</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              Done
            </Button>
            <Button onClick={handleRecordAnother}>
              Record Another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Step progress indicator ───────────────────────────────────────
  const progressPercent = ((currentStep + 1) / STEPS.length) * 100;

  // ── Form ──────────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-4", className)}>
      <ChildContextCard defaultExpanded={false} />

      <Card className="overflow-hidden border-[var(--cs-border)]">
        <CardHeader className="pb-3 bg-[var(--cs-surface)]/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-[var(--cs-navy)]">Record Incident</span>
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
                ~90 seconds
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] text-[var(--cs-text-muted)] mb-1">
              <span>Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--cs-surface)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--cs-aria-gold)] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* ── Auto-filled header (compact) ─────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
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
              name="time"
              label="Time"
              type="time"
              autoFillKey="time"
              value={form.time}
              onChange={(v) => updateField("time", v)}
              required
            />
            <SmartFormField
              name="location"
              label="Location"
              type="text"
              autoFillKey="homeName"
              value={form.location}
              onChange={(v) => updateField("location", v)}
            />
            <SmartFormField
              name="recordingStaff"
              label="Recording Staff"
              type="text"
              autoFillKey="staffName"
              value={form.recordingStaff}
              onChange={(v) => updateField("recordingStaff", v)}
              disabled
              className="col-span-2"
            />
          </div>

          {/* ── Step content ──────────────────────────────────────────── */}
          <div className="min-h-[200px]">
            {/* Step 1: What happened? */}
            {currentStep === 0 && (
              <div className="space-y-2 animate-[gentleFadeUp_0.2s_ease-out]">
                <label
                  htmlFor="description"
                  className="text-base font-semibold text-[var(--cs-navy)]"
                >
                  What happened?
                </label>
                <p className="text-sm text-[var(--cs-text-muted)]">
                  Describe the incident in your own words. Stick to facts.
                </p>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe what happened, when, and where..."
                  rows={5}
                  required
                  className="text-base min-h-[120px]"
                  autoFocus
                />
              </div>
            )}

            {/* Step 2: Severity */}
            {currentStep === 1 && (
              <div className="space-y-3 animate-[gentleFadeUp_0.2s_ease-out]">
                <label className="text-base font-semibold text-[var(--cs-navy)]">
                  How severe was this?
                </label>
                <p className="text-sm text-[var(--cs-text-muted)]">
                  Tap the level that best describes the severity.
                </p>
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => updateField("severity", s.value)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border-2 px-4 py-3 min-h-[48px] text-left transition-all",
                        form.severity === s.value ? s.activeColor : s.color,
                      )}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{s.label}</p>
                        <p className="text-xs opacity-80">{s.description}</p>
                      </div>
                      {form.severity === s.value && (
                        <Check className="h-5 w-5 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Critical/high severity warning */}
                {isHighSeverity && (
                  <div className="rounded-xl border-2 border-red-200 bg-red-50 p-3 mt-2">
                    <div className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-800">
                          Safeguarding alert
                        </p>
                        <p className="text-xs text-red-700 mt-0.5">
                          This severity level will trigger safeguarding notifications.
                          Continue recording -- the system will guide you through next steps after submission.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Who was involved? */}
            {currentStep === 2 && (
              <div className="space-y-3 animate-[gentleFadeUp_0.2s_ease-out]">
                <label className="text-base font-semibold text-[var(--cs-navy)]">
                  Who else was involved?
                </label>
                <p className="text-sm text-[var(--cs-text-muted)]">
                  Select all that apply. You can skip if nobody else was involved.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {INVOLVED_PRESETS.map((person) => (
                    <button
                      key={person}
                      type="button"
                      onClick={() => toggleInvolvedPerson(person)}
                      className={cn(
                        "rounded-xl border-2 px-4 py-2 min-h-[48px] text-sm transition-all",
                        form.involvedPersons.includes(person)
                          ? "border-[var(--cs-aria-gold)] bg-[var(--cs-aria-gold-bg)] text-[var(--cs-navy)] font-medium"
                          : "border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] text-[var(--cs-text-secondary)] hover:border-[var(--cs-border-subtle)]",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {person}
                        {form.involvedPersons.includes(person) && (
                          <Check className="h-4 w-4" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Immediate actions */}
            {currentStep === 3 && (
              <div className="space-y-2 animate-[gentleFadeUp_0.2s_ease-out]">
                <label
                  htmlFor="immediateActions"
                  className="text-base font-semibold text-[var(--cs-navy)]"
                >
                  What actions were taken?
                </label>
                <p className="text-sm text-[var(--cs-text-muted)]">
                  Describe what you did immediately in response.
                </p>
                <Textarea
                  id="immediateActions"
                  value={form.immediateActions}
                  onChange={(e) => updateField("immediateActions", e.target.value)}
                  placeholder="What did you do? E.g. separated young people, called for support, administered first aid..."
                  rows={4}
                  required
                  className="text-base min-h-[100px]"
                  autoFocus
                />
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-[gentleFadeUp_0.2s_ease-out]">
                <label className="text-base font-semibold text-[var(--cs-navy)]">
                  Does this need further review?
                </label>

                {/* Review toggle */}
                <div className="flex items-center gap-3 min-h-[48px]">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.reviewNeeded}
                    onClick={() => updateField("reviewNeeded", !form.reviewNeeded)}
                    className={cn(
                      "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors items-center",
                      form.reviewNeeded
                        ? "bg-[var(--cs-warning)]"
                        : "bg-[var(--cs-border)]",
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                        form.reviewNeeded ? "translate-x-6" : "translate-x-0.5",
                      )}
                    />
                  </button>
                  <span className="text-sm text-[var(--cs-navy)]">
                    Manager review needed
                  </span>
                </div>

                {/* Safeguarding notification toggle (auto-on for high/critical) */}
                <div className="flex items-center gap-3 min-h-[48px]">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.notifySafeguarding || isHighSeverity}
                    onClick={() => {
                      if (!isHighSeverity) {
                        updateField("notifySafeguarding", !form.notifySafeguarding);
                      }
                    }}
                    className={cn(
                      "relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors items-center",
                      isHighSeverity ? "cursor-not-allowed" : "cursor-pointer",
                      form.notifySafeguarding || isHighSeverity
                        ? "bg-red-500"
                        : "bg-[var(--cs-border)]",
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                        form.notifySafeguarding || isHighSeverity
                          ? "translate-x-6"
                          : "translate-x-0.5",
                      )}
                    />
                  </button>
                  <span className="text-sm text-[var(--cs-navy)]">
                    Notify safeguarding lead
                    {isHighSeverity && (
                      <span className="text-xs text-red-600 ml-1">(required for this severity)</span>
                    )}
                  </span>
                </div>

                {/* Additional notes */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="additionalNotes"
                    className="text-sm font-medium text-[var(--cs-navy)]"
                  >
                    Additional Notes (optional)
                  </label>
                  <Textarea
                    id="additionalNotes"
                    value={form.additionalNotes}
                    onChange={(e) => updateField("additionalNotes", e.target.value)}
                    placeholder="Any other information or context..."
                    rows={2}
                    className="min-h-[48px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Enter Once indicator (final step only) ────────────────── */}
          {currentStep === STEPS.length - 1 && (
            <EnterOnceIndicator recordType="incident" severity={form.severity} compact />
          )}

          {/* ── Step navigation ───────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--cs-border-subtle)]">
            <Button
              type="button"
              variant="ghost"
              onClick={currentStep === 0 ? onCancel : goBack}
              className="min-h-[48px]"
            >
              <ArrowLeft className="h-4 w-4" />
              {currentStep === 0 ? "Cancel" : "Back"}
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={goNext}
                disabled={!canProceed}
                className="min-h-[48px]"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className={cn(
                  "min-h-[48px]",
                  isHighSeverity && "bg-red-600 hover:bg-red-700",
                )}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Submit Incident
                    <Check className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
