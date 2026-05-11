"use client";

// ══════════════════════════════════════════════════════════════════════════════
// AriaDictationPanel
//
// Modal/drawer for ARIA voice dictation. Handles every state the spec calls
// out: insecure context, browser unsupported, permission denied, no
// microphone found, recording, paused, transcribing, transcript editor,
// transcription not configured, retry on error.
//
// The panel never auto-records. Recording starts only after explicit user
// action. Tracks are cleaned up on close, cancel and unmount via the hook.
// ══════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Mic,
  Pause,
  Play,
  Square,
  X,
  Loader2,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  RotateCw,
} from "lucide-react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import type { AriaRole } from "@/lib/aria/aria-permissions";

export interface AriaDictationPanelProps {
  open: boolean;
  onClose: () => void;
  actorUserId: string;
  actorRole: AriaRole;
  organisationId?: string;
  homeId?: string;
  sourceModule?: string;
  sourceField?: string;
  onTranscript: (transcript: string) => void;
  onSendToAria?: (transcript: string) => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function AriaDictationPanel(props: AriaDictationPanelProps) {
  const {
    open,
    onClose,
    actorUserId,
    actorRole,
    organisationId,
    homeId,
    sourceModule,
    sourceField,
    onTranscript,
    onSendToAria,
  } = props;

  const recorder = useAudioRecorder();
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  // Reset internal state when the panel opens.
  useEffect(() => {
    if (open) {
      setTranscript("");
      setTranscriptError(null);
      recorder.reset();
    } else {
      recorder.cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  async function submitForTranscription() {
    if (!recorder.audioBlob) return;
    setTranscribing(true);
    setTranscriptError(null);
    try {
      const form = new FormData();
      form.append("file", recorder.audioBlob, `recording.${(recorder.audioMimeType ?? "webm").split("/")[1].split(";")[0]}`);
      form.append("actorUserId", actorUserId);
      form.append("actorRole", actorRole);
      if (organisationId) form.append("organisationId", organisationId);
      if (homeId) form.append("homeId", homeId);
      if (sourceModule) form.append("sourceModule", sourceModule);
      if (sourceField) form.append("sourceField", sourceField);
      form.append("durationMs", String(recorder.durationMs));

      const res = await fetch("/api/aria/transcribe", { method: "POST", body: form });
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="ARIA voice dictation"
    >
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-[var(--cs-aria-gold)]" /> ARIA voice dictation
            </span>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)] p-3 text-xs text-[var(--cs-navy)]">
            Recordings are kept on your device until you submit them. The audio is sent securely
            to the configured provider for transcription and is then discarded server-side. The
            transcript is editable before you use it.
          </div>

          {recorder.state === "insecure_context" || !recorder.isSecure ? (
            <Notice tone="amber" title="Secure connection required">
              {recorder.errorMessage ?? "Open this page over HTTPS or via localhost to dictate."}
            </Notice>
          ) : recorder.state === "browser_unsupported" || !recorder.isSupported ? (
            <Notice tone="amber" title="Browser not supported">
              {recorder.errorMessage ?? "Voice dictation isn't supported in this browser."}
            </Notice>
          ) : recorder.state === "permission_denied" ? (
            <Notice tone="amber" title="Microphone permission denied">
              {recorder.errorMessage ?? "Allow microphone access in your browser and try again."}
              <Button variant="outline" size="sm" className="mt-2 gap-1.5" onClick={() => recorder.start()}>
                <RotateCw className="h-3.5 w-3.5" /> Try again
              </Button>
            </Notice>
          ) : recorder.state === "no_microphone" ? (
            <Notice tone="amber" title="No microphone found">
              {recorder.errorMessage ?? "Connect a microphone and try again."}
            </Notice>
          ) : recorder.state === "error" ? (
            <Notice tone="red" title="Something went wrong">
              {recorder.errorMessage ?? "The recorder hit an error. Please try again."}
              <Button variant="outline" size="sm" className="mt-2 gap-1.5" onClick={() => recorder.start()}>
                <RotateCw className="h-3.5 w-3.5" /> Try again
              </Button>
            </Notice>
          ) : null}

          {/* Recording controls */}
          <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-block h-2.5 w-2.5 rounded-full",
                    recorder.state === "recording"
                      ? "bg-red-500 animate-pulse"
                      : recorder.state === "paused"
                        ? "bg-amber-500"
                        : "bg-[var(--cs-text-gentle)]",
                  )}
                />
                <span className="text-sm font-medium text-[var(--cs-text-secondary)]">
                  {recorder.state === "recording"
                    ? "Recording"
                    : recorder.state === "paused"
                      ? "Paused"
                      : recorder.state === "stopped"
                        ? "Recording captured"
                        : "Ready"}
                </span>
                <Badge className="border bg-[var(--cs-surface)] text-[var(--cs-text-secondary)] border-[var(--cs-border)] text-xs">
                  {formatDuration(recorder.durationMs)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {recorder.state === "idle" || recorder.state === "ready" ? (
                  <Button
                    onClick={() => recorder.start()}
                    disabled={!recorder.isSupported || !recorder.isSecure}
                    className="gap-1.5"
                  >
                    <Mic className="h-4 w-4" /> Start
                  </Button>
                ) : null}
                {recorder.state === "recording" ? (
                  <>
                    <Button variant="outline" onClick={recorder.pause} className="gap-1.5">
                      <Pause className="h-4 w-4" /> Pause
                    </Button>
                    <Button variant="outline" onClick={recorder.stop} className="gap-1.5">
                      <Square className="h-4 w-4" /> Stop
                    </Button>
                  </>
                ) : null}
                {recorder.state === "paused" ? (
                  <>
                    <Button variant="outline" onClick={recorder.resume} className="gap-1.5">
                      <Play className="h-4 w-4" /> Resume
                    </Button>
                    <Button variant="outline" onClick={recorder.stop} className="gap-1.5">
                      <Square className="h-4 w-4" /> Stop
                    </Button>
                  </>
                ) : null}
                {recorder.state === "stopped" ? (
                  <>
                    <Button onClick={submitForTranscription} disabled={transcribing} className="gap-1.5">
                      {transcribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {transcribing ? "Transcribing" : "Transcribe"}
                    </Button>
                    <Button variant="outline" onClick={recorder.reset} className="gap-1.5">
                      <RotateCw className="h-4 w-4" /> Re-record
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
            {recorder.audioObjectUrl ? (
              <audio src={recorder.audioObjectUrl} controls className="mt-3 w-full" />
            ) : null}
          </div>

          {/* Transcript area */}
          {transcript || transcribing || transcriptError ? (
            <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 space-y-3">
              <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase">Transcript</div>
              {transcribing ? (
                <div className="flex items-center gap-2 text-sm text-[var(--cs-text-secondary)]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Transcribing
                </div>
              ) : null}
              {transcriptError ? (
                <Notice tone="red" title="Transcription error">
                  {transcriptError}
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" size="sm" onClick={submitForTranscription} className="gap-1.5">
                      <RotateCw className="h-3.5 w-3.5" /> Try again
                    </Button>
                  </div>
                </Notice>
              ) : null}
              {transcript ? (
                <>
                  <Textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="min-h-[140px] text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => onTranscript(transcript)}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Insert into field
                    </Button>
                    {onSendToAria ? (
                      <Button variant="outline" onClick={() => onSendToAria(transcript)} className="gap-1.5">
                        <Sparkles className="h-4 w-4" /> Use with ARIA
                      </Button>
                    ) : null}
                    <Button variant="outline" onClick={() => setTranscript("")} className="gap-1.5">
                      Clear
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
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
      <AlertTriangle className="h-4 w-4 mt-0.5" />
      <div>
        <div className="font-semibold">{title}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}
