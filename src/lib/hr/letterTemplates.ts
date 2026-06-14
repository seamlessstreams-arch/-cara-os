// ══════════════════════════════════════════════════════════════════════════════
// HR — LETTER TEMPLATES
//
// Starting-point templates per letter_type. The HR Process Guardian is run
// against the rendered draft before any manager approval. Templates use
// [square brackets] for specifics that the manager fills in. The wording
// embeds the rights and the neutral-act framing the Guardian expects to
// see, so a freshly templated letter should pass review with only minor
// edits.
//
// The templates intentionally do not include legalese the home would not
// say. Tone is the same as the rest of Cara: plain, professional, calm.
// ══════════════════════════════════════════════════════════════════════════════

import type { HrLetterType } from "@/lib/hr/types";
import { applyCaraPostprocessor } from "@/lib/cara/writingStyleRules";

export interface LetterContext {
  recipientName: string;
  homeName?: string;
  caseRefDisplay?: string;
  meetingDate?: string;
  meetingTime?: string;
  meetingLocation?: string;
  managerName?: string;
  managerRole?: string;
  contactName?: string;
  contactDetails?: string;
  effectiveFromDate?: string;
  reviewDate?: string;
  appealDeadlineDays?: number;
  // Free-text content the manager has supplied
  concernNarrative?: string;
  outcomeNarrative?: string;
  basisNarrative?: string;
  improvementsExpected?: string;
  supportProvided?: string;
}

const SIGNED_OFF_BY_LINE = (ctx: LetterContext) =>
  `Yours sincerely,\n\n${ctx.managerName ?? "[Manager name]"}\n${ctx.managerRole ?? "Registered Manager"}${
    ctx.homeName ? `\n${ctx.homeName}` : ""
  }`;

const APPEAL_LINE = (days: number) =>
  `You have the right to appeal this decision in writing within ${days} working days of the date of this letter. Please address any appeal to ${"[appeal contact]"}.`;

const REPRESENTATION_LINE =
  "You have the right to be accompanied at this meeting by a work colleague or a trade union representative. Please let us know in advance who will accompany you.";

// ─── Templates ───────────────────────────────────────────────────────────────

