// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — RESOURCE LIBRARY API
// GET  → all resources (approved + drafts, badged honestly in the UI)
// POST → staff add a resource as an UNAPPROVED draft; a manager approves it
//        separately (never their own), and only approved resources are
//        preferred by the context builder.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { actorFromHeaders } from "@/lib/cara-studio/cara-studio-service";
import { persistLibraryResource } from "@/lib/supabase/cara-persist";
import type { CaraLibraryResource } from "@/lib/cara-studio/cara-types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ data: { resources: db.caraLibraryResources.findAll() } });
}

const CreateResourceSchema = z.object({
  title: z.string().min(4),
  resource_type: z.string().min(2),
  domain: z.string().min(2),
  age_range: z.string().min(2),
  send_tags: z.array(z.string()).default([]),
  trauma_tags: z.array(z.string()).default([]),
  content: z.string().min(10),
  source: z.string().min(2),
});

export async function POST(req: NextRequest) {
  const actor = actorFromHeaders(req.headers);
  const body = CreateResourceSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0]?.message ?? "Invalid resource" }, { status: 422 });
  }
  const now = new Date().toISOString();
  const resource: CaraLibraryResource = {
    id: generateId("clr"),
    ...body.data,
    source_type: "internal",
    approved: false, // approval is a separate, human, never-own step
    approved_by: null,
    created_by: actor.userId,
    created_at: now,
    updated_at: now,
  };
  db.caraLibraryResources.create(resource);
  void persistLibraryResource(resource as unknown as Record<string, unknown>);
  return NextResponse.json({ data: resource }, { status: 201 });
}
