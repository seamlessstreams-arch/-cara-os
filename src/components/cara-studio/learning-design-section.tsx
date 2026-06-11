"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — LEARNING DESIGN SECTION  (mounted at the top of /cara-studio)
// The doorway into the learning-design engine: tool cards, per-child
// workspaces and the manager review queue count.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useYoungPeople } from "@/hooks/use-young-people";
import {
  Map, ClipboardList, Wand2, RefreshCw, Palette, MessageCircle, HeartHandshake,
  BookOpen, ShieldCheck, ArrowRight, Sparkles,
} from "lucide-react";

const TOOLS = [
  { href: "/cara-studio/curriculum/new", Icon: Map, label: "Create curriculum map", hint: "A weekly learning pathway from the child's needs and risks" },
  { href: "/cara-studio/session/new", Icon: ClipboardList, label: "Create session plan", hint: "5–45 minute sessions adapted to how this child learns" },
  { href: "/cara-studio/adapt", Icon: Wand2, label: "Make this easier for this child", hint: "SEND & communication adaptation of any content" },
  { href: "/cara-studio/incident/new", Icon: RefreshCw, label: "Turn an incident into learning", hint: "Non-shaming reframe, conversation plan, micro-session" },
  { href: "/cara-studio/materials/new", Icon: Palette, label: "Create interactive material", hint: "Visual cards, social stories, scenario cards, audio scripts" },
  { href: "/cara-studio/conversation/new", Icon: MessageCircle, label: "Help me plan this conversation", hint: "PACE-informed phrases you can actually say" },
  { href: "/cara-studio/debrief/new", Icon: HeartHandshake, label: "Staff debrief", hint: "No-blame reflection after a hard moment" },
  { href: "/cara-studio/library", Icon: BookOpen, label: "Resource library", hint: "Approved-first resources Cara draws on" },
  { href: "/cara-studio/review", Icon: ShieldCheck, label: "Review centre", hint: "Manager approval queue and guardrail flags" },
];

export function LearningDesignSection() {
  const { data: review } = useQuery<{ queue: unknown[] }>({
    queryKey: ["cara-review-count"],
    queryFn: async () => (await (await fetch("/api/cara/review")).json()).data,
    refetchInterval: 120_000,
  });
  const { data: yp } = useYoungPeople();
  const children = (yp?.data ?? []) as { id: string; first_name: string }[];
  const queueCount = review?.queue?.length ?? 0;

  return (
    <section className="rounded-3xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-[var(--cs-navy)]">
          <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold)]" /> Learning design — turn what you know about a child into something you can use on shift
        </h2>
        {queueCount > 0 && (
          <Link href="/cara-studio/review" className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 hover:bg-amber-200">
            {queueCount} awaiting manager review <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="group rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4 transition-colors hover:bg-white hover:shadow-[var(--cs-shadow-card)]">
            <t.Icon className="h-5 w-5 text-[var(--cs-teal-strong)]" />
            <p className="mt-2 text-sm font-bold text-[var(--cs-navy)]">{t.label}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--cs-text-secondary)]">{t.hint}</p>
          </Link>
        ))}
      </div>
      {children.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-[var(--cs-text-muted)]">Child workspaces:</span>
          {children.map((c) => (
            <Link key={c.id} href={`/cara-studio/children/${c.id}`} className="rounded-full border border-[var(--cs-border)] bg-white px-3 py-1 font-semibold text-[var(--cs-navy)] hover:bg-[var(--cs-teal-bg)]">
              {c.first_name}
            </Link>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11px] text-[var(--cs-text-muted)]">
        Cara supports professional judgement. Staff and managers remain responsible for decisions, recording, and
        safeguarding actions — everything here is trauma-informed, PACE-informed and non-shaming by design, and
        anything sensitive goes to a manager before use.
      </p>
    </section>
  );
}
