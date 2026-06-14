// ══════════════════════════════════════════════════════════════════════════════
// Cara INTELLIGENCE — EARLY-WARNING SIGNALS ENGINE
//
// Analyses operational data to detect patterns that may indicate emerging
// risks, therapeutic opportunities, or safeguarding themes. Generates
// actionable signals for the management team.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export async function generateRiskSignals(input: {
  homeId: string;
  childId?: string;
}) {
  if (!isSupabaseEnabled()) {
    return { created: 0 };
  }

  const sb = createServerClient();
  if (!sb) return { created: 0 };

  const since = new Date();
  since.setDate(since.getDate() - 30);

  let incidentsQuery = (sb.from("incidents") as SB)
    .select("*")
    .eq("home_id", input.homeId)
    .gte("incident_date", since.toISOString());

  if (input.childId) incidentsQuery = incidentsQuery.eq("child_id", input.childId);

  const { data: incidents } = await incidentsQuery;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupedByChild = new Map<string, any[]>();
  for (const incident of incidents ?? []) {
    if (!incident.child_id) continue;
    groupedByChild.set(incident.child_id, [...(groupedByChild.get(incident.child_id) ?? []), incident]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signals: any[] = [];

  for (const [childId, childIncidents] of groupedByChild.entries()) {
    const missing = childIncidents.filter((i: Record<string, unknown>) =>
      `${i.type ?? ""} ${i.summary ?? ""} ${i.description ?? ""}`.toLowerCase().includes("missing")
    );

    const contactLinked = childIncidents.filter((i: Record<string, unknown>) =>
      `${i.summary ?? ""} ${i.description ?? ""}`.toLowerCase().includes("contact")
    );

    if (missing.length >= 2) {
      signals.push({
        home_id: input.homeId,
        child_id: childId,
        signal_type: "safeguarding_theme",
        risk_level: missing.length >= 4 ? "high" : "medium",
        title: "Repeated missing-from-care theme detected",
        summary: `${missing.length} missing-related records have been recorded in the last 30 days.`,
        suggested_action: "Registered Manager to review missing-from-care plan, triggers, return interviews, strategy links and risk assessment.",
        evidence: missing.slice(0, 5).map((i: Record<string, unknown>) => ({ table: "incidents", id: i.id, date: i.incident_date })),
      });
    }

    if (contactLinked.length >= 3) {
      signals.push({
        home_id: input.homeId,
        child_id: childId,
        signal_type: "therapeutic_opportunity",
        risk_level: "medium",
        title: "Possible family-contact trigger pattern",
        summary: `${contactLinked.length} records mention contact within the last 30 days.`,
        suggested_action: "Review emotional preparation before and after contact, key work support, and whether the placement plan captures the pattern.",
        evidence: contactLinked.slice(0, 5).map((i: Record<string, unknown>) => ({ table: "incidents", id: i.id, date: i.incident_date })),
      });
    }
  }

  if (!signals.length) return { created: 0 };

  const { error } = await (sb.from("cara_intelligence_signals") as SB).insert(signals);
  if (error) throw new Error(error.message);

  return { created: signals.length };
}
