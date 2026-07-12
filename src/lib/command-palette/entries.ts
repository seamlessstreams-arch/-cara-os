// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMMAND PALETTE ENTRY BUILDER (pure)
//
// Turns the app's existing catalogues into palette entries:
//   • NAV_GROUPS   (~900 pages — the REAL page catalogue; the sidebar shows only
//     the slim DOMAIN_NAV, so most pages are otherwise link-only)
//   • GLOBAL_CREATE_ITEMS (create/record actions)
//   • live children + staff (passed in by the component from its hooks)
// Pure + deterministic: no React, no fetching. Deduped by href (NAV_GROUPS
// repeats destinations across groups); first occurrence wins.
// ══════════════════════════════════════════════════════════════════════════════

import type { NavGroup, CreateMenuItem } from "@/config/navigation";
import type { PaletteEntry } from "./rank";

export interface PalettePerson {
  id: string;
  name: string;
  /** Extra searchable names (first/last/preferred). */
  aliases?: string[];
  hint?: string;
}

export function buildPageEntries(navGroups: readonly NavGroup[]): PaletteEntry[] {
  const out: PaletteEntry[] = [];
  const seen = new Set<string>();
  for (const group of navGroups) {
    for (const child of group.children) {
      if (seen.has(child.href)) continue;
      seen.add(child.href);
      out.push({
        id: `page:${child.href}`,
        label: child.label,
        hint: `${group.label} › ${child.label}`,
        href: child.href,
        kind: "page",
        keywords: [group.label],
        iconKey: child.icon,
        module: child.module,
      });
    }
  }
  return out;
}

export function buildActionEntries(items: readonly CreateMenuItem[]): PaletteEntry[] {
  const out: PaletteEntry[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const key = `${item.label}→${item.href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `action:${key}`,
      label: `New: ${item.label}`,
      hint: `Create › ${item.group}`,
      href: item.href,
      kind: "action",
      keywords: [item.label, item.group, "new", "create", "log", "record", "add"],
      iconKey: item.icon,
      module: item.module,
    });
  }
  return out;
}

export function buildChildEntries(children: readonly PalettePerson[]): PaletteEntry[] {
  return children.map((c) => ({
    id: `child:${c.id}`,
    label: c.name,
    hint: c.hint ?? "Young person — open profile",
    href: `/young-people/${c.id}`,
    kind: "child" as const,
    keywords: c.aliases ?? [],
    iconKey: "Heart",
    module: "young-people",
  }));
}

export function buildStaffEntries(staff: readonly PalettePerson[]): PaletteEntry[] {
  return staff.map((s) => ({
    id: `staff:${s.id}`,
    label: s.name,
    hint: s.hint ?? "Staff — open profile",
    href: `/staff/${s.id}`,
    kind: "staff" as const,
    keywords: s.aliases ?? [],
    iconKey: "Users",
    module: "staff",
  }));
}

export function buildPaletteEntries(input: {
  navGroups: readonly NavGroup[];
  createItems: readonly CreateMenuItem[];
  children: readonly PalettePerson[];
  staff: readonly PalettePerson[];
}): PaletteEntry[] {
  return [
    ...buildChildEntries(input.children),
    ...buildStaffEntries(input.staff),
    ...buildActionEntries(input.createItems),
    ...buildPageEntries(input.navGroups),
  ];
}
