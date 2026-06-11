// ══════════════════════════════════════════════════════════════════════════════
// CARA — VACANCY SETUP PACK API
// Readiness checklist, values-led advert draft, interview scoring pack and the
// Schedule 2 checklist for a vacancy. Read-only; drafts need manager approval.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { db, getStore } from "@/lib/db/store";
import { buildVacancySetupPack } from "@/lib/engines/vacancy-setup-engine";
import type { EmployerValuesProfile } from "@/lib/engines/values-match-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const today = new Date().toISOString().slice(0, 10);
  const store = getStore();
  const vacancies = db.vacancies.findAll();
  if (vacancies.length === 0) {
    return NextResponse.json({ data: { vacancies: [], pack: null } });
  }

  const requestedId = req.nextUrl.searchParams.get("vacancyId");
  const vacancy = (requestedId && vacancies.find((v) => v.id === requestedId)) || vacancies[0];

  const employer: EmployerValuesProfile | null = (store.employerValuesProfiles ?? [])[0] ?? null;
  const staff = db.staff.findAll().map((s) => ({ id: s.id, full_name: s.full_name }));

  const pack = buildVacancySetupPack({
    today,
    vacancy,
    employer,
    staff,
    training_records: db.training.findAll(),
  });

  return NextResponse.json({
    data: {
      vacancies: vacancies.map((v) => ({ id: v.id, title: v.title, status: v.status, approval_status: v.approval_status })),
      pack,
    },
  });
}
