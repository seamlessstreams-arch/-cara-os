import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ vacancyId: string }> }
) {
  const { vacancyId } = await params;

  const vacancy = db.vacancies.findById(vacancyId);
  if (!vacancy) {
    return NextResponse.json({ error: "Vacancy not found" }, { status: 404 });
  }

  // Find all candidates linked to this vacancy
  const linkedProfiles = db.candidateProfiles.findAll().filter(
    (c) => c.vacancy_id === vacancyId
  );

  const candidates = linkedProfiles.map((c) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`,
    email: c.email,
    stage: c.current_stage,
    risk_level: c.risk_level,
    days_total: Math.max(0, Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000)),
    compliance_score: (() => {
      const checks = db.candidateChecks.findByCandidate(c.id);
      const verified = checks.filter((ch) => ch.status === "verified").length;
      return checks.length > 0 ? Math.round((verified / checks.length) * 100) : 0;
    })(),
  }));

  // Stage breakdown
  const by_stage: Record<string, number> = {};
  for (const c of candidates) {
    by_stage[c.stage] = (by_stage[c.stage] ?? 0) + 1;
  }

  const days_open = Math.max(0, Math.floor(
    (Date.now() - new Date(vacancy.created_at).getTime()) / 86400000
  ));

  return NextResponse.json({
    data: {
      id: vacancy.id,
      home_id: vacancy.home_id,
      title: vacancy.title,
      role_code: vacancy.role_code,
      employment_type: vacancy.employment_type,
      contract_type: vacancy.contract_type,
      salary_min: vacancy.salary_min,
      salary_max: vacancy.salary_max,
      hours: vacancy.hours,
      shift_pattern: vacancy.shift_pattern,
      safeguarding_statement: vacancy.safeguarding_statement,
      status: vacancy.status,
      approval_status: vacancy.approval_status,
      reports_to: vacancy.reports_to,
      posted_date: vacancy.created_at,
      days_open,
      applications_count: candidates.length,
      by_stage,
      candidates,
      created_at: vacancy.created_at,
      updated_at: vacancy.updated_at,
    },
  });
}
