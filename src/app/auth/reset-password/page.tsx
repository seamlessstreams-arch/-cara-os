// ══════════════════════════════════════════════════════════════════════════════
// CARA — SET A NEW PASSWORD  (route: /auth/reset-password)
//
// Where the emailed recovery link lands. Supabase puts a short-lived recovery
// session in the URL fragment; the form below exchanges it for a password
// change. Public by design (the whole point is that you cannot sign in), and
// covered by the existing "/auth/" prefix in the public-path registry.
// ══════════════════════════════════════════════════════════════════════════════

import { Suspense } from "react";
import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = {
  title: "Set a new password · Cara",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <main className="mk-dark relative flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-black tracking-tight text-white">Cara</Link>
          <h1 className="mt-6 text-[26px] font-black leading-tight tracking-tight text-white">
            Set a new password
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Choose something only you know. You&apos;ll be signed in straight afterwards.
          </p>
        </div>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
