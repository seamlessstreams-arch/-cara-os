"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA INTERACTIVE SESSIONS
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useInteractiveSessions,
  useKeyWorkSessions,
  useCreateInteractiveSession,
  useUpdateInteractiveSession,
} from "@/hooks/use-intelligence";
import { cn, formatDate } from "@/lib/utils";
import type {
  InteractiveSession, InteractiveSessionStatus, InteractiveSessionResponse,
} from "@/types/extended";
import {
  Users, Plus, Sparkles, Loader2, AlertTriangle, CheckCircle2,
  X, Shield, Brain, ChevronRight, ChevronLeft,
} from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import { useYoungPeople } from "@/hooks/use-young-people";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";

// ── Constants ─────────────────────────────────────────────────────────────────

const SESSION_MODES = [
  { value: "guided", label: "Guided", description: "Follow structured activities in order" },
  { value: "freeform", label: "Freeform", description: "Choose activities as appropriate" },
  { value: "activity", label: "Activity", description: "Single focused activity" },
];

// ── Activities ────────────────────────────────────────────────────────────────

interface Activity {
  id: string;
  title: string;
  childPrompt: string;
  responseType: "emoji" | "scale" | "text";
  emojiOptions?: { emoji: string; label: string; value: string }[];
}

const ACTIVITIES: Activity[] = [
  {
    id: "feelings_thermometer",
    title: "Feelings Thermometer",
    childPrompt: "How are you feeling right now? Choose an emoji that shows how you feel.",
    responseType: "emoji",
    emojiOptions: [
      { emoji: "😊", label: "Happy", value: "happy" },
      { emoji: "😐", label: "Okay", value: "okay" },
      { emoji: "😟", label: "Worried", value: "worried" },
      { emoji: "😠", label: "Angry", value: "angry" },
      { emoji: "😢", label: "Sad", value: "sad" },
      { emoji: "😴", label: "Tired", value: "tired" },
    ],
  },
  {
    id: "safety_circle",
    title: "Safety Circle",
    childPrompt: "Who makes you feel safe? Tell me about the people in your safety circle.",
    responseType: "text",
  },
  {
    id: "trusted_adult_map",
    title: "Trusted Adult Map",
    childPrompt: "Who can you talk to when things are hard? Who are your trusted adults?",
    responseType: "text",
  },
  {
    id: "worry_box",
    title: "Worry Box",
    childPrompt: "What's in your worry box today? What are you worried about?",
    responseType: "text",
  },
  {
    id: "what_happened",
    title: "What Happened / What I Felt / What I Need",
    childPrompt: "Tell me: What happened? What did you feel? What do you need?",
    responseType: "text",
  },
  {
    id: "scaling_question",
    title: "Scaling Question",
    childPrompt: "On a scale of 1 to 10, how are you feeling today? (1 = really difficult, 10 = amazing)",
    responseType: "scale",
  },
  {
    id: "safe_plan",
    title: "My Safe Plan",
    childPrompt: "What helps you feel safe? Let's talk about what we can put in your safe plan.",
    responseType: "text",
  },
  {
    id: "my_goals",
    title: "My Goals",
    childPrompt: "What do you want to work on? What would make things better for you?",
    responseType: "text",
  },
  {
    id: "calm_down",
    title: "What Helps Me Calm Down",
    childPrompt: "When you feel upset or overwhelmed, what helps you calm down?",
    responseType: "text",
  },
  {
    id: "staff_should_know",
    title: "What Staff Should Know About Me",
    childPrompt: "Is there anything you want me to know about you — what you like, what helps, what's hard?",
    responseType: "text",
  },
];

const STATUS_COLOURS: Record<InteractiveSessionStatus, string> = {
  active: "bg-blue-100 text-blue-800",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  reviewed: "bg-violet-100 text-violet-800",
};

// ── Safety notice (always visible) ───────────────────────────────────────────

function SafetyNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
      <Shield className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-bold text-red-800">Staff Supervision Required</p>
        <p className="text-xs text-red-700 mt-1 leading-relaxed">
          Interactive sessions must be staff-led and supervised. ARIA does not provide unsupervised AI counselling.
          All sessions require prior staff consent recording and child awareness. All outputs must be reviewed before
          saving to the child&apos;s record.
        </p>
      </div>
    </div>
  );
}

// ── Active session view ───────────────────────────────────────────────────────

interface ActiveSessionProps {
  session: InteractiveSession;
  onEnd: (responses: InteractiveSessionResponse[]) => void;
}

