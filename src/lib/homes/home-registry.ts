// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME REGISTRY
//
// Central registry of all children's homes in the organisation.
// Provides lookup helpers and a module-level "current home" variable
// so server-side code can scope queries without React context.
//
// TO CONNECT SUPABASE: replace the HOMES array with a Supabase query.
// ══════════════════════════════════════════════════════════════════════════════

export interface CornerstoneHome {
  id: string;
  name: string;
  ofsted_urn: string;
  address: string;
  postcode: string;
  phone: string;
  email: string;
  registered_manager: string;
  responsible_individual: string;
  capacity: number;
  current_occupancy: number;
  registration_date: string;
  last_inspection_date: string | null;
  last_inspection_rating:
    | "outstanding"
    | "good"
    | "adequate"
    | "inadequate"
    | null;
  status: "active" | "suspended" | "closed";
  home_type: "children_home" | "short_breaks" | "secure" | "semi_independent";
}

// ── Demo homes ───────────────────────────────────────────────────────────────

export const HOMES: CornerstoneHome[] = [
  {
    id: "home_oak",
    name: "Oak House",
    ofsted_urn: "SC480123",
    address: "12 Oakfield Road, Salford",
    postcode: "M6 8QP",
    phone: "0161 234 5678",
    email: "manager@oakhouse.cornerstone.care",
    registered_manager: "Darren Laville",
    responsible_individual: "James Whitfield",
    capacity: 4,
    current_occupancy: 3,
    registration_date: "2019-03-15",
    last_inspection_date: "2024-11-20",
    last_inspection_rating: "outstanding",
    status: "active",
    home_type: "children_home",
  },
  {
    id: "home_willow",
    name: "Willow Lodge",
    ofsted_urn: "SC480456",
    address: "7 Willow Lane, Eccles",
    postcode: "M30 0GN",
    phone: "0161 789 0123",
    email: "manager@willowlodge.cornerstone.care",
    registered_manager: "Sarah Thornton",
    responsible_individual: "James Whitfield",
    capacity: 3,
    current_occupancy: 3,
    registration_date: "2021-06-01",
    last_inspection_date: "2025-02-14",
    last_inspection_rating: "good",
    status: "active",
    home_type: "children_home",
  },
  {
    id: "home_cedar",
    name: "Cedar Court",
    ofsted_urn: "SC480789",
    address: "34 Cedar Avenue, Worsley",
    postcode: "M28 3JH",
    phone: "0161 456 7890",
    email: "manager@cedarcourt.cornerstone.care",
    registered_manager: "Tom Hennessey",
    responsible_individual: "James Whitfield",
    capacity: 6,
    current_occupancy: 4,
    registration_date: "2022-01-10",
    last_inspection_date: "2024-08-05",
    last_inspection_rating: "adequate",
    status: "active",
    home_type: "children_home",
  },
];

// ── Module-level current home ────────────────────────────────────────────────

let _currentHomeId = "home_oak";

export function getHomeById(id: string): CornerstoneHome | undefined {
  return HOMES.find((h) => h.id === id);
}

export function getActiveHomes(): CornerstoneHome[] {
  return HOMES.filter((h) => h.status === "active");
}

export function getCurrentHome(): CornerstoneHome {
  return getHomeById(_currentHomeId) ?? HOMES[0];
}

export function setCurrentHome(id: string): void {
  const home = getHomeById(id);
  if (!home) throw new Error(`Home not found: ${id}`);
  _currentHomeId = id;
}
