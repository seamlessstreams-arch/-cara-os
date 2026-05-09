# ARIA — Universal Layer

The universal Aria layer sits beneath every Aria-driven feature in
Cornerstone. Domain engines (Management Oversight, Voice of the Child, HR
Process Guardian) keep their own deep checks and continue to talk to
Anthropic directly. The universal layer adds a generic generate / approve /
audit pipeline, voice dictation, and a single permissions matrix that the
rest of the platform can route through.

This document covers what shipped in this release, what is intentionally
queued for the next phases, and how to set Aria up.

## What shipped

- **Migration `013_aria_universal_layer.sql`** — `aria_requests`,
  `aria_outputs`, `aria_approvals`, `aria_audit_events`,
  `aria_transcriptions`, `aria_task_links`. RLS-enabled. Append-only audit
  and approvals.
- **`src/lib/aria/aria-permissions.ts`** — RBAC matrix mapping the spec's
  Phase 12 roles (registered manager, responsible individual, deputy,
  team leader, RSW, HR/admin, auditor, viewer) to the spec's Aria
  permission ids. Includes per-organisation, per-home and staff-self
  scoping.
- **`src/lib/aria/aria-types.ts`** — universal types and the typed
  `AriaCommandId` set.
- **`src/lib/aria/aria-provider.ts`** — provider abstraction. OpenAI is
  the default. Lazy reads `OPENAI_API_KEY` at runtime. Returns a safe
  "not configured" fallback if the key is missing so the app never
  crashes. Talks via `fetch`, no extra dependencies required beyond what
  is already installed.
- **`src/lib/aria/aria-service.ts`** — orchestrator. `invokeAriaCommand`
  authenticates, checks Aria permission, builds a redacted context
  summary, calls the provider, runs the writing-style post-processor,
  persists a draft, and writes the audit event. `applyApprovalDecision`
  handles the lifecycle (approve / reject / request_changes / commit /
  withdraw).
- **`src/app/api/aria/generate/route.ts`** — `POST` to invoke a command,
  `PATCH` to apply a manager decision.
- **`src/app/api/aria/transcribe/route.ts`** — multipart audio upload.
  Validates auth, permission, mime, size. Calls the provider. Discards
  audio after transcription.
- **`src/hooks/use-audio-recorder.ts`** — microphone capture hook with
  insecure-context, browser-unsupported, permission-denied,
  no-microphone handling. Tracks are stopped on unmount, cancel and
  error.
- **`src/components/aria/aria-microphone-button.tsx`** — drop-in
  microphone button.
- **`src/components/aria/aria-dictation-panel.tsx`** — dictation modal
  with full state coverage and an editable transcript.

## What is intentionally queued

- The full 150-command registry in `aria-types.ts`. Phase 1 wires nine
  commands into `aria-service.ts.ARIA_COMMANDS` (improve writing,
  professionalise record, simplify language, summarise, extract actions,
  check missing information, draft handover, draft email). The remaining
  command ids are typed but not yet wired. Adding a command is a small
  copy-paste of the spec block in `ARIA_COMMANDS`.
- Aria entry points in every dashboard / form / module (Phase 8 of the
  spec). The mic button + dictation panel are now drop-in components,
  but rolling them out across every module is its own pass.
- Generic `/api/aria/analyse`, `/api/aria/rewrite`, `/api/aria/summarise`
  routes. Phase 1 lands one route (`/api/aria/generate`) that takes a
  `commandId` and dispatches; the spec's per-route layout can be added
  on top as thin shells around `invokeAriaCommand`.
- Tests. The repo's test setup wasn't surveyed in detail; the next
  iteration should add Vitest or equivalent specs for permissions,
  service lifecycle, audit emission, and the audio recorder state
  machine.

## Environment variables

