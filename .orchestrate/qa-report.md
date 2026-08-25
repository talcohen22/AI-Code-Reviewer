=== QA REPORT ===
Ticket: none (ad hoc) — .plan/001-2026-08-24-ai-code-reviewer-mvp.md, Steps 1–10
Scope: frontend-only (no `backend/` tree, task not marked `stack:full`)
Branch: feat/ai-code-reviewer-mvp
Verdict: **FAIL** — one blocking defect (AC8). Eight of nine criteria pass.

Static:      tsc clean (exit 0) · lint clean (oxlint, 0 warnings 0 errors)
Unit:        71 passed, 0 failed  (48 delivered + 23 added by QA; stable over 4 consecutive runs)
E2E:         13 passed, 1 failed  (10 delivered + 4 added by QA; the failure is the AC8 regression below)
Backend:     not applicable, frontend-only task

Commands run (all from `frontend/`):
  npx tsc --noEmit          → exit 0
  npm run lint              → exit 0
  npm test                  → 6 files, 71 tests, 0 failures
  npm run test:e2e          → 14 tests, 1 failure (tests/e2e/qa-adversarial.spec.ts:40)

---

## Acceptance criteria

- **AC1 — Submit a snippet** — PASS
  e2e `review-journey.spec.ts:9 "reviews a pasted snippet and groups the findings by category"` — ok (4.4s).
  unit `code-submission-view.test.tsx:33 "reviews a pasted snippet and lands on its results"` — passed.
  Verified independently: pasting into Monaco and pressing "Run review" navigates to `/review/:id` and
  renders the results heading. A single click produces exactly one review at every latency
  (0ms / 120ms / 700ms) — `runReview` call count instrumented at 1 in each case.

- **AC2 — Import from GitHub** — PASS
  e2e `review-journey.spec.ts:26 "imports a GitHub file into the editor before reviewing it"` — ok (4.7s):
  the editor is populated *before* the review runs.
  e2e `review-journey.spec.ts:39 "rejects an invalid GitHub link with a toast and stays put"` — ok (1.5s).
  QA adversarial `qa-adversarial.test.tsx "adversarial: GitHub link validation"` — 10 hostile links all
  rejected, including a look-alike subdomain (`github.com.evil.example/...`), `github.com` embedded in
  another host's path, a host merely *ending* in `github.com`, a `javascript:` scheme, an embedded
  newline, a `raw.githubusercontent.com` link, and links carrying `?plain=1` / `#L4`.
  QA adversarial: a rejected import leaves previously pasted code intact and does not navigate; a valid
  re-import replaces the buffer and retargets the language (`.py` → `python`).

- **AC3 — Review results** — PASS
  unit `review-result-view.test.tsx:39 "groups findings into all five categories"` — passed (Style, Bugs,
  Security, Refactor Suggestions, Generated Tests, each heading carrying its count).
  unit `review-result-view.test.tsx:48` — passed: severity chip ("Critical"), file/line reference
  ("snippet.ts:9") and description all render per finding.
  QA adversarial e2e `qa-adversarial.spec.ts:81 "the results view of a review with no findings is not a
  blank screen"` — ok: a snippet that trips no rule renders "Showing 0 of 0 findings" plus a worded empty
  state in each of the four finding categories, and still produces its generated test. The frontend
  agent's callout is confirmed as intended behaviour, not a broken view.

- **AC4 — Severity filter** — PASS
  e2e `review-journey.spec.ts:57 "filters findings by severity and restores the full list"` — ok (5.6s).
  unit `review-result-view.test.tsx:60` and `:79` — narrowing and clearing both pass.
  QA adversarial: six rapid consecutive filter switches (Critical→Warning→Info→Critical→All→Critical)
  land on a consistent count and only Critical chips remain visible; a category with no findings at the
  selected severity says so rather than going blank; generated tests stay visible under every filter.

- **AC5 — Generated tests** — PASS (with a boundary caveat, see Finding 2)
  e2e `review-journey.spec.ts:81 "shows a generated test per function with a working copy button"` — ok
  (4.0s); clipboard content asserted to contain `describe("loadUser"`.
  unit `review-result-view.test.tsx:94` — passed.
  QA adversarial: repeated copy clicks write the snippet **byte-for-byte identical** to
  `review.generatedTest[0].code` on every click (2/2 writes verified against the source string), and a
  clipboard rejection surfaces a toast rather than failing silently.

- **AC6 — Dashboard** — PASS
  e2e `quality-dashboard.spec.ts:13 "lists this session's reviews newest first with source, time and
  counts"` — ok (6.1s).
  unit `quality-dashboard-view.test.tsx:20`, `:31`, `:49` — ordering, per-row source/relative-time/
  per-category counts, and row-click navigation all pass.
  QA adversarial: the view sorts defensively — seeded oldest-first, it still renders newest-first
  (`newer.ts` above `older.ts`), so it does not trust the array order it is handed.

- **AC7 — Empty and failure states** — PASS
  Dashboard empty state is genuinely reachable in the running app, as claimed: `main.tsx` renders
  `<CodeReviewerApp />` with no `initialReview`, which defaults to `[]` in
  `review-store-provider.tsx:12`. `seedReview` is imported nowhere (see Finding 3).
  e2e `quality-dashboard.spec.ts:5 "shows an empty state before any review has run"` — ok: a fresh
  `/dashboard` renders a deliberate "No reviews yet" card with a "Start a review" action — not a blank
  screen.
  Every list has an empty state: dashboard, each of the four finding categories, generated tests, and an
  unknown review id (`/review/rv-not-a-real-review-000` → "That review is not in this session", verified
  in both unit and e2e).
  Failure paths all toast: empty editor, whitespace-only editor (`"   \n\n\t  \n"`), over-length snippet,
  invalid GitHub link, failed clipboard write.
  Boundary verified: a snippet of exactly 20,000 characters is accepted; 20,001 is rejected with the
  "Trim it to 20,000" toast and no navigation.

