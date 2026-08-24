# Product Definition

## Purpose
- Define shared product intent so planning, architecture, and delivery stay aligned.
- This file is the closest thing this repo has to a PRD. `dev-loop.js` feeds it to the
  Orchestrator for planning, and the QA agent checks delivered work against the
  acceptance criteria below.

## Product Vision
- An AI Code Reviewer & Quality Dashboard: developers paste a code snippet or point at a
  GitHub file, and an AI agent reviews it for style issues, bugs, and security problems,
  suggests refactors, and generates tests — all in one pass, without wiring up CI.
- Current phase is a **frontend-only MVP**: every review journey works end to end against a
  mock AI-response layer, so the submission and results UX can be validated before any real
  AI backend exists.

## Target Users
- Primary users: individual developers reviewing their own code before opening a PR.
	- Who they are: engineers who want a fast second opinion on a snippet or a single file.
	- What they are trying to accomplish: paste or import code, get categorized findings and
	  suggested fixes, and generate tests without leaving the browser.
- Secondary users: engineering leads tracking review activity over time.
	- Supporting roles and their core needs: see a history of past reviews and how quality
	  trends across submissions, not just a one-off lint pass.
- No account system in this phase: there is no signup/login. Review history is scoped to
  the local session, not to a user identity.

## Problem Statement
Automated review tooling is either heavyweight — requiring CI integration, org-wide
installs, or a hosted repo — or narrow, catching lint violations but nothing about security
or missing tests. A developer who wants a quick, structured AI review of a snippet or a
single GitHub file (bugs, style, security, refactor ideas, and generated tests together) has
to stitch together several separate tools, or wait on a human reviewer for feedback a
machine could give in seconds.

## Value Proposition
- One submission in — paste code or a GitHub link — one structured review out: style, bugs,
  security, suggested refactors, and generated tests.
- Works on a snippet or a single file without requiring CI wiring or repo hosting.
- A quality dashboard tracks review history and trends, not just a single pass/fail lint run.

## Product Scope
- In scope (current phase, frontend-only):
	- Code submission view: a Monaco-based editor for pasting code, or a GitHub file link to
	  import (import is mocked in this phase — no live GitHub API calls).
	- Review results view: findings grouped by category — Style, Bugs, Security, Refactor
	  Suggestions, Generated Tests — each with severity, file/line reference, and description.
	- Severity filtering on the results view (critical / warning / info).
	- Generated tests displayed as copyable code blocks per reviewed function.
	- Quality dashboard: history of past reviews, newest-first, with per-category summary
	  counts and source (pasted snippet vs. GitHub link).
	- Responsive layouts for mobile and desktop.
	- An API contract in `.orchestrate/api-contract.yaml` describing what a future AI-analysis
	  backend must implement.
- Out of scope (this phase):
	- Any account system — signup, login, or auth of any kind.
	- Real AI model integration — review results come from the mock data layer.
	- Real GitHub OAuth and live repo/file fetching.
	- Real backend or database.
	- Multi-file or whole-repo analysis (snippet or single file only).
	- Auto-applying suggested refactors or opening PRs on the user's behalf.

## Acceptance Criteria
Each criterion must be provable by a test. The QA agent marks these PASS/FAIL per task.

- AC1 — Submit a snippet: pasting code into the editor and submitting runs a (mocked) review
  and navigates to the results view for that submission.
- AC2 — Import from GitHub: submitting a valid GitHub file link populates the editor with
  that file's (mocked) contents before the review runs; an invalid link is rejected with a
  toast and no navigation.
- AC3 — Review results: the results view groups findings into Style / Bugs / Security /
  Refactor Suggestions / Generated Tests, and each finding shows severity, a file/line
  reference, and a description.
- AC4 — Severity filter: filtering by severity shows only matching findings and updates the
  visible count; clearing the filter restores the full list.
- AC5 — Generated tests: the Generated Tests section shows at least one test snippet per
  reviewed function, with a working copy-to-clipboard action.
- AC6 — Dashboard: the quality dashboard lists past reviews from this session newest-first,
  each showing source, relative time, and a per-category finding count.
- AC7 — Empty and failure states: every list renders a deliberate empty state, and every
  rejected action surfaces a `sonner` toast rather than failing silently.
- AC8 — Responsive: all core views remain usable at a 375px-wide viewport with no
  horizontal scrolling.
- AC9 — Quality gates: `npx tsc --noEmit` is clean and the unit and e2e suites pass.

## Success Metrics
- Product metrics:
	- Every journey in Product Scope is covered by at least one e2e test.
	- All acceptance criteria above are PASS in the latest `.orchestrate/qa-report.md`.
- Quality metrics:
	- Zero TypeScript errors; zero failing tests on the mainline branch.
	- Lighthouse accessibility score >= 90 on the submission and results views.

## Constraints and Assumptions
- Frontend stack is fixed for this phase: React 19 (Vite) + TypeScript, MUI
  (`@mui/material`), `lucide-react`, `sonner`, and Monaco Editor
  (`@monaco-editor/react`) for the code input/display surface.
- All data is mock data (`frontend/src/mock/seed.ts`) held in React state; it is
  non-persistent and resets on reload. This is accepted for the phase.
- Contracts defined now (review request/response shape) must be implementable by a real
  AI-analysis backend later without reshaping the UI's types in
  `frontend/src/types/review.ts`.
- GitHub OAuth and live GitHub API integration stay out of scope until a backlog task
  explicitly opts into `stack:full` and adds them to scope.

## Prioritization Rules
- Prioritize work that most improves user outcomes and core metrics.
- Prefer changes that reduce operational complexity and support costs.
- Defer low-impact features unless required for launch readiness.

## Update Triggers
- Update this file when core user segments, product scope, acceptance criteria, or
  success metrics change.
