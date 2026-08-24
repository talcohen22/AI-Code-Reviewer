# Profile Page

Status: draft
Owner: Orchestrator
Last updated: 2026-08-03

## Goal
- Replace the placeholder `ProfileView` in `frontend/src/components/instagram-app.tsx` with a
  profile page that matches the Figma "Instagram Profile" frame: avatar, name, bio,
  post/follower/following counters, a primary action button, a tab strip, and a
  three-column post grid.
- Make the profile work for two subjects — the signed-in user (Edit Profile action) and any
  other user (Follow / Following action) — so acceptance criterion AC6 is provable on the
  screen it actually belongs to.
- Keep the mock data layer honest: counters derive from one source of truth, and every list
  renders a deliberate empty state.

## Scope
- In scope:
  - A profile header component: 96px avatar with ring, display name, bio, and the
    Posts / Followers / Following counter triple laid out per the design.
  - A primary action button that renders "Edit Profile" on the signed-in user's own profile
    and Follow / Following on another user's profile.
  - A tab strip with a Grid tab and a Tagged tab, Grid selected by default.
  - A three-column square post grid with 1px gutters, newest-first, plus an empty state.
  - Navigation into a profile by clicking a post author's avatar or username in the feed,
    and a back affordance to return to the feed.
  - Extraction of the profile UI out of `instagram-app.tsx` into its own component files.
  - Unit tests (Vitest) and e2e tests (Playwright) for the new behaviour.
- Out of scope (this task):
  - Story highlights row (see Q3) and video-post overlay badge (see Q4) — both belong to
    features `.doc/product-definition.md` lists as out of scope for this phase.
  - Followers / following list screens — already a separate backlog item.
  - Post detail view when a grid tile is clicked — already a separate backlog item.
  - A real Tagged-posts data model; the Tagged tab renders an empty state only (see Q5).
  - Any `backend/` work, server routes, or persistence. This task is frontend-only.
  - Global pixel-perfect restyling of feed / auth / notifications — that is the separate
    "Pixel perfect the visual design" backlog item.

## Selected Figma Frames
Source: `https://www.figma.com/design/n16ZPecWb35xpvNomre6zu/Instagram-UI-Screens--Community-?node-id=0-2662`

| Frame / group | Node id | Used for |
|---|---|---|
| `Instagram Profile` | `0:2662` | Root frame, 375×812, page background `#FFFFFF` |
| `Account Info` | `0:2706` | Header block, 375×403, surface `#FAFAFA` with hairline bottom rule |
| `Top Bar` | `0:2708` | Centered username `jacob\_w`, 16px/21px semibold; trailing menu icon |
| `Info` | `0:2743` | Container for photo + statistics + name/bio |
| `Photo` | `0:2754` | 96px ring (`#C7C7CC`, 1.5px) around an 86px avatar |
| `Statistics` | `0:2747` | Counts 16px/21px semibold `#262626`; labels 13px `Posts` / `Followers` / `Following` |
| `Name and Bio` | `0:2744` | Name 12px semibold; bio 12px/17px, inline mention in `#05386B` |
| `Edit Profile Button` | `0:2740` | 343×29, radius 6px, 1px border `rgba(60,60,67,0.18)`, label 13px semibold |
| `Stories` | `0:2722` | Highlights row — **not implemented**, see Q3 |
| `Tabs` | `0:2680` | 375×44 tab strip below the header |
| `Posts` | `0:2663` | 3-column grid, 124px tiles on a 125px pitch (1px gutter) |
| `Video Post` | `0:2672` | Video badge overlay — **not implemented**, see Q4 |
| `Tab Bar` | `0:2757` | Bottom nav; the app already has an equivalent, not rebuilt here |
| `Bars / Status Bar / iPhone X` | `0:2788` | Device chrome — deliberately not implemented |

Design tokens taken from the frame: background `#FFFFFF`, header surface `#FAFAFA`,
primary text `#262626`, hairline / ring `#C7C7CC`, divider `rgba(60,60,67,0.18)`,
link `#05386B`.

## Assumptions
- The app stays a single client component tree driven by `useState` in
  `instagram-app.tsx`; there is no router in the project today and this task does not add one.
