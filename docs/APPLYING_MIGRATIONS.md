# Applying migrations to live

Cara's live database (Supabase project **`ymmfeiwqhxvnjbullxdv`**, Oak House) applies
migrations **manually**. Merging a migration to `main` ships the *code* — it does **not**
create the table on live. Until the SQL is applied, the feature honestly answers
*"storage not set up"* (`ok:false`, `PGRST205 … not found in the schema cache`).

This is how the **storage-tables promotion** works: migrations live in
`supabase/migrations_archive/`, get promoted into `supabase/migrations/` (+ dropped from
`scripts/storage-tables-baseline.json`, enforced by `scripts/check-storage-migrations.js`),
and are then applied to live with the steps below.

## Steps

1. Open the SQL editor for the live project:
   **https://supabase.com/dashboard/project/ymmfeiwqhxvnjbullxdv/sql/new**
2. Open the **apply-pack file** for the change (a `.sql` file — it starts with a
   `-- ═══…` comment banner and contains `create table if not exists …`).
   **Copy the file's contents** (open it, select-all, copy).
   ⚠️ Do **not** type or paste the *filename* into the editor — that gives
   `syntax error at or near "apply"`. What goes in the editor must start with `--`.
3. Clear the editor (select-all → delete), paste, and **Run**.
4. **★ Restart the project** — Dashboard → **Settings → General → Restart project** —
   **after every apply**. This project does **not** reload the PostgREST schema cache on
   `NOTIFY pgrst`; only a restart does. Without it the new tables stay invisible
   (`PGRST205`) even though they were created — *even if an earlier batch in the same
   session already shows up.*

The apply-packs are idempotent (`create table if not exists`, `create index if not
exists`, drop-then-create policy, `DO $$ … EXCEPTION … END $$`), so re-running one is safe.

## Verifying it landed

Anon-probe from a shell (reads `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` from
`.env.local`) — `200` = live & cache-reloaded, `404 PGRST205` = absent or not restarted:

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  "$URL/rest/v1/<table>?limit=1" -H "apikey:$KEY" -H "Authorization: Bearer $KEY"
```

End-to-end, hit the feature's endpoint as a signed-in session and expect `ok:true`
(not `ok:false "storage not set up"`), e.g. `/api/operations/<feature>?homeId=<id>`.

Catalog check (does the table *exist*, independent of the PostgREST cache) — run in the
SQL editor when a `404` is ambiguous between "not created" and "cache stale":

```sql
select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('cs_x', 'cs_y');
```

If it's in the catalog but still `404` on the API → restart the project (step 4).

## Notes

- Promote **PURE** families only: each migration file creates only baseline tables,
  FKs resolve to already-live tables (`homes`) or itself, `home_id` is `uuid` (matches
  `get_my_home_id()`), and there is no `cs_homes` phantom FK. Classify PURE-vs-MIXED
  before moving — a MIXED file drags unrelated tables in.
- Baseline count after a promotion should drop by exactly the number of tables promoted;
  `scripts/check-storage-migrations.js` names the baselined tables that now have a
  migration — remove exactly those.
