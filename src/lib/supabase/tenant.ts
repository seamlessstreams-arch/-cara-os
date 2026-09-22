/** The tenant this deployment serves.
 *
 *  Four write-through helpers had already each declared their own private copy
 *  of this (cara-persist, care-records, calendar-persist, and — after this
 *  change — incident-persist). It is one fact about the deployment, so it gets
 *  one home. The other three are left alone here: moving them is a no-behaviour
 *  change that belongs in its own commit.
 *
 *  The fallback is a dev placeholder, not a real home. On the live tenant
 *  SUPABASE_HOME_ID is set and the fallback never fires — verified against
 *  production: every row in notifications, calendar_events, young_people and
 *  incidents carries the real home id, and none carries the placeholder.
 */
export function tenantHomeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}
