-- ═════════════════════════════════════════════════════════════════════════════
-- CARA — private object-storage bucket for uploaded documents
--
-- The SmartUpload flow stores small files inline (base64 on the documents row,
-- capped ~3 MB by the serverless request-body limit). This bucket is the real
-- object storage for larger files: the server issues a signed upload URL and
-- the browser uploads directly to the bucket, so the file never transits a
-- serverless function.
--
-- Access posture (deliberate):
--   • public = false — objects are NEVER web-addressable directly.
--   • NO storage.objects policies for anon/authenticated — with RLS enforced
--     and zero policies those roles can do nothing here. The app talks to
--     storage as service_role (bypasses RLS), and browser uploads/downloads
--     carry their own per-object signed-URL tokens, which do not depend on
--     role policies. Adding role policies would only widen the surface.
--   • 25 MB object cap, mirroring the client-side cap.
-- ═════════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit)
values ('cara-documents', 'cara-documents', false, 26214400)
on conflict (id) do nothing;
