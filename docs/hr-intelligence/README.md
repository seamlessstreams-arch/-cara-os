# HR Intelligence, Safeguarding and Workforce Assurance

A children's-home HR module integrated with ARIA Intelligence. The module
supports fair employment practice, safer recruitment, workforce fitness,
employee relations, safeguarding-linked HR decisions, supervision intelligence,
agency compliance, inspection evidence, and Registered Manager / Responsible
Individual oversight.

ARIA supports, drafts, prompts, challenges, risk-assesses and evidences. ARIA
never makes the final decision. Every ARIA output is `Aria suggested draft`
until a human approves, edits, or rejects it. Every decision is audit-logged.

## Phased delivery

The module spec covers 25 sections. To keep quality high and avoid shallow
stubs, the module ships in three phases. The schema is sized for all phases
in migration `012_hr_intelligence_schema.sql`, so later phases land without
re-migration.

### Phase 1 (this release)

- Comprehensive schema (all 25 sections)
- Role-based access matrix
- Typed models
- ARIA HR Process Guardian engine, API, and UI
- HR Cases API (open, fetch, list, update, close) with audit logging
- Empty-state guidance
- Documentation (this file)
- Nav entry under Intelligence > Aria

### Phase 2 (in progress)

Shipped in Phase 2.1:

- Suspension Decision Tool — risk-factor grading across the five required
  factors, alternatives review, advice trail (HR / RI / LADO / police /
  social worker), welfare plan, written-reasons draft, review schedule.
  Lives at `src/lib/hr/suspensionDecision.ts`,
  `/api/hr/suspension-decision`, and `/intelligence/hr/suspension-decision`.
- Letter Generator — templated drafts for all 26 letter types from
  `hr_letters.letter_type`. Every draft is run through the HR Process
  Guardian. The Guardian gate is enforced server-side: a letter cannot
  be approved or sent while the fairness judgement is
  `do_not_approve_yet`, unless an RI supplies a written
  `seniorRiskAcceptance` of at least 30 characters. Lives at
  `src/lib/hr/letterTemplates.ts`, `/api/hr/letters`, and
  `/intelligence/hr/letters`.

Shipped in Phase 2.2:

- Safer Recruitment Gate — `src/lib/hr/saferRecruitmentGate.ts`,
  `/api/hr/safer-recruitment` (GET + PATCH + POST), and
  `/intelligence/hr/safer-recruitment`. Manager checklist with edit
  controls per check, evidence requirement on each unmet item, gate
  evaluation, manager sign-off button, and senior risk acceptance
  entry (RI-only by permission). The gate flips
  `approved_for_unsupervised` on `hr_staff_profiles` only when the
  evaluation comes back approved. Senior risk acceptance requires a
  written rationale of at least 30 characters.

Shipped in Phase 2.3:

- HR Risk Command Centre — strategic dashboard with risk heatmap, open cases,
  overdue tasks, RI oversight, safer recruitment position, active suspensions,
  and ARIA professional insight. Lives at
  `/intelligence/hr/risk-command-centre`.
- Investigation Builder — 6-stage structured investigation tool (terms of
  reference, investigation plan, witnesses, evidence log, findings, report).
  Covers 8 investigation types: disciplinary, conduct, safeguarding
  allegation, capability, grievance, whistleblowing, sickness, probation.
  ARIA generates investigation report drafts. Lives at
  `/intelligence/hr/investigation-builder`.
- Safeguarding / LADO Pathway — 5-stage LADO allegation pathway (initial
  concern, LADO consultation, strategy meeting, investigation, outcome).
  LADO outcome categories, DBS referral tracking, Ofsted notification.
  Lives at `/intelligence/hr/safeguarding-lado`.
- Probation Pathway — 4-stage probation management (setup with safer
  recruitment checks, reviews with ratings, concerns, outcome with
  confirm/extend/end decisions). Lives at
  `/intelligence/hr/probation-pathway`.

Shipped in Phase 2.4:

- HR Inspection Mode — 8-domain structured export for Ofsted inspectors.
  Print-to-PDF and per-section CSV download. Covers workforce summary,
  safer recruitment position, HR cases, case chronology, suspension
  register, safeguarding/LADO referrals, training and compliance, and RI
  oversight. Lives at `/intelligence/hr/inspection-mode`.

### Phase 3 (later)

