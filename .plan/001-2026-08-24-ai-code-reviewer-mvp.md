# AI Code Reviewer MVP

Status: active
Owner:
Last updated: 2026-08-24

## Goal
Ship the frontend-only MVP described in `.doc/product-definition.md`: a developer can
submit code (paste or a GitHub file link), see the AI review's findings grouped by
category and filterable by severity, read generated tests, and see that review land in a
session-scoped quality dashboard — all against a mock data layer, satisfying AC1–AC9.

## Scope
In scope — covers backlog items "code submission view", "review results view",
"severity filtering", and "quality dashboard" from `.plan/000-backlog.md` as one
foundational build:
- Scaffold `frontend/` (Vite + React 19 + TypeScript + MUI + Monaco Editor), per the
  stack and conventions in `.claude/agents/frontend.md` and `.claude/rules/`.
- Mock data layer: `frontend/src/types/review.ts`, `frontend/src/mock/seed.ts`, and a
  local mock review-generation function — no network calls.
- Code submission view: paste into Monaco, or a GitHub file link (mocked import).
- Review results view: findings grouped into Style / Bugs / Security / Refactor
  Suggestions / Generated Tests, severity filter, copy-to-clipboard on generated tests.
- Quality dashboard: session review history, newest-first, per-category counts, source.
- Empty and failure states with `sonner` toasts.
- Responsive layout down to a 375px viewport.
- `.orchestrate/api-contract.yaml` describing the review endpoint(s) a future backend
  must implement.
- Unit tests (Vitest + React Testing Library) and e2e tests (Playwright) for every
  journey above.

Out of scope, per `.doc/product-definition.md`:
- Any account system — no signup, login, or auth of any kind.
- Real AI model integration — review results come from the mock data layer only.
- Real GitHub OAuth or live GitHub API calls.
- A `backend/` tree or database (this task is not marked `stack:full`).
- Multi-file or whole-repo analysis.
- Auto-applying suggested refactors or opening PRs.

## Assumptions
- This is the first frontend task: `frontend/` does not exist yet and must be scaffolded
  per the "Scaffold only if `frontend/` does not exist" section of
  `.claude/agents/frontend.md`.
- "Mock AI review" means a deterministic local function that inspects the submitted code
  (length, simple pattern checks) and returns a plausible, varied set of findings and
  generated tests — not a canned identical response every time, and not a real model call.
- No Linear ticket is wired for this ad hoc plan; this plan file is the task boundary for
  a single frontend implementation pass.

## Open Questions
- Q1: Should submitting a review simulate network latency (loading state) or resolve
  instantly?
  **Recommended:** simulate a short delay (~600–1000ms) via a `Promise`/`setTimeout` so
  the loading state is real and testable, matching how a real AI call would feel.
- Q2: Should findings vary based on the submitted code, or be a fixed canned response?
  **Recommended:** lightweight heuristics (e.g., flag `var`, `console.log`, long
  functions, obvious `==` vs `===`) so results feel connected to input, while staying a
  pure function of the input so tests stay deterministic.
- Q3: How strictly should the GitHub link be validated?
  **Recommended:** validate the shape with a regex
  (`github.com/{owner}/{repo}/blob/{branch}/{path}`) and reject anything else with a
  toast — AC2 requires rejecting invalid links.
- Q4: Should the app use client-side routing (e.g. `react-router`) for its three views, or
  switch views via in-memory state like the previous Instagram-skeleton app did?
  **Recommended:** introduce `react-router` with routes `/`, `/review/:id`, and
  `/dashboard` — real URLs make individual reviews linkable/testable, and Vite has no
  built-in router the way Next.js does.

Await answers/approval on these before implementation begins; recommended answers are
assumed if no correction arrives.

