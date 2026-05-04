import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { processBuildingCheckFail } from "@/lib/db/linked-updates";

export async function GET(_req: NextRequest) {
  const buildings = db.buildings.findAll();
  const allChecks = db.buildingChecks.findAll();
  const dueChecks = db.buildingChecks.findDue();
  const overdueChecks = db.buildingChecks.findOverdue();

  return NextResponse.json({
    data: {
      buildings,
      checks: allChecks.sort((a, b) => b.check_date.localeCompare(a.check_date)),
      due: dueChecks,
      overdue: overdueChecks,
      failed: allChecks.filter((c) => c.result === "fail"),
      summary: {
        total_checks: allChecks.length,
        due: dueChecks.length,
        overdue: overdueChecks.length,
        failed: allChecks.filter((c) => c.result === "fail").length,
        passed: allChecks.filter((c) => c.result === "pass").length,
      },
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const check = db.buildingChecks.create({
    ...body,
    home_id: "home_oak",
  });

  // Trigger linked updates for failures
  if (body.result === "fail" && body.risk_level && body.action_required) {
    processBuildingCheckFail(
      check.id, body.check_type, body.area,
      body.risk_level, body.action_required,
      body.responsible_person || "staff_darren", "home_oak"
    );
  }

  return NextResponse.json({
    data: check,
    linked_updates: body.result === "fail" ? ["task", "notification"] : [],
  }, { status: 201 });
}
