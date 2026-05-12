# ARIA Studio — Technical Documentation

## Overview

ARIA Studio is a NotebookLM-style intelligence and creative studio purpose-built for children's residential care. It enables Registered Managers, team leaders, and care workers to generate, review, approve, and commit professional documents — all grounded in real evidence and governed by a human-in-the-loop approval workflow.

**Core principle:** ARIA never writes the final record. It drafts. A human always reviews, amends, and approves before anything becomes official.

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
| `aria_studio_sources` | Indexed evidence from across Cornerstone |
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
| ARIA Studio | `/aria-studio` | Main generation interface |
| Home Dynamics | `/aria-studio/home-dynamics` | RM morning dashboard |
| Ofsted Readiness | `/aria-studio/ofsted-readiness` | Inspection readiness view |

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

**Important:** ARIA never makes safeguarding decisions. It surfaces possible patterns for professional review.

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
