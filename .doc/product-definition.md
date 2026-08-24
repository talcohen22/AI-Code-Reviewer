# Product Definition

## Purpose
- Define shared product intent so planning, architecture, and delivery stay aligned.
- This file is the closest thing this repo has to a PRD. `dev-loop.js` feeds it to the
  Orchestrator for planning, and the QA agent checks delivered work against the
  acceptance criteria below.

## Product Vision
- A focused Instagram-style social app where people share a photo, react to each other's
  posts, and keep up with the accounts they follow — without the noise of ads, ranking,
  or algorithmic feeds.
- Current phase is a **frontend-only MVP**: every user journey works end to end against a
  local mock data layer, so the UI can be validated before any server exists.

## Target Users
- Primary users: casual photo sharers.
	- Who they are: people who post occasionally and mostly browse.
	- What they are trying to accomplish: post a photo with a caption, see what the
	  people they follow posted, and react without friction.
- Secondary users: the demo audience and reviewers.
	- Supporting roles and their core needs: read the code and the tests, and see that
	  each user journey is actually covered.

## Problem Statement
Mainstream photo-sharing apps have grown into attention machines — ranked feeds, ads, and
recommended content push the accounts a person actually chose to follow off the screen.
Someone who just wants to see their friends' photos in the order they were posted has no
simple option. Existing lightweight alternatives either lack the core interactions people
expect (like, comment, follow) or require account setup and hosting before anything can
be evaluated.

## Value Proposition
- Chronological feed only — what you follow is what you see, newest first.
- The interactions people actually use (like, comment, follow, notify) and nothing more.
- No ads, no recommendations, no ranking.

## Product Scope
- In scope (current phase, frontend-only):
	- Auth screens and simulated session (signup / login / logout) with route-guard UX.
	- Chronological feed of posts from mock data.
	- Post creation with local image preview and caption.
	- Like / unlike with optimistic UI state.
	- Comment list and add-comment.
	- Follow / unfollow with counter updates.
	- Profile view: avatar, bio, username, counters, post grid.
	- Notifications list (like / comment / follow) with read state.
	- Responsive layouts for mobile and desktop.
	- An API contract in `.orchestrate/api-contract.yaml` describing what a future
	  backend must implement.
- Out of scope (this phase):
	- Real backend, database, server auth or sessions.
	- Real media upload and storage.
	- Stories, reels, direct messages.
	- Ranking, recommendations, moderation automation.

## Acceptance Criteria
Each criterion must be provable by a test. The QA agent marks these PASS/FAIL per task.

- AC1 — Auth: a logged-out user attempting a guarded view is redirected to the auth view
  and told why; after login they land on the feed.
- AC2 — Feed: the feed renders posts strictly newest-first, and each post shows author
  avatar, username, image, caption, like count, comment count, and relative time.
- AC3 — Create post: submitting a caption with a locally previewed image adds that post to
  the top of the feed and increments the author's post count.
- AC4 — Like: liking toggles the filled state and adjusts the count by exactly one;
  unliking restores the previous state. Double interaction never double-counts.
- AC5 — Comment: adding a comment appends it to that post's comment list, increments the
  comment count, and clears the input.
- AC6 — Follow: following updates the button state and the target's follower count;
  unfollowing reverses both.
- AC7 — Notifications: the notifications view lists like/comment/follow events with the
  actor and relative time, and the unread badge reflects the unread count.
- AC8 — Empty and failure states: every list renders a deliberate empty state, and every
  rejected action surfaces a `sonner` toast rather than failing silently.
- AC9 — Responsive: all core views remain usable at a 375px-wide viewport with no
  horizontal scrolling.
- AC10 — Quality gates: `npx tsc --noEmit` is clean and the unit and e2e suites pass.

## Success Metrics
- Product metrics:
	- Every journey in Product Scope is covered by at least one e2e test.
	- All acceptance criteria above are PASS in the latest `.orchestrate/qa-report.md`.
- Quality metrics:
	- Zero TypeScript errors; zero failing tests on the mainline branch.
	- Lighthouse accessibility score >= 90 on the feed and profile views.

## Constraints and Assumptions
- Frontend stack is fixed for this phase: Next.js 16 App Router, React 19, TypeScript,
  Tailwind v4, `lucide-react`, `sonner`.
- All data is mock data (`frontend/src/mock/seed.ts`) held in React state; it is
  non-persistent and resets on reload. This is accepted for the phase.
- Contracts defined now must be implementable by a real backend later without reshaping
  the UI's types in `frontend/src/types/social.ts`.

## Prioritization Rules
- Prioritize work that most improves user outcomes and core metrics.
- Prefer changes that reduce operational complexity and support costs.
- Defer low-impact features unless required for launch readiness.

## Update Triggers
- Update this file when core user segments, product scope, acceptance criteria, or
  success metrics change.
