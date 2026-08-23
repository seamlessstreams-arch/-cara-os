// Integration test: runs the Integration Hub against the REAL demo store.
//
// The Integration Hub is a SCAFFOLD — the demo store does not (yet) carry a live
// integrations registry, so the route renders the static DEFAULT_ADAPTERS. This
// test mirrors that: it imports the store (the same dependency the route uses),
// maps any optional `store.integrations` defensively, falls back to the default
// registry when absent, and asserts the engine produces sensible output either way.
import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import {
  computeIntegrationHub,
  DEFAULT_ADAPTERS,
  type IntegrationAdapter,
  type AdapterKind,
  type AdapterStatus,
} from "../integration-hub-engine";

const d = (v: unknown): string | null => (v == null ? null : v.toString());

describe("integration-hub integration (real store)", () => {
  const store = getStore() as any;

  // Defensive mapping — identical strategy to the API route. The store has no
  // integrations field today, so this resolves to the default scaffold registry.
  const mapped: IntegrationAdapter[] = ((store.integrations ?? []) as any[]).map((x) => ({
    id: x.id,
    name: x.name ?? x.id,
    kind: (x.kind ?? "external_forms") as AdapterKind,
    status: (x.status ?? "not_configured") as AdapterStatus,
    last_sync: d(x.last_sync),
    supports_idempotency: x.supports_idempotency ?? true,
    retry: {
      max_attempts: x.retry?.max_attempts ?? 3,
      backoff_seconds: x.retry?.backoff_seconds ?? 30,
    },
    error_log: (x.error_log ?? []) as { at: string; message: string }[],
    sync_status: x.sync_status ?? "Not configured",
    manual_override: x.manual_override ?? false,
  }));

  const adapters = mapped.length > 0 ? mapped : DEFAULT_ADAPTERS;
  const result = computeIntegrationHub({ adapters });

  it("produces a view for every adapter in the resolved registry", () => {
    expect(result.adapters.length).toBe(adapters.length);
    expect(result.overview.total_adapters).toBe(adapters.length);
  });

  it("covers all 8 integration kinds in the demo scaffold", () => {
    const kinds = new Set(result.adapters.map((a) => a.kind));
    expect(kinds.size).toBe(8);
  });

  it("the overview counts reconcile with the adapter list", () => {
    const { overview, adapters: views } = result;
    expect(overview.connected).toBe(views.filter((a) => a.status === "connected").length);
    expect(overview.not_configured).toBe(views.filter((a) => a.status === "not_configured").length);
    expect(overview.errors).toBe(views.filter((a) => a.status === "error").length);
    expect(overview.connected + overview.not_configured).toBeLessThanOrEqual(overview.total_adapters);
  });

  it("flags key adapters that are not configured and explains the automation", () => {
    expect(result.alerts.length).toBeGreaterThan(0);
    // The scaffold leaves payroll / hr_training / la_reporting not configured.
    expect(result.alerts.some((a) => /not configured/i.test(a.message))).toBe(true);
  });

  it("always communicates the security/retry/idempotency/audit/override contract", () => {
    const guarantee = result.insights.find(
      (i) =>
        /idempotency/i.test(i.text) &&
        /retry/i.test(i.text) &&
        /audit trail/i.test(i.text) &&
        /manual override/i.test(i.text) &&
        /credential/i.test(i.text),
    );
    expect(guarantee).toBeTruthy();
  });

  it("produces a bounded, sensible health score", () => {
    expect(result.overview.health_score).toBeGreaterThanOrEqual(0);
    expect(result.overview.health_score).toBeLessThanOrEqual(100);
  });
});
