"use client";

// ══════════════════════════════════════════════════════════════════════════════
// useAudioRecorder
//
// Microphone capture for Aria voice dictation. Built on the standard Web
// MediaRecorder API. Handles the cases the spec calls out: insecure context,
// missing mediaDevices, permission denied, no microphone found, browser
// unsupported. Tracks are stopped on unmount, on cancel, and on error so
// the microphone is never left active in the background.
//
// The recording is kept entirely in memory until the consumer calls submit().
// The consumer is responsible for sending the audio Blob to /api/aria/transcribe.
// ══════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState =
  | "idle"
  | "permission_denied"
  | "browser_unsupported"
  | "insecure_context"
  | "no_microphone"
  | "ready"
  | "recording"
  | "paused"
  | "stopped"
  | "error";

export interface UseAudioRecorderOptions {
  // Maximum duration in milliseconds. Default 5 minutes. Recording stops
  // automatically when this is reached.
  maxDurationMs?: number;
  // Mime type preference. The hook falls back to the next supported type.
  preferredMimeTypes?: string[];
}

export interface UseAudioRecorderResult {
  state: RecorderState;
  errorMessage: string | null;
  durationMs: number;
  audioBlob: Blob | null;
  audioMimeType: string | null;
  audioObjectUrl: string | null;
  hasRecording: boolean;
  isSupported: boolean;
  isSecure: boolean;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  cancel: () => void;
  reset: () => void;
}

const DEFAULT_PREFERRED_MIMES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/wav",
];

export function useAudioRecorder(
  options: UseAudioRecorderOptions = {},
): UseAudioRecorderResult {
  const maxDurationMs = options.maxDurationMs ?? 5 * 60 * 1000;
  const preferredMimes = options.preferredMimeTypes ?? DEFAULT_PREFERRED_MIMES;

  const [state, setState] = useState<RecorderState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string | null>(null);
  const [audioObjectUrl, setAudioObjectUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Capability checks. Run once on mount.
  const [isSupported, setIsSupported] = useState(true);
  const [isSecure, setIsSecure] = useState(true);

  // Detect browser capabilities on mount. setState-in-effect is the
  // correct pattern here because window / navigator are only available
  // client-side, so we cannot use a useState lazy initialiser.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const secure = window.isSecureContext;
    setIsSecure(secure);
    if (!secure) {
      setState("insecure_context");
      setErrorMessage(
        "Microphone access requires a secure (HTTPS) connection. Open this page over HTTPS or via localhost to dictate.",
      );
      setIsSupported(false);
      return;
    }

    const mr = (window as unknown as { MediaRecorder?: typeof MediaRecorder }).MediaRecorder;
    const md = navigator?.mediaDevices?.getUserMedia;
    if (!mr || !md) {
      setState("browser_unsupported");
      setErrorMessage("Voice dictation isn't supported in this browser.");
      setIsSupported(false);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const stopAndReleaseTracks = useCallback(() => {
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    } catch {
      // ignore
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        try {
          track.stop();
        } catch {
          // ignore
        }
      }
      streamRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  // Cleanup on unmount. Uses stopAndReleaseTracks declared above.
  useEffect(() => {
    return () => {
      stopAndReleaseTracks();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [stopAndReleaseTracks]);

  const pickMimeType = useCallback((): string => {
    const mr = (window as unknown as {
      MediaRecorder?: typeof MediaRecorder & { isTypeSupported?: (s: string) => boolean };
    }).MediaRecorder;
    if (mr?.isTypeSupported) {
      for (const mime of preferredMimes) {
        if (mr.isTypeSupported(mime)) return mime;
      }
    }
    return "";
  }, [preferredMimes]);

  const start = useCallback(async () => {
    if (!isSupported || !isSecure) return;
    setErrorMessage(null);
    setAudioBlob(null);
    setAudioMimeType(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
      setAudioObjectUrl(null);
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const e = err as DOMException;
      if (e.name === "NotAllowedError" || e.name === "SecurityError") {
        setState("permission_denied");
        setErrorMessage(
          "Microphone access was denied. Please allow microphone access in your browser and try again.",
        );
      } else if (e.name === "NotFoundError" || e.name === "OverconstrainedError") {
        setState("no_microphone");
        setErrorMessage("No microphone was found. Connect a microphone and try again.");
      } else {
        setState("error");
        setErrorMessage(e.message || "Could not access the microphone.");
      }
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];
    const mime = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
    } catch (err) {
      stopAndReleaseTracks();
      setState("error");
      setErrorMessage((err as Error).message || "Could not start the recorder.");
      return;
    }

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    });
    recorder.addEventListener("stop", () => {
      const blobMime = recorder.mimeType || mime || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: blobMime });
      setAudioBlob(blob);
      setAudioMimeType(blobMime);
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      setAudioObjectUrl(url);
      setState("stopped");
    });
    recorder.addEventListener("error", () => {
      stopAndReleaseTracks();
      setState("error");
      setErrorMessage("The recorder encountered an error. Please try again.");
    });

    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    setDurationMs(0);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const ms = Date.now() - startedAtRef.current;
      setDurationMs(ms);
      if (ms >= maxDurationMs) {
        try {
          recorder.stop();
        } catch {
          // ignore
        }
      }
    }, 250);

    recorder.start(1000);
    setState("recording");
  }, [isSecure, isSupported, maxDurationMs, pickMimeType, stopAndReleaseTracks]);

  const pause = useCallback(() => {
    const r = recorderRef.current;
    if (r && r.state === "recording") {
      try {
        r.pause();
        setState("paused");
        if (tickRef.current) {
          clearInterval(tickRef.current);
          tickRef.current = null;
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const resume = useCallback(() => {
    const r = recorderRef.current;
    if (r && r.state === "paused") {
      try {
        r.resume();
        setState("recording");
        const resumedAt = Date.now() - durationMs;
        startedAtRef.current = resumedAt;
        if (tickRef.current) clearInterval(tickRef.current);
        tickRef.current = setInterval(() => {
          const ms = Date.now() - resumedAt;
          setDurationMs(ms);
          if (ms >= maxDurationMs) {
            try {
              r.stop();
            } catch {
              // ignore
            }
          }
        }, 250);
      } catch {
        // ignore
      }
    }
  }, [durationMs, maxDurationMs]);

  const stop = useCallback(() => {
    const r = recorderRef.current;
    if (r && r.state !== "inactive") {
      try {
        r.stop();
      } catch {
        // ignore
      }
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        try {
          track.stop();
        } catch {
          // ignore
        }
      }
      streamRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    stopAndReleaseTracks();
    chunksRef.current = [];
    setAudioBlob(null);
    setAudioMimeType(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
      setAudioObjectUrl(null);
    }
    setDurationMs(0);
    setState(isSupported && isSecure ? "idle" : state);
  }, [isSupported, isSecure, state, stopAndReleaseTracks]);

  const reset = useCallback(() => {
    stopAndReleaseTracks();
    chunksRef.current = [];
    setAudioBlob(null);
    setAudioMimeType(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
      setAudioObjectUrl(null);
    }
    setDurationMs(0);
    setErrorMessage(null);
    setState(isSupported && isSecure ? "idle" : state);
  }, [isSupported, isSecure, state, stopAndReleaseTracks]);

  return {
    state,
    errorMessage,
    durationMs,
    audioBlob,
    audioMimeType,
    audioObjectUrl,
    hasRecording: !!audioBlob,
    isSupported,
    isSecure,
    start,
    pause,
    resume,
    stop,
    cancel,
    reset,
  };
}
