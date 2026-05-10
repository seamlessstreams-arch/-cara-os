#!/usr/bin/env python3
"""
Fix remaining CareEventsPanel components that still have title="Related Care Events"
without any category filter. Applies the most contextually appropriate category
based on the page slug.
"""

import os

BASE = "src/app/(platform)"

# Remaining pages → (title, category_str, days)
MAPPINGS = {
    # ── child wellbeing/advocacy ─────────────────────────────────────────────
    "adoption-support-records":             ("Care Events — Care Planning", '"general"', None),
    "advocacy":                             ("Care Events — Professional Contact", '"professional_contact"', None),
    "birthday-card-tracker":                ("Care Events — Wellbeing", '"wellbeing"', None),
    "communication-book":                   ("Care Events — General", '"general"', 14),
    "community-feedback":                   ("Care Events — General", '"general"', None),
    "consent-records":                      ("Care Events — General", '"general"', None),
    "contact-directory":                    ("Care Events — Professional Contact", '"professional_contact"', None),
    "correspondence":                       ("Care Events — Professional Contact", '"professional_contact"', None),
    "daily-log":                            ("Care Events — Daily Log", '"general"', 14),
    "daily-routine-plans":                  ("Care Events — Daily Log", '"general"', 14),
    "dashboard":                            ("Recent Care Events", '"general"', 14),
    "document-expiry-tracker":              ("Care Events — General", '"general"', None),
    "documents":                            ("Care Events — General", '"general"', None),
    "duty-log":                             ("Care Events — Daily Log", '"general"', 14),
    "emergency-contacts":                   ("Care Events — General", '"general"', None),
    "filing-cabinet":                       ("Care Events — General", '"general"', None),
    "friendship-mapping":                   ("Care Events — Wellbeing", '"wellbeing"', None),
    "funeral-attendance-records":           ("Care Events — Wellbeing", '"wellbeing"', None),
    "hairdressing-records":                 ("Care Events — Wellbeing", '"wellbeing"', None),
    "handover":                             ("Care Events — Daily Log", '"general"', 14),
    "handover-quality-audit":               ("Care Events — Daily Log", '"general"', 14),
    "house-meetings":                       ("Care Events — Wellbeing", '"general"', None),
    "house-rules":                          ("Care Events — Behaviour", '"behaviour"', None),
    "impact-assessments":                   ("Care Events — Safeguarding", '["safeguarding", "behaviour"]', 90),
    "independent-visitor":                  ("Care Events — Family Contact", '"family_contact"', None),
    "inspection-readiness-pack":            ("Care Events — Compliance Evidence", '"general"', 90),
    "intelligence":                         ("Care Events — Patterns & Intelligence", '["behaviour", "safeguarding", "health"]', 90),
    "interventions":                        ("Care Events — Behaviour & Health", '["behaviour", "health", "wellbeing"]', None),
    "inventory":                            ("Care Events — General", '"general"', None),
    "key-dates":                            ("Care Events — General", '"general"', None),
    "kpi-dashboard":                        ("Care Events — General", '"general"', 90),
    "language-communication":               ("Care Events — Education & Wellbeing", '["education", "wellbeing"]', None),
    "learning":                             ("Care Events — Education", '"education"', None),
    "leave":                                ("Care Events — Family Contact", '["family_contact", "general"]', None),
    "locality-risk":                        ("Care Events — Safeguarding & Behaviour", '["safeguarding", "behaviour", "missing_episode"]', 90),
    "location-assessment":                  ("Care Events — Safeguarding", '["safeguarding", "missing_episode"]', 90),
    "management-oversight":                 ("Care Events — Management Review", '["safeguarding", "behaviour", "health", "general"]', 90),
    "media-publicity-consent":              ("Care Events — General", '"general"', None),
    "memorial-occasion-records":            ("Care Events — Wellbeing", '"wellbeing"', None),
    "notification-log":                     ("Care Events — General", '"general"', None),
    "notifications":                        ("Care Events — General", '"general"', 14),
    "ofsted-action-plan":                   ("Care Events — Compliance Evidence", '"general"', 90),
    "ofsted-engagement-log":                ("Care Events — Compliance Evidence", '"general"', 90),
    "ofsted-self-evaluation":               ("Care Events — Compliance Evidence", '"general"', 90),
    "on-call-rota":                         ("Care Events — General", '"general"', 14),
    "operational-meetings":                 ("Care Events — General", '"general"', None),
    "personal-belongings":                  ("Care Events — Wellbeing", '"wellbeing"', None),
    "photo-album-tracker":                  ("Care Events — Wellbeing", '"wellbeing"', None),
    "photo-consent":                        ("Care Events — General", '"general"', None),
    "policies":                             ("Care Events — General", '"general"', None),
    "policy-impact-analysis":               ("Care Events — General", '"general"', 90),
    "policy-review-tracker":               ("Care Events — General", '"general"', None),
    "positive-achievements":                ("Care Events — Wellbeing", '["wellbeing", "activity", "education"]', None),
    "professional-curiosity-log":           ("Care Events — Safeguarding", '["safeguarding", "professional_contact"]', 90),
    "professional-development":             ("Care Events — General", '"general"', None),
    "qa-audit":                             ("Care Events — Compliance Evidence", '"general"', 90),
    "recruitment":                          ("Care Events — General", '"general"', None),
    "registration-changes-log":             ("Care Events — General", '"general"', 90),
    "regulatory-correspondence-tracker":    ("Care Events — Regulatory", '"general"', 90),
    "religious-observance-log":             ("Care Events — Wellbeing", '"wellbeing"', None),
    "ri":                                   ("Care Events — Compliance Evidence", '"general"', 90),
    "risk-appetite-statement":              ("Care Events — Safeguarding & Behaviour", '["safeguarding", "behaviour"]', 90),
    "risk-management-board":                ("Care Events — Safeguarding & Behaviour", '["safeguarding", "behaviour", "missing_episode"]', 90),
    "safer-recruitment-tracker":            ("Care Events — General", '"general"', None),
    "secure-storage":                       ("Care Events — General", '"general"', None),
    "sensory-equipment-inventory":          ("Care Events — Health & Wellbeing", '["health", "wellbeing"]', None),
    "service-improvement-board":            ("Care Events — General", '"general"', 90),
    "service-user-agreements":              ("Care Events — General", '"general"', None),
    "settings":                             ("Care Events — General", '"general"', None),
    "staff":                                ("Care Events — General", '"general"', 14),
    "staff-communication-preferences":      ("Care Events — General", '"general"', None),
    "staff-competency":                     ("Care Events — General", '"general"', None),
    "staff-development":                    ("Care Events — General", '"general"', None),
    "staff-disciplinary":                   ("Care Events — Safeguarding", '["safeguarding", "behaviour"]', 90),
    "staff-exit-interviews":                ("Care Events — General", '"general"', None),
    "staff-grievances":                     ("Care Events — General", '"general"', None),
    "staff-handbook":                       ("Care Events — General", '"general"', None),
    "staff-handbook-acknowledgements":      ("Care Events — General", '"general"', None),
    "staff-induction":                      ("Care Events — General", '"general"', None),
    "staff-recognition-log":               ("Care Events — Wellbeing", '"wellbeing"', None),
    "staff-reflections":                    ("Care Events — General", '"general"', None),
    "staff-safer-caring":                   ("Care Events — Safeguarding", '["safeguarding", "behaviour"]', 90),
    "staff-shadowing-log":                  ("Care Events — General", '"general"', None),
    "staff-sickness":                       ("Care Events — General", '"general"', None),
    "staff-supervision-themes":             ("Care Events — General", '"general"', None),
    "staff-wellbeing":                      ("Care Events — Wellbeing", '"wellbeing"', None),
    "stakeholder-feedback":                 ("Care Events — General", '"general"', None),
    "statement-of-purpose":                 ("Care Events — General", '"general"', 90),
    "statutory-checks-summary":             ("Care Events — General", '"general"', 90),
    "subject-access-requests":              ("Care Events — General", '"general"', 90),
    "supervision":                          ("Care Events — General", '"general"', None),
    "supervision-matrix":                   ("Care Events — General", '"general"', None),
    "supervision-tracker":                  ("Care Events — General", '"general"', None),
    "tasks":                                ("Care Events — General", '"general"', 14),
    "training":                             ("Care Events — General", '"general"', None),
    "trauma-informed-timeline":             ("Care Events — Health & Wellbeing", '["health", "wellbeing", "behaviour"]', 90),
    "utility-bills-tracker":                ("Care Events — General", '"general"', None),
    "utility-monitoring":                   ("Care Events — General", '"general"', None),
    "visitors-feedback":                    ("Care Events — General", '"general"', None),
    "voter-registration-civic":             ("Care Events — Wellbeing", '"wellbeing"', None),
    "warm-welcome-packs":                   ("Care Events — Wellbeing", '"wellbeing"', None),
    "welcome-tour-checklist":               ("Care Events — Wellbeing", '"wellbeing"', None),
    "whistleblowing":                       ("Care Events — Safeguarding", '["safeguarding", "complaint"]', 90),
    "whistleblowing-investigations":        ("Care Events — Safeguarding", '["safeguarding", "complaint"]', 90),
    "workforce":                            ("Care Events — General", '"general"', None),
    "young-carer-status":                   ("Care Events — Wellbeing & Education", '["wellbeing", "education", "health"]', None),
    "young-people":                         ("Care Events — General", '"general"', 14),
    "young-person-job-tracker":             ("Care Events — Education & Wellbeing", '["education", "wellbeing", "activity"]', None),
    "yp-feedback":                          ("Care Events — Wellbeing", '"wellbeing"', None),

    # ── buildings/property ───────────────────────────────────────────────────
    "building-asbestos-register":           ("Care Events — Health & Safety", '"health"', None),
    "building-pest-control":                ("Care Events — Health & Safety", '"health"', None),
    "building-window-restrictor-checks":    ("Care Events — Health & Safety", '"health"', None),
    "buildings":                            ("Care Events — Health & Safety", '"general"', None),
    "data-protection":                      ("Care Events — General", '"general"', None),
    "device-policy":                        ("Care Events — General", '"general"', None),
    "emergency-evacuation-plan":            ("Care Events — Health & Safety", '"general"', None),
    "emergency-planning":                   ("Care Events — Health & Safety", '"general"', None),
    "emergency-protocol-drills":            ("Care Events — Health & Safety", '"general"', None),
    "end-of-shift-checklist":               ("Care Events — Daily Log", '"general"', 14),
    "environmental-risk":                   ("Care Events — Health & Safety", '"health"', None),
    "equality-diversity":                   ("Care Events — Wellbeing", '"wellbeing"', None),
    "external-visitor-log":                 ("Care Events — Visitors", '"professional_contact"', None),
    "fire-drills":                          ("Care Events — Health & Safety", '"general"', None),
    "fire-risk-assessment":                 ("Care Events — Health & Safety", '"general"', None),
    "fire-safety-equipment-checks":         ("Care Events — Health & Safety", '"general"', None),
    "first-aiders-roster":                  ("Care Events — Health", '"health"', None),
    "forms":                                ("Care Events — General", '"general"', None),
    "gas-electrical-safety-checks":         ("Care Events — Health & Safety", '"general"', None),
    "governance-meeting-minutes":           ("Care Events — General", '"general"', 90),
    "grab-bag":                             ("Care Events — Health & Safety", '"general"', None),
    "home-improvement-plan":                ("Care Events — General", '"general"', None),
    "home-pets-care-log":                   ("Care Events — Wellbeing", '"wellbeing"', None),
    "insurance-tracker":                    ("Care Events — General", '"general"', None),
    "keyholding-register":                  ("Care Events — General", '"general"', None),
    "lessons-learned-register":             ("Care Events — General", '"general"', 90),
    "lone-working":                         ("Care Events — Health & Safety", '"general"', None),
    "lone-working-risk-assessment":         ("Care Events — Health & Safety", '"general"', None),
    "maintenance":                          ("Care Events — General", '"general"', None),
    "maintenance-schedule":                 ("Care Events — General", '"general"', None),
    "management-walkround":                 ("Care Events — General", '"general"', None),
    "mandatory-training-matrix":            ("Care Events — General", '"general"', None),
    "child-key-document-tracker":           ("Care Events — General", '"general"', None),
    "child-photo-id-application-tracker":   ("Care Events — General", '"general"', None),
    "cctv-log":                             ("Care Events — General", '"general"', None),
    "agency-staff-feedback":                ("Care Events — General", '"general"', None),
    "agency-staff-induction":               ("Care Events — General", '"general"', None),
    "agency-staff-log":                     ("Care Events — General", '"general"', None),
    "audits":                               ("Care Events — Compliance Evidence", '"general"', 90),
    "board-reporting":                      ("Care Events — Compliance Evidence", '"general"', 90),
    "business-continuity":                  ("Care Events — General", '"general"', None),
    "gifts-register":                       ("Care Events — General", '"general"', None),
}


def process_file(path: str, title: str, category_str: str, days_override: int | None) -> bool:
    with open(path) as f:
        content = f.read()

    panel_start = content.find("<CareEventsPanel")
    if panel_start == -1:
        return False

    panel_end = content.find("/>", panel_start)
    if panel_end == -1:
        return False

    panel_block = content[panel_start:panel_end + 2]

    if "category=" in panel_block:
        return False

    if 'title="Related Care Events"' not in panel_block:
        return False

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
            skipped.append(f"SKIP: {slug}")

    print(f"\n✅ Updated {len(updated)} pages:")
    for s in updated:
        print(f"  {s}")

    if skipped:
        print(f"\n⚠️  Skipped {len(skipped)}:")
        for s in skipped:
            print(f"  {s}")


if __name__ == "__main__":
    main()
