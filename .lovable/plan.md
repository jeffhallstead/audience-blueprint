# Microdrama Greenlight: "I'm not sure" answers and an upcoming-campaign question

## 1. "I'm not sure" answers

Add an "I'm not sure" option to every question where someone outside the team who would know might honestly not have the answer:

| # | Question | Add "Not sure"? | Why |
|---|---|---|---|
| 1 | Product role | Yes | Most brand teams haven't thought about it as a story before |
| 2 | Purchase path | Yes | Often owned by ecommerce, not marketing |
| 3 | Audience capture | Yes | Often owned by a CRM or lifecycle team |
| 4 | Media budget | Yes | Budget sits with someone more senior |
| 5 | Approval speed | No | Anyone who has shipped work knows the answer |
| 6 | Genre comfort | Yes | Brand guidelines may not cover it |
| 7 | Series commitment | Yes | Leadership may not have decided |
| 8 | Measurement | Yes | Owned by analytics |
| 9 | Production budget | Yes | Same reason as media budget |
| 10 | Growth model | Yes, worded "None of these quite fit" | Some brands won't recognize themselves |

How "Not sure" is scored:
- It counts as **1 point**, the middle answer, so being unsure never helps or hurts the score.
- It **never triggers an automatic No or Not Yet**. Only a definite "no" does that.
- If a question that decides the condition is answered "Not sure" (for example, audience capture for Paid Media Plateau), the condition shows as **"To confirm"** instead of "Met" or "Not met".
- On Q10, "None of these fit" uses the strictest condition (Fragmented Builder) and shows the growth model as "To be determined".

What the person sees on the results page:
- A new section, **"Open questions"**, lists each "Not sure" answer in plain language. For example: "Who owns your email or SMS program, and how often does it send?"
- If 3 or more answers are "Not sure", the verdict becomes **Not Yet**. The headline changes to "We need a few answers before we can call it", and the main button is **Book a 30-minute fit review**. This turns uncertainty into a reason to talk to you.

What you see:
- The Slack alert and the admin Microdrama tab show how many answers were "Not sure" and which ones.

## 2. New question: an upcoming campaign

Add one new question step after question 10, before the email step. It doesn't change the score.

- **"Is there a specific campaign or launch you're considering a microdrama for?"**
  - Yes, there's a specific campaign (a short text box appears: "What is it?")
  - Not yet, we're exploring
- If they answer Yes: **"When does it launch?"** The choices are: within 3 months / 3–6 months / 6–12 months / not set yet.

Where it shows up:
- On the results page, one line: "Planned for: {campaign} · launching {timing}". If the launch is within 3 months, the main button reads "Book a call before your launch window closes".
- In Slack and the admin tab, as a campaign column and a launch-timing column. The admin tab also gets a new "Launching soon" filter for anything within 3 months.

The progress counter changes from "of 10" to "of 11". The intro and the email step update to match: "11 questions, about 3 minutes".

## Technical details

- `greenlight.ts`: add the option value `"unsure"` to the questions above. In scoring, treat `unsure` as 1 point. Skip the gates when the answer is `unsure`. The deciding condition becomes `met | not_met | unconfirmed`, where any input it depends on being `unsure` gives `unconfirmed`. Add a `confirm` prompt to each question for the Open questions list. If 3 or more answers are unsure, the verdict is forced to `not_yet` with the reason `needs_conversation`. For Q10, add the value `"none"`, which maps to `fragmented_builder` and is displayed as TBD.
- Add a separate optional `campaign` object: `{ hasCampaign, name (max 200 chars), launchWindow }`. It is stored in `answers` jsonb, so no change to the database structure is needed.
- `greenlight.functions.ts`: update the checks so each scored answer accepts `0 | 1 | 2 | "unsure"` and the campaign object is optional.
- Result output gains `unsureKeys` and `conditionStatus`. The existing `condition_met` column stays true or false (false when unconfirmed). The full status lives in `answers`.
- Update the page (question step, gate, result), the Slack message format, and the admin panel columns and filters.
