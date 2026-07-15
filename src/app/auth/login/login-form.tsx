"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — LOGIN FORM (client)
// Email + password via the Supabase browser client. On success we replace to
// the validated ?next= target (the middleware put it there), so people land
// exactly where they were heading. Errors are shown plainly — no toast that
// disappears while you're reaching for your password manager.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/auth/public-paths";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        // Supabase's messages are safe to show (never say which field was wrong beyond its own wording).
        setError(signInError.message === "Invalid login credentials" ? "That email and password don't match our records." : signInError.message);
        setBusy(false);
        return;
      }
      // Full navigation (not router.replace) so the middleware re-runs with the
      // fresh session cookie before the destination renders.
      window.location.assign(safeNextPath(params.get("next")));
    } catch {
      setError("Couldn't reach the sign-in service — check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mk-glass rounded-3xl p-7">
      <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400" htmlFor="login-email">Email</label>
      <input
        id="login-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-teal-300/50 focus:bg-white/[0.09]"
        placeholder="you@yourhome.org"
      />

      <label className="mt-5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400" htmlFor="login-password">Password</label>
      <input
        id="login-password"
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-teal-300/50 focus:bg-white/[0.09]"
        placeholder="••••••••••••"
      />

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cs-cara-gold)] px-6 py-3.5 text-sm font-bold text-[#0a1020] shadow-[0_0_28px_rgba(200,155,60,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgba(200,155,60,0.4)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>) : (<>Sign in <ArrowRight className="h-4 w-4" /></>)}
      </button>

      <p className="mt-4 text-center text-[11px] text-slate-500">
        Forgotten password? Ask your Registered Manager to reset your access.
      </p>
    </form>
  );
}
