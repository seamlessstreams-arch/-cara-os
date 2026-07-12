// ══════════════════════════════════════════════════════════════════════════════
// CARA — EARLY ACCESS / CONTACT FORM API
// POST /api/v1/early-access
//
// Captures early-access / "book a conversation" enquiries from the public site.
// Always records to the in-memory store (so the demo never loses a submission),
// AND persists to Supabase when it is configured. Never throws on the Supabase
// path — a missing table or unset env must not break the form.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { createServerClient } from "@/lib/supabase/server";
import { readJsonBody } from "@/lib/http/read-json";

interface EarlyAccessInput {
  name?: string;
  organisation?: string;
  role?: string;
  email?: string;
  number_of_homes?: string;
  looking_for?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data as EarlyAccessInput;
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();

  if (!name || !email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Please provide your name and a valid email." }, { status: 400 });
  }

  const record = {
    id: generateId("ea"),
    name,
    organisation: (body.organisation ?? "").trim(),
    role: (body.role ?? "").trim(),
    email,
    number_of_homes: (body.number_of_homes ?? "").trim(),
    looking_for: (body.looking_for ?? "").trim(),
    source: "website",
    created_at: new Date().toISOString(),
  };

  // 1. In-memory capture — always (consistent with the rest of the demo store).
  const store = getStore() as any;
  store.earlyAccessRequests = store.earlyAccessRequests ?? [];
  store.earlyAccessRequests.push(record);

  // 2. Durable persistence when Supabase is configured (service-role client bypasses RLS).
  //    Non-fatal: if the table isn't migrated yet, we still accept the submission.
  const supabase = createServerClient();
  if (supabase) {
    try {
      // Cast: this table is added by migration 407 and isn't in the generated Database types.
      await (supabase as any).from("early_access_requests").insert(record);
    } catch {
      // TODO(supabase): run migration 407_early_access_requests.sql to enable durable storage.
    }
  }
  // TODO(notify): when an email provider is configured (e.g. Resend), send an
  // internal notification to the team on each submission. Left unwired — no
  // outbound email is sent from the demo.

  return NextResponse.json({ ok: true });
}
