// ══════════════════════════════════════════════════════════════════════════════
// CARA — KNOWLEDGE GOVERNANCE (§6)
//
// GET → every practice-KB entry joined with its governance overlay, plus
//        detections (the §6 rule: informal sources never treated as authority
//        without review) and the evidence-weight distribution.
// PUT → record governance metadata (evidence status, reviewer, limitations,
//        next review) for one entry. Flag-gated.
//
// Governance is a management-assurance surface, so writes require MANAGE_STAFF-
// level access (via requirePermissionAsync) AND the knowledge_governance_write
// flag; reads are open to any authenticated caller.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http/read-json";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { getStore } from "@/lib/db/store";
import { isFeatureEnabled } from "@/lib/config/feature-flags";
import { KB_ALL_ENTRIES } from "@/lib/cara/knowledge-base";
import {
  buildKnowledgeGovernance,
  validateGovernance,
  AUTHORITATIVE,
  INFORMAL,
  EVIDENCE_LABEL,
  type EvidenceStatus,
  type KnowledgeGovernanceRecord,
} from "@/lib/knowledge-governance/knowledge-governance-engine";

export const dynamic = "force-dynamic";

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const EVIDENCE: EvidenceStatus[] = [...AUTHORITATIVE, ...INFORMAL, "unassessed"];
const evidence = (v: unknown): EvidenceStatus =>
  (EVIDENCE as string[]).includes(str(v)) ? (v as EvidenceStatus) : "unassessed";

export async function GET() {
  try {
    const overlay = getStore().knowledgeGovernance ?? [];
    const summary = buildKnowledgeGovernance(KB_ALL_ENTRIES, overlay, new Date());
    return NextResponse.json({
      data: {
        ...summary,
        evidenceLabels: EVIDENCE_LABEL,
        writeEnabled: isFeatureEnabled("knowledge_governance_write"),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Record governance metadata for one KB entry (upsert on entry_id). */
export async function PUT(req: NextRequest) {
  try {
    const gate = await requirePermissionAsync(req, PERMISSIONS.MANAGE_STAFF);
    if (gate instanceof NextResponse) return gate; // deny-response; success is {role,userId}
    if (!isFeatureEnabled("knowledge_governance_write")) {
      return NextResponse.json({ error: "Knowledge governance writing is not enabled (knowledge_governance_write)." }, { status: 403 });
    }
    const parsed = await readJsonBody(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const entryId = str(body.entry_id);
    if (!entryId) return NextResponse.json({ error: "entry_id is required" }, { status: 400 });
    if (!KB_ALL_ENTRIES.some((e) => e.id === entryId)) {
      return NextResponse.json({ error: "Unknown knowledge entry" }, { status: 404 });
    }

    const evidence_status = evidence(body.evidence_status);
    const reviewer = str(body.reviewer);
    const limitations = str(body.limitations);
    const invalid = validateGovernance({ evidence_status, reviewer, limitations });
    if (invalid) return NextResponse.json({ error: invalid }, { status: 422 });

    const store = getStore();
    const actor = String(req.headers.get("x-user-id") ?? "staff_unknown");
    const now = new Date().toISOString();
    const existing = (store.knowledgeGovernance ?? []).find((r) => r.entry_id === entryId);

    const fields = {
      evidence_status,
      permitted_use: str(body.permitted_use),
      limitations,
      reviewer,
      reviewed_at: reviewer ? (body.reviewed_at ? String(body.reviewed_at) : now) : null,
      next_review: body.next_review ? String(body.next_review) : null,
      updated_at: now,
      updated_by: actor,
    };

    if (existing) {
      Object.assign(existing, fields, { version: existing.version + 1 });
      return NextResponse.json({ data: existing });
    }
    const record: KnowledgeGovernanceRecord = { entry_id: entryId, version: 1, ...fields };
    store.knowledgeGovernance.push(record);
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
