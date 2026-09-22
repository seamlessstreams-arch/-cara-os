// ══════════════════════════════════════════════════════════════════════════════
// CARA — POST /api/v1/staff/[id]/login : give a staff member a way in
//
// Until this existed there was NO provisioning path: nothing in the codebase
// wrote staff_members.auth_user_id, so a login could only be made by hand in
// the Supabase dashboard — create the auth user, then run SQL to link it. A
// staff record without that link cannot sign in at all, and (since the auth
// fix) is told so honestly rather than silently resolved to somebody else.
//
// WHY A TEMPORARY PASSWORD AND NOT AN EMAILED INVITE
// The project has no custom SMTP: auth email goes through Supabase's built-in
// development mailer, capped at 2 messages per hour for the whole project with
// no delivery guarantee. An invite button on that would look like it worked and
// silently not, which is the failure mode this codebase keeps being bitten by.
// So the server mints the account directly and hands the password back ONCE,
// for the manager to pass on in person. Swap this for inviteUserByEmail the day
// a real mail provider is configured.
//
// The password is generated here, returned once, and never stored or logged.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { readJsonBody } from "@/lib/http/read-json";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { linkStaffAuthUser } from "@/lib/supabase/queries";
import { dal } from "@/lib/db";

export const dynamic = "force-dynamic";

/** 18 random bytes, base64url — no ambiguous-character games, just entropy. */
function temporaryPassword(): string {
  return randomBytes(18).toString("base64url");
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requirePermissionAsync(req, PERMISSIONS.MANAGE_STAFF);
  if (auth instanceof NextResponse) return auth;

  // Creating a login means creating a real auth account. There is no such thing
  // in demo, and pretending otherwise would hand back a password that signs in
  // nowhere.
  if (!isSupabaseEnabled()) {
    return NextResponse.json(
      { error: "Not available", detail: "Logins can only be created on a live tenant." },
      { status: 409 },
    );
  }
  const sb = createServerClient();
  if (!sb) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const { id } = await params;
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as { email?: unknown };

  const staff = await dal.staff.findById(id);
  if (!staff) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Never a second login for one person: auth_user_id is unique, and silently
  // re-pointing it would strand every record already written under the old id.
  if ((staff as { auth_user_id?: string | null }).auth_user_id) {
    return NextResponse.json(
      { error: "Already has a login", detail: "This staff member is already linked to an account." },
      { status: 409 },
    );
  }

  const email = String(body.email ?? (staff as { email?: string }).email ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) {
    return NextResponse.json(
      { error: "A valid email is required", detail: "Supply one in the body, or set it on the staff record first." },
      { status: 400 },
    );
  }

  const password = temporaryPassword();
  const { data: created, error: createError } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // no confirmation mail can be delivered, so do not ask for one
  });
  if (createError || !created?.user) {
    // The most common cause by far is an address already in use.
    return NextResponse.json(
      { error: "Could not create the login", detail: createError?.message ?? "Unknown error" },
      { status: 400 },
    );
  }

  try {
    await linkStaffAuthUser(sb, id, created.user.id, email);
  } catch (err) {
    // An auth user with nothing pointing at it can sign in and resolve to no
    // staff record — the exact limbo this endpoint exists to prevent. Undo it.
    await sb.auth.admin.deleteUser(created.user.id).catch(() => {});
    console.error("[api/staff/login] link failed, auth user rolled back:", err);
    return NextResponse.json({ error: "Could not link the login to the staff record" }, { status: 500 });
  }

  // Shown once. Not stored, not logged, not retrievable — if it is lost the
  // manager deletes the login and issues another.
  return NextResponse.json(
    {
      data: {
        email,
        temporary_password: password,
        note: "Give this to them in person. They should change it after signing in.",
      },
    },
    { status: 201 },
  );
}
