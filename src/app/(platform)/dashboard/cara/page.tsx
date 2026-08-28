"use client";

// ═════════════════════════════════════════════════════════════════════════════
// CARA — Intelligence Centre
//
// This page used to mount `CaraCommandCentre`, a fully-built panel whose data
// layer was stubbed out: `output` was hardcoded null and `askCara` was an empty
// function, so asking a question did nothing at all — no answer, no error, no
// sign anything had happened.
//
// Its layout was designed around a model's output (a confidence percentage,
// safety flags, next-best-actions, an executive summary). The deterministic
// Ask Cara engine produces none of those, and inventing them to fill the
// layout is the one thing this product must never do. So the surface is the
// engine's own: the answer, the records it came from, and the follow-ups it
// suggests — the same component the Ask Cara page uses, which also scopes
// answers to the signed-in user's real role rather than a self-selected one.
// ═════════════════════════════════════════════════════════════════════════════

import { CaraChat } from "@/components/cara/cara-chat";
import { OfstedReadinessCard } from "@/components/cara/OfstedReadinessCard";

import { useAuthContext } from "@/contexts/auth-context";

export default function CaraPage() {
  // Real session/home context (demo default: staff_darren @ home_oak).
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const userId = currentUser?.id ?? "staff_darren";

  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cara Intelligence Centre</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ofsted readiness from this home&rsquo;s records, and a question you can ask of them —
          answered deterministically, scoped to your role.
        </p>
      </div>

      <OfstedReadinessCard homeId={homeId} userId={userId} />

      <section aria-label="Ask Cara">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Ask Cara</h2>
        <div
          className="overflow-hidden rounded-3xl border border-slate-800/80 shadow-2xl shadow-slate-950/40"
          style={{ height: "calc(100dvh - 420px)", minHeight: 460 }}
        >
          <CaraChat
            context={{ pageTitle: "Cara Intelligence Centre", sourceType: "general", homeId }}
          />
        </div>
      </section>
    </main>
  );
}
