@AGENTS.md

---

## CORE OUTCOME

Cornerstone is the operational and compliance backbone of a children's home.

It exists to protect children, support staff, strengthen management oversight, reduce duplication of recording, surface evidence automatically, keep Regulation 45 current, keep Annex A inspection-ready, and preserve a complete, tamper-evident audit trail.

Every feature built must serve this outcome. Features must not exist as disconnected forms, static prototypes or demo-only displays. Everything must connect to the live record of the home.

The system must be safe enough for use in a real children's home today.

---

## PRODUCTION-READY LIVE UPDATE REQUIREMENT

This must be built as a production-ready live updating system, not a static prototype, demo-only feature or disconnected form builder.

Cornerstone must update connected records, dashboards, reports and evidence banks in real time or near real time when verified information changes.

When a staff member creates, submits, edits, verifies, returns, signs or locks a Care Event, the system must automatically and safely update all relevant connected areas, including:

- daily running log
- child daily records
- child daily summaries
- incidents
- missing episodes
- restraint/physical intervention records
- health records
- medication records
- education records
- family contact records
- professional contact records
- complaints, requests, wishes and feelings records
- safeguarding records
- risk assessment review tasks
- behaviour plan review tasks
- follow-up tasks
- management oversight queue
- Regulation 40 triage queue
- Regulation 44 evidence
- Regulation 45 evidence bank
- Regulation 45 suggested updates queue
- Annex A evidence bank
- Annex A readiness dashboard
- filing cabinet
- audit trail
- saved-time dashboard
- inspection readiness dashboard

The system must use a proper live update architecture.

Implement using the existing project stack and patterns. If the project uses Supabase, use Supabase Realtime, Postgres triggers, server actions, subscriptions or polling fallback where appropriate. Do not expose secrets client-side.

### LIVE UPDATE BEHAVIOUR

**When a Care Event is created:**

1. Save the source event transactionally.
2. Classify the event.
3. Generate evidence prompts.
4. Show routing preview.
5. Create draft linked records where required.
6. Create tasks where required.
7. Update dashboards.
8. Add provisional evidence to Regulation 45 and Annex A suggested evidence queues where relevant.
9. Audit all actions.

**When a Care Event is submitted:**

1. Validate required evidence.
2. Confirm staff signature.
3. Create or update routed records.
4. Update child daily summaries.
5. Update management oversight queue.
6. Update Regulation 45 suggested evidence.
7. Update Annex A suggested evidence.
8. Update filing cabinet indexing.
9. Update saved-time metrics.
10. Audit all changes.

**When a manager verifies a record:**

1. Lock the verified version.
2. Push verified evidence into approved evidence banks where appropriate.
3. Update Regulation 45 report builder suggestions.
4. Update Annex A readiness score.
5. Update Regulation 44/45/inspection dashboards.
6. File the verified record automatically.
7. Prevent silent overwrite.
8. Audit verification and signature.

**When a record is returned:**

1. Mark the record as returned.
2. Record manager comments.
3. Notify relevant staff in-app.
4. Remove or pause unapproved evidence from final report outputs.
5. Keep all existing draft evidence visible but clearly marked as unverified.
6. Audit the return action.

**When a record is amended:**

1. Create a new version.
2. Keep the original verified record preserved.
3. Require amendment reason.
4. Recalculate affected summaries and evidence suggestions.
5. Show the difference between old and new information.
6. Require manager review if the amendment affects safeguarding, incident, Regulation 40, Regulation 45 or Annex A evidence.
7. Audit the amendment.

**When a record is locked:**

1. Prevent direct editing.
2. Allow only formal amendments.
3. Preserve full version history.
4. Preserve source links.
5. Preserve report/evidence links.
6. Preserve export history.

---

### DATA SAFETY AND CONSISTENCY

Use database transactions where multiple records are created from one Care Event.

The system must be idempotent.

If the same Care Event is processed twice, it must not create duplicate incidents, duplicate tasks, duplicate child daily summaries, duplicate filing cabinet items or duplicate Regulation 45/Annex A evidence items.

Use unique keys where appropriate, such as:

- `care_event_id + route_type`
- `care_event_id + child_id + summary_date`
- `care_event_id + task_type`
- `care_event_id + evidence_bank_type`
- `care_event_id + filing_category`

Add safe retry behaviour for failed routing jobs.

If routing partially fails, the system must:

1. Preserve the source Care Event.
2. Mark failed routes clearly.
3. Show the failure to authorised users.
4. Allow retry.
5. Avoid duplicate records.
6. Audit the failure.
7. Never lose the original staff entry.

---

### BACKGROUND JOBS AND QUEUES

Where live updates are heavy, use a background job or queue pattern.

Examples of work that may need background processing:

- generating Regulation 45 summaries
- generating Annex A snapshots
- updating inspection readiness bundles
- recalculating pattern analysis
- producing PDFs
- exporting evidence packs
- rebuilding filing cabinet indexes
- generating saved-time metrics

The user interface must show processing states:

- pending
- processing
- completed
- failed
- retry required

Do not block staff from saving critical safeguarding or daily records because a report update is taking time.

---

### VALIDATION

Add strong validation at both client and server level.

