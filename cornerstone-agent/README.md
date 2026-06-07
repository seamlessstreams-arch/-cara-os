# Cornerstone Agent

A standalone [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) agent
that **drives the Cornerstone care platform** by calling its HTTP API through a set of typed,
safety-gated tools.

It lives in the repo but is its **own package** (own `package.json` / `node_modules`), so it
doesn't touch the cornerstone-v2 app's dependencies (the app pins `@anthropic-ai/sdk@0.89.0`;
the Agent SDK needs `>=0.93.0`, which would otherwise conflict).

## Setup

```bash
cd cornerstone-agent
npm install                 # already done if you're reading this
cp .env.example .env        # then fill in your keys (see below)
```

Set these in `.env` (the keys are **yours** — they are git-ignored and never committed):

| Variable | Required | What it's for |
|----------|----------|---------------|
| `ANTHROPIC_API_KEY` | ✅ | Runs the agent (console.anthropic.com) |
| `CORNERSTONE_API_BASE` | ✅ | Which API the agent talks to (local `http://localhost:3000/api/v1` or the deployed URL) |
| `CORNERSTONE_API_TOKEN` | optional | Bearer token, if your API requires auth |
| `CORNERSTONE_ALLOW_WRITES` | optional | `false` by default (read-only). Set `true` to allow record mutations |
| `AGENT_MODEL` | optional | Which Claude model to run (defaults to a Sonnet build) |

## Run

```bash
npm run agent -- "List care events from the last 7 days that need manager attention"
npm run agent -- "Which young people have an overdue pathway-plan review?"
```

With no prompt it runs a default read-only summary.

## Tools the agent has

Typed, purposeful read tools (preferred): `list_young_people`, `get_young_person`,
`list_care_events`, `recruitment_overview`, `home_intelligence`, `child_health_intelligence`.
Generic escape hatches: `cornerstone_get` (any GET path) and `cornerstone_write`
(POST/PATCH/PUT — disabled unless writes are enabled).

## Safety — read this

This agent can act on a **children's-home care system**, so it ships safe-by-default:

- **Read-only by default.** `cornerstone_get` is always available; `cornerstone_write`
  (POST/PATCH/PUT) refuses to run unless you set `CORNERSTONE_ALLOW_WRITES=true`.
- **Your credentials stay yours.** Keys are read from `.env` (git-ignored). Nothing is
  committed or sent anywhere except the API you point it at.
- Point `CORNERSTONE_API_BASE` at a **local/dev** instance first before ever enabling writes
  against production data.

## How it works

- `cornerstone-tools.ts` — custom Agent SDK tools that call `${CORNERSTONE_API_BASE}/<path>`.
- `agent.ts` — bundles those tools into an SDK MCP server (`createSdkMcpServer`) and runs the
  loop with `query(...)`.