- Sickness and Absence Intelligence
- Supervision Intelligence (theme detection across supervision records)
- Union and Companion Management workflows
- Agency Staff Compliance Panel UI + shift feedback flow
- Team Culture and Conflict Intelligence (cross-record analysis)
- Exit Interview and Leaver Intelligence
- RI Dashboard
- Reporting (compliance, audits, learning reports)
- Approval and Audit Controls UI surfaces
- Notifications and Tasks UI
- Tests across the engine and APIs

## Architecture

### Data layer

Migration `supabase/migrations/012_hr_intelligence_schema.sql` creates:

| Table | Purpose |
| --- | --- |
| `hr_staff_profiles` | HR-specific fields keyed against the existing staff record |
| `hr_safer_recruitment` | All required pre-employment checks |
| `hr_cases` | Core employee-relations record |
| `hr_case_actions` | Append-only timeline of actions on a case |
| `hr_case_chronology` | Inspector-ready chronology of significant events |
| `hr_letters` | Letters generated for the case |
| `hr_process_guardian_reviews` | ARIA HR Process Guardian draft reviews |
| `hr_process_guardian_audit_log` | Append-only audit trail of Guardian decisions |
| `hr_oversight_reviews` | RM/RI oversight on closed or significant cases |
| `hr_probation` | Probation pathway record |
| `hr_sickness_episodes` | Sickness episodes with welfare and OH fields |
| `hr_supervision_themes` | Supervision intelligence — repeated themes per staff |
| `hr_agency_compliance` | Agency worker compliance state |
| `hr_agency_shift_feedback` | Per-shift feedback for agency workers |
| `hr_exit_interviews` | Leaver workflow with culture / safeguarding flags |
| `hr_tasks` | HR tasks and reminders linked to cases / staff |
| `hr_audit_log` | Append-only HR audit trail (every view, edit, export, deletion) |

All tables are RLS-enabled. Service role has full access. Authenticated users
have read-only access scoped at the application layer.

### Code layer

```
src/
  lib/
    aria/
      hrProcessGuardian.ts        // ARIA HR Process Guardian engine
      writingStyleRules.ts        // Shared style + post-processor (already shipped)
    hr/
      types.ts                    // Typed models mirroring the schema
      permissions.ts              // RBAC matrix
  app/
    api/
      hr/
        process-guardian/route.ts // POST analyse, GET fetch, PATCH decision
        cases/route.ts            // POST open, GET fetch/list, PATCH update
    (platform)/intelligence/hr/
      process-guardian/page.tsx   // Manager UI for the Process Guardian
docs/
  hr-intelligence/README.md       // This file
supabase/
  migrations/
    012_hr_intelligence_schema.sql
```

### ARIA HR Process Guardian

The Process Guardian is the integration spine. Every formal HR action draft
(letter, suspension decision, disciplinary outcome, dismissal, probation
outcome, appeal outcome, sickness meeting, etc.) is run through the Guardian
before approval. The Guardian checks:

- **Fairness / ACAS alignment** — investigation completeness, evidence
  sharing, mitigation considered, expected terms for the action type.
- **Safeguarding alignment** — neutral-act wording on suspensions, LADO
  consultation, child impact recorded.
- **Discrimination risk** — references to protected characteristics with
  prompts to document objective justification.
- **Proportionality** — flags dismissal without prior warnings or completed
  investigation, final written warnings without a prior written warning.
- **Rights** — right to be accompanied, right of appeal communicated.
- **Evidence quality** — length, dated references, basis-for-action present.
- **Wording risk** — prejudgment phrases, emotional language, blame phrases.
- **Consistency** — prompts to record consistency with prior cases.

The engine is deterministic and audit-traceable. Optional Anthropic LLM
enhancement adds a redrafted "safer wording" suggestion when
`ANTHROPIC_API_KEY` is configured. Every output is run through the Aria
writing-style post-processor, so American spellings and AI-tell phrasing are
removed before the manager sees it.

The Guardian never makes the decision. Output is always
`Aria suggested draft`. Manager decisions (approve, edit, reject, request
rewrite) are recorded in `hr_process_guardian_audit_log` and mirrored into
`hr_audit_log`.

## RBAC

`src/lib/hr/permissions.ts` defines the role matrix. Roles:

- `ri` (Responsible Individual)
- `rm` (Registered Manager)
- `deputy`
- `hr_admin`
- `hr_caseworker` (scoped to cases they own)
- `safeguarding` (DSL-style)
- `auditor` (read-only)
- `staff_self` (own records only, safeguarding-status cases excluded)
- `none` (default for unrecognised users)