- The mock layer in `frontend/src/mock/seed.ts` remains the only data source. Its three
  users are enough to exercise own-profile and other-profile paths.
- `next/image` continues to be used with `unoptimized`, matching the existing feed code.
- The design is a 375px mobile frame; the desktop layout is a widened version of the same
  structure, not a separate design.
- Existing tests in `frontend/tests/unit/instagram-app.test.tsx` and
  `frontend/tests/e2e/feed.spec.ts` must keep passing unchanged.
- Repository coding rules apply: no trailing semicolons in `.ts` / `.tsx`, `sonner` for
  toasts, `lucide-react` for icons.

## Open Questions
- Q1: Should the profile become a real Next.js route (`/profile/[username]`) or stay a
  `view` state inside `instagram-app.tsx`?
  - Recommended: **stay a `view` state**, adding a `profileUserId` state alongside it.
    Introducing routing touches auth guarding, the feed, and notifications all at once and
    would collide with the pending "Pixel perfect the visual design" task. Revisit routing
    when "post detail view" and "explore / search users" land, since those three together
    justify the refactor once.
- Q2: The current `ProfileView` renders a "Suggested people" card that does not exist in the
  design and is the only follow control in the app. Remove it?
  - Recommended: **remove it**, and move follow / unfollow onto the other-user profile
    header where the design puts it. AC6 stays provable because the feed now links to author
    profiles. Do not delete `onFollow` — rewire it.
- Q3: The design has a story-highlights row (`Stories` `0:2722`), but
  `.doc/product-definition.md` lists Stories as out of scope for this phase.
  - Recommended: **omit the row.** Shipping highlight bubbles with no stories behind them is
    exactly the fake complexity plan 001 decided against (D5). Note the omission in the QA
    report so it reads as a decision, not a miss.
- Q4: The design's grid contains a video post with a video badge (`Video Post` `0:2672`).
  Reels / video are out of scope.
  - Recommended: **omit the badge** and render all tiles as images. The `Post` type has no
    media-type field, and adding one for a feature this phase will not build is speculative.
- Q5: The tab strip has two tabs. There is no tagged-post data.
  - Recommended: **render both tabs, Grid selected by default, and give Tagged a deliberate
    empty state** ("No tagged posts yet"). This satisfies AC8, keeps the design's structure,
    and costs nothing. The alternative — a single tab — silently drops a design element.
- Q6: `ProfileView` shows `allPost.length` for the post count while `User.postCount` in the
  seed says something different (`u-1` claims 4, the seed has 1). Which wins?
  - Recommended: **derive the count from the posts array.** It is the only value that can
    satisfy AC3 (creating a post increments the count). Keep `postCount` on the `User` type
    because the future API will return it, but stop rendering it, and correct the seed values
    so the two agree at rest.

## Steps
1. Data and helper groundwork
   - In `frontend/src/mock/seed.ts`, reconcile each user's `postCount` with the number of
     posts they actually own, and add two or three more posts for `u-1` so the grid has
     enough tiles to show a real three-column layout.
   - Add a small `formatCount` helper to `frontend/src/lib/helpers.ts` for the counter
     triple, with a unit test.
2. Extract the profile UI
   - Create `frontend/src/components/profile/profile-view.tsx` as the container, plus
     `profile-header.tsx`, `profile-stat.tsx`, `profile-tabs.tsx`, and `profile-grid.tsx`.
   - Delete the old `ProfileView` and the "Suggested people" block from
     `frontend/src/components/instagram-app.tsx` (per Q2).
3. Profile state and navigation
   - Add `profileUserId` state to `InstagramApp`, defaulting to `currentUserId`.
   - Add an `openProfile(userId)` handler that routes through the existing `assertSession`
     guard so AC1 still holds for other users' profiles.
   - Make the feed's author avatar and username buttons call `openProfile(post.userId)`.
   - Render a back control on the profile when the subject is not the signed-in user.
4. Header per design
   - Build the top bar (centered username, trailing menu icon) and the info block: ringed
     96px avatar, counter triple, name, and bio.
   - Apply the tokens listed in Selected Figma Frames.
   - Omit the private-account lock icon, consistent with decision D5 in
     `.plan/001-2026-07-01-instagram-clone.md`.
