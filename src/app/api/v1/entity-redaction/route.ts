// ══════════════════════════════════════════════════════════════════════════════
// CARA — ENTITY-STABLE REDACTION API (§8)
//
// GET  → the home's codebook (children + staff → Child A / Staff 1). Reference
//        only; the codebook is sensitive (it re-identifies).
// POST → redact (or rehydrate) a document set with a shared codebook, so the same
//        person is the same code across every document.
//        body { documents:[{id,text}], entities?, useHomeEntities?, mode? }
//
// Deterministic; the engine is pure. Rehydrate is an authorised reversal.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { dal } from "@/lib/db/dal";
import { readJsonBody } from "@/lib/http/read-json";
import {
  buildCodebook,
  redactDocumentSet,
  rehydrateText,
} from "@/lib/entity-redaction/entity-redaction-engine";
import type { EntityRef, RedactableDocument } from "@/lib/entity-redaction/types";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

async function homeEntities(): Promise<EntityRef[]> {
  const [youngPeopleRows, staffRows] = await Promise.all([
    safeList(dal.youngPeople.findAll()),
    safeList(dal.staff.findAll()),
  ]);
  const children: EntityRef[] = (youngPeopleRows as unknown as Array<Record<string, unknown>>)
    .filter((yp) => (yp.status ?? "current") === "current")
    .map((yp) => ({
      id: String(yp.id),
      kind: "child" as const,
      name: String(yp.full_name || [yp.first_name, yp.last_name].filter(Boolean).join(" ") || yp.preferred_name || yp.id),
      aliases: [yp.preferred_name, yp.first_name].filter((v): v is string => typeof v === "string" && v.length > 0),
    }));
  const staff: EntityRef[] = (staffRows as unknown as Array<Record<string, unknown>>).map((s) => ({
    id: String(s.id),
    kind: "staff" as const,
    name: String(s.full_name || [s.first_name, s.last_name].filter(Boolean).join(" ") || s.id),
    aliases: [s.preferred_name, s.first_name].filter((v): v is string => typeof v === "string" && v.length > 0),
  }));
  return [...children, ...staff];
}

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    return NextResponse.json({ data: { codebook: buildCodebook(await homeEntities()) } });
  } catch (err) {
    console.error("[entity-redaction] codebook failed", err);
    return NextResponse.json({ error: "Failed to build codebook" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const jb = await readJsonBody(req);
    if (!jb.ok) return jb.response;
    const body = jb.data as {
      documents?: RedactableDocument[];
      entities?: EntityRef[];
      useHomeEntities?: boolean;
      mode?: "redact" | "rehydrate";
    };

    const documents = Array.isArray(body.documents) ? body.documents.filter((d) => d && typeof d.text === "string") : [];
    if (documents.length === 0) {
      return NextResponse.json({ error: "documents [{ id, text }] are required" }, { status: 400 });
    }

    const entities: EntityRef[] = body.useHomeEntities ? await homeEntities() : Array.isArray(body.entities) ? body.entities : [];

    if (body.mode === "rehydrate") {
      const codebook = buildCodebook(entities);
      const rehydrated = documents.map((d) => ({ id: d.id, text: rehydrateText(d.text, codebook) }));
      return NextResponse.json({ data: { codebook, documents: rehydrated } });
    }

    return NextResponse.json({ data: redactDocumentSet(documents, entities) });
  } catch (err) {
    console.error("[entity-redaction] redact failed", err);
    return NextResponse.json({ error: "Failed to redact documents" }, { status: 500 });
  }
}
