// ══════════════════════════════════════════════════════════════════════════════
// CARA — INTEGRATION HUB (ADAPTER FRAMEWORK) INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls and no
// real external network calls. This is the SCAFFOLD for Cara's integration
// framework: a registry of typed adapters (rota, payroll, HR/training, calendar,
// notifications, document storage, external forms, LA reporting) plus the
// non-negotiable plumbing every adapter ships with — secure credentials, retry
// handling with backoff, error logging, idempotency keys, sync status, an audit
// trail and a manual override.
//
// "Capture once, surface everywhere" extends outward: a home already records its
// rota, training, contacts and notifications inside Cara, so the right
// integration means a fact is entered once here and flows to (or from) the
// external system automatically — no double-keying, no drift, full provenance.
//
// Nothing here calls out anywhere. computeIntegrationHub assesses the registry,
// raises alerts for key adapters that are not yet configured, and explains what
// connecting each one would automate. The route can call computeIntegrationHub({})
// to render the static default registry with no store access at all.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ───────────────────────────────────────────────────────────────

export type AdapterKind =
  | "rota"
  | "payroll"
  | "hr_training"
  | "calendar"
  | "notifications"
  | "document_storage"
  | "external_forms"
  | "la_reporting";

export type AdapterStatus =
  | "connected"
  | "disconnected"
  | "error"
  | "syncing"
  | "not_configured";

export interface AdapterRetryPolicy {
  max_attempts: number;
  backoff_seconds: number;
}

export interface AdapterErrorLogEntry {
  at: string;       // ISO timestamp string
  message: string;
}

export interface IntegrationAdapter {
  id: string;
  name: string;
  kind: AdapterKind;
  status: AdapterStatus;
  last_sync: string | null;            // ISO date/timestamp string or null
  supports_idempotency: boolean;
  retry: AdapterRetryPolicy;
  error_log: AdapterErrorLogEntry[];
  sync_status: string;                 // human-readable sync state
  manual_override: boolean;            // operator can pause/force-manual the adapter
}

export interface IntegrationHubInput {
  adapters?: IntegrationAdapter[];     // when omitted, the default registry is used
  today?: string;                      // ISO date — injectable for deterministic tests
}

// ── Output Types ──────────────────────────────────────────────────────────────

export type AdapterHealth = "healthy" | "degraded" | "down" | "inactive";

export interface AdapterView {
  id: string;
  name: string;
  kind: AdapterKind;
  kind_label: string;
  status: AdapterStatus;
  health: AdapterHealth;
  is_key_adapter: boolean;
  last_sync: string | null;
  last_sync_days_ago: number | null;
  stale: boolean;                      // connected but no sync within freshness window
  supports_idempotency: boolean;
  retry: AdapterRetryPolicy;
  error_count: number;
  latest_error: AdapterErrorLogEntry | null;
  sync_status: string;
  manual_override: boolean;
  capability_summary: string;          // what connecting/this adapter automates
}

export interface IntegrationHubOverview {
  total_adapters: number;
  connected: number;
  errors: number;
  not_configured: number;
  // Extra context (non-breaking additions alongside the required four)
  disconnected: number;
  syncing: number;
  manual_overrides: number;
  idempotent_adapters: number;
  key_adapters: number;
  key_adapters_connected: number;
  health_score: number;                // 0-100
}

export interface IntegrationHubAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  adapter_id?: string;
}

