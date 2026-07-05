// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION 44 BUILDING SAFETY CHECKLIST (pure projection)
//
// Projects the building checks Cara already holds (store.buildingChecks) into the
// Reg 44 section-H checklist — Fire safety / Health & safety / Premises condition
// & security — each item showing Y/N/N-A, the last check date and an in-date /
// overdue / not-evidenced status. It does NOT re-assess the premises (the fire-
// safety and premises intelligence engines already do that) — it maps their
// underlying records into the shape the Reg 44 report needs. No store access.
// ══════════════════════════════════════════════════════════════════════════════

export const REG44_BUILDING_SAFETY_VERSION = "1.0.0";

export interface Reg44BuildingCheckInput {
  id: string;
  check_type: string;
  check_date: string;
  due_date: string;
  status: string; // due | completed | overdue | failed | waived
  result: string | null; // pass | fail | advisory | null
  risk_level: string | null;
}

export type ChecklistAnswer = "yes" | "no" | "na" | "not_evidenced";
export type ChecklistStatus = "in_date" | "overdue" | "failed" | "not_evidenced";

export interface Reg44ChecklistItem {
  item: string;
  answer: ChecklistAnswer;
  status: ChecklistStatus;
  lastChecked: string | null;
  dueDate: string | null;
  riskFlag: boolean;
}

export interface Reg44ChecklistCategory {
  name: string;
  items: Reg44ChecklistItem[];
}

export interface Reg44BuildingSafety {
  categories: Reg44ChecklistCategory[];
  summary: { inDate: number; overdue: number; failed: number; notEvidenced: number; highRisk: number };
  /** A ready section-H content string for the report assembly. */
  sectionContent: string;
  engineVersion: string;
}

interface ItemDef {
  item: string;
  types: string[];
}
const CATEGORIES: Array<{ name: string; items: ItemDef[] }> = [
  {
    name: "Fire safety",
    items: [
      { item: "Fire alarm tested and detection serviced", types: ["fire_alarm_test", "smoke_detector"] },
      { item: "Emergency lighting tested and serviced", types: ["emergency_lighting"] },
      { item: "Fire extinguishers / equipment in date", types: ["fire_extinguisher"] },
      { item: "Fire evacuation drills recorded", types: ["fire_drill"] },
      { item: "Carbon monoxide detection in place", types: ["carbon_monoxide_detector"] },
    ],
  },
  {
    name: "Health and safety",
    items: [
      { item: "Gas safety certificate in date", types: ["gas_safety"] },
      { item: "Electrical safety (EICR) / PAT testing in date", types: ["electrical_safety", "pat_testing"] },
      { item: "Legionella / water temperature checks recorded", types: ["legionella", "water_temperature"] },
      { item: "COSHH storage safe", types: ["coshh"] },
      { item: "First aid provision in date", types: ["first_aid_kit"] },
      { item: "Infection control measures in place", types: ["infection_control"] },
    ],
  },
  {
    name: "Premises condition and security",
    items: [
      { item: "Kitchen / food hygiene maintained", types: ["kitchen_safety", "food_hygiene", "fridge_temp", "freezer_temp"] },
      { item: "Window restrictors / safety devices in place", types: ["window_restrictors", "bedroom_door_safety"] },
      { item: "Medication stored securely", types: ["medication_room_security"] },
      { item: "Secure entry / boundary security", types: ["boundary_security", "external_security"] },
      { item: "CCTV proportionate (where applicable)", types: ["cctv"] },
      { item: "Outdoor areas safe", types: ["garden_external"] },
    ],
  },
];

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

export function buildReg44BuildingSafety(checks: Reg44BuildingCheckInput[], asOf: string): Reg44BuildingSafety {
  const byType = new Map<string, Reg44BuildingCheckInput[]>();
  for (const c of checks) {
    const arr = byType.get(c.check_type) ?? [];
    arr.push(c);
    byType.set(c.check_type, arr);
  }

  let inDate = 0, overdue = 0, failed = 0, notEvidenced = 0, highRisk = 0;

  const categories: Reg44ChecklistCategory[] = CATEGORIES.map((cat) => ({
    name: cat.name,
    items: cat.items.map((def) => {
      const relevant = def.types
        .flatMap((t) => byType.get(t) ?? [])
        .sort((a, b) => (a.check_date < b.check_date ? 1 : -1));
      const latest = relevant[0];

      if (!latest) {
        notEvidenced++;
        return { item: def.item, answer: "not_evidenced" as const, status: "not_evidenced" as const, lastChecked: null, dueDate: null, riskFlag: false };
      }

      const risk = latest.risk_level === "high" || latest.risk_level === "critical";
      if (risk) highRisk++;

      if (latest.result === "fail" || latest.status === "failed") {
        failed++;
        return { item: def.item, answer: "no" as const, status: "failed" as const, lastChecked: latest.check_date, dueDate: latest.due_date, riskFlag: true };
      }

      const isOverdue = latest.status === "overdue" || (latest.due_date && daysBetween(latest.due_date, asOf) > 0);
      if (isOverdue) {
        overdue++;
        return { item: def.item, answer: "no" as const, status: "overdue" as const, lastChecked: latest.check_date, dueDate: latest.due_date, riskFlag: risk };
      }

      inDate++;
      return { item: def.item, answer: "yes" as const, status: "in_date" as const, lastChecked: latest.check_date, dueDate: latest.due_date, riskFlag: risk };
    }),
  }));

  const summary = { inDate, overdue, failed, notEvidenced, highRisk };

  const lines: string[] = [];
  for (const cat of categories) {
    lines.push(cat.name + ":");
    for (const it of cat.items) {
      const tag = it.status === "in_date" ? "✓ in date" : it.status === "overdue" ? "OVERDUE" : it.status === "failed" ? "FAILED" : "not evidenced";
      lines.push(`  ${it.item} — ${tag}${it.lastChecked ? ` (last ${it.lastChecked})` : ""}`);
    }
  }
  const headline =
    failed > 0 || overdue > 0
      ? `${failed} failed and ${overdue} overdue building-safety item(s) — the visitor should test these and their action plans.`
      : notEvidenced > 0
        ? `${inDate} item(s) in date; ${notEvidenced} not evidenced in Cara — the visitor should confirm these from the home's records.`
        : `All ${inDate} mapped building-safety items are in date on the records.`;

  return {
    categories,
    summary,
    sectionContent: `${headline}\n\n${lines.join("\n")}`,
    engineVersion: REG44_BUILDING_SAFETY_VERSION,
  };
}

export { REG44_BUILDING_SAFETY_VERSION as _bv };
