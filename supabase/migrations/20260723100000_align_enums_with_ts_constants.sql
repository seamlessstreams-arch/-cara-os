-- ─────────────────────────────────────────────────────────────────────────
-- Enum alignment: values the app's TS constants offer but the live enums lack.
-- The class this fixes (found live): the upload modal / documents UI offers the
-- full DOCUMENT_CATEGORIES list, but the baseline document_category enum has
-- only 10 members — inserting 'placement_plan' (a referral) failed 22P02 and
-- the upload 500'd. Additive only: ALTER TYPE ... ADD VALUE IF NOT EXISTS for
-- every TS-constant value missing from its enum. DB-only extra values are
-- harmless and kept.
-- ─────────────────────────────────────────────────────────────────────────

alter type care_form_status add value if not exists 'pending_review';
alter type care_form_type add value if not exists 'behaviour_record';
alter type care_form_type add value if not exists 'contact_log';
alter type care_form_type add value if not exists 'court_report';
alter type care_form_type add value if not exists 'daily_check';
alter type care_form_type add value if not exists 'education_update';
alter type care_form_type add value if not exists 'health_record';
alter type care_form_type add value if not exists 'key_work_session';
alter type care_form_type add value if not exists 'medication_audit';
alter type care_form_type add value if not exists 'missing_person_protocol';
alter type care_form_type add value if not exists 'physical_check';
alter type care_form_type add value if not exists 'placement_review';
alter type care_form_type add value if not exists 'professional_meeting';
alter type care_form_type add value if not exists 'return_from_missing';
alter type care_form_type add value if not exists 'safeguarding_referral';
alter type care_form_type add value if not exists 'supervision_record';
alter type care_form_type add value if not exists 'welfare_check';
alter type document_category add value if not exists 'behaviour_support';
alter type document_category add value if not exists 'contract';
alter type document_category add value if not exists 'dbs_certificate';
alter type document_category add value if not exists 'education_plan';
alter type document_category add value if not exists 'health_plan';
alter type document_category add value if not exists 'missing_protocol';
alter type document_category add value if not exists 'ofsted_correspondence';
alter type document_category add value if not exists 'placement_plan';
alter type document_category add value if not exists 'reg44_report';
alter type document_category add value if not exists 'reg45_report';
alter type document_category add value if not exists 'supervision_record';
alter type document_category add value if not exists 'template';
alter type document_category add value if not exists 'training_certificate';
alter type employment_status add value if not exists 'left';
alter type employment_status add value if not exists 'notice_period';
alter type employment_status add value if not exists 'probation';
alter type employment_type add value if not exists 'fixed_term';
