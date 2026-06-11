# Cara Studio — the learning-design engine

> This document covers BOTH Cara Studio layers: the **learning-design engine**
> (this section — curriculum, sessions, materials, conversation coach,
> incident-to-learning, SEND adaptation, debriefs) and the original
> **artifact studio** (second section below).

Cara Studio turns what staff already know about a child — needs, risks, strengths, incidents, key-work themes — into things they can actually use on shift: curriculum pathways, session plans, conversation scripts, interactive materials, SEND adaptations, incident-to-learning conversions and staff debriefs.

**The contract everywhere: Cara drafts, staff decide, managers review, the system audits.** Cara never diagnoses, never replaces therapy or safeguarding procedures, and never makes a professional decision.

## How staff use it

Open **/cara-studio** and pick a tool from the Learning Design section (or jump straight from a child's workspace at `/cara-studio/children/[childId]`):

| Tool | What it gives you |
| --- | --- |
| Curriculum Builder | A modular weekly pathway from the child's risk themes, key-work themes and goals — trust first, independence last |
| Session Planner | 5/10/20/45-minute sessions with the full 10-part structure (before-you-start → follow-up), shaped by the child's learning style |
| Conversation Coach | PACE-informed openers, validations and curiosity questions, with branch plans for shutdown / anger / upset / walking away |
| Incident → Learning | A non-shaming reframe, the possible unmet need, a conversation plan and a 5-minute micro-session |
| Interactive Materials | 19 types (visual cards, social stories, scenario cards, decision trees, audio scripts…) — every one with a no-writing alternative |
| Make This Easier | Paste anything; rule-based SEND/communication adaptation with an explainable change list and a do-not-do list |
| Staff Debrief | No-blame reflection: what the child may have been communicating, what to keep, repair planning, supervision questions |

Every output ends in the same safety spine: staff guidance, adaptation notes, safeguarding notes, **signs to pause**, follow-up actions, a **recording prompt** and a manager-review flag.

## Child learning profiles

`cara_child_learning_profiles` (and the in-memory `caraLearningProfiles` mirror) hold how the child learns: communication and SEND needs, learning-style booleans (visual/audio/practical/movement/creative/low-literacy/short-bursts), attention, sensory and trigger profiles, calming strategies, strengths, avoided topics, trusted adults and risk themes. The **context builder** pulls the profile + recent incidents + key-work themes into every generation, so a session for a movement-based short-burst learner genuinely looks different from one for a conversational reader.

## How the guardrails work

`runCaraGuardrails` scans every generated output (the full serialised object) for blaming, shaming, punitive or threatening language, restraint/sanction suggestions, interrogation, secrecy promises, diagnosis claims, therapy replacement, safeguarding minimisation, confidentiality breaches and unsafe practice. Severity ladder: low / medium / high / critical.

* **low–medium** → saved and shown with a review banner (`flag_for_review`)
* **high–critical** → saved but **blocked from the response** — the staff member sees a held-for-review notice and the content only appears in the manager Review Centre (`block_pending_review`). Critical content is never shown without manager review.

Fields that intentionally quote bad phrasing as *negative examples* (a blueprint's `avoidPhrases`) are excluded from the scan. Every flag is logged to `cara_guardrail_events`; every generation to `cara_ai_runs`.

## Manager review policy

`computeManagerReview` requires review when: emotional intensity is high; the topic touches exploitation, self-harm, violence, sexual harm, missing episodes, abuse or disclosure; staff confidence is low on a non-trivial topic; the content was converted from a serious incident; the topic overlaps the child's known triggers; or guardrail severity is medium+. The UI shows: "This resource should be reviewed by a manager before use."

Managers work the queue at **/cara-studio/review**: approve, request changes, or archive — with a note. Only manager/deputy roles can review (`x-user-role`), and **nobody can approve their own output**.

## SEND adaptations

`adaptCaraContent` is rule-based and explainable: 19 declared needs (ADHD, autism, dyslexia, demand avoidance, shame sensitivity…) each contribute changes, regulation adjustments and do-not-do entries; a plain-language pass replaces clinical/abstract wording; content is shortened for attention profiles and broken into numbered micro-steps. Output includes a simplified version, an audio script, visual suggestions and the do-not-do list.

## AI provider

`/lib/cara-studio/ai-provider.ts` defines `generateStructured<T>` (Zod-validated structured output) with two implementations: the platform provider (server-only Anthropic path; `CARA_*`/`ARIA_*` env, key never exposed) and a **mock provider** (`CARA_STUDIO_MOCK_AI=true`) that always returns null. Generators are **deterministic-first**: the scaffold is complete and safe without any model; LLM enrichment can re-voice it later and is discarded if it fails validation or guardrails. This is why the whole module works in the demo with no API key.

## Resource library & future RAG

`cara_resource_library` stores resources tagged by domain, age range, SEND tags, trauma tags, type and **approval status**. The context builder already prefers approved resources matching the theme; when nothing matches, content is explicitly an AI/deterministic draft requiring professional review. Ingesting policies, key-work templates, safeguarding guidance and PACE resources later means: insert rows, mark approved — retrieval slots into the same hook.

## Data & API map

Tables (migration `411_cara_studio.sql`, RLS home-scoped via `get_my_home_id()`, no self-approval by constraint): learning profiles, curriculum maps, session plans, interactive materials, conversation blueprints, incident learning conversions, resource library, `cara_ai_runs`, `cara_guardrail_events`. The in-memory demo store mirrors these with a unified `caraStudioOutputs` collection.

Routes: `POST /api/cara/{curriculum, session-plan, materials, conversation, incident-learning, adapt, reflect}` · `GET /api/cara/child/[childId]` · `GET /api/cara/library` · `GET /api/cara/review` · `PATCH /api/cara/review/[id]`. Every POST: authenticate → validate (Zod) → build context → generate → validate output (Zod) → guardrails → save → log run + flags → respond.

---

# Cara Studio — Technical Documentation

## Overview

Cara Studio is a NotebookLM-style intelligence and creative studio purpose-built for children's residential care. It enables Registered Managers, team leaders, and care workers to generate, review, approve, and commit professional documents — all grounded in real evidence and governed by a human-in-the-loop approval workflow.

**Core principle:** Cara never writes the final record. It drafts. A human always reviews, amends, and approves before anything becomes official.

## Architecture

```
Database (18 tables)
  └─ Types (src/types/aria-studio.ts)
      └─ Services (src/lib/aria-studio/*.service.ts)
          └─ API Routes (src/app/api/aria-studio/*)
              └─ UI Pages (src/app/(platform)/aria-studio/*)
```

### Database Schema

Migration: `supabase/migrations/019_aria_studio_schema.sql`

| Table | Purpose |
|-------|---------|
| `aria_studio_sources` | Indexed evidence from across Cara |
| `aria_studio_artifacts` | Generated documents with workflow status |
| `aria_studio_artifact_sources` | Links artifacts to their evidence sources |
| `aria_studio_artifact_versions` | Version history for every artifact edit |
| `aria_studio_artifact_reviews` | Review decisions and comments |
| `aria_studio_artifact_actions` | Action items generated from artifacts |
| `aria_studio_audit_log` | Immutable audit trail for every AI action |
| `aria_studio_care_graph_nodes` | Knowledge graph nodes |
| `aria_studio_care_graph_edges` | Knowledge graph relationships |
| `aria_studio_evidence_assessments` | Evidence confidence scoring |
| `aria_studio_gaps` | Detected evidence gaps |
| `aria_studio_contradictions` | Conflicting information between records |
| `aria_studio_safeguarding_patterns` | Safeguarding escalation patterns |
| `aria_studio_home_dynamics` | Home-level dynamics snapshots |
| `aria_studio_early_warnings` | Early warning indicators |
| `aria_studio_formulations` | Therapeutic formulations per child |
| `aria_studio_decision_support` | Structured decision support records |
| `aria_studio_quality_checks` | Quality check results per artifact |

### Type System

File: `src/types/aria-studio.ts`

- **25 source types** — daily_log, incident, keywork, risk_assessment, etc.
- **31 artifact types** — keywork_session, management_oversight, risk_review, etc.
- **8 artifact statuses** — draft → in_review → approved → committed
- **13 therapeutic frameworks** — PACE, DDP, ARC, trauma-informed, etc.
- **10 tones** — conservative, balanced, creative, child_friendly, etc.
- **15 gap types** — missing_child_voice, overdue_action, etc.
- **12 safeguarding pattern types** — exploitation_indicator, self_harm_escalation, etc.
- **8 warning types** — child_risk, compliance_risk, staffing_risk, etc.

### Services (15 files)

| Service | File | Purpose |
|---------|------|---------|
| AI Provider | `ai-provider.service.ts` | Multi-provider abstraction (OpenAI, Anthropic, stub) |
| Prompts | `prompts.ts` | System prompts, framework/tone fragments, artifact type prompts |
| Generation | `generation.service.ts` | Orchestrates artifact generation end-to-end |
| Source | `source.service.ts` | Evidence indexing, search, retrieval |
| Evidence | `evidence.service.ts` | 7-dimension confidence scoring |
| Quality Check | `quality-check.service.ts` | 13+ deterministic quality checks |
| Gap Detection | `gap-detection.service.ts` | Evidence gap identification |
| Contradiction | `contradiction.service.ts` | Cross-record conflict detection |
| Safeguarding | `safeguarding-patterns.service.ts` | Pattern scanning with keyword detection |
| Care Graph | `care-graph.service.ts` | Knowledge graph CRUD and querying |
| Home Dynamics | `home-dynamics.service.ts` | Home-level dashboard snapshots |
| Early Warning | `early-warning.service.ts` | Trend-based early warning checks |
| Formulation | `formulation.service.ts` | Therapeutic formulation engine |
| Decision Support | `decision-support.service.ts` | Structured decision framing |
| Approval | `approval.service.ts` | Workflow: submit → review → approve → commit |
| Audit | `audit.service.ts` | Immutable audit trail |

### API Routes (13 endpoints)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/aria-studio/generate` | POST | Generate an artifact |
| `/api/aria-studio/artifacts` | GET, POST | List/create artifacts |
| `/api/aria-studio/artifacts/[id]` | GET, PATCH, DELETE | Single artifact operations |
| `/api/aria-studio/sources` | GET, POST | List/index evidence sources |
| `/api/aria-studio/quality-check` | POST | Run quality checks |
| `/api/aria-studio/gaps` | GET, POST | Evidence gap detection |
| `/api/aria-studio/contradictions` | GET, POST | Contradiction detection |
| `/api/aria-studio/safeguarding-patterns` | GET, POST | Safeguarding pattern scanning |
| `/api/aria-studio/care-graph` | GET, POST | Knowledge graph queries |
| `/api/aria-studio/home-dynamics` | GET, POST | Home dynamics snapshots |
| `/api/aria-studio/early-warnings` | GET, POST | Early warning indicators |
| `/api/aria-studio/formulations` | GET, POST | Therapeutic formulations |
| `/api/aria-studio/decision-support` | GET, POST | Decision support records |
| `/api/aria-studio/audit` | GET | Audit trail retrieval |

### UI Pages

| Page | Path | Purpose |
|------|------|---------|
| Cara Studio | `/cara-studio` | Main generation interface |
| Home Dynamics | `/cara-studio/home-dynamics` | RM morning dashboard |
| Ofsted Readiness | `/cara-studio/ofsted-readiness` | Inspection readiness view |

## Approval Workflow

```
draft → in_review → changes_requested → approved → committed
                  → rejected
```

- **Draft:** AI-generated content with watermark. Editable by creator.
- **In Review:** Submitted for manager review. Read-only for creator.
- **Changes Requested:** Returned with feedback. Creator can edit and resubmit.
- **Approved:** Manager has approved. Ready to commit to the official record.
- **Committed:** Version saved and linked to the filing cabinet. Immutable.

## Quality Check Engine

13 deterministic checks run on every generated artifact:

1. `evidence_cited` — References specific dated evidence
2. `child_voice_considered` — Captures wishes, feelings, or direct quotes
3. `risk_considered` — Addresses risk explicitly
4. `safeguarding_considered` — References safeguarding where relevant
5. `regulation_considered` — Cites relevant regulations
6. `actions_clear` — Contains actionable next steps
7. `owner_assigned` — Actions have named owners
8. `review_date_set` — Includes a review/follow-up date
9. `sensitive_language_reviewed` — No dignity violations
10. `no_unsupported_claims` — No definitive conclusions without evidence
11. `no_ai_style_filler` — No AI-typical filler phrases (20 patterns)
12. `dignity_language_passed` — No dehumanising language (11 patterns with suggestions)
13. `human_approval_complete` — Manager has reviewed and approved

## Evidence Confidence Scoring

7 dimensions with weighted overall score:

| Dimension | Weight | What it measures |
|-----------|--------|------------------|
| Relevance | 20% | How relevant to the artifact context |
| Recency | 20% | How recent (7 days = 100, 365+ days = 20) |
| Reliability | 20% | Source type reliability (incident: 90, daily_log: 75) |
| Approval | 15% | Approval status (approved: 100, draft: 30) |
| Corroboration | 10% | Supported by other sources |
| Child Voice | 10% | Contains the young person's own words |
| Contradiction | 5% | Not contradicted by other evidence |

## Safeguarding Pattern Engine

Scans evidence for 12 pattern types using keyword detection:

- Missing episode escalation
- Exploitation indicators
- Online safety risks
- Peer-on-peer concerns
- Self-harm escalation
- Substance misuse patterns
- Concerning contact
- Isolation increase
- Emotional deterioration
- Allegation patterns
- Staff practice drift
- Education refusal escalation

**Important:** Cara never makes safeguarding decisions. It surfaces possible patterns for professional review.

## Permissions

7 permissions added to the RBAC system:

| Permission | RM | Deputy | TL | RCW | Bank |
|------------|:--:|:------:|:--:|:---:|:----:|
| ARIA_STUDIO_VIEW | Yes | Yes | Yes | Yes | Yes |
| ARIA_STUDIO_CREATE | Yes | Yes | Yes | Yes | — |
| ARIA_STUDIO_EDIT | Yes | Yes | Yes | Yes | — |
| ARIA_STUDIO_REVIEW | Yes | Yes | Yes | — | — |
| ARIA_STUDIO_APPROVE | Yes | Yes | — | — | — |
| ARIA_STUDIO_COMMIT | Yes | — | — | — | — |
| ARIA_STUDIO_ADMIN | Yes | — | — | — | — |

## Demo / Stub Mode

When `AI_PROVIDER=stub` or no API key is configured, all services fall back to realistic demo content. Every stub response:

- Contains a `DEMO MODE` watermark
- Returns domain-appropriate content for the artifact type
- Includes all required structural elements
- Works without Supabase (in-memory fallback)

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `AI_PROVIDER` | No | `stub` | `openai`, `anthropic`, `gemini`, or `stub` |
| `OPENAI_API_KEY` | If OpenAI | — | OpenAI API key |
| `ANTHROPIC_API_KEY` | If Anthropic | — | Anthropic API key |
| `AI_DEFAULT_MODEL` | No | `gpt-4.1-mini` | Model to use for generation |
| `ARIA_MAX_SOURCE_TOKENS` | No | `8000` | Max tokens from source context |
| `SUPABASE_HOME_ID` | No | Auto | Tenant home ID |

## Tests

Test suite: `src/lib/aria-studio/__tests__/`

- `ai-provider.test.ts` — Provider config and stub generation
- `evidence.test.ts` — Evidence scoring and confidence calculation
- `prompts.test.ts` — Prompt construction and framework/tone inclusion
- `quality-check.test.ts` — Quality check detection (filler, dignity, evidence)

Run: `npx vitest run src/lib/aria-studio/__tests__/`
