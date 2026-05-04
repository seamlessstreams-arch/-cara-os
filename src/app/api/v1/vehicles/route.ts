import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { processVehicleDefect } from "@/lib/db/linked-updates";
import { todayStr } from "@/lib/utils";

export async function GET(_req: NextRequest) {
  const vehicles = db.vehicles.findAll();
  const allChecks = db.vehicleChecks.findAll();
  const defects = db.vehicleChecks.findDefects();
  const today = todayStr();

  // Compute compliance alerts
  const alerts: string[] = [];
  const inMonth = new Date();
  inMonth.setDate(inMonth.getDate() + 30);
  const inMonthStr = inMonth.toISOString().slice(0, 10);

  vehicles.forEach((v) => {
    if (v.mot_expiry && v.mot_expiry < today) alerts.push(`MOT EXPIRED: ${v.registration}`);
    else if (v.mot_expiry && v.mot_expiry <= inMonthStr) alerts.push(`MOT expiring soon: ${v.registration} (${v.mot_expiry})`);
    if (v.insurance_expiry && v.insurance_expiry < today) alerts.push(`INSURANCE EXPIRED: ${v.registration}`);
    else if (v.insurance_expiry && v.insurance_expiry <= inMonthStr) alerts.push(`Insurance expiring: ${v.registration} (${v.insurance_expiry})`);
    if (v.tax_expiry && v.tax_expiry < today) alerts.push(`TAX EXPIRED: ${v.registration}`);
  });

  return NextResponse.json({
    data: {
      vehicles: vehicles.map((v) => ({
        ...v,
        latest_check: allChecks.filter((c) => c.vehicle_id === v.id).sort((a, b) => b.check_date.localeCompare(a.check_date))[0] || null,
      })),
      checks: allChecks.sort((a, b) => b.check_date.localeCompare(a.check_date)),
      defects,
      alerts,
    },
    meta: {
      total: vehicles.length,
      available: vehicles.filter((v) => v.status === "available").length,
      restricted: vehicles.filter((v) => v.status === "restricted").length,
      defects: defects.length,
      compliance_alerts: alerts.length,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.resource === "check") {
    const check = db.vehicleChecks.create({
      ...body,
      home_id: "home_oak",
    });

    if (body.overall_result === "fail" || body.overall_result === "advisory") {
      const vehicle = db.vehicles.findById(body.vehicle_id);
      processVehicleDefect(
        body.vehicle_id,
        vehicle?.registration || body.vehicle_id,
        body.defects || "Defects identified",
        body.overall_result as "fail" | "advisory",
        body.driver || "staff_darren",
        "home_oak"
      );
    }

    return NextResponse.json({
      data: check,
      linked_updates: body.overall_result !== "pass" ? ["task", "notification"] : [],
    }, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid resource type" }, { status: 400 });
}