- **AC8 — Responsive at 375px** — **FAIL**
  The delivered `responsive.spec.ts` passes, but only because its sample uses short identifiers
  (`loadUser`, `saveUser`). A realistic long function name bursts the layout — see Finding 1.
  Failing evidence: e2e `qa-adversarial.spec.ts:40 "a long function name does not burst the 375px
  layout"` — **failed**: `document.documentElement.scrollWidth` = 534 against `clientWidth` = 375 on the
  results view.
  Passing at 375px: submission view, dashboard, dashboard empty state, unknown-review empty state, a
  400-character single code line (the `<pre>` scrolls inside its own box correctly), and filtering.

- **AC9 — Quality gates** — PASS (for the delivered suite)
  `npx tsc --noEmit` exit 0 · `npm run lint` exit 0 · unit 71/71 · delivered e2e 10/10.
  Note: `npm run test:e2e` now reports 1 failure — that is the AC8 regression test added by QA, which is
  expected to fail until Finding 1 is fixed. No delivered test fails.

---

## Findings

1. **BLOCKER (AC8) — `frontend/src/components/generated-test-card.tsx:45`** — a long function name
   overflows the document at a 375px viewport.
   Expected: `documentElement.scrollWidth` <= 375. Actual: **534**.
   Repro: paste `export function calculateQuarterlyRevenueProjectionForEnterpriseAccount(input) { return input }`
   and run the review; the results view scrolls horizontally.
   Also reachable through the GitHub path — importing
   `.../blob/main/src/deeply/nested/directory/structure/a-very-long-unbroken-file-name-for-layout.ts`
   overflows the results view to **402** (the derived identifier flows into the same card header).
   Root cause: the function-name `<Typography variant="subtitle1" sx={{ fontWeight: 600, fontFamily:
   monoFontFamily }}>` at line 45 sets no word-breaking, and the `<Stack>` wrapping it at lines 39–44 has
   no `minWidth: 0`, so the unbroken token forces its flex row wider than the container. Measured
   element: `H6.MuiTypography-subtitle1`, `right=402`, `width=352` inside a 375px client.
   The two sibling surfaces that render the same kind of token already do this correctly and do **not**
   overflow — `review-result-view.tsx:81` and `quality-dashboard-view.tsx:119` both set
   `wordBreak: "break-all"`. Suggested fix: match them — add `wordBreak: "break-all"` (or
   `overflowWrap: "anywhere"`) to the Typography `sx`, and `minWidth: 0` to the wrapping Stack.
   Regression test is committed and currently red: `frontend/tests/e2e/qa-adversarial.spec.ts:40`.
   Not applied by QA — feature source is out of bounds for this agent.

2. **MINOR (AC5) — `frontend/src/mock/seed.ts:185`** — `MAX_GENERATED_TEST = 6` silently caps generated
   tests. A snippet declaring 8 functions detects all 8 (`detectFunction` returns 8) but produces only 6
   generated tests, so functions 7 and 8 get none. AC5 reads "at least one test snippet per reviewed
   function", so the literal criterion is not met past six functions.
   Expected 8, actual 6. Repro: `generateReview` over eight `export function fnN(a) { return a }`
   declarations.
   Not marked a FAIL because the cap is a deliberate design choice and the criterion holds for every
   realistic single-file snippet — but it needs either a product decision (amend AC5 / the product
   definition) or a UI disclosure on the results view ("showing 6 of 8"). Routing to the orchestrator.

3. **MINOR — `frontend/src/mock/seed.ts:433`** — `seedReview` is exported but imported nowhere in
   `frontend/src/**` or `frontend/tests/**`. The frontend agent's report states "seedReview in
   src/mock/seed.ts exists for tests/demos" — the tests in fact seed from
   `frontend/tests/unit/helper/fixture.ts`. The claim about the *running app* is correct and is what
   makes the AC7 empty state reachable; the claim about tests is not. Either wire it into a demo path or
   drop the dead export.

4. **DOCS — `.claude/rules/ui-and-styling.md`** — confirms the frontend agent's conflict callout. The
   rules file mandates Tailwind CSS v4 with a single `globals.css`, while `.doc/product-definition.md`
   (Constraints), the plan, and `.claude/agents/frontend.md` all fix the stack as MUI. The delivered code
   follows the plan (MUI + `sx`, no `.css` files, no inline `style` props), which is the right call, but
   the rules file should be reconciled before the next frontend task. Out of QA's write scope.

Watch item (low confidence, not a finding): one `npm test` run showed 3 failures across 2 files while a
QA test with a real timer was in the file; not reproducible in the 4 runs since, and that test has been
rewritten to use a spy instead of racing the navigation. Worth a second look if CI ever flakes here.

---

## Tests added by QA

- `frontend/tests/unit/qa-adversarial.test.tsx` — 23 tests: hostile GitHub links, size-limit boundary
  (20,000 / 20,001), whitespace-only input, the in-flight double-submit guard, a review that trips no
  rule, rapid filter switching, byte-exact clipboard content, defensive dashboard ordering.
- `frontend/tests/e2e/qa-adversarial.spec.ts` — 4 tests at 375px: the long-function-name overflow
  regression (**red**, Finding 1), a 400-character code line, a finding-free results view, and an
  unknown review URL.

No feature source was modified.

STATUS: DONE
