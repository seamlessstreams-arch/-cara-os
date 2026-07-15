// ══════════════════════════════════════════════════════════════════════════════
// CARA — SIGN IN  (route: /auth/login)
//
// The door to the platform, in the midnight identity. Two modes:
//   • Demo (Supabase not configured): no credentials exist — explain plainly
//     and offer the way in. Never a fake password box.
//   • Activated: email + password via Supabase; the middleware sent ?next=
//     with where the visitor was heading, and we return them there after
//     sign-in (validated against open redirects).
// No self-signup — access is provisioned by the Registered Manager.
// ══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroField } from "@/components/marketing/hero-field";
import { LoginForm } from "./login-form";
import { isSupabaseEnabled } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in | Cara",
  description: "Sign in to Cara — the Care Intelligence OS for children's homes.",
};

export default function LoginPage() {
  const activated = isSupabaseEnabled();

  return (
    <div className="mk-midnight relative flex min-h-screen flex-col overflow-hidden">
      <HeroField className="pointer-events-none absolute inset-0 h-full w-full opacity-50" />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 py-16">
        <Link href="/" className="mk-enter flex items-center gap-2.5" style={{ "--mk-delay": "40ms" } as React.CSSProperties}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="Cara" className="h-10 w-10 rounded-xl ring-1 ring-white/10" />
          <span className="text-xl font-extrabold tracking-tight text-white">Cara</span>
        </Link>

        <h1 className="mk-display mk-enter mt-6 text-center text-4xl text-white" style={{ "--mk-delay": "140ms" } as React.CSSProperties}>
          The lights are on.
        </h1>
        <p className="mk-enter mt-2 text-center text-sm text-slate-400" style={{ "--mk-delay": "240ms" } as React.CSSProperties}>
          {activated ? "Sign in to your home's Cara." : "This deployment runs in demo mode."}
        </p>

        <div className="mk-enter mt-8 w-full" style={{ "--mk-delay": "340ms" } as React.CSSProperties}>
          {activated ? (
            <Suspense>
              <LoginForm />
            </Suspense>
          ) : (
            <div className="mk-glass rounded-3xl p-7 text-center">
              <p className="text-sm leading-relaxed text-slate-300">
                Authentication is switched off here — this is the open demo, running on a fictional
                home&rsquo;s data. Step straight in.
              </p>
              <Link
                href="/dashboard"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cs-cara-gold)] px-6 py-3.5 text-sm font-bold text-[#0a1020] shadow-[0_0_28px_rgba(200,155,60,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgba(200,155,60,0.4)]"
              >
                Enter the demo <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-4 text-[11px] text-slate-500">Fictional home, fictional people — no real child or staff information.</p>
            </div>
          )}
        </div>

        <p className="mk-enter mt-8 text-center text-xs text-slate-500" style={{ "--mk-delay": "460ms" } as React.CSSProperties}>
          No self-signup — access is provisioned by your Registered Manager.
          <br />
          <Link href="/" className="font-semibold text-slate-400 transition-colors hover:text-white">← Back to the site</Link>
        </p>
      </div>
    </div>
  );
}
