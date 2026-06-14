"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Voice Intelligence Page
//
// Full-page voice capture and structured record generation. Users can record
// audio for transcription or paste/type a transcript directly, then process it
// through Cara's voice reflection agent to produce structured outputs (daily
// logs, supervision notes, handover summaries, reflective journals, management
// oversight entries).
//
// Route: /dashboard/voice-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { Suspense, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Mic,
  Pause,
  Play,
  Square,
  Loader2,
  Sparkles,
  RotateCw,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Save,
  ChevronDown,
  Activity,
  BookOpen,
  Clipboard,
  Users,
  Eye,
} from "lucide-react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";

// ── Types ────────────────────────────────────────────────────────────────────

type VoiceRecordType =
  | "daily_log"
  | "supervision_note"
  | "handover"
  | "reflective_journal"
  | "management_oversight";

type InputType = "dictation" | "reflection" | "supervision_prep" | "handover" | "other";

interface VoiceProcessResponse {
  answer: string;
  agentUsed: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  confidence: number;
  evidenceUsed: Array<{
    sourceTable: string;
    sourceId: string;
    sourceTitle?: string;
    sourceExcerpt: string;
    relevanceScore: number;
  }>;
  suggestedActions: Array<{
    title: string;
    description: string;
    priority: string;
    ownerRole?: string;
    actionType?: string;
  }>;
  safetyNotes: string[];
  auditId: string;
  sessionId: string | null;
  blocked?: boolean;
  blockReason?: string;
  canSave?: boolean;
  escalationRecommended?: boolean;
}

