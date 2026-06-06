import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { dal } from "@/lib/db/dal";
import { intelligenceDb } from "@/lib/intelligence/store";
import { computeRiScores } from "@/lib/ri/compute-scores";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? "home_oak";

  // Gather inputs from stores
  const alerts = intelligenceDb.riAlerts.findAll(homeId);
  const reg45Items = intelligenceDb.riReg45Evidence.findAll(homeId);
  const challenges = intelligenceDb.riChallengeLogs.findAll(homeId);
  const incidents = await dal.incidents.findAll();
  const trainingRecords = db.training.findAll();
  const audits = db.audits.findAll();
  const dailyLogs = await dal.dailyLog.findAll();
  const careForms = await dal.careForms.findAll();

  const scores = computeRiScores({
    trainingNeeds: [],
    trainingRecords,
    alerts,
    incidents,
    supervisionsMeta: {},
    auditsMeta: {},
    audits,
    medicationAudits: audits.filter((a) => a.category === "medication"),
    reg45Items,
    challenges,
    careForms,
    dailyLogs,
    activeCandidates: [],
    ypCount: 3,
  });

  const overall = scores.overall_governance_score;
  const riskLevel = overall >= 80 ? "low" : overall >= 65 ? "medium" : overall >= 50 ? "high" : "critical";

  // Category averages
  const safeguardingAvg = Math.round(
    (scores.safeguarding_oversight_score + scores.incident_management_score +
     scores.missing_episodes_score + scores.child_voice_score + scores.outcome_evidence_score) / 5,
  );
  const workforceAvg = Math.round(
    (scores.staff_supervision_score + scores.training_compliance_score +
     scores.recruitment_compliance_score) / 3,
  );
  const careQualityAvg = Math.round(
    (scores.medication_governance_score + scores.care_planning_score +
     scores.complaint_management_score) / 3,
  );
  const governanceAvg = Math.round(
    (scores.reg45_compliance_score + scores.oversight_quality_score +
     scores.challenge_log_score + scores.building_safety_score) / 4,
  );

  // Count by RAG status
  const allScores = Object.entries(scores)
    .filter(([k]) => k !== "overall_governance_score")
    .map(([, v]) => v as number);
  const green = allScores.filter((s) => s >= 80).length;
  const amber = allScores.filter((s) => s >= 65 && s < 80).length;
  const red   = allScores.filter((s) => s < 65).length;

  return NextResponse.json({
    data: scores,
    meta: {
      overall,
      risk_level: riskLevel,
      categories: {
        safeguarding: safeguardingAvg,
        workforce: workforceAvg,
        care_quality: careQualityAvg,
        governance: governanceAvg,
      },
      rag: { green, amber, red },
    },
  });
}
