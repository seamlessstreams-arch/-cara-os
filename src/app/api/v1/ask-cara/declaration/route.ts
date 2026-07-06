// ══════════════════════════════════════════════════════════════════════════════
// CARA — EXTERNAL-AI DECLARATION API (§20)
// POST   → create a declaration (anyone can declare); returns the safer CARA route
// GET    → list declarations (management only) — the review queue
// PATCH  → record a manager review (management only)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { readJsonBody } from "@/lib/http/read-json";
import { buildDeclaration, reviewDeclaration, declarationAcknowledgement, type DeclarationInput, type ReviewOutcome } from "@/lib/ask-cara/external-ai-declaration";

export const dynamic = "force-dynamic";

const MANAGEMENT = new Set(["registered_manager", "deputy_manager", "responsible_individual", "org_director", "area_manager", "platform_admin"]);
const isManager = (req: NextRequest) => MANAGEMENT.has((req.headers.get("x-user-role") || "").toLowerCase());

export async function POST(req: NextRequest) {
  const jb = await readJsonBody(req);
  if (!jb.ok) return jb.response;
  const b = jb.data as Partial<DeclarationInput>;
  if (!b.declarationType || !["no", "yes", "not_sure", "spelling_grammar_only"].includes(b.declarationType)) {
    return NextResponse.json({ error: "declarationType is required (no | yes | not_sure | spelling_grammar_only)" }, { status: 400 });
  }
  const store = getStore();
  const decl = buildDeclaration(b as DeclarationInput, { id: `ext_ai_${Date.now()}_${store.externalAiDeclarations.length}`, createdAt: new Date().toISOString() });
  store.externalAiDeclarations.push(decl);
  return NextResponse.json({ data: { declaration: decl, acknowledgement: declarationAcknowledgement(decl) } });
}

export async function GET(req: NextRequest) {
  if (!isManager(req)) return NextResponse.json({ error: "Management access required" }, { status: 403 });
  const store = getStore();
  const items = [...store.externalAiDeclarations].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return NextResponse.json({
    data: {
      declarations: items,
      summary: {
        total: items.length,
        pendingReview: items.filter((d) => d.managerReviewStatus === "pending").length,
        confidentialDataEntered: items.filter((d) => d.confidentialDataEntered).length,
      },
    },
  });
}

export async function PATCH(req: NextRequest) {
  if (!isManager(req)) return NextResponse.json({ error: "Management access required" }, { status: 403 });
  const jb = await readJsonBody(req);
  if (!jb.ok) return jb.response;
  const b = jb.data as { id?: string; reviewedBy?: string; outcome?: ReviewOutcome; notes?: string };
  if (!b.id || !b.outcome) return NextResponse.json({ error: "id and outcome are required" }, { status: 400 });
  const store = getStore();
  const idx = store.externalAiDeclarations.findIndex((d) => d.id === b.id);
  if (idx === -1) return NextResponse.json({ error: "Declaration not found" }, { status: 404 });
  store.externalAiDeclarations[idx] = reviewDeclaration(store.externalAiDeclarations[idx], {
    reviewedBy: b.reviewedBy || (req.headers.get("x-user-role") || "manager"),
    outcome: b.outcome,
    notes: b.notes,
    reviewedAt: new Date().toISOString(),
  });
  return NextResponse.json({ data: { declaration: store.externalAiDeclarations[idx] } });
}
