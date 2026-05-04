-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — DEVELOPMENT SEED DATA
-- Migration 004 — 2026-04-23
--
-- Deterministic UUIDs for predictable dev/test environments.
-- DO NOT RUN IN PRODUCTION — use real data instead.
--
-- Run: psql $DATABASE_URL < 004_seed_data.sql
-- Or via Supabase dashboard → SQL editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Fixed UUIDs (deterministic for dev) ──────────────────────────────────────

-- Home
\set HOME_ID         'a0000000-0000-0000-0000-000000000001'

-- Staff
\set STAFF_DARREN    'b0000000-0000-0000-0000-000000000001'
\set STAFF_RYAN      'b0000000-0000-0000-0000-000000000002'
\set STAFF_EDWARD    'b0000000-0000-0000-0000-000000000003'
\set STAFF_ANNA      'b0000000-0000-0000-0000-000000000004'
\set STAFF_CHERVELLE 'b0000000-0000-0000-0000-000000000005'
\set STAFF_LACKSON   'b0000000-0000-0000-0000-000000000006'
\set STAFF_DIANE     'b0000000-0000-0000-0000-000000000007'
\set STAFF_MIRELA    'b0000000-0000-0000-0000-000000000008'
\set STAFF_PRIYA     'b0000000-0000-0000-0000-000000000009'
\set STAFF_CALLUM    'b0000000-0000-0000-0000-000000000010'
\set STAFF_TYRESE    'b0000000-0000-0000-0000-000000000011'
\set STAFF_SAM       'b0000000-0000-0000-0000-000000000012'

-- Young People
\set YP_ALEX         'c0000000-0000-0000-0000-000000000001'
\set YP_JORDAN       'c0000000-0000-0000-0000-000000000002'
\set YP_CASEY        'c0000000-0000-0000-0000-000000000003'

-- Medications
\set MED_001         'd0000000-0000-0000-0000-000000000001'
\set MED_002         'd0000000-0000-0000-0000-000000000002'
\set MED_003         'd0000000-0000-0000-0000-000000000003'
\set MED_004         'd0000000-0000-0000-0000-000000000004'

-- ── Home ─────────────────────────────────────────────────────────────────────

insert into homes (id, name, address, phone, ofsted_urn, max_beds, current_occupancy, last_inspection_date, last_inspection_grade)
values (
  :'HOME_ID',
  'Oak House',
  '14 Oakfield Avenue, Derby, DE1 3AA',
  '01332 000001',
  'SC123456',
  3, 3,
  '2025-10-15',
  'Good'
)
on conflict (id) do nothing;

-- ── Staff Members ─────────────────────────────────────────────────────────────