| Var | Purpose | Required |
| --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI key for the universal layer (text + transcription) | for the universal layer |
| `ARIA_PROVIDER` | Provider id. Currently `openai` only. | optional |
| `ARIA_TEXT_MODEL` | Text model. Default `gpt-4.1-mini`. | optional |
| `ARIA_TRANSCRIBE_MODEL` | Transcription model. Default `gpt-4o-transcribe`. | optional |
| `ARIA_MAX_AUDIO_MB` | Max audio upload in MB. Default 25. | optional |
| `ARIA_REQUIRE_APPROVAL` | Reserved. Approvals are always required in this build. | optional |
| `ARIA_LOG_CONTEXT` | Reserved. Context summaries are always logged in this build. | optional |
| `NEXT_PUBLIC_SUPABASE_URL` | For persistence. | for persistence |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. | for persistence |
| `ANTHROPIC_API_KEY` | Used by domain engines (oversight / voice / HR Guardian). Independent of the universal layer. | for those engines |

If the universal layer's provider is not configured, the API routes
return clear messages and the UI surfaces a "not configured yet"
notice. Domain engines that talk to Anthropic continue to work
independently.

## Permission model

Roles map to grants in `aria-permissions.ts`. Server routes always
enforce; UI hiding is a usability layer only.

| Role | Notable grants |
| --- | --- |
| `registered_manager` | Everything except `aria.admin_config` |
| `responsible_individual` | QA / Reg 44 / Reg 45 / Ofsted readiness, approvals, audit logs |
| `deputy_manager` | Drafts, dictate, analyse, approve, commit |
| `team_leader` | Drafts, dictate, summarise, create tasks |
| `residential_support_worker` | Drafts, dictate, summarise, rewrite |
| `hr_admin` | HR + safer recruitment, audit logs |
| `auditor` | Read-only QA + audit logs |
| `viewer` | `aria.use` only |

## Approval lifecycle

Every Aria draft persisted by the universal layer follows the same flow:

```
draft → edited → submitted_for_approval → approved → committed
              \→ rejected
              \→ archived (withdrawn)
```

`PATCH /api/aria/generate` accepts `decision` of `approve | reject |
request_changes | commit | withdraw`. Each decision writes to
`aria_approvals` and `aria_audit_events`. The `committed_record_type`
and `committed_record_id` columns on `aria_outputs` link the approved
text to whatever official record it became.

## Voice dictation

Use the components together:

```tsx
import { AriaMicrophoneButton } from "@/components/aria/aria-microphone-button";

<AriaMicrophoneButton
  actorUserId={user.id}
  actorRole={user.role}
  homeId={home.id}
  sourceModule="daily_log"
  sourceField="narrative"
  onTranscript={(text) => setNarrative((v) => `${v}\n${text}`)}
/>
```

The button opens the dictation panel. Recording starts only after the
user clicks Start. Tracks are stopped on close, cancel, error and
unmount. Audio is sent securely to the provider on Submit and is then
discarded server-side.

### Browser requirements

- HTTPS or `localhost` (insecure context blocks `getUserMedia`).
- A browser that supports `MediaRecorder` and
  `navigator.mediaDevices.getUserMedia`.
- The user must allow microphone access when prompted.

The hook detects each of these and surfaces the right state.

## Audit trail

Two audit streams cover the universal layer:

- `aria_audit_events` — every event in an Aria request / output's life
  (`generated`, `edited`, `submitted_for_approval`, `approved`,
  `rejected`, `committed`, `transcribed`, `copied_to_field`,
  `task_created`, `context_viewed`, `failed`, `permission_denied`,
  `withdrawn`).
- `aria_approvals` — append-only manager decision trail per output.

Inspector readiness comes from joining these against
`aria_requests` and `aria_outputs`.

## Safety and tone

All universal-layer output runs through the writing-style
post-processor at `src/lib/aria/writingStyleRules.ts` (em-dash filler
removed, redundant openers stripped, US to UK spellings, blame phrases
softened, quoted speech protected). The system prompt prepends the
writing rules to every command.

Aria is told explicitly:

- Output is always labelled "Aria suggested draft".
- Use only the source provided. Do not invent facts.
- Never declare high confidence on safeguarding-, HR-, or
  legal-sensitive material unless the source evidence is unambiguous.

## Testing instructions

