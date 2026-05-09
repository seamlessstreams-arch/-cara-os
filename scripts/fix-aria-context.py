#!/usr/bin/env python3
"""
Fixes ariaContext that was wrongly placed on CareEventsPanel / PrintButton.
Removes it from those components and adds it to the correct PageShell.
"""
import os
import re

# Files with errors from tsc — CareEventsPanel type
CARE_EVENTS_PANEL_FILES = [
    "src/app/(platform)/agency-staff-feedback/page.tsx",
    "src/app/(platform)/first-relationship-support/page.tsx",
    "src/app/(platform)/food-hygiene/page.tsx",
    "src/app/(platform)/gifts-register/page.tsx",
    "src/app/(platform)/lone-working/page.tsx",
    "src/app/(platform)/medication-training/page.tsx",
    "src/app/(platform)/night-staff-guidance/page.tsx",
    "src/app/(platform)/outdoor-activity-risk-assessments/page.tsx",
    "src/app/(platform)/photo-consent/page.tsx",
    "src/app/(platform)/property-damage/page.tsx",
    "src/app/(platform)/reg44-actions/page.tsx",
    "src/app/(platform)/religious-festival-celebrations/page.tsx",
    "src/app/(platform)/rota/page.tsx",
    "src/app/(platform)/sensory-equipment-inventory/page.tsx",
    "src/app/(platform)/service-user-agreements/page.tsx",
    "src/app/(platform)/settings/page.tsx",
    "src/app/(platform)/staff-safer-caring/page.tsx",
    "src/app/(platform)/staff/page.tsx",
    "src/app/(platform)/supervision-tracker/page.tsx",
    "src/app/(platform)/training/page.tsx",
    "src/app/(platform)/young-people/page.tsx",
    "src/app/(platform)/young-person-job-tracker/page.tsx",
]

# Files with errors — PrintButton type
PRINT_BUTTON_FILES = [
    "src/app/(platform)/ri/challenge-log/page.tsx",
    "src/app/(platform)/ri/ofsted/page.tsx",
    "src/app/(platform)/ri/reg44/page.tsx",
    "src/app/(platform)/ri/reg45/page.tsx",
    "src/app/(platform)/welfare-checks/page.tsx",
    "src/app/(platform)/workforce/induction/page.tsx",
]


def get_source_type(path: str) -> str:
    p = path.lower()
    if any(x in p for x in ["medication", "allergy", "asthma", "adhd", "autism", "camhs"]):
        return "medication"
    if "complaint" in p:
        return "complaint"
    if any(x in p for x in ["incident", "missing", "restraint", "bullying", "accident"]):
        return "incident"
    if any(x in p for x in ["pi-", "physical-intervention", "debrief"]):
        return "pi_debrief"
    if any(x in p for x in ["reg45", "regulation-45"]):
        return "reg45"
    if any(x in p for x in ["building", "asbestos", "pest", "fire-risk", "cctv-log", "window-restrictor"]):
        return "home_check"
    if any(x in p for x in ["agency-staff", "staff/", "/staff", "training", "supervision-tracker", "workforce", "rota"]):
        return "staff"
    if any(x in p for x in ["contact", "family-time", "social-worker"]):
        return "contact_log"
    if any(x in p for x in ["care-plan", "pathway", "assessment-of-need"]):
        return "care_plan"
    if any(x in p for x in ["ri/", "board-report", "audit", "settings", "governance"]):
        return "general"
    return "child_record"


# Pattern for wrongly placed ariaContext line (6 spaces indent)
WRONG_ARIA_PATTERN = re.compile(
    r'      ariaContext=\{\{ pageTitle: "[^"]+", sourceType: "[^"]+" \}\}\n'
)

