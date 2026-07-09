"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Ask Cara chat (deterministic, record-based)
//
// A real AI-platform surface: full-bleed dark gradient, a centred greeting
// ("Hi <name> — ready when you are"), and a floating pill composer with + / mic /
// send — the Gemini/Claude visual language. Underneath it stays PURELY
// DETERMINISTIC: every answer comes from the record engine via
// POST /api/v1/cara/chat { mode: "ask" }; Cara never invents a fact.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from "react";
import { Loader2, ArrowUp, Plus } from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import { DictationButton } from "@/components/common/dictation-button";
import { CaraTaskLauncher } from "./cara-task-launcher";
import type { CaraDrawerContext } from "./cara-drawer";
import type { AskCaraAnswer, AskCaraSource, AskCaraSuggestion } from "@/lib/ask-cara/types";

interface ChatMessage {
  id: string;
  role: "user" | "cara";
  text: string;
  sources?: AskCaraSource[];
  suggestions?: AskCaraSuggestion[];
  answered?: boolean;
}

let counter = 0;
const nextId = () => `m${++counter}`;

/** Cara's four-point spark — gradient, Gemini-style. */
function CaraStar({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id="cara-star-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="45%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <path
        d="M12 0 C13.4 6.9 17.1 10.6 24 12 C17.1 13.4 13.4 17.1 12 24 C10.6 17.1 6.9 13.4 0 12 C6.9 10.6 10.6 6.9 12 0 Z"
        fill="url(#cara-star-g)"
      />
    </svg>
  );
}

export function CaraChat({ context }: { context: CaraDrawerContext }) {
  const { currentUser, currentRole } = useAuthContext();
  const firstName = currentUser?.first_name || (currentUser?.full_name ? currentUser.full_name.split(/\s+/)[0] : "") || "there";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // Conversation continuity: the child Cara last resolved — so a follow-up like
  // "what triggers her?" stays about the same child without renaming them.
  const [lastChildId, setLastChildId] = useState<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const empty = messages.length === 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { id: nextId(), role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/cara/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "ask",
          prompt: q,
          userName: currentUser?.full_name || firstName,
          role: currentRole,
          pageTitle: context.pageTitle,
          // Page context wins; otherwise carry the conversation's child forward.
          childId: context.childId ?? lastChildId,
          // Last few turns — continuity for the grounded LLM voice (facts still
          // come only from the records; the engine stays single-turn).
          history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text.slice(0, 400) })),
        }),
      });
      const data = await res.json();
      const a: AskCaraAnswer | undefined = data?.answer;
      if (typeof data?.resolvedChildId === "string") setLastChildId(data.resolvedChildId);
      setMessages((m) => [
        ...m,
        a
          ? { id: nextId(), role: "cara", text: a.text, sources: a.sources, suggestions: a.suggestions, answered: a.answered }
          : { id: nextId(), role: "cara", text: "I couldn't reach the records just now — please try again in a moment.", answered: false },
      ]);
    } catch {
      setMessages((m) => [...m, { id: nextId(), role: "cara", text: "I couldn't reach the records just now — please try again in a moment.", answered: false }]);
    } finally {
      setLoading(false);
    }
  }

  const chip = (label: string, i: number) => (
    <button
      key={i}
      type="button"
      onClick={() => send(label)}
      disabled={loading}
      className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[12.5px] font-medium text-slate-200 backdrop-blur transition-colors hover:bg-white/10 disabled:opacity-50"
    >
      {label}
    </button>
  );

  return (
    <div
      className="relative flex h-full min-h-0 flex-col"
      style={{ background: "linear-gradient(180deg, #05060a 0%, #070b15 55%, #0e1733 100%)" }}
    >
      {/* Hero + governed task launcher — empty state */}
      {empty && !loading && (
        <div className="flex-1 overflow-y-auto px-4 pb-28 pt-6">
          <div className="mb-5 flex flex-col items-center gap-3 text-center">
            <CaraStar size={40} className="drop-shadow-[0_0_18px_rgba(96,165,250,0.45)]" />
            <div>
              <h2 className="text-[22px] font-light leading-snug text-slate-100">Hi {firstName} — ready when you are</h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-400">
                Pick a task, or ask below. I answer from this home&apos;s records — never a guess.
              </p>
            </div>
          </div>
          <CaraTaskLauncher role={currentRole} onAsk={send} />
        </div>
      )}

      {/* Thread */}
      {!empty && (
        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-4 pb-28 pt-4">
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-indigo-500/90 px-4 py-2 text-sm leading-relaxed text-white shadow-lg shadow-indigo-950/40">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex gap-2.5">
                <CaraStar size={18} className="mt-1 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{m.text}</p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.sources.map((sce, i) => (
                        <span key={i} className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] text-slate-400">
                          {sce.label}: <span className="font-semibold text-slate-200">{sce.count}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">{m.suggestions.map((sg, i) => chip(sg.label, i))}</div>
                  )}
                </div>
              </div>
            )
          )}
          {loading && (
            <div className="flex items-center gap-2.5">
              <CaraStar size={18} className="animate-pulse" />
              <span className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking the records…
              </span>
            </div>
          )}
        </div>
      )}

      {/* Floating pill composer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-3 pt-8" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(8,11,21,0.9) 55%)" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-[#161b2b]/95 px-1.5 py-1.5 shadow-2xl shadow-black/50 backdrop-blur focus-within:border-indigo-400/40"
        >
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setInput("");
            }}
            title="New conversation"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
          >
            <Plus className="h-4.5 w-4.5" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Ask Cara"
            className="max-h-24 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          {/* Local --cs-* overrides re-theme the shared mic for the dark pill without touching it */}
          <span
            className="shrink-0"
            style={{ "--cs-border": "rgba(255,255,255,0.12)", "--cs-surface": "rgba(255,255,255,0.06)", "--cs-text-gentle": "#94a3b8", "--cs-navy": "#1e293b" } as React.CSSProperties}
          >
            <DictationButton
              size="sm"
              mode="append"
              onTranscript={(t) => setInput((v) => (v ? `${v.trimEnd()} ${t}` : t))}
            />
          </span>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-900/50 transition-colors hover:bg-indigo-400 disabled:opacity-40"
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
        <p className="pointer-events-auto mt-1.5 text-center text-[10px] leading-relaxed text-slate-500">
          Cara answers from your live records to support your judgement — never a safeguarding decision.
        </p>
      </div>
    </div>
  );
}
