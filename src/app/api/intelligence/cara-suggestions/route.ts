import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import { caraSuggestions } from "@/lib/intelligence/fallback-store";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const homeId = url.searchParams.get("homeId") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const id = url.searchParams.get("id") ?? undefined;

  if (!isSupabaseEnabled()) {
    if (id) {
      const item = caraSuggestions.find((r) => r.id === id) ?? null;
      return NextResponse.json({ ok: true, item, persisted: true });
    }
    let rows = [...caraSuggestions];
    if (homeId) rows = rows.filter((r) => r.home_id === homeId);
    if (status && status !== "all") rows = rows.filter((r) => r.status === status);
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return NextResponse.json({ ok: true, items: rows, persisted: true });
  }

  return NextResponse.json({ ok: true, items: [], persisted: false });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status, finalText, rejectionReason, actorRole } = body as {
    id?: string;
    status?: string;
    finalText?: string;
    rejectionReason?: string;
    actorRole?: string;
  };
  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  }

  if (!isSupabaseEnabled()) {
    const idx = caraSuggestions.findIndex((r) => r.id === id);
    if (idx >= 0) {
      const now = new Date().toISOString();
      const updated = { ...caraSuggestions[idx], status };
      if (status === "approved" || status === "amended_and_approved") {
        updated.approved_at = now;
        if (finalText) updated.final_text = finalText;
      }
      if (status === "rejected") {
        updated.rejected_at = now;
        if (rejectionReason) updated.rejection_reason = rejectionReason;
      }
      if (status === "committed") {
        updated.committed_at = now;
      }
      updated.audit_timeline = [
        ...updated.audit_timeline,
        {
          id: `aud_${Date.now()}`,
          action: `suggestion_${status}`,
          actor_role: actorRole ?? "registered_manager",
          created_at: now,
        },
      ];
      caraSuggestions[idx] = updated;
      return NextResponse.json({ ok: true, item: updated, persisted: true });
    }
    return NextResponse.json({ ok: true, item: null, persisted: true });
  }

  return NextResponse.json({ ok: true, persisted: false });
}
