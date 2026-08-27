// ══════════════════════════════════════════════════════════════════════════════
// CARA — PREMISES & SAFETY COMPLIANCE API ROUTE
// GET /api/v1/premises-compliance
//
// "Are all our statutory building-safety checks & certificates in date?" — one
// board (CHR 2015 Reg 31). Consolidates the siloed premises records:
//   • Certificates       — gas (CP12), electrical (EICR), fire risk assessment
//   • Routine checks      — buildingChecks, latest per check type
//   • Drills              — fire/emergency drills, next due
//   • Servicing           — compliance-relevant planned maintenance
//   • No record on file   — statutory checks with an empty collection (honest gap)
//
// Reads the live in-memory store like every other engine route.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { computePremisesCompliance, type ComplianceItemInput } from "@/lib/engines/premises-compliance-engine";
import { todayStr } from "@/lib/utils";

const CAT = {
  cert: "Certificates",
  check: "Routine safety checks",
  drill: "Fire & emergency drills",
  maint: "Servicing & maintenance",
};

function titleCase(s: string): string {
  return String(s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function addYearISO(d: string | null): string | null {
  if (!d) return null;
  const [y, m, day] = String(d).slice(0, 10).split("-").map(Number);
  if (!y) return null;
  return new Date(Date.UTC(y + 1, (m || 1) - 1, day || 1)).toISOString().slice(0, 10);
}

export async function GET() {
  const [buildingsList, buildingChecksList, fireDrillsList, maintenanceList] = await Promise.all([
    dal.buildings.findAll(),
    dal.buildingChecks.findAll(),
    dal.fireDrills.findAll(),
    dal.maintenance.findAll(),
  ]);
  const today = todayStr();
  const items: ComplianceItemInput[] = [];

  // ── 1. Certificates (from the primary building record) ───────────────────────
  const bld = (((buildingsList ?? [])))[0];
  if (bld) {
    items.push({
      key: "cert_gas", label: "Gas Safety Certificate", category: CAT.cert,
      due_date: bld.gas_cert_expiry ?? null, detail: "CP12 · annual", source_href: "/gas-electrical-safety-checks",
    });
    items.push({
      key: "cert_electrical", label: "Electrical Installation (EICR)", category: CAT.cert,
      due_date: bld.electrical_cert_expiry ?? null, detail: "EICR · 5-yearly", source_href: "/gas-electrical-safety-checks",
    });
    items.push({
      key: "cert_fra", label: "Fire Risk Assessment", category: CAT.cert,
      due_date: addYearISO(bld.fire_risk_assessment_date) ?? bld.next_inspection_due ?? null,
      detail: "Annual review", source_href: "/fire-risk-assessment",
    });
  }

  // ── 2. Routine safety checks (buildingChecks — latest per check_type) ────────
  const FIRE_TYPES = new Set(["fire_alarm_test", "emergency_lighting", "fire_door_check"]);
  const byType = new Map<string, any>();
  for (const c of ((buildingChecksList ?? []))) {
    const t = String(c.check_type ?? "check");
    const prev = byType.get(t);
    if (!prev || String(c.check_date ?? "") > String(prev.check_date ?? "")) byType.set(t, c);
  }
  for (const [t, c] of byType) {
    const result = String(c.result ?? "").toLowerCase();
    const status = String(c.status ?? "").toLowerCase();
    const failed = result === "fail" || (!!c.action_required && status !== "completed" && result !== "pass");
    const completed = status === "completed" && result !== "fail";
    items.push({
      key: `check_${t}`,
      label: titleCase(t),
      category: CAT.check,
      due_date: c.due_date ?? c.action_due ?? null,
      completed,
      failed,
      detail: c.notes ? String(c.notes).slice(0, 120) : (c.risk_level ? `${titleCase(String(c.risk_level))} risk` : null),
      source_href: FIRE_TYPES.has(t) ? "/fire-safety-equipment-checks" : "/maintenance",
    });
  }

  // ── 3. Drills (most recent fire drill → its next-due date) ───────────────────
  const drills = (((fireDrillsList ?? []))).slice().sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));
  if (drills.length > 0) {
    const latest = drills[0];
    items.push({
      key: "drill_fire", label: "Fire evacuation drill", category: CAT.drill,
      due_date: latest.next_drill_due ?? null, completed: false,
      detail: latest.date ? `Last drill ${String(latest.date).slice(0, 10)}` : null,
      source_href: "/fire-drills",
    });
  }

  // ── 4. Compliance-relevant planned maintenance ───────────────────────────────
  const MAINT_CATS = new Set(["hvac", "electrical", "security", "gas"]);
  for (const m of ((maintenanceList ?? []))) {
    if (!MAINT_CATS.has(String(m.category ?? "").toLowerCase())) continue;
    const status = String(m.status ?? "").toLowerCase();
    items.push({
      key: `maint_${m.id}`,
      label: m.title ?? "Maintenance task",
      category: CAT.maint,
      due_date: m.due_date ?? null,
      completed: status === "completed" || status === "closed",
      detail: titleCase(String(m.category ?? "")),
      owner: m.assigned_to ?? null,
      source_href: "/maintenance",
    });
  }

  // ── 5. Statutory checks with NO record on file (honest Reg-31 prompts) ───────
  const [waterHygieneRecordsList, fireEquipmentChecksList] = await Promise.all([
    dal.waterHygieneRecords.findAll(),
    dal.fireEquipmentChecks.findAll(),
  ]);
  const isEmpty = (list: unknown) => !Array.isArray(list) || list.length === 0;
  if (isEmpty(waterHygieneRecordsList)) {
    items.push({ key: "water_hygiene", label: "Water hygiene / legionella", category: CAT.check, due_date: null, detail: "No assessment on file", source_href: "/water-hygiene" });
  }
  if (isEmpty(fireEquipmentChecksList)) {
    items.push({ key: "fire_equipment", label: "Fire equipment servicing", category: CAT.check, due_date: null, detail: "No service record on file", source_href: "/fire-safety-equipment-checks" });
  }

  const result = computePremisesCompliance({ today, items });
  return NextResponse.json({ data: result });
}
