"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara KEY WORK SESSION DETAIL
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DictationButton } from "@/components/common/dictation-button";
import {
  useKeyWorkSessions,
  useUpdateKeyWorkSession,
} from "@/hooks/use-intelligence";
import { useYoungPeople } from "@/hooks/use-young-people";
import { cn, formatDate } from "@/lib/utils";
import type { KeyWorkSession, KeyWorkSessionPlan, KeyWorkSessionStatus } from "@/types/extended";
import {
  BookOpen, Sparkles, Loader2, AlertTriangle, CheckCircle2,
  ArrowLeft, User, Shield, Brain, ChevronRight,
} from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";

// ── Constants ─────────────────────────────────────────────────────────────────

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

const STATUS_STEPS: KeyWorkSessionStatus[] = ["planned", "in_progress", "completed", "reviewed", "approved"];

// ── Section helpers ───────────────────────────────────────────────────────────

function PlanSection({ title, content, accent = false }: {
  title: string;
  content: string | string[] | undefined | null;
  accent?: boolean;
}) {
  if (!content || (Array.isArray(content) && content.length === 0)) return null;
  return (
    <div className={cn("rounded-xl border p-4 space-y-2", accent ? "border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)]" : "border-[var(--cs-border-subtle)] bg-white")}>
      <p className={cn("text-[10px] font-semibold uppercase tracking-wider", accent ? "text-[var(--cs-cara-gold)]" : "text-[var(--cs-text-muted)]")}>{title}</p>
      {Array.isArray(content) ? (
        <ul className="space-y-1">
          {content.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--cs-navy)]">
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

function ARCSection({ arc_attachment, arc_regulation, arc_competency }: {
  arc_attachment?: string;
  arc_regulation?: string;
  arc_competency?: string;
}) {
  const items = [
    { label: "Attachment", content: arc_attachment, colour: "border-rose-200 bg-rose-50 text-rose-700" },
    { label: "Regulation", content: arc_regulation, colour: "border-blue-200 bg-blue-50 text-blue-700" },
    { label: "Competency", content: arc_competency, colour: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  ];
  if (!arc_attachment && !arc_regulation && !arc_competency) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map(({ label, content, colour }) => content ? (
        <div key={label} className={cn("rounded-xl border p-3 space-y-1.5", colour)}>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
          <p className="text-xs leading-relaxed">{content}</p>
        </div>
      ) : null)}
    </div>
  );
}

// ── Status progress bar ────────────────────────────────────────────────────────

function StatusBar({ current }: { current: KeyWorkSessionStatus }) {
  const idx = STATUS_STEPS.indexOf(current);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STATUS_STEPS.map((step, i) => (
        <React.Fragment key={step}>
          <div className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize",
            i <= idx ? "bg-slate-900 text-white" : "bg-slate-100 text-[var(--cs-text-muted)]"
          )}>
            {i < idx && <CheckCircle2 className="h-3 w-3" />}
            {step.replace("_", " ")}
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <ChevronRight className={cn("h-3.5 w-3.5", i < idx ? "text-[var(--cs-text-secondary)]" : "text-[var(--cs-text-gentle)]")} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Action panel based on status ─────────────────────────────────────────────

function ActionPanel({ session, onUpdate }: {
  session: KeyWorkSession;
  onUpdate: (data: Partial<KeyWorkSession>) => Promise<void>;
}) {
  const { currentUser } = useAuthContext();
  const [childVoice, setChildVoice] = useState(session.child_voice ?? "");
  const [staffReflection, setStaffReflection] = useState(session.staff_reflection ?? "");
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  async function act(data: Partial<KeyWorkSession>) {
    setSaving(true);
    try {
      await onUpdate(data);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (session.status === "approved") {
    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
        <CheckCircle2 className="h-5 w-5" />Session approved
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {session.status === "planned" && (
        <Button
          onClick={() => act({ status: "in_progress" })}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Start Session
        </Button>
      )}

      {session.status === "in_progress" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Child&apos;s Voice / What they said</label>
              <DictationButton
                onTranscript={(t) => setChildVoice((p) => p ? `${p} ${t}` : t)}
                size="sm"
              />
            </div>
            <textarea
              value={childVoice}
              onChange={(e) => setChildVoice(e.target.value)}
              rows={4}
              placeholder="Record the child's words, reactions, and participation…"
              className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Staff Reflection</label>
              <DictationButton
                onTranscript={(t) => setStaffReflection((p) => p ? `${p} ${t}` : t)}
                size="sm"
              />
            </div>
            <textarea
              value={staffReflection}
              onChange={(e) => setStaffReflection(e.target.value)}
              rows={4}
              placeholder="Reflect on how the session went, what worked, what you observed…"
              className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
            />
          </div>
          <Button
            onClick={() => act({ status: "completed", child_voice: childVoice, staff_reflection: staffReflection, completed_at: new Date().toISOString() })}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Complete Session
          </Button>
        </div>
      )}

      {session.status === "completed" && (
        <Button
          onClick={() => act({ status: "reviewed", reviewed_by: currentUser?.id ?? "staff_darren", reviewed_at: new Date().toISOString() })}
          disabled={saving}
          className="bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Request Review
        </Button>
      )}

      {session.status === "reviewed" && (
        <Button
          onClick={() => act({ status: "approved" })}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Approve Session
        </Button>
      )}

      {savedOk && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />Saved
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function KeyWorkSessionDetailPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const ypQuery = useYoungPeople("current");
  const youngPeople = (ypQuery.data?.data ?? []).map(yp => ({ id: yp.id, name: yp.preferred_name ?? yp.first_name }));
  const params = useParams();
  const sessionId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  const { data, isLoading } = useKeyWorkSessions({ homeId });
  const updateSession = useUpdateKeyWorkSession();

  const session = useMemo<KeyWorkSession | undefined>(
    () => (data?.data ?? []).find((s) => s.id === sessionId),
    [data, sessionId]
  );

  const childName = useMemo(
    () => session ? youngPeople.find((y) => y.id === session.child_id)?.name ?? session.child_id : "",
    [session, youngPeople]
  );

  async function handleUpdate(updateData: Partial<KeyWorkSession>) {
    if (!session) return;
    await updateSession.mutateAsync({ id: session.id, ...updateData });
  }

  if (isLoading) {
    return (
      <PageShell title="Key Work Session" showQuickCreate={false}>
        <div className="flex items-center gap-3 py-16 justify-center text-sm text-[var(--cs-text-muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />Loading session…
        </div>
      </PageShell>
    );
  }

  if (!session) {
    return (
      <PageShell title="Key Work Session" showQuickCreate={false}>
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertTriangle className="h-10 w-10 text-[var(--cs-text-gentle)]" />
          <p className="text-sm font-semibold text-[var(--cs-text-secondary)]">Session not found</p>
          <Link href="/intelligence/cara/keywork">
            <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Back to Key Work</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  const plan: KeyWorkSessionPlan | null = session.session_plan;

  return (
    <PageShell
      title={session.title}
      subtitle={`${childName} · ${formatTheme(session.theme)}`}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <SmartUploadButton variant="icon" uploadContext={`Cara Key Work — session notes or supporting material for ${session.title}`} />
          <Link href="/intelligence/cara/keywork">
            <Button variant="outline" size="sm" className="gap-2 h-8">
              <ArrowLeft className="h-3.5 w-3.5" />Back
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header card */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[var(--cs-text-muted)]" />
                <span className="text-sm font-semibold text-[var(--cs-navy)]">{childName}</span>
              </div>
              <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold capitalize", STATUS_COLOURS[session.status])}>
                {session.status.replace("_", " ")}
              </span>
              <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-[11px] font-medium">
                {formatTheme(session.theme)}
              </span>
              <span className="text-xs text-[var(--cs-text-muted)] ml-auto">{formatDate(session.created_at)}</span>
            </div>
            <StatusBar current={session.status} />
            {session.reason && <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{session.reason}</p>}
          </CardContent>
        </Card>

        {/* Session plan or empty state */}
        {!plan ? (
          <Card className="border-amber-100 bg-amber-50/30">
            <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
              <BookOpen className="h-10 w-10 text-amber-300" />
              <div>
                <p className="text-sm font-semibold text-[var(--cs-text-secondary)]">No session plan generated yet</p>
                <p className="text-xs text-[var(--cs-text-muted)] mt-1">Go back to generate a plan using Cara</p>
              </div>
              <Link href="/intelligence/cara/keywork">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                  <Sparkles className="h-4 w-4" />Generate Plan
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <PlanSection title="Aim" content={plan.aim} />
              <PlanSection title="Why This Matters" content={plan.why_this_matters} />
              <PlanSection title="Preparation for Staff" content={plan.preparation_for_staff} />
              <PlanSection title="Emotional Safety Considerations" content={plan.emotional_safety_considerations} />
            </div>

            <PlanSection title="Opening Script" content={plan.opening_script} />
            <PlanSection title="Warm-up Activity" content={plan.warm_up_activity} />

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Discussion Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.main_discussion_questions?.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--cs-navy)]">
                      <span className="text-amber-400 font-bold shrink-0 mt-0.5">{i + 1}.</span>{q}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <PlanSection title="Reflective Activity" content={plan.reflective_activity} />
              <PlanSection title="Practical Activity" content={plan.practical_activity} />
            </div>

            <PlanSection title="Child-Friendly Explanation" content={plan.child_friendly_explanation} accent />

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider flex items-center gap-2">
                  <Brain className="h-3.5 w-3.5" />Staff Prompts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.staff_prompts?.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--cs-navy)]">
                      <span className="text-[var(--cs-text-muted)] shrink-0 mt-0.5">•</span>{p}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <PlanSection title="PACE-Informed Responses" content={plan.pace_informed_responses} accent />

            {/* ARC links */}
            <div>
              <p className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-3">ARC Framework Links</p>
              <ARCSection
                arc_attachment={plan.arc_attachment}
                arc_regulation={plan.arc_regulation}
                arc_competency={plan.arc_competency}
              />
            </div>

            {plan.safeguarding_link && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-500" />
                  <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">Safeguarding Link</p>
                </div>
                <p className="text-sm text-red-800 leading-relaxed">{plan.safeguarding_link}</p>
              </div>
            )}

            <PlanSection title="Rights and Responsibilities" content={plan.rights_and_responsibilities} />
            <PlanSection title="Closing Reflection" content={plan.closing_reflection} />
            <PlanSection title="Follow-up Actions" content={plan.follow_up_actions} />
            <PlanSection title="Evidence to Record" content={plan.evidence_to_record} />
            <PlanSection title="Manager Oversight Prompt" content={plan.manager_oversight_prompt} />
          </div>
        )}

        {/* Child voice / reflection (completed) */}
        {session.child_voice && (
          <Card className="border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)]/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[var(--cs-cara-gold)] uppercase tracking-wider">Child&apos;s Voice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--cs-navy)] leading-relaxed italic">&ldquo;{session.child_voice}&rdquo;</p>
            </CardContent>
          </Card>
        )}

        {session.staff_reflection && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Staff Reflection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--cs-navy)] leading-relaxed">{session.staff_reflection}</p>
            </CardContent>
          </Card>
        )}

        {/* Action panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[var(--cs-navy)]">Session Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionPanel session={session} onUpdate={handleUpdate} />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
