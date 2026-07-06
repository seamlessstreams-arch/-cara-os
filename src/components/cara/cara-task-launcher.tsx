"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Ask CARA task launcher (§2)
// Governed task cards, grouped and role-gated. "ask" cards send a prompt to the
// deterministic engine; "route" cards open a real CARA feature. Not a chatbot —
// the user picks a sanctioned task.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { ASK_CARA_BANNER, taskCardsForRole } from "@/lib/ask-cara/task-cards";

export function CaraTaskLauncher({ role, onAsk }: { role?: string; onAsk: (prompt: string) => void }) {
  const groups = taskCardsForRole(role);

  return (
    <div className="space-y-4">
      {/* Governance banner */}
      <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11.5px] leading-relaxed text-amber-200/90">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
        <span>{ASK_CARA_BANNER}</span>
      </div>

      {groups.map((g) => (
        <div key={g.category}>
          <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{g.category}</p>
          <div className="grid grid-cols-1 gap-1.5">
            {g.cards.map((c) => {
              const inner = (
                <>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-slate-100">{c.label}</p>
                    <p className="truncate text-[11px] text-slate-400">{c.description}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-500 transition-colors group-hover:text-indigo-300" />
                </>
              );
              const cls =
                "group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left transition-colors hover:border-indigo-400/30 hover:bg-white/[0.06]";
              return c.action.type === "route" ? (
                <Link key={c.id} href={c.action.href} className={cls}>
                  {inner}
                </Link>
              ) : (
                <button key={c.id} type="button" onClick={() => onAsk((c.action as { prompt: string }).prompt)} className={cls}>
                  {inner}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