## Steps
1. **Scaffold `frontend/`** — Vite + React 19 + TS template; install `@mui/material`,
   `@emotion/react`, `@emotion/styled`, `@monaco-editor/react`, `lucide-react`, `sonner`,
   `react-router`. Configure Vitest (`vitest.config.ts`, jsdom, `globals: false`) and
   Playwright (`playwright.config.ts`, chromium, starts `npm run dev` on Vite's port).
2. **App shell** — `theme.ts` (`createTheme()`), `main.tsx` wraps the app in
   `<ThemeProvider>` and `<BrowserRouter>`, `App.tsx` renders routes and a top nav
   (`lucide-react` icons), a single `<Toaster />` from `sonner` mounted once.
3. **Types and mock data** — `types/review.ts` (`Review`, `Finding`, `GeneratedTest`,
   `ReviewSummary`, `ApiContract`); `mock/seed.ts` (`generateReview(input)`,
   `seedReviews`); `lib/helpers.ts` (`timeAgo`, `cls`, a GitHub-URL parser/validator).
4. **Code submission view** — Monaco editor for pasting code, a GitHub-link field with
   validation, submit action with loading state; on success calls `generateReview`,
   prepends to session history, and navigates to `/review/:id`; on an invalid GitHub
   link, shows a `sonner` error toast and does not navigate. (AC1, AC2)
5. **Review results view** — category-grouped findings (MUI `Accordion` or `Tabs`) with
   severity chips, file/line reference, description; a severity filter control; a
   Generated Tests section with a working copy-to-clipboard action; a deliberate empty
   state per category with zero findings. (AC3, AC4, AC5)
6. **Quality dashboard view** — session review history, newest-first, each row showing
   source, relative time, and per-category counts; a deliberate empty state when no
   reviews exist yet; clicking a row navigates to that review's results. (AC6)
7. **Responsive pass** — verify and fix all three views at a 375px-wide viewport, no
   horizontal scrolling. (AC8)
8. **API contract** — author `.orchestrate/api-contract.yaml` (OpenAPI 3.0): `POST
   /api/review` (submit code or a GitHub link, returns a `Review`), `GET /api/review`
   (list history) — consistent with the `ApiContract` type in `types/review.ts`.
9. **Tests** — unit tests per view in `frontend/tests/unit/` (submission validation and
   submit flow, results grouping/filtering/copy, dashboard list and empty state); e2e
   journeys in `frontend/tests/e2e/` (submit a snippet to results, invalid GitHub link
   shows a toast, filter by severity, dashboard shows history).
10. **Quality gates** — run `npx tsc --noEmit`, `npm test`, `npm run test:e2e`,
    `npm run lint`; fix the implementation (never the test) until all are green.

## Validation
- [ ] `cd frontend && npx tsc --noEmit` passes
- [ ] `cd frontend && npm test` passes (unit)
- [ ] `cd frontend && npm run test:e2e` passes (Playwright)
- [ ] `cd frontend && npm run lint` passes
- [ ] e2e: pasting code and submitting reaches the results view with findings grouped
  into all five categories (AC1, AC3)
- [ ] e2e: a valid GitHub link populates the editor with mocked file contents before the
  review runs (AC2)
- [ ] e2e: an invalid GitHub link shows a `sonner` toast and does not navigate (AC2, AC7)
- [ ] e2e: filtering by severity narrows the visible findings and count; clearing the
  filter restores the full list (AC4)
- [ ] e2e: the Generated Tests section shows at least one snippet per reviewed function
  with a working copy button (AC5)
- [ ] e2e: the dashboard lists reviews newest-first with source/time/counts, and shows
  an empty state with zero reviews (AC6, AC7)
- [ ] manual: submission, results, and dashboard views are usable at a 375px viewport
  with no horizontal scroll (AC8)
- [ ] `.orchestrate/api-contract.yaml` exists and documents the review endpoint(s),
  consistent with the `ApiContract` type

## Risks
- Monaco Editor's bundle size could slow first load in a Vite SPA — mitigate by
  lazy-loading the editor component (`React.lazy`).
- Mixing MUI components with `lucide-react` icons could read inconsistently if icon
  choices drift — mitigate by fixing one icon per concept up front, per
  `.claude/rules/ui-and-styling.md`.
- A non-deterministic mock review generator would make tests flaky — mitigate by keeping
  `generateReview` a pure function of its input, no unseeded randomness.
- Scope creep toward a real AI call or live GitHub fetch — explicitly excluded in Scope
  above; any task that needs them must go through `.doc/product-definition.md`'s Update
  Triggers first.

## Rollout Order
1. Scaffold, app shell, types/mock data (Steps 1–3) — no user-visible surface yet, but
   unblocks everything else.
2. Code submission view (Step 4).
3. Review results view, including severity filter and generated tests (Step 5).
4. Quality dashboard (Step 6).
5. Responsive pass, API contract, tests, and quality gates (Steps 7–10).

## Rollback
This introduces a new `frontend/` tree on a dedicated branch
(`feat/ai-code-reviewer-mvp`) with nothing deployed yet. Rollback is simply not merging
the branch, or `git revert` of the merge commit if it has already landed on `main`. There
is no backend state, database, or migration to unwind — all data is mock/in-memory.