def fix_care_events_panel_file(filepath: str):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Step 1: Remove the wrongly placed ariaContext
    cleaned = WRONG_ARIA_PATTERN.sub("", content)

    # Step 2: Get page title from PageShell (inline form: <PageShell title="...")
    title_m = re.search(r'<PageShell\s+title="([^"]+)"', cleaned)
    if not title_m:
        print(f"  SKIP (no PageShell title): {filepath}")
        return

    page_title = title_m.group(1)
    source_type = get_source_type(filepath)
    aria_prop = f'ariaContext={{{{ pageTitle: "{page_title}", sourceType: "{source_type}" }}}}'

    # Step 3: Add ariaContext to PageShell
    # For inline PageShell: <PageShell title="..." subtitle="..." actions={...}>
    # We insert ariaContext before actions= or before the closing >
    
    # Try to find a multiline subtitle first
    subtitle_ml = re.compile(r'(      subtitle="[^"]*"\s*\n)')
    sub_matches = list(subtitle_ml.finditer(cleaned))
    
    if sub_matches:
        m = sub_matches[-1]
        cleaned = cleaned[:m.end()] + f"      {aria_prop}\n" + cleaned[m.end():]
    else:
        # Inline PageShell — insert ariaContext before actions= or before >
        # Pattern: <PageShell title="..." subtitle="..." actions=...>
        # Add \n      ariaContext={...} before actions=
        inline_actions = re.compile(
            r'(<PageShell\s+title="[^"]*"\s+subtitle="[^"]*"\s*)\n(\s+actions=)',
            re.DOTALL
        )
        m2 = inline_actions.search(cleaned)
        if m2:
            cleaned = cleaned[:m2.end(1)] + f"\n      {aria_prop}" + cleaned[m2.end(1):]
        else:
            # Inline single-line: <PageShell title="..." subtitle="..." actions={...}>
            inline_single = re.compile(
                r'(<PageShell title="[^"]+" subtitle="[^"]+")\s+(actions=)'
            )
            m3 = inline_single.search(cleaned)
            if m3:
                cleaned = (
                    cleaned[:m3.start(2)]
                    + f'\n      {aria_prop}\n      '
                    + cleaned[m3.start(2):]
                )
            else:
                # Try inserting after inline title line
                inline_title = re.compile(r'(<PageShell title="[^"]+")')
                m4 = inline_title.search(cleaned)
                if m4:
                    # Add ariaContext before closing part
                    pass  # fallback: don't modify if we can't find the right spot

    if cleaned == content:
        print(f"  NO CHANGE: {filepath}")
        return

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(cleaned)
    print(f"  FIXED: {filepath}")


def fix_print_button_file(filepath: str):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Step 1: Remove the wrongly placed ariaContext
    cleaned = WRONG_ARIA_PATTERN.sub("", content)

    # Step 2: PageShell title
    title_m = re.search(r'<PageShell\s+title="([^"]+)"', cleaned)
    if not title_m:
        print(f"  SKIP (no PageShell title): {filepath}")
        return

    page_title = title_m.group(1)
    source_type = get_source_type(filepath)
    aria_prop = f'ariaContext={{{{ pageTitle: "{page_title}", sourceType: "{source_type}" }}}}'

    # Step 3: Add ariaContext after last subtitle= in PageShell context
    subtitle_ml = re.compile(r'(      subtitle="[^"]*"\s*\n)')
    sub_matches = list(subtitle_ml.finditer(cleaned))

    if sub_matches:
        m = sub_matches[-1]
        cleaned = cleaned[:m.end()] + f"      {aria_prop}\n" + cleaned[m.end():]
    else:
        # Try inline subtitle
        inline_single = re.compile(
            r'(<PageShell title="[^"]+" subtitle="[^"]+")\s+(actions=)'
        )
        m3 = inline_single.search(cleaned)
        if m3:
            cleaned = (
                cleaned[:m3.start(2)]
                + f'\n      {aria_prop}\n      '
                + cleaned[m3.start(2):]
            )

    if cleaned == content:
        print(f"  NO CHANGE: {filepath}")
        return

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(cleaned)
    print(f"  FIXED: {filepath}")


def main():
    os.chdir("/workspaces/cornerstone-v2")
    for f in CARE_EVENTS_PANEL_FILES:
        fix_care_events_panel_file(f)
    for f in PRINT_BUTTON_FILES:
        fix_print_button_file(f)
    print("Done.")


if __name__ == "__main__":
    main()
