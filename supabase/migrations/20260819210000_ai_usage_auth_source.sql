-- ═════════════════════════════════════════════════════════════════════════════
-- AI usage: record HOW each model call was authenticated.
--
-- "api_key"      — pay-per-token Anthropic API credits (the default, and the
--                  honest value for every historical row).
-- "subscription" — the owner's own Claude Max login via the Agent SDK
--                  (local/self-host only). These calls cost £0 in API terms
--                  but are NOT free: they consume the owner's Max usage
--                  limits, so tokens are still recorded and cost_gbp is 0.
--
-- The audit trail must never claim an API spend that didn't happen — and
-- never hide that a model was used. This column is how both stay true.
-- ═════════════════════════════════════════════════════════════════════════════

alter table ai_usage
  add column if not exists auth_source text not null default 'api_key'
  check (auth_source in ('api_key', 'subscription'));