Validation must cover:

- required fields
- date/time validity
- home access
- child access
- staff permissions
- category validity
- evidence prompt completion
- manager review requirement
- Regulation 40 triage requirement
- signature requirement
- locked record protection
- amendment reason
- export permission

Never rely only on client-side validation.

---

### PERMISSIONS AND ROW LEVEL SECURITY

Ensure production-grade permissions.

The system must enforce:

- role-based access
- home-based access
- child-based access
- least privilege
- restricted access to Regulation 45
- restricted access to Annex A
- restricted access to safeguarding records
- restricted access to staff records
- restricted export permissions
- restricted deletion/archiving permissions

If using Supabase, implement or update Row Level Security policies.

Staff must not be able to access records for children or homes they are not authorised to view.

Managers must only verify records they are authorised to manage.

Responsible Individual users must have oversight access according to their role.

---

### AI SAFETY

ARIA suggestions must be stored separately from human-approved records.

Use separate fields or tables for:

- AI suggested summary
- AI suggested category
- AI suggested routing
- AI suggested Regulation 45 evidence
- AI suggested Annex A evidence
- AI suggested actions
- human-approved final wording
- human-approved final category
- human-approved final routing
- manager-approved evidence

Never allow AI output to silently become a final statutory record without human confirmation.

---

### REGULATION 45 LIVE UPDATE RULE

Regulation 45 must be live-updating, but not auto-finalising.

When relevant verified records are created, the system should update the Regulation 45 evidence bank and suggested report sections.

The final Regulation 45 wording must only change when the manager accepts, edits or approves the suggested update.

The Regulation 45 report builder must show:

- new evidence since last review
- evidence awaiting approval
- evidence already accepted
- evidence rejected
- evidence deferred
- source record links
- themes and patterns
- impact on children
- suggested actions
- manager decision history

---

### ANNEX A LIVE UPDATE RULE

Annex A must be continuously inspection-ready, but not auto-submitted.

When relevant verified records are created, the system should update the Annex A evidence bank and readiness dashboard.

The Annex A readiness panel must show:

- current completion score
- missing information
- stale information
- unverified information
- children's current information
- staff current information
- incidents in period
- complaints in period
- missing episodes in period
- restraints in period
- Regulation 40 notifications in period
- Regulation 44 reports in period
- Regulation 45 reports in period
- required documents
- evidence links
- export readiness

The system must allow managers to generate a point-in-time Annex A inspection snapshot.

---

### OBSERVABILITY AND ERROR HANDLING

Add production-grade observability.

Log important system events, including:

- care event created
- care event routed
- route failed
- route retried
- evidence prompt completed
- manager review completed
- record verified
- record locked
- Regulation 45 evidence suggested
- Regulation 45 evidence accepted/rejected
- Annex A evidence suggested
- Annex A snapshot generated
- export generated
- permission denied
- validation failed

Errors must be clear, safe and useful. Do not expose sensitive data in logs or client-side errors.

---

### TESTING REQUIREMENTS

Add tests for:

- Care Event creation
- routing engine
- duplicate prevention
- child daily summary generation
- incident creation from daily log
- missing episode workflow
- restraint workflow
- management oversight review
- Regulation 40 triage
- Regulation 45 suggested evidence update
- Annex A readiness update
- filing cabinet auto-filing
- audit trail creation
- locked record protection
- amendment/versioning
- role permissions
- failed route retry
- export permissions

Add demo data showing live updates across the system.

---

### MIGRATION SAFETY

Create safe migrations.

Migrations must:

- avoid destructive changes unless absolutely required
- preserve existing data
- backfill where possible
- add indexes for performance
- add constraints for data integrity
- add foreign keys where appropriate
- add RLS policies where appropriate
- include rollback notes where sensible

---

### PERFORMANCE REQUIREMENTS

The live update system must be efficient.

Add indexes for:

- `care_event_id`
- `home_id`
- `young_person_id`
- `shift_id`
- `category`
- `status`
- `created_at`
- `verified_at`
- `locked_at`
- `contributes_to_reg45`
- `contributes_to_annex_a`
- `requires_manager_review`
- `requires_reg40_triage`
- filing cabinet category
- evidence bank type

Avoid slow dashboard queries. Use pagination, filtering and server-side querying for large record sets.

---

### PRODUCTION UI REQUIREMENTS

The UI must clearly show live status.

Use clear status indicators such as:

- draft
- submitted
- routing
- routed
- manager review required
- returned
- verified
- locked
- evidence suggested
- evidence approved
- evidence rejected
- Annex A updated
- Regulation 45 updated
- filing complete
- routing failed

Users must be able to see what happened after submitting an entry.

Example: *"This entry updated 5 records, created 3 tasks, added 2 Regulation 45 evidence suggestions, updated Annex A readiness and filed the record automatically."*

---

### FINAL STANDARD

The finished system must be safe enough for live operational use in a children's home.

It must not behave like a prototype.

It must protect records, protect children's information, support staff, strengthen management oversight, reduce duplication, update evidence live, keep Regulation 45 current, keep Annex A inspection-ready and preserve a complete audit trail.

Do not stop at a plan. Build the production-ready live update system properly.
