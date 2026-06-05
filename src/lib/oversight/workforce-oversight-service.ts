// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Workforce Oversight service (Phase 8)
//
// Reads the live store + the safe-staffing service, and produces the oversight
// summary / evidence pack. Read-only.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { buildSafeStaffingStatus } from "@/lib/staffing/safe-staffing-service";
import { buildWorkforceOversight, type WorkforceOversightInput, type WorkforceOversight } from "./workforce-oversight";
import { buildWorkforceEvidencePack, type WorkforceEvidencePack } from "./workforce-evidence";

function gather(homeId: string, nowIso: string, periodDays?: number): WorkforceOversightInput {
  const staffing = buildSafeStaffingStatus(homeId, nowIso).assessment;
  return {
    homeId,
    nowIso,
    periodDays,
    // Full store records structurally satisfy the *Like shapes.
    shifts: db.shifts.findAll() as WorkforceOversightInput["shifts"],
    verifications: db.signInVerifications.findAll(),
    messageActions: db.commsMessageActions.findAll(),
    messages: db.commsMessages.findAll() as WorkforceOversightInput["messages"],
    emergencies: db.emergencyAlerts.findAll(),
    staffing,
  };
}

export function buildWorkforceOversightStatus(homeId: string, nowIso: string, periodDays?: number): WorkforceOversight {
  return buildWorkforceOversight(gather(homeId, nowIso, periodDays));
}

export function buildWorkforceEvidencePackForHome(homeId: string, nowIso: string, periodDays?: number): WorkforceEvidencePack {
  return buildWorkforceEvidencePack(gather(homeId, nowIso, periodDays));
}
