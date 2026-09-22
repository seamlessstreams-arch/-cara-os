// ══════════════════════════════════════════════════════════════════════════════
// CARA — POST /api/v1/staff/[id]/login/reset : restore a colleague's access
//
// The sign-in page has always told people this exists:
//
//     "Managers can also reset a colleague's access from the staff record."
//
// It did not. Until the provisioning endpoint next door, a login could only be
// made by hand in the Supabase dashboard, and a lost password could only be
// fixed the same way — or by the "forgotten password" email, which on this
// project goes through Supabase's built-in development mailer: 2 messages per
// hour for the whole project, no delivery guarantee. For a home with one
// administrator that is not a recovery path, it is a hope.
//
// THE CEILING IS THE POINT OF THIS FILE
// Resetting someone's password is taking their account. Without a rank check a
// deputy manager could reset the Registered Manager's login, sign in as them,
// and hold the home — worse than the create-side escalation, because it also
// locks the rightful holder OUT. So: MANAGE_STAFF, and never above your own
// standing. Resetting your own is fine; you are already signed in.
//
// The new password is generated server-side, returned once, never stored or
// logged. Handing it over in person is the delivery mechanism until a real
// mail provider is configured, at which point this becomes a reset link.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS, canAssignRole } from "@/lib/permissions";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { dal } from "@/lib/db";

export const dynamic = "force-dynamic";

/** 18 random bytes, base64url — the same strength as a newly issued login. */
function temporaryPassword(): string {
  return randomBytes(18).toString("base64url");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requirePermissionAsync(req, PERMISSIONS.MANAGE_STAFF);
  if (auth instanceof NextResponse) return auth;

  if (!isSupabaseEnabled()) {
    return NextResponse.json(
      { error: "Not available", detail: "Logins only exist on a live tenant." },
      { status: 409 },
    );
  }
  const sb = createServerClient();
  if (!sb) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const { id } = await params;
  const staff = (await dal.staff.findById(id)) as
    | { id: string; full_name?: string; role?: string; email?: string | null; auth_user_id?: string | null }
    | null;
  if (!staff) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const authUserId = staff.auth_user_id;
  if (!authUserId) {
    return NextResponse.json(
      {
        error: "No login to reset",
        detail: "This staff member has no account yet — create one instead.",
      },
      { status: 409 },
    );
  }

  // Never reset upward. Taking a more senior colleague's account is the attack
  // this endpoint would otherwise hand over, and it locks them out at the same
  // time. Fails closed on a role either side cannot be ranked.
  if (!canAssignRole(auth.role, String(staff.role ?? ""))) {
    return NextResponse.json(
      {
        error: "Forbidden",
        detail: `Role '${auth.role}' cannot reset the access of a '${String(staff.role ?? "unknown")}'.`,
      },
      { status: 403 },
    );
  }

  const password = temporaryPassword();
  const { error } = await sb.auth.admin.updateUserById(authUserId, { password });
  if (error) {
    console.error("[api/staff/login/reset] reset failed:", error.message);
    return NextResponse.json(
      { error: "Could not reset the login", detail: error.message },
      { status: 400 },
    );
  }

  // Shown once. Their old password stops working immediately, so this has to
  // reach them — in person, for now.
  return NextResponse.json({
    data: {
      email: staff.email ?? null,
      temporary_password: password,
      note: "Their previous password no longer works. Give this to them in person; they should change it after signing in.",
    },
  });
}
