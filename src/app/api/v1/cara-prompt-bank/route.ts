// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara PRACTICE LIBRARY API (prompt bank + workflow templates)
// GET   /api/v1/cara-prompt-bank → prompt bank (core + custom) + workflow
//                                  checklists per incident type (read-only view)
// POST  /api/v1/cara-prompt-bank → add a CUSTOM prompt (merges into live
//                                  Incident Mode when active)
// PATCH /api/v1/cara-prompt-bank → toggle a custom prompt's is_active / delete
//
// Core prompts and workflows are versioned in code (consistent, reviewable);
// custom prompts let a home add its own house style on top.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { INCIDENT_TYPES, buildWorkflowChecklist, type PromptBankEntry } from "@/lib/cara-incident/cara-incident-engine";
import { currentUserId, logIncidentAudit } from "@/lib/cara-incident/incident-service";
import { readJsonBody } from "@/lib/http/read-json";

const CATEGORIES = ["co_regulation", "deescalation", "restorative", "safeguarding", "recording", "child_voice", "manager_oversight", "staff_reflection", "compliance", "post_incident_learning"];

export async function GET() {
  const store = getStore() as any;
  const bank: PromptBankEntry[] = store.caraPromptBank ?? [];
  const workflows = INCIDENT_TYPES.map((t) => ({ ...t, steps: buildWorkflowChecklist(t.key) }));
  return NextResponse.json({ data: { bank, categories: CATEGORIES, incident_types: INCIDENT_TYPES, workflows } });
}

export async function POST(req: Request) {
  const __parsed2 = await readJsonBody(req);
  if (!__parsed2.ok) return __parsed2.response;
  const body = __parsed2.data as any;
  const prompt_text = String(body.prompt_text ?? "").trim();
  const category = CATEGORIES.includes(String(body.category)) ? String(body.category) : "co_regulation";
  const incident_type = INCIDENT_TYPES.some((t) => t.key === body.incident_type) ? String(body.incident_type) : null;

  if (!prompt_text) return NextResponse.json({ ok: false, error: "Write the prompt first." }, { status: 400 });
  if (prompt_text.length > 140) return NextResponse.json({ ok: false, error: "Keep prompts short — under 140 characters, calm and scannable." }, { status: 400 });

  const store = getStore() as any;
  const now = new Date().toISOString();
  const entry: PromptBankEntry = {
    id: generateId("pbc"),
    category,
    title: body.title ? String(body.title) : null,
    prompt_text,
    incident_type,
    risk_level: null,
    is_active: true,
    custom: true,
    created_at: now,
    updated_at: now,
  };
  store.caraPromptBank = store.caraPromptBank ?? [];
  store.caraPromptBank.push(entry);
  logIncidentAudit({ action_type: "human_edit_made", user_id: currentUserId(req), source_id: entry.id, note: `prompt-bank add category=${category}` });
  return NextResponse.json({ ok: true, data: entry }, { status: 201 });
}

export async function PATCH(req: Request) {
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data as any;
  const id = String(body.id ?? "").trim();
  const store = getStore() as any;
  const bank: PromptBankEntry[] = store.caraPromptBank ?? [];
  const entry = bank.find((p) => p.id === id);
  if (!entry) return NextResponse.json({ ok: false, error: "Prompt not found." }, { status: 404 });
  if (!entry.custom) return NextResponse.json({ ok: false, error: "Core prompts are versioned in code and can't be edited here." }, { status: 400 });

  if (body.remove === true) {
    store.caraPromptBank = bank.filter((p) => p.id !== id);
  } else if (typeof body.is_active === "boolean") {
    entry.is_active = body.is_active;
    entry.updated_at = new Date().toISOString();
  } else {
    return NextResponse.json({ ok: false, error: "Nothing to change." }, { status: 400 });
  }
  logIncidentAudit({ action_type: "human_edit_made", user_id: currentUserId(req), source_id: id, note: body.remove ? "prompt-bank remove" : `prompt-bank active=${body.is_active}` });
  return NextResponse.json({ ok: true });
}
