#!/usr/bin/env python3
"""
Adds ariaContext to PageShell on all pages that don't already have it.
Switches ui/page-shell → layout/page-shell where needed.
"""
import os
import re
import subprocess

PLATFORM_DIR = "src/app/(platform)"

def get_source_type(path: str) -> str:
    p = path.lower()
    # Medication
    if any(x in p for x in ["medication", "allergy-plan", "asthma-plan", "adhd-plan", "autism-plan", "camhs", "allergy_plan", "asthma_plan"]):
        return "medication"
    # Complaint
    if "complaint" in p:
        return "complaint"
    # Incident / missing / restraint / bullying / accident
    if any(x in p for x in ["incident", "missing", "restraint", "bullying", "accident-book", "body-map", "body_map"]):
        return "incident"
    # PI debrief
    if any(x in p for x in ["pi-", "physical-intervention", "debrief", "pi_debrief"]):
        return "pi_debrief"
    # Reg45
    if any(x in p for x in ["reg45", "regulation-45"]):
        return "reg45"
    # Home check / building / facilities
    if any(x in p for x in ["building", "asbestos", "pest", "fire-risk", "cctv", "home-check", "window-restrictor", "cleaning-rota", "maintenance", "electrical", "gas-safety", "legionella", "flood"]):
        return "home_check"
    # Staff
    if any(x in p for x in ["agency-staff", "staff-super", "supervision-of", "professional-development", "staff-training", "absence-tracking", "agency-induction", "agency-feedback", "agency-staff-log"]):
        return "staff"
    # Contact log
    if any(x in p for x in ["contact-supervision", "family-time", "chosen-family", "siblings-contact", "social-worker", "professional-consultation", "professional-meeting", "professional-network", "emergency-contact"]):
        return "contact_log"
    # Care plan
    if any(x in p for x in ["care-plan", "behaviour-support-plan", "risk-management-plan", "placement-plan", "healthcare-plan", "assessment-of-need", "allergy-plan"]):
        return "care_plan"
    # Document
    if any(x in p for x in ["document", "filing"]):
        return "document"
    # General admin / reporting
    if any(x in p for x in ["audit-trail", "audits", "board-report", "business-continuity", "commissioning", "cleaning", "cctv-log", "annual-outcomes", "staff-meeting", "governance", "quality-assurance", "bcp"]):
        return "general"
    # Default: child_record for all child-facing pages
    return "child_record"


def process_file(filepath: str) -> bool:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Skip if already has ariaContext
    if "ariaContext" in content:
        return False

    modified = content

    # 1. Switch ui/page-shell → layout/page-shell
    modified = modified.replace(
        'from "@/components/ui/page-shell"',
        'from "@/components/layout/page-shell"'
    )

    # 2. Determine sourceType from path
    source_type = get_source_type(filepath)

    # 3. Find the LAST PageShell title= to get page title
    # Capture inline title like: title="Foo Bar"
    title_matches = list(re.finditer(r'title="([^"]+)"', modified))
    if not title_matches:
        return False

    # The last title= in a PageShell context is usually the main render
    page_title = title_matches[-1].group(1)

    aria_prop = f'ariaContext={{{{ pageTitle: "{page_title}", sourceType: "{source_type}" }}}}'

    # 4. Find the last <PageShell block and inject ariaContext
    # Strategy: find the last occurrence of a subtitle= line and insert after it
    # If no subtitle, insert after title=

    # Try inserting after last subtitle="..." line
    # Pattern: subtitle="..." or subtitle={`...`} followed by newline
    subtitle_pattern = re.compile(
        r'(      subtitle="[^"]*"\s*\n)',
    )
    subtitle_matches = list(subtitle_pattern.finditer(modified))

    if subtitle_matches:
        # Use the LAST match
        m = subtitle_matches[-1]
        indent = "      "
        insert_text = f"{indent}{aria_prop}\n"
        modified = modified[:m.end()] + insert_text + modified[m.end():]
    else:
        # Try subtitle with template literal
        subtitle_pattern2 = re.compile(r'(      subtitle=\{`[^`]*`\}\s*\n)')
        subtitle_matches2 = list(subtitle_pattern2.finditer(modified))
        if subtitle_matches2:
            m = subtitle_matches2[-1]
            indent = "      "
            insert_text = f"{indent}{aria_prop}\n"
            modified = modified[:m.end()] + insert_text + modified[m.end():]
        else:
            # No subtitle — insert after last title= line in PageShell
            title_line_pattern = re.compile(r'(      title="[^"]*"\s*\n)')
            title_line_matches = list(title_line_pattern.finditer(modified))
            if title_line_matches:
                m = title_line_matches[-1]
                indent = "      "
                insert_text = f"{indent}{aria_prop}\n"
                modified = modified[:m.end()] + insert_text + modified[m.end():]
            else:
                # Inline PageShell — skip, too complex
                return False

    if modified == content:
        return False

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(modified)

    return True


def main():
    changed = []
    skipped = []

    for root, dirs, files in os.walk(PLATFORM_DIR):
        # Skip intelligence/aria subdirs
        dirs[:] = [d for d in dirs if d not in ["intelligence", "aria"]]
        for fname in files:
            if fname != "page.tsx":
                continue
            fpath = os.path.join(root, fname)
            try:
                if process_file(fpath):
                    changed.append(fpath)
                else:
                    skipped.append(fpath)
            except Exception as e:
                print(f"ERROR {fpath}: {e}")

    print(f"\nModified {len(changed)} files, skipped {len(skipped)} files.")
    for f in sorted(changed):
        print(f"  CHANGED: {f}")


if __name__ == "__main__":
    main()
