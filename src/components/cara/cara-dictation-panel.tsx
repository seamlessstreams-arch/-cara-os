"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraDictationPanel
//
// Modal/drawer for Cara voice dictation. Works in two modes:
//
//  • Server mode  — MediaRecorder → upload → OpenAI Whisper transcription.
//                   Requires OPENAI_API_KEY server-side.
//  • Browser mode — Web Speech API (SpeechRecognition), no API key needed.
//                   Automatically activated when server is not configured.
//
// At open the panel probes GET /api/cara/transcribe to detect which mode
// to use. If server is configured, use server. If not and the browser
// supports SpeechRecognition, use browser. Otherwise show a clear message.
//
// The panel never auto-records. Recording starts only after explicit user
// action. Tracks are cleaned up on close, cancel and unmount.
// ══════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react";

// ── Web Speech API type shims ─────────────────────────────────────────────────
// These are declared locally to avoid conflicts with the global augmentation
// in other files (e.g. dictation-button.tsx).
interface _SpeechResultItem { readonly transcript: string; }
interface _SpeechResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: _SpeechResultItem;
}
interface _SpeechResultList {
  readonly length: number;
  [index: number]: _SpeechResult;
}
interface _SpeechEvent extends Event {
  readonly resultIndex: number;
  readonly results: _SpeechResultList;
}
interface _SpeechErrorEvent extends Event { readonly error: string; }
interface _SpeechInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((ev: Event) => void) | null;
  onresult: ((ev: _SpeechEvent) => void) | null;
  onerror: ((ev: _SpeechErrorEvent) => void) | null;
  onend: ((ev: Event) => void) | null;
}
interface _SpeechCtor { new(): _SpeechInstance; }

function getSpeechCtor(): _SpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"] ?? null) as _SpeechCtor | null;
}
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
  Radio,
} from "lucide-react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import type { CaraRole } from "@/lib/cara/cara-permissions";

export interface CaraDictationPanelProps {
  open: boolean;
  onClose: () => void;
  actorUserId: string;
  actorRole: CaraRole;
  organisationId?: string;
  homeId?: string;
  sourceModule?: string;
  sourceField?: string;
  onTranscript: (transcript: string) => void;
  onSendToCara?: (transcript: string) => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

type DictationMode = "detecting" | "server" | "browser" | "unavailable";

export function CaraDictationPanel(props: CaraDictationPanelProps) {
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
    onSendToCara,
  } = props;

  const recorder = useAudioRecorder();

  // ── Server transcription state ───────────────────────────────────────────
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  // ── Mode detection ────────────────────────────────────────────────────────
  const [mode, setMode] = useState<DictationMode>("detecting");

  // ── Browser speech state ─────────────────────────────────────────────────
  const [browserListening, setBrowserListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<_SpeechInstance | null>(null);

  // ── Probe on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      // Clean up browser speech on close
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      setBrowserListening(false);
      setInterimText("");
      recorder.cancel();
      return;
    }

    setTranscript("");
    setTranscriptError(null);
    setInterimText("");
    setBrowserListening(false);
    recorder.reset();
    setMode("detecting");

    const hasBrowser =
      typeof window !== "undefined" &&
      getSpeechCtor() !== null;

