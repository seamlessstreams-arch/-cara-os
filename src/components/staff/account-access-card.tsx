"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — ACCOUNT ACCESS
//
// Whether this staff member can actually sign in, and the one control that
// changes it. Until this existed a login could only be created by hand in the
// Supabase dashboard, so a home could easily have staff records nobody could
// log in as — which is exactly the state Oak House is in.
//
// The password is shown ONCE. It is generated server-side, never stored, and
// cannot be retrieved again; if it is lost the login is deleted and reissued.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeyRound, CheckCircle2, AlertTriangle, Copy } from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { userIdHeaders } from "@/lib/auth/current-user";

interface Props {
  staffId: string;
  staffName: string;
  /** Present when the record is already bound to a login. */
  authUserId?: string | null;
  /** The address on the staff record, used as the default. */
  email?: string | null;
  onLinked?: () => void;
}

export function AccountAccessCard({ staffId, staffName, authUserId, email, onLinked }: Props) {
  const { currentRole } = useAuthContext();
  const [address, setAddress] = useState(email ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ email: string | null; password: string; reset: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const mayManage = hasPermission(currentRole, PERMISSIONS.MANAGE_STAFF);
  const hasLogin = Boolean(authUserId) || issued !== null;

  async function createLogin() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/staff/${staffId}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...userIdHeaders() },
        body: JSON.stringify({ email: address.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.detail ?? json?.error ?? "Could not create the login.");
        return;
      }
      setIssued({ email: json.data.email, password: json.data.temporary_password, reset: false });
      onLinked?.();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  /* Restoring access, for when a colleague is locked out. Their old password
     stops working the moment this runs, so it is behind a confirmation —
     misfiring it on the wrong row locks out someone who was fine. */
  async function resetLogin() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/staff/${staffId}/login/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...userIdHeaders() },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.detail ?? json?.error ?? "Could not reset the login.");
        return;
      }
      setIssued({ email: json.data.email, password: json.data.temporary_password, reset: true });
      setConfirmingReset(false);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <KeyRound className="h-4 w-4" /> Account access
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasLogin && !issued && (
          <>
            <p className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> {staffName} can sign in.
            </p>
            {mayManage && !confirmingReset && (
              <Button variant="outline" onClick={() => setConfirmingReset(true)} className="w-full">
                Reset access
              </Button>
            )}
            {mayManage && confirmingReset && (
              <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-900">
                  Reset {staffName}&rsquo;s access?
                </p>
                <p className="text-xs text-amber-800">
                  Their current password stops working immediately. You will get a new
                  one to hand over in person. Only do this if they are locked out.
                </p>
                <div className="flex gap-2">
                  <Button onClick={resetLogin} disabled={busy} className="flex-1">
                    {busy ? "Resetting…" : "Yes, reset it"}
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmingReset(false)} disabled={busy} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {!hasLogin && (
          <>
            <p className="flex items-start gap-2 text-sm text-amber-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{staffName} has no login and cannot sign in.</span>
            </p>
            {mayManage ? (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[var(--cs-text-muted)]" htmlFor="account-access-email">
                  Work email for the login
                </label>
                <input
                  id="account-access-email"
                  type="email"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-[var(--cs-border)] px-3 py-2 text-sm"
                />
                <Button onClick={createLogin} disabled={busy || !address.trim()} className="w-full">
                  {busy ? "Creating…" : "Create login"}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-[var(--cs-text-muted)]">
                A manager can create one from this page.
              </p>
            )}
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {issued && (
          <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-sm font-semibold text-emerald-900">{issued.reset ? "Access reset" : "Login created"}</p>
            <p className="text-xs text-emerald-800">
              {issued.reset
                ? `${staffName}'s previous password no longer works. `
                : ""}
              Give this to {staffName} in person. The password is shown once and cannot be
              retrieved again — they should change it after signing in.
            </p>
            <dl className="space-y-1 text-sm">
              {issued.email && (
                <div className="flex gap-2">
                  <dt className="text-emerald-700">Email</dt>
                  <dd className="font-mono">{issued.email}</dd>
                </div>
              )}
              <div className="flex items-center gap-2">
                <dt className="text-emerald-700">Password</dt>
                <dd className="font-mono break-all">{issued.password}</dd>
                <button
                  type="button"
                  aria-label="Copy password"
                  onClick={() => {
                    navigator.clipboard?.writeText(issued.password).then(
                      () => setCopied(true),
                      () => setCopied(false),
                    );
                  }}
                  className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline"
                >
                  <Copy className="h-3 w-3" /> {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
