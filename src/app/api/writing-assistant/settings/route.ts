import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { db } from "@/lib/db/store";
import type { WACategory, WritingAssistantSettings } from "@/lib/writing-assistant/types";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

function userId(req: NextRequest): string | null {
  return req.headers.get("x-user-id") ?? req.headers.get("x-cs-user-id") ?? null;
}

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.USE_CARA_INTELLIGENCE);
  if (auth instanceof NextResponse) return auth;
  const uid = userId(req);
  if (!uid) return NextResponse.json({ error: "x-user-id required" }, { status: 400 });
  return NextResponse.json({ data: db.writingAssistant.getSettings(uid) });
}

export async function PUT(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.USE_CARA_INTELLIGENCE);
  if (auth instanceof NextResponse) return auth;
  const uid = userId(req);
  if (!uid) return NextResponse.json({ error: "x-user-id required" }, { status: 400 });

  let body: Partial<WritingAssistantSettings>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data as Partial<WritingAssistantSettings>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate category keys if provided.
  const VALID_CATS: WACategory[] = ["spelling", "grammar", "safeguarding", "tone", "clarity"];
  const patch: Partial<WritingAssistantSettings> = {};
  if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
  if (body.categories && typeof body.categories === "object") {
    const cats: Partial<Record<WACategory, boolean>> = {};
    for (const k of VALID_CATS) {
      if (typeof (body.categories as Record<string, unknown>)[k] === "boolean")
        cats[k] = (body.categories as Record<string, boolean>)[k];
    }
    patch.categories = cats as Record<WACategory, boolean>;
  }
  if (Array.isArray(body.dictionary)) {
    patch.dictionary = body.dictionary.filter((w): w is string => typeof w === "string").map((w) => w.toLowerCase().trim()).filter(Boolean);
  }

  const updated = db.writingAssistant.updateSettings(uid, patch);
  return NextResponse.json({ data: updated });
}
