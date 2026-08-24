# Instagram Clone MVP Plan

Status: active  
Owner: Copilot  
Last updated: 2026-07-01

## Goal
- Deliver a frontend-only Instagram-like MVP that demonstrates all key user journeys with realistic mocked data and interaction states.
- Produce a polished, responsive UI baseline that can be connected to real backend APIs in a later phase with minimal refactoring.

## Scope
- In scope (frontend-only MVP):
  - Authentication screens and flows (signup/login/logout) as UI-only interactions.
  - Profile UI (avatar, bio, username, edit profile modal/page).
  - Create post UI (image picker placeholder + caption) with mocked submission flow.
  - Feed UI (reverse chronological) populated from local mock data.
  - Like/unlike interactions with optimistic frontend state.
  - Comment list and add-comment UI with local state updates.
  - Follow/unfollow interactions and counter updates in UI state.
  - Notifications UI (like/comment/follow entries) from mocked data.
  - Responsive web UI for mobile and desktop.
  - Defined API contract stubs/types for future backend integration.
- Out of scope (this phase):
  - Real backend APIs, database migrations, server auth/session management.
  - Real media upload/storage integration.
  - Stories, reels/video pipeline, direct messages.
  - Advanced recommendation/ranking.
  - Complex moderation automation.

## Assumptions
- Primary repo runtime remains Node.js-based and can host a modern web frontend.
- Frontend can use local JSON/mock modules and in-memory state for all feature flows.
- Team accepts that data is non-persistent in this phase.
- Team accepts shipping chronological feed UI before ranking logic.
- API contracts can be defined now and implemented server-side later.

## Open Questions
- Q1: Which frontend framework should be used for this phase?
  - Recommended: Next.js + TypeScript + Tailwind for fast iteration and future full-stack compatibility.
- Q2: Should mock data be static files only or include seeded fake-data generators?
  - Recommended: Static fixture files plus a lightweight seed helper for variability.
- Q3: Should we keep route guards in UI even without backend auth?
  - Recommended: Yes, simulate route guards to preserve final UX behavior.
- Q4: Should media upload use real local file preview in this phase?
  - Recommended: Yes, local preview only, no remote upload.
- Q5: Should private account UX be included as disabled/coming soon?
  - Recommended: No, omit to avoid fake complexity.

## Decisions
- D1 (Q1): Next.js + TypeScript + Tailwind.
- D2 (Q2): Static fixture files plus lightweight seed helper.
- D3 (Q3): Keep simulated route guards in UI.
- D4 (Q4): Support local file preview only.
- D5 (Q5): Omit private-account UX in this phase.

## Steps
1. Product and UX framing
   - Finalize MVP acceptance criteria and user journeys in .doc/product-definition.md.
   - Define page map: auth, home feed, profile, post detail, notifications.
2. Project foundation
  - Scaffold app structure, shared UI components, and state layer.
  - Configure linting, formatting, and CI baseline.
3. Contract-first data layer
  - Define TypeScript domain models and API response/request contracts.
  - Create mock repositories/services that match future API signatures.
4. Auth and account UX
  - Implement sign-up/login/logout screens and simulated session state.
  - Add route guard UX and profile edit interactions.
5. Media and post creation UX
  - Implement local image selection and preview.
  - Implement create-post flow with mocked submit states (idle/loading/success/error).
6. Feed and interaction UX
  - Build chronological feed from mock data with cursor-like pagination UI.
  - Implement like/unlike and comment add/list in local state.
7. Follow and profile UX
  - Implement follow/unfollow and local counter updates.
  - Render profile grid and post detail screens.
8. Notifications UX
  - Render notifications list from mocked events.
  - Implement mark-as-read state transitions in frontend.
9. Quality and hardening
  - Add component tests and e2e tests for key user journeys.
  - Add accessibility pass for forms, dialogs, focus states, and keyboard navigation.
10. Integration readiness
  - Document API contract mapping and replacement points from mock services to real APIs.
  - Publish handoff notes for backend phase.

## Validation
- Functional acceptance:
  - User can complete signup/login/logout UI flows.
  - User can create a post with local image preview and see it appear in feed/profile state.
  - User can follow/unfollow, like/unlike, and comment with immediate UI updates.
  - User can view and mark notifications as read in UI state.
- Non-functional:
  - Mobile viewport layouts remain usable for key flows.
  - Lighthouse accessibility score target >= 90 on core pages.
  - Core pages load without blocking errors and maintain smooth interaction on mid-range devices.
- Test suite:
  - Unit/component tests for state transitions and interaction handlers.
  - Contract tests to ensure mock service payloads match declared API types.
  - E2E tests for signup -> post -> follow -> like -> comment flow.

## Risks
- Mock behavior can diverge from real backend behavior if contracts are not enforced.
- Over-investment in fake data flows can create rework during API integration.
- Simulated auth may hide real-world session and permission edge cases.
- Image handling differences between browsers can affect preview UX.
- Scope creep from non-MVP requests (stories, DMs, reels) may delay ship date.

## Rollout Order
1. Internal prototype review (design + product signoff).
2. Frontend beta preview (stakeholders validate user journeys).
3. Frontend MVP merge and deployment.
4. Backend integration phase kickoff using defined contracts.

## Rollback
- Keep previous stable frontend deployment artifact for immediate redeploy.
- Use feature flags to disable unstable UI modules (post creation, notifications) independently.
- Revert to static demo-only mode if critical runtime issues appear.

## Approval Gate
- Approved and in execution.