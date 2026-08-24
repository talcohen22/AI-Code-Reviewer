# Pixel Perfect the Visual Design

Status: done  
Owner: Orchestrator  
Last updated: 2026-08-03

## Goal
- Replace the current placeholder "Pixa" look (orange accent, cream radial gradient, Space Grotesk
  display type, glass cards) with the Instagram visual language defined in the linked Figma file,
  so the delivered UI reads as the design rather than as an approximation of it.
- Extract the design into a reusable token layer (color, type, spacing, radius, hairline, ring
  gradient) in `frontend/src/app/globals.css` so future tasks inherit the visual system instead of
  re-inventing per-screen styling.
- Keep every user journey and acceptance criterion from `.doc/product-definition.md` working
  unchanged — this is a re-skin and a layout-accuracy pass, not a behavior change.

## Selected Figma Frames
File: `Instagram UI Screens (Community)` — key `n16ZPecWb35xpvNomre6zu`.
The file ships each screen twice: a dark "Dark Theme" set and a light "Classic Theme" set. The
task URL points at the light `Instagram Main` frame, so the light set is the reference.

| Frame | Node id | Why it is in scope |
|---|---|---|
| Instagram Main (light) | `0:1646` | Feed screen — post card, top bar, tab bar. The task's entry frame. |
| Instagram Profile (light) | `0:2662` | Profile header, stat row, Edit Profile button, 3-up post grid. |
| Instagram Likes (light) | `0:2334` | Notifications list — grouped sections, 60px rows, unread/new grouping. |
| Instagram Authorization (light) | `0:1802` | Auth screen — logo lockup, primary button, link colour, footer bar. |

Supporting nodes read for measurements: `Post / Top` `0:1648`, `Post / Bottom` `0:1666`,
`Stories` `0:1694`, `Tab Bar` `0:1724`, `Account Info` `0:2706`, `Posts` (profile grid) `0:2663`,
`Bars / Status Bar / iPhone X` `0:1778`.

Frames explicitly **not** in scope (they exist in the file but the product definition puts the
features out of scope this phase): `Instagram Live` `0:2036`, `Instagram Story` `0:2236`,
`Instagram IGTV` `0:3250`, `Instagram Direct Messages` `0:2482`, `Instagram Search` `0:1906`,
`Instagram Search Picks` `0:2812`, `Instagram Profile Menu` `0:2938`.

### Tokens extracted from those frames
- Canvas: 375 x 812, page background `#FFFFFF`; chrome surfaces (top bar, tab bar, profile header)
  `#FAFAFA`.
- Text: primary `#262626`; secondary / meta `rgba(0, 0, 0, 0.4)`; status-bar text `#171717`;
  on-accent `#FFFFFF`; photo-counter pill text `#F9F9F9` on `rgba(18, 18, 18, 0.7)`.
- Accent (links, primary button): `#3797EF`.
- Separators: hairline `0.33px` `rgba(60, 60, 67, 0.29)` (bars, section cards); tab-bar top rule
  `rgba(166, 166, 170, 1)`; avatar ring `0.5px` `rgba(0, 0, 0, 0.1)`; outline-button border `1px`
  `rgba(60, 60, 67, 0.18)`.
- Radius: primary button `5px`; outline button `6px`; counter pill `13px` (full); avatars full.
- Story ring gradient: `linear-gradient(-46deg, #E20337 0%, #C60188 21%, #7700C3 100%)`, `2px`
  stroke on a 62px circle, 56px inner image.
- Type (SF Pro Text): 11 regular (meta, `+0.006em`); 12 regular (labels, `-0.0008em`);
  13 semibold / 18px line (username, caption, button label, `-0.0077em`); 14 semibold
  (`-0.0107em`, auth button); 15 semibold / 20px line (section headers, `-0.02em`); 16 semibold /
  21px line (screen title, `-0.0206em`).
- Post card metrics: header 54 tall, avatar 32 at x=10/y=11, username x=52/y=11, location
  x=52/y=30, overflow control right-aligned at x=346; media 375x375 (1:1); footer 147 tall with
  action row baseline y=13.5, like x=14, comment x=55, share x=94.5, save right-aligned x=338.86;
  likes row y=48, caption y=72, date y=121, all at x=15.
- Story rail: 98 tall, 62x81 items, 82px pitch, first item x=10, label 12px at y=67.
- Tab bar: 79 tall, five 75px tabs, ~24px icons, 34px home-indicator inset below.
- Profile: avatar 96, Edit Profile button 343x29, grid cells 124x124 on a 125px pitch (3 columns,
  1px gutter), tab strip 44 tall with a 1px active underline in `#262626`.
- Notifications: grouped section cards with top+bottom hairlines, section header 15 semibold at
  x=16/y=13, standard rows 60 tall, comment-mention rows 91 tall.
