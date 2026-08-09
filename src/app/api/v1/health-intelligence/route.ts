import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Signal = "green" | "amber" | "red" | "grey";

export type HealthChildProfile = {
  childId: string;
  childName: string;
  totalRecords: number;
  openConditions: number;
  allergies: string[];
  mentalHealthRecords: number;
  camhsInvolvement: boolean;
  overdueFollowUps: number;
  upcomingFollowUps: number;
  recentRecordDate: string | null;
  signal: Signal;
};

export type HealthRecentRecord = {
  childName: string;
  type: string;
  date: string;
  title: string;
  professional: string;
  signal: Signal;
};

export type HealthIntelligenceData = {
  totalRecords: number;
  openConditions: number;
  allergiesCount: number;
  mentalHealthRecords: number;
  camhsInvolvementCount: number;
  overdueFollowUps: number;
  upcomingFollowUps: number;
  recentRecords: HealthRecentRecord[];
  childProfiles: HealthChildProfile[];
  insights: string[];
  overallSignal: Signal;
  regulatoryNote: string;
};

const RECORD_TYPE_LABELS: Record<string, string> = {
  health_assessment: "Health Assessment",
  allergy: "Allergy",
  mental_health: "Mental Health",
  optical: "Optical",
  immunisation: "Immunisation",
  referral: "Referral",
  dental: "Dental",
  condition: "Condition",
  growth: "Growth",
  appointment: "Appointment",
  medication_review: "Medication Review",
};

function getRecordSignal(recordType: string, status: string): Signal {
  if (recordType === "allergy") return "amber";
  if (recordType === "mental_health" || recordType === "condition") return status === "monitoring" ? "amber" : "grey";
  if (recordType === "referral" && status === "referred") return "amber";
  return "grey";
}

export async function GET() {
  const [healthRecordEntriesList, youngPeopleList] = await Promise.all([
      dal.healthRecordEntries.findAll(),
      dal.youngPeople.findAll(),
    ]);
  const today = todayStr();
  const in14Days = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);

  const currentChildren = youngPeopleList.filter((yp) => yp.status === "current");
  const childMap = new Map(currentChildren.map((yp) => [yp.id, yp.preferred_name ?? yp.first_name]));

  const allRecords = healthRecordEntriesList.filter((r) => childMap.has(r.child_id));

  let totalOpenConditions = 0;
  let totalAllergies = 0;
  let totalMentalHealth = 0;
  let totalCamhsChildren = 0;
  let totalOverdue = 0;
  let totalUpcoming = 0;

  const childProfiles: HealthChildProfile[] = [];

  for (const child of currentChildren) {
    const records = allRecords.filter((r) => r.child_id === child.id);
    if (records.length === 0) {
      childProfiles.push({
        childId: child.id,
        childName: child.preferred_name ?? child.first_name,
        totalRecords: 0,
        openConditions: 0,
        allergies: [],
        mentalHealthRecords: 0,
        camhsInvolvement: false,
        overdueFollowUps: 0,
        upcomingFollowUps: 0,
        recentRecordDate: null,
        signal: "grey",
      });
      continue;
    }

    const openConditions = records.filter(
      (r) => (r.record_type === "condition" || r.record_type === "mental_health") &&
              (r.status === "current" || r.status === "monitoring")
    ).length;

    const allergies = records
      .filter((r) => r.record_type === "allergy")
      .map((r) => r.title.replace(/— documented$/i, "").trim());

    const mentalHealthRecords = records.filter(
      (r) => r.record_type === "mental_health" || r.record_type === "referral"
    ).length;

    const camhsInvolvement = records.some(
      (r) => (r.professional ?? "").toLowerCase().includes("camhs") ||
              (r.details ?? "").toLowerCase().includes("camhs")
    );

    const overdueFollowUps = records.filter(
      (r) => r.follow_up_date && r.follow_up_date < today && r.status !== "resolved"
    ).length;

    const upcomingFollowUps = records.filter(
      (r) => r.follow_up_date && r.follow_up_date >= today && r.follow_up_date <= in14Days
    ).length;

    const sortedByDate = records.slice().sort((a, b) => b.date.localeCompare(a.date));
    const recentRecordDate = sortedByDate[0]?.date ?? null;

    let signal: Signal;
    if (overdueFollowUps > 0 || allergies.length > 0) signal = "amber";
    else if (openConditions > 0 || mentalHealthRecords > 0) signal = "amber";
    else signal = "green";
    if (overdueFollowUps > 1) signal = "red";

    totalOpenConditions += openConditions;
    totalAllergies += allergies.length;
    totalMentalHealth += mentalHealthRecords;
    if (camhsInvolvement) totalCamhsChildren++;
    totalOverdue += overdueFollowUps;
    totalUpcoming += upcomingFollowUps;

    childProfiles.push({
      childId: child.id,
      childName: child.preferred_name ?? child.first_name,
      totalRecords: records.length,
      openConditions,
      allergies,
      mentalHealthRecords,
      camhsInvolvement,
      overdueFollowUps,
      upcomingFollowUps,
      recentRecordDate,
      signal,
    });
  }

  const recentRecords: HealthRecentRecord[] = allRecords
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)
    .map((r) => ({
      childName: childMap.get(r.child_id) ?? "Unknown",
      type: RECORD_TYPE_LABELS[r.record_type] ?? r.record_type,
      date: r.date,
      title: r.title,
      professional: r.professional ?? "",
      signal: getRecordSignal(r.record_type, r.status),
    }));

  const insights: string[] = [];

  if (totalOverdue > 0) {
    insights.push(
      `${totalOverdue} health follow-up${totalOverdue === 1 ? " is" : "s are"} overdue. Health follow-ups for children in care must be completed promptly — review each record and rebook.`
    );
  }
  if (totalAllergies > 0) {
    insights.push(
      `${totalAllergies} documented allerg${totalAllergies === 1 ? "y" : "ies"} across current children. Ensure all staff know about these and that records are updated in the MAR and school information.`
    );
  }
  if (totalUpcoming > 0) {
    insights.push(
      `${totalUpcoming} health follow-up${totalUpcoming === 1 ? " is" : "s are"} due within the next 14 days. Plan transport and prepare the young ${totalUpcoming === 1 ? "person" : "people"} in advance.`
    );
  }
  if (totalCamhsChildren > 0) {
    insights.push(
      `${totalCamhsChildren} child${totalCamhsChildren === 1 ? " has" : "ren have"} CAMHS involvement. Ensure CAMHS letters and notes are filed in the health record and shared with the social worker.`
    );
  }

  let overallSignal: Signal;
  if (childProfiles.some((p) => p.signal === "red")) overallSignal = "red";
  else if (childProfiles.some((p) => p.signal === "amber")) overallSignal = "amber";
  else if (childProfiles.every((p) => p.signal === "grey")) overallSignal = "grey";
  else overallSignal = "green";

  const data: HealthIntelligenceData = {
    totalRecords: allRecords.length,
    openConditions: totalOpenConditions,
    allergiesCount: totalAllergies,
    mentalHealthRecords: totalMentalHealth,
    camhsInvolvementCount: totalCamhsChildren,
    overdueFollowUps: totalOverdue,
    upcomingFollowUps: totalUpcoming,
    recentRecords,
    childProfiles,
    insights,
    overallSignal,
    regulatoryNote:
      "Children in care must receive an Initial Health Assessment (IHA) within 20 working days of placement, and annual Health Assessments thereafter (Care Planning Regulations 2010, Reg 7). Children's Homes Regulations 2015 Reg 20 requires the registered person to promote each child's health and wellbeing.",
  };

  return NextResponse.json({ data });
}
