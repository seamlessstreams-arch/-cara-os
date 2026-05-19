#!/usr/bin/env python3
"""
Add category filters to CareEventsPanel components across platform pages.
Only updates pages where there's a clear mapping from page context to care event category.
Pages with no clear category mapping are left unchanged.
"""

import os
import re
import sys

BASE = "src/app/(platform)"

# ── Category mapping ─────────────────────────────────────────────────────────
# page-slug → (title, category_str, days)
# category_str is the JSX string for the category prop value
# days: None → keep existing (28), or specify a number

MAPPINGS: dict[str, tuple[str, str, int | None]] = {
    # ── health ──────────────────────────────────────────────────────────────
    "accident-book":                        ("Care Events — Health", '"health"', None),
    "annual-health-assessment":             ("Care Events — Health", '"health"', None),
    "appointments":                         ("Care Events — Health", '"health"', None),
    "camhs-referral-tracker":               ("Care Events — Health", '"health"', None),
    "child-adhd-support-plan":              ("Care Events — Health", '"health"', None),
    "child-allergies-epipen-plan":          ("Care Events — Health & Medication", '["health", "medication"]', None),
    "child-asthma-action-plan":             ("Care Events — Health & Medication", '["health", "medication"]', None),
    "child-autism-support-plan":            ("Care Events — Health", '"health"', None),
    "child-continence-support-plan":        ("Care Events — Health", '"health"', None),
    "child-deaf-hearing-support":           ("Care Events — Health", '"health"', None),
    "child-diabetic-care-plan":             ("Care Events — Health & Medication", '["health", "medication"]', None),
    "child-dyslexia-spld-plan":             ("Care Events — Health & Education", '["health", "education"]', None),
    "child-epilepsy-seizure-plan":          ("Care Events — Health & Medication", '["health", "medication"]', None),
    "child-injuries-log":                   ("Care Events — Health", '"health"', None),
    "child-mental-health-daily-check":      ("Care Events — Health & Wellbeing", '["health", "wellbeing"]', None),
    "child-mobility-physical-disability-plan": ("Care Events — Health", '"health"', None),
    "child-orthodontic-treatment":          ("Care Events — Health", '"health"', None),
    "child-physio-ot-plan":                 ("Care Events — Health", '"health"', None),
    "child-skin-conditions":                ("Care Events — Health", '"health"', None),
    "child-speech-language-therapy":        ("Care Events — Health", '"health"', None),
    "child-trauma-therapy-log":             ("Care Events — Health & Wellbeing", '["health", "wellbeing"]', None),
    "child-vision-care":                    ("Care Events — Health", '"health"', None),
    "dental-records":                       ("Care Events — Health", '"health"', None),
    "eating-support-plan":                  ("Care Events — Health & Food", '["health", "food"]', None),
    "health-assessments":                   ("Care Events — Health", '"health"', None),
    "health-monitoring":                    ("Care Events — Health", '"health"', None),
    "health-passports":                     ("Care Events — Health", '"health"', None),
    "healthcare-plans":                     ("Care Events — Health", '"health"', None),
    "immunisation-record":                  ("Care Events — Health", '"health"', None),
    "menstrual-health-tracker":             ("Care Events — Health", '"health"', None),
    "occupational-therapy-records":         ("Care Events — Health", '"health"', None),
    "opticians-records":                    ("Care Events — Health", '"health"', None),
    "sensory-profiles":                     ("Care Events — Health", '"health"', None),
    "sensory-room-usage":                   ("Care Events — Health & Wellbeing", '["health", "wellbeing"]', None),
    "sleep-assessments":                    ("Care Events — Health & Sleep", '["health", "sleep"]', None),
    "therapeutic-input":                    ("Care Events — Health & Wellbeing", '["health", "wellbeing"]', None),
    "therapeutic-outcome-measures":         ("Care Events — Health & Wellbeing", '["health", "wellbeing"]', None),
    "therapeutic-care-model":               ("Care Events — Health & Wellbeing", '["health", "wellbeing"]', None),

    # ── medication ──────────────────────────────────────────────────────────
    "emergency-medication-protocols":       ("Care Events — Medication", '"medication"', None),
    "mar-sheet":                            ("Care Events — Medication", '"medication"', None),
    "medication-error-investigation":       ("Care Events — Medication", '"medication"', None),
    "medication-errors":                    ("Care Events — Medication", '"medication"', None),
    "medication-near-miss-log":             ("Care Events — Medication", '"medication"', None),
    "medication-stock-check":               ("Care Events — Medication", '"medication"', None),
    "medication-storage-audit":             ("Care Events — Medication", '"medication"', None),
    "medication-training":                  ("Care Events — Medication", '"medication"', None),

    # ── education ───────────────────────────────────────────────────────────
    "after-school-club-tracker":            ("Care Events — Education & Activities", '["education", "activity"]', None),
    "child-extracurricular-clubs":          ("Care Events — Education & Activities", '["education", "activity"]', None),
    "child-school-engagement-events":       ("Care Events — Education", '"education"', None),
    "child-school-uniform-shoes-tracker":   ("Care Events — Education", '"education"', None),
    "child-tutoring-private-tuition":       ("Care Events — Education", '"education"', None),
    "child-work-experience-tracker":        ("Care Events — Education", '"education"', None),
    "children-missing-education":           ("Care Events — Education", '"education"', 90),
    "digital-literacy-skills":              ("Care Events — Education", '"education"', None),
    "driving-lessons-tracker":              ("Care Events — Education", '"education"', None),
    "education-attendance-tracker":         ("Care Events — Education", '"education"', None),
    "ehcp-tracker":                         ("Care Events — Education", '"education"', None),
    "homework-support-log":                 ("Care Events — Education", '"education"', None),
    "pep-tracker":                          ("Care Events — Education", '"education"', None),
    "rse-tracker":                          ("Care Events — Education", '"education"', None),
    "independent-living-skills-assessment": ("Care Events — Education", '"education"', None),

    # ── family contact ──────────────────────────────────────────────────────
    "chosen-family-tracker":                ("Care Events — Family Contact", '"family_contact"', None),
    "contact-plans":                        ("Care Events — Family Contact", '"family_contact"', None),
    "contact-supervision":                  ("Care Events — Family Contact", '"family_contact"', None),
    "family-relationship-quality-tracker":  ("Care Events — Family Contact", '"family_contact"', None),
    "family-time-supervision":              ("Care Events — Family Contact", '"family_contact"', None),
    "family-tree-genogram":                 ("Care Events — Family Contact", '"family_contact"', None),
    "siblings-contact-protocol":            ("Care Events — Family Contact", '"family_contact"', None),
    "parent-partnership":                   ("Care Events — Family Contact", '"family_contact"', None),
    "parental-responsibility-record":       ("Care Events — Family Contact", '"family_contact"', None),

    # ── professional contact ─────────────────────────────────────────────────
    "iro-correspondence":                   ("Care Events — Professional Contact", '"professional_contact"', None),
    "multi-agency-meetings":                ("Care Events — Professional Contact", '"professional_contact"', None),
    "professional-consultations":           ("Care Events — Professional Contact", '"professional_contact"', None),
    "professional-fees-log":                ("Care Events — Professional Contact", '"professional_contact"', None),
    "professional-meeting-attendance":      ("Care Events — Professional Contact", '"professional_contact"', None),
    "professional-network-map":             ("Care Events — Professional Contact", '"professional_contact"', None),
    "social-worker-contact":                ("Care Events — Professional Contact", '"professional_contact"', None),
    "statutory-visit-log":                  ("Care Events — Professional Contact", '"professional_contact"', None),
    "lac-reviews":                          ("Care Events — Professional Contact", '"professional_contact"', None),
    "lac-review-prep":                      ("Care Events — Professional Contact", '"professional_contact"', None),
    "matching-referrals":                   ("Care Events — Professional Contact", '"professional_contact"', None),
    "commissioning-feedback":               ("Care Events — Professional Contact", '"professional_contact"', None),

    # ── safeguarding ────────────────────────────────────────────────────────
    "bullying-incident-log":                ("Care Events — Safeguarding", '["safeguarding", "behaviour"]', 90),
    "child-police-contact-records":         ("Care Events — Safeguarding", '"safeguarding"', 90),
    "child-prevent-radicalisation-screening": ("Care Events — Safeguarding", '"safeguarding"', 90),
    "child-protection-conferences":         ("Care Events — Safeguarding", '"safeguarding"', 90),
    "contextual-safeguarding":              ("Care Events — Safeguarding", '["safeguarding", "missing_episode"]', 90),
    "deprivation-of-liberty":              ("Care Events — Safeguarding", '"safeguarding"', 90),
    "drug-and-alcohol-screening":           ("Care Events — Safeguarding & Behaviour", '["safeguarding", "behaviour"]', 90),
    "exploitation-screening":               ("Care Events — Safeguarding", '"safeguarding"', 90),
    "hate-incident-log":                    ("Care Events — Safeguarding", '"safeguarding"', 90),
    "lado-referrals":                       ("Care Events — Safeguarding", '"safeguarding"', 90),
    "online-safety":                        ("Care Events — Safeguarding", '"safeguarding"', 90),
    "prevent-duty":                         ("Care Events — Safeguarding", '"safeguarding"', 90),
    "self-harm-safety-plan":                ("Care Events — Safeguarding & Wellbeing", '["safeguarding", "wellbeing"]', 90),
    "significant-events":                   ("Care Events — Safeguarding & Incidents", '["safeguarding", "behaviour", "missing_episode"]', 90),
    "disclosure-log":                       ("Care Events — Safeguarding", '"safeguarding"', 90),

    # ── complaint ───────────────────────────────────────────────────────────
    "complaint-resolution-meetings":        ("Care Events — Complaints", '"complaint"', 90),
    "complaints":                           ("Care Events — Complaints", '"complaint"', 90),
    "complaints-outcomes":                  ("Care Events — Complaints", '"complaint"', 90),
    "complaints-trend-analysis":            ("Care Events — Complaints", '"complaint"', 90),

    # ── behaviour ───────────────────────────────────────────────────────────
    "behaviour-mapping":                    ("Care Events — Behaviour", '"behaviour"', None),
    "consequence-framework":                ("Care Events — Behaviour", '"behaviour"', None),
    "risk-register":                        ("Care Events — Behaviour & Risk", '["behaviour", "safeguarding"]', None),
    "risk-assessments":                     ("Care Events — Behaviour & Risk", '["behaviour", "safeguarding"]', None),
    "risk-management-plans":                ("Care Events — Behaviour & Risk", '["behaviour", "safeguarding"]', None),
    "positive-handling":                    ("Care Events — Physical Interventions", '["physical_intervention", "restraint"]', None),
    "safe-touch-protocol":                  ("Care Events — Physical Interventions", '["physical_intervention", "restraint"]', None),
    "post-incident-debrief-with-child":     ("Care Events — Behaviour & Safeguarding", '["behaviour", "safeguarding", "physical_intervention"]', 90),
    "critical-incident-debrief":            ("Care Events — Safeguarding & Behaviour", '["safeguarding", "behaviour", "physical_intervention"]', 90),
    "debriefs":                             ("Care Events — Behaviour", '["behaviour", "physical_intervention", "restraint"]', None),
    "serious-incident-reviews":             ("Care Events — Safeguarding & Behaviour", '["safeguarding", "behaviour", "physical_intervention"]', 90),
    "peer-relationships":                   ("Care Events — Behaviour & Wellbeing", '["behaviour", "wellbeing"]', None),

    # ── activity ────────────────────────────────────────────────────────────
    "activity-log":                         ("Care Events — Activities", '"activity"', None),
    "child-bike-cycling-tracker":           ("Care Events — Activities", '"activity"', None),
    "child-cooking-baking-skills":          ("Care Events — Activities", '"activity"', None),
    "child-creative-projects":              ("Care Events — Activities", '"activity"', None),
    "child-photography-portfolio":          ("Care Events — Activities", '"activity"', None),
    "child-summer-holiday-record":          ("Care Events — Activities", '"activity"', None),
    "child-swimming-water-safety":          ("Care Events — Activities", '"activity"', None),
    "child-volunteering-charity":           ("Care Events — Activities", '"activity"', None),
    "community-engagement-log":             ("Care Events — Activities", '"activity"', None),
    "garden-cultivation-tracker":           ("Care Events — Activities", '"activity"', None),
    "holiday-planning":                     ("Care Events — Activities", '"activity"', None),
    "independence-skills":                  ("Care Events — Activities", '"activity"', None),
    "independent-travel-training":          ("Care Events — Activities", '"activity"', None),
    "museum-cultural-visits-tracker":       ("Care Events — Activities", '"activity"', None),
    "outdoor-activity-risk-assessments":    ("Care Events — Activities", '"activity"', None),
    "physical-activity-tracker":            ("Care Events — Activities", '"activity"', None),

    # ── wellbeing ───────────────────────────────────────────────────────────
    "bereavement-loss-support":             ("Care Events — Wellbeing", '"wellbeing"', None),
    "child-self-soothing-toolkit":          ("Care Events — Wellbeing", '"wellbeing"', None),
    "digital-wellbeing-plan":               ("Care Events — Wellbeing", '"wellbeing"', None),
    "emotional-vocabulary-coaching":        ("Care Events — Wellbeing", '"wellbeing"', None),
    "grief-and-loss-support":              ("Care Events — Wellbeing", '"wellbeing"', None),
    "night-time-anxiety-support":           ("Care Events — Wellbeing & Sleep", '["wellbeing", "sleep"]', None),
    "outcome-star":                         ("Care Events — Wellbeing", '"wellbeing"', None),
    "wellbeing-pulse-survey":               ("Care Events — Wellbeing", '"wellbeing"', None),
    "child-style-identity-expression":      ("Care Events — Wellbeing", '"wellbeing"', None),
    "lgbtq-inclusion-record":               ("Care Events — Wellbeing & Safeguarding", '["wellbeing", "safeguarding"]', None),
    "trans-affirming-care-plan":            ("Care Events — Wellbeing & Health", '["wellbeing", "health"]', None),
    "first-relationship-support":           ("Care Events — Wellbeing", '"wellbeing"', None),
    "relational":                           ("Care Events — Wellbeing", '"wellbeing"', None),
    "attachment-profiles":                  ("Care Events — Wellbeing", '"wellbeing"', None),
    "multi-disciplinary-formulation":       ("Care Events — Health & Wellbeing", '["health", "wellbeing"]', None),

    # ── sleep ───────────────────────────────────────────────────────────────
    "bedtime-routines":                     ("Care Events — Sleep", '"sleep"', None),
    "night-checks":                         ("Care Events — Sleep", '"sleep"', None),
    "night-log":                            ("Care Events — Sleep", '"sleep"', None),
    "night-staff-handover":                 ("Care Events — Sleep", '"sleep"', None),
    "sleep-in-log":                         ("Care Events — Sleep", '"sleep"', None),
    "sleep-log":                            ("Care Events — Sleep", '"sleep"', None),
    "wake-up-routines":                     ("Care Events — Sleep", '"sleep"', None),

    # ── food ────────────────────────────────────────────────────────────────
    "dietary-requirements":                 ("Care Events — Food & Nutrition", '"food"', None),
    "food-budget-tracker":                  ("Care Events — Food", '"food"', None),
    "food-hygiene":                         ("Care Events — Food", '"food"', None),
    "kitchen-hygiene-monitoring":           ("Care Events — Food", '"food"', None),
    "menu-planning":                        ("Care Events — Food", '"food"', None),

    # ── finance ─────────────────────────────────────────────────────────────
    "child-bank-account":                   ("Care Events — Finance", '"finance"', None),
    "child-charity-grants-applications":    ("Care Events — Finance", '"finance"', None),
    "child-money-management-budgeting":     ("Care Events — Finance", '"finance"', None),
    "clothing-allowances":                  ("Care Events — Finance", '"finance"', None),
    "leaving-care-financial-package":       ("Care Events — Finance", '"finance"', None),
    "petty-cash":                           ("Care Events — Finance", '"finance"', None),
    "placement-budget-tracker":             ("Care Events — Finance", '"finance"', None),
    "pocket-money":                         ("Care Events — Finance", '"finance"', None),
    "pocket-money-accounts":                ("Care Events — Finance", '"finance"', None),
    "yp-savings":                           ("Care Events — Finance", '"finance"', None),
    "child-clothing-shopping-trips":        ("Care Events — Finance", '"finance"', None),

    # ── care plans / placements ─────────────────────────────────────────────
    "care-plans":                           ("Care Events — Care Planning", '["general", "behaviour", "health"]', None),
    "placement-plan":                       ("Care Events — Care Planning", '["general", "behaviour", "health"]', None),
    "pathway-plan-16plus":                  ("Care Events — Care Planning", '["general", "education", "finance"]', None),
    "transition-planning":                  ("Care Events — Care Planning", '["general", "education", "finance"]', None),
    "assessment-of-need":                   ("Care Events — Care Planning", '"general"', None),
    "independence-pathway":                 ("Care Events — Education & Finance", '["education", "finance"]', None),
    "after-care":                           ("Care Events — Care Planning", '["general", "education", "finance"]', None),

    # ── wellbeing (batch 2) ──────────────────────────────────────────────────
    "child-aspirations-tracker":            ("Care Events — Wellbeing", '"wellbeing"', None),
    "child-care-anniversary":               ("Care Events — Wellbeing", '"wellbeing"', None),
    "child-cultural-religious-mentor":      ("Care Events — Wellbeing", '"wellbeing"', None),
    "child-feedback-loops":                 ("Care Events — Wellbeing", '"wellbeing"', None),
    "child-feedback-on-staff":              ("Care Events — Wellbeing", '"wellbeing"', None),
    "child-heritage-language-tracker":      ("Care Events — Wellbeing", '"wellbeing"', None),
    "child-keyworker-1to1-sessions":        ("Care Events — Wellbeing", '"wellbeing"', None),
    "child-laundry-self-care":              ("Care Events — Wellbeing & Activities", '["wellbeing", "activity"]', None),
    "child-led-meeting-record":             ("Care Events — Wellbeing", '"wellbeing"', None),
    "child-participation-log":              ("Care Events — Wellbeing", '"wellbeing"', None),
    "child-religious-rite-milestones":      ("Care Events — Wellbeing", '"wellbeing"', None),
    "child-rights-literacy-tracker":        ("Care Events — Wellbeing", '"wellbeing"', None),
    "children-as-experts":                  ("Care Events — Wellbeing", '"wellbeing"', None),
    "children-pledges":                     ("Care Events — Wellbeing", '"wellbeing"', None),
    "childrens-guide":                      ("Care Events — Wellbeing", '"wellbeing"', None),
    "childrens-meetings":                   ("Care Events — Wellbeing", '"wellbeing"', None),
    "childrens-rights":                     ("Care Events — Wellbeing", '"wellbeing"', None),
    "cultural-identity":                    ("Care Events — Wellbeing", '"wellbeing"', None),
    "key-working":                          ("Care Events — Wellbeing", '"wellbeing"', None),
    "life-story":                           ("Care Events — Wellbeing", '"wellbeing"', None),
    "personal-passport":                    ("Care Events — Wellbeing", '"wellbeing"', None),
    "voice":                                ("Care Events — Wellbeing", '"wellbeing"', None),
    "compliments":                          ("Care Events — Wellbeing", '"wellbeing"', None),

    # ── safeguarding (batch 2) ──────────────────────────────────────────────
    "child-mobile-phone-management":        ("Care Events — Safeguarding & Behaviour", '["safeguarding", "behaviour"]', 90),
    "child-smoking-vaping-tracker":         ("Care Events — Safeguarding & Health", '["safeguarding", "health"]', 90),
    "child-court-attendance-support":       ("Care Events — Safeguarding", '"safeguarding"', 90),
    "child-immigration-uasc-support":       ("Care Events — Safeguarding", '"safeguarding"', 90),
    "daily-risk-briefing":                  ("Care Events — Behaviour & Safeguarding", '["behaviour", "safeguarding"]', None),
    "escalation-tracker":                   ("Care Events — Safeguarding & Behaviour", '["safeguarding", "behaviour"]', 90),
    "data-breach-log":                      ("Care Events — Safeguarding", '"safeguarding"', 90),
    "restrictions-log":                     ("Care Events — Safeguarding & Behaviour", '["safeguarding", "behaviour", "physical_intervention"]', 90),
    "room-searches":                        ("Care Events — Safeguarding & Behaviour", '["safeguarding", "behaviour"]', 90),
    "online-gaming-tracker":                ("Care Events — Safeguarding", '"safeguarding"', None),
    "child-correspondence-incoming":        ("Care Events — Safeguarding", '"safeguarding"', None),
    "notifiable-events":                    ("Care Events — Safeguarding & Behaviour", '["safeguarding", "behaviour", "missing_episode", "physical_intervention"]', 90),

    # ── finance (batch 2) ─────────────────────────────────────────────────────
    "expenses":                             ("Care Events — Finance", '"finance"', None),
    "delegated-authority":                  ("Care Events — Finance", '"finance"', None),

    # ── activity (batch 2) ───────────────────────────────────────────────────
    "child-friendly-policies":              ("Care Events — Activities & Wellbeing", '["activity", "wellbeing"]', None),
    "diversity-calendar":                   ("Care Events — Activities", '"activity"', None),
    "religious-festival-celebrations":      ("Care Events — Activities & Wellbeing", '["activity", "wellbeing"]', None),
    "local-offer":                          ("Care Events — Activities & Education", '["activity", "education"]', None),

    # ── health (batch 2) ─────────────────────────────────────────────────────
    "infection-control":                    ("Care Events — Health", '"health"', None),
    "child-injuries-log":                   ("Care Events — Health", '"health"', None),

    # ── family contact (batch 2) ─────────────────────────────────────────────
    "family-time":                          ("Care Events — Family Contact", '"family_contact"', None),
    "discharge":                            ("Care Events — Family Contact & Care Planning", '["family_contact", "general"]', None),

    # ── general/administrative pages — broad or multi-category ────────────
    "absence-tracking":                     ("Care Events — Health & Behaviour", '["health", "behaviour", "education"]', None),
    "annual-development-reviews":           ("Care Events — Care Planning & Education", '["general", "education", "health"]', None),
    "annual-outcomes-report":               ("Care Events — Care Planning", '"general"', None),
    "audit-trail":                          ("Care Events — Audit", '["general", "behaviour", "safeguarding"]', 90),
    "care-events":                          ("Recent Care Events", '"general"', 14),
    "case-file-audit":                      ("Care Events — Audit & Compliance", '"general"', 90),
    "daily-risk-briefing":                  ("Care Events — Behaviour & Risk", '["behaviour", "safeguarding", "missing_episode"]', None),
    "child-daily-summaries":                ("Recent Care Events", '"general"', 14),
    "inspect-readiness-pack":               ("Care Events — Compliance Evidence", '"general"', 90),
    "inspection-readiness":                 ("Care Events — Compliance Evidence", '"general"', 90),
    "inspection":                           ("Care Events — Compliance Evidence", '"general"', 90),
    "notifiable-events":                    ("Care Events — Notifiable Events", '["safeguarding", "behaviour", "missing_episode", "physical_intervention"]', 90),
    "outcomes":                             ("Care Events — Outcomes Evidence", '"general"', None),
    "outcomes-dashboard":                   ("Care Events — Outcomes Evidence", '"general"', None),
    "quality-of-care":                      ("Care Events — Quality Evidence", '"general"', 90),
    "quality-review-cycle":                 ("Care Events — Quality Evidence", '"general"', 90),
    "reports":                              ("Care Events — Reporting Period", '"general"', 90),
    "saved-time":                           ("Recent Care Events", '"general"', 14),

    # ── welfare/safety checks ────────────────────────────────────────────────
    "welfare-checks":                       ("Care Events — Welfare & Safety", '["general", "health", "behaviour"]', None),
    "welfare-check-protocol-per-child":     ("Care Events — Welfare & Safety", '["general", "health", "behaviour"]', None),
    "visitor-log":                          ("Care Events — Visitors & Contacts", '"professional_contact"', None),
    "unannounced-visits-log":               ("Care Events — Regulatory Visits", '"general"', 90),
    "water-hygiene":                        ("Care Events — Health & Safety", '"health"', None),
    "property-damage":                      ("Care Events — Behaviour", '"behaviour"', None),
    "vehicle-pre-use-check":                ("Care Events — Transport Safety", '"general"', None),
    "vehicles":                             ("Care Events — Transport Safety", '"general"', None),
    "transport-log":                        ("Care Events — Transport & Activities", '["activity", "general"]', None),
    "transport-risk-assessments":           ("Care Events — Transport & Risk", '["activity", "behaviour"]', None),

    # ── admissions/placements ────────────────────────────────────────────────
    "admissions":                           ("Care Events — Admissions & Placements", '"general"', None),
    "placement-anniversaries":              ("Care Events — Placement Stability", '"general"', None),
    "placement-cohort-analysis":            ("Care Events — Placement Stability", '"general"', 90),
    "placement-disruption-prevention-plan": ("Care Events — Behaviour & Placement", '["behaviour", "safeguarding", "general"]', None),
    "placement-end-summary":                ("Care Events — End of Placement", '"general"', 90),
    "placement-impact-assessment":          ("Care Events — Placement Evidence", '"general"', None),
    "placement-meeting-minutes":            ("Care Events — Professional Contact", '"professional_contact"', None),
    "placement-stability":                  ("Care Events — Placement Stability", '["behaviour", "safeguarding", "general"]', None),
    "placement-stability-meetings":         ("Care Events — Placement Stability", '["behaviour", "safeguarding", "general"]', None),
    "placement-success-factors":            ("Care Events — Placement Evidence", '"general"', None),
    "pre-admission-checklist":              ("Care Events — Admissions & Placements", '"general"', None),
    "referral-tracker":                     ("Care Events — Admissions & Referrals", '"professional_contact"', None),
    "emergency-placements":                 ("Care Events — Admissions & Placements", '"general"', None),
    "matching-referrals":                   ("Care Events — Professional Contact", '"professional_contact"', None),
    "admissions":                           ("Care Events — Admissions & Placements", '"general"', None),

    # ── staff-related ────────────────────────────────────────────────────────
    "staff-debrief-log":                    ("Care Events — Behaviour & Debriefs", '["behaviour", "physical_intervention", "safeguarding"]', None),
    "staff-meetings":                       ("Care Events — General", '"general"', None),
    "shift-notes":                          ("Care Events — Daily Log", '"general"', 14),
    "rota":                                 ("Care Events — General", '"general"', 14),
    "timesheets":                           ("Care Events — General", '"general"', None),

    # ── patterns/analytics ───────────────────────────────────────────────────
    "patterns":                             ("Care Events — Patterns & Intelligence", '["behaviour", "safeguarding", "health", "missing_episode"]', 90),
    "incident-trend-analysis":              ("Care Events — Incidents & Behaviour", '["behaviour", "safeguarding", "physical_intervention"]', 90),
    "complaints-trend-analysis":            ("Care Events — Complaints", '"complaint"', 90),

    # ── room/home safety ─────────────────────────────────────────────────────
    "room-searches":                        ("Care Events — Safeguarding & Behaviour", '["safeguarding", "behaviour"]', 90),
    "room-allocation-rationale":            ("Care Events — Placement", '"general"', None),
    "bedroom-personalisation":              ("Care Events — Wellbeing", '"wellbeing"', None),
    "cleaning-rota":                        ("Care Events — Home Safety", '"general"', None),
    "household-tasks-rota":                 ("Care Events — Activities", '"activity"', None),

    # ── regulation/compliance ────────────────────────────────────────────────
    "reg22-records":                        ("Care Events — Regulation 22 Evidence", '"general"', 90),
    "reg35-notifications":                  ("Care Events — Regulatory Notifications", '"general"', 90),
    "reg40-staffing-plan":                  ("Care Events — Regulation 40", '["behaviour", "safeguarding", "missing_episode"]', 90),
    "regulation-40":                        ("Care Events — Regulation 40 Triage", '["safeguarding", "behaviour", "missing_episode", "physical_intervention"]', 90),
    "regulation-45":                        ("Care Events — Regulation 45 Evidence", '["safeguarding", "behaviour", "health", "education", "complaint"]', 90),
    "reg44-actions":                        ("Care Events — Regulation 44 Evidence", '"general"', 90),
    "reg44-visitor-reports":                ("Care Events — Regulation 44 Evidence", '"general"', 90),
    "annex-a":                              ("Care Events — Annex A Evidence", '["safeguarding", "behaviour", "health", "education", "complaint"]', 90),
    "notifiable-events":                    ("Care Events — Notifiable Events", '["safeguarding", "behaviour", "missing_episode", "physical_intervention"]', 90),
}

