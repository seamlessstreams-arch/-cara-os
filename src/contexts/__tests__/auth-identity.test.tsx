// ══════════════════════════════════════════════════════════════════════════════
// AUTH — a live tenant must never be shown as somebody else
//
// AuthProvider resolved the signed-in user as:
//
//     allStaff.find(s => s.id === userId) ?? allStaff[0] ?? null
//
// On a live tenant `userId` was the DEMO id "staff_darren", which matches no
// row in a real home's staff_members — so every signed-in user fell through to
// allStaff[0], the first staff member by surname. Not just a wrong name in the
// sidebar: `currentRole` is derived from that same record and gates 53 places
// in the UI, and the `x-user-id` header carried the demo id into the audit
// trail of the 21 routes that still read it.
//
// Oak House made this concrete. Staff sort Laville, Ugogbo, Wahid; Laville is
// super_admin. So the deputy and the care worker would each have opened the app
// as the Registered Manager. It had not bitten yet only because they had no
// logins — the coincidence that the one user who COULD sign in was also
// allStaff[0]. These tests remove the coincidence.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const live = vi.hoisted(() => ({ value: true }));
vi.mock("@/lib/db/live-mode", () => ({ isLiveTenant: () => live.value }));
vi.mock("@/hooks/use-mounted", () => ({ useMounted: () => true }));
vi.mock("@/hooks/use-client-value", () => ({ useClientValue: () => "" }));
vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));

import { useQuery } from "@tanstack/react-query";
import { AuthProvider, useAuthContext } from "../auth-context";

const STAFF = [
  { id: "7b99286c", first_name: "Darren", last_name: "Laville", full_name: "Darren Laville", role: "super_admin", is_active: true },
  { id: "e76222f5", first_name: "Diane", last_name: "Ugogbo", full_name: "Diane Ugogbo", role: "residential_care_worker", is_active: true },
  { id: "a9a6684f", first_name: "Saira", last_name: "Wahid", full_name: "SAIRA WAHID", role: "deputy_manager", is_active: true },
];

/** Feed the two useQuery calls independently, keyed by their queryKey[0]. */
function wire(opts: { me: string | null; staff?: unknown[]; mePending?: boolean }) {
  (useQuery as unknown as Mock).mockImplementation((args: { queryKey: unknown[] }) => {
    if (args.queryKey[0] === "me") {
      if (opts.mePending) return { data: undefined, isPending: true };
      return { data: opts.me ? { data: { userId: opts.me } } : undefined, isPending: false };
    }
    return { data: { data: opts.staff ?? STAFF }, isPending: false };
  });
}

function Probe() {
  const { currentUser, currentRole, identityUnresolved } = useAuthContext();
  return React.createElement("div", null,
    `name=${currentUser?.full_name ?? "-"};role=${currentRole};unresolved=${identityUnresolved}`);
}
const render = () =>
  renderToStaticMarkup(React.createElement(AuthProvider, null, React.createElement(Probe)));

beforeEach(() => { live.value = true; vi.clearAllMocks(); });

describe("live tenant", () => {
  it("resolves the session's own staff member", () => {
    wire({ me: "a9a6684f" });
    expect(render()).toContain("name=SAIRA WAHID;role=deputy_manager");
  });

  it("THE REGRESSION: the deputy is not shown as the first staff member", () => {
    wire({ me: "a9a6684f" });
    const out = render();
    expect(out).not.toContain("Darren Laville");
    expect(out).not.toContain("role=super_admin");
  });

  it("the care worker keeps the care worker's role", () => {
    wire({ me: "e76222f5" });
    expect(render()).toContain("name=Diane Ugogbo;role=residential_care_worker");
  });

  it("a session naming no staff record resolves to nobody, not to allStaff[0]", () => {
    wire({ me: "staff_darren" }); // the demo id — matches nothing live
    const out = render();
    expect(out).toContain("name=-");
    expect(out).toContain("unresolved=true");
    expect(out).not.toContain("Darren Laville");
  });

  it("an unresolved identity gets the LEAST privileged role", () => {
    wire({ me: null });
    expect(render()).toContain("role=residential_care_worker");
  });

  it("is not flagged unresolved while the session is still loading", () => {
    wire({ me: null, mePending: true });
    expect(render()).toContain("unresolved=false");
  });
});

describe("demo tenant — behaviour unchanged", () => {
  beforeEach(() => { live.value = false; });

  it("still falls back to the first staff member, which is the demo's point", () => {
    wire({ me: null });
    expect(render()).toContain("name=Darren Laville");
  });

  it("never reports an unresolved identity", () => {
    wire({ me: null });
    expect(render()).toContain("unresolved=false");
  });
});
