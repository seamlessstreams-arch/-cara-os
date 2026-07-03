"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara KEY WORK BUILDER
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useYoungPeople } from "@/hooks/use-young-people";
import { getYPName } from "@/lib/seed-data";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DictationButton } from "@/components/common/dictation-button";
import {
  useKeyWorkSessions,
  useCreateKeyWorkSession,
} from "@/hooks/use-intelligence";
import { cn, formatDate } from "@/lib/utils";
import type { KeyWorkTheme, KeyWorkSession, KeyWorkSessionPlan, KeyWorkSessionStatus } from "@/types/extended";
import {
  BookOpen, Plus, Sparkles, Loader2, AlertTriangle,
  CheckCircle2, ChevronRight, X,
} from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";

// ── Constants ─────────────────────────────────────────────────────────────────

const THEMES: KeyWorkTheme[] = [
  "staying_safe_online", "missing_from_care", "peer_pressure", "exploitation",
  "healthy_relationships", "family_contact", "emotional_regulation", "anger",
  "anxiety", "trust", "identity", "self_esteem", "education", "sleep_routines",
  "medication_understanding", "substance_misuse", "knife_crime", "sexual_health",
  "consent", "boundaries", "grief_and_loss", "trauma", "bullying", "social_media",
  "money_skills", "independence", "cultural_identity", "understanding_care",
  "complaints_and_rights", "safety_planning", "consequences_and_choices",
  "repairing_relationships", "voice_of_the_child", "future_goals", "general",
];

function formatTheme(theme: string): string {
  return theme.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_COLOURS: Record<KeyWorkSessionStatus, string> = {
  planned: "bg-slate-100 text-[var(--cs-text-secondary)]",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-700",
  reviewed: "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)]",
  approved: "bg-emerald-100 text-emerald-800",
};

const COMM_STYLES = ["verbal", "visual", "creative", "mixed"];
const SESSION_LENGTHS = ["30min", "45min", "60min", "90min"];

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "reviewed", label: "Reviewed" },
];

// ── Session plan display ──────────────────────────────────────────────────────

function PlanSection({ title, content }: { title: string; content: string | string[] | undefined }) {
  if (!content || (Array.isArray(content) && content.length === 0)) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-muted)]">{title}</p>
      {Array.isArray(content) ? (
        <ul className="space-y-1">
          {content.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-[var(--cs-text-secondary)]">
              <span className="text-[var(--cs-text-muted)] shrink-0 mt-0.5">{i + 1}.</span>{item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--cs-navy)] leading-relaxed">{content}</p>
      )}
    </div>
  );
}

// ── Session card ──────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: KeyWorkSession }) {
  const childName = getYPName(session.child_id) || session.child_id;
  return (
    <Link href={`/intelligence/cara/keywork/${session.id}`} className="group block">
      <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-white p-4 hover:shadow-sm transition-all space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", STATUS_COLOURS[session.status])}>
                {session.status.replace("_", " ")}
              </span>
              <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-medium">
                {formatTheme(session.theme)}
              </span>
            </div>
            <p className="text-sm font-semibold text-[var(--cs-navy)]">{session.title}</p>
            <p className="text-xs text-[var(--cs-text-muted)]">{childName} · {formatDate(session.created_at)}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--cs-text-gentle)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
      </div>
    </Link>
  );
}

// ── Builder form ──────────────────────────────────────────────────────────────