- Auth: logo lockup 182x49 centred, primary button 307x44 radius 5, footer bar 84 tall with a top
  hairline and 12px text.

## Scope
- In scope:
  - A CSS-variable token layer in `frontend/src/app/globals.css` (colour, type ramp, hairline,
    radius, ring gradient, layout constants), surfaced to Tailwind v4 via `@theme inline`.
  - Font swap in `frontend/src/app/layout.tsx` from Space Grotesk / Source Sans 3 to a system
    SF-first stack, and metadata rename off "Pixa".
  - Splitting `frontend/src/components/instagram-app.tsx` (currently 528 lines, all views inline)
    into per-view components so each screen can be styled against its frame.
  - Re-skinning and re-measuring the four in-scope screens: feed, profile, notifications, auth,
    plus the create-post surface and the shared app chrome (top bar, bottom tab bar, desktop rail).
  - A desktop adaptation of the mobile-only Figma frames: the 375px column centred with the same
    tokens, chrome promoted to a left rail above `md`.
  - Layout-metric e2e coverage asserting the key Figma measurements hold at 375px.
  - Updating existing unit and e2e tests whose selectors change, without weakening what they prove.
  - A generated token/measurement reference at `.orchestrate/design-token.md`.
- Out of scope:
  - Any backend, server, database, or `backend/` tree. This task is frontend only.
  - New features. No stories, live, IGTV, direct messages, search, or profile menu, regardless of
    what those frames show.
  - Changes to `frontend/src/types/social.ts` domain shapes or to the mock data contract.
  - Changing like / comment / follow / post-create behavior or the simulated session model.
  - A dark theme. The file has one, but the task URL and the product's current surface are light.

## Assumptions
- The light "Classic Theme" frame set is the reference, because the task URL resolves to the light
  `Instagram Main` frame `0:1646`.
- "Pixel perfect" is scoped to the 375px reference viewport. Above 375px the design must scale
  coherently using the same tokens; the Figma file provides no desktop frames to match.
- SF Pro Text is an Apple system font and cannot be webfont-shipped. A system stack that resolves
  to SF Pro on Apple devices and to a close neighbour elsewhere is acceptable; letter-spacing and
  weight tokens carry most of the visual signature.
- Existing behavior is correct and passing. Any test edit is a selector or copy update caused by
  the re-skin, not a relaxation of an acceptance criterion.
- Remote Unsplash avatar and post images in `frontend/src/mock/seed.ts` stay as they are; only
  their framing (size, crop, ring) changes.
- Tailwind v4 stays the styling engine. `.rule/style-rules.md` describes a `main.css` /
  `setup` / `basics` / `cmps` structure that predates this Tailwind setup — see Q3.

## Open Questions
- Q1: Light theme only, or should the dark frame set ship as a toggle?
  - Recommended: **Light only.** The task URL points at a light frame and a theme toggle is a
    feature, not a visual-accuracy pass. Tokens are authored as CSS variables so a dark theme is a
    later variable-override task, not a rewrite.
- Q2: The `Instagram Main` frame has a stories rail (`0:1694`). Do we build it?
  - Recommended: **No.** `.doc/product-definition.md` lists stories as out of scope this phase, and
    a non-functional decorative rail would be fake surface area. The ring gradient token is still
    extracted, because the profile avatar and future work want it.
- Q3: `.rule/style-rules.md` asks for `main.css` importing `setup` / `basics` / `cmps`. The project
  is Tailwind v4 with a single `globals.css`. Which wins?
  - Recommended: **Keep Tailwind + `globals.css`**, and honor the rule's actual intent — "prefer
    CSS variables for colors, spacing, sizing, and shared tokens" — by putting every token in
    `:root` and exposing it through `@theme inline`. Restructuring into `main.css` would be a build
    change disguised as a design task. Flag the rule as stale for a human to reconcile.
- Q4: How is "pixel perfect" verified in CI — screenshot diffing, or asserted measurements?
  - Recommended: **Asserted measurements.** A Playwright spec reads `getBoundingClientRect()` for
    the header height, avatar size, media aspect ratio, tab-bar height, and grid cell pitch and
    compares to the Figma numbers with a ±1px tolerance. Screenshot baselines are font- and
    platform-sensitive and would be flaky across the agent machines and CI. Revisit once the suite
    runs on one pinned container image.
- Q5: Should the top bar carry the Instagram wordmark SVG from `0:1752` / `0:1817`?
  - Recommended: **No — ship a neutral wordmark** in the same 182x49 lockup position and type
    treatment. The Figma asset is the trademarked Instagram logo and this is a clone demo; the
    layout is what the pixel-perfect pass is proving. Name it once in `frontend/src/app/layout.tsx`
    metadata and reuse it.