The repo's test framework wasn't surveyed in this pass; verification
in this release was done via:

- `npx tsc --noEmit` across the project (clean).
- `npx eslint` on every new file (clean).
- Domain engine smoke tests via `npx tsx`.

The next iteration should add Vitest specs for:

- `checkAriaAccess` permission decisions.
- `invokeAriaCommand` happy and unhappy paths (no provider,
  permission denied, persistence not configured, persistence
  succeeds).
- `applyApprovalDecision` lifecycle transitions.
- Transcribe route validation (empty file, oversized file,
  unsupported mime, missing key).

---

## Phase 1 — Health and Diagnostics System

Shipped in the same release as the universal layer upgrade.

### Files

| File | Purpose |
| --- | --- |
| `src/lib/aria/aria-health.ts` | Server-only health check module |
| `src/app/api/v1/aria/health/route.ts` | `GET /api/v1/aria/health` HTTP endpoint |
| `src/hooks/use-aria-health.ts` | Client-side React Query hook |
| `src/components/aria/aria-health-panel.tsx` | Full health dashboard UI component |
| `src/lib/aria/__tests__/aria-health.test.ts` | 17 Vitest unit tests (all passing) |

### `GET /api/v1/aria/health`

Returns a typed `AriaHealthStatus` object.

**Auth**: Requires `x-aria-role` and `x-aria-user-id` request headers. Allowed roles: `registered_manager`, `responsible_individual`, `deputy_manager`. Checks `aria.view_audit_logs` permission.

**Query parameters**:
- `?deep=true` — runs a live 1-token provider test call (OpenAI and/or Anthropic). Restricted to `responsible_individual`. Costs real tokens. Use sparingly.

**Response headers**:
- `Cache-Control: no-store`
- `X-ARIA-Health: <overallStatus>`

### Overall status values

| Status | Meaning |
| --- | --- |
| `full_capacity` | Both providers configured + Supabase connected + audit writable |
| `partial` | At least one provider configured but Supabase not connected |
| `degraded` | Provider + DB present but deep test failed or audit not writable |
| `not_configured` | No providers configured |
| `error` | Unexpected error during health check |

### ARIA platform module coverage

The health system tracks coverage across 27 platform modules:

`daily_log`, `shift_summary`, `key_work`, `incident`, `complaint`,
`management_oversight`, `ri_oversight`, `regulation_44`, `regulation_45`,
`safeguarding`, `missing_episode`, `behaviour_support`, `risk_assessment`,
`care_plan`, `placement_plan`, `hr_supervision`, `hr_investigation`,
`hr_recruitment`, `hr_training`, `audit`, `document`, `task`, `calendar`,
`health_record`, `education_record`, `family_contact`, `independent_living`.

Coverage percentage = modules with at least one dedicated ARIA command ÷ 27.

### AriaHealthPanel component

Drop-in dashboard component for manager pages.

```tsx
import { AriaHealthPanel, AriaStatusBadge } from "@/components/aria/aria-health-panel";

// Full dashboard
<AriaHealthPanel userRole="registered_manager" userId={user.id} className="mb-6" />

// Compact status badge
<AriaStatusBadge userRole="registered_manager" userId={user.id} />
```

Allowed roles: `registered_manager`, `responsible_individual`, `deputy_manager`.
Deep test button only visible to `responsible_individual`.

### `useAriaHealth` hook

```ts
import { useAriaHealth, useAriaHealthDeepTest } from "@/hooks/use-aria-health";

const { data, isLoading, isError } = useAriaHealth(role, userId);
const deepTest = useAriaHealthDeepTest(role, userId);
deepTest.mutate(); // triggers a live provider test
```

Fetches from `/api/v1/aria/health`. Cache stale time: 5 minutes. Only enabled when role + userId are present.
- `useAudioRecorder` state machine.

## Safety note

Aria supports professional judgement. Aria does not replace the
Registered Manager, the Responsible Individual, the social worker,
the safeguarding lead, the HR adviser, or the regulator. Every
Aria-generated record must be reviewed by a human before it is used.
