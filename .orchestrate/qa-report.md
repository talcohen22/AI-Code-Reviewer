Hopa! QA verification of the profile page is complete.

## Result: PASS, with 2 non-blocking findings

**Gates** — `tsc --noEmit` clean · `eslint` clean · unit **35/35** · e2e **14/14** · backend N/A (no `backend/` directory, frontend-only task).

**The gap I found in the delivered suite:** the plan's Validation section claimed AC1 and AC3, but **no test in either suite actually exercised them**. The frontend agent's 23 unit / 9 e2e tests covered the happy paths well, but AC1 (profile route guarded when logged out) was untested entirely, and AC3 was only proven *at rest* — the counter derived correctly from the posts array, but nothing proved publishing a post actually moved it.

I added 17 tests (`profile-adversarial.test.tsx`, `profile-adversarial.spec.ts`). All ACs now pass on evidence:
- **AC1** — logged out → Profile lands on auth with the toast, no profile chrome leaks; logging back in restores access.
- **AC3** — counter goes 4 → 5 on publish, and the grid is re-counted at 5 tiles so the number can't drift from what it summarises. Empty submission toasts and creates no phantom post.
- **AC6** — three rapid clicks net exactly one toggle, four net zero, real-browser `dblclick` nets zero. No double-counting.
- **AC8/AC9** — Tagged state doesn't persist across subject switches; the *other user's* profile (extra back arrow + Follow button + four-digit count) also clears 375px with no overflow.
- Also verified: grid is strictly newest-first, another user's profile leaks no posts from other users, and the seed reconciliation is genuinely consistent (4/1/1 both ways).

**Two real defects, reported not fixed:**

1. **`instagram-app.tsx:93` — one follow click raises two toasts.** `toast.success()` is called *inside* the `setAllUser` functional updater, so StrictMode double-invokes it. Measured directly: toast count = **2**, expected 1. Pre-existing code, but this ticket promoted `onFollow` to the profile's primary action, so it's now on the critical path. Fix: compute next state and toast outside the updater.

2. **`profile-header.tsx:96` — emails in a bio render as blue @mentions.** The mention regex is unanchored and allows `.`, so "noah@example.com" styles `@example.com` as a handle. Cosmetic, no seeded bio triggers it, low severity.

I also flagged a latent one: the profile branch renders a silently blank panel if `profileUserId` doesn't resolve — unreachable today, but the API contract already specifies a `404` for `GET /user/{username}`, so it becomes a live AC8 gap when the profile goes API-backed.

The Figma divergences (story highlights, video badge, lock icon, Tagged data) are all confirmed as deliberate and traced to approved plan decisions Q2–Q5 / D5 — they read as decisions, not misses.

Report written to `.orchestrate/qa-report.md`. No feature source was modified.

STATUS: DONE