import { NextResponse } from "next/server";
import { dal } from "@/lib/db";

export async function GET() {
  try {
    const [welfareCheckRoundsList, welfareChecksList, youngPeopleList] = await Promise.all([
      dal.welfareCheckRounds.findAll(),
      dal.welfareChecks.findAll(),
      dal.youngPeople.findAll(),
    ]);
    const today = new Date().toISOString().split("T")[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenStr = sevenDaysAgo.toISOString().split("T")[0];

    const youngPeople = (youngPeopleList as any[]) ?? [];
    const welfareRounds = (welfareCheckRoundsList as any[]) ?? [];
    const welfareChecks = (welfareChecksList as any[]) ?? [];

    const activeYP = youngPeople.filter((yp) => yp.status === "current");
    const recentRounds = welfareRounds.filter((r) => (r.round_date as string) >= sevenStr);
    const recentChecks = welfareChecks.filter((c) => (c.check_date as string) >= sevenStr);

    const totalRounds = recentRounds.length;
    const totalChecks = recentChecks.length;

    // Building security compliance
    const roundsWithBuildingSecure = recentRounds.filter((r) => r.building_secure === true).length;
    const roundsWithFireClear = recentRounds.filter((r) => r.fire_exits_clear === true).length;
    const buildingSecureRate = totalRounds > 0 ? Math.round((roundsWithBuildingSecure / totalRounds) * 100) : null;

    // Check status breakdown
    const okChecks = recentChecks.filter((c) => c.status === "ok").length;
    const asleepChecks = recentChecks.filter((c) => c.status === "asleep").length;
    const awakeChecks = recentChecks.filter((c) => c.status === "awake").length;
    const concernChecks = recentChecks.filter((c) => c.status === "concern").length;
    const notInRoomChecks = recentChecks.filter((c) => c.status === "not_in_room").length;
    const refusedChecks = recentChecks.filter((c) => c.status === "refused").length;

    // Concern checks — need escalation
    const escalatedConcerns = recentChecks.filter((c) => c.concern_escalated === true).length;
    const unescalatedConcerns = concernChecks - escalatedConcerns;

    // Not-in-room checks — safeguarding indicator
    const physicalMarksNoted = recentChecks.filter((c) => c.physical_marks_noted === true).length;

    // Per-child welfare summary (last 7 days)
    const childProfiles = activeYP.map((yp) => {
      const id = yp.id as string;
      const displayName = (yp.preferred_name ?? yp.first_name) as string;
      const childChecks = recentChecks.filter((c) => c.child_id === id);
      const childConcerns = childChecks.filter((c) => c.status === "concern").length;
      const childNotInRoom = childChecks.filter((c) => c.status === "not_in_room").length;
      const childAwake = childChecks.filter((c) => c.status === "awake").length;

      let signal: "green" | "amber" | "red" | "grey" = "grey";
      if (childChecks.length === 0) signal = "grey";
      else if (childConcerns > 0 && unescalatedConcerns > 0) signal = "red";
      else if (childConcerns > 0 || childNotInRoom > 1) signal = "amber";
      else signal = "green";

      return {
        childId: id,
        childName: displayName,
        totalChecks: childChecks.length,
        okCount: childChecks.filter((c) => c.status === "ok").length,
        asleepCount: childChecks.filter((c) => c.status === "asleep").length,
        awakeCount: childAwake,
        concernCount: childConcerns,
        notInRoomCount: childNotInRoom,
        signal,
      };
    });

    // Overnight coverage check — are rounds happening every 2 hours 22:00–06:00?
    const overnightRounds = recentRounds.filter((r) => {
      const time = (r.round_time as string) ?? "";
      const h = parseInt(time.split(":")[0] ?? "0", 10);
      return h >= 22 || h < 6;
    });
    const expectedOvernightRounds = 7 * 4; // 7 nights × 4 checks (22:00, 00:00, 02:00, 04:00)
    const overnightCoverage = Math.min(100, Math.round((overnightRounds.length / expectedOvernightRounds) * 100));

    // Insights
    const insights: string[] = [];
    if (totalRounds === 0) {
      insights.push("No welfare check rounds recorded in the last 7 days. Regular checks are required by the Children's Homes Regulations — every child should be seen and recorded as safe overnight.");
    }
    if (unescalatedConcerns > 0) {
      insights.push(
        `${unescalatedConcerns} welfare check${unescalatedConcerns === 1 ? "" : "s"} recorded a concern that has not been escalated. Concerns identified during welfare rounds must be acted upon and documented.`
      );
    }
    if (notInRoomChecks > 0) {
      insights.push(
        `${notInRoomChecks} check${notInRoomChecks === 1 ? "" : "s"} found the young person not in their room. Not-in-room findings require follow-up and should be cross-referenced with any missing person protocols.`
      );
    }
    if (physicalMarksNoted > 0) {
      insights.push(
        `Physical marks were noted in ${physicalMarksNoted} welfare check${physicalMarksNoted === 1 ? "" : "s"}. These must be documented fully, logged, and a body map completed where appropriate.`
      );
    }

    let overallSignal: "green" | "amber" | "red" | "grey" = "grey";
    if (totalRounds === 0) overallSignal = "red";
    else if (unescalatedConcerns > 0 || physicalMarksNoted > 0) overallSignal = "red";
    else if (concernChecks > 0 || notInRoomChecks > 0 || overnightCoverage < 80) overallSignal = "amber";
    else overallSignal = "green";

    return NextResponse.json({
      data: {
        totalRounds,
        totalChecks,
        buildingSecureRate,
        overnightCoverage,
        checkStatusBreakdown: {
          ok: okChecks,
          asleep: asleepChecks,
          awake: awakeChecks,
          concern: concernChecks,
          not_in_room: notInRoomChecks,
          refused: refusedChecks,
        },
        concernChecks,
        escalatedConcerns,
        unescalatedConcerns,
        notInRoomChecks,
        physicalMarksNoted,
        childProfiles,
        insights,
        overallSignal,
        regulatoryNote:
          "Children's Homes Regulations 2015, Reg 14. Children must be checked at regular intervals throughout the night. All checks must be recorded. Concerns found during checks must be acted upon and reported.",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to compute welfare check quality data" }, { status: 500 });
  }
}
