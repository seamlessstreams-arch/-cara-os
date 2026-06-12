# Switching Cara to durable storage (Supabase activation)

Cara ships running on a seeded **in-memory store**: perfect for the demo, but changes reset on every redeploy or serverless instance recycle. Durable mode writes every covered record to your own Supabase project as it's created — with row-level security, audit fields and the manager-review constraints baked into the schema.

**Live status, coverage matrix and this runbook are always available in-app at `/data-persistence`** (Settings → Data Persistence).

## What you need
- A Supabase account (free tier is fine to start; pick an EU region for UK data).
- Access to the Vercel project's environment variables.
- ~20 minutes.

> Cara's assistant cannot do these steps for you: they involve your credentials, which only you should hold. Nothing here is ever exposed to the browser — the service-role key is server-side only.

## Steps

### 1. Create the Supabase project
supabase.com → **New project**. Note the **Project URL**, **anon key** and **service_role key** (Settings → API).

### 2. Apply the migrations — in numeric order
The schema lives in `supabase/migrations/001_… → 412_…` and is strictly additive.

Option A (CLI):
```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Option B (dashboard): SQL Editor → run each file in numeric order. They are idempotent (`create table if not exists`, guarded DO blocks), so re-running is safe.

### 3. Set the environment variables in Vercel (Production)
```
NEXT_PUBLIC_SUPABASE_URL=<your project url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>      # server-side only, never logged
NEXT_PUBLIC_SUPABASE_ENABLED=true
SUPABASE_HOME_ID=<uuid of your home row>          # optional; defaults to the demo home id
```

### 4. Redeploy
Any merge to main (or Vercel → Redeploy) bakes the env in. `/data-persistence` flips to **Durable**, and the live probe shows row counts from your tables.

## What persists once durable mode is on
The authoritative list is the in-app matrix (`/data-persistence`) — sourced from `src/lib/persistence-manifest.ts`. Headlines:

- **Care records**: daily logs, care forms, young-people profiles, medications, tasks — write-through live.
- **Safeguarding**: incidents — write-through live. Incident Mode sessions have schema ready (migration 409); wiring is on the roadmap.
- **Workforce & comms**: comms channels/messages/receipts, sign-in verifications, emergency alerts — write-through live.
- **Cara Studio & AI**: every generated output, every manager review decision, every AI run, every guardrail event — write-through live (migrations 411–412), including the no-self-approval database constraint.
- **System**: the sensitive-action audit log.

Entities still marked in-memory are listed honestly in the matrix with their planned tables.

## Audit trail map
- Record-level: author, timestamps and change fields on every table.
- AI: `cara_ai_runs` (who/child/module/flags/model) + `cara_guardrail_events` (every safety flag and the action taken).
- Review: `cara_studio_outputs.reviewed_by / reviewed_at / review_note` — the DB refuses self-approval.
- Sensitive actions: `audit_logs` via `writeAuditLog()`.

## Cara HQ (platform owner) bootstrap
Migration 414 adds the platform-owner layer: `organisations` (customers),
`platform_admins`, `usage_events`, `ai_usage` and `break_glass_grants`.

**Safeguarding boundary:** platform admins operate on metadata only — counts,
usage, billing, health. No policy in 414 grants access to children's record
content, and break-glass records intent without opening any data.

To become the first platform admin:
1. Run migration `414_platform_hq.sql` with the rest of the chain.
2. Supabase Dashboard → Authentication → **Add user** (your own email), and
   copy the new user's UUID.
3. In the SQL editor, run:
   ```sql
   insert into platform_admins (user_id, full_name)
   values ('<YOUR_AUTH_USER_UUID>', 'Owner — Pain Point Resolutions Ltd');
   ```

The HQ cockpit lives at `/hq` (overview, customers, AI usage & cost). AI calls
meter themselves into `ai_usage` automatically; costs are estimates for margin
watching, not billing. Manager sign-in provisioning (auth users + temporary
passwords) deliberately waits for the Supabase Auth login flow — until then,
provisioning records the customer organisation and manager contact.
