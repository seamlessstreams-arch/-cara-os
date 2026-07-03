// ══════════════════════════════════════════════════════════════════════════════
// API — PRACTICE INTELLIGENCE: WORKFLOW TRIGGERS
// GET  ?status=x           → list triggers (filterable)
// POST { event, ... }      → process a new trigger event
// PUT  { triggerId, action }→ action or dismiss
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import {
  processWorkflowTrigger,
  listWorkflowTriggers,
  listPendingTriggers,
  actionWorkflowTrigger,
  dismissWorkflowTrigger,
} from "@/lib/practice-intelligence";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    if (status === "pending") {
      const triggers = await listPendingTriggers();
      return NextResponse.json({ ok: true, data: triggers });
    }

    const triggers = await listWorkflowTriggers({
      status: status ?? undefined,
      childId: searchParams.get("childId") ?? undefined,
      limit: parseInt(searchParams.get("limit") ?? "20", 10),
    });

    return NextResponse.json({ ok: true, data: triggers });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { event, sourceTable, sourceId, childId, content, metadata } = body;

    if (!event || !sourceTable || !sourceId) {
      return NextResponse.json({ ok: false, error: "event, sourceTable, and sourceId are required" }, { status: 400 });
    }

    const trigger = await processWorkflowTrigger(event, sourceTable, sourceId, childId ?? null, content ?? "", metadata ?? {});
    return NextResponse.json({ ok: true, data: trigger });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const __jb1 = await readJsonBody(req); if (!__jb1.ok) return __jb1.response; const body = __jb1.data;
    const { triggerId, action, actionedBy } = body;

    if (!triggerId) {
      return NextResponse.json({ ok: false, error: "triggerId is required" }, { status: 400 });
    }

    if (action === "action") {
      const trigger = await actionWorkflowTrigger(triggerId, actionedBy ?? "system");
      return NextResponse.json({ ok: true, data: trigger });
    }

    if (action === "dismiss") {
      const trigger = await dismissWorkflowTrigger(triggerId, actionedBy ?? "system");
      return NextResponse.json({ ok: true, data: trigger });
    }

    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
