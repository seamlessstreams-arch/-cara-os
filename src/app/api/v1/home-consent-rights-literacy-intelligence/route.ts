import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeConsentRightsIntelligence,
  type ConsentRecordInput,
  type RightsLiteracyInput,
  type ParentalResponsibilityInput,
} from "@/lib/engines/home-consent-rights-literacy-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const children = store.children ?? store.youngPeople ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Consent records
  const rawConsent = (store.consentRecords as any[] ?? []);
  const consent_records: ConsentRecordInput[] = rawConsent.map((c: any) => ({
    id: c.id ?? "",
    child_id: c.child_id ?? "",
    category: c.category ?? "other",
    status: c.status ?? "pending",
    date_decided: (c.date_decided ?? today).toString().slice(0, 10),
    expiry_date: (c.expiry_date ?? "").toString().slice(0, 10),
    review_date: (c.review_date ?? "").toString().slice(0, 10),
  }));

  // Rights literacy records
  const rawRights = (store.rightsLiteracyRecords as any[] ?? []);
  const rights_literacy: RightsLiteracyInput[] = rawRights.map((r: any) => {
    const rightsKnowledge = (r.rights_knowledge ?? []) as any[];
    return {
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      recorded_date: (r.recorded_date ?? today).toString().slice(0, 10),
      knows_how_to_complain: !!(r.knows_how_to_complain),
      knows_advocate: !!(r.knows_advocate_name),
      knows_ofsted_contact: !!(r.knows_how_to_contact_ofsted),
      knows_right_to_records: !!(r.knows_right_to_access_records),
      knows_right_to_refuse_contact: !!(r.knows_right_to_refuse_contact),
      rights_used_count: (r.has_used_rights ?? []).length,
    };
  });

  // Parental responsibility records
  const rawPR = (store.parentalResponsibilityRecords as any[] ?? []);
  const parental_responsibility: ParentalResponsibilityInput[] = rawPR.map((p: any) => {
    const delegated = (p.delegated_authorities ?? []) as any[];
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const reviewedDate = p.reviewed_date ? new Date(p.reviewed_date) : new Date(0);
    return {
      id: p.id ?? "",
      child_id: p.child_id ?? "",
      pr_documented: !!(p.pr_holders && (p.pr_holders as any[]).length > 0),
      delegated_authorities_clear: delegated.length > 0,
      reviewed_recently: reviewedDate >= sixMonthsAgo,
      signed_off_by_la: !!(p.signed_off_by_la),
    };
  });

  const result = computeConsentRightsIntelligence({
    today,
    total_children: (children as any[]).length,
    consent_records,
    rights_literacy,
    parental_responsibility,
  });

  return NextResponse.json({ data: result });
}
