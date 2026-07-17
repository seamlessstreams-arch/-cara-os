# Going live — the Supabase activation runbook

This takes a fresh Supabase project and one Vercel project to a **live Cara
tenant**: real database, real sign-in, seeds emptied, your company and home
provisioned, you signed in as the master admin. Budget 30–45 minutes.

Every step here is the operator's to run — these involve your credentials
(database password, service-role key, auth passwords), which only you should
hold. Cara's assistant prepared and verified this sequence against the code but
cannot and will not run it for you.

The in-app status page for durable storage is `/data-persistence`
(Settings → Data Persistence); it shows live row counts once connected.

---

## Hard rules — read before touching anything

1. **Use a separate Vercel project for the live tenant.** Setting these keys on
   the public demo project turns the demo into an empty live system for
   everyone who visits it. The demo keeps its own project, untouched.
2. **Set environment variables by hand in Vercel.** Do **not** add the
   Supabase↔Vercel marketplace *integration resource* — a suspended
   integration resource has previously failed every deploy on this repo until
   it was disconnected. Manual env vars have no such failure mode.
3. **`SUPABASE_SERVICE_ROLE_KEY` is server-only.** Never prefix it
   `NEXT_PUBLIC_`, never paste it into client code or a browser, never commit
   it. Anything named `NEXT_PUBLIC_*` is shipped to every visitor's browser.
4. **`NEXT_PUBLIC_CARA_MODE=live` is the seed switch, and it is baked in at
   build time.** Set it before you deploy; changing it later means redeploying.
   Anything other than exactly `live` (unset, "demo", a typo) keeps the seeded
   demo — the safe default, and deliberate: going live is a decision, not a
   side effect of configuring a key.

---

## 0 · Preflight

- **Supabase CLI**: `supabase --version` — use ≥ 2.81 (`db query` needs
  ≥ 2.79.0, `db advisors` ≥ 2.81.3). If a flag below errors, check
  `supabase <cmd> --help`; the CLI moves quickly.
- **Project ref**: Supabase Dashboard → *Project Settings → General →
  Reference ID*. **Do not trust `supabase/config.toml`'s `project_id`** — it
  can point at an older project. Pass `--project-ref` explicitly.
- You need: Supabase owner access, the **database password** (set at project
  creation; resettable under *Project Settings → Database*), and Vercel access.
- Region: pick an EU region for UK children's data.

## 1 · Schema — apply the migration chain

```bash
npx supabase link --project-ref <REF>        # prompts for the DB password
npx supabase migration list --linked         # what's applied vs pending
npx supabase db push --dry-run               # review what will run
npx supabase db push                         # applies the numbered chain 001 … 424
```

Notes, in the order you'll wonder about them:

- The chain is additive and guarded (`create table if not exists`, `DO`
  blocks) — re-running is safe.
- **421 + 423 are the RLS hardening** from the security audit: RLS enabled on
  every public table, and the policies that were silently public scoped to
  `authenticated`. The app itself queries as `service_role` and is unaffected;
  RLS is what protects the browser-visible keys.
- **424 adds the `super_admin` role value.** Without it the master-admin seat
  in step 2 is rejected by the database enum and `/hq` is unreachable for
  everyone.
- Afterwards run the advisors — Dashboard → *Advisors*, or
  `npx supabase db advisors` — and clear anything at security level before
  continuing.

## 2 · The master admin — one SQL block

**2a.** Dashboard → *Authentication → Users → Add user*: your email + a strong
password. Copy the new user's **UUID**.

**2b.** SQL Editor — fill in every `<angle>` value, then run:

```sql
-- Company + first home + your master-admin seat, linked to your auth user.
with org as (
  insert into organisations (id, name, plan, primary_contact_name, primary_contact_email, first_home_name)
  values ('org_main', '<Company Ltd>', 'pilot', '<Your Name>', '<you@company.co.uk>', '<Home Name>')
  returning id
), home as (
  insert into homes (name, address, ofsted_urn, max_beds, org_id)
  select '<Home Name>', '<Full postal address>', null, 4, org.id from org
  returning id
)
insert into staff_members
  (home_id, first_name, last_name, email, role, job_title, start_date, auth_user_id)
select home.id, '<First>', '<Last>', '<you@company.co.uk>',
       'super_admin', 'Registered Manager', current_date, '<AUTH_USER_UUID>'
from home
returning home_id as supabase_home_id, id as staff_id;
```

**Copy the `supabase_home_id` from the result — step 3 needs it.**

How sign-in works from here: the login page authenticates against Supabase
Auth; every API request then resolves the session and looks up the
`staff_members` row whose `auth_user_id` matches. No matching row ⇒ 401. The
row above *is* that link.

Optional, for the RLS-side platform policies from migration 414 (platform
admins operate on metadata only — counts, usage, billing; no 414 policy grants
access to children's record content, and break-glass records intent without
opening any data):

