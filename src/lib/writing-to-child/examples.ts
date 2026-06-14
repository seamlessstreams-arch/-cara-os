// ═══════════════════════════════════════════════════════════════════════════
// CARA — WRITING TO THE CHILD  ·  example scenarios
//
// System-led / poor recordings for the ten core scenarios. The engine turns
// each into a review (flags, missing info, child-conscious + professional
// wording suggestions). Used by the API "examples" endpoint, the UI demo, and
// the engine tests. The poor records below are illustrative, not real children.
// ═══════════════════════════════════════════════════════════════════════════

import type { WritingToChildInput } from "./types";

export interface WritingExample {
  key: string;
  title: string;
  input: WritingToChildInput;
}

export const WRITING_EXAMPLES: WritingExample[] = [
  {
    key: "refused_to_engage",
    title: "Child refused to engage",
    input: {
      recordType: "incident",
      rawText: "Child refused to engage and became aggressive when challenged.",
    },
  },
  {
    key: "missing_return",
    title: "Child returned from missing episode",
    input: {
      recordType: "missing_episode",
      rawText: "Child absconded at 6pm. Returned safe and well at 11pm. No concerns.",
    },
  },
  {
    key: "room_search",
    title: "Bedroom search found prohibited items",
    input: {
      recordType: "room_search",
      rawText: "Room search completed. Prohibited items found and confiscated.",
    },
  },
  {
    key: "distress_after_no",
    title: "Child distressed after being told they could not go out",
    input: {
      recordType: "incident",
      rawText: "Child displayed challenging behaviour and was non-compliant after being told they could not go out. Kicked off and was aggressive.",
    },
  },
  {
    key: "family_time",
    title: "Family time / contact with parent",
    input: {
      recordType: "family_time",
      rawText: "Contact took place with mother. Contact was supervised. No issues.",
      childPreferredName: "Mum",
    },
  },
  {
    key: "education_refusal",
    title: "Education refusal",
    input: {
      recordType: "education",
      rawText: "Child refused to engage with education again. Non-attender.",
    },
  },
  {
    key: "manager_oversight",
    title: "Manager oversight after incident",
    input: {
      recordType: "manager_oversight",
      rawText: "Incident reviewed. Oversight completed. Staff acted appropriately.",
    },
  },
  {
    key: "exploitation_concern",
    title: "Exploitation concern",
    input: {
      recordType: "exploitation",
      rawText: "Child is sexually active and has an older boyfriend. Child is putting themselves at risk and has a risky lifestyle.",
      practitionerConcern: "Possible child sexual exploitation by an older male.",
    },
  },
  {
    key: "medication_refusal",
    title: "Medication refusal",
    input: {
      recordType: "medication",
      rawText: "Child refused medication. Non-compliant.",
    },
  },
  {
    key: "health_appointment",
    title: "Health appointment",
    input: {
      recordType: "health",
      rawText: "Dental appointment attended. No issues.",
    },
  },
];

export function exampleByKey(key: string): WritingExample | undefined {
  return WRITING_EXAMPLES.find((e) => e.key === key);
}
