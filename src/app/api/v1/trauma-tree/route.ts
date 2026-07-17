// ══════════════════════════════════════════════════════════════════════════════
// CARA — LEAVES & ROOTS (trauma tree logic, doctrine 2.2.8)
//
// GET /api/v1/trauma-tree → per child: is the thinking written down, when was
//                           it last looked at, and what feeds the tree
//
// Cara reads formulations. It never writes one, and it never infers one — see
// the engine header. Every hypothesis shown here was typed by a human.
//
// Composes what already exists: multi-disciplinary formulations (the roots),
// behaviour + incident records (the leaves), trauma therapy logs (support), and
// the care-language audit's own count (labelling). Nothing re-derived.
//
// Read-only. Manager-facing: formulation review is their call to convene.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { buildCareLanguageAudit } from "@/lib/care-language-audit/care-language-audit-engine";
import {
  buildTraumaTree,
  type Leaf,
  type RootsRecord,
  type SupportSession,
  type LabellingSummary,
} from "@/lib/trauma-tree/trauma-tree-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    if (
      identity.role !== "registered_manager" &&
      identity.role !== "deputy_manager" &&
      identity.role !== "responsible_individual"
    ) {
      return NextResponse.json(
        { error: "Leaves and roots is a manager's view — formulation review is theirs to convene." },
        { status: 403 },
      );
    }

    const store = getStore();
    const homeId = identity.homeId;
    const children = (store.youngPeople ?? [])
      .filter((c) => c.status === "current" && (!homeId || c.home_id === homeId))
      .map((c) => ({ id: c.id, name: c.preferred_name || c.first_name }));
    const childIds = new Set(children.map((c) => c.id));

    // Leaves: what the home has been responding to.
    const leaves: Leaf[] = [
      ...(store.behaviourLog ?? [])
        .filter((b) => childIds.has(b.child_id) && b.direction === "concern")
        .map((b) => ({ id: b.id, child_id: b.child_id, date: b.date, kind: "behaviour" as const })),
      ...(store.incidents ?? [])
        .filter((i) => childIds.has(i.child_id))
        .map((i) => ({ id: i.id, child_id: i.child_id, date: i.date, kind: "incident" as const })),
    ];

    // Roots: exactly as a human recorded them.
    const roots: RootsRecord[] = (store.multiDisciplinaryFormulations ?? [])
      .filter((f) => childIds.has(f.child_id))
      .map((f) => ({
        id: f.id,
        child_id: f.child_id,
        version: f.version,
        formulation_date: f.formulation_date,
        next_review_date: f.next_review_date,
        key_hypotheses: f.key_hypotheses ?? [],
        presenting_difficulties: f.presenting_difficulties ?? [],
        agreed_interventions: f.agreed_interventions ?? [],
        participants_attended: f.participants_attended ?? [],
      }));

    const support: SupportSession[] = (store.traumaTherapyLogs ?? [])
      .filter((t) => childIds.has(t.child_id))
      .map((t) => ({
        id: t.id,
        child_id: t.child_id,
        date: t.session_date,
        attended: t.attended,
        modality: t.modality,
      }));

    // Labelling: the care-language audit owns this vocabulary — one list, not two.
    const labelling: LabellingSummary[] = (() => {
      try {
        return buildCareLanguageAudit(store).childProfiles.map((p) => ({
          childId: p.childId,
          totalHits: p.totalHits,
          mostAffectedCategory: p.mostAffectedCategory,
        }));
      } catch {
        return [];
      }
    })();

    const view = buildTraumaTree({ children, leaves, roots, support, labelling, now: new Date() });

    return NextResponse.json({
      data: {
        ...view,
        sources: {
          labelling: "/intelligence/cara/care-language-audit",
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