export function renderLetterTemplate(type: HrLetterType, ctx: LetterContext): string {
  const meeting = `${ctx.meetingDate ?? "[date]"} at ${ctx.meetingTime ?? "[time]"}, to be held at ${ctx.meetingLocation ?? "[location]"} or by [video platform]`;
  const recipient = ctx.recipientName || "[Recipient name]";
  const ref = ctx.caseRefDisplay ? `\n\nCase reference: ${ctx.caseRefDisplay}` : "";

  let body = "";

  switch (type) {
    case "investigation_invite":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `I am writing to invite you to an investigation meeting on ${meeting}. The purpose of the meeting is to gather facts in relation to the following matter: ${ctx.concernNarrative ?? "[set out the concern with relevant dates]"}.`,
        ``,
        `This meeting is part of a fact-finding process. No decision has been made and none will be reached at the meeting itself.`,
        ``,
        REPRESENTATION_LINE,
        ``,
        `If you are unable to attend on the date proposed, please contact ${ctx.contactName ?? "[name]"} (${ctx.contactDetails ?? "[contact details]"}) to agree an alternative.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "witness_invite":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `I am writing to invite you to attend a witness meeting on ${meeting}. The purpose of the meeting is to ask for your account in relation to the following matter: ${ctx.concernNarrative ?? "[set out the matter the witness can speak to]"}.`,
        ``,
        `Your account will be held with care and shared only with those who need it for the investigation.`,
        ``,
        REPRESENTATION_LINE,
        ``,
        `If you are unable to attend on the date proposed, please contact ${ctx.contactName ?? "[name]"} (${ctx.contactDetails ?? "[contact details]"}) to agree an alternative.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "disciplinary_invite":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `I am writing to invite you to a disciplinary meeting on ${meeting}.`,
        ``,
        `The purpose of the meeting is to consider the following matters: ${ctx.concernNarrative ?? "[set out the specific concerns, with dates and a clear reference to the evidence]"}.`,
        ``,
        `Copies of the documents that will be relied on at the meeting are enclosed. Please review them in advance and bring any additional information you wish to be considered.`,
        ``,
        REPRESENTATION_LINE,
        ``,
        `If you are unable to attend on the date proposed, please contact ${ctx.contactName ?? "[name]"} (${ctx.contactDetails ?? "[contact details]"}) to agree an alternative within 5 working days.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "grievance_invite":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `Thank you for raising your grievance. We take your concerns seriously and will investigate them fairly and without delay.`,
        ``,
        `I am writing to invite you to a grievance meeting on ${meeting}, to discuss the points you have raised: ${ctx.concernNarrative ?? "[set out the grievance points]"}.`,
        ``,
        REPRESENTATION_LINE,
        ``,
        `If you are unable to attend on the date proposed, please contact ${ctx.contactName ?? "[name]"} (${ctx.contactDetails ?? "[contact details]"}) to agree an alternative.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "suspension":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `Following the concerns raised on ${ctx.meetingDate ?? "[date]"}, a decision has been taken to suspend you from work with effect from ${ctx.effectiveFromDate ?? "[effective date]"}. This suspension is a neutral act and is not a disciplinary sanction. It is in place to allow a fair and proportionate investigation to take place.`,
        ``,
        `The basis for this decision is set out in the written reasons accompanying this letter.`,
        ``,
        `Your single point of contact during this period will be ${ctx.contactName ?? "[name]"} (${ctx.contactDetails ?? "[contact details]"}). Suspension will be reviewed at intervals, and the first review will take place on ${ctx.reviewDate ?? "[first review date]"}.`,
        ``,
        `You may seek support from your trade union, a colleague, or an external source such as ACAS. Your welfare is a priority during this period.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "suspension_review":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `I am writing to confirm the outcome of the suspension review held on ${ctx.meetingDate ?? "[date]"}. Suspension remains a neutral act pending the conclusion of the investigation.`,
        ``,
        `The current position of the investigation is: ${ctx.outcomeNarrative ?? "[brief update without prejudging findings]"}.`,
        ``,
        `The next review will take place on ${ctx.reviewDate ?? "[next review date]"}. Your single point of contact remains ${ctx.contactName ?? "[name]"} (${ctx.contactDetails ?? "[contact details]"}).`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "no_further_action":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `Following the matters raised on ${ctx.meetingDate ?? "[date]"} and the steps that have been taken since, the decision has been reached that no further action will be taken at this time.`,
        ``,
        `This letter is being sent so that the position is clear on your record. Thank you for your engagement with the process.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "informal_concern":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `I am writing to confirm the outcome of our informal conversation on ${ctx.meetingDate ?? "[date]"}.`,
        ``,
        `We discussed: ${ctx.concernNarrative ?? "[set out the concern in factual terms]"}. The expectation going forward is: ${ctx.improvementsExpected ?? "[set out the standard expected]"}. Support that will be provided: ${ctx.supportProvided ?? "[set out the support]"}.`,
        ``,
        `This is an informal note and does not form part of any formal disciplinary record. We will revisit the position at supervision.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "written_warning":
    case "final_written_warning":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `Following the disciplinary meeting held on ${ctx.meetingDate ?? "[date]"}, a decision has been reached. The decision is to issue a ${type.replace(/_/g, " ")}.`,
        ``,
        `The basis for this decision is: ${ctx.basisNarrative ?? "[set out the findings of fact, the standard expected, the impact, and the mitigation considered]"}.`,
        ``,
        `Expectations going forward: ${ctx.improvementsExpected ?? "[set out the standard expected, and the period during which the warning will remain on the record]"}. Support that will be provided: ${ctx.supportProvided ?? "[set out the support]"}.`,
        ``,
        APPEAL_LINE(ctx.appealDeadlineDays ?? 5),
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "dismissal":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `Following the disciplinary meeting held on ${ctx.meetingDate ?? "[date]"}, a decision has been reached that your employment will end with effect from ${ctx.effectiveFromDate ?? "[effective date]"}.`,
        ``,
        `The basis for this decision is: ${ctx.basisNarrative ?? "[set out the findings, the standard expected, the seriousness, and the mitigation considered]"}. The decision has been reached after considering the available alternatives.`,
        ``,
        APPEAL_LINE(ctx.appealDeadlineDays ?? 5),
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "appeal_invite":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `Thank you for lodging your appeal. I am writing to invite you to an appeal meeting on ${meeting}.`,
        ``,
        `The purpose of the meeting is to consider the grounds of your appeal: ${ctx.concernNarrative ?? "[summarise the grounds set out in the appeal]"}.`,
        ``,
        REPRESENTATION_LINE,
        ``,
        `If you are unable to attend on the date proposed, please contact ${ctx.contactName ?? "[name]"} (${ctx.contactDetails ?? "[contact details]"}) to agree an alternative.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "appeal_outcome":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `Following the appeal meeting held on ${ctx.meetingDate ?? "[date]"}, a decision has been reached. The decision is: ${ctx.outcomeNarrative ?? "[uphold / partially uphold / not uphold] the appeal"}.`,
        ``,
        `The reasons for this decision are: ${ctx.basisNarrative ?? "[set out the reasoning, with reference to the grounds of appeal and any new information considered]"}.`,
        ``,
        `This decision concludes the internal process.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "probation_review":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `Thank you for attending your probation review meeting on ${ctx.meetingDate ?? "[date]"}.`,
        ``,
        `We discussed: ${ctx.concernNarrative ?? "[areas of strength and areas for development]"}. The expectations for the next period are: ${ctx.improvementsExpected ?? "[set out clearly]"}. Support that will be provided: ${ctx.supportProvided ?? "[set out the support]"}.`,
        ``,
        `Your next review will take place on ${ctx.reviewDate ?? "[next review date]"}.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "probation_extension":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `Following your probation review on ${ctx.meetingDate ?? "[date]"}, a decision has been taken to extend your probationary period to ${ctx.effectiveFromDate ?? "[new end date]"}.`,
        ``,
        `The reasons for this extension are: ${ctx.basisNarrative ?? "[set out clearly, including the evidence considered]"}. The expectations during the extension are: ${ctx.improvementsExpected ?? "[set out clearly]"}. Support that will be provided: ${ctx.supportProvided ?? "[set out the support]"}.`,
        ``,
        APPEAL_LINE(ctx.appealDeadlineDays ?? 5),
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "probation_confirmation":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `I am pleased to confirm that you have successfully completed your probationary period as of ${ctx.effectiveFromDate ?? "[completion date]"}. Thank you for your work and engagement during this time.`,
        ``,
        `Your continued development will be supported through regular supervision and appraisal.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "failed_probation":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `Following your probation review on ${ctx.meetingDate ?? "[date]"}, a decision has been reached that your probationary period has not been completed successfully and your employment will end with effect from ${ctx.effectiveFromDate ?? "[effective date]"}.`,
        ``,
        `The reasons for this decision are: ${ctx.basisNarrative ?? "[set out the standard expected, the evidence, the support that was offered during the probationary period, and the time given to improve]"}.`,
        ``,
        APPEAL_LINE(ctx.appealDeadlineDays ?? 5),
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "sickness_meeting":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `I am writing to invite you to a sickness review meeting on ${meeting}.`,
        ``,
        `The purpose of the meeting is to discuss your absence and how we can best support you. We will look at any reasonable adjustments, occupational health input, and a phased return where appropriate. ${ctx.concernNarrative ? `The specific points to discuss are: ${ctx.concernNarrative}.` : ""}`,
        ``,
        REPRESENTATION_LINE,
        ``,
        `If you are unable to attend on the date proposed, please contact ${ctx.contactName ?? "[name]"} (${ctx.contactDetails ?? "[contact details]"}) to agree an alternative.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "welfare_meeting":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `I am writing to invite you to a welfare meeting on ${meeting}. This is a supportive meeting and not a disciplinary meeting. The purpose is to talk about how you are, and what support might help.`,
        ``,
        REPRESENTATION_LINE,
        ``,
        `If you are unable to attend on the date proposed, please contact ${ctx.contactName ?? "[name]"} (${ctx.contactDetails ?? "[contact details]"}) to agree an alternative.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "occupational_health_referral":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `I am writing to confirm that an occupational health referral has been made on your behalf, with your consent, to support your wellbeing at work.`,
        ``,
        `The information shared with occupational health is the minimum necessary to enable them to advise on your fitness for duties and any reasonable adjustments. You will be invited to an appointment directly. Anything you share with occupational health is confidential and is shared back with us only with your consent and within the scope agreed.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "return_to_work_outcome":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `Thank you for attending your return to work meeting on ${ctx.meetingDate ?? "[date]"}.`,
        ``,
        `We agreed: ${ctx.outcomeNarrative ?? "[set out the agreed return arrangements, any reasonable adjustments, and the review points]"}. Support that will be provided: ${ctx.supportProvided ?? "[set out the support]"}.`,
        ``,
        `Your next review will take place on ${ctx.reviewDate ?? "[review date]"}.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "capability_meeting":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `I am writing to invite you to a capability meeting on ${meeting}.`,
        ``,
        `The purpose of the meeting is to discuss the standards expected, the support available, and how to put a plan in place that gives you a fair opportunity to meet those standards. ${ctx.concernNarrative ? `The specific points to discuss are: ${ctx.concernNarrative}.` : ""}`,
        ``,
        REPRESENTATION_LINE,
        ``,
        `If you are unable to attend on the date proposed, please contact ${ctx.contactName ?? "[name]"} (${ctx.contactDetails ?? "[contact details]"}) to agree an alternative.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "performance_improvement_plan":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `Following our meeting on ${ctx.meetingDate ?? "[date]"}, I am writing to confirm the performance improvement plan that we agreed.`,
        ``,
        `Areas to develop: ${ctx.concernNarrative ?? "[set out clearly]"}. Standards expected: ${ctx.improvementsExpected ?? "[set out clearly]"}. Support that will be provided: ${ctx.supportProvided ?? "[set out the support]"}.`,
        ``,
        `Review points: ${ctx.reviewDate ?? "[set out the review schedule]"}.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "mediation_invite":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `I am writing to invite you to take part in a workplace mediation on ${meeting}, with the support of an independent mediator.`,
        ``,
        `Mediation is a voluntary, confidential conversation aimed at finding a way forward. Nothing said in mediation is used in any disciplinary or grievance process unless all parties agree.`,
        ``,
        `Please let ${ctx.contactName ?? "[name]"} (${ctx.contactDetails ?? "[contact details]"}) know whether you are willing to take part.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "whistleblowing_acknowledgement":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `Thank you for raising your concerns under our whistleblowing arrangements. We take what you have shared seriously.`,
        ``,
        `Your concerns will be considered carefully, and you will not be treated less favourably for having raised them. We will share an update with you by ${ctx.reviewDate ?? "[update date]"}, or sooner if there is anything you need to know.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;

    case "safeguarding_allegation_holding":
      body = [
        `Dear ${recipient},${ref}`,
        ``,
        `I am writing to acknowledge that an allegation has been made and to confirm what is happening next.`,
        ``,
        `As you know, where any allegation of this nature is made, we follow the LADO process. This is a neutral process and is in place to allow the matter to be considered properly and fairly. No findings have been made and none will be made until the process has run its course.`,
        ``,
        `Your single point of contact during this period will be ${ctx.contactName ?? "[name]"} (${ctx.contactDetails ?? "[contact details]"}). The next update is expected by ${ctx.reviewDate ?? "[update date]"}.`,
        ``,
        `You may seek support from your trade union, a colleague, or an external source such as ACAS. Your welfare is a priority during this period.`,
        ``,
        SIGNED_OFF_BY_LINE(ctx),
      ].join("\n");
      break;
  }

  return applyCaraPostprocessor(body);
}