    fetch("/api/cara/transcribe")
      .then((r) => r.json())
      .then((data: { configured?: boolean }) => {
        if (data.configured) {
          setMode("server");
        } else if (hasBrowser) {
          setMode("browser");
        } else {
          setMode("unavailable");
        }
      })
      .catch(() => {
        // Fetch failed — default to browser if available
        if (hasBrowser) {
          setMode("browser");
        } else {
          setMode("unavailable");
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  // ── Server transcription submit ───────────────────────────────────────────
  async function submitForTranscription() {
    if (!recorder.audioBlob) return;
    setTranscribing(true);
    setTranscriptError(null);
    try {
      const form = new FormData();
      form.append(
        "file",
        recorder.audioBlob,
        `recording.${(recorder.audioMimeType ?? "webm").split("/")[1].split(";")[0]}`,
      );
      form.append("actorUserId", actorUserId);
      form.append("actorRole", actorRole);
      if (organisationId) form.append("organisationId", organisationId);
      if (homeId) form.append("homeId", homeId);
      if (sourceModule) form.append("sourceModule", sourceModule);
      if (sourceField) form.append("sourceField", sourceField);
      form.append("durationMs", String(recorder.durationMs));

      const res = await fetch("/api/cara/transcribe", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        if (data.providerConfigured === false) {
          // Server transcription not configured at runtime — switch to browser
          const hasBrowser =
            typeof window !== "undefined" &&
            getSpeechCtor() !== null;
          setMode(hasBrowser ? "browser" : "unavailable");
          recorder.reset();
        } else {
          setTranscriptError(data.error ?? "Transcription failed.");
        }
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

  // ── Browser speech recognition ─────────────────────────────────────────────
  function startBrowserSpeech() {
    if (typeof window === "undefined") return;
    const Ctor = getSpeechCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";

    recognition.onstart = () => {
      setBrowserListening(true);
      setInterimText("");
    };

    recognition.onresult = (event: _SpeechEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim);
      if (final) {
        setTranscript((prev) => (prev ? prev + " " + final.trim() : final.trim()));
        setInterimText("");
      }
    };

    recognition.onerror = (event: _SpeechErrorEvent) => {
      if (event.error !== "no-speech") {
        setTranscriptError(
          event.error === "not-allowed"
            ? "Microphone permission denied. Allow access in your browser and try again."
            : `Voice error: ${event.error}`,
        );
      }
      setBrowserListening(false);
    };

    recognition.onend = () => {
      setBrowserListening(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopBrowserSpeech() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setBrowserListening(false);
    setInterimText("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Cara voice dictation"
    >
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-violet-600" /> Cara voice dictation
              {mode === "browser" && (
                <Badge className="border border-violet-200 bg-violet-50 text-violet-700 text-[10px] font-medium">
                  Browser mode
                </Badge>
              )}
            </span>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* ── Detecting ──────────────────────────────────────────────────── */}
          {mode === "detecting" && (
            <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-5">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400 shrink-0" />
              <p className="text-sm text-slate-600">Detecting transcription mode…</p>
            </div>
          )}

          {/* ── Unavailable ────────────────────────────────────────────────── */}
          {mode === "unavailable" && (
            <Notice tone="amber" title="Voice dictation unavailable">
              Server transcription requires OPENAI_API_KEY, and this browser does
              not support the Web Speech API. Try Chrome or Edge, or add the key
              server-side.
            </Notice>
          )}

          {/* ── Browser mode ───────────────────────────────────────────────── */}
          {mode === "browser" && (
            <>
              <div className="rounded-md border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900">
                Using browser-based dictation (Web Speech API). Speech is processed
                locally — nothing is sent to an external server. The transcript is
                editable before you use it.
              </div>

              {transcriptError && (
                <Notice tone="red" title="Dictation error">
                  {transcriptError}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-1.5"
                    onClick={() => setTranscriptError(null)}
                  >
                    <RotateCw className="h-3.5 w-3.5" /> Dismiss
                  </Button>
                </Notice>
              )}

              <div className="rounded-md border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block h-2.5 w-2.5 rounded-full",
                        browserListening ? "bg-red-500 animate-pulse" : "bg-slate-300",
                      )}
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {browserListening ? "Listening…" : "Ready"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!browserListening ? (
                      <Button onClick={startBrowserSpeech} className="gap-1.5">
                        <Mic className="h-4 w-4" /> Speak
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={stopBrowserSpeech} className="gap-1.5">
                        <Square className="h-4 w-4" /> Stop
                      </Button>
                    )}
                  </div>
                </div>
                {interimText && (
                  <p className="mt-2 text-sm text-slate-400 italic">{interimText}</p>
                )}
              </div>

              {transcript ? (
                <div className="rounded-md border border-slate-200 bg-white p-3 space-y-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Transcript</div>
                  <Textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="min-h-[140px] text-sm"
                    placeholder="Your spoken words will appear here…"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => onTranscript(transcript)}
                      disabled={!transcript.trim()}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Insert into field
                    </Button>
                    {onSendToCara ? (
                      <Button
                        variant="outline"
                        onClick={() => onSendToCara(transcript)}
                        disabled={!transcript.trim()}
                        className="gap-1.5"
                      >
                        <Sparkles className="h-4 w-4" /> Use with Cara
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      onClick={() => { setTranscript(""); setInterimText(""); }}
                      className="gap-1.5"
                    >
                      <RotateCw className="h-3.5 w-3.5" /> Clear
                    </Button>
                  </div>
                </div>
              ) : !browserListening ? (
                <div className="flex items-center gap-2 rounded-md border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-400">
                  <Radio className="h-4 w-4 shrink-0" />
                  Press <strong className="text-slate-600 mx-1">Speak</strong> then talk — your words will appear here.
                </div>
              ) : null}
            </>
          )}

          {/* ── Server mode ────────────────────────────────────────────────── */}
          {mode === "server" && (
            <>
              <div className="rounded-md border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900">
                Recordings are kept on your device until you submit them. The audio
                is sent securely to the configured provider for transcription and is
                then discarded server-side. The transcript is editable before you
                use it.
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

              <div className="rounded-md border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block h-2.5 w-2.5 rounded-full",
                        recorder.state === "recording"
                          ? "bg-red-500 animate-pulse"
                          : recorder.state === "paused"
                            ? "bg-amber-500"
                            : "bg-slate-300",
                      )}
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {recorder.state === "recording"
                        ? "Recording"
                        : recorder.state === "paused"
                          ? "Paused"
                          : recorder.state === "stopped"
                            ? "Recording captured"
                            : "Ready"}
                    </span>
                    <Badge className="border bg-slate-100 text-slate-700 border-slate-200 text-xs">
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
                        <Button
                          onClick={submitForTranscription}
                          disabled={transcribing}
                          className="gap-1.5"
                        >
                          {transcribing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
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

              {transcript || transcribing || transcriptError ? (
                <div className="rounded-md border border-slate-200 bg-white p-3 space-y-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Transcript</div>
                  {transcribing ? (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Loader2 className="h-4 w-4 animate-spin" /> Transcribing
                    </div>
                  ) : null}
                  {transcriptError ? (
                    <Notice tone="red" title="Transcription error">
                      {transcriptError}
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={submitForTranscription}
                          className="gap-1.5"
                        >
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
                        {onSendToCara ? (
                          <Button
                            variant="outline"
                            onClick={() => onSendToCara(transcript)}
                            className="gap-1.5"
                          >
                            <Sparkles className="h-4 w-4" /> Use with Cara
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
            </>
          )}

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
