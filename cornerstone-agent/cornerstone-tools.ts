// Custom Claude Agent SDK tools that let the agent "drive" the Cornerstone
// care-platform API over HTTP.
//
// SAFETY: this drives a children's-home care system. Reads are always allowed;
// WRITES are disabled unless CORNERSTONE_ALLOW_WRITES=true is set explicitly.
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const BASE = (process.env.CORNERSTONE_API_BASE ?? "http://localhost:3000/api/v1").replace(/\/+$/, "");
const ALLOW_WRITES = process.env.CORNERSTONE_ALLOW_WRITES === "true";
const TOKEN = process.env.CORNERSTONE_API_TOKEN;

function buildHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (TOKEN) h["Authorization"] = `Bearer ${TOKEN}`;
  return h;
}
const ok = (text: string) => ({ content: [{ type: "text" as const, text }] });
const fail = (text: string) => ({ content: [{ type: "text" as const, text }], isError: true });

/** Shared GET against the Cornerstone API; returns an MCP tool result. */
async function apiGet(path: string) {
  const url = `${BASE}/${path.replace(/^\/+/, "")}`;
  try {
    const res = await fetch(url, { headers: buildHeaders() });
    const text = await res.text();
    return ok(`GET ${url} -> ${res.status}\n${text.slice(0, 12000)}`);
  } catch (e) {
    return fail(`GET ${url} failed: ${(e as Error).message}`);
  }
}

// ── Generic escape hatches ───────────────────────────────────────────────────

/** Read any path (GET) — flexible fallback for endpoints without a typed tool. */
export const cornerstoneGet = tool(
  "cornerstone_get",
  "Read any Cornerstone API path (HTTP GET) under /api/v1, e.g. 'care-events?days=30', 'risk-assessment'. Prefer the typed tools below when one fits.",
  { path: z.string().describe("API path under /api/v1, with query string, no leading slash") },
  async ({ path }) => apiGet(path),
);

/** Write (POST/PATCH/PUT) — gated behind CORNERSTONE_ALLOW_WRITES. */
export const cornerstoneWrite = tool(
  "cornerstone_write",
  "Create or update data (HTTP POST/PATCH/PUT). DISABLED unless CORNERSTONE_ALLOW_WRITES=true. Mutates real care records — use only when explicitly instructed.",
  {
    method: z.enum(["POST", "PATCH", "PUT"]).describe("HTTP method"),
    path: z.string().describe("API path under /api/v1, no leading slash"),
    body: z.record(z.string(), z.unknown()).optional().describe("JSON request body"),
  },
  async ({ method, path, body }) => {
    if (!ALLOW_WRITES) {
      return fail(
        "Writes are disabled (read-only mode). Set CORNERSTONE_ALLOW_WRITES=true to allow the " +
          "agent to create/update care records — a deliberate safety default for a children's-home system.",
      );
    }
    const url = `${BASE}/${path.replace(/^\/+/, "")}`;
    try {
      const res = await fetch(url, {
        method,
        headers: buildHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      return ok(`${method} ${url} -> ${res.status}\n${text.slice(0, 12000)}`);
    } catch (e) {
      return fail(`${method} ${url} failed: ${(e as Error).message}`);
    }
  },
);

// ── Typed, purposeful read tools (live endpoints) ────────────────────────────

export const listYoungPeople = tool(
  "list_young_people",
  "List the young people (children) placed in the home, with ids and basic details.",
  {},
  async () => apiGet("young-people"),
);

export const getYoungPerson = tool(
  "get_young_person",
  "Get a single young person's profile by id (use list_young_people to find ids).",
  { child_id: z.string().describe("Young person id, e.g. 'yp_alex'") },
  async ({ child_id }) => apiGet(`young-people/${encodeURIComponent(child_id)}`),
);

export const listCareEvents = tool(
  "list_care_events",
  "List recent care events (daily logs, incidents, safeguarding, etc.) with status, routing flags and Reg-40 triage. Returns meta.status_counts too.",
  { days: z.number().int().positive().max(365).default(30).describe("How many days back to include (default 30)") },
  async ({ days }) => apiGet(`care-events?days=${days}`),
);

export const recruitmentOverview = tool(
  "recruitment_overview",
  "Get the recruitment overview: candidates (with compliance + blockers), vacancies, alerts and stats.",
  {},
  async () => apiGet("recruitment"),
);

// Home-level intelligence dashboards (ratings, alerts, concerns, recommendations).
const HOME_DASHBOARDS = [
  "leaving-care-intelligence",
  "home-medication-administration-intelligence",
  "home-allegations-investigations-management-intelligence",
  "home-lado-allegation-management-intelligence",
  "home-placement-stability-intelligence",
  "home-safeguarding-depth-intelligence",
  "home-behaviour-support-plan-intelligence",
  "education-intelligence",
  "contact-engagement",
  "care-plans",
] as const;

export const homeIntelligence = tool(
  "home_intelligence",
  `Fetch a home-level intelligence dashboard (rating, alerts, concerns, recommendations, insights). Areas: ${HOME_DASHBOARDS.join(", ")}.`,
  {
    area: z.enum(HOME_DASHBOARDS).describe("Which intelligence dashboard to fetch"),
    home_id: z.string().default("home_oak").describe("Home id (default home_oak)"),
  },
  async ({ area, home_id }) => apiGet(`${area}?home_id=${encodeURIComponent(home_id)}`),
);

export const childHealthIntelligence = tool(
  "child_health_intelligence",
  "Fetch a single child's health intelligence (medication compliance, immunisations, assessments, wellbeing).",
  { child_id: z.string().describe("Young person id, e.g. 'yp_alex'") },
  async ({ child_id }) => apiGet(`child-health-intelligence?childId=${encodeURIComponent(child_id)}`),
);

export const cornerstoneTools = [
  // typed (preferred)
  listYoungPeople,
  getYoungPerson,
  listCareEvents,
  recruitmentOverview,
  homeIntelligence,
  childHealthIntelligence,
  // generic escape hatches
  cornerstoneGet,
  cornerstoneWrite,
];
