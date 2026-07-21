"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SET A NEW PASSWORD (client)
//
// The recovery link carries a short-lived session in the URL fragment, which
// supabase-js picks up automatically (detectSessionInUrl). We wait for that to
// resolve before showing the form, so a stale or already-used link says so
// plainly instead of failing at submit time with a confusing error.
//
// A children's-home system holds children's records, so the bar here is a
// deliberate 12 characters — longer than Supabase's default 6. It is checked in
// the browser for a fast, clear message; Supabase enforces its own minimum
// server-side regardless, so this is UX, not the security boundary.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MIN_LENGTH = 12;

export function ResetPasswordForm() {
  const [ready, setReady] = useState(false);
  const [linkValid, setLinkValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  // Wait for supabase-js to consume the recovery token from the URL fragment.
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const settle = (valid: boolean) => {
      if (cancelled) return;
      setLinkValid(valid);
      setReady(true);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") settle(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) settle(true);
      // Give the fragment a beat to be parsed before declaring the link dead.
      else setTimeout(() => settle(false), 1200);
    });

    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters — this account can reach children's records.`);
      return;
    }
    if (password !== confirm) {
      setError("Those two passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Couldn't reach the sign-in service — check your connection and try again.");
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <div className="mk-glass flex items-center justify-center gap-2 rounded-3xl p-7 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking your link…
      </div>
    );
  }

  if (done) {
    return (
      <div className="mk-glass rounded-3xl p-7 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-teal-300" />
        <p className="mt-3 text-sm font-semibold text-white">Password updated</p>
        <p className="mt-1.5 text-sm text-slate-400">You&apos;re signed in on this device.</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cs-cara-gold)] px-6 py-3.5 text-sm font-bold text-[#0a1020]"
        >
          Continue to Cara <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  if (!linkValid) {
    return (
      <div className="mk-glass rounded-3xl p-7">
        <p className="text-sm font-semibold text-white">This link has expired</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
          Reset links are single-use and short-lived, so this one can&apos;t be used again.
          Request a fresh one and it&apos;ll arrive in a moment.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.06]"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mk-glass rounded-3xl p-7">
      <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400" htmlFor="new-password">New password</label>
      <input
        id="new-password"
        type="password"
        required
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-teal-300/50 focus:bg-white/[0.09]"
        placeholder="At least 12 characters"
      />

      <label className="mt-5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400" htmlFor="confirm-password">Confirm new password</label>
      <input
        id="confirm-password"
        type="password"
        required
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
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
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cs-cara-gold)] px-6 py-3.5 text-sm font-bold text-[#0a1020] shadow-[0_0_28px_rgba(200,155,60,0.28)] transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>) : (<>Save new password <ArrowRight className="h-4 w-4" /></>)}
      </button>
    </form>
  );
}
