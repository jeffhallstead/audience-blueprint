# Sync to GitHub before Phase 6

## Goal
Back up the current Publisher Blueprint™ codebase to a public GitHub repository before beginning the next build phase.

## Current state
- Working tree is clean and the latest commit is `ba4359a` “Applied Executive Obsidian brand”.
- The project is currently only connected to Lovable’s internal git storage (`origin` points to `git.private.lovable-gcp.code.storage`).
- No GitHub remote or sync is configured yet.

## What I can and can’t do from here
I can verify repository health and review the synced code once the connection is live. I **cannot** complete the GitHub OAuth authorization flow on your behalf — that requires the in-app Lovable UI.

## Steps for you to complete in the Lovable editor

1. Open the **Plus (+)** menu in the bottom-left chat input.
2. Choose **GitHub → Connect project**.
3. Authorize the Lovable GitHub App when prompted.
4. Select the GitHub account/organization that should own the repo.
5. Create a **new public** repository named something like `publisher-blueprint` (or `publisher-blueprint-mvp` if that is taken).
6. Lovable will push the current branch/commit to the new repo automatically.

After this is done, two-way sync is active: changes made in Lovable push to GitHub, and changes pushed to GitHub sync back into Lovable.

## Post-sync verification I’ll perform

Once you confirm the repo is connected, I will:

1. Read the GitHub remote URL and confirm the `main` branch matches the latest local commit hash.
2. Run a production build to confirm the exported codebase compiles cleanly.
3. Check that `.env`/secrets files are not present in the public repository (they should be excluded by `.gitignore`).

## Then proceed to next phase

After the sync is verified, we can begin the next phase of work on the authenticated `publisher-blueprint` branch in GitHub, with full version history preserved.

---

## Open questions

- What exact repository name do you want? (`publisher-blueprint`, `publisher-blueprint-mvp`, or something else?)
- Should the repo live under your personal GitHub account or under an organization?
