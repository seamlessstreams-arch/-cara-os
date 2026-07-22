// ══════════════════════════════════════════════════════════════════════════════
// CARA — Management Oversight from a REAL record
//
// GET (no id)        → list recent records (incidents) for the picker
// GET ?recordType=&id= → hydrate that record into an OversightInput and generate
//                        deterministic management oversight for it.
//
// Guarded by ADD_OVERSIGHT. Read-only against the store; no AI calls.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db/store";
import { dal } from "@/lib/db/dal";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { incidentToOversightInput } from "@/lib/oversight/hydrate";
import { generateManagementOversight } from "@/lib/oversight/management-oversight-engine";
import { getChildTwin } from "@/lib/cpie/get-child-twin";
import { OVERSIGHT_DISCLAIMER, type OversightMode } from "@/lib/oversight/types";

export const dynamic = "force-dynamic";

// Read a dal collection defensively: on a live tenant a transient query failure
// must degrade to an empty section, never 500 the whole route.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

const VALID_MODES: OversightMode[] = ["professional", "child_addressed", "both"];

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.ADD_OVERSIGHT);
  if (auth instanceof NextResponse) return auth;

  const sp = req.nextUrl.searchParams;
  const id = sp.get("id");
  const recordType = sp.get("recordType") ?? "incident";
  const modeParam = sp.get("mode") as OversightMode | null;
  const mode = modeParam && VALID_MODES.includes(modeParam) ? modeParam : "both";
  const today = new Date().toISOString().slice(0, 10);

  if (recordType !== "incident") {
    return NextResponse.json(
      { error: `Unsupported recordType '${recordType}'. Currently 'incident' is supported.` },
      { status: 400 },
    );
  }

  // ── List mode (picker) ───────────────────────────────────────────────────
  if (!id) {
    const records = db.incidents
      .findAll()
      .slice()
      .sort((a, b) => `${b.date ?? ""}`.localeCompare(`${a.date ?? ""}`))
      .slice(0, 50)
      .map((i) => {
        const yp = db.youngPeople.findById(i.child_id);
        return {
          id: i.id,
          recordType: "incident" as const,
          reference: i.reference ?? i.id,
          type: i.type,
          severity: i.severity,
          date: i.date,
          childName: yp ? yp.preferred_name || yp.first_name : "Unknown",
          requiresOversight: !!i.requires_oversight,
          oversightDone: !!i.oversight_by,
        };
      });
    return NextResponse.json({ data: { records } });
  }

  // ── Detail mode (hydrate + generate) ──────────────────────────────────────
  const incident = db.incidents.findById(id);
  if (!incident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }
  const yp = db.youngPeople.findById(incident.child_id);
  const debriefs = db.debriefRecords.findAll().filter((d) => d.linked_incident_id === id);
  const recentIncidents = db.incidents.findAll().filter((i) => i.child_id === incident.child_id);

  // Full practice-intelligence lens: the child's Digital Twin (via the CPIE
  // chokepoint — never raw records) + training rows for the involved staff.
  const twin = getChildTwin(incident.child_id);
  const staffIds = [incident.reported_by, ...(incident.witnesses ?? [])].filter(Boolean);
  const staffNameOf = (sid: string) => {
    const st = db.staff.findById(sid);
    return st ? st.full_name || [st.first_name, st.last_name].filter(Boolean).join(" ") : sid;
  };
  const staffTraining = (await safeList(dal.training.findAll()))
    .filter((t) => staffIds.includes(t.staff_id))
    .map((t) => ({
      staffName: staffNameOf(t.staff_id),
      course: t.course_name ?? "Training",
      status: t.status ?? "unknown",
      mandatory: !!t.is_mandatory,
    }));

  try {
    const input = incidentToOversightInput(incident, {
      youngPerson: yp,
      debriefs,
      recentIncidents,
      today,
      oversightMode: mode,
      reviewedByRole: auth.role,
      practiceLens: {
        childTriggers: twin?.emotional.data.triggers,
        childWhatHelps: twin?.emotional.data.whatHelps,
        childPhrasesThatEscalate: twin?.emotional.data.phrasesThatEscalate,
        childStrengths: twin?.strengths.data.strengths,
        staffTraining,
      },
    });
    const result = generateManagementOversight(input);
    return NextResponse.json({
      data: {
        record: {
          id: incident.id,
          childId: incident.child_id,
          reference: incident.reference ?? incident.id,
          type: incident.type,
          severity: incident.severity,
          date: incident.date,
          childName: input.childName ?? "Unknown",
        },
        input,
        result,
        disclaimer: OVERSIGHT_DISCLAIMER,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate oversight for this record", details: String(error) },
      { status: 500 },
    );
  }
}
