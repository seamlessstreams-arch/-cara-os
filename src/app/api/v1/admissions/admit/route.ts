// ══════════════════════════════════════════════════════════════════════════════
// ADMISSIONS — ADMIT A CHILD (deterministic intake, no AI)
//
// POST /api/v1/admissions/admit — the single admit action behind the
// "Admit a child" page. One request routes the admission's information where
// it needs to go:
//   1. creates the young person (dual-mode dal → durable on live);
//   2. files the initial referral, when supplied, through the smart-documents
//      pipeline (#823) linked to the child — durable documents row + full
//      deterministic analysis;
//   3. seeds draft risk assessments from the referral's extracted risk
//      factors, one per recognised domain, carrying the referral's wording;
//   4. instantiates the New Placement Admission workflow as dated,
//      role-annotated tasks anchored to the placement date (durable via the
//      dual-mode task path).
// Everything is deterministic — same referral text, same intake — and none of
// it needs AI credits.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { readJsonBody } from "@/lib/http/read-json";
import { createTaskRecord, createRiskAssessmentRecord } from "@/lib/supabase/care-records";
import { generateId, todayStr } from "@/lib/utils";
import { performSmartUpload } from "@/lib/compliance/smart-upload";
import { extractReferralDocument } from "@/lib/referral-extraction/referral-extraction-engine";
import {
  buildAdmissionTaskPlan,
  buildDraftRiskAssessments,
} from "@/lib/admissions/admission-intake";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data as Record<string, unknown>;

  const firstName = ((b.first_name as string) || "").trim();
  const lastName = ((b.last_name as string) || "").trim();
  const dob = (b.date_of_birth as string) || "";
  const placementStart = (b.placement_start as string) || "";
  const localAuthority = ((b.local_authority as string) || "").trim();
  if (!firstName || !lastName || !dob || !placementStart || !localAuthority) {
    return NextResponse.json(
      { error: "first_name, last_name, date_of_birth, placement_start and local_authority are required." },
      { status: 400 },
    );
  }

  const actorId = (b.actor_id as string) || "staff_darren";
  const referralText = ((b.referral_text as string) || "").trim();
  const today = todayStr();
  const now = new Date().toISOString();

  // ── 1. The young person (same create path the manual form has always used) ─
  const yp = await dal.youngPeople.create({
    first_name: firstName,
    last_name: lastName,
    preferred_name: ((b.preferred_name as string) || "").trim() || null,
    date_of_birth: dob,
    gender: ((b.gender as string) || "").trim() || null,
    placement_start: placementStart,
    local_authority: localAuthority,
    legal_status: (b.legal_status as string) || null,
    status: "current",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const child = yp as any;
  if (!child?.id) {
    return NextResponse.json({ error: "Could not create the young person record." }, { status: 500 });
  }
  const childName = `${firstName} ${lastName}`;
  const homeId = (child.home_id as string) || "home_oak";

  // ── 2. File the initial referral through the smart-documents pipeline ──────
  let documentSummary: { id: string; category: string; status: string; suggested_tasks: number } | null = null;
  let riskAssessments: { id: string; domain: string }[] = [];
  if (referralText.length >= 20) {
    const uploaded = await performSmartUpload({
      fileName: (b.referral_file_name as string) || `Initial referral — ${childName}`,
      text: referralText,
      fileType: (b.referral_file_type as string) || "text/plain",
      uploadContext: "Initial referral — admission",
      actorId,
      linkedChildId: child.id,
    });
    documentSummary = {
      id: uploaded.id,
      category: uploaded.document_category ?? "other",
      status: uploaded.document_status,
      suggested_tasks: uploaded.ai_result?.suggested_tasks.length ?? 0,
    };

    // ── 3. Referral risks → draft risk assessments on the child ─────────────
    const { fields } = extractReferralDocument({ text: referralText, fileName: uploaded.original_file_name, today });
    const drafts = buildDraftRiskAssessments({
      extraction: fields,
      childId: child.id,
      homeId,
      actorId,
      today,
    });
    riskAssessments = drafts.map((d) => {
      // Dual-mode: in-memory store + best-effort generic_records write-through,
      // so the draft RAs survive on a live tenant (the same durable path the
      // /risk-assessments route uses) rather than vanishing on cold start.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created = createRiskAssessmentRecord(d as any) as any;
      return { id: created.id as string, domain: created.domain as string };
    });
  }

  // ── 4. The admission workflow as dated tasks ───────────────────────────────
  const plan = buildAdmissionTaskPlan({ placementStart, today, childName });
  const tasksCreated = plan.map((t) => {
    const task = {
      // the store regenerates ids on create — the returned record below is
      // authoritative, this seed id only satisfies the input shape
      id: generateId("tsk"),
      home_id: homeId,
      title: t.title,
      description: t.description,
      status: "not_started" as const,
      priority: t.priority,
      category: t.category,
      assigned_to: null,
      created_by: actorId,
      due_date: t.due_date,
      completed_at: null,
      linked_document_id: documentSummary?.id ?? null,
      linked_child_id: child.id,
      linked_staff_id: null,
      created_at: now,
      updated_at: now,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = createTaskRecord(task) as any;
    return { id: (created?.id as string) ?? task.id, title: t.title, due_date: t.due_date, priority: t.priority };
  });

  return NextResponse.json({
    data: {
      young_person: child,
      tasks_created: tasksCreated,
      document: documentSummary,
      risk_assessments: riskAssessments,
    },
  });
}