5. Primary action button
   - Own profile: an "Edit Profile" button styled per `0:2740`. It is presentational this
     task and raises a `sonner` toast stating editing is not available yet — no dead click.
   - Other profile: Follow / Following wired to the existing `onFollow`, updating the
     rendered follower count in the same interaction (AC6).
6. Tabs and grid
   - Build the two-tab strip with an active underline, Grid default, and `aria-selected`
     state so tests can assert on roles rather than class names.
   - Build the three-column grid: square tiles, 1px gutters, newest-first.
   - Add the Grid empty state ("No posts yet") and the Tagged empty state (AC8, Q5).
7. Responsive pass
   - Verify the whole profile at 375px with no horizontal overflow (AC9), and widen the
     avatar/stat row sensibly at `md` and up.
8. Tests
   - Unit (`frontend/tests/unit/profile-view.test.tsx`): counters render from the derived
     data; own profile shows Edit Profile and other profile shows Follow; following toggles
     the label and adjusts the follower count by exactly one and reverses; switching to
     Tagged shows its empty state; a user with no posts shows the grid empty state.
   - E2e (`frontend/tests/e2e/profile.spec.ts`): from the feed, clicking an author opens
     that author's profile; follow / unfollow round-trips the button label and the follower
     count; the profile has no horizontal overflow at 375px.
9. Contract note
   - Record the profile read shape (`GET /user/{username}` returning the counters, bio, and
     the user's posts) in `.orchestrate/api-contract.yaml`, creating the file if the QA or
     frontend stage has not yet. No `docs/` directory is created.

## Validation
- `cd frontend && npx tsc --noEmit` is clean (AC10).
- `cd frontend && npm test` passes, including the pre-existing feed and helper suites.
- `cd frontend && npm run test:e2e` passes, including the pre-existing `feed.spec.ts`.
- `cd frontend && npm run lint` is clean.
- Acceptance criteria touched by this task:
  - AC1 — opening a profile while logged out redirects to auth with a toast.
  - AC3 — publishing a post increments the post counter shown on the own profile.
  - AC6 — follow / unfollow on another user's profile updates both the button state and the
    follower count, and reverses cleanly.
  - AC8 — the Grid tab with no posts and the Tagged tab both render deliberate empty states.
  - AC9 — the profile is usable at 375px with no horizontal scrolling.
- Visual check against frame `0:2662`: avatar ring, counter triple alignment, button height
  and radius, tab strip height, and the 3-column grid with 1px gutters.

## Risks
- Extracting `ProfileView` touches `instagram-app.tsx`, which the existing feed tests render.
  Mitigation: change only the profile branch and the feed's author elements; run the existing
  suites before adding new ones.
- Removing "Suggested people" removes the app's only follow control. Mitigation: step 3's
  feed → profile navigation must land in the same change, not after it.
- Deriving the post count from the posts array will change numbers the demo has shown before.
  Mitigation: step 1 reconciles the seed so nothing looks broken at rest.
- Making the feed author a button can collide with the existing e2e like-button selector,
  which filters buttons by a numeric-only label. Mitigation: the author button's label is the
  username, so the filter still holds — but re-run `feed.spec.ts` explicitly.
- Omitting the story highlights row is a visible divergence from the Figma frame and could
  read as an incomplete implementation. Mitigation: Q3 records it as a decision and QA notes it.

## Rollout Order
1. Steps 1–2: seed reconciliation and component extraction, with existing suites green.
2. Steps 3–5: profile state, navigation, header, and the primary action button.
3. Steps 6–7: tabs, grid, empty states, and the responsive pass.
4. Step 8: unit and e2e coverage.
5. Step 9: API contract note, then QA against `.doc/product-definition.md`.

## Rollback
- The work is confined to one branch and one feature area; `git revert` of the branch merge
  restores the previous profile.
- Component-level fallback: `instagram-app.tsx` can re-point its `profile` branch at the old
  inline `ProfileView` while keeping the seed corrections, since the new components are
  additive files under `frontend/src/components/profile/`.
- The seed reconciliation in step 1 is independently revertible and affects display counts only.

## Approval Gate
- Awaiting human approval in the terminal. Status flips to `active` on approval.