insert into staff_members (id, home_id, first_name, last_name, email, phone, role, job_title, employment_type, employment_status, start_date, contracted_hours, dbs_number, dbs_issue_date, dbs_update_service, next_supervision_due, next_appraisal_due, is_active)
values
  (:'STAFF_DARREN', :'HOME_ID', 'Darren', 'Laville', 'darren.laville@acacia-care.co.uk', '07700 900001', 'registered_manager', 'Registered Manager', 'permanent', 'active', '2020-03-01', 37.5, 'DBS001234', '2024-01-15', true, '2026-06-01', '2026-09-01', true),
  (:'STAFF_RYAN', :'HOME_ID', 'Ryan', 'Forsythe', 'ryan.forsythe@acacia-care.co.uk', '07700 900002', 'deputy_manager', 'Deputy Manager', 'permanent', 'active', '2021-06-01', 37.5, 'DBS001235', '2024-02-01', true, '2026-05-15', '2026-08-15', true),
  (:'STAFF_EDWARD', :'HOME_ID', 'Edward', 'Nduka', 'edward.nduka@acacia-care.co.uk', '07700 900003', 'team_leader', 'Senior Residential Care Worker', 'permanent', 'active', '2022-01-10', 37.5, 'DBS001236', '2024-01-20', true, '2026-05-01', '2026-07-01', true),
  (:'STAFF_ANNA', :'HOME_ID', 'Anna', 'Petrova', 'anna.petrova@acacia-care.co.uk', '07700 900004', 'residential_care_worker', 'Residential Care Worker', 'permanent', 'active', '2022-08-15', 37.5, 'DBS001237', '2024-03-01', false, '2026-04-30', '2026-06-30', true),
  (:'STAFF_CHERVELLE', :'HOME_ID', 'Chervelle', 'Douglas', 'chervelle.douglas@acacia-care.co.uk', '07700 900005', 'residential_care_worker', 'Residential Care Worker', 'permanent', 'active', '2022-11-01', 37.5, 'DBS001238', '2024-03-15', false, '2026-05-15', '2026-07-15', true),
  (:'STAFF_LACKSON', :'HOME_ID', 'Lackson', 'Banda', 'lackson.banda@acacia-care.co.uk', '07700 900006', 'residential_care_worker', 'Residential Care Worker', 'permanent', 'active', '2023-01-16', 37.5, 'DBS001239', '2024-04-01', false, '2026-06-01', '2026-09-01', true),
  (:'STAFF_DIANE', :'HOME_ID', 'Diane', 'Okafor', 'diane.okafor@acacia-care.co.uk', '07700 900007', 'residential_care_worker', 'Residential Care Worker', 'permanent', 'active', '2023-03-06', 37.5, 'DBS001240', '2024-04-15', false, '2026-06-15', '2026-09-15', true),
  (:'STAFF_MIRELA', :'HOME_ID', 'Mirela', 'Voss', 'mirela.voss@acacia-care.co.uk', '07700 900008', 'residential_care_worker', 'Residential Care Worker', 'part_time', 'active', '2023-06-12', 22.5, 'DBS001241', '2024-05-01', false, '2026-07-01', '2026-10-01', true),
  (:'STAFF_PRIYA', :'HOME_ID', 'Priya', 'Sharma', 'priya.sharma@acacia-care.co.uk', '07700 900009', 'residential_care_worker', 'Residential Care Worker', 'bank', 'active', '2023-09-01', 0, 'DBS001242', '2024-05-15', false, '2026-07-15', '2026-10-15', true),
  (:'STAFF_CALLUM', :'HOME_ID', 'Callum', 'Reid', 'callum.reid@acacia-care.co.uk', '07700 900010', 'bank_staff', 'Bank Care Worker', 'bank', 'active', '2024-01-08', 0, 'DBS001243', '2024-06-01', false, null, null, true),
  (:'STAFF_TYRESE', :'HOME_ID', 'Tyrese', 'Morgan', 'tyrese.morgan@acacia-care.co.uk', '07700 900011', 'bank_staff', 'Bank Care Worker', 'bank', 'active', '2024-03-18', 0, 'DBS001244', '2024-06-15', false, null, null, true),
  (:'STAFF_SAM', :'HOME_ID', 'Sam', 'Chen', 'sam.chen@acacia-care.co.uk', '07700 900012', 'admin', 'Administrator', 'part_time', 'active', '2023-10-02', 25, 'DBS001245', '2024-07-01', false, '2026-07-01', '2026-10-01', true)
on conflict (id) do nothing;

-- Update home with manager references
update homes set
  registered_manager_id = :'STAFF_DARREN',
  responsible_individual_id = :'STAFF_DARREN'
where id = :'HOME_ID';

-- ── Young People ─────────────────────────────────────────────────────────────

