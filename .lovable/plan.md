# Move email capture to the end of the Publisher Test

## The problem

Today every "Begin the Publisher Test" button goes to `/auth` with a signup form. A visitor is asked for a name, email and password before they have seen a single question or received anything of value. That is the highest-friction possible placement: the ask comes before the reward, and the reward is still abstract.

## Best practice being applied

Ask for the email at the moment of peak motivation — after the person has invested 12 minutes of thinking and the score exists but is not yet visible. Sunk effort plus curiosity converts far better than a cold signup gate, and the leads who do convert are self-qualified because they finished the diagnostic. Supporting principles baked into the plan:

- Reward first, ask second. The gate wording is "See my Publisher Index score", not "Create an account".
- One field. Email only, no password, no name, no company at the gate.
- Show partial value at the gate so the ask feels like the last step, not a wall.
- Never lose the work. Answers are already captured before the ask, so the gate is a reveal, not a restart.
- Keep the exit clear. Company/profile questions and the book-a-call CTA come after the score.

## The new flow

```text
Homepage  →  /test (no account)  →  7 sections, answers in browser storage
                                        ↓
                        Review step: "Your score is ready"
                        blurred score + one field: work email
                                        ↓
              Account created silently, answers written to it, score revealed
                                        ↓
                  Results → category readings → Book a call
```

## What changes

### 1. Public test route

- New public route `/test` running the same seven-section wizard, no auth gate.
- Answers, current step and section progress are held in browser local storage under a versioned key.
- Progress bar and the "approximately 12 minutes" estimate stay, so the person can see how close they are to the reveal.
- Signed-in users hitting `/test` are sent straight to the existing authenticated wizard so nothing changes for them.
- The organization intake step (company, industry, revenue range) moves out of the pre-score path. It is asked once, after the score, framed as "sharpen your reading". Nothing about the score depends on it being answered first.

### 2. The email gate

- Replaces the review step for anonymous users. It shows: the maturity level name, a blurred/locked score ring, and a list of what unlocks (index score, six category readings, strengths and gaps).
- A single work-email field plus a submit button reading "Show my score".
- Below it: a quiet "already have an account? sign in" link and a one-line privacy reassurance.
- Client and server both validate the email with a trimmed, length-capped schema.

### 3. Passwordless account creation

- Submitting the email creates a real account with a random internal password and signs the person in immediately — no inbox round trip, no password chosen.
- Their locally stored answers are written to a new assessment, scored, and the score page renders right away.
- If the email already belongs to an account, we do not create a duplicate. Instead we send a one-click sign-in link to that address and show a "check your inbox to see your score" state, keeping their local answers intact for when they return.
- Password setup and Google linking stay available from settings, and the existing `/auth` page remains for returning users.

### 4. Homepage and CTA updates

- Every "Begin the Publisher Test" button points at `/test` instead of `/auth?mode=signup&plan=test`. That covers the hero, the closing section, the persona banner and the persona cards.
- Hero microcopy becomes "No account needed to start" to remove the perceived barrier.
- "Sign in" in the header is unchanged.

### 5. Recovery and drop-off

- Anonymous progress persists across page reloads for 30 days; returning visitors see "Resume your test" with their step number.
- Reaching the gate and leaving without submitting is tracked as a distinct event, so the drop-off between finishing the test and giving an email is measurable.

### 6. Tracking

New events so the funnel can be read end to end: test started anonymously, each section completed, email gate viewed, email submitted, account created, score viewed. Anonymous events carry a browser-generated visitor id and are attached to the user record once the account exists, so a lead's pre-signup path is visible in the admin console and the existing Airtable sync.

## Technical notes

- `src/lib/assessment/persistence.ts` gains a local-storage driver behind the same interface used by the Supabase driver, so the wizard component works unchanged against either.
- New public route `src/routes/test.tsx` (SSR on, no gate) reusing the existing `QuestionField`, `ProgressBar` and section config; the authenticated `_authenticated/wizard.tsx` stays as the resume path for signed-in users.
- Account creation runs through a public server function that validates the email, creates the user with the admin client, mints a session for the browser, then writes the assessment and answers in one call. Rate-limited per IP and per email to prevent enumeration and abuse; the existing-account branch returns the same generic response shape either way.
- Anonymous events need a public event-ingest path since `trackEvent` requires a bearer token. Either a narrow public server function with rate limiting, or buffer anonymous events locally and flush them at account creation. The buffer-and-flush option is preferred: no new public write surface, and the events arrive already attributed to the user.
- Auth-email rate limit should be raised before launch, since the existing-account branch sends sign-in links.

## Testing checklist

- [ ] A logged-out visitor can complete all seven sections without ever seeing an auth screen.
- [ ] Refreshing mid-test resumes at the same question with answers intact.
- [ ] Submitting an email at the gate reveals the score in one step, with no inbox visit.
- [ ] Answers taken anonymously appear in the account's assessment record and scores.
- [ ] Submitting an email that already has an account does not create a duplicate and does not reveal whether the account existed.
- [ ] Company profile questions appear only after the score.
- [ ] Signed-in users still land on the existing wizard and resume normally.
- [ ] Funnel events show start, gate view, and email submit as separate steps in the admin console.
