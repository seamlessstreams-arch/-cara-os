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
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { incidentToOversightInput } from "@/lib/oversight/hydrate";
import { generateManagementOversight } from "@/lib/oversight/management-oversight-engine";
import { OVERSIGHT_DISCLAIMER, type OversightMode } from "@/lib/oversight/types";

export const dynamic = "force-dynamic";

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

  try {
    const input = incidentToOversightInput(incident, {
      youngPerson: yp,
      debriefs,
      recentIncidents,
      today,
      oversightMode: mode,
      reviewedByRole: auth.role,
    });
    const result = generateManagementOversight(input);
    return NextResponse.json({
      data: {
        record: {
          id: incident.id,
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