insert into young_people (id, home_id, first_name, last_name, preferred_name, date_of_birth, gender, ethnicity, religion, placement_start, placement_type, local_authority, social_worker_name, social_worker_phone, social_worker_email, iro_name, iro_phone, key_worker_id, secondary_worker_id, legal_status, risk_flags, dietary_requirements, allergies, gp_name, gp_phone, school_name, school_contact, status)
values
  (
    :'YP_ALEX', :'HOME_ID',
    'Alex', 'Wilson', 'Alex',
    '2008-05-14', 'Male', 'Mixed/White and Black Caribbean', 'None stated',
    '2025-09-01', 'Long-term foster/residential', 'Derby City Council',
    'Tanya Brooks', '01332 111001', 'tanya.brooks@derbycity.gov.uk',
    'Michael Osei', '01332 111002',
    :'STAFF_EDWARD', :'STAFF_ANNA',
    'Section 20 - Accommodation',
    ARRAY['contextual_safeguarding', 'missing_from_care', 'criminal_exploitation_risk'],
    null, '{}',
    'Dr Rachel Chen', '01332 222001',
    'Derby Alternative Provision', 'ap.admin@derby-ap.sch.uk',
    'current'
  ),
  (
    :'YP_JORDAN', :'HOME_ID',
    'Jordan', 'Taylor', 'Jordan',
    '2009-08-22', 'Non-binary', 'Asian/Asian British', 'Islam',
    '2025-11-15', 'Long-term foster/residential', 'Nottinghamshire County Council',
    'David Patel', '0115 222001', 'david.patel@notts.gov.uk',
    'Sarah Quinn', '0115 222002',
    :'STAFF_CHERVELLE', :'STAFF_LACKSON',
    'Full Care Order (Section 31)',
    ARRAY['emotional_dysregulation'],
    'Halal only — no pork products', '{}',
    'Dr James Wright', '0115 333001',
    'Highfields Academy', 'office@highfields-academy.sch.uk',
    'current'
  ),
  (
    :'YP_CASEY', :'HOME_ID',
    'Casey', 'Morgan', 'Casey',
    '2009-11-30', 'Female', 'White British', 'None',
    '2026-01-10', 'Medium-term residential', 'Derbyshire County Council',
    'Fiona Grant', '01629 555001', 'fiona.grant@derbyshire.gov.uk',
    'James Okoro', '01629 555002',
    :'STAFF_RYAN', :'STAFF_DIANE',
    'Full Care Order (Section 31)',
    ARRAY['self_harm_history', 'mental_health'],
    'Vegetarian', ARRAY['penicillin'],
    'Dr Rachel Chen', '01332 222001',
    'Online provision via CAMHS', 'camhs.education@nhs.uk',
    'current'
  )
on conflict (id) do nothing;

-- ── Medications ───────────────────────────────────────────────────────────────

insert into medications (id, home_id, child_id, name, type, dosage, frequency, route, prescriber, pharmacy, start_date, is_active, stock_count, stock_last_checked, side_effects, special_instructions)
values
  (:'MED_001', :'HOME_ID', :'YP_CASEY', 'Melatonin', 'regular', '3mg', 'Once nightly at 21:30', 'Oral', 'Dr Rachel Chen', 'Boots Pharmacy, Derby', '2026-01-15', true, 28, '2026-04-15', 'May cause morning drowsiness', 'Give 30 minutes before planned sleep time. Do not give if Casey is distressed or likely to leave bedroom.'),
  (:'MED_002', :'HOME_ID', :'YP_CASEY', 'Fluoxetine', 'regular', '10mg', 'Once daily at 08:00', 'Oral', 'Dr Rachel Chen', 'Boots Pharmacy, Derby', '2026-02-01', true, 25, '2026-04-15', 'Possible increased anxiety in first 2 weeks, sleep disturbance', 'Must be given with food. Record refusals immediately. Contact prescriber if 3+ consecutive refusals.'),
  (:'MED_003', :'HOME_ID', :'YP_ALEX', 'Ibuprofen', 'prn', '200mg', 'PRN — max 3 times daily, minimum 4 hours apart', 'Oral', 'Dr Rachel Chen', 'Boots Pharmacy, Derby', '2026-03-01', true, 16, '2026-04-10', 'Stomach upset if taken without food', 'Give with food or milk. Document reason and effectiveness for every administration. Do not exceed 3 doses per day.'),
  (:'MED_004', :'HOME_ID', :'YP_JORDAN', 'Chlorphenamine (Piriton)', 'prn', '4mg', 'PRN — max 4 times daily for allergic reaction', 'Oral', 'Dr James Wright', 'Lloyds Pharmacy, Nottingham', '2025-12-01', true, 12, '2026-04-01', 'Drowsiness', 'For allergic reactions only. Document trigger if known. Seek medical advice if symptoms persist or worsen after 30 minutes.')
on conflict (id) do nothing;

-- ── Shifts (current week) ─────────────────────────────────────────────────────