Use `checkHrAccess(context, request)` in routes and server actions to enforce
both the matrix and per-record scoping (home, staff, case ownership,
safeguarding confidentiality).

## Audit log

Every API route writes to `hr_audit_log` for these events:

- `created`, `viewed`, `edited`, `exported`, `deleted`
- `approved`, `rejected`, `sent`, `signed_off`, `escalated`
- `restricted_access` (when a denied access attempt happens)
- `rights_assertion` (used when a user asserts a SAR / GDPR right)

The Process Guardian also writes to its own `hr_process_guardian_audit_log`
for events specific to a Guardian review (`draft_generated`, `viewed`,
`edited`, `approved`, `rejected`, `rewrite_requested`).

## Environment variables

| Variable | Purpose | Required for |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Persistence |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) | Persistence |
| `ANTHROPIC_API_KEY` | Anthropic API key | Optional LLM enhancement of Guardian drafts |

If Supabase env vars are missing or set to placeholders, the engines run in
analyse-only mode and the API responses include `persisted: false`. If
`ANTHROPIC_API_KEY` is missing, the Guardian falls back to the deterministic
safer-wording template.

## Permissions added

- HR namespace permissions defined in `src/lib/hr/permissions.ts`. Map your
  production auth claims onto these roles in middleware.

## Assumptions

- The existing Cornerstone Supabase setup is in place. Migration 012 follows
  migrations 010 (Management Oversight Engine) and 011 (Voice of the Child
  Summariser) and reuses the same patterns.
- The `Database` typed Supabase client does not yet include the HR tables.
  The route handlers use a deliberately loose-typed client (matching the
  pattern used in the other Aria engine routes) until the typed client is
  regenerated.
- Per-home RLS scoping is enforced at the application layer for now.
  Production deployment should add per-home RLS policies that consume claims
  from `auth.jwt()` once role mapping is finalised.
- "Approved for unsupervised work" enforcement (Section 2 of the spec) is
  scaffolded in `hr_safer_recruitment` but not yet wired into the rota. This
  is a Phase 2 item.

## What is stubbed

After Phase 2.4, the following UIs are not yet shipped: Sickness Intelligence,
Supervision Intelligence, Agency Compliance Panel, RI Dashboard, and Reports.
These are scheduled into Phase 3 above. The schema is in place for all of them.

The `hr_cases` POST creates the case and seeds the chronology with the
opening event. Subsequent actions (meetings, letters, evidence uploads,
decisions) require their own endpoints in Phase 2.

No demo / seed data is created. HR data is sensitive enough that example
records are out of scope for this module.

## Testing instructions

### Engine smoke test (no Supabase, no API key needed)

```ts
import { reviewHrAction } from "@/lib/aria/hrProcessGuardian";

const review = await reviewHrAction({
  draftSubject: "Dismissal outcome",
  draftActionType: "dismissal",
  draftBody: "Following the meeting, you are clearly guilty of misconduct. You are dismissed with immediate effect.",
  caseContext: {
    investigationCompleted: false,
    evidenceShared: false,
    priorWarnings: [],
  },
  enableLlm: false,
});

console.log(review.fairnessJudgement);          // "do_not_approve_yet"
console.log(review.flags.map(f => f.severity)); // includes "block"
console.log(review.suggestedSaferWording);      // templated safer wording
```

### API smoke test (requires Supabase env vars)

```bash
# Open a case
curl -X POST http://localhost:3000/api/hr/cases \
  -H "Content-Type: application/json" \
  -d '{
    "actorUserId": "rm_demo",
    "actorRole": "rm",
    "staffId": "staff_123",
    "caseType": "disciplinary",
    "concernSummary": "Allegation of poor recording standards over a 2-week period."
  }'

# Run a draft through the Process Guardian
curl -X POST http://localhost:3000/api/hr/process-guardian \
  -H "Content-Type: application/json" \
  -d '{
    "actorUserId": "rm_demo",
    "actorRole": "rm",
    "draftSubject": "Invitation to disciplinary meeting",
    "draftActionType": "disciplinary_invite",
    "draftBody": "You are invited to a disciplinary meeting on 12 May.",
    "caseContext": { "investigationCompleted": true }
  }'
```

### UI smoke test

Navigate to `/intelligence/hr/process-guardian`. Paste a draft, set the
context, run the Guardian, and try each manager decision. Decisions are
audit-logged when Supabase is configured.

### TypeScript

Run `npx tsc --noEmit` from the project root. The Phase 1 release is
TypeScript-clean.
