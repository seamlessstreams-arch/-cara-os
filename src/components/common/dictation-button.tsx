"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — DICTATION BUTTON
// Reusable voice-input component using the Web Speech API.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DictationButtonProps {
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  mode?: "append" | "replace";
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

// ── Web Speech API type shims ─────────────────────────────────────────────────
// These are not in the default lib — declared here so TSC is happy.

interface SpeechRecognitionResultItem {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

// ── Size maps ─────────────────────────────────────────────────────────────────

const SIZE_ICON: Record<string, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const SIZE_BTN: Record<string, string> = {
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function DictationButton({
  onTranscript,
  onInterimTranscript,
  className,
  size = "md",
  disabled = false,
}: DictationButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interim, setInterim] = useState("");

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  // True while the user wants to keep dictating — drives auto-restart so a long,
  // continuous "record everything" entry survives the browser's pause/timeout cut-offs.
  const wantListeningRef = useRef(false);

  // The recognition handlers below are bound ONCE and live for the whole dictation
  // (including every auto-restart after a pause). Calling the props directly would
  // freeze them at the field value from when dictation started — so each finalised
  // phrase would overwrite everything said before it. Keeping the latest callbacks
  // in refs means every phrase is delivered to the CURRENT handler, which appends
  // to the up-to-date text. This is what lets staff dictate paragraphs across pauses
  // without losing anything.
  const onTranscriptRef = useRef(onTranscript);
  const onInterimRef = useRef(onInterimTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onInterimRef.current = onInterimTranscript;
  });

  // ── Support check (client-side only) ────────────────────────────────────────
  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    setIsSupported(supported);
  }, []);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // ── Build + start a recognition session ──────────────────────────────────────
  // Factored out so onend can auto-restart it: browsers end recognition after a
  // pause or a ~60s cap, but for "record everything" we want continuous capture
  // until the user actually presses Stop.
  const beginRecognition = () => {
    // Tear down any existing recogniser FIRST so we never run two at once — two
    // live sessions deliver every phrase twice, which is the "doubled words" bug.
    // Detach its handlers so its onend can't auto-restart the orphan.
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
      } catch {
        /* already dead */
      }
      recognitionRef.current = null;
    }

    const SpeechRecognitionCtor: SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition: SpeechRecognitionInstance = new SpeechRecognitionCtor();
    recognition.continuous = true;       // keep listening for a whole entry, not one phrase
    recognition.interimResults = true;
    recognition.lang = "en-GB";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setInterim(interimTranscript);
      if (interimTranscript && onInterimRef.current) onInterimRef.current(interimTranscript);
      if (finalTranscript) {
        onTranscriptRef.current(finalTranscript);
        setInterim("");
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent): void => {
      const code = event.error;
      // Fatal errors: stop trying so we don't loop the permission prompt or spin offline.
      if (code === "not-allowed" || code === "service-not-allowed") {
        wantListeningRef.current = false;
        setError("Microphone blocked — allow mic access in your browser, then try again");
      } else if (code === "audio-capture") {
        wantListeningRef.current = false;
        setError("No microphone found");
      } else if (code === "network") {
        wantListeningRef.current = false;
        setError("Voice input needs an internet connection");
      } else if (code === "no-speech") {
        setError("No speech detected — keep talking");   // non-fatal: onend auto-restarts
      } else if (code !== "aborted") {
        setError("Voice input error");
      }
    };

    recognition.onend = () => {
      // Only the CURRENT recogniser may auto-restart. An orphaned instance (after
      // Stop, or replaced by a newer session on a quick Stop→Start) must die —
      // otherwise it resurrects itself alongside the new one and every phrase is
      // captured twice ("doubled words").
      if (recognitionRef.current !== recognition) return;
      if (wantListeningRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          /* some engines refuse a same-instance restart — fall through to stop */
        }
      }
      setIsListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      /* start() throws if a session is somehow already active — ignore */
    }
  };

  // ── Start listening ──────────────────────────────────────────────────────────
  const startListening = () => {
    if (!isSupported || disabled) return;
    // Guard against a second concurrent session (double-click / fast re-render
    // before onstart flips the button to "Stop"). Two sessions = doubled words.
    if (wantListeningRef.current) return;
    setError(null);
    setInterim("");
    wantListeningRef.current = true;
    beginRecognition();
  };

  // ── Stop listening ───────────────────────────────────────────────────────────
  const stopListening = () => {
    wantListeningRef.current = false;    // prevent auto-restart
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* no active session */ }
    }
    setIsListening(false);
    setInterim("");
  };

  // ── Render: not supported ────────────────────────────────────────────────────
  if (!isSupported) {
    return (
      <div
        className={cn("relative group inline-flex", className)}
        title="Voice input isn't supported here — try Chrome, Edge or Safari"
      >
        <button
          disabled
          aria-label="Voice input not supported"
          className={cn(
            "inline-flex items-center justify-center rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text-gentle)] cursor-not-allowed transition-colors",
            SIZE_BTN[size]
          )}
        >
          <MicOff className={SIZE_ICON[size]} />
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50">
          <div className="whitespace-nowrap rounded-lg bg-[var(--cs-navy)] px-2.5 py-1.5 text-[11px] text-white shadow-[var(--cs-shadow-card)]">
            Voice input isn't supported here — try Chrome, Edge or Safari
          </div>
        </div>
      </div>
    );
  }

  // ── Render: listening ────────────────────────────────────────────────────────
  if (isListening) {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <button
          onClick={stopListening}
          aria-label="Stop listening"
          className={cn(
            "inline-flex items-center justify-center rounded-lg bg-red-100 text-red-600 border border-red-200 transition-all",
            "animate-pulse",
            SIZE_BTN[size]
          )}
        >
          <Mic className={SIZE_ICON[size]} />
        </button>
        <button
          onClick={stopListening}
          className="inline-flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100 transition-colors"
        >
          <Square className="h-2.5 w-2.5 fill-red-600" />
          Stop
        </button>
        <span className="max-w-[200px] truncate text-[11px] text-[var(--cs-text-muted)]" title={interim || "Listening…"}>
          {interim ? interim : <span className="animate-pulse">Listening…</span>}
        </span>
      </div>
    );
  }

  // ── Render: idle / error ─────────────────────────────────────────────────────
  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <button
        onClick={startListening}
        disabled={disabled}
        aria-label="Start voice input"
        title={error ?? "Click to dictate"}
        className={cn(
          "inline-flex items-center justify-center rounded-lg border transition-colors",
          error
            ? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
            : "border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text-muted)] hover:bg-[var(--cs-cara-gold-bg)] hover:border-[var(--cs-cara-gold-soft)] hover:text-[var(--cs-cara-gold)]",
          disabled && "opacity-40 cursor-not-allowed pointer-events-none",
          SIZE_BTN[size]
        )}
      >
        <Mic className={SIZE_ICON[size]} />
      </button>
      {error && (
        <span className="text-[11px] text-amber-600">{error}</span>
      )}
    </div>
  );
}