insert into shifts (home_id, staff_id, date, shift_type, start_time, end_time, break_minutes, status)
values
  (:'HOME_ID', :'STAFF_DARREN',    current_date,     'day',       '08:00', '16:00', 30, 'confirmed'),
  (:'HOME_ID', :'STAFF_RYAN',      current_date,     'day',       '08:00', '16:00', 30, 'confirmed'),
  (:'HOME_ID', :'STAFF_CHERVELLE', current_date,     'day',       '14:00', '22:00', 30, 'scheduled'),
  (:'HOME_ID', :'STAFF_LACKSON',   current_date,     'day',       '14:00', '22:00', 30, 'scheduled'),
  (:'HOME_ID', :'STAFF_EDWARD',    current_date,     'sleep_in',  '22:00', '08:00', 0,  'scheduled'),
  (:'HOME_ID', :'STAFF_DARREN',    current_date + 1, 'day',       '08:00', '16:00', 30, 'scheduled'),
  (:'HOME_ID', :'STAFF_ANNA',      current_date + 1, 'day',       '08:00', '16:00', 30, 'scheduled'),
  (:'HOME_ID', :'STAFF_RYAN',      current_date + 1, 'day',       '14:00', '22:00', 30, 'scheduled'),
  (:'HOME_ID', :'STAFF_DIANE',     current_date + 2, 'day',       '08:00', '16:00', 30, 'scheduled'),
  (:'HOME_ID', :'STAFF_MIRELA',    current_date + 2, 'day',       '14:00', '22:00', 30, 'scheduled'),
  (:'HOME_ID', :'STAFF_CHERVELLE', current_date - 1, 'day',       '08:00', '16:00', 30, 'completed'),
  (:'HOME_ID', :'STAFF_LACKSON',   current_date - 1, 'day',       '14:00', '22:00', 30, 'completed'),
  (:'HOME_ID', :'STAFF_EDWARD',    current_date - 1, 'sleep_in',  '22:00', '08:00', 0,  'completed'),
  (:'HOME_ID', :'STAFF_ANNA',      current_date - 2, 'day',       '08:00', '16:00', 30, 'completed'),
  (:'HOME_ID', :'STAFF_RYAN',      current_date - 2, 'day',       '08:00', '16:00', 30, 'completed')
on conflict do nothing;

-- ── Leave Requests ────────────────────────────────────────────────────────────

insert into leave_requests (home_id, staff_id, leave_type, start_date, end_date, total_days, reason, status, approved_by, approved_at)
values
  (:'HOME_ID', :'STAFF_ANNA',      'annual_leave', current_date + 14, current_date + 18, 5, 'Family holiday', 'approved', :'STAFF_DARREN', now() - interval '3 days'),
  (:'HOME_ID', :'STAFF_MIRELA',    'annual_leave', current_date + 21, current_date + 22, 2, 'Long weekend', 'pending', null, null),
  (:'HOME_ID', :'STAFF_CHERVELLE', 'sick',         current_date - 3,  current_date - 1,  3, null,            'approved', :'STAFF_RYAN',   now() - interval '3 days')
on conflict do nothing;

-- ── Training Records ─────────────────────────────────────────────────────────

