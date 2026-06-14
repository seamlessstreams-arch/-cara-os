import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeWhistleblowingTransparency,
  type WhistleblowingRecordInput,
  type TransparencyCultureInput,
} from "@/lib/engines/home-whistleblowing-transparency-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const staff = store.staff ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Whistleblowing records → WhistleblowingRecordInput[]
  const rawRecords = (store.whistleblowingRecords as any[] ?? []);
  const records: WhistleblowingRecordInput[] = rawRecords.map((r: any) => ({
    id: r.id ?? "",
    date_raised: (r.date_raised ?? "").toString().slice(0, 10),
    anonymous: !!(r.anonymous),
    category: r.category ?? "other",
    severity: r.severity ?? "low",
    status: r.status ?? "received",
    has_external_referral: !!(r.external_referral),
    has_outcome: !!(r.outcome && r.outcome.trim().length > 0),
    has_lessons_learned: !!(r.lessons_learned && r.lessons_learned.trim().length > 0),
    protection_measures_count: (r.protection_measures ?? []).length,
    timeline_actions_count: (r.timeline ?? []).length,
  }));

  // Transparency culture — derive from staff + policy acknowledgements
  // Check if staff have read the whistleblowing policy
  const rawPolicies = (store.homePolicies as any[] ?? []);
  const wbPolicy = rawPolicies.find((p: any) =>
    p.category === "whistleblowing" || p.title?.toLowerCase().includes("whistleblowing")
  );
  const wbPolicyAcks = (wbPolicy?.read_acknowledgements ?? []) as any[];
  const ackedStaffIds = new Set(wbPolicyAcks.map((a: any) => a.staff_id));

  // Build culture inputs from staff, with wellbeing records as a proxy for confidence
  const rawWellbeing = (store.staffWellbeingRecords as any[] ?? []);
  const culture: TransparencyCultureInput[] = (staff as any[]).map((s: any) => {
    const hasWellbeing = rawWellbeing.some((w: any) => w.staff_id === s.id);
    return {
      id: s.id ?? "",
      staff_id: s.id ?? "",
      whistleblowing_policy_read: ackedStaffIds.has(s.id),
      feels_confident_to_report: hasWellbeing || ackedStaffIds.has(s.id),
      knows_how_to_report: ackedStaffIds.has(s.id),
    };
  });

  const result = computeWhistleblowingTransparency({
    today,
    total_staff: (staff as any[]).length,
    records,
    culture,
  });

  return NextResponse.json({ data: result });
}