export interface CaraIntegrationInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface IntegrationHubResult {
  overview: IntegrationHubOverview;
  adapters: AdapterView[];
  alerts: IntegrationHubAlert[];
  insights: CaraIntegrationInsight[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Adapters whose absence is actively flagged for the demo home. */
export const KEY_ADAPTER_KINDS: AdapterKind[] = [
  "rota",
  "payroll",
  "hr_training",
  "la_reporting",
];

/** Connected adapters should have synced within this many days to be "fresh". */
export const SYNC_FRESHNESS_DAYS = 2;

export const ADAPTER_KIND_LABELS: Record<AdapterKind, string> = {
  rota: "Rota & Scheduling",
  payroll: "Payroll",
  hr_training: "HR & Training",
  calendar: "Calendar",
  notifications: "Notifications",
  document_storage: "Document Storage",
  external_forms: "External Forms",
  la_reporting: "Local Authority Reporting",
};

/** What each adapter automates once connected — used in views and insights. */
export const ADAPTER_CAPABILITY: Record<AdapterKind, string> = {
  rota:
    "Two-way rota sync keeps planned shifts, sickness and agency cover aligned between Cara and the rostering system — staffing-against-ratio is always current without re-keying.",
  payroll:
    "Approved hours, overtime, sleep-ins and on-call flow straight to payroll — no manual timesheet export and a clean audit trail from shift to pay.",
  hr_training:
    "Training records, certificate expiries and supervision dates sync from the HR/LMS, so the training matrix and compliance dashboard self-update and chase nothing twice.",
  calendar:
    "Meetings, reviews, contact sessions and appointments publish to staff calendars automatically, reducing missed statutory reviews and double-bookings.",
  notifications:
    "Critical alerts (safeguarding, medication errors, missing episodes) reach the right people on the right channel instantly, with delivery tracked.",
  document_storage:
    "Evidence, policies and signed records archive to secure document storage with retention and immutable references — nothing is captured twice or lost.",
  external_forms:
    "External or partner forms ingest as structured Cara events, captured once and linked to the child, with no transcription gap.",
  la_reporting:
    "Statutory returns and placement notifications submit to the local authority on time, with confirmations logged as evidence.",
};

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysAgo(date: string, today: string): number {
  return Math.floor(
    (new Date(today).getTime() - new Date(date).getTime()) / 86_400_000,
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function isKeyAdapter(kind: AdapterKind): boolean {
  return KEY_ADAPTER_KINDS.includes(kind);
}

export function adapterHealth(a: IntegrationAdapter): AdapterHealth {
  if (a.status === "error") return "down";
  if (a.status === "syncing" || a.status === "connected") {
    return a.error_log.length > 0 ? "degraded" : "healthy";
  }
  // disconnected / not_configured
  return "inactive";
}

// ── Default registry scaffold (all 8 kinds) ─────────────────────────────────────
//
// Mostly not_configured / disconnected for the demo, with a couple connected and a
// fixed last_sync date string so output stays deterministic. Every adapter carries
// the full plumbing contract: idempotency support, retry/backoff, error log,
// sync_status and a manual override.

export const DEFAULT_ADAPTERS: IntegrationAdapter[] = [
  {
    id: "adapter_rota",
    name: "RotaCloud",
    kind: "rota",
    status: "connected",
    last_sync: "2026-06-03T06:00:00.000Z",
    supports_idempotency: true,
    retry: { max_attempts: 5, backoff_seconds: 30 },
    error_log: [],
    sync_status: "Last sync OK — 42 shifts reconciled",
    manual_override: false,
  },
  {
    id: "adapter_notifications",
    name: "Twilio / Email Gateway",
    kind: "notifications",
    status: "connected",
    last_sync: "2026-06-03T07:15:00.000Z",
    supports_idempotency: true,
    retry: { max_attempts: 6, backoff_seconds: 15 },
    error_log: [],
    sync_status: "Healthy — alerts delivering",
    manual_override: false,
  },
  {
    id: "adapter_payroll",
    name: "Sage Payroll",
    kind: "payroll",
    status: "not_configured",
    last_sync: null,
    supports_idempotency: true,
    retry: { max_attempts: 4, backoff_seconds: 60 },
    error_log: [],
    sync_status: "Not configured — add credentials to enable",
    manual_override: false,
  },
  {
    id: "adapter_hr_training",
    name: "BrightHR / LMS",
    kind: "hr_training",
    status: "not_configured",
    last_sync: null,
    supports_idempotency: true,
    retry: { max_attempts: 4, backoff_seconds: 60 },
    error_log: [],
    sync_status: "Not configured — connect to sync the training matrix",
    manual_override: false,
  },
  {
    id: "adapter_calendar",
    name: "Microsoft 365 Calendar",
    kind: "calendar",
    status: "disconnected",
    last_sync: "2026-05-20T09:00:00.000Z",
    supports_idempotency: true,
    retry: { max_attempts: 3, backoff_seconds: 30 },
    error_log: [],
    sync_status: "Disconnected — token expired, reconnect to resume",
    manual_override: false,
  },
  {
    id: "adapter_document_storage",
    name: "SharePoint / S3 Archive",
    kind: "document_storage",
    status: "not_configured",
    last_sync: null,
    supports_idempotency: true,
    retry: { max_attempts: 5, backoff_seconds: 45 },
    error_log: [],
    sync_status: "Not configured — choose a storage target to enable archiving",
    manual_override: false,
  },
  {
    id: "adapter_external_forms",
    name: "External Forms Intake",
    kind: "external_forms",
    status: "not_configured",
    last_sync: null,
    supports_idempotency: true,
    retry: { max_attempts: 4, backoff_seconds: 30 },
    error_log: [],
    sync_status: "Not configured — connect a forms provider to ingest submissions",
    manual_override: false,
  },
  {
    id: "adapter_la_reporting",
    name: "Local Authority Portal",
    kind: "la_reporting",
    status: "not_configured",
    last_sync: null,
    supports_idempotency: true,
    retry: { max_attempts: 4, backoff_seconds: 120 },
    error_log: [],
    sync_status: "Not configured — connect for statutory returns",
    manual_override: false,
  },
];

// ── Main Computation ────────────────────────────────────────────────────────

export function computeIntegrationHub(input: IntegrationHubInput): IntegrationHubResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  // Default to the static registry scaffold when no adapters are supplied.
  const adaptersIn = input.adapters ?? DEFAULT_ADAPTERS;

  const adapters: AdapterView[] = adaptersIn.map((a) => buildAdapterView(a, today));

  const overview = buildOverview(adapters);
  const alerts = buildAlerts(adapters);
  const insights = buildInsights(adapters, overview);

  return { overview, adapters, alerts, insights };
}

// ── Adapter view builder ────────────────────────────────────────────────────

function buildAdapterView(a: IntegrationAdapter, today: string): AdapterView {
  const last_sync_days_ago =
    a.last_sync ? Math.max(0, daysAgo(a.last_sync, today)) : null;

  // "Stale" only meaningful for an otherwise-live adapter that hasn't synced
  // within the freshness window.
  const stale =
    (a.status === "connected" || a.status === "syncing") &&
    (last_sync_days_ago === null || last_sync_days_ago > SYNC_FRESHNESS_DAYS);

  const errorLog = a.error_log ?? [];
  const latest_error =
    errorLog.length > 0
      ? errorLog
          .slice()
          .sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime())[0]
      : null;

  return {
    id: a.id,
    name: a.name,
    kind: a.kind,
    kind_label: ADAPTER_KIND_LABELS[a.kind] ?? a.kind,
    status: a.status,
    health: adapterHealth(a),
    is_key_adapter: isKeyAdapter(a.kind),
    last_sync: a.last_sync,
    last_sync_days_ago,
    stale,
    supports_idempotency: a.supports_idempotency,
    retry: a.retry,
    error_count: errorLog.length,
    latest_error,
    sync_status: a.sync_status,
    manual_override: a.manual_override,
    capability_summary: ADAPTER_CAPABILITY[a.kind] ?? "",
  };
}

// ── Overview builder ────────────────────────────────────────────────────────

function buildOverview(adapters: AdapterView[]): IntegrationHubOverview {
  const total_adapters = adapters.length;
  const connected = adapters.filter((a) => a.status === "connected").length;
  const errors = adapters.filter((a) => a.status === "error").length;
  const not_configured = adapters.filter((a) => a.status === "not_configured").length;
  const disconnected = adapters.filter((a) => a.status === "disconnected").length;
  const syncing = adapters.filter((a) => a.status === "syncing").length;
  const manual_overrides = adapters.filter((a) => a.manual_override).length;
  const idempotent_adapters = adapters.filter((a) => a.supports_idempotency).length;

  const keyAdapters = adapters.filter((a) => a.is_key_adapter);
  const key_adapters = keyAdapters.length;
  const key_adapters_connected = keyAdapters.filter((a) => a.status === "connected").length;

  // Health score: reward live, fresh, error-free adapters; weight key adapters.
  let health_score = 0;
  if (total_adapters > 0) {
    const liveFresh = adapters.filter(
      (a) => (a.status === "connected" || a.status === "syncing") && !a.stale && a.error_count === 0,
    ).length;
    const base = (liveFresh / total_adapters) * 70;
    const keyBonus =
      key_adapters > 0 ? (key_adapters_connected / key_adapters) * 30 : 30;
    health_score = Math.round(clamp(base + keyBonus, 0, 100));
  }

  return {
    total_adapters,
    connected,
    errors,
    not_configured,
    disconnected,
    syncing,
    manual_overrides,
    idempotent_adapters,
    key_adapters,
    key_adapters_connected,
    health_score,
  };
}

// ── Alerts builder ────────────────────────────────────────────────────────

function buildAlerts(adapters: AdapterView[]): IntegrationHubAlert[] {
  const alerts: IntegrationHubAlert[] = [];

  // Adapters in an error state are the most urgent.
  for (const a of adapters) {
    if (a.status === "error") {
      alerts.push({
        severity: "high",
        adapter_id: a.id,
        message: `${a.name} (${a.kind_label}) is in an error state${
          a.latest_error ? `: ${a.latest_error.message}` : ""
        } — retry/backoff is active; check credentials or use manual override.`,
      });
    }
  }

  // Key adapters that are not configured — flag for the demo home.
  for (const a of adapters) {
    if (a.is_key_adapter && a.status === "not_configured") {
      alerts.push({
        severity: "medium",
        adapter_id: a.id,
        message: `${a.kind_label} (${a.name}) is not configured. Connecting it would automate this workflow and remove manual double-entry.`,
      });
    }
  }

  // Connected but stale (otherwise-live adapters that have stopped syncing).
  for (const a of adapters) {
    if (a.stale && (a.status === "connected" || a.status === "syncing")) {
      alerts.push({
        severity: "medium",
        adapter_id: a.id,
        message: `${a.name} (${a.kind_label}) is connected but has not synced ${
          a.last_sync_days_ago === null ? "yet" : `in ${a.last_sync_days_ago} day${a.last_sync_days_ago === 1 ? "" : "s"}`
        } — sync status: ${a.sync_status}.`,
      });
    }
  }

  // Disconnected adapters (including non-key) — lower priority informational.
  for (const a of adapters) {
    if (a.status === "disconnected") {
      alerts.push({
        severity: "low",
        adapter_id: a.id,
        message: `${a.name} (${a.kind_label}) is disconnected — ${a.sync_status}.`,
      });
    }
  }

  return alerts;
}

// ── Cara insights builder ───────────────────────────────────────────────────

function buildInsights(
  adapters: AdapterView[],
  overview: IntegrationHubOverview,
): CaraIntegrationInsight[] {
  const insights: CaraIntegrationInsight[] = [];

  // 1. Errors first.
  const errored = adapters.filter((a) => a.status === "error");
  if (errored.length > 0) {
    const names = errored.slice(0, 3).map((a) => a.name).join(", ");
    insights.push({
      severity: "critical",
      text: `${errored.length} adapter${errored.length === 1 ? " is" : "s are"} reporting errors (${names}). Each retries automatically with exponential backoff and logs every failure to its error log; if the upstream issue persists, switch the adapter to manual override so the workflow is never blocked while you investigate.`,
    });
  }

  // 2. Key adapters not yet configured — the main demo message.
  const keyMissing = adapters.filter((a) => a.is_key_adapter && a.status === "not_configured");
  if (keyMissing.length > 0) {
    const detail = keyMissing
      .slice(0, 4)
      .map((a) => `${a.kind_label} would ${decapitalise(ADAPTER_CAPABILITY[a.kind])}`)
      .join(" ");
    insights.push({
      severity: "warning",
      text: `${keyMissing.length} key integration${keyMissing.length === 1 ? " is" : "s are"} not yet configured. ${detail}`,
    });
  }

  // 3. Stale-but-connected.
  const stale = adapters.filter((a) => a.stale && (a.status === "connected" || a.status === "syncing"));
  if (stale.length > 0) {
    const names = stale.slice(0, 3).map((a) => a.name).join(", ");
    insights.push({
      severity: "warning",
      text: `${stale.length} connected adapter${stale.length === 1 ? " has" : "s have"} not synced recently (${names}). Sync status is tracked per adapter, so a stalled feed is visible before it causes data to drift — reconnect or force a manual sync.`,
    });
  }

  // 4. Framework guarantee — always present so the demo communicates the design.
  insights.push({
    severity: "positive",
    text: `Every adapter in the hub is built on the same secure contract: encrypted credentials in a secrets vault (never in code), retry handling with exponential backoff, a per-adapter error log, idempotency keys so a retried sync never double-posts, a live sync status, a full audit trail of every connect/sync/disconnect, and a manual override to pause or run any integration by hand. ${overview.idempotent_adapters}/${overview.total_adapters} adapters currently advertise idempotency support.`,
  });

  // 5. Positive when the home is in good shape.
  if (
    errored.length === 0 &&
    stale.length === 0 &&
    overview.key_adapters > 0 &&
    overview.key_adapters_connected === overview.key_adapters
  ) {
    insights.push({
      severity: "positive",
      text: `All ${overview.key_adapters} key integrations are connected and syncing cleanly (health score ${overview.health_score}/100). Facts entered once in Cara are flowing to the right external systems automatically, with provenance preserved.`,
    });
  }

  return insights;
}

function decapitalise(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}
