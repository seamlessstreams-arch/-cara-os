// Canonical option lists for young-person fields, shared by the admit form
// (young-people/new) and the edit dialog so there is one source of truth for
// legal statuses and placement status — never a second, drifting copy.

import type { YoungPerson } from "@/types";

export const LEGAL_STATUSES = [
  "Section 20 (voluntary accommodation)",
  "Section 31 (care order)",
  "Section 38 (interim care order)",
  "Section 25 (secure accommodation)",
  "Emergency protection order",
  "Remand",
  "Other",
] as const;

export const PLACEMENT_STATUSES: { value: YoungPerson["status"]; label: string }[] = [
  { value: "current", label: "Current" },
  { value: "planned", label: "Planned" },
  { value: "emergency", label: "Emergency placement" },
  { value: "ended", label: "Ended" },
];