# ── Patterns ─────────────────────────────────────────────────────────────────

PANEL_RE = re.compile(
    r'(<CareEventsPanel\s+)(title="Related Care Events"\s*)((?:days=\{28\}\s*)?)(defaultCollapsed\s*/>)',
    re.MULTILINE,
)

PANEL_RE2 = re.compile(
    r'(<CareEventsPanel\s+)(title="Related Care Events"\s*)(days=\{28\}\s*)(defaultCollapsed\s*/>)',
    re.MULTILINE,
)


def build_replacement(title: str, category_str: str, days_override: int | None) -> str:
    days_prop = f"days={{{days_override}}}\n        " if days_override else "days={28}\n        "
    cat_prop = f"category={category_str}\n        " if not category_str.startswith('"') else f'category={category_str}\n        '
    return f'<CareEventsPanel\n        title="{title}"\n        {cat_prop}{days_prop}defaultCollapsed\n      />'


def process_file(path: str, title: str, category_str: str, days_override: int | None) -> bool:
    with open(path) as f:
        content = f.read()

    # Look for the CareEventsPanel block and check if it already has a category
    panel_start = content.find("<CareEventsPanel")
    if panel_start == -1:
        return False

    # Find end of the panel
    panel_end = content.find("/>", panel_start)
    if panel_end == -1:
        panel_end = content.find("</CareEventsPanel>", panel_start) + 18

    panel_block = content[panel_start:panel_end + 2]

    if "category=" in panel_block:
        # Already has a category filter
        return False

    if 'title="Related Care Events"' not in panel_block:
        # Non-standard title — skip
        return False

    # Build new block  
    days = days_override if days_override else 28
    if category_str.startswith("["):
        cat_prop = f"category={{{category_str}}}"
    else:
        cat_prop = f"category={category_str}"

    new_block = (
        f'<CareEventsPanel\n'
        f'        title="{title}"\n'
        f'        {cat_prop}\n'
        f'        days={{{days}}}\n'
        f'        defaultCollapsed\n'
        f'      />'
    )

    new_content = content[:panel_start] + new_block + content[panel_end + 2:]
    with open(path, "w") as f:
        f.write(new_content)

    return True


def main():
    updated = []
    skipped = []

    for slug, (title, category_str, days_override) in sorted(MAPPINGS.items()):
        path = os.path.join(BASE, slug, "page.tsx")
        if not os.path.exists(path):
            skipped.append(f"MISSING: {slug}")
            continue

        ok = process_file(path, title, category_str, days_override)
        if ok:
            updated.append(slug)
        else:
            skipped.append(f"SKIP (already filtered or non-standard): {slug}")

    print(f"\n✅ Updated {len(updated)} pages:")
    for s in updated:
        print(f"  {s}")

    if skipped:
        print(f"\n⚠️  Skipped {len(skipped)}:")
        for s in skipped:
            print(f"  {s}")


if __name__ == "__main__":
    main()