- Q6: `frontend/src/components/instagram-app.tsx` is one 528-line file. Split it as part of this
  task?
  - Recommended: **Yes, split by view** (`auth-view`, `feed-view`, `post-card`, `profile-view`,
    `notification-view`, `app-shell`). Each frame maps to one file, which is what makes the styling
    reviewable. State stays lifted in `instagram-app.tsx` so behavior and tests are unaffected.

## Steps
1. Record the reference
   - Write `.orchestrate/design-token.md` with the token table and the per-frame measurement table
     from the section above, each row citing its Figma node id.
   - This is the artifact the QA agent checks the built UI against.
2. Build the token layer
   - In `frontend/src/app/globals.css`, define `:root` variables for surface, text, accent,
     hairline, radius, ring gradient, and the type ramp (size + weight + letter-spacing + line
     height per step).
   - Expose them through `@theme inline` so Tailwind utilities resolve to the tokens.
   - Delete the `--accent: #f97316` / `--background: #fffef8` placeholders.
3. Fix typography and document chrome
   - In `frontend/src/app/layout.tsx`, drop the `Space_Grotesk` / `Source_Sans_3` imports and set a
     system stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`).
   - Remove the `font-[var(--font-display)]` usages left behind in the components.
   - Update `metadata.title` / `description` off "Pixa" per Q5.
4. Split the monolith
   - Extract `AuthView`, `FeedView`, `ProfileView`, `NotificationView`, and the nav helpers out of
     `frontend/src/components/instagram-app.tsx` into
     `frontend/src/components/auth-view.tsx`, `feed-view.tsx`, `post-card.tsx`,
     `create-post-panel.tsx`, `profile-view.tsx`, `notification-view.tsx`, `app-shell.tsx`.
   - Keep all state and handlers in `instagram-app.tsx`; pass them down. No behavior change in this
     step — the unit suite must stay green before any styling lands.
5. Re-skin the app shell (frames `0:1646`, `0:2662`)
   - Replace the radial-gradient page background and glass cards with `#FFFFFF` page /
     `#FAFAFA` bars and hairline separators.
   - Top bar: 88 tall (44 status inset + 44 content), wordmark lockup left, actions right.
   - Bottom tab bar: 79 tall, five equal 75px slots, ~24px icons, top hairline; active tab in
     `#262626`, inactive in the secondary token.
   - Above `md`, promote the tabs to a left rail and centre the 375px content column; below `md`,
     the tab bar stays fixed with safe-area padding.
6. Re-skin the post card (frames `0:1648`, `0:1662`, `0:1666`)
   - Header 54 tall: 32px ringed avatar, 13 semibold username, 11 regular meta line, overflow
     control right-aligned.
   - Media: full-bleed 1:1 (`aspect-square`), replacing the current fixed `h-72 md:h-96`.
   - Footer: action row at the Figma offsets (like / comment / share left cluster, save
     right-aligned), likes row, `username + caption` run-on line, then the date in 11px secondary.
   - Keep the like button's accessible name and count text so the existing e2e like assertion in
     `frontend/tests/e2e/feed.spec.ts` still resolves.
   - Keep the `Add a comment` placeholder and the `Send` button name for the same reason.
7. Re-skin profile (frame `0:2662`)
   - 96px avatar, stat row (`posts` / `followers` / `following`) right of the avatar, name + bio
     block beneath, full-width `Edit Profile` outline button at 29 tall / radius 6.
   - Grid tab strip 44 tall with the 1px active underline.
   - Post grid: 3 columns, square cells, 1px gutter — replacing the current
     `grid-cols-2 sm:grid-cols-3` with fixed-height cells.
   - Keep the existing "Suggested people" follow list (it backs AC6) restyled with the row and
     button tokens; it has no frame, so it inherits the notification-row layout.
8. Re-skin notifications (frame `0:2334`)
   - Group entries into `New` / `Today` / `This Week` / `This Month` sections derived from
     `createdAt`, each a hairline-bounded card with a 15-semibold header.
   - 60px rows: 44px avatar, actor + action + relative time as one wrapping line, trailing
     thumbnail or follow button.
   - Preserve unread state and the `Mark all read` control (AC7); express unread with the section
     grouping plus a subtle row tint rather than the current orange card.
9. Re-skin auth and create-post (frames `0:1802`, `0:3163`)
   - Auth: centred wordmark lockup, stacked inputs with hairline borders, 44-tall `#3797EF`
     primary button at radius 5, `#3797EF` secondary link, footer bar with the sign-up prompt.
   - Create post: keep it inline on the feed, restyled with the same input and button tokens and
     a 1:1 preview frame matching the post media aspect.