function ActiveSessionView({ session, onEnd }: ActiveSessionProps) {
  const [activityIdx, setActivityIdx] = useState(0);
  const [responses, setResponses] = useState<InteractiveSessionResponse[]>([]);
  const [currentResponse, setCurrentResponse] = useState<string | number | null>(null);
  const [childWords, setChildWords] = useState("");
  const [staffObs, setStaffObs] = useState("");
  const [declined, setDeclined] = useState(false);

  const activity = ACTIVITIES[activityIdx];

  function handleNext() {
    const response: InteractiveSessionResponse = {
      activity_id: activity.id,
      activity_title: activity.title,
      response_type: declined ? "declined" : activity.responseType,
      response_value: declined ? null : currentResponse,
      child_words: childWords || undefined,
      staff_observation: staffObs || undefined,
      recorded_at: new Date().toISOString(),
    };
    const newResponses = [...responses, response];
    setResponses(newResponses);

    if (activityIdx < ACTIVITIES.length - 1) {
      setActivityIdx((i) => i + 1);
      setCurrentResponse(null);
      setChildWords("");
      setStaffObs("");
      setDeclined(false);
    } else {
      onEnd(newResponses);
    }
  }

  function handleDecline() {
    setDeclined(true);
    setCurrentResponse(null);
  }

  const progress = Math.round(((activityIdx) / ACTIVITIES.length) * 100);

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Activity {activityIdx + 1} of {ACTIVITIES.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100">
          <div className="h-1.5 rounded-full bg-teal-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <Card className="border-teal-200">
        <CardContent className="p-6 space-y-5">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider">{activity.title}</p>
            <p className="text-lg font-medium text-slate-900 leading-relaxed">{activity.childPrompt}</p>
          </div>

          {/* Emoji response */}
          {activity.responseType === "emoji" && activity.emojiOptions && !declined && (
            <div className="flex flex-wrap gap-3">
              {activity.emojiOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCurrentResponse(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl border-2 p-3 transition-all",
                    currentResponse === opt.value
                      ? "border-teal-400 bg-teal-50"
                      : "border-slate-200 bg-white hover:border-teal-300"
                  )}
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <span className="text-[11px] text-slate-600">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Scale response */}
          {activity.responseType === "scale" && !declined && (
            <div className="space-y-2">
              <input
                type="range"
                min={1}
                max={10}
                value={currentResponse as number ?? 5}
                onChange={(e) => setCurrentResponse(Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>1 — Really difficult</span>
                <span className="font-bold text-teal-600 text-base">{currentResponse ?? 5}</span>
                <span>10 — Amazing</span>
              </div>
            </div>
          )}

          {/* Text response */}
          {activity.responseType === "text" && !declined && (
            <textarea
              value={childWords}
              onChange={(e) => setChildWords(e.target.value)}
              rows={4}
              placeholder="Record what the child said in their own words…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
            />
          )}

          {declined && (
            <div className="rounded-xl bg-slate-100 p-3 text-xs text-slate-600 italic">
              Child declined this activity
            </div>
          )}

          {/* Staff observation */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">Staff Observation (optional)</label>
            <textarea
              value={staffObs}
              onChange={(e) => setStaffObs(e.target.value)}
              rows={2}
              placeholder="Note how the child engaged, their body language, tone…"
              className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {activityIdx > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActivityIdx((i) => i - 1)}
                className="gap-1.5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />Back
              </Button>
            )}
            {!declined && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDecline}
                className="text-slate-500"
              >
                Child Declined
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 ml-auto"
            >
              {activityIdx < ACTIVITIES.length - 1 ? (
                <>Next Activity <ChevronRight className="h-3.5 w-3.5" /></>
              ) : (
                <>End Session <CheckCircle2 className="h-3.5 w-3.5" /></>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Session summary + save ────────────────────────────────────────────────────

function SessionSummary({
  session,
  responses,
  onSave,
}: {
  session: InteractiveSession;
  responses: InteractiveSessionResponse[];
  onSave: () => void;
}) {
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [ariaSummary, setAriaSummary] = useState<{
    child_friendly?: string;
    professional?: string;
    child_voice?: string;
    staff_reflection?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const updateSession = useUpdateInteractiveSession();

  async function handleGenerateSummary() {
    setGeneratingSummary(true);
    try {
      const context = responses.map((r) => `${r.activity_title}: ${r.response_type === "declined" ? "Declined" : (r.child_words ?? r.response_value ?? "")}${r.staff_observation ? ` [Staff: ${r.staff_observation}]` : ""}`).join("\n");
      const res = await fetch("/api/v1/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "interactive_session_summary",
          stream: false,
          source_content: context,
          prompt: "Generate a summary of this interactive session, including a child-friendly summary, professional summary, child voice, and staff reflection.",
        }),
      });
      const json = await res.json();
      const parsed = json?.data?.parsed;
      if (parsed && typeof parsed === "object") {
        setAriaSummary(parsed);
      }
    } finally {
      setGeneratingSummary(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSession.mutateAsync({
        id: session.id,
        childId: session.child_id,
        status: "completed",
        responses,
        aria_summary: ariaSummary ? JSON.stringify(ariaSummary) : undefined,
        child_voice: ariaSummary?.child_voice,
        staff_notes: ariaSummary?.staff_reflection,
        safeguarding_flags: [],
        follow_up_actions: [],
        completed_at: new Date().toISOString(),
      });
      setSavedOk(true);
      onSave();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-teal-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-teal-500" />
          Session Complete — {responses.length} activities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Response summary */}
        <div className="space-y-2">
          {responses.map((r, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
              <span className="text-xs font-medium text-slate-700 flex-1">{r.activity_title}</span>
              {r.response_type === "declined" ? (
                <span className="text-[10px] text-slate-400 italic">Declined</span>
              ) : (
                <span className="text-[10px] text-teal-600 font-medium">
                  {String(r.child_words ?? r.response_value ?? "Completed").slice(0, 40)}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* ARIA summary */}
        {!ariaSummary ? (
          <Button
            onClick={handleGenerateSummary}
            disabled={generatingSummary}
            variant="outline"
            className="gap-2"
          >
            {generatingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate ARIA Summary
          </Button>
        ) : (
          <div className="space-y-3">
            {ariaSummary.child_friendly && (
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
                <p className="text-[10px] font-semibold text-teal-600 uppercase mb-1">Child-friendly Summary</p>
                <p className="text-sm text-slate-800">{ariaSummary.child_friendly}</p>
              </div>
            )}
            {ariaSummary.professional && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Professional Summary</p>
                <p className="text-sm text-slate-800">{ariaSummary.professional}</p>
              </div>
            )}
            {ariaSummary.child_voice && (
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
                <p className="text-[10px] font-semibold text-violet-600 uppercase mb-1">Child&apos;s Voice</p>
                <p className="text-sm text-slate-800 italic">&ldquo;{ariaSummary.child_voice}&rdquo;</p>
              </div>
            )}
            {ariaSummary.staff_reflection && (
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Staff Reflection</p>
                <p className="text-sm text-slate-800">{ariaSummary.staff_reflection}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          {savedOk ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="h-4 w-4" />Session saved to record
            </div>
          ) : (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save Session
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Setup form ────────────────────────────────────────────────────────────────

function SetupForm({ onStart, onClose }: {
  onStart: (session: InteractiveSession) => void;
  onClose: () => void;
}) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const ypQuery = useYoungPeople("current");
  const youngPeople = (ypQuery.data?.data ?? []).map(yp => ({ id: yp.id, name: yp.preferred_name ?? yp.first_name }));
  const [childId, setChildId] = useState("");
  const [sessionMode, setSessionMode] = useState<"guided" | "freeform" | "activity">("guided");
  const [consentRecorded, setConsentRecorded] = useState(false);
  const [consentNotes, setConsentNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const createSession = useCreateInteractiveSession();
  const { data: kwData } = useKeyWorkSessions({ childId, homeId });
  const [linkedKW, setLinkedKW] = useState("");

  async function handleStart() {
    if (!childId) { setError("Please select a young person."); return; }
    if (!consentRecorded) { setError("You must confirm consent has been recorded before starting."); return; }
    setCreating(true);
    setError(null);
    try {
      const res = await createSession.mutateAsync({
        home_id: homeId,
        child_id: childId,
        key_work_session_id: linkedKW || undefined,
        consent_recorded: true,
        consent_notes: consentNotes || undefined,
        session_mode: sessionMode,
        responses: [],
        safeguarding_flags: [],
        follow_up_actions: [],
        status: "active",
        created_by: currentUser?.id ?? "staff_darren",
      });
      onStart((res as { data: InteractiveSession }).data);
    } catch {
      setError("Failed to create session. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Card className="border-teal-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-500" />
            Setup Interactive Session
          </CardTitle>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600">Young Person</label>
          <select
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-300"
          >
            <option value="">Select young person</option>
            {youngPeople.map((yp) => (
              <option key={yp.id} value={yp.id}>{yp.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600">Session Mode</label>
          <div className="grid gap-2 sm:grid-cols-3">
            {SESSION_MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setSessionMode(m.value as "guided" | "freeform" | "activity")}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all",
                  sessionMode === m.value ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-white"
                )}
              >
                <div className="text-xs font-semibold text-slate-900">{m.label}</div>
                <div className="text-[10px] text-slate-500">{m.description}</div>
              </button>
            ))}
          </div>
        </div>

        {childId && kwData?.data && kwData.data.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Link to Key Work Session (optional)</label>
            <select
              value={linkedKW}
              onChange={(e) => setLinkedKW(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              <option value="">No link</option>
              {kwData.data.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
        )}

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consentRecorded}
              onChange={(e) => setConsentRecorded(e.target.checked)}
              className="mt-0.5 accent-amber-600"
            />
            <span className="text-xs font-medium text-amber-800">
              I confirm that consent has been recorded and the young person is aware they are participating in a staff-led session with ARIA tools.
            </span>
          </label>
          <textarea
            value={consentNotes}
            onChange={(e) => setConsentNotes(e.target.value)}
            rows={2}
            placeholder="Consent notes (how consent was obtained, young person's response)…"
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none resize-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        <Button
          onClick={handleStart}
          disabled={creating}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          Start Session
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InteractiveSessionsPage() {
  const ypQuery = useYoungPeople("current");
  const youngPeople = (ypQuery.data?.data ?? []).map(yp => ({ id: yp.id, name: yp.preferred_name ?? yp.first_name }));
  const [showSetup, setShowSetup] = useState(false);
  const [activeSession, setActiveSession] = useState<InteractiveSession | null>(null);
  const [sessionResponses, setSessionResponses] = useState<InteractiveSessionResponse[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [historyChild, setHistoryChild] = useState("yp_casey");

  const { data: sessionsData, isLoading } = useInteractiveSessions(historyChild);
  const sessions: InteractiveSession[] = useMemo(() => sessionsData?.data ?? [], [sessionsData]);
  const pastSessions = useMemo(() => sessions.filter((s) => s.status !== "active"), [sessions]);

  function handleSessionStart(session: InteractiveSession) {
    setActiveSession(session);
    setShowSetup(false);
    setShowSummary(false);
  }

  function handleSessionEnd(responses: InteractiveSessionResponse[]) {
    setSessionResponses(responses);
    setShowSummary(true);
  }

  function handleSaved() {
    setActiveSession(null);
    setShowSummary(false);
    setSessionResponses([]);
  }

  return (
    <PageShell
      title="Interactive Sessions"
      subtitle="Staff-led session tools for direct child work"
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <SmartUploadButton variant="inline" label="Upload Session Notes" uploadContext="ARIA Intelligence — interactive session notes or resource upload" />
          {!activeSession && !showSummary && (
            <Button onClick={() => setShowSetup(true)} className="bg-teal-600 hover:bg-teal-700 text-white gap-2 h-9">
              <Plus className="h-4 w-4" />New Session
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6 animate-fade-in">
        {/* Safety notice always visible */}
        <SafetyNotice />

        {/* Setup form */}
        {showSetup && !activeSession && (
          <SetupForm onStart={handleSessionStart} onClose={() => setShowSetup(false)} />
        )}

        {/* Active session */}
        {activeSession && !showSummary && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-teal-100 text-teal-800 px-2.5 py-1 text-xs font-semibold">
                  Live Session
                </span>
                <span className="text-sm text-slate-600">
                  {youngPeople.find((y) => y.id === activeSession.child_id)?.name}
                </span>
              </div>
              <button
                onClick={() => setActiveSession(null)}
                className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />Cancel
              </button>
            </div>
            <ActiveSessionView session={activeSession} onEnd={handleSessionEnd} />
          </div>
        )}

        {/* Session summary */}
        {showSummary && activeSession && (
          <SessionSummary
            session={activeSession}
            responses={sessionResponses}
            onSave={handleSaved}
          />
        )}

        {/* Session history */}
        {!activeSession && !showSummary && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-teal-500" />
                  Session History
                </CardTitle>
                <select
                  value={historyChild}
                  onChange={(e) => setHistoryChild(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-300"
                >
                  {youngPeople.map((yp) => (
                    <option key={yp.id} value={yp.id}>{yp.name}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}
                </div>
              ) : pastSessions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Users className="h-10 w-10 text-slate-200" />
                  <p className="text-sm text-slate-500">No past sessions for this young person</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pastSessions.map((s) => (
                    <div key={s.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center gap-3">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", STATUS_COLOURS[s.status])}>
                          {s.status}
                        </span>
                        <span className="text-xs text-slate-600 flex-1">
                          {s.session_mode} · {s.responses.length} activities · {formatDate(s.created_at)}
                        </span>
                      </div>
                      {s.child_voice && (
                        <p className="text-xs text-slate-600 italic mt-2 line-clamp-2">&ldquo;{s.child_voice}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
