# Cornerstone Intelligence Layer

Ten integrated modules that transform Cornerstone from a forms/dashboard system into a live intelligence platform. Every module works without an AI API key — deterministic logic handles the core, with optional LLM enrichment via ARIA when configured.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI PAGES                              │
│  Manager Control Centre · Ofsted Evidence Room · Progress    │
│  Reg 44 · Reg 45 · Learning Review · ARIA Oversight         │
│  Smart Links · Competence Passport · Voice · Provider        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      API ROUTES                              │
│  /api/intelligence/{attention-items,evidence,progress,       │
│   smart-links,voice,learning-review,humanised-oversight}     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   SERVICE LAYER                               │
│  evidence-gap-scanner · smart-linking · competence-warnings  │
│  humanised-oversight · audit                                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│               DATABASE (Supabase + RLS)                       │
│  015_intelligence_layer_schema.sql — 17 tables               │
└─────────────────────────────────────────────────────────────┘
```

---

## Modules

### 1. Registered Manager Control Centre
**Route:** `/dashboard/manager-control-centre`
**API:** `GET/POST/PATCH /api/intelligence/attention-items`

Surfaces items requiring manager action: incident oversight, missing key work, training gaps, complaints, Reg 44 actions. Filters by urgency, category, status. Items can be reviewed, escalated to RI, or closed.

### 2. Ofsted Evidence Room
**Route:** `/quality/ofsted-evidence-room`
**API:** `GET/POST /api/intelligence/evidence`

Collects and organises inspection evidence by Ofsted judgement area. Includes the evidence gap scanner which identifies missing evidence deterministically (no AI). Evidence packs can be assembled for inspection preparation.

### 3. Child Progress & Outcomes Engine
**Route:** `/children/progress`
**API:** `GET/POST /api/intelligence/progress` (query param `type=goals|entries|snapshots`)

Tracks goals (SMART format), progress entries linked to goals, and periodic outcome score snapshots across 7 domains (education, health, emotional wellbeing, safety, relationships, independence, engagement).

### 4. Regulation 44/45 Quality Assurance Builder
**Routes:** `/quality/reg-44`, `/quality/reg-45`

Reg 44: Monthly independent person visit tracker with action items, completion tracking, and evidence linking.
Reg 45: Six-monthly quality of care review builder with evidence panels, multi-source input, and approval workflow.

### 5. Incident-to-Learning Loop
**Route:** `/incidents/learning-review`
**API:** `GET/POST/PATCH /api/intelligence/learning-review`

Structured post-incident learning reviews. Captures trigger analysis, what worked/didn't, impact on child, and generates follow-up actions. "NFA" requires documented rationale. Manager approval workflow.

### 6. ARIA Humanised Oversight
**Route:** Pre-existing ARIA hub at `/intelligence/aria/`
**API:** `POST /api/intelligence/humanised-oversight`

Generates draft management oversight in a warm, evidence-based tone. Falls back to a structured template when no AI provider is configured. Every output is marked as a draft requiring manager approval.

### 7. Cross-System Smart Linking
**API:** `GET/POST /api/intelligence/smart-links`

Rule-based suggestion engine. When a record is created, suggests related records to link (e.g., incident → risk assessment, key work → child voice, complaint → evidence room). No AI dependency.

### 8. Staff Competence Passport
**Route:** `/staff/competence-passport`

Single-view staff readiness dashboard. Shows DBS status, training, supervision, restrictions, and shift eligibility. The competence warnings engine flags issues (expired DBS, overdue supervision, cannot lead shift).

### 9. Voice of the Child Portal
**Route:** `/children/voice`
**API:** `GET/POST /api/intelligence/voice`

Captures the child's words, wishes, and feelings in categorised entries. Designed for Ofsted evidence of "listening to children." Categories: wishes & feelings, complaints, compliments, activities, education, health, etc.

### 10. RI / Provider Oversight Dashboard
**Route:** `/dashboard/provider-oversight`

Multi-home view for Responsible Individuals. Per-home metrics, risk flags, Reg 44/45 compliance status, and escalation actions.

---

## Key Design Principles

1. **ARIA never replaces manager judgement.** All ARIA outputs require human approval (`requiresManagerApproval: true` — enforced at type level).

2. **Works without AI.** Core logic (evidence gaps, smart links, competence warnings, fallback oversight) is deterministic. The system degrades gracefully when no API key is present.

3. **Capture once, link intelligently, surface everywhere.** Records are created in one place and linked across modules via smart linking. The same incident appears in the control centre, evidence room, learning review, and child progress timeline.

4. **Audit everything.** Every mutation writes to `intelligence_audit_log` via `writeIntelligenceAudit()`. 26 action types tracked.

5. **RLS on every table.** Row-level security enabled on all 17 tables. Policies enforce home-level data isolation.

---

## Service Layer

### Evidence Gap Scanner
`src/lib/intelligence/evidence-gap-scanner.ts`

Deterministic scanner identifying 12 gap types:
- `no_recent_key_work` — >14 days since last key work
- `no_child_voice` — >30 days since last voice entry
- `incident_no_oversight` — incident >2 days without oversight
- `incident_no_follow_up` — incident >5 days without follow-up
- `reg44_overdue` — >35 days since last visit
- `reg45_missing` — >180 days since last review
- `risk_not_reviewed` — risk assessment not reviewed post-incident
- `placement_plan_stale` — >90 days since update
- `supervision_overdue` — past frequency threshold
- `training_expired` — past expiry date
- `complaint_not_closed` — open >28 days
- `repeated_pattern_no_review` — pattern without learning review

### Smart Linking
`src/lib/intelligence/smart-linking.ts`

Rule-based per source type: incident, key_work, complaint, training_gap, supervision, daily_log, reg44_visit, missing_from_care. Each returns an array of `SmartLinkSuggestion` with target type, relationship, reason, and auto-link flag.

### Competence Warnings
`src/lib/intelligence/competence-warnings.ts`

Checks: shift lead eligibility, medication competency, lone working, DBS status/renewal, supervision frequency, mandatory training, safeguarding refresher, probation review, induction completion, active restrictions.

### Audit
`src/lib/intelligence/audit.ts`

Writes to `intelligence_audit_log`. No-ops silently when Supabase is not configured. 26 action types covering all CRUD and workflow transitions.

---

## Database

Migration: `supabase/migrations/015_intelligence_layer_schema.sql`

Tables:
- `manager_attention_items`
- `inspection_evidence_items`
- `inspection_evidence_links`
- `inspection_evidence_packs`
- `child_progress_goals`
- `child_progress_entries`
- `child_outcome_snapshots`
- `reg44_visits`
- `reg44_actions`
- `reg45_reviews`
- `reg45_evidence_links`
- `incident_learning_reviews`
- `smart_record_links`
- `staff_competence_records`
- `child_voice_entries`
- `provider_home_summaries`
- `intelligence_audit_log`

---

## Tests

```bash
npm test
```

4 test suites, 43 tests:
- Evidence gap scanner (14 tests)
- Smart linking (11 tests)
- Competence warnings (13 tests)
- Humanised oversight fallback (5 tests)

---

## Navigation

All module pages are wired into `src/config/navigation.ts`:
- Today → Manager Control Centre, Provider Oversight
- Children → Progress Engine, Voice Portal, Incident Learning
- Team → Competence Passport
- Compliance → Ofsted Evidence Room, Reg 44 Builder, Reg 45 Builder
