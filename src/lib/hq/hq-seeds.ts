// ══════════════════════════════════════════════════════════════════════════════
// CARA HQ — demo seeds
//
// One customer (this deployment's own organisation) plus a light spread of
// recent usage events, so the HQ cockpit shows its real shape in demo mode
// without inventing fictional customers. AI usage and break-glass start EMPTY
// on purpose: AI rows appear organically via the provider-seam meter, and an
// empty break-glass ledger is the honest healthy state.
// ══════════════════════════════════════════════════════════════════════════════

import type { HqOrganisation, HqUsageEvent } from "./hq-types";

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