insert into training_records (home_id, staff_id, course_name, category, provider, completed_date, expiry_date, status, is_mandatory)
values
  (:'HOME_ID', :'STAFF_DARREN', 'Safeguarding Children Level 3', 'safeguarding', 'Acacia Training', '2024-09-01', '2026-09-01', 'compliant', true),
  (:'HOME_ID', :'STAFF_DARREN', 'First Aid at Work', 'health_safety', 'St John Ambulance', '2024-06-15', '2027-06-15', 'compliant', true),
  (:'HOME_ID', :'STAFF_RYAN',   'Safeguarding Children Level 3', 'safeguarding', 'Acacia Training', '2024-09-01', '2026-09-01', 'compliant', true),
  (:'HOME_ID', :'STAFF_RYAN',   'First Aid at Work', 'health_safety', 'St John Ambulance', '2023-11-20', '2026-11-20', 'compliant', true),
  (:'HOME_ID', :'STAFF_EDWARD', 'Safeguarding Children Level 3', 'safeguarding', 'Acacia Training', '2024-09-01', '2026-09-01', 'compliant', true),
  (:'HOME_ID', :'STAFF_ANNA',   'Safeguarding Children Level 2', 'safeguarding', 'Acacia Training', '2024-03-01', '2026-03-01', 'expiring_soon', true),
  (:'HOME_ID', :'STAFF_ANNA',   'Manual Handling', 'health_safety', 'ProTraining', '2024-05-10', '2026-05-10', 'expiring_soon', true),
  (:'HOME_ID', :'STAFF_CHERVELLE', 'Safeguarding Children Level 2', 'safeguarding', 'Acacia Training', '2024-03-01', '2026-03-01', 'expiring_soon', true),
  (:'HOME_ID', :'STAFF_LACKSON', 'Safeguarding Children Level 2', 'safeguarding', 'Acacia Training', '2024-08-15', '2026-08-15', 'compliant', true),
  (:'HOME_ID', :'STAFF_DIANE',  'Safeguarding Children Level 2', 'safeguarding', 'Acacia Training', '2024-06-20', '2026-06-20', 'compliant', true),
  (:'HOME_ID', :'STAFF_MIRELA', 'Safeguarding Children Level 2', 'safeguarding', 'Acacia Training', '2024-10-01', '2026-10-01', 'compliant', true),
  (:'HOME_ID', :'STAFF_SAM',    'Safeguarding Children Level 1', 'safeguarding', 'Acacia Training', '2024-09-01', '2026-09-01', 'compliant', true)
on conflict do nothing;

-- ── Tasks ─────────────────────────────────────────────────────────────────────

insert into tasks (home_id, title, description, category, priority, status, assigned_to, due_date, requires_sign_off, linked_child_id, tags)
values
  (:'HOME_ID', 'Complete Casey monthly care plan review', 'Review and update Casey''s care plan following the recent CAMHS review. Include current medication, risk assessment updates, and educational progress.', 'care_planning', 'high', 'in_progress', :'STAFF_RYAN', current_date + 3, true, :'YP_CASEY', ARRAY['care_plan', 'camhs', 'casey']),
  (:'HOME_ID', 'Alex return interview — MFC-2026-003', 'Complete structured return interview with Alex following missing from care episode on 1 April. Use the standard return interview form. Document any disclosures.', 'safeguarding', 'urgent', 'completed', :'STAFF_EDWARD', current_date - 1, true, :'YP_ALEX', ARRAY['mfc', 'return_interview', 'alex']),
  (:'HOME_ID', 'Chase DBS for Daniel Wright (cand_002)', 'DBS has not yet been received. Chase the candidate and update the check record. Escalate to RM if no response within 48 hours.', 'admin', 'high', 'not_started', :'STAFF_DARREN', current_date + 1, false, null, ARRAY['recruitment', 'dbs']),
  (:'HOME_ID', 'Monthly medication stock count — all YPs', 'Complete monthly medication stock reconciliation. Count all medications and compare to MAR records. Document any discrepancies.', 'medication', 'high', 'not_started', :'STAFF_RYAN', current_date, true, null, ARRAY['medication', 'compliance']),
  (:'HOME_ID', 'Rear gate latch repair', 'Arrange repair of rear garden gate latch. Interim padlock in place. Schedule contractor — must be resolved within 7 days per H&S check outcome.', 'maintenance', 'urgent', 'in_progress', :'STAFF_RYAN', current_date + 2, false, null, ARRAY['maintenance', 'security']),
  (:'HOME_ID', 'Jordan LAC review preparation', 'Prepare report and evidence bundle for Jordan''s upcoming LAC review. Liaise with social worker David Patel re. attendance.', 'care_planning', 'high', 'not_started', :'STAFF_CHERVELLE', current_date + 7, true, :'YP_JORDAN', ARRAY['lac_review', 'jordan']),
  (:'HOME_ID', 'Weekly fire alarm test', 'Conduct weekly fire alarm test. Document result and any issues.', 'health_safety', 'medium', 'not_started', :'STAFF_DARREN', current_date + 3, false, null, ARRAY['fire_safety', 'recurring']),
  (:'HOME_ID', 'Supervision — Anna Petrova', 'Formal monthly supervision. Refer to last session notes. Anna has flagged workload concerns to be discussed.', 'supervision', 'high', 'not_started', :'STAFF_RYAN', current_date + 5, true, null, ARRAY['supervision', 'hr']),
  (:'HOME_ID', 'Emergency lighting test — overdue', 'Emergency lighting test is overdue (was due 15 April). Complete immediately and document. Manager oversight required.', 'health_safety', 'urgent', 'not_started', :'STAFF_RYAN', current_date, true, null, ARRAY['emergency_lighting', 'overdue']),
  (:'HOME_ID', 'Alex contextual safeguarding risk assessment update', 'Update Alex''s contextual safeguarding risk assessment following MASH referral and latest missing from care episode. Involve IRO.', 'safeguarding', 'urgent', 'in_progress', :'STAFF_DARREN', current_date + 1, true, :'YP_ALEX', ARRAY['safeguarding', 'cs_risk', 'alex'])