```sql
insert into platform_admins (user_id, full_name)
values ('<AUTH_USER_UUID>', '<Your Name>');
```

## 3 · The tenant deployment — a new Vercel project

Create a **new** Vercel project (e.g. `cara-<company>`) importing this same
repository. Before the first deploy, set these under
*Settings → Environment Variables → Production*:

| Variable | Value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key | Current key naming. The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` also works — the code falls back — but one of the two must be set; browser sign-in and server session resolution both need it |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **Server-only. Never `NEXT_PUBLIC_`.** Its presence (with the URL) is what activates Supabase mode |
| `NEXT_PUBLIC_CARA_MODE` | `live` | Empties every seeded collection and blanks the demo home identity at build time |
| `SUPABASE_HOME_ID` | uuid from step 2b | Which `homes` row this deployment serves — one home per deployment |

Optional:

| Variable | Value | Notes |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | your key | Every AI feature degrades deterministically without it — the app is fully usable with no key at all |
| `CARA_CRON_ENABLED` | `true` | Lets the scheduled-jobs endpoint run reminder/escalation sweeps via Vercel cron |
| `CARA_*_WRITE` flags | `1` | The newer write paths (doc versioning, voice follow-through, shift lifecycle, circles, help reflections…) ship dark and opt in per flag — enable them deliberately, one at a time |

Deploy.

## 4 · Verify — the sign-off checklist

Run these against `https://<tenant-domain>`; expected result underneath.

```bash
# 1. The deployment answers, and it is the build you just shipped
curl -s https://<tenant>/api/v1/health-check | python3 -m json.tool | head -20
#    → status ok; data.build.commit = the deployed commit (first 9 chars)

# 2. Auth is ENFORCED — no session means 401, not demo data
curl -s https://<tenant>/api/v1/staff
#    → {"error":"Unauthorized","detail":"A valid authenticated session is required."}
```

Then in a browser:

3. `/` renders the **marketing site** (public, by design).
4. `/auth/login` → sign in with the auth user from 2a.
5. The sidebar shows **your home's name** from step 2b — not blank, and not
   the demo home's name.
6. `/young-people` is **empty**. A brand-new home has no children; seeded demo
   children here means `NEXT_PUBLIC_CARA_MODE` is not exactly `live`.
7. `/data-persistence` reads **Durable** and the probe shows live row counts.
8. `/hq/customers` loads (super_admin-only) and lists `<Company Ltd>`.
9. **Cold-start persistence proof**: create a record in a durable area (a task
   is easiest), Vercel → *Redeploy*, confirm the record survived. In-memory
   data does not survive a redeploy; your database does.

**Honest scope note.** Durable coverage is exactly the `/data-persistence`
matrix, sourced from `src/lib/persistence-manifest.ts`. Features outside it
still hold their data per serverless instance even in live mode — fine to
trial, but do not treat those areas as the system of record until their tables
land. The matrix is the truth; this document does not restate it.

## 5 · Subsequent customers and homes

`/hq/customers → Provision` writes real `organisations` + `homes` rows (and
fails loudly if the database write fails — no phantom customers). For each new
home: a new Vercel project pointed at that home's uuid via `SUPABASE_HOME_ID`,
same env recipe as step 3.

Manager sign-in provisioning is deliberately manual for now (creating
credentials from the HQ page with no delivery mechanism would be theatre):
repeat step 2a for the manager's email, then link them —

```sql
update staff_members set auth_user_id = '<THEIR_AUTH_UUID>'
where email = '<manager@company.co.uk>';
```

— or insert their row as in 2b with `role = 'registered_manager'` and their
home's id.

## Rollback

- **Tenant misbehaving**: Vercel → roll back to the previous deployment. Your
  data is in your database, not the deployment.
- **Back to demo**: remove `NEXT_PUBLIC_CARA_MODE` and redeploy — that
  deployment reverts to the seeded demo without touching your tables.
- The public demo project is unaffected by all of this, throughout.

## Troubleshooting

- **Sign-in succeeds but every page/API call is 401** → the server-side
  session resolver needs the publishable/anon key too. Ensure the deploy
  includes the shared key fallback (shipped alongside this runbook) and that
  one of `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set — then redeploy (they are
  `NEXT_PUBLIC_`, so build-baked).
- **`staff_members` insert rejected: invalid input value for enum** →
  migration 424 has not been applied; re-run step 1.
- **Provisioned customer vanishes later** → you are reading an in-memory copy
  on a recycled instance; the DB-backed list is `/api/v1/hq/customers`, which
  reports a read failure rather than rendering an empty list.
- **Every deploy suddenly failing** → check for a suspended marketplace
  integration resource on the Vercel project and remove the *resource* (keep
  the env vars — they are yours, set by hand).
- **Seeded children visible on a live tenant** → `NEXT_PUBLIC_CARA_MODE` is
  not exactly the string `live` on the *Production* environment, or the deploy
  predates the variable. Fix and redeploy.
