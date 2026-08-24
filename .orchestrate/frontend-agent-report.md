Hopa! CHA-112 is implemented.

**What shipped**

The placeholder `ProfileView` is gone, replaced by five components under `frontend/src/components/profile/` — container, header, stat, tabs, grid — built against Figma frame `0:2662` (tokens `#FAFAFA` header surface, `#262626` text, `#C7C7CC` 1.5px ring around an 86px avatar, 343×29 / radius-6 action button, 44px tab strip, 3-column grid on 1px gutters). Verified visually at 375px against the frame.

The profile now works for two subjects: `profileUserId` state with `openProfile(userId)` routed through the existing `assertSession` guard (AC1), reachable by clicking a post author's avatar or username in the feed, with a back control on other users' profiles. Own profile gets "Edit Profile"; another user's gets Follow / Following wired to `onFollow`, moving the follower count in the same interaction (AC6). "Suggested people" was removed and follow moved onto the header, per plan Q2.

**One design decision worth flagging:** counters render abbreviated via a new `formatCount` helper (1204 → "1.2K"), which would have made "adjusts by exactly one" unobservable. The exact value lives in each stat's accessible name (`aria-label="1204 Followers"`) — that is what both suites assert on, and it's the only non-obvious thing in the change. I noted it at the top of the QA handoff.

**Gates:** unit 23/23, e2e 9/9 (the pre-existing `feed.spec.ts` re-run explicitly and unchanged — the new author button doesn't collide with its numeric like-button selector), `tsc --noEmit` and `eslint` clean.

**Deliberate omissions** (plan Q3–Q5, decision D5): story highlights, video badge, private-account lock, real tagged data — Tagged renders an empty state. Post count derives from the posts array, not `User.postCount`; seed values were reconciled so they agree at rest.

`.orchestrate/api-contract.yaml` now records `GET /user/{username}`, `GET /user/{username}/post`, and `POST /follow` (returning the recomputed `followersCount`). Nothing implements it — it is the handoff artifact for a later `stack:full` task. Full report in `.orchestrate/frontend-agent-report.md`.

STATUS: DONE