on conflict do nothing;

-- ── Buildings ─────────────────────────────────────────────────────────────────

insert into buildings (home_id, name, type, address, areas, gas_cert_expiry, electrical_cert_expiry, fire_risk_assessment_date, epc_rating, last_full_inspection, next_inspection_due, status)
values (
  :'HOME_ID',
  'Oak House — Main Building',
  'residential',
  '14 Oakfield Avenue, Derby, DE1 3AA',
  ARRAY['bedroom_alex', 'bedroom_jordan', 'bedroom_casey', 'lounge', 'kitchen', 'bathroom_main', 'bathroom_staff', 'office', 'medication_room', 'garden'],
  '2026-12-01', '2027-03-01', '2026-01-15', 'C',
  '2026-01-15', '2027-01-15',
  'operational'
)
on conflict do nothing;

-- ── Vehicles ─────────────────────────────────────────────────────────────────

insert into vehicles (home_id, registration, make, model, colour, year, seats, mot_expiry, insurance_expiry, tax_expiry, last_service, next_service_due, mileage, status, breakdown_cover, breakdown_ref)
values
  (:'HOME_ID', 'AB21 CDE', 'Ford', 'Transit Custom', 'White', 2021, 5, '2026-08-15', '2026-09-01', '2026-07-01', '2025-10-20', '2026-10-20', 34800, 'available', 'RAC', 'RAC-OAK-2024'),
  (:'HOME_ID', 'FG23 HIJ', 'Vauxhall', 'Vivaro', 'Silver', 2023, 7, '2026-05-10', '2026-09-01', '2026-08-01', '2026-02-10', '2026-08-10', 18200, 'available', 'RAC', 'RAC-OAK-2024')
on conflict do nothing;

-- ── Maintenance items ─────────────────────────────────────────────────────────

insert into maintenance_items (home_id, title, category, priority, status, due_date, assigned_to, notes, recurring)
values
  (:'HOME_ID', 'Rear gate latch replacement', 'security', 'urgent', 'open', current_date + 2, 'Derby Locksmiths Ltd', 'Flagged on building check 15 April. Interim padlock applied. Gate must be secured before next inspection.', false),
  (:'HOME_ID', 'Emergency lighting test and service', 'electrical', 'high', 'open', current_date, 'Site staff', 'Monthly test overdue. Must be completed today.', true),
  (:'HOME_ID', 'Vivaro nearside front tyre replacement', 'general', 'high', 'open', current_date + 7, 'Kwik Fit Derby', 'Tread at 2.1mm — borderline. Vehicle can still be used for essential journeys but tyre must be replaced within 2 weeks.', false),
  (:'HOME_ID', 'Annual boiler service', 'hvac', 'medium', 'scheduled', current_date + 60, 'British Gas HomeServe', 'Annual gas safety service. Certificate due December 2026.', true)
on conflict do nothing;

-- ── QA Audits ─────────────────────────────────────────────────────────────────

insert into qa_audits (home_id, title, category, date, completed_by, score, max_score, status, findings, actions)
values
  (:'HOME_ID', 'Q1 2026 Medication Audit', 'medication', '2026-01-31', :'STAFF_DARREN', 88, 100, 'complete', 'Stock counts matched MAR for 10/12 medications. Two PRN records missing effectiveness ratings.', 'Briefed all staff re. PRN documentation requirements. Additional spot check scheduled for February.'),
  (:'HOME_ID', 'Safeguarding Records Audit — April', 'safeguarding', null, null, null, 100, 'scheduled', '', ''),
  (:'HOME_ID', 'Supervision Compliance Check — Q1', 'staffing', '2026-02-28', :'STAFF_RYAN', 75, 100, 'complete', '3 of 9 staff had supervisions overdue by more than 4 weeks at time of audit. All have since been completed.', 'Supervision schedule updated. Monthly compliance check added to manager tasks.'),
  (:'HOME_ID', 'H&S Environment Audit', 'health_safety', null, null, null, 100, 'in_progress', '', '')
