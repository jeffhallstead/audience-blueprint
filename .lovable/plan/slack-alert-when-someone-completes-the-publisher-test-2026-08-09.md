# Slack alert when someone completes the Publisher Test

Post a short message to a new Slack channel `#publisher-leads` every time a user finishes the Publisher Test.

## What you'll see

A message like:

```text
New Publisher Test completed — Jane Doe (jane@example.com) — Publisher Index score 62 (Level 3, Systematizing)
```

Name falls back to the email when no name is on file.

## Setup step (you)

Connect Slack through the Lovable Slack App connector. I'll surface the connect card; you pick or create the workspace connection. The Slack bot is in all public channels automatically, so once you create `#publisher-leads` in Slack, nothing else is needed. If you make the channel private, the bot must be invited to it.

## How it works

1. Slack connector is linked to the project, exposing `SLACK_API_KEY` to server code.
2. A new server-only helper `src/lib/integrations/slack.server.ts` posts to `chat.postMessage` through the Lovable connector gateway using `LOVABLE_API_KEY` + `SLACK_API_KEY`, with the channel name in one constant (`#publisher-leads`).
3. Hook the notification into the existing event pipeline rather than the UI: the emitter path already fans `platform_events` out to lifecycle, qualification, and CRM sync. Add a Slack branch that fires only on `assessment.completed`, reading score and maturity level from the event payload, and resolving the user's name and email server-side (auth user + `profiles.full_name`) the same way CRM sync does.
4. Failures are logged server-side and never block assessment completion (same non-throwing posture as CRM sync).
5. Anonymous tests are covered too — the claim flow replays buffered events through the same emitter, so a completion still notifies once. Dedupe on the assessment id so a replay can't double-post.

## Technical notes

- Gateway call: `POST https://connector-gateway.lovable.dev/slack/api/chat.postMessage`, headers `Authorization: Bearer $LOVABLE_API_KEY` and `X-Connection-Api-Key: $SLACK_API_KEY`.
- Check `response.ok`, then the parsed `body.ok`; log status plus Slack's `error` field (e.g. `channel_not_found`, `missing_scope`) so misconfiguration is diagnosable from server logs.
- Requires the `chat:write` scope on the connection; if Slack returns `missing_scope`, you'll be prompted to reconnect with it enabled.
- No database or schema changes.
