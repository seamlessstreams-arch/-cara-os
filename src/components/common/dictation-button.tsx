"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DICTATION BUTTON
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
  mode = "append",
  className,
  size = "md",
  disabled = false,
}: DictationButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

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
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // ── Start listening ──────────────────────────────────────────────────────────
  const startListening = () => {
    if (!isSupported || disabled) return;

    const SpeechRecognitionCtor: SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition: SpeechRecognitionInstance = new SpeechRecognitionCtor();
    recognition.continuous = false;
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

      if (interimTranscript && onInterimTranscript) {
        onInterimTranscript(interimTranscript);
      }

      if (finalTranscript) {
        const text = mode === "replace" ? finalTranscript : finalTranscript;
        onTranscript(text);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent): void => {
      setError(event.error === "no-speech" ? "No speech detected" : "Voice input error");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // ── Stop listening ───────────────────────────────────────────────────────────
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // ── Render: not supported ────────────────────────────────────────────────────
  if (!isSupported) {
    return (
      <div
        className={cn("relative group inline-flex", className)}
        title="Voice input not supported in this browser"
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
            Voice input not supported in this browser
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
        <span className="text-[11px] text-[var(--cs-text-muted)] animate-pulse">Listening...</span>
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
            : "border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text-muted)] hover:bg-[var(--cs-aria-gold-bg)] hover:border-[var(--cs-aria-gold-soft)] hover:text-[var(--cs-aria-gold)]",
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
