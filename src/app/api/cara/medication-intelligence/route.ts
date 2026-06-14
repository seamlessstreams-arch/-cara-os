// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/medication-intelligence
//
// GET — Analyse medication administration for a home
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseMedications, type MedicationRecord, type MedicationProfile } from "@/lib/cara/medication-intelligence";

// ── Demo data ───────────────────────────────────────────────────────────────

function getDemoData(homeId: string) {
  const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);

  const records: MedicationRecord[] = [
    // Jordan - regular medication (Methylphenidate - controlled)
    { id: "med_1", childId: "child_jordan", childName: "Jordan P", medicationName: "Methylphenidate", dose: "10mg", route: "oral", type: "controlled", scheduledTime: "08:00", administeredTime: "08:05", administeredDate: d(1), status: "given", administeredBy: "staff_sarah", witnessedBy: "staff_mike" },
    { id: "med_2", childId: "child_jordan", childName: "Jordan P", medicationName: "Methylphenidate", dose: "10mg", route: "oral", type: "controlled", scheduledTime: "08:00", administeredTime: "08:10", administeredDate: d(2), status: "given", administeredBy: "staff_sarah", witnessedBy: "staff_mike" },
    { id: "med_3", childId: "child_jordan", childName: "Jordan P", medicationName: "Methylphenidate", dose: "10mg", route: "oral", type: "controlled", scheduledTime: "08:00", administeredTime: "08:45", administeredDate: d(3), status: "given", administeredBy: "staff_emma", witnessedBy: "staff_sarah" },
    { id: "med_4", childId: "child_jordan", childName: "Jordan P", medicationName: "Methylphenidate", dose: "10mg", route: "oral", type: "controlled", scheduledTime: "08:00", administeredDate: d(4), status: "refused", administeredBy: "staff_mike", refusalReason: "Said he didn't want it" },
    { id: "med_5", childId: "child_jordan", childName: "Jordan P", medicationName: "Methylphenidate", dose: "10mg", route: "oral", type: "controlled", scheduledTime: "08:00", administeredTime: "08:08", administeredDate: d(5), status: "given", administeredBy: "staff_sarah", witnessedBy: "staff_emma" },
    { id: "med_6", childId: "child_jordan", childName: "Jordan P", medicationName: "Methylphenidate", dose: "10mg", route: "oral", type: "controlled", scheduledTime: "08:00", administeredDate: d(6), status: "missed" },
    { id: "med_7", childId: "child_jordan", childName: "Jordan P", medicationName: "Methylphenidate", dose: "10mg", route: "oral", type: "controlled", scheduledTime: "08:00", administeredTime: "08:03", administeredDate: d(7), status: "given", administeredBy: "staff_mike", witnessedBy: "staff_emma" },

    // Jordan - PRN (Ibuprofen)
    { id: "med_8", childId: "child_jordan", childName: "Jordan P", medicationName: "Ibuprofen", dose: "200mg", route: "oral", type: "prn", scheduledTime: "", administeredTime: "14:30", administeredDate: d(1), status: "given", administeredBy: "staff_sarah", notes: "Headache" },
    { id: "med_9", childId: "child_jordan", childName: "Jordan P", medicationName: "Ibuprofen", dose: "200mg", route: "oral", type: "prn", scheduledTime: "", administeredTime: "10:00", administeredDate: d(3), status: "given", administeredBy: "staff_mike", notes: "Knee pain from football" },
    { id: "med_10", childId: "child_jordan", childName: "Jordan P", medicationName: "Ibuprofen", dose: "200mg", route: "oral", type: "prn", scheduledTime: "", administeredTime: "16:45", administeredDate: d(5), status: "given", administeredBy: "staff_emma", notes: "Headache" },

    // Sam - regular (Melatonin)
    { id: "med_11", childId: "child_sam", childName: "Sam W", medicationName: "Melatonin", dose: "3mg", route: "oral", type: "regular", scheduledTime: "21:00", administeredTime: "21:05", administeredDate: d(1), status: "given", administeredBy: "staff_sarah" },
    { id: "med_12", childId: "child_sam", childName: "Sam W", medicationName: "Melatonin", dose: "3mg", route: "oral", type: "regular", scheduledTime: "21:00", administeredTime: "21:10", administeredDate: d(2), status: "given", administeredBy: "staff_mike" },
    { id: "med_13", childId: "child_sam", childName: "Sam W", medicationName: "Melatonin", dose: "3mg", route: "oral", type: "regular", scheduledTime: "21:00", administeredDate: d(3), status: "refused", refusalReason: "Not tired" },
    { id: "med_14", childId: "child_sam", childName: "Sam W", medicationName: "Melatonin", dose: "3mg", route: "oral", type: "regular", scheduledTime: "21:00", administeredTime: "21:35", administeredDate: d(4), status: "given", administeredBy: "staff_emma" },
    { id: "med_15", childId: "child_sam", childName: "Sam W", medicationName: "Melatonin", dose: "3mg", route: "oral", type: "regular", scheduledTime: "21:00", administeredTime: "21:02", administeredDate: d(5), status: "given", administeredBy: "staff_sarah" },
    { id: "med_16", childId: "child_sam", childName: "Sam W", medicationName: "Melatonin", dose: "3mg", route: "oral", type: "regular", scheduledTime: "21:00", administeredTime: "21:08", administeredDate: d(6), status: "given", administeredBy: "staff_mike" },
    { id: "med_17", childId: "child_sam", childName: "Sam W", medicationName: "Melatonin", dose: "3mg", route: "oral", type: "regular", scheduledTime: "21:00", administeredTime: "21:00", administeredDate: d(7), status: "given", administeredBy: "staff_emma" },

    // Sam - topical (Eczema cream)
    { id: "med_18", childId: "child_sam", childName: "Sam W", medicationName: "Hydrocortisone", dose: "1%", route: "topical", type: "regular", scheduledTime: "08:30", administeredTime: "08:35", administeredDate: d(1), status: "given", administeredBy: "staff_sarah" },
    { id: "med_19", childId: "child_sam", childName: "Sam W", medicationName: "Hydrocortisone", dose: "1%", route: "topical", type: "regular", scheduledTime: "08:30", administeredTime: "08:40", administeredDate: d(2), status: "given", administeredBy: "staff_mike" },
    { id: "med_20", childId: "child_sam", childName: "Sam W", medicationName: "Hydrocortisone", dose: "1%", route: "topical", type: "regular", scheduledTime: "08:30", administeredDate: d(3), status: "not_available", notes: "Out of stock" },
  ];

  const profiles: MedicationProfile[] = [
    {
      childId: "child_jordan",
      childName: "Jordan P",
      medications: [
        { name: "Methylphenidate", type: "controlled", frequency: "Once daily (morning)", lastReviewDate: d(30) },
        { name: "Ibuprofen", type: "prn", frequency: "As needed for pain" },
      ],
    },
    {
      childId: "child_sam",
      childName: "Sam W",
      medications: [
        { name: "Melatonin", type: "regular", frequency: "Once daily (bedtime)", lastReviewDate: d(45) },
        { name: "Hydrocortisone", type: "regular", frequency: "Once daily (morning)" },
      ],
    },
  ];

  return { records, profiles };
}

// ── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const homeId = req.nextUrl.searchParams.get("homeId") ?? "home_oak";
    const days = parseInt(req.nextUrl.searchParams.get("days") ?? "7", 10);

    const { records, profiles } = getDemoData(homeId);
    const analysis = analyseMedications(records, profiles, homeId, days);

    return NextResponse.json({ ok: true, data: analysis });
  } catch (err) {
    console.error("[cara/medication-intelligence] GET error:", err);
    return NextResponse.json({ error: "Failed to analyse medication data" }, { status: 500 });
  }
}
