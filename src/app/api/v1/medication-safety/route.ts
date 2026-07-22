import { NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";

const NON_COMPLIANT = new Set(["refused", "withheld", "missed"]);
const CONCERN_STATUSES = new Set(["refused", "missed", "withheld", "late"]);

// Read a dal collection defensively: a transient query failure degrades to an
// empty list rather than 500-ing the whole route.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyStr = thirtyDaysAgo.toISOString().split("T")[0];

    const [youngPeople, medications, administrations] = await Promise.all([
      safeList(dal.youngPeople.findAll()),
      safeList(dal.medications.findAll()),
      safeList(dal.medicationAdministrations.findAll()),
    ]);

    const activeYP = youngPeople.filter((yp) => yp.status === "current");

    // Consider only dosed records (exclude "scheduled" future entries)
    const dosedRecords = administrations.filter((a) => a.status !== "scheduled");
    const recentRecords = dosedRecords.filter((a) => {
      const dt = (a.scheduled_time as string)?.split("T")[0] ?? "";
      return dt >= thirtyStr;
    });

    const totalDoses = recentRecords.length;
    const givenDoses = recentRecords.filter((a) => a.status === "given" || a.status === "self_administered").length;
    const lateDoses = recentRecords.filter((a) => a.status === "late").length;
    const refusedDoses = recentRecords.filter((a) => a.status === "refused").length;
    const missedDoses = recentRecords.filter((a) => a.status === "missed").length;
    const withheldDoses = recentRecords.filter((a) => a.status === "withheld").length;
    const complianceRate = totalDoses > 0 ? Math.round((givenDoses / totalDoses) * 100) : 100;

    // Check witness coverage (every administered dose should have a witness)
    const administeredWithoutWitness = recentRecords.filter(
      (a) => (a.status === "given" || a.status === "self_administered") && !a.witnessed_by
    ).length;

    // Per-child medication profile
    const childProfiles = activeYP.map((yp) => {
      const id = yp.id as string;
      const displayName = (yp.preferred_name ?? yp.first_name) as string;
      const childMeds = medications.filter((m) => m.child_id === id && m.is_active !== false);
      const childRecords = recentRecords.filter((a) => a.child_id === id);
      const childGiven = childRecords.filter((a) => a.status === "given" || a.status === "self_administered").length;
      const childLate = childRecords.filter((a) => a.status === "late").length;
      const childRefused = childRecords.filter((a) => a.status === "refused").length;
      const childMissed = childRecords.filter((a) => a.status === "missed").length;
      const childRate = childRecords.length > 0 ? Math.round((childGiven / childRecords.length) * 100) : null;

      const concerns: string[] = [];
      if (childRefused > 0) concerns.push(`${childRefused} dose${childRefused === 1 ? "" : "s"} refused`);
      if (childMissed > 0) concerns.push(`${childMissed} dose${childMissed === 1 ? "" : "s"} missed`);
      if (childLate > 1) concerns.push(`${childLate} doses administered late`);

      // Recent concerns (last record with a concern status)
      const recentConcern = childRecords
        .filter((a) => CONCERN_STATUSES.has(a.status as string))
        .sort((a, b) => ((b.scheduled_time as string) ?? "").localeCompare((a.scheduled_time as string) ?? ""))[0] ?? null;

      let signal: "green" | "amber" | "red" | "grey" = "grey";
      if (childRecords.length === 0 && childMeds.length === 0) signal = "grey";
      else if (childMissed > 0 || childRefused > 1) signal = "red";
      else if (childRefused > 0 || childLate > 1) signal = "amber";
      else signal = "green";

      return {
        childId: id,
        childName: displayName,
        activeMedications: childMeds.length,
        totalDoses: childRecords.length,
        givenDoses: childGiven,
        lateDoses: childLate,
        refusedDoses: childRefused,
        missedDoses: childMissed,
        complianceRate: childRate,
        concerns,
        recentConcernStatus: recentConcern ? (recentConcern.status as string) : null,
        recentConcernDate: recentConcern ? ((recentConcern.scheduled_time as string)?.split("T")[0] ?? null) : null,
        recentConcernNotes: recentConcern ? (recentConcern.notes as string | null) : null,
        signal,
      };
    }).filter((p) => p.activeMedications > 0 || p.totalDoses > 0);

    // Insights
    const insights: string[] = [];
    if (refusedDoses > 0) {
      insights.push(
        `${refusedDoses} medication refusal${refusedDoses === 1 ? "" : "s"} in the past 30 days. Each refusal should be documented in the young person's daily log and the prescribing clinician informed if refusals are persistent.`
      );
    }
    if (administeredWithoutWitness > 0) {
      insights.push(
        `${administeredWithoutWitness} administered dose${administeredWithoutWitness === 1 ? "" : "s"} have no witness recorded. Safe medication practice requires a witness for all administered doses.`
      );
    }
    if (lateDoses > 0 && refusedDoses === 0) {
      insights.push(
        `${lateDoses} dose${lateDoses === 1 ? "" : "s"} were administered late. Timing of medication can be clinically significant — review shift routines if late administration is recurring.`
      );
    }

    let overallSignal: "green" | "amber" | "red" | "grey" = "grey";
    if (totalDoses === 0) overallSignal = "grey";
    else if (missedDoses > 0 || refusedDoses > 2 || complianceRate < 80) overallSignal = "red";
    else if (refusedDoses > 0 || lateDoses > 2 || complianceRate < 95 || administeredWithoutWitness > 0) overallSignal = "amber";
    else overallSignal = "green";

    return NextResponse.json({
      data: {
        totalDoses,
        givenDoses,
        lateDoses,
        refusedDoses,
        missedDoses,
        withheldDoses,
        complianceRate,
        administeredWithoutWitness,
        childProfiles,
        insights,
        overallSignal,
        regulatoryNote:
          "Children's Homes Regulations 2015, Reg 21 (medication management). Every dose must be administered by a trained staff member, witnessed, and recorded accurately. Missed doses, refusals, and errors must be documented and reported to the prescribing clinician.",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to compute medication safety data" }, { status: 500 });
  }
}