on conflict do nothing;

-- ── Documents ─────────────────────────────────────────────────────────────────

insert into documents (home_id, title, category, description, file_url, file_name, file_size, mime_type, version, requires_read_sign, expiry_date, tags)
values
  (:'HOME_ID', 'Safeguarding & Child Protection Policy', 'policy', 'Oak House safeguarding policy — reviewed annually. All staff must read and sign.', '/documents/safeguarding-policy-v3.pdf', 'safeguarding-policy-v3.pdf', 245760, 'application/pdf', 3, true, current_date + 180, ARRAY['safeguarding', 'mandatory']),
  (:'HOME_ID', 'Medication Administration Procedure', 'procedure', 'Procedure for all medication administration, PRN, controlled drugs, and stock management.', '/documents/medication-procedure-v2.pdf', 'medication-procedure-v2.pdf', 189440, 'application/pdf', 2, true, current_date + 270, ARRAY['medication', 'mandatory']),
  (:'HOME_ID', 'Whistleblowing Policy', 'policy', 'Policy for raising concerns about poor practice or wrongdoing.', '/documents/whistleblowing-policy-v1.pdf', 'whistleblowing-policy-v1.pdf', 98304, 'application/pdf', 1, true, current_date + 365, ARRAY['hr', 'mandatory']),
  (:'HOME_ID', 'Physical Intervention Policy', 'policy', 'Policy governing the use of physical intervention. All staff must read annually.', '/documents/pi-policy-v2.pdf', 'pi-policy-v2.pdf', 156672, 'application/pdf', 2, true, current_date + 120, ARRAY['safeguarding', 'mandatory']),
  (:'HOME_ID', 'Fire Evacuation Procedure', 'procedure', 'Fire evacuation procedure for Oak House. Posted in all rooms.', '/documents/fire-evacuation-v1.pdf', 'fire-evacuation-v1.pdf', 67584, 'application/pdf', 1, false, current_date + 365, ARRAY['health_safety']),
  (:'HOME_ID', 'Staff Handbook 2026', 'hr', 'Full staff handbook including all policies, procedures and expectations.', '/documents/staff-handbook-2026.pdf', 'staff-handbook-2026.pdf', 512000, 'application/pdf', 1, true, current_date + 300, ARRAY['hr', 'mandatory'])
on conflict do nothing;

-- ── Vacancies ─────────────────────────────────────────────────────────────────

insert into vacancies (home_id, title, role_code, employment_type, contract_type, salary_min, salary_max, hours, shift_pattern, reports_to, safeguarding_statement, status, approval_status, approved_by, approved_at)
values
  (:'HOME_ID', 'Residential Care Worker', 'RCW', 'permanent', 'full_time', 24000, 27000, 40, 'Rotating days, evenings and sleep-ins across a 4-week rota', :'STAFF_DARREN', 'Oak House is committed to safeguarding and promoting the welfare of children and young people. All posts are subject to an enhanced DBS check, barred list check, and satisfactory references.', 'open', 'approved', :'STAFF_DARREN', now() - interval '13 days'),
  (:'HOME_ID', 'Team Leader', 'TL', 'permanent', 'full_time', 30000, 34000, 40, 'Supernumerary management shifts plus on-call cover', :'STAFF_DARREN', 'Oak House is committed to safeguarding and promoting the welfare of children and young people. All posts are subject to an enhanced DBS check, barred list check, and satisfactory references.', 'open', 'approved', :'STAFF_DARREN', now() - interval '8 days')
on conflict do nothing;

-- Note: Candidate profiles, checks, and references are omitted from seed as they
-- reference UUIDs that are auto-generated. Insert via application or manually
-- after noting the vacancy UUIDs.
