# AI Code Reviewer — frontend

Vite + React 19 + TypeScript + MUI. Frontend-only: every review journey runs against the
mock AI layer in `src/mock/seed.ts`, so there is no backend and no account system in this
phase. See `.doc/product-definition.md` for the acceptance criteria and
`.orchestrate/api-contract.yaml` for the API a future backend must implement.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on http://localhost:5173 |
| `npm run build` | Typecheck, then build to `dist/` |
| `npm run typecheck` | `tsc --noEmit` over `src` and `tests` |
| `npm run lint` | oxlint |
| `npm test` | Vitest + React Testing Library (`tests/unit/`) |
| `npm run test:e2e` | Playwright, chromium (`tests/e2e/`) — starts the dev server itself |

## Layout

- `src/components/code-reviewer-app.tsx` — session state, routes, nav, the single `<Toaster />`
- `src/components/code-submission-view.tsx` — paste or import, then run a review (`/`)
- `src/components/review-result-view.tsx` — grouped findings, severity filter, generated tests (`/review/:id`)
- `src/components/quality-dashboard-view.tsx` — session review history (`/dashboard`)
- `src/mock/seed.ts` — `generateReview` / `runReview` / `mockGithubFile`, plus `seedReview` demo history
- `src/types/review.ts` — the domain types the API contract mirrors
- `src/state/review-store.ts` — session-scoped history, in memory, reset on reload

`generateReview` is a pure function of its input, which is what keeps both suites
deterministic. Do not introduce unseeded randomness there.

## Env

- `VITE_REVIEW_LATENCY_MS` — how long a mock review takes, in ms (default `700`).