function BuilderForm({ onClose, initialChildId = "" }: { onClose: () => void; initialChildId?: string }) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const ypQuery = useYoungPeople("current");
  const youngPeople = (ypQuery.data?.data ?? []).map(yp => ({ id: yp.id, name: yp.preferred_name ?? yp.first_name }));
  const [childId, setChildId] = useState(initialChildId);
  const [theme, setTheme] = useState<KeyWorkTheme>("general");
  const [reason, setReason] = useState("");
  const [aims, setAims] = useState("");
  const [desiredOutcomes, setDesiredOutcomes] = useState("");
  const [childAge, setChildAge] = useState("");
  const [commStyle, setCommStyle] = useState("verbal");
  const [sessionLength, setSessionLength] = useState("60min");

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<KeyWorkSessionPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const createSession = useCreateKeyWorkSession();

  const handleReasonDictation = useCallback((text: string) => {
    setReason((prev) => prev ? `${prev} ${text}` : text);
  }, []);

  async function handleGenerate() {
    if (!childId || !reason.trim()) {
      setError("Please select a young person and provide a reason for the session.");
      return;
    }
    setGenerating(true);
    setError(null);
    setPlan(null);

    try {
      const childName = youngPeople.find((y) => y.id === childId)?.name ?? "Child";
      const res = await fetch("/api/v1/cara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "keywork_session_plan",
          stream: false,
          source_content: `Child: ${childName}, Age: ${childAge || "unknown"}\nTheme: ${formatTheme(theme)}\nReason: ${reason}\nAims: ${aims}\nDesired outcomes: ${desiredOutcomes}\nCommunication style: ${commStyle}\nSession length: ${sessionLength}`,
          prompt: `Generate a full key work session plan for a child aged ${childAge || "unknown"}, theme: ${formatTheme(theme)}, reason: ${reason}. Communication style: ${commStyle}. Session length: ${sessionLength}.`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Cara returned ${res.status}`);
      }

      const json = await res.json();
      const parsed = json?.data?.parsed;
      if (!parsed || typeof parsed !== "object") throw new Error("Cara did not return a valid session plan");
      setPlan(parsed as KeyWorkSessionPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!plan) return;
    setSaving(true);
    try {
      await createSession.mutateAsync({
        home_id: homeId,
        child_id: childId,
        title: plan.session_title ?? `${formatTheme(theme)} session`,
        theme,
        reason,
        aims,
        desired_outcomes: desiredOutcomes,
        session_plan: plan,
        resources: [],
        status: "planned",
        created_by: currentUser?.id ?? "staff_darren",
      });
      setSavedOk(true);
      setTimeout(onClose, 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-amber-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-500" />
            New Key Work Session
          </CardTitle>
          <button onClick={onClose} className="rounded-lg p-1 text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]">
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Child selector */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Young Person</label>
            <select
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <option value="">Select young person</option>
              {youngPeople.map((yp) => (
                <option key={yp.id} value={yp.id}>{yp.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Child Age</label>
            <input
              type="number"
              value={childAge}
              onChange={(e) => setChildAge(e.target.value)}
              placeholder="e.g. 14"
              min={5}
              max={25}
              className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        </div>

        {/* Theme */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as KeyWorkTheme)}
            className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            {THEMES.map((t) => (
              <option key={t} value={t}>{formatTheme(t)}</option>
            ))}
          </select>
        </div>

        {/* Reason */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Reason for Session</label>
            <DictationButton onTranscript={handleReasonDictation} size="sm" />
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Why is this session needed? What has prompted it?"
            className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          />
        </div>

        {/* Aims and outcomes */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Session Aims</label>
            <textarea
              value={aims}
              onChange={(e) => setAims(e.target.value)}
              rows={3}
              placeholder="What do you want to achieve?"
              className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Desired Outcomes</label>
            <textarea
              value={desiredOutcomes}
              onChange={(e) => setDesiredOutcomes(e.target.value)}
              rows={3}
              placeholder="What do you want the child to take away?"
              className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
            />
          </div>
        </div>

        {/* Comm style + session length */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Communication Style</label>
            <div className="flex flex-wrap gap-1.5">
              {COMM_STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setCommStyle(s)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                    commStyle === s ? "bg-amber-600 text-white" : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Session Length</label>
            <div className="flex flex-wrap gap-1.5">
              {SESSION_LENGTHS.map((l) => (
                <button
                  key={l}
                  onClick={() => setSessionLength(l)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    sessionLength === l ? "bg-amber-600 text-white" : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2"
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Generating Session Plan…</>
          ) : (
            <><Sparkles className="h-4 w-4" />Generate Session Plan</>
          )}
        </Button>

        {/* Plan preview */}
        {plan && (
          <div className="border-t border-[var(--cs-border-subtle)] pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-[var(--cs-navy)]">{plan.session_title}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <PlanSection title="Aim" content={plan.aim} />
              <PlanSection title="Why This Matters" content={plan.why_this_matters} />
              <PlanSection title="Preparation for Staff" content={plan.preparation_for_staff} />
              <PlanSection title="Emotional Safety" content={plan.emotional_safety_considerations} />
            </div>

            <PlanSection title="Opening Script" content={plan.opening_script} />
            <PlanSection title="Warm-up Activity" content={plan.warm_up_activity} />
            <PlanSection title="Discussion Questions" content={plan.main_discussion_questions} />
            <PlanSection title="Reflective Activity" content={plan.reflective_activity} />
            <PlanSection title="Practical Activity" content={plan.practical_activity} />
            <PlanSection title="Child-Friendly Explanation" content={plan.child_friendly_explanation} />
            <PlanSection title="Staff Prompts" content={plan.staff_prompts} />
            <PlanSection title="Closing Reflection" content={plan.closing_reflection} />
            <PlanSection title="Follow-up Actions" content={plan.follow_up_actions} />

            <div className="flex items-center gap-3 pt-2">
              {savedOk ? (
                <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                  <CheckCircle2 className="h-4 w-4" />Session saved successfully
                </div>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Save Session
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function KeyWorkBuilderPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [paramChildId, setParamChildId] = useState("");
  const [showBuilder, setShowBuilder] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Pre-fill from query params when navigated from a record's Cara quick-actions
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const c = p.get("child_id") ?? "";
    if (c) {
      setParamChildId(c);
      setShowBuilder(true);
    }
  }, []);
  const { data, isLoading } = useKeyWorkSessions({ homeId });
  const sessions: KeyWorkSession[] = useMemo(() => data?.data ?? [], [data]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return sessions;
    return sessions.filter((s) => s.status === statusFilter);
  }, [sessions, statusFilter]);

  return (
    <PageShell
      title="Key Work Builder"
      subtitle="Plan and build structured key work sessions"
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <SmartUploadButton variant="inline" label="Upload Key Work Document" uploadContext="Cara Intelligence — key work session notes or supporting material upload" />
          <Button
            onClick={() => setShowBuilder(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2 h-9"
          >
            <Plus className="h-4 w-4" />New Key Work Session
          </Button>
        </div>
      }
    >
      <div className="space-y-6 animate-fade-in">
        {/* Builder form */}
        {showBuilder && (
          <BuilderForm onClose={() => setShowBuilder(false)} initialChildId={paramChildId} />
        )}

        {/* Session list */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-500" />
                Sessions
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-[var(--cs-text-secondary)]">{sessions.length}</span>
              </CardTitle>
              <div className="flex items-center gap-1 flex-wrap">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      statusFilter === tab.value
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <BookOpen className="h-10 w-10 text-slate-200" />
                <p className="text-sm text-[var(--cs-text-muted)]">No sessions found</p>
                <p className="text-xs text-[var(--cs-text-muted)]">Create a new key work session using the button above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