interface HistoryEntry {
  id: string;
  createdAt: string;
  transcript: string;
  structuredOutput: string;
  riskLevel: string;
  agentUsed: string;
  status: string;
  inputType: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const RECORD_TYPE_OPTIONS: { value: VoiceRecordType; label: string; icon: typeof FileText }[] = [
  { value: "daily_log", label: "Daily Log Entry", icon: FileText },
  { value: "supervision_note", label: "Supervision Note", icon: Users },
  { value: "handover", label: "Handover Record", icon: Clipboard },
  { value: "reflective_journal", label: "Reflective Journal", icon: BookOpen },
  { value: "management_oversight", label: "Management Oversight", icon: Eye },
];

const INPUT_TYPE_OPTIONS: { value: InputType; label: string }[] = [
  { value: "dictation", label: "Manager Dictation" },
  { value: "reflection", label: "Staff Reflection" },
  { value: "supervision_prep", label: "Supervision Preparation" },
  { value: "handover", label: "Shift Handover" },
  { value: "other", label: "Other" },
];

// TODO: Replace with real session/home context from auth provider
const PLACEHOLDER_HOME_ID = "00000000-0000-0000-0000-000000000000";
const PLACEHOLDER_USER_ID = "00000000-0000-0000-0000-000000000000";
const PLACEHOLDER_ROLE = "registered_manager";

// ── Page Component ───────────────────────────────────────────────────────────

export default function VoiceIntelligencePage() {
  return (
    <Suspense fallback={<VoiceIntelligenceLoading />}>
      <VoiceIntelligenceContent />
    </Suspense>
  );
}

function VoiceIntelligenceLoading() {
  return (
    <main className="space-y-6 p-6">
      <div className="h-8 w-64 animate-pulse rounded bg-[var(--cs-border)]" />
      <div className="h-4 w-96 animate-pulse rounded bg-[var(--cs-border)]" />
      <div className="h-64 animate-pulse rounded-lg border border-[var(--cs-border)] bg-white" />
    </main>
  );
}

function VoiceIntelligenceContent() {
  // ── State ────────────────────────────────────────────────────────────────
  const recorder = useAudioRecorder({ maxDurationMs: 10 * 60 * 1000 });

  const [transcript, setTranscript] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  const [inputType, setInputType] = useState<InputType>("dictation");
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [caraResponse, setCaraResponse] = useState<VoiceProcessResponse | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveDropdownOpen, setSaveDropdownOpen] = useState(false);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // ── Load history on mount ────────────────────────────────────────────────
  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/cara/voice-history?homeId=${PLACEHOLDER_HOME_ID}&userId=${PLACEHOLDER_USER_ID}`,
      );
      if (res.ok) {
        const data = await res.json();
        setHistory(data.data ?? []);
      }
    } catch {
      // Silently fail — history is non-critical
    } finally {
      setHistoryLoading(false);
    }
  }

  // ── Transcription ────────────────────────────────────────────────────────
  async function submitForTranscription() {
    if (!recorder.audioBlob) return;
    setTranscribing(true);
    setTranscriptError(null);
    try {
      const form = new FormData();
      const ext = (recorder.audioMimeType ?? "audio/webm").split("/")[1]?.split(";")[0] ?? "webm";
      form.append("file", recorder.audioBlob, `recording.${ext}`);
      form.append("actorUserId", PLACEHOLDER_USER_ID);
      form.append("actorRole", PLACEHOLDER_ROLE);
      form.append("homeId", PLACEHOLDER_HOME_ID);
      form.append("sourceModule", "voice-intelligence");
      form.append("durationMs", String(recorder.durationMs));

      const res = await fetch("/api/cara/transcribe", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setTranscriptError(data.error ?? "Transcription failed.");
      } else if (data.data?.transcript) {
        setTranscript(data.data.transcript);
      } else {
        setTranscriptError("Transcription returned no text.");
      }
    } catch (e) {
      setTranscriptError(e instanceof Error ? e.message : String(e));
    } finally {
      setTranscribing(false);
    }
  }

  // ── Process with Cara ────────────────────────────────────────────────────
  async function processTranscript() {
    if (!transcript.trim()) return;
    setProcessing(true);
    setProcessError(null);
    setCaraResponse(null);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await fetch("/api/cara/voice-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcript.trim(),
          actorUserId: PLACEHOLDER_USER_ID,
          actorRole: PLACEHOLDER_ROLE,
          homeId: PLACEHOLDER_HOME_ID,
          inputType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProcessError(data.error ?? "Processing failed.");
      } else {
        setCaraResponse(data);
      }
    } catch (e) {
      setProcessError(e instanceof Error ? e.message : String(e));
    } finally {
      setProcessing(false);
    }
  }

  // ── Save to Record ───────────────────────────────────────────────────────
  const saveToRecord = useCallback(
    async (recordType: VoiceRecordType) => {
      if (!caraResponse) return;
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(null);
      setSaveDropdownOpen(false);

      try {
        const res = await fetch("/api/cara/voice-save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recordType,
            content: caraResponse.answer,
            homeId: PLACEHOLDER_HOME_ID,
            userId: PLACEHOLDER_USER_ID,
            sessionId: caraResponse.sessionId,
            metadata: {
              riskLevel: caraResponse.riskLevel,
              agentUsed: caraResponse.agentUsed,
              inputType,
              auditId: caraResponse.auditId,
            },
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          setSaveError(data.error ?? "Save failed.");
        } else {
          const label = RECORD_TYPE_OPTIONS.find((o) => o.value === recordType)?.label ?? recordType;
          setSaveSuccess(`Saved as ${label} (${data.data?.recordId?.slice(0, 8) ?? "ok"})`);
          // Refresh history
          loadHistory();
        }
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : String(e));
      } finally {
        setSaving(false);
      }
    },
    [caraResponse, inputType],
  );

  // ── Reset everything ─────────────────────────────────────────────────────
  function resetAll() {
    recorder.reset();
    setTranscript("");
    setTranscriptError(null);
    setProcessing(false);
    setProcessError(null);
    setCaraResponse(null);
    setSaveSuccess(null);
    setSaveError(null);
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-[var(--cs-navy)]">
          <Mic className="h-6 w-6 text-[var(--cs-cara-gold)]" />
          Voice Intelligence
        </h1>
        <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">
          Capture voice or paste text — Cara structures it into professional records ready for
          review and approval.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Recording + transcript */}
        <div className="space-y-4 lg:col-span-2">
          {/* Input type selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[var(--cs-text-secondary)]">
                What are you capturing?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {INPUT_TYPE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={inputType === opt.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInputType(opt.value)}
                    className={cn(
                      inputType === opt.value &&
                        "bg-[var(--cs-cara-gold)] text-[var(--cs-navy)] hover:bg-[var(--cs-cara-gold)]/90",
                    )}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recording panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-[var(--cs-text-secondary)]">
                <Mic className="h-4 w-4" /> Voice Recording
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] p-2.5 text-xs text-[var(--cs-navy)]">
                Audio stays on your device until transcribed. After transcription the audio is
                discarded server-side. You can edit the transcript before processing.
              </div>

              {/* Recorder state notices */}
              {recorder.state === "insecure_context" || !recorder.isSecure ? (
                <Notice tone="amber" title="Secure connection required">
                  Open this page over HTTPS or via localhost to record.
                </Notice>
              ) : recorder.state === "browser_unsupported" || !recorder.isSupported ? (
                <Notice tone="amber" title="Browser not supported">
                  Voice recording is not supported in this browser. Use the text input below instead.
                </Notice>
              ) : recorder.state === "permission_denied" ? (
                <Notice tone="amber" title="Microphone permission denied">
                  Allow microphone access in your browser and try again.
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-1.5"
                    onClick={() => recorder.start()}
                  >
                    <RotateCw className="h-3.5 w-3.5" /> Try again
                  </Button>
                </Notice>
              ) : null}

              {/* Recording controls */}
              <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--cs-border)] bg-white p-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-block h-2.5 w-2.5 rounded-full",
                      recorder.state === "recording"
                        ? "bg-red-500 animate-pulse"
                        : recorder.state === "paused"
                          ? "bg-amber-500"
                          : recorder.state === "stopped"
                            ? "bg-emerald-500"
                            : "bg-gray-300",
                    )}
                  />
                  <span className="text-sm font-medium text-[var(--cs-text-secondary)]">
                    {recorder.state === "recording"
                      ? "Recording"
                      : recorder.state === "paused"
                        ? "Paused"
                        : recorder.state === "stopped"
                          ? "Captured"
                          : "Ready"}
                  </span>
                  <Badge
                    variant="outline"
                    className="border-[var(--cs-border)] text-xs text-[var(--cs-text-muted)]"
                  >
                    {formatDuration(recorder.durationMs)}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  {(recorder.state === "idle" || recorder.state === "ready") && (
                    <Button
                      onClick={() => recorder.start()}
                      disabled={!recorder.isSupported || !recorder.isSecure}
                      className="gap-1.5 bg-red-600 hover:bg-red-700"
                      size="sm"
                    >
                      <Mic className="h-3.5 w-3.5" /> Start Recording
                    </Button>
                  )}
                  {recorder.state === "recording" && (
                    <>
                      <Button variant="outline" size="sm" onClick={recorder.pause} className="gap-1.5">
                        <Pause className="h-3.5 w-3.5" /> Pause
                      </Button>
                      <Button variant="outline" size="sm" onClick={recorder.stop} className="gap-1.5">
                        <Square className="h-3.5 w-3.5" /> Stop
                      </Button>
                    </>
                  )}
                  {recorder.state === "paused" && (
                    <>
                      <Button variant="outline" size="sm" onClick={recorder.resume} className="gap-1.5">
                        <Play className="h-3.5 w-3.5" /> Resume
                      </Button>
                      <Button variant="outline" size="sm" onClick={recorder.stop} className="gap-1.5">
                        <Square className="h-3.5 w-3.5" /> Stop
                      </Button>
                    </>
                  )}
                  {recorder.state === "stopped" && (
                    <>
                      <Button
                        onClick={submitForTranscription}
                        disabled={transcribing}
                        size="sm"
                        className="gap-1.5"
                      >
                        {transcribing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        {transcribing ? "Transcribing..." : "Transcribe"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={recorder.reset} className="gap-1.5">
                        <RotateCw className="h-3.5 w-3.5" /> Re-record
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Audio playback */}
              {recorder.audioObjectUrl && (
                <audio src={recorder.audioObjectUrl} controls className="w-full" />
              )}

              {/* Transcription error */}
              {transcriptError && (
                <Notice tone="red" title="Transcription error">
                  {transcriptError}
                </Notice>
              )}
            </CardContent>
          </Card>

          {/* Transcript area */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-[var(--cs-text-secondary)]">
                <FileText className="h-4 w-4" /> Transcript
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Record audio above and transcribe it, or type/paste your transcript directly here..."
                className="min-h-[160px] text-sm"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--cs-text-muted)]">
                  {transcript.length > 0
                    ? `${transcript.split(/\s+/).filter(Boolean).length} words`
                    : "No transcript yet"}
                </span>
                <div className="flex gap-2">
                  {transcript && (
                    <Button variant="outline" size="sm" onClick={() => setTranscript("")}>
                      Clear
                    </Button>
                  )}
                  <Button
                    onClick={processTranscript}
                    disabled={!transcript.trim() || processing}
                    size="sm"
                    className="gap-1.5 bg-[var(--cs-navy)] text-white hover:bg-[var(--cs-navy)]/90"
                  >
                    {processing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {processing ? "Processing..." : "Process with Cara"}
                  </Button>
                </div>
              </div>

              {processError && (
                <Notice tone="red" title="Processing error">
                  {processError}
                </Notice>
              )}
            </CardContent>
          </Card>

          {/* Structured Output Viewer */}
          {caraResponse && (
            <Card className="border-[var(--cs-cara-gold-soft)]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-[var(--cs-navy)]">
                    <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
                    Cara Structured Output
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-xs",
                        riskLevelColor(caraResponse.riskLevel),
                      )}
                    >
                      {caraResponse.riskLevel} risk
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {caraResponse.agentUsed?.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {caraResponse.confidence}% confidence
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Blocked notice */}
                {caraResponse.blocked && (
                  <Notice tone="red" title="Output blocked">
                    {caraResponse.blockReason ?? "Safety governor blocked this output."}
                  </Notice>
                )}

                {/* Escalation recommendation */}
                {caraResponse.escalationRecommended && (
                  <Notice tone="amber" title="Escalation recommended">
                    Cara recommends this content be reviewed by a manager or safeguarding lead before
                    any action is taken.
                  </Notice>
                )}

                {/* Main content */}
                <div className="rounded-md border border-[var(--cs-border)] bg-white p-4">
                  <div className="prose prose-sm max-w-none text-[var(--cs-text-secondary)]">
                    <MarkdownContent content={caraResponse.answer} />
                  </div>
                </div>

                {/* Safety flags */}
                {caraResponse.safetyNotes.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--cs-text-muted)] uppercase">
                      <Shield className="h-3.5 w-3.5" /> Safety Notes
                    </div>
                    <div className="space-y-1">
                      {caraResponse.safetyNotes.map((note, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900"
                        >
                          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                          <span>{note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested actions */}
                {caraResponse.suggestedActions.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--cs-text-muted)] uppercase">
                      <Activity className="h-3.5 w-3.5" /> Suggested Actions
                    </div>
                    <div className="space-y-1.5">
                      {caraResponse.suggestedActions.map((action, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 rounded border border-[var(--cs-border)] bg-white p-2.5 text-xs"
                        >
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <div>
                            <div className="font-medium text-[var(--cs-navy)]">{action.title}</div>
                            <div className="text-[var(--cs-text-muted)]">{action.description}</div>
                            {action.priority && (
                              <Badge variant="outline" className="mt-1 text-[10px]">
                                {action.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evidence trail */}
                {caraResponse.evidenceUsed.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--cs-text-muted)] uppercase">
                      <FileText className="h-3.5 w-3.5" /> Evidence Used ({caraResponse.evidenceUsed.length})
                    </div>
                    <div className="space-y-1">
                      {caraResponse.evidenceUsed.slice(0, 5).map((ev, i) => (
                        <div
                          key={i}
                          className="rounded border border-[var(--cs-border)] bg-gray-50 p-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {ev.sourceTable}
                            </Badge>
                            {ev.sourceTitle && (
                              <span className="font-medium text-[var(--cs-navy)]">
                                {ev.sourceTitle}
                              </span>
                            )}
                            <span className="ml-auto text-[var(--cs-text-muted)]">
                              {Math.round(ev.relevanceScore * 100)}% match
                            </span>
                          </div>
                          {ev.sourceExcerpt && (
                            <p className="mt-1 text-[var(--cs-text-muted)] line-clamp-2">
                              {ev.sourceExcerpt}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save to record dropdown */}
                <div className="flex items-center gap-3 border-t border-[var(--cs-border)] pt-4">
                  <div className="relative">
                    <Button
                      onClick={() => setSaveDropdownOpen(!saveDropdownOpen)}
                      disabled={saving || caraResponse.blocked}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                      size="sm"
                    >
                      {saving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      Save to Record
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>

                    {saveDropdownOpen && (
                      <div className="absolute bottom-full left-0 z-10 mb-1 w-56 rounded-md border border-[var(--cs-border)] bg-white py-1 shadow-lg">
                        {RECORD_TYPE_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => saveToRecord(opt.value)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                            >
                              <Icon className="h-4 w-4 text-[var(--cs-text-muted)]" />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Button variant="outline" size="sm" onClick={resetAll} className="gap-1.5">
                    <RotateCw className="h-3.5 w-3.5" /> New Capture
                  </Button>

                  {saveSuccess && (
                    <span className="flex items-center gap-1 text-xs text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {saveSuccess}
                    </span>
                  )}
                  {saveError && (
                    <span className="flex items-center gap-1 text-xs text-red-700">
                      <AlertTriangle className="h-3.5 w-3.5" /> {saveError}
                    </span>
                  )}
                </div>

                {/* Audit ID */}
                <div className="text-[10px] text-[var(--cs-text-muted)]">
                  Audit: {caraResponse.auditId} | Session: {caraResponse.sessionId ?? "none"}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Recent history */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-[var(--cs-text-secondary)]">
                <Clock className="h-4 w-4" /> Recent Voice Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center gap-2 py-4 text-sm text-[var(--cs-text-muted)]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading history...
                </div>
              ) : history.length === 0 ? (
                <div className="py-4 text-center text-sm text-[var(--cs-text-muted)]">
                  No voice sessions yet. Record or paste a transcript to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((entry) => (
                    <HistoryCard
                      key={entry.id}
                      entry={entry}
                      onLoadTranscript={(text) => {
                        setTranscript(text);
                        setCaraResponse(null);
                        setSaveSuccess(null);
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function HistoryCard({
  entry,
  onLoadTranscript,
}: {
  entry: HistoryEntry;
  onLoadTranscript: (transcript: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border border-[var(--cs-border)] p-2.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge
            className={cn("text-[10px]", riskLevelColor(entry.riskLevel))}
          >
            {entry.riskLevel}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {entry.inputType}
          </Badge>
        </div>
        <span className="text-[var(--cs-text-muted)]">
          {formatRelativeTime(entry.createdAt)}
        </span>
      </div>

      <p className="mt-1.5 line-clamp-2 text-[var(--cs-text-secondary)]">
        {entry.transcript.slice(0, 120)}
        {entry.transcript.length > 120 && "..."}
      </p>

      <div className="mt-2 flex gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-[10px]"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Hide" : "View"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-[10px]"
          onClick={() => onLoadTranscript(entry.transcript)}
        >
          Re-use
        </Button>
      </div>

      {expanded && (
        <div className="mt-2 rounded border border-[var(--cs-border)] bg-gray-50 p-2 text-[11px] text-[var(--cs-text-secondary)]">
          <MarkdownContent content={entry.structuredOutput} />
        </div>
      )}
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  // Simple markdown-to-JSX renderer for bold, headings, lists
  const lines = content.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-semibold text-[var(--cs-navy)]">
              {line.replace(/\*\*/g, "")}
            </p>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="mt-2 font-semibold text-[var(--cs-navy)]">
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h2 key={i} className="mt-3 text-base font-semibold text-[var(--cs-navy)]">
              {line.slice(2)}
            </h2>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={i} className="flex items-start gap-1.5 pl-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--cs-text-muted)]" />
              <span>{renderInlineMarkdown(line.slice(2))}</span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          const match = line.match(/^(\d+)\.\s(.*)$/);
          if (match) {
            return (
              <div key={i} className="flex items-start gap-1.5 pl-2">
                <span className="shrink-0 font-medium text-[var(--cs-text-muted)]">
                  {match[1]}.
                </span>
                <span>{renderInlineMarkdown(match[2])}</span>
              </div>
            );
          }
        }
        if (line.trim() === "") {
          return <div key={i} className="h-1.5" />;
        }
        return <p key={i}>{renderInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

function renderInlineMarkdown(text: string): React.ReactNode {
  // Handle bold text within lines
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[var(--cs-navy)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function Notice({
  tone,
  title,
  children,
}: {
  tone: "amber" | "red";
  title: string;
  children: React.ReactNode;
}) {
  const cls =
    tone === "amber"
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : "border-red-300 bg-red-50 text-red-900";
  return (
    <div className={cn("flex items-start gap-3 rounded-md border p-3 text-sm", cls)}>
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
      <div>
        <div className="font-semibold">{title}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}

// ── Utilities ────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function riskLevelColor(level: string): string {
  switch (level) {
    case "low":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "medium":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "high":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "critical":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}
