"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Ask Cara chat (deterministic, record-based)
//
// A real AI-platform-style chat: greets the user by name, takes a question, and
// answers it straight from the home's records — no LLM, no external call, so it
// works with zero AI credit. Every answer comes from the deterministic engine via
// POST /api/v1/cara/chat { mode: "ask" }; Cara never invents a fact.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Loader2, ArrowUp, User } from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
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

function starterQuestions(ctx: CaraDrawerContext): string[] {
  if (ctx.childName) {
    return [
      `Tell me about ${ctx.childName}`,
      `Does ${ctx.childName} have restraints without a debrief?`,
      `How many incidents for ${ctx.childName} this month?`,
    ];
  }
  return ["What needs my attention today?", "Brief me for my shift", "Help me reflect on a child", "What's due this week?"];
}

export function CaraChat({ context }: { context: CaraDrawerContext }) {
  const { currentUser, currentRole } = useAuthContext();
  const firstName = currentUser?.first_name || (currentUser?.full_name ? currentUser.full_name.split(/\s+/)[0] : "") || "there";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const starters = starterQuestions(context);

  // Personalised greeting once, on open.
  useEffect(() => {
    setMessages([
      {
        id: nextId(),
        role: "cara",
        text: `Hi ${firstName} — I'm Cara. I can answer questions straight from this home's records: incidents, the children placed here, what needs your attention, restraints and debriefs, missing episodes, medication and overdue actions. What can I help you with today?`,
        suggestions: starters.map((label) => ({ label })),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, context.childName]);

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
          childId: context.childId,
        }),
      });
      const data = await res.json();
      const a: AskCaraAnswer | undefined = data?.answer;
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

  return (
    <div className="flex h-full flex-col">
      {/* Thread */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-1 py-2">
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-indigo-600 px-3.5 py-2 text-sm text-white">{m.text}</div>
              <div className="ml-2 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                <User className="h-3.5 w-3.5" />
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{m.text}</p>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.sources.map((sce, i) => (
                      <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                        {sce.label}: <span className="font-semibold text-slate-700">{sce.count}</span>
                      </span>
                    ))}
                  </div>
                )}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {m.suggestions.map((sg, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => send(sg.label)}
                        disabled={loading}
                        className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[12px] font-medium text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-50"
                      >
                        {sg.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
        {loading && (
          <div className="flex gap-2">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking the records…
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-slate-100 pt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100"
        >
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
            placeholder="Ask Cara about your records…"
            className="max-h-28 flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-1.5 px-1 text-[10px] leading-relaxed text-slate-400">
          Cara answers from your live records to support your judgement — it never makes a safeguarding decision for you.
        </p>
      </div>
    </div>
  );
}
