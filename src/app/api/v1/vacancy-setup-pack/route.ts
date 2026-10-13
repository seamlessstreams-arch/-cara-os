// ══════════════════════════════════════════════════════════════════════════════
// CARA — VACANCY SETUP PACK API
// Readiness checklist, values-led advert draft, interview scoring pack and the
// Schedule 2 checklist for a vacancy. Read-only; drafts need manager approval.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { dal } from "@/lib/db";
import { buildVacancySetupPack } from "@/lib/engines/vacancy-setup-engine";
import type { EmployerValuesProfile } from "@/lib/engines/values-match-engine";
import type { Vacancy } from "@/types/recruitment";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const today = todayStr();
  const employerValuesProfilesList = await dal.employerValuesProfiles.findAll();
  // dal returns the Supabase row on live (looser enums); present as app Vacancy.
  const vacancies = (await dal.vacancies.findAll()) as Vacancy[];
  if (vacancies.length === 0) {
    return NextResponse.json({ data: { vacancies: [], pack: null } });
  }

  const requestedId = req.nextUrl.searchParams.get("vacancyId");
  const vacancy = (requestedId && vacancies.find((v) => v.id === requestedId)) || vacancies[0];

  const employer: EmployerValuesProfile | null = (employerValuesProfilesList ?? [])[0] ?? null;
  const staff = (await dal.staff.findAll()).map((s) => ({ id: s.id, full_name: s.full_name }));

  const pack = buildVacancySetupPack({
    today,
    vacancy,
    employer,
    staff,
    training_records: await dal.training.findAll(),
  });

  return NextResponse.json({
    data: {
      vacancies: vacancies.map((v) => ({ id: v.id, title: v.title, status: v.status, approval_status: v.approval_status })),
      pack,
    },
  });
}
