import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { londonDayDiff } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ vacancyId: string }> }
) {
  const { vacancyId } = await params;

  const vacancy = await dal.vacancies.findById(vacancyId);
  if (!vacancy) {
    return NextResponse.json({ error: "Vacancy not found" }, { status: 404 });
  }

  // Find all candidates linked to this vacancy
  const allProfiles = await dal.candidateProfiles.findAll();
  const linkedProfiles = allProfiles.filter((c) => c.vacancy_id === vacancyId);

  // Pre-fetch checks for the linked candidates in parallel, index by candidate id,
  // so the enrichment .map() below stays sync (checks are per-candidate; a single
  // findByCandidate per profile is one query per row on live — Promise.all is O(N)
  // but issued concurrently, still bounded by the linked-candidate count).
  const checksByCandidate = new Map(
    await Promise.all(
      linkedProfiles.map(async (c) => [c.id, await dal.candidateChecks.findByCandidate(c.id)] as const),
    ),
  );

  const candidates = linkedProfiles.map((c) => {
    const checks = checksByCandidate.get(c.id) ?? [];
    const verified = checks.filter((ch) => ch.status === "verified").length;
    return {
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      email: c.email,
      stage: c.current_stage,
      risk_level: c.risk_level,
      days_total: Math.max(0, -londonDayDiff(c.created_at)),
      compliance_score: checks.length > 0 ? Math.round((verified / checks.length) * 100) : null,
    };
  });

  // Stage breakdown
  const by_stage: Record<string, number> = {};
  for (const c of candidates) {
    by_stage[c.stage] = (by_stage[c.stage] ?? 0) + 1;
  }

  const days_open = Math.max(0, Math.floor(
    -londonDayDiff(vacancy.created_at)
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
