import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { below, formatRate, meets, rate, rateOf } from "@/lib/metrics/rate";
import type {
  EvidenceSection,
  InspectionEvidenceAnalysis,
  SignalColour,
} from "@/lib/cara-visual-toolkit/types";

export const dynamic = "force-dynamic";

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.round(Math.abs(d1 - d2) / 86_400_000);
}

/**
 * A section's signal from its evidence criteria. A `null` criterion is one
 * with nothing to test against — it is dropped from the denominator so an
 * unmeasured criterion neither earns a pass nor manufactures a failure.
 */
function sig(criteria: readonly (boolean | null)[]): SignalColour {
  const measured = criteria.filter((c): c is boolean => c !== null);
  if (measured.length === 0) return "grey";
  const passRate = rateOf(measured.filter(Boolean), measured);
  // Green needs a clean sweep AND a majority of the section actually tested.
  // Without the second condition a section with two of its three criteria
  // unmeasured goes green on the strength of one passing check — which is the
  // same over-claim as scoring an empty population, just one level up.
  const majorityTested = measured.length * 2 >= criteria.length;
  if (meets(passRate, 100)) return majorityTested ? "green" : "amber";
  if (meets(passRate, 60)) return "amber";
  return "red";
}

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);
  const thirtyAgo = new Date(new Date().getTime() - 30 * 86_400_000).toISOString().slice(0, 10);
  const ninetyAgo = new Date(new Date().getTime() - 90 * 86_400_000).toISOString().slice(0, 10);

  const youngPeople = (store.youngPeople as any[]) ?? [];
  const incidents = (store.incidents as any[]) ?? [];
  const keyWorkingSessions = (store.keyWorkingSessions as any[]) ?? [];
  const staff = (store.staff as any[]) ?? [];
  const trainingRecords = (store.trainingRecords as any[]) ?? [];
  const reflectiveSupervisions = (store.reflectiveSupervisions as any[]) ?? [];
  const reg44 = (store.reg44VisitReports as any[]) ?? [];
  const riskAssessments = (store.riskAssessments as any[]) ?? [];
  const missingEpisodes = (store.missingEpisodes as any[]) ?? [];
  const debriefs = (store.debriefRecords as any[]) ?? [];

  const activeChildren = youngPeople.filter(
    (y: any) => y.status !== "moved_on" && y.status !== "discharged"
  );
  const activeStaff = staff.filter(
    (s: any) => s.employment_status !== "left" && s.is_active !== false
  );

  // ── Section 1: Children's outcomes and experiences ─────────────────────
  const recentKW = keyWorkingSessions.filter((k: any) => (k.date ?? "") >= thirtyAgo);
  const voiceCount = keyWorkingSessions.filter(
    (k: any) => k.child_voice && String(k.child_voice).trim().length > 10
  ).length;
  // With no children resident there is nothing to cover — that criterion is not
  // applicable rather than failed.
  const s1 = [
    recentKW.length > 0,
    voiceCount > 0,
    activeChildren.length > 0
      ? new Set(recentKW.map((k: any) => k.child_id)).size >= activeChildren.length * 0.7
      : null,
  ];
  const section1: EvidenceSection = {
    id: "outcomes",
    title: "Children's outcomes and experiences",
    regulatoryRef: "CHR 2015 Reg 6, 7; UN CRC Article 12; Ofsted SCCIF",
    signal: sig(s1),
    keyFindings: [
      `${recentKW.length} key work sessions in last 30 days across ${new Set(recentKW.map((k: any) => k.child_id)).size} children`,
      `${voiceCount} sessions with child voice recorded`,
    ],
    evidenceStrengths: [
      recentKW.length > 0 ? "Regular key work sessions demonstrating relational practice" : "",
      voiceCount > 0 ? "Child voice is being recorded in key work" : "",
    ].filter(Boolean),
    gaps: [
      voiceCount === 0 ? "No child voice recorded in key work sessions — this will be a significant concern for Ofsted" : "",
      activeChildren.length > 0 && new Set(recentKW.map((k: any) => k.child_id)).size < activeChildren.length * 0.7
        ? "Not all children have had recent key work"
        : "",
    ].filter(Boolean),
  };

  // ── Section 2: Safeguarding ───────────────────────────────────────────
  const openCritical = incidents.filter(
    (i: any) => i.severity === "critical" && i.status !== "closed"
  ).length;
  const missingWithRHI = missingEpisodes.filter(
    (m: any) => !m.current_missing && m.return_interview_completed === true
  ).length;
  const totalReturned = missingEpisodes.filter((m: any) => !m.current_missing).length;
  // No returned episodes means no return home interviews were due.
  const rhiRate = rate(missingWithRHI, totalReturned);
  const s2 = [
    openCritical === 0,
    totalReturned > 0 ? meets(rhiRate, 80) : null,
    riskAssessments.filter((r: any) => r.status !== "closed").length > 0,
  ];
  const section2: EvidenceSection = {
    id: "safeguarding",
    title: "Safeguarding",
    regulatoryRef: "CHR 2015 Reg 12, 34, 40; Working Together 2023; Ofsted SCCIF",
    signal: sig(s2),
    keyFindings: [
      `${incidents.length} incidents on record`,
      `Return home interview completion rate: ${formatRate(rhiRate, "no returned episodes to interview")}`,
      `${riskAssessments.filter((r: any) => r.status !== "closed").length} active risk assessments`,
    ],
    evidenceStrengths: [
      openCritical === 0 ? "No open critical incidents" : "",
      meets(rhiRate, 100) ? "100% return home interview completion" : "",
    ].filter(Boolean),
    gaps: [
      openCritical > 0 ? `${openCritical} critical incident${openCritical > 1 ? "s" : ""} still open` : "",
      below(rhiRate, 80) ? `Return home interview completion rate is ${rhiRate}% (below 80%)` : "",
    ].filter(Boolean),
  };

  // ── Section 3: Quality of care ─────────────────────────────────────────
  // No incidents means no debriefs were due.
  const debriefRate = rate(
    debriefs.filter((d: any) => d.linked_incident_id).length,
    incidents.length
  );
  const latestReg44 = reg44.sort((a: any, b: any) =>
    (b.visit_date ?? "").localeCompare(a.visit_date ?? "")
  )[0];
  const reg44Age = latestReg44?.visit_date ? daysBetween(today, latestReg44.visit_date) : 999;
  const s3 = [
    reg44.length > 0 && reg44Age <= 28,
    latestReg44?.overall_judgement === "good" || latestReg44?.overall_judgement === "outstanding",
    incidents.length > 0 ? meets(debriefRate, 60) : null,
  ];
  const section3: EvidenceSection = {
    id: "quality_of_care",
    title: "Quality of care",
    regulatoryRef: "CHR 2015 Reg 44, 45; Ofsted SCCIF",
    signal: sig(s3),
    keyFindings: [
      latestReg44 ? `Most recent Reg 44: ${latestReg44.visit_date} — ${latestReg44.overall_judgement ?? "no judgement"}` : "No Reg 44 visits recorded",
      `Post-incident debrief completion: ${formatRate(debriefRate, "no incidents to debrief")}`,
    ],
    evidenceStrengths: [
      reg44Age <= 28 ? "Reg 44 visits are within the statutory 28-day requirement" : "",
      latestReg44?.overall_judgement === "good" ? "Most recent Reg 44 judgement is good" : "",
      meets(debriefRate, 80) ? "Strong post-incident debrief completion rate" : "",
    ].filter(Boolean),
    gaps: [
      reg44Age > 28 ? `Reg 44 visit is overdue (${reg44Age < 999 ? `${reg44Age} days` : "no visits on record"})` : "",
      below(debriefRate, 60) ? `Post-incident debrief rate is low (${debriefRate}%)` : "",
    ].filter(Boolean),
  };

  // ── Section 4: Leadership, management and governance ──────────────────
  const supCoverage = rate(
    new Set(
      reflectiveSupervisions
        .filter((s: any) => (s.date ?? "") >= ninetyAgo)
        .map((s: any) => s.staff_id)
    ).size,
    activeStaff.length
  );
  const mandatory = trainingRecords.filter((t: any) => t.is_mandatory === true);
  const compliant = mandatory.filter(
    (t: any) => t.status === "completed" && (!t.expiry_date || t.expiry_date >= today)
  );
  // An empty mandatory training register is nothing recorded, not full compliance.
  const trainingRate = rateOf(compliant, mandatory);
  const s4 = [
    activeStaff.length > 0 ? meets(supCoverage, 80) : null,
    mandatory.length > 0 ? meets(trainingRate, 80) : null,
    activeStaff.length > 0,
  ];
  const section4: EvidenceSection = {
    id: "leadership",
    title: "Leadership, management and governance",
    regulatoryRef: "CHR 2015 Reg 32, 33, 34, 44; Ofsted SCCIF",
    signal: sig(s4),
    keyFindings: [
      `Supervision coverage (90 days): ${formatRate(supCoverage, "no active staff on record")}`,
      `Mandatory training compliance: ${formatRate(trainingRate, "no mandatory training recorded")}`,
      `Active workforce: ${activeStaff.length} staff`,
    ],
    evidenceStrengths: [
      meets(supCoverage, 80) ? `${supCoverage}% of staff have had supervision in the last 90 days` : "",
      meets(trainingRate, 100) ? "Full mandatory training compliance across the workforce" : "",
    ].filter(Boolean),
    gaps: [
      below(supCoverage, 80) ? `Only ${supCoverage}% of staff have had supervision in the last 90 days` : "",
      trainingRate === null && activeStaff.length > 0
        ? "No mandatory training records — compliance cannot be evidenced for inspection"
        : "",
      below(trainingRate, 80) ? `Mandatory training compliance is ${trainingRate}% — below 80%` : "",
    ].filter(Boolean),
  };

  // ── Section 5: Children's wishes and feelings ─────────────────────────
  const wishesFeelings = keyWorkingSessions.filter(
    (k: any) => k.child_voice && String(k.child_voice).trim().length > 20
  ).length;
  const childrenWithVoice = new Set(
    keyWorkingSessions
      .filter((k: any) => k.child_voice && String(k.child_voice).trim().length > 20)
      .map((k: any) => k.child_id)
  ).size;
  // Coverage of children's voice is meaningless with no children resident.
  const s5 = [
    wishesFeelings > 0,
    activeChildren.length > 0 ? childrenWithVoice >= Math.ceil(activeChildren.length * 0.5) : null,
    activeChildren.length > 0 ? childrenWithVoice >= activeChildren.length : null,
  ];
  const section5: EvidenceSection = {
    id: "wishes_feelings",
    title: "Children's wishes and feelings",
    regulatoryRef: "CHR 2015 Reg 7; UN CRC Article 12; Ofsted SCCIF",
    signal: sig(s5),
    keyFindings: [
      `${wishesFeelings} sessions with wishes and feelings recorded`,
      `${childrenWithVoice} of ${activeChildren.length} children have voice in records`,
    ],
    evidenceStrengths: [
      childrenWithVoice === activeChildren.length && activeChildren.length > 0
        ? "All children have wishes and feelings recorded in key work"
        : "",
      wishesFeelings > 5 ? "Regular recording of children's perspective" : "",
    ].filter(Boolean),
    gaps: [
      childrenWithVoice < activeChildren.length
        ? `${activeChildren.length - childrenWithVoice} children do not have wishes and feelings recorded`
        : "",
      wishesFeelings === 0 ? "No wishes and feelings recorded — Ofsted will ask children directly" : "",
    ].filter(Boolean),
  };

  const sections = [section1, section2, section3, section4, section5];
  const greenSections = sections.filter((s) => s.signal === "green").length;
  const amberSections = sections.filter((s) => s.signal === "amber").length;
  const redSections = sections.filter((s) => s.signal === "red").length;

  const measuredSections = greenSections + amberSections + redSections;

  const overallReadiness: SignalColour =
    measuredSections === 0
      ? "grey"
      : redSections >= 2
      ? "red"
      : redSections > 0 || amberSections >= 3
      ? "amber"
      : "green";
  const readinessLabel =
    overallReadiness === "grey"
      ? "Not yet measured — no records to evidence readiness"
      : overallReadiness === "green"
      ? "Good evidence base — continue building"
      : overallReadiness === "amber"
      ? "Some gaps identified — action needed before inspection"
      : "Significant gaps — prioritise immediately";

  const priorityActions = sections
    .filter((s) => s.signal !== "green")
    .flatMap((s) => s.gaps)
    .filter(Boolean)
    .slice(0, 8);

  const result: InspectionEvidenceAnalysis = {
    overallReadiness,
    readinessLabel,
    greenSections,
    amberSections,
    redSections,
    sections,
    priorityActions,
    regulatoryNote:
      "This tool provides a snapshot of inspection readiness based on current records. It does not replace the Registered Manager's own self-evaluation or Reg 44 / Reg 45 processes. Ofsted inspections are evidence-based — every finding in this tool should be traceable to records.",
  };

  return NextResponse.json({ data: result });
}