10. Empty and failure states (AC8)
    - Give the feed, profile grid, comment list, and notification list deliberate empty states in
      the new type ramp.
    - Confirm every rejected action still routes through a `sonner` toast per `.rule/ui-rules.md`,
      and that the `Toaster` inherits the token colours.
11. Tests
    - Update `frontend/tests/unit/instagram-app.test.tsx` imports if the split moves the component,
      and add unit coverage for the notification grouping helper.
    - Add `frontend/tests/e2e/visual.spec.ts` with the Q4 measurement assertions at 375px.
    - Keep `frontend/tests/e2e/feed.spec.ts` passing; adjust only selectors the re-skin genuinely
      moved, and note each adjustment in the QA hand-off.

## Validation
- Visual accuracy, checked at a 375px viewport against `.orchestrate/design-token.md`:
  - Page background `#FFFFFF`, chrome `#FAFAFA`, primary text `#262626`, accent `#3797EF`.
  - Post header 54px tall, avatar 32px, media aspect ratio 1.0, tab bar 79px tall, profile grid
    cells square on a 125px pitch — each within ±1px.
  - No Space Grotesk, no Source Sans 3, no orange accent, and no radial gradient left anywhere
    under `frontend/src/`.
- Behavioral regression — every acceptance criterion in `.doc/product-definition.md` still passes:
  - AC1 auth redirect, AC2 chronological feed with full post metadata, AC3 create post,
    AC4 like toggle by exactly one, AC5 comment append and clear, AC6 follow counters,
    AC7 notification list and unread count, AC8 empty and toast states.
  - AC9 — no horizontal overflow at 375px (already asserted in `frontend/tests/e2e/feed.spec.ts`).
- Quality gates (AC10):
  - `npx tsc --noEmit` clean from `frontend/`.
  - `npm run lint` clean.
  - `npm run test` (Vitest) green.
  - `npm run test:e2e` (Playwright) green, including the new measurement spec.
- Accessibility, since colour and contrast both change:
  - Secondary text `rgba(0, 0, 0, 0.4)` on white is below 4.5:1 — it is reserved for non-essential
    meta (timestamps, counts) and never for the only copy of an action or label.
  - Every icon-only control keeps an `aria-label`; visible focus rings survive the re-skin.

## Risks
- Font substitution: SF Pro Text renders only on Apple hardware. Metric-sensitive assertions could
  pass locally and fail on a Linux CI runner. Mitigated by tolerancing on box metrics rather than
  text advance widths, and by never asserting on rendered text width.
- Test churn: the re-skin moves DOM structure, so `article`-scoped and text-scoped selectors in the
  existing e2e suite can break. Mitigated by step 6 explicitly preserving the like-button text, the
  `Add a comment` placeholder, and the `Send` button name.
- Scope creep from the frame set: the Figma file ships stories, live, IGTV, DMs, and search. Q2
  settles this — visual language only, no new features.
- Splitting the monolith (step 4) and re-skinning in one task makes the diff large and harder to
  review. Mitigated by landing the split as a behavior-neutral commit with the suite green before
  any styling change.
- Contrast regression: the Instagram palette is much lower-contrast than the current placeholder.
  Mitigated by the accessibility check in Validation.
- Trademark: the real Instagram wordmark and glyph are in the file. Q5 keeps them out of the build.
- Desktop is unspecified by the design. The adaptation is a judgement call and could be rejected in
  review; keeping it token-driven makes it cheap to change.

## Rollout Order
1. Steps 1–3 — tokens, typography, document chrome. Low risk, no DOM change, suite stays green.
2. Step 4 — component split, behavior-neutral. Gate: unit and e2e suites green before proceeding.
3. Steps 5–6 — app shell and post card. This is the frame the task links and the highest-value
   half of the change.
4. Steps 7–9 — profile, notifications, auth, create post.
5. Step 10 — empty and failure states.
6. Step 11 — test updates and the new measurement spec.
7. QA agent verifies against `.doc/product-definition.md` and `.orchestrate/design-token.md`, and
   writes `.orchestrate/qa-report.md`.

## Rollback
- All work lands on the task branch created by `dev-loop.js`; reverting the branch restores the
  current visual state with no data or contract migration, because nothing outside
  `frontend/src/` and `frontend/tests/` changes.
- The staged rollout order gives three clean revert points: after the token layer, after the
  component split, and after the app shell. A rejected screen can be reverted on its own, since
  each view is its own file after step 4.
- If only the palette is rejected, the `:root` variable block in `frontend/src/app/globals.css` is
  a single-file revert — layout work survives independently.
- `.orchestrate/design-token.md` is a generated artifact and can be deleted without affecting the
  build.

## Approval Gate
- Awaiting human approval in the terminal. Status flips to `active` on approval.
