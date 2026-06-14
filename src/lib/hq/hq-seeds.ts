// ══════════════════════════════════════════════════════════════════════════════
// CARA HQ — demo seeds
//
// One customer (this deployment's own organisation) plus a light spread of
// recent usage events, so the HQ cockpit shows its real shape in demo mode
// without inventing fictional customers. AI usage and break-glass start EMPTY
// on purpose: AI rows appear organically via the provider-seam meter, and an
// empty break-glass ledger is the honest healthy state.
// ══════════════════════════════════════════════════════════════════════════════

import type { HqOrganisation, HqUsageEvent, HqApiCallRow, HqDecisionRow } from "./hq-types";

const HOURS = 3600e3;

export function seedHqOrganisations(): HqOrganisation[] {
  const created = new Date(Date.now() - 45 * 24 * HOURS).toISOString();
  return [
    {
      id: "org_chamberlain",
      name: "Chamberlain House (this deployment)",
      plan: "pilot",
      status: "active",
      primary_contact_name: "Olivia Hayes",
      primary_contact_email: "olivia.hayes@chamberlainhouse.example",
      first_home_name: "Chamberlain House",
      created_at: created,
      updated_at: created,
    },
  ];
}

export function seedHqUsageEvents(): HqUsageEvent[] {
  const kinds: { kind: string; user: string; hoursAgo: number }[] = [
    { kind: "sign_in", user: "Olivia Hayes", hoursAgo: 2 },
    { kind: "handover_viewed", user: "Olivia Hayes", hoursAgo: 2 },
    { kind: "record_created", user: "Marcus Bell", hoursAgo: 3 },
    { kind: "record_created", user: "Priya Shah", hoursAgo: 5 },
    { kind: "task_completed", user: "Marcus Bell", hoursAgo: 6 },
    { kind: "sign_in", user: "Marcus Bell", hoursAgo: 9 },
    { kind: "record_created", user: "Olivia Hayes", hoursAgo: 11 },
    { kind: "handover_viewed", user: "Priya Shah", hoursAgo: 14 },
    { kind: "sign_in", user: "Priya Shah", hoursAgo: 15 },
    { kind: "task_completed", user: "Olivia Hayes", hoursAgo: 20 },
    { kind: "record_created", user: "Marcus Bell", hoursAgo: 26 },
    { kind: "sign_in", user: "Olivia Hayes", hoursAgo: 27 },
    { kind: "handover_viewed", user: "Marcus Bell", hoursAgo: 33 },
    { kind: "record_created", user: "Priya Shah", hoursAgo: 38 },
    { kind: "task_completed", user: "Priya Shah", hoursAgo: 44 },
    { kind: "sign_in", user: "Marcus Bell", hoursAgo: 47 },
  ];
  return kinds.map((k, i) => ({
    id: `usage_seed_${i + 1}`,
    at: new Date(Date.now() - k.hoursAgo * HOURS).toISOString(),
    org_id: "org_chamberlain",
    user_label: k.user,
    kind: k.kind,
    meta: {},
  }));
}

// API-call volume — a believable 30-day spread across the main API surface,
// weighted to the last 24h/7d so the cockpit windows read sensibly. ~70% are
// intelligence/decision endpoints (the platform leans on its engines).
export function seedHqApiCalls(): HqApiCallRow[] {
  const features: { feature: string; intelligence: boolean; weight: number }[] = [
    { feature: "daily-log", intelligence: false, weight: 9 },
    { feature: "incidents", intelligence: false, weight: 5 },
    { feature: "tasks", intelligence: false, weight: 7 },
    { feature: "young-people", intelligence: false, weight: 6 },
    { feature: "medications", intelligence: false, weight: 4 },
    { feature: "manager-priority-briefing", intelligence: true, weight: 6 },
    { feature: "home-safeguarding-intelligence", intelligence: true, weight: 5 },
    { feature: "contextual-safeguarding-intelligence", intelligence: true, weight: 4 },
    { feature: "child-360-intelligence", intelligence: true, weight: 5 },
    { feature: "ofsted-readiness-composite", intelligence: true, weight: 4 },
    { feature: "pace", intelligence: true, weight: 3 },
    { feature: "practice-intelligence", intelligence: true, weight: 4 },
  ];
  const rows: HqApiCallRow[] = [];
  let n = 0;
  // Distribute each feature's weight across 30 days, front-loaded to recent days.
  for (const f of features) {
    for (let w = 0; w < f.weight * 6; w++) {
      // Bias toward recent: square the random-ish index via a deterministic ramp.
      const dayBucket = Math.floor((w * w) / (f.weight * 6)); // 0..~(weight*6)
      const hoursAgo = Math.min(30 * 24, dayBucket * 12 + (w % 12));
      rows.push({
        id: `apicall_seed_${++n}`,
        at: new Date(Date.now() - hoursAgo * HOURS).toISOString(),
        org_id: "org_chamberlain",
        feature: f.feature,
        method: f.intelligence ? "GET" : (w % 3 === 0 ? "POST" : "GET"),
        intelligence: f.intelligence,
      });
    }
  }
  return rows;
}

// Decisions — overwhelmingly deterministic (this deployment runs with no AI key,
// so the engines decide). A tiny number of AI rows are included only so the
// split renders; on a no-key deployment this stays at/near 100% deterministic.
export function seedHqDecisions(): HqDecisionRow[] {
  const features = [
    "incident-draft", "recording-assistant", "practice-analysis", "pace-analysis",
    "manager-briefing", "child-360", "safeguarding-screening", "report-narrative",
  ];
  const rows: HqDecisionRow[] = [];
  let n = 0;
  for (let i = 0; i < 120; i++) {
    const hoursAgo = Math.min(30 * 24, Math.floor((i * i) / 120) * 10 + (i % 10));
    rows.push({
      id: `decision_seed_${++n}`,
      at: new Date(Date.now() - hoursAgo * HOURS).toISOString(),
      org_id: "org_chamberlain",
      feature: features[i % features.length],
      mode: "deterministic",
    });
  }
  return rows;
}
