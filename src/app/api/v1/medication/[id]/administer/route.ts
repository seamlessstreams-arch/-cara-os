import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { processMedicationException } from "@/lib/db/linked-updates";
import { withShiftAccess } from "@/lib/permissions/with-shift-access";

export const dynamic = "force-dynamic";

// Administering medication is an operational write — guarded by medication / create.
async function administerMedication(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { status, administered_by, witnessed_by, dose_given, reason_not_given, notes, prn_reason, prn_effectiveness } = body;

  const updated = db.medicationAdministrations.administer(id, {
    status, administered_by, witnessed_by, dose_given,
    reason_not_given, notes, prn_reason, prn_effectiveness,
  });

  if (!updated) {
    return NextResponse.json({ error: "Administration record not found" }, { status: 404 });
  }

  // Trigger linked updates for exceptions
  if (status === "refused" || status === "late" || status === "missed") {
    const med = db.medications.findAll().find((m) => m.id === updated.medication_id);
    processMedicationException(
      id, updated.child_id, administered_by || "unknown",
      "home_oak", status,
      `${med?.name || "Medication"} ${status}: ${reason_not_given || notes || "No notes provided"}`
    );
  }

  return NextResponse.json({ data: updated, linked_updates: status !== "given" ? ["daily_log", "notification"] : [] });
}

export const POST = withShiftAccess("medication", "create", administerMedication);